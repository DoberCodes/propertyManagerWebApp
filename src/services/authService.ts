import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User as FirebaseUser,
	updateProfile,
	sendPasswordResetEmail,
	fetchSignInMethodsForEmail,
} from 'firebase/auth';
import {
	collection,
	query,
	where,
	getDocs,
	updateDoc,
	doc,
	getDoc,
	setDoc,
	addDoc,
	serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../config/firebase';
import { clearUserLocalStorage } from '../utils/localStorageCleanup';
import { User } from '../Redux/Slices/userSlice';
import { USER_ROLES } from '../constants/roles';
import { createTrialSubscription } from '../utils/subscriptionUtils';
import {
	SUBSCRIPTION_STATUS,
	TRIAL_DURATION_DAYS,
} from '../constants/subscriptions';
import { STRIPE_PLANS } from '../constants/stripe';
import { createLegalAgreementDocuments } from '../constants/legal';
import { createCheckoutSession } from './stripeService';

export interface FamilyInvite {
	id: string;
	accountId: string;
	email: string;
	firstName: string;
	lastName: string;
	role?: string;
	status: 'pending' | 'accepted' | 'revoked' | 'expired';
	createdAt: string | number;
	updatedAt?: string | number;
	expiresAt?: string | number;
	lastSentAt?: string | number;
	sentCount?: number;
}

const serializeFirestoreValue = (value: unknown): unknown => {
	if (value === null || value === undefined) return value;

	if (Array.isArray(value)) {
		return value.map((item) => serializeFirestoreValue(item));
	}

	if (typeof value === 'object') {
		if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
			return ((value as { toDate: () => Date }).toDate() as Date).toISOString();
		}

		const serializedObject: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(
			value as Record<string, unknown>,
		)) {
			serializedObject[key] = serializeFirestoreValue(nestedValue);
		}
		return serializedObject;
	}

	return value;
};

const isBlockedByClientError = (error: any): boolean => {
	const rawMessage = String(error?.message || '').toLowerCase();
	const rawCode = String(error?.code || '').toLowerCase();

	return (
		rawMessage.includes('err_blocked_by_client') ||
		rawMessage.includes('blocked by client') ||
		rawMessage.includes('firestore.googleapis.com') ||
		rawMessage.includes('/listen/channel') ||
		rawCode.includes('err_blocked_by_client')
	);
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
	email: string,
	password: string,
): Promise<User> => {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password,
		);

		try {
			const syncTenantAccess = httpsCallable<
				Record<string, never>,
				{ success: boolean }
			>(functions, 'syncTenantAccessFromInvites');
			await syncTenantAccess({});
		} catch (tenantSyncError) {
			console.warn('Tenant access sync skipped:', tenantSyncError);
		}

		const user = await getUserProfile(userCredential.user.uid);
		return user;
	} catch (error: any) {
		console.error('Sign in error:', error);
		if (isBlockedByClientError(error)) {
			throw new Error(
				'Your browser blocked required login requests. Please disable ad/privacy blockers for this site (and firestore.googleapis.com), then try again.',
			);
		}
		throw new Error(getAuthErrorMessage(error?.code));
	}
};

