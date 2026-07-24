import { doc, getDocFromServer, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { callFirebaseFunction } from '../config/firebaseFunctions';
import { User } from '../Redux/Slices/userSlice';
import { SUBSCRIPTION_STATUS } from '../constants/subscriptions';

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

/**
 * Get user profile from Firestore.
 *
 * Kept separate from authService so app startup can load the authenticated user
 * without also loading registration, billing, legal, and account-management flows.
 */
export const getUserProfile = async (uid: string): Promise<User> => {
	try {
		const userRef = doc(db, 'users', uid);
		let userDoc = await getDocFromServer(userRef);

		if (!userDoc.exists()) {
			await new Promise((resolve) => setTimeout(resolve, 400));
			userDoc = await getDocFromServer(userRef);
		}

		if (!userDoc.exists()) {
			throw new Error('User profile not found');
		}

		// Get family account summary via backend callable (rules-safe)
		let familyAccountSubscription: Record<string, unknown> | null = null;
		let familyEntitlementProjection: Record<string, unknown> | null = null;
		let resolvedFamilyAccountId: string | null = null;
		const userData = userDoc.data();
		if (userData.accountId) {
			try {
				const accountSummary = await callFirebaseFunction<
					{
						accountId?: string;
						syncSubscription?: boolean;
						subscription?: Record<string, unknown>;
					},
					{
						id: string;
						subscription?: Record<string, unknown>;
						effectiveEntitlementProjection?: Record<string, unknown>;
					}
				>('ensureFamilyAccount', {
					accountId: String(userData.accountId),
				});
				familyAccountSubscription = accountSummary.data?.subscription || null;
				familyEntitlementProjection =
					accountSummary.data?.effectiveEntitlementProjection || null;
				resolvedFamilyAccountId = accountSummary.data?.id || null;
			} catch (accountError) {
				console.warn(
					'Failed to load family account subscription:',
					accountError,
				);
			}
		}

		const rawData: any = userDoc.data();
		const hasAccountLink = !!String(rawData.accountId || '').trim();
		const isExplicitNonOwner = rawData.isAccountOwner === false;
		const isExplicitNonTeamAccount = rawData.isTeamMemberAccount === false;
		const isTeamAccountWithoutAccess =
			(
				!hasAccountLink &&
				(rawData.isTeamMemberAccount === true ||
					(isExplicitNonOwner && isExplicitNonTeamAccount))
			) ||
			(
				String(rawData.accountId || '').trim() === uid &&
				isExplicitNonOwner &&
				isExplicitNonTeamAccount
			);

		if (isTeamAccountWithoutAccess) {
			throw new Error('This team member account no longer has active access.');
		}

		const serializedData: any = {
			...(serializeFirestoreValue(rawData) as Record<string, unknown>),
			id: uid,
		};

		if (
			rawData.isTeamMemberAccount === true &&
			String(rawData.teamMemberId || '').trim()
		) {
			try {
				const teamMemberSnapshot = await getDocFromServer(
					doc(db, 'teamMembers', String(rawData.teamMemberId).trim()),
				);
				if (teamMemberSnapshot.exists()) {
					const teamMemberData = serializeFirestoreValue(
						teamMemberSnapshot.data(),
					) as Record<string, unknown>;
					const linkedProfileUpdates: Record<string, unknown> = {};
					(['firstName', 'lastName', 'title', 'phone', 'address', 'image', 'role'] as const).forEach(
						(field) => {
							if (teamMemberData[field] !== undefined) {
								serializedData[field] = teamMemberData[field];
								if (rawData[field] !== teamMemberData[field]) {
									linkedProfileUpdates[field] = teamMemberData[field];
								}
							}
						},
					);

					if (Object.keys(linkedProfileUpdates).length > 0) {
						try {
							await updateDoc(doc(db, 'users', uid), {
								...linkedProfileUpdates,
								updatedAt: serverTimestamp(),
							});
						} catch (linkedProfileSyncError) {
							console.warn(
								'Failed to sync linked team member profile fields:',
								linkedProfileSyncError,
							);
						}
					}
				}
			} catch (teamMemberProfileError) {
				console.warn(
					'Failed to load linked team member profile:',
					teamMemberProfileError,
				);
			}
		}

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
			!!userSubscription?.plan &&
			!['homeowner', 'guest', 'team', 'tenant'].includes(userSubscription.plan);
		const familyHasPaidPlan =
			!!familySubscription?.plan &&
			!['homeowner', 'guest', 'team', 'tenant'].includes(familySubscription.plan);

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
				...(resolvedFamilyAccountId
					? { entitlementAccountId: resolvedFamilyAccountId }
					: {}),
				...(Array.isArray(familyEntitlementProjection?.activeGrants)
					? {
							entitlementGrants: serializeFirestoreValue(
								familyEntitlementProjection.activeGrants,
							),
					  }
					: {}),
			};
			if (familyEntitlementProjection) {
				serializedData.effectiveEntitlementProjection =
					serializeFirestoreValue(familyEntitlementProjection);
			}

			// If we had to prefer the user subscription over family subscription,
			// sync family account subscription for owners to prevent repeated stale reads.
			if (
				shouldPreferUserSubscription &&
				userData.accountId &&
				(rawData.isAccountOwner || userData.accountId === uid)
			) {
				try {
					await callFirebaseFunction<
						{
							accountId?: string;
							syncSubscription?: boolean;
							subscription?: Record<string, unknown>;
						},
						{
							id: string;
							subscription?: Record<string, unknown>;
						}
					>('ensureFamilyAccount', {
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
				plan: 'homeowner',
				currentPeriodStart: now,
				currentPeriodEnd: now + 365 * 24 * 60 * 60,
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
		const canBackfillOwnerAccount =
			rawData.isAccountOwner !== false && rawData.isTeamMemberAccount !== true;
		if (!rawData.accountId && canBackfillOwnerAccount) {
			serializedData.accountId = uid;
			needsUpdate = true;
		}
		if (rawData.isAccountOwner === undefined && canBackfillOwnerAccount) {
			serializedData.isAccountOwner = true;
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

				await callFirebaseFunction<
					{
						accountId?: string;
						syncSubscription?: boolean;
						subscription?: Record<string, unknown>;
					},
					{
						id: string;
						subscription?: Record<string, unknown>;
					}
				>('ensureFamilyAccount', {
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