/**
 * Check if an email address is already registered
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
	try {
		// Check if email exists in Firebase Auth
		const signInMethods = await fetchSignInMethodsForEmail(auth, email);
		if (signInMethods.length > 0) {
			return true;
		}

		// Also check Firestore users collection as backup
		const q = query(
			collection(db, 'users'),
			where('email', '==', email.toLowerCase().trim()),
		);
		const snapshot = await getDocs(q);
		return !snapshot.empty;
	} catch (error: any) {
		// If there's an error (e.g., network issue), assume email doesn't exist
		// to not block registration unnecessarily
		console.warn('Error checking email existence:', error);
		return false;
	}
};

const findActiveTenantPromoCode = async (promoCode: string, email: string) => {
	const validateInvite = httpsCallable<
		{ promoCode: string; tenantEmail: string },
		{ valid: boolean }
	>(functions, 'validateTenantInvitationCode');
	const result = await validateInvite({
		promoCode,
		tenantEmail: email,
	});
	return result.data.valid ? { valid: true } : null;
};

const findActiveTeamMemberPromoCode = async (promoCode: string, email: string) => {
	const validateInvite = httpsCallable<
		{ promoCode: string; teamMemberEmail: string },
		{
			valid: boolean;
			teamMemberId?: string | null;
			accountId?: string | null;
			role?: string | null;
		}
	>(functions, 'validateTeamMemberInvitationCode');

	const result = await validateInvite({
		promoCode,
		teamMemberEmail: email,
	});

	return result.data.valid ? result.data : null;
};

export const validateTenantInviteForRegistration = async (
	promoCode: string,
	email: string,
): Promise<boolean> => {
	if (!promoCode?.trim() || !email?.trim()) {
		return false;
	}

	try {
		const promoDoc = await findActiveTenantPromoCode(
			promoCode.trim(),
			email.trim().toLowerCase(),
		);
		return !!promoDoc;
	} catch (error) {
		console.error('Tenant invite validation failed:', error);
		return false;
	}
};

export const validateTeamInviteForRegistration = async (
	promoCode: string,
	email: string,
): Promise<{ valid: boolean; role?: string | null }> => {
	if (!promoCode?.trim() || !email?.trim()) {
		return { valid: false };
	}

	try {
		const inviteDoc = await findActiveTeamMemberPromoCode(
			promoCode.trim(),
			email.trim().toLowerCase(),
		);

		if (!inviteDoc) {
			return { valid: false };
		}

		return {
			valid: true,
			role: inviteDoc.role || null,
		};
	} catch (error) {
		console.error('Team invite validation failed:', error);
		return { valid: false };
	}
};

/**
 * Create subscription for new user - local trial for all users
 */
const getPriceIdForPlan = (planId: string): string => {
	const priceMap: Record<string, string> = {
		free: STRIPE_PLANS.FREE,
		guest: STRIPE_PLANS.FREE, // Guests use free plan (no charge)
		tenant: STRIPE_PLANS.FREE, // Tenants use free plan (no charge)
		homeowner: STRIPE_PLANS.HOMEOWNER,
		basic: STRIPE_PLANS.BASIC,
		professional: STRIPE_PLANS.PROFESSIONAL,
	};
	return priceMap[planId] || '';
};

const createPendingCheckoutSubscription = (
	selectedPlan: string,
	promoCode?: string,
) => {
	const now = Math.floor(Date.now() / 1000);
	const normalizedPromoCode = promoCode?.trim() || undefined;

	return {
		status: SUBSCRIPTION_STATUS.CANCELLED,
		plan: selectedPlan,
		currentPeriodStart: now,
		currentPeriodEnd: now,
		...(normalizedPromoCode ? { promoCode: normalizedPromoCode } : {}),
	};
};

type CreateUserSubscriptionResult = {
	subscription: NonNullable<User['subscription']> & {
		promoCode?: string;
	};
	checkoutUrl?: string;
};

const createUserSubscription = async (
	selectedPlan: string,
	promoCode: string | undefined,
	userId: string,
	email: string,
) : Promise<CreateUserSubscriptionResult> => {
	const normalizedPromoCode = promoCode?.trim() || undefined;
	const normalizedPlan = String(selectedPlan || '')
		.trim()
		.toLowerCase();

	const isNonBillablePlan = ['free', 'guest', 'tenant'].includes(normalizedPlan);

	if (isNonBillablePlan) {
		const localSubscription = createTrialSubscription(selectedPlan, promoCode);
		return {
			subscription: {
				...localSubscription,
				...(normalizedPromoCode ? { promoCode: normalizedPromoCode } : {}),
			},
		};
	}

	if (normalizedPromoCode) {
		const priceId = getPriceIdForPlan(selectedPlan);
		if (!priceId) {
			throw new Error(`No price ID found for plan: ${selectedPlan}`);
		}

		const checkoutUrl = await createCheckoutSession(
			priceId,
			userId,
			email,
			undefined,
			normalizedPromoCode,
			selectedPlan,
		);

		return {
			subscription: createPendingCheckoutSubscription(
				selectedPlan,
				normalizedPromoCode,
			),
			checkoutUrl,
		};
	}

	// Create Stripe trial subscription for all plans (Stripe is source of truth)
	try {
		const createTrial = httpsCallable(functions, 'createTrialSubscription');
		const result = await createTrial({
			planId: selectedPlan,
			promoCode: normalizedPromoCode,
			userId,
			email,
			trialDays: TRIAL_DURATION_DAYS,
		});

		const data = result.data as {
			subscriptionId: string;
			customerId: string;
			status: string;
			trialEnd: number;
		};

		// Return subscription data that matches our local format
		const now = Math.floor(Date.now() / 1000);
		return {
			subscription: {
				status: SUBSCRIPTION_STATUS.TRIAL,
				plan: selectedPlan,
				currentPeriodStart: now,
				currentPeriodEnd: data.trialEnd,
				trialEndsAt: data.trialEnd,
				stripeCustomerId: data.customerId,
				stripeSubscriptionId: data.subscriptionId,
				...(normalizedPromoCode ? { promoCode: normalizedPromoCode } : {}),
			},
		};
	} catch (error: any) {
		console.error('Failed to create Stripe trial subscription:', error);
		throw new Error(
			error?.message ||
				'Stripe trial setup failed. Verify Stripe plan IDs and key mode configuration.',
		);
	}
};

/**
 * Create new user account
 */
export const signUpWithEmail = async (
	email: string,
	password: string,
	firstName: string,
	lastName: string,
	role: string = USER_ROLES.ADMIN,
	selectedPlan: string = 'homeowner',
	promoCode?: string,
	legalAgreement?: {
		agreedToTerms: boolean;
		agreedVersion: string;
		documents?: {
			termsOfService?: {
				accepted: boolean;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			privacyPolicy?: {
				accepted: boolean;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			maintenanceDisclaimer?: {
				accepted: boolean;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			subscriptionTerms?: {
				accepted: boolean;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			eula?: {
				accepted: boolean;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
		};
	},
	inviteType?: 'tenant' | 'team',
): Promise<{ user: User; checkoutUrl?: string }> => {
	try {
		let shouldRedeemTenantInvite = false;
		let shouldRedeemTeamInvite = false;
		let resolvedRole = role;

		// Handle tenant invite registration (requires promo code)
		if (inviteType === 'tenant') {
			if (!promoCode?.trim()) {
				throw new Error('Tenant promo code is required');
			}
			const promoDoc = await findActiveTenantPromoCode(promoCode, email);
			if (!promoDoc) {
				throw new Error('Invalid or expired tenant promo code');
			}
			shouldRedeemTenantInvite = true;
		}

		// Handle team member invite registration (requires promo code)
		if (inviteType === 'team') {
			if (!promoCode?.trim()) {
				throw new Error('Team invitation code is required');
			}
			const inviteDoc = await findActiveTeamMemberPromoCode(promoCode, email);
			if (!inviteDoc) {
				throw new Error('Invalid or expired team member invitation code');
			}
			if (inviteDoc.role) {
				resolvedRole = inviteDoc.role;
			}
			shouldRedeemTeamInvite = true;
		}

		// For property guests, use a special "guest" plan
		if (resolvedRole === USER_ROLES.PROPERTY_GUEST) {
			selectedPlan = 'guest';
		}

		// For tenants, use a special "tenant" plan
		if (resolvedRole === USER_ROLES.TENANT) {
			selectedPlan = 'tenant';
		}

		if (inviteType === 'team') {
			selectedPlan = 'free';
		}

		// Create Firebase Auth user
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password,
		);

		// Update display name in Firebase Auth
		await updateProfile(userCredential.user, {
			displayName: `${firstName} ${lastName}`,
		});

		// Create user profile in Firestore
		const userProfile: User = {
			id: userCredential.user.uid,
			firstName,
			lastName,
			email,
			role: resolvedRole as any,
			title: getRoleTitleFromRole(resolvedRole),
			image: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=22c55e&color=fff`,
			accountId: userCredential.user.uid, // New users are account owners
			isAccountOwner: true,
		};

		const normalizedPlan = String(selectedPlan || '')
			.trim()
			.toLowerCase();
		const shouldSkipTrialForPromoCheckout =
			!!promoCode?.trim() && !['free', 'guest', 'tenant'].includes(normalizedPlan);
		const provisionalSubscription = shouldSkipTrialForPromoCheckout
			? createPendingCheckoutSubscription(selectedPlan, promoCode)
			: createTrialSubscription(selectedPlan, promoCode);

		// Prepare legal agreement data
		const agreedAt = new Date().toISOString();
		const legalDocuments = legalAgreement
			? legalAgreement.documents
				? {
						termsOfService: legalAgreement.documents.termsOfService
							? {
									...legalAgreement.documents.termsOfService,
									agreedAt,
							  }
							: undefined,
						privacyPolicy: legalAgreement.documents.privacyPolicy
							? {
									...legalAgreement.documents.privacyPolicy,
									agreedAt,
							  }
							: undefined,
						maintenanceDisclaimer: legalAgreement.documents
							.maintenanceDisclaimer
							? {
									...legalAgreement.documents.maintenanceDisclaimer,
									agreedAt,
							  }
							: undefined,
						subscriptionTerms: legalAgreement.documents.subscriptionTerms
							? {
									...legalAgreement.documents.subscriptionTerms,
									agreedAt,
							  }
							: undefined,
						eula: legalAgreement.documents.eula
							? {
									...legalAgreement.documents.eula,
									agreedAt,
							  }
							: undefined,
				  }
				: createLegalAgreementDocuments(agreedAt, legalAgreement.agreedVersion)
			: undefined;
		const legalAgreementData = legalAgreement
			? {
					legalAgreement: {
						agreedToTerms: legalAgreement.agreedToTerms,
						agreedAt,
						agreedVersion: legalAgreement.agreedVersion,
						documents: legalDocuments,
					},
			  }
			: {};

		await setDoc(doc(db, 'users', userCredential.user.uid), {
			...userProfile,
			...legalAgreementData,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			subscription: provisionalSubscription,
		});

		const { subscription, checkoutUrl } = await createUserSubscription(
			selectedPlan,
			promoCode,
			userCredential.user.uid,
			email,
		);

		if (!checkoutUrl) {
			await updateDoc(doc(db, 'users', userCredential.user.uid), {
				subscription,
				updatedAt: serverTimestamp(),
			});
		}

		const ensureFamilyAccountCallable = httpsCallable<
			{
				accountId?: string;
				syncSubscription?: boolean;
				subscription?: Record<string, unknown>;
			},
			{
				id: string;
				subscription?: Record<string, unknown>;
			}
		>(functions, 'ensureFamilyAccount');

		await ensureFamilyAccountCallable({
			accountId: userCredential.user.uid,
			syncSubscription: true,
			subscription: subscription as unknown as Record<string, unknown>,
		});

		// Auto-accept pending guest invitations for property guests
		if (resolvedRole === USER_ROLES.PROPERTY_GUEST) {
			await autoAcceptGuestInvitations(
				userCredential.user.uid,
				email.trim().toLowerCase(),
			);
		}

		if (shouldRedeemTenantInvite && promoCode?.trim()) {
			const redeemTenantInvite = httpsCallable<
				{ promoCode: string },
				{ success: boolean }
			>(functions, 'redeemTenantInvitationCode');
			await redeemTenantInvite({ promoCode });
		}

		if (shouldRedeemTeamInvite && promoCode?.trim()) {
			const redeemTeamInvite = httpsCallable<
				{ promoCode: string; teamMemberEmail: string },
				{ success: boolean }
			>(functions, 'redeemTeamMemberInvitationCode');
			await redeemTeamInvite({
				promoCode,
				teamMemberEmail: email.trim().toLowerCase(),
			});
		}

		// Always create default groups for new users
		await setDoc(
			doc(db, 'propertyGroups', `${userCredential.user.uid}_my_properties`),
			{
				userId: userCredential.user.uid,
				accountId: userCredential.user.uid,
				name: 'My Properties',
				properties: [],
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			},
		);

		await setDoc(
			doc(db, 'propertyGroups', `${userCredential.user.uid}_shared_properties`),
			{
				userId: userCredential.user.uid,
				accountId: userCredential.user.uid,
				name: 'Shared Properties',
				properties: [],
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			},
		);

		const myTeamGroupId = `${userCredential.user.uid}_default`;
		const myTeamGroupRef = doc(db, 'teamGroups', myTeamGroupId);
		await setDoc(myTeamGroupRef, {
			userId: userCredential.user.uid,
			accountId: userCredential.user.uid,
			name: 'My Team',
			linkedProperties: [],
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return {
			user: {
				...userProfile,
				subscription,
				...(legalAgreement && {
					legalAgreement: {
						agreedToTerms: legalAgreement.agreedToTerms,
						agreedAt,
						agreedVersion: legalAgreement.agreedVersion,
						documents: legalDocuments,
					},
				}),
			},
			...(checkoutUrl ? { checkoutUrl } : {}),
		};
	} catch (error: any) {
		console.error('Sign up error:', error);
		const authErrorMessage = getAuthErrorMessage(error?.code);
		if (authErrorMessage !== 'Authentication failed. Please try again') {
			throw new Error(authErrorMessage);
		}
		throw new Error(error?.message || 'Authentication failed. Please try again');
	}
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
	try {
		const userId = auth.currentUser?.uid;
		await signOut(auth);
		clearUserLocalStorage(userId);
	} catch (error: any) {
		console.error('Sign out error:', error);
		throw new Error('Failed to sign out');
	}
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User> => {
	try {
		let userDoc = await getDoc(doc(db, 'users', uid));

		if (!userDoc.exists()) {
			await new Promise((resolve) => setTimeout(resolve, 400));
			userDoc = await getDoc(doc(db, 'users', uid));
		}

		if (!userDoc.exists()) {
			throw new Error('User profile not found');
		}

		const ensureFamilyAccountCallable = httpsCallable<
			{
				accountId?: string;
				syncSubscription?: boolean;
				subscription?: Record<string, unknown>;
			},
			{
				id: string;
				subscription?: Record<string, unknown>;
			}
		>(functions, 'ensureFamilyAccount');

		// Get family account summary via backend callable (rules-safe)
		let familyAccountSubscription: Record<string, unknown> | null = null;
		const userData = userDoc.data();
		if (userData.accountId) {
			try {
				const accountSummary = await ensureFamilyAccountCallable({
					accountId: String(userData.accountId),
				});
				familyAccountSubscription = accountSummary.data?.subscription || null;
			} catch (accountError) {
				console.warn(
					'Failed to load family account subscription:',
					accountError,
				);
			}
		}

		const rawData: any = userDoc.data();
		const serializedData: any = {
			...(serializeFirestoreValue(rawData) as Record<string, unknown>),
			id: uid,
		};

		// Use family account subscription when available, but prefer user subscription
		// if family data appears stale (e.g., family shows expired but user is active).
		type UserSubscription = User['subscription'];
		type NonNullableUserSubscription = NonNullable<UserSubscription>;
		type UserSubscriptionStatus = NonNullableUserSubscription['status'];
		const normalizeSubscriptionStatus = (
			status: string | undefined,
		): UserSubscriptionStatus | undefined => {
			if (!status) return undefined;

			if (status === 'trialing') return SUBSCRIPTION_STATUS.TRIAL;
			if (
				status === 'incomplete' ||
				status === 'incomplete_expired' ||
				status === 'unpaid'
			) {
				return SUBSCRIPTION_STATUS.PAST_DUE;
			}

			return status as UserSubscriptionStatus;
		};

		const normalizeSubscription = (
			subscription: UserSubscription,
		): UserSubscription => {
			if (!subscription) return subscription;

			return {
				...subscription,
				status:
					normalizeSubscriptionStatus(subscription.status) ||
					subscription.status,
			};
		};

		const userSubscription = normalizeSubscription(
			(rawData.subscription ?? undefined) as UserSubscription,
		);
		const familySubscription = normalizeSubscription(
			(serializeFirestoreValue(familyAccountSubscription) ??
				undefined) as UserSubscription,
		);

		const userStatus = userSubscription?.status;
		const familyStatus = familySubscription?.status;
		const userHasNonExpiredStatus =
			userStatus === SUBSCRIPTION_STATUS.ACTIVE ||
			userStatus === SUBSCRIPTION_STATUS.TRIAL ||
			userStatus === SUBSCRIPTION_STATUS.PAST_DUE;
		const familyHasNonExpiredStatus =
			familyStatus === SUBSCRIPTION_STATUS.ACTIVE ||
			familyStatus === SUBSCRIPTION_STATUS.TRIAL ||
			familyStatus === SUBSCRIPTION_STATUS.PAST_DUE;
		const userHasStripeSubscription = !!userSubscription?.stripeSubscriptionId;
		const familyHasStripeSubscription =
			!!familySubscription?.stripeSubscriptionId;
		const userHasPaidPlan =
			!!userSubscription?.plan && userSubscription.plan !== 'free';
		const familyHasPaidPlan =
			!!familySubscription?.plan && familySubscription.plan !== 'free';

		const shouldPreferUserSubscription =
			!!userStatus &&
			(!familyStatus ||
				(userHasStripeSubscription && !familyHasStripeSubscription) ||
				(userHasPaidPlan && !familyHasPaidPlan) ||
				(userHasNonExpiredStatus && !familyHasNonExpiredStatus) ||
				(familyStatus === SUBSCRIPTION_STATUS.EXPIRED &&
					userStatus !== SUBSCRIPTION_STATUS.EXPIRED) ||
				(familyStatus === SUBSCRIPTION_STATUS.CANCELLED &&
					userHasNonExpiredStatus) ||
				(familyStatus === SUBSCRIPTION_STATUS.TRIAL &&
					userStatus === SUBSCRIPTION_STATUS.ACTIVE));

		const subscriptionData = shouldPreferUserSubscription
			? userSubscription
			: familySubscription || userSubscription;
		if (subscriptionData) {
			serializedData.subscription = {
				...(serializeFirestoreValue(subscriptionData) as Record<
					string,
					unknown
				>),
			};

			// If we had to prefer the user subscription over family subscription,
			// sync family account subscription for owners to prevent repeated stale reads.
			if (
				shouldPreferUserSubscription &&
				userData.accountId &&
				(rawData.isAccountOwner || userData.accountId === uid)
			) {
				try {
					await ensureFamilyAccountCallable({
						accountId: String(userData.accountId),
						syncSubscription: true,
						subscription: userSubscription as unknown as Record<
							string,
							unknown
						>,
					});
				} catch (syncError) {
					console.warn(
						'Failed to sync family account subscription:',
						syncError,
					);
				}
			}
		} else {
			// Create default subscription for users who don't have one
			console.warn(
				`User ${uid} does not have a subscription - creating default free plan`,
			);
			const now = Math.floor(Date.now() / 1000);
			serializedData.subscription = {
				status: SUBSCRIPTION_STATUS.ACTIVE,
				plan: 'free',
				currentPeriodStart: now,
				currentPeriodEnd: now + 365 * 24 * 60 * 60, // 1 year
				trialEndsAt: null,
			};

			// Update the user document with the default subscription
			try {
				await updateDoc(doc(db, 'users', uid), {
					subscription: serializedData.subscription,
					updatedAt: serverTimestamp(),
				});
			} catch (updateError) {
				console.error(
					'Failed to update user with default subscription:',
					updateError,
				);
			}
		}

		// Migrate existing users to have accountId and isAccountOwner
		let needsUpdate = false;
		if (!rawData.accountId) {
			serializedData.accountId = uid;
			needsUpdate = true;
		}
		if (rawData.isAccountOwner === undefined) {
			serializedData.isAccountOwner = true; // Existing users are account owners
			needsUpdate = true;
		}

		// If migration is needed, update the user document
		if (needsUpdate) {
			try {
				await updateDoc(doc(db, 'users', uid), {
					accountId: serializedData.accountId,
					isAccountOwner: serializedData.isAccountOwner,
					updatedAt: serverTimestamp(),
				});

				await ensureFamilyAccountCallable({
					accountId: uid,
					syncSubscription: true,
					subscription: serializedData.subscription as Record<string, unknown>,
				});
			} catch (migrationError) {
				console.error('Failed to migrate user account data:', migrationError);
			}
		}

		return serializedData as User;
	} catch (error: any) {
		console.error('Get user profile error:', error);
		throw new Error('Failed to load user profile');
	}
};

/**
 * Add a family member to an existing account (creates user immediately with password reset email)
 */
export const addFamilyMember = async (
	accountId: string,
	email: string,
	firstName: string,
	lastName: string,
	role: 'owner' | 'admin' | 'member' = 'admin',
): Promise<{ userId: string; message: string }> => {
	try {
		const createFamilyInviteFunction = httpsCallable<
			{
				accountId: string;
				email: string;
				firstName: string;
				lastName: string;
				role: 'owner' | 'admin' | 'member';
			},
			{ success: boolean; userId: string; message: string }
		>(functions, 'createFamilyInvite');

		const result = await createFamilyInviteFunction({
			accountId,
			email,
			firstName,
			lastName,
			role,
		});

		return {
			userId: result.data.userId,
			message: result.data.message || 'Family member added successfully',
		};
	} catch (error: any) {
		console.error('Failed to add family member:', error);
		// Re-throw the error message from the cloud function
		if (error.message) {
			throw new Error(error.message);
		}
		throw error;
	}
};

/**
 * Remove a family member from an account
 */
export const removeFamilyMember = async (
	accountId: string,
	memberId: string,
	currentUserId: string,
): Promise<void> => {
	try {
		if (memberId === currentUserId) {
			throw new Error('Cannot remove yourself from the account');
		}

		// Call Cloud Function to delete the family member's account
		// This preserves their tasks and history
		const deleteFamilyMember = httpsCallable(
			functions,
			'deleteFamilyMemberAccount',
		);
		await deleteFamilyMember({ memberId, accountId });
	} catch (error: any) {
		console.error('Failed to remove family member:', error);
		throw error;
	}
};

export const updateFamilyMemberRole = async (
	accountId: string,
	memberId: string,
	role: 'admin' | 'member',
): Promise<void> => {
	const updateRoleFunction = httpsCallable<
		{ accountId: string; memberId: string; role: 'admin' | 'member' },
		{ success: boolean; message?: string }
	>(functions, 'updateFamilyMemberRole');

	await updateRoleFunction({ accountId, memberId, role });
};

export const updateFamilyMember = async (
	accountId: string,
	memberId: string,
	firstName: string,
	lastName: string,
	role: 'admin' | 'member',
): Promise<void> => {
	const updateFamilyMemberFunction = httpsCallable<
		{
			accountId: string;
			memberId: string;
			firstName: string;
			lastName: string;
			role: 'admin' | 'member';
		},
		{ success: boolean; message?: string }
	>(functions, 'updateFamilyMember');

	await updateFamilyMemberFunction({
		accountId,
		memberId,
		firstName,
		lastName,
		role,
	});
};

/**
 * Get family account members
 */
export const getFamilyMembers = async (accountId: string): Promise<User[]> => {
	try {
		const getFamilyMembersCallable = httpsCallable<
			{ accountId: string },
			{ members: User[] }
		>(functions, 'getFamilyMembers');

		const result = await getFamilyMembersCallable({ accountId });
		return Array.isArray(result.data?.members) ? result.data.members : [];
	} catch (error: any) {
		console.error('Failed to get family members:', error);
		return [];
	}
};

export const getFamilyInvites = async (
	accountId: string,
): Promise<FamilyInvite[]> => {
	try {
		const listFamilyInvitesCallable = httpsCallable<
			{ accountId: string },
			{ invites: FamilyInvite[] }
		>(functions, 'listFamilyInvites');

		const result = await listFamilyInvitesCallable({ accountId });
		const invites = Array.isArray(result.data?.invites)
			? result.data.invites
			: [];

		return invites.filter((invite) => invite.status === 'pending');
	} catch (error: any) {
		console.error('Failed to get family invites:', error);
		return [];
	}
};

export const resendPasswordReset = async (
	accountId: string,
	userId: string,
): Promise<void> => {
	const resendFunction = httpsCallable<
		{ userId: string; accountId: string },
		{ success: boolean; message?: string }
	>(functions, 'resendFamilyMemberInvite');

	await resendFunction({ userId, accountId });
};

export const revokeFamilyInvite = async (
	accountId: string,
	inviteId: string,
): Promise<void> => {
	const revokeInviteFunction = httpsCallable<
		{ inviteId: string; accountId: string },
		{ success: boolean; message?: string }
	>(functions, 'revokeFamilyInvite');

	await revokeInviteFunction({ inviteId, accountId });
};

export const acceptFamilyInvite = async (
	inviteId: string,
	token: string,
): Promise<void> => {
	const acceptInviteFunction = httpsCallable<
		{ inviteId: string; token: string },
		{ success: boolean; message?: string }
	>(functions, 'acceptFamilyInvite');

	await acceptInviteFunction({ inviteId, token });
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (
	callback: (user: User | null) => void,
): (() => void) => {
	return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
		if (firebaseUser) {
			try {
				const userProfile = await getUserProfile(firebaseUser.uid);
				callback(userProfile);
			} catch (error) {
				console.error('Error loading user profile:', error);
				callback(null);
			}
		} else {
			callback(null);
		}
	});
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
	try {
		await sendPasswordResetEmail(auth, email);
	} catch (error: any) {
		console.error('Password reset error:', error);

		// Provide more specific error messages
		if (error.code === 'auth/user-not-found') {
			throw new Error(
				'No account found with this email address. Please check your email or sign up for a new account.',
			);
		} else if (error.code === 'auth/invalid-email') {
			throw new Error('Please enter a valid email address.');
		} else if (error.code === 'auth/too-many-requests') {
			throw new Error(
				'Too many password reset requests. Please wait a few minutes before trying again.',
			);
		}

		throw new Error(
			getAuthErrorMessage(error.code) ||
				'Failed to send password reset email. Please check your Firebase Console email template configuration.',
		);
	}
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode?: string): string => {
	switch (errorCode) {
		case 'auth/user-not-found':
			return 'No account found with this email address';
		case 'auth/wrong-password':
			return 'Incorrect password';
		case 'auth/invalid-email':
			return 'Invalid email address';
		case 'auth/user-disabled':
			return 'This account has been disabled';
		case 'auth/email-already-in-use':
			return 'An account already exists with this email';
		case 'auth/weak-password':
			return 'Password should be at least 6 characters';
		case 'auth/too-many-requests':
			return 'Too many failed attempts. Please try again later';
		case 'auth/network-request-failed':
			return 'Network error. Please check your connection';
		case 'auth/invalid-credential':
			return 'Invalid email or password';
		default:
			return 'Authentication failed. Please try again';
	}
};

/**
 * Get role title from role constant
 */
const getRoleTitleFromRole = (role: string): string => {
	const roleTitles: { [key: string]: string } = {
		[USER_ROLES.ADMIN]: 'Administrator',
		[USER_ROLES.PROPERTY_MANAGER]: 'Property Manager',
		[USER_ROLES.ASSISTANT_MANAGER]: 'Assistant Manager',
		[USER_ROLES.MAINTENANCE_LEAD]: 'Maintenance Lead',
		[USER_ROLES.MAINTENANCE]: 'Maintenance Technician',
		[USER_ROLES.CONTRACTOR]: 'Contractor',
		[USER_ROLES.TENANT]: 'Tenant',
		[USER_ROLES.PROPERTY_GUEST]: 'Property Guest',
	};
	return roleTitles[role] || 'User';
};

/**
 * Auto-accept pending guest invitations for a newly registered property guest
 */
const autoAcceptGuestInvitations = async (
	userId: string,
	userEmail: string,
) => {
	try {
		// Find all pending guest invitations for this email
		const invitationsQuery = query(
			collection(db, 'userInvitations'),
			where('toEmail', '==', userEmail.toLowerCase()),
			where('status', '==', 'pending'),
			where('isGuestInvitation', '==', true),
		);
		const invitationsSnapshot = await getDocs(invitationsQuery);

		for (const invitationDoc of invitationsSnapshot.docs) {
			const invitation = invitationDoc.data() as any;

			// Create property share
			const now = new Date().toISOString();
			const shareData = {
				propertyId: invitation.propertyId,
				ownerId: invitation.fromUserId,
				sharedWithUserId: userId,
				sharedWithEmail: userEmail,
				sharedWithFirstName: '', // Will be updated when user profile is fetched
				sharedWithLastName: '',
				permission: invitation.permission,
				createdAt: now,
				updatedAt: now,
			};
			await addDoc(collection(db, 'propertyShares'), shareData);

			// Update invitation status
			await updateDoc(invitationDoc.ref, { status: 'accepted' });

			// Create notifications (similar to acceptInvitation mutation)
			// ... notification creation code would go here
		}
	} catch (error) {
		console.error('Error auto-accepting guest invitations:', error);
	}
};
