import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {
	defineJsonSecret,
	defineSecret,
	defineString,
	StringParam,
} from 'firebase-functions/params';
import { ensureFamilyAccountForUser } from './ensureFamilyAccount';
import { ENTITLEMENT_FEATURE_FLAGS } from './subscriptionEntitlements';
import { buildStripeBillingDisclosure } from './stripeBillingDisclosure';
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const FUNCTIONS_CONFIG_EXPORT = defineJsonSecret<Record<string, any>>(
	'FUNCTIONS_CONFIG_EXPORT',
);
const STRIPE_FUNCTION_SECRETS = [STRIPE_SECRET_KEY, FUNCTIONS_CONFIG_EXPORT];
const STRIPE_WEBHOOK_SECRETS = [
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET,
	FUNCTIONS_CONFIG_EXPORT,
];
const optionalStringParam = (name: string) => defineString(name, { default: '' });
const STRIPE_PRICE_PARAMS = {
	homeownerPlusMonthlyPriceId: optionalStringParam(
		'STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID',
	),
	homeownerPlusAnnualPriceId: optionalStringParam(
		'STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID',
	),
	multiHomeownerMonthlyPriceId: optionalStringParam(
		'STRIPE_MULTI_HOMEOWNER_MONTHLY_PRICE_ID',
	),
	multiHomeownerAnnualPriceId: optionalStringParam(
		'STRIPE_MULTI_HOMEOWNER_ANNUAL_PRICE_ID',
	),
	propertyMonthlyPriceId: optionalStringParam(
		'STRIPE_PROPERTY_MONTHLY_PRICE_ID',
	),
	propertyAnnualPriceId: optionalStringParam(
		'STRIPE_PROPERTY_ANNUAL_PRICE_ID',
	),
	portfolioMonthlyPriceId: optionalStringParam(
		'STRIPE_PORTFOLIO_MONTHLY_PRICE_ID',
	),
	portfolioAnnualPriceId: optionalStringParam(
		'STRIPE_PORTFOLIO_ANNUAL_PRICE_ID',
	),
};

if (!admin.apps.length) {
	admin.initializeApp();
}

// Initialize Stripe lazily to avoid accessing secrets at deployment time
let stripe: Stripe | null = null;

const sanitizeSecret = (value: string): string => {
	return value
		.replace(/[\u0000-\u001F\u007F]/g, '')
		.trim();
};

const readStringParam = (param: StringParam): string => {
	try {
		return sanitizeSecret(param.value() || process.env[param.name] || '');
	} catch (error) {
		return sanitizeSecret(process.env[param.name] || '');
	}
};

const readEnv = (name: string): string => sanitizeSecret(process.env[name] || '');

let exportedFunctionsConfigCache: Record<string, any> | null | undefined;

const getExportedFunctionsConfig = (): Record<string, any> => {
	if (exportedFunctionsConfigCache !== undefined) {
		return exportedFunctionsConfigCache || {};
	}

	try {
		exportedFunctionsConfigCache = FUNCTIONS_CONFIG_EXPORT.value() || {};
		return exportedFunctionsConfigCache;
	} catch (error) {
		const rawExport = readEnv('FUNCTIONS_CONFIG_EXPORT');
		if (rawExport) {
			try {
				exportedFunctionsConfigCache = JSON.parse(rawExport);
				return exportedFunctionsConfigCache || {};
			} catch (parseError) {
				console.warn('Unable to parse FUNCTIONS_CONFIG_EXPORT as JSON.');
			}
		}
		exportedFunctionsConfigCache = null;
		return {};
	}
};

const readExportedStripeConfig = (key: string): string => {
	const exportedConfig = getExportedFunctionsConfig();
	return sanitizeSecret(exportedConfig?.stripe?.[key] || '');
};

const normalizePromoCode = (value: unknown): string => {
	return sanitizeSecret(String(value || ''));
};

const resolveStripeSecretKey = (): string => {
	let secretFromManager = '';
	try {
		secretFromManager = STRIPE_SECRET_KEY.value() || '';
	} catch (error) {
		console.warn('Unable to read STRIPE_SECRET_KEY from Secret Manager');
	}

	const secretFromEnv = process.env.STRIPE_SECRET_KEY || '';
	const secretFromExportedConfig = readExportedStripeConfig('secret_key');

	return sanitizeSecret(
		secretFromManager || secretFromEnv || secretFromExportedConfig,
	);
};

const resolveStripeWebhookSecret = (): string => {
	let secretFromManager = '';
	try {
		secretFromManager = STRIPE_WEBHOOK_SECRET.value() || '';
	} catch (error) {
		console.warn('Unable to read STRIPE_WEBHOOK_SECRET from Secret Manager');
	}

	const secretFromEnv = process.env.STRIPE_WEBHOOK_SECRET || '';
	const secretFromExportedConfig = readExportedStripeConfig('webhook_secret');
	return sanitizeSecret(
		secretFromManager || secretFromEnv || secretFromExportedConfig,
	);
};

const getStripe = () => {
	if (!stripe) {
		const stripeSecretKey = resolveStripeSecretKey();
		if (!stripeSecretKey) {
			throw new Error(
				'Stripe secret key is not configured. Set STRIPE_SECRET_KEY in Secret Manager or the functions environment.',
			);
		}

		stripe = new Stripe(stripeSecretKey, {
			apiVersion: '2023-10-16',
		});
		console.log('Stripe key loaded: YES');
	}
	return stripe;
};

const resolvePriceIdForPlan = (
	planId: string,
	billingCycle: 'month' | 'year' = 'month',
): string => {
	const normalizedPlan = String(planId || '').trim().toLowerCase();
	const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';

	const homeownerPlusPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId) ||
		readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID') ||
		readExportedStripeConfig('homeowner_plus_monthly_price_id') ||
		readExportedStripeConfig('homeowner_plus_price_id') ||
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID') ||
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID');
	const homeownerPlusAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId) ||
		readExportedStripeConfig('homeowner_plus_annual_price_id') ||
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID');

	const propertyPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId) ||
		readEnv('STRIPE_PROPERTY_PRICE_ID') ||
		readExportedStripeConfig('property_monthly_price_id') ||
		readExportedStripeConfig('property_price_id') ||
		readEnv('REACT_APP_STRIPE_PROPERTY_PLAN_ID');
	const multiHomeownerPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerMonthlyPriceId) ||
		readExportedStripeConfig('multi_homeowner_monthly_price_id');
	const multiHomeownerAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerAnnualPriceId) ||
		readExportedStripeConfig('multi_homeowner_annual_price_id');
	const propertyAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId) ||
		readExportedStripeConfig('property_annual_price_id') ||
		readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID');

	const portfolioPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId) ||
		readEnv('STRIPE_PORTFOLIO_PRICE_ID') ||
		readExportedStripeConfig('portfolio_monthly_price_id') ||
		readExportedStripeConfig('portfolio_price_id') ||
		readEnv('REACT_APP_STRIPE_PORTFOLIO_PLAN_ID');
	const portfolioAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId) ||
		readExportedStripeConfig('portfolio_annual_price_id') ||
		readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID');

	const monthlyPriceMap: Record<string, string> = {
		homeowner_plus: homeownerPlusPriceId,
		multi_homeowner: multiHomeownerPriceId,
		property: propertyPriceId,
		portfolio: portfolioPriceId,
	};

	const annualPriceMap: Record<string, string> = {
		homeowner_plus: homeownerPlusAnnualPriceId || homeownerPlusPriceId,
		multi_homeowner: multiHomeownerAnnualPriceId || multiHomeownerPriceId,
		property: propertyAnnualPriceId || propertyPriceId,
		portfolio: portfolioAnnualPriceId || portfolioPriceId,
	};

	return (
		(normalizedCycle === 'year' ? annualPriceMap : monthlyPriceMap)[
			normalizedPlan
		] || ''
	);
};

const CHECKOUT_PLAN_IDS = [
	'homeowner_plus',
	'multi_homeowner',
	'property',
	'portfolio',
] as const;
const LEGACY_PRICE_ONLY_CHECKOUT_REMOVAL_RELEASE = '2.10.0';

const resolveConfiguredPlanForPriceId = (priceId: string): string => {
	const normalizedPriceId = sanitizeSecret(String(priceId || ''));
	if (!normalizedPriceId) return '';

	for (const planId of CHECKOUT_PLAN_IDS) {
		for (const billingCycle of ['month', 'year'] as const) {
			if (resolvePriceIdForPlan(planId, billingCycle) === normalizedPriceId) {
				return planId;
			}
		}
	}
	return '';
};

const resolvePromotionCodeId = async (
	promoCode: string,
): Promise<string | null> => {
	if (!promoCode) {
		return null;
	}

	const promotionCodes = await getStripe().promotionCodes.list({
		code: promoCode,
		active: true,
		limit: 1,
	});

	return promotionCodes.data[0]?.id || null;
};

const db = admin.firestore();

const BUSINESS_PLAN_IDS = new Set(['property', 'portfolio']);

const assertMultiHomeownerSelfDowngradeAllowed = async (
	accountId: string,
	currentPlanId: string,
): Promise<void> => {
	if (!BUSINESS_PLAN_IDS.has(String(currentPlanId || '').toLowerCase())) {
		return;
	}

	const normalizedAccountId = String(accountId || '').trim();
	const [
		familyAccount,
		teamMembersByAccount,
		legacyTeamMembers,
		residentProfiles,
		residentInvites,
		properties,
	] = await Promise.all([
		db.collection('familyAccounts').doc(normalizedAccountId).get(),
		db.collection('teamMembers').where('accountId', '==', normalizedAccountId).get(),
		db.collection('teamMembers').where('userId', '==', normalizedAccountId).get(),
		db.collection('tenantProfiles').where('accountId', '==', normalizedAccountId).get(),
		db.collection('tenantInvitationCodes').where('accountId', '==', normalizedAccountId).get(),
		db.collection('properties').where('accountId', '==', normalizedAccountId).get(),
	]);

	const issues: string[] = [];
	const propertyCount = Number(familyAccount.data()?.propertyCount ?? properties.size);
	if (propertyCount > 5 || properties.size > 5) {
		issues.push('more than five properties');
	}
	if (!teamMembersByAccount.empty || !legacyTeamMembers.empty) {
		issues.push('team members');
	}
	if (!residentProfiles.empty) {
		issues.push('resident profiles');
	}
	const hasActiveResidentInvite = residentInvites.docs.some((invite) => {
		const status = String(invite.data().status || 'active').toLowerCase();
		return !['revoked', 'expired', 'cancelled', 'canceled'].includes(status);
	});
	const hasAssignedResidents = properties.docs.some((property) => {
		const tenants = property.data().tenants;
		return Array.isArray(tenants) && tenants.length > 0;
	});
	if (hasActiveResidentInvite || hasAssignedResidents) {
		issues.push('active resident access');
	}

	if (issues.length > 0) {
		throw new functions.https.HttpsError(
			'failed-precondition',
			`Before switching to Multi-Homeowner, resolve these business-only items: ${issues.join(', ')}. No records were changed.`,
			{ code: 'multi-homeowner-downgrade-blocked', issues },
		);
	}
};

const removeUndefinedFields = (obj: Record<string, any>) => {
	return Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	);
};

const buildMergedSubscription = (
	existingSubscription: Record<string, any> | undefined,
	patch: Record<string, any>,
) => {
	return removeUndefinedFields({
		...(existingSubscription || {}),
		...patch,
	});
};

const toLocalSubscriptionStatus = (stripeStatus: string): string => {
	if (stripeStatus === 'active') return 'active';
	if (stripeStatus === 'trialing') return 'trial';
	if (stripeStatus === 'canceled') return 'cancelled';
	return stripeStatus || 'expired';
};

const findReusableSubscription = async (
	customerId: string,
	existingSubscriptionId?: string,
): Promise<Stripe.Subscription | null> => {
	const reusableStatuses = new Set(['active', 'trialing', 'past_due']);

	if (existingSubscriptionId) {
		try {
			const subscription = await getStripe().subscriptions.retrieve(
				existingSubscriptionId,
			);
			if (reusableStatuses.has(subscription.status)) {
				return subscription;
			}
		} catch (error) {
			console.warn(
				`Unable to retrieve existing Stripe subscription ${existingSubscriptionId}; falling back to customer subscription lookup.`,
				error,
			);
		}
	}

	const subscriptions = await getStripe().subscriptions.list({
		customer: customerId,
		status: 'all',
		limit: 10,
	});

	return (
		subscriptions.data.find((subscription) =>
			reusableStatuses.has(subscription.status),
		) || null
	);
};

const syncFamilyAccountSubscription = async (
	userData: Record<string, any> | undefined,
	subscription: Record<string, any>,
) => {
	const accountId = userData?.accountId;
	if (!accountId) {
		return;
	}

	try {
		const normalizedPlan = String(subscription.plan || '').trim().toLowerCase();
		const preservesResidentContinuity = BUSINESS_PLAN_IDS.has(normalizedPlan);
		await db
			.collection('familyAccounts')
			.doc(accountId)
			.set(
				{
					subscription: removeUndefinedFields(subscription),
					...(preservesResidentContinuity
						? {
								resourceContinuity: {
									residentManagementPreviouslyEntitled: true,
									updatedAt: admin.firestore.FieldValue.serverTimestamp(),
								},
							}
						: {}),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
	} catch (error) {
		console.warn(
			`Failed to sync family account subscription for account ${accountId}:`,
			error,
		);
	}
};

/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 * Body: { priceId, userId, email, successUrl, cancelUrl }
 */
export const createCheckoutSession = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (data, context) => {
		// Verify user is authenticated
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const {
			priceId: requestedPriceId,
			planId,
			billingCycle,
			userId,
			email,
			successUrl,
			cancelUrl,
			promoCode: requestedPromoCode,
		} = data;
		const normalizedPlanId = String(planId || '').trim().toLowerCase();
		const normalizedBillingCycle = String(billingCycle || '').toLowerCase();
		const authenticatedUserId = context.auth.uid;
		if (String(userId || '').trim() !== authenticatedUserId) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Checkout can only be created for the signed-in account',
			);
		}
		const resolvedRequestedPriceId = sanitizeSecret(String(requestedPriceId || ''));
		let checkoutPlanId = normalizedPlanId;
		let resolvedPriceId = '';

		if (checkoutPlanId) {
			if (!CHECKOUT_PLAN_IDS.includes(checkoutPlanId as typeof CHECKOUT_PLAN_IDS[number])) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Checkout requires a supported paid plan ID.',
				);
			}
			if (!['month', 'year'].includes(normalizedBillingCycle)) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Checkout requires a monthly or annual billing cycle.',
				);
			}
			resolvedPriceId = resolvePriceIdForPlan(
				checkoutPlanId,
				normalizedBillingCycle as 'month' | 'year',
			);
		} else {
			checkoutPlanId = resolveConfiguredPlanForPriceId(resolvedRequestedPriceId);
			resolvedPriceId = checkoutPlanId ? resolvedRequestedPriceId : '';
			if (checkoutPlanId) {
				functions.logger.warn('Legacy price-only checkout compatibility path used', {
					userId: authenticatedUserId,
					resolvedPlanId: checkoutPlanId,
					removalRelease: LEGACY_PRICE_ONLY_CHECKOUT_REMOVAL_RELEASE,
				});
			}
		}
		if (
			checkoutPlanId === 'multi_homeowner' &&
			!ENTITLEMENT_FEATURE_FLAGS.multiHomeownerPlan
		) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Multi-Homeowner is not currently available.',
			);
		}

		if (!resolvedPriceId || !userId || !email) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				`No server-owned Stripe price is configured for plan '${String(planId || '')}', or the legacy price-only request is not recognized.`,
			);
		}

		try {
			console.log('Creating checkout session with:', {
				planId,
				billingCycle,
				priceId: resolvedPriceId,
				userId,
				email,
				successUrl,
				cancelUrl,
			});

			// Get user data to check current subscription
			const userRef = db.collection('users').doc(userId);
			const userDoc = await userRef.get();
			if (!userDoc.exists) {
				throw new functions.https.HttpsError(
					'not-found',
					'User profile not found',
				);
			}
			const userData = userDoc.data() || {};
			if (checkoutPlanId === 'multi_homeowner') {
				await assertMultiHomeownerSelfDowngradeAllowed(
					String(userData.accountId || authenticatedUserId),
					String(userData?.subscription?.plan || ''),
				);
			}
			await ensureFamilyAccountForUser(
				authenticatedUserId,
				{
					accountId: String(userData.accountId || authenticatedUserId),
					syncSubscription: true,
					subscription: userData.subscription as
						| Record<string, unknown>
						| undefined,
				},
				userData,
			);
			console.log('User data retrieved:', userData);

			const accountPromoCode = normalizePromoCode(
				requestedPromoCode || userData?.subscription?.promoCode,
			);
			let promotionCodeId: string | null = null;
			if (accountPromoCode) {
				promotionCodeId = await resolvePromotionCodeId(accountPromoCode);
				if (!promotionCodeId) {
					console.warn(
						`Promo code '${accountPromoCode}' was provided but no active Stripe Promotion Code was found. Proceeding without discount.`,
					);
				}
			}

			let customerId = userData?.subscription?.stripeCustomerId;

			// Create or retrieve Stripe customer
			if (!customerId) {
				const customer = await getStripe().customers.create({
					email: email,
					metadata: {
						firebaseUID: userId,
					},
				});
				customerId = customer.id;

				// Update user with customer ID
				await userRef.update({
					'subscription.stripeCustomerId': customerId,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			const existingSubscription = await findReusableSubscription(
				customerId,
				sanitizeSecret(
					String(userData?.subscription?.stripeSubscriptionId || ''),
				),
			);

			if (existingSubscription) {
				const subscriptionItem = existingSubscription.items.data[0];
				if (!subscriptionItem?.id) {
					throw new functions.https.HttpsError(
						'failed-precondition',
						'Existing Stripe subscription has no subscription item to update.',
					);
				}

				console.log('Updating existing Stripe subscription instead of creating a new one:', {
						subscriptionId: existingSubscription.id,
						subscriptionItemId: subscriptionItem.id,
						currentPriceId: subscriptionItem.price?.id,
						newPriceId: resolvedPriceId,
				});

				const updatedSubscription = await getStripe().subscriptions.update(
					existingSubscription.id,
					{
						items: [
							{
								id: subscriptionItem.id,
								price: resolvedPriceId,
								quantity: subscriptionItem.quantity || 1,
							},
						],
						proration_behavior: 'create_prorations',
						metadata: {
							...(existingSubscription.metadata || {}),
							firebaseUID: userId,
							...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
						},
					},
				);

				const updatedPriceId = updatedSubscription.items.data[0]?.price?.id || resolvedPriceId;
				const billingDisclosure = await buildStripeBillingDisclosure(
					getStripe(),
					updatedSubscription,
				);
				const subscriptionData = removeUndefinedFields({
					status: toLocalSubscriptionStatus(updatedSubscription.status),
					plan: getPlanFromPriceId(
						updatedPriceId,
						checkoutPlanId || userData?.subscription?.plan || 'homeowner',
					),
					currentPeriodStart: updatedSubscription.current_period_start,
					currentPeriodEnd: updatedSubscription.current_period_end,
					trialEndsAt: updatedSubscription.trial_end,
					stripeCustomerId: String(updatedSubscription.customer || customerId),
					stripeSubscriptionId: updatedSubscription.id,
					hasScheduledSubscription: false,
					scheduledPlan: null,
					pendingCheckoutPlan: null,
					pendingCheckoutStartedAt: null,
					billingDisclosure,
					...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
				});

				const mergedSubscription = buildMergedSubscription(
					userData?.subscription,
					subscriptionData,
				);

				await userRef.update({
					subscription: mergedSubscription,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});

				await syncFamilyAccountSubscription(userData, mergedSubscription);

				return {
					subscriptionUpdated: true,
					subscriptionId: updatedSubscription.id,
					subscription: mergedSubscription,
				};
			}

			// Create checkout session
			const session = await getStripe().checkout.sessions.create({
				customer: customerId,
				payment_method_types: ['card'],
				line_items: [
					{
						price: resolvedPriceId,
						quantity: 1,
					},
				],
				mode: 'subscription',
				success_url: successUrl,
				cancel_url: cancelUrl,
				...(promotionCodeId
					? { discounts: [{ promotion_code: promotionCodeId }] }
					: {}),
				metadata: {
					firebaseUID: userId,
					...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
				},
			});

			return { sessionId: session.id, url: session.url };
		} catch (error) {
			const stripeError = error as {
				message?: string;
				code?: string;
				type?: string;
			};

			console.error('Error creating checkout session:', {
				message: stripeError?.message,
				code: stripeError?.code,
				type: stripeError?.type,
			});

			if (stripeError?.message?.includes('No such price')) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'Stripe price ID is invalid. Verify REACT_APP_STRIPE_*_PLAN_ID values and deployed function config.',
				);
			}

			if (stripeError?.message?.includes('Invalid API Key')) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'Stripe secret key is invalid or missing in backend configuration.',
				);
			}

			throw new functions.https.HttpsError(
				'internal',
				stripeError?.message || 'Failed to create checkout session',
			);
		}
	});

/**
 * Validate Stripe Promotion Code
 * Callable body: { promoCode }
 */
export const validatePromotionCode = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (data) => {
		const normalizedPromoCode = normalizePromoCode(data?.promoCode).toLowerCase();

		if (!normalizedPromoCode) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'promoCode is required',
			);
		}

		try {
			const promotionCodes = await getStripe().promotionCodes.list({
				code: normalizedPromoCode,
				active: true,
				limit: 1,
			});

			const match = promotionCodes.data[0];
			const couponRef = match?.coupon;
			const couponId =
				typeof couponRef === 'string' ? couponRef : couponRef?.id || null;

			return {
				valid: Boolean(match),
				code: normalizedPromoCode,
				promotionCodeId: match?.id || null,
				couponId,
				message: match
					? 'Promo code is valid.'
					: 'Invalid or expired promo code.',
			};
		} catch (error) {
			const stripeError = error as {
				message?: string;
				code?: string;
				type?: string;
			};

			console.error('Error validating promotion code:', {
				message: stripeError?.message,
				code: stripeError?.code,
				type: stripeError?.type,
			});

			throw new functions.https.HttpsError(
				'internal',
				stripeError?.message || 'Failed to validate promo code',
			);
		}
	});

/**
 * Create Trial Subscription in Stripe
 * POST /api/create-trial-subscription
 * Body: { priceId, userId, email, trialDays }
 */
export const createTrialSubscription = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (data, context) => {
		// Verify user is authenticated
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const {
			priceId: requestedPriceId,
			planId,
			promoCode,
			userId,
			email,
			trialDays = 30,
		} = data;
		const normalizedPromoCode = normalizePromoCode(promoCode);
		const resolvedPriceId =
			resolvePriceIdForPlan(String(planId || '')) ||
			sanitizeSecret(String(requestedPriceId || ''));

		if (!resolvedPriceId || !userId || !email) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				`Missing required Stripe configuration: no price ID resolved for plan '${String(planId || '')}'. Configure STRIPE_*_PRICE_ID in functions environment.`,
			);
		}

		try {
			console.log('Creating trial subscription with:', {
				planId,
				priceId: resolvedPriceId,
				promoCode: normalizedPromoCode || undefined,
				userId,
				email,
				trialDays,
			});

			// Get user data to check current subscription
			const userDoc = await db.collection('users').doc(userId).get();
			const userData = userDoc.data();
			console.log('User data retrieved:', userData);

			let customerId = userData?.subscription?.stripeCustomerId;

			// Create or retrieve Stripe customer
			if (!customerId) {
				const customer = await getStripe().customers.create({
					email: email,
					metadata: {
						firebaseUID: userId,
						...(normalizedPromoCode
							? { promoCode: normalizedPromoCode }
							: {}),
					},
				});
				customerId = customer.id;

				// Update user with customer ID
				await db.collection('users').doc(userId).update({
					'subscription.stripeCustomerId': customerId,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			// Create subscription with trial period
			const subscription = await getStripe().subscriptions.create({
				customer: customerId,
				items: [
					{
						price: resolvedPriceId,
					},
				],
				trial_period_days: trialDays,
				metadata: {
					firebaseUID: userId,
					...(normalizedPromoCode
						? { promoCode: normalizedPromoCode }
						: {}),
				},
			});

			console.log('Trial subscription created:', subscription.id);

			return {
				subscriptionId: subscription.id,
				customerId: customerId,
				status: subscription.status,
				trialEnd: subscription.trial_end,
			};
		} catch (error) {
			console.error('Error creating trial subscription:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to create trial subscription',
			);
		}
	});

/**
 * Verify Checkout Session Success
 * POST /api/verify-checkout-session
 * Body: { sessionId }
 */
export const verifyCheckoutSession = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { sessionId } = data;

		if (!sessionId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Session ID is required',
			);
		}

		try {
			// Retrieve session from Stripe
			const session = await getStripe().checkout.sessions.retrieve(sessionId);

			const normalizedPaymentStatus = String(
				session.payment_status || '',
			).toLowerCase();
			const acceptablePaymentStatuses = ['paid', 'no_payment_required'];

			if (!acceptablePaymentStatuses.includes(normalizedPaymentStatus)) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					`Payment not completed (status: ${normalizedPaymentStatus || 'unknown'})`,
				);
			}

			const firebaseUID = session.metadata?.firebaseUID;
			if (!firebaseUID) {
				throw new functions.https.HttpsError(
					'invalid-argument',
					'Invalid session metadata',
				);
			}
			if (firebaseUID !== context.auth.uid) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'This checkout session belongs to a different account',
				);
			}

			// Get subscription details
			const subscription = await getStripe().subscriptions.retrieve(
				session.subscription as string,
			);
			const billingDisclosure = await buildStripeBillingDisclosure(
				getStripe(),
				subscription,
			);
			const subscriptionStatus = toLocalSubscriptionStatus(subscription.status);
			if (!['active', 'trial'].includes(subscriptionStatus)) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					`Subscription not active yet (status: ${subscription.status || 'unknown'})`,
				);
			}

			// Update user subscription in Firestore
			const subscriptionData = {
				status: subscriptionStatus,
				plan: getPlanFromPriceId(subscription.items.data[0].price.id),
				currentPeriodStart: subscription.current_period_start,
				currentPeriodEnd: subscription.current_period_end,
				trialEndsAt: subscription.trial_end,
				stripeCustomerId: session.customer as string,
				stripeSubscriptionId: subscription.id,
				pendingCheckoutPlan: null,
				pendingCheckoutStartedAt: null,
				billingDisclosure,
			};

			const userRef = db.collection('users').doc(firebaseUID);
			const userDoc = await userRef.get();
			const userData = userDoc.data();
			const mergedSubscription = buildMergedSubscription(
				userData?.subscription,
				subscriptionData,
			);

			await userRef.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			return { success: true, subscription: subscriptionData };
		} catch (error) {
			console.error('Error verifying checkout session:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to verify checkout session',
			);
		}
	});

/**
 * Cancel Subscription
 * POST /api/cancel-subscription
 * Body: { subscriptionId }
 */
export const cancelSubscription = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { subscriptionId } = data;

		if (!subscriptionId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Subscription ID is required',
			);
		}

		try {
			const userRef = db.collection('users').doc(context.auth.uid);
			const userDoc = await userRef.get();
			const userData = userDoc.data() || {};
			const storedSubscriptionId = String(
				userData?.subscription?.stripeSubscriptionId || '',
			).trim();
			if (!userDoc.exists || storedSubscriptionId !== String(subscriptionId)) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'This subscription does not belong to the signed-in account.',
				);
			}

			// Cancel subscription in Stripe
			const subscription = await getStripe().subscriptions.update(
				subscriptionId,
				{
					cancel_at_period_end: true,
				},
			);
			const billingDisclosure = await buildStripeBillingDisclosure(
				getStripe(),
				subscription,
			);
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				{
					status: toLocalSubscriptionStatus(subscription.status),
					cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
					canceledAt: subscription.canceled_at,
					billingDisclosure,
				},
			);

			await userRef.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			return {
				success: true,
				cancelAt: subscription.cancel_at || subscription.current_period_end,
				subscription: mergedSubscription,
			};
		} catch (error) {
			if (error instanceof functions.https.HttpsError) throw error;
			console.error('Error canceling subscription:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to cancel subscription',
			);
		}
	});

/**
 * Get Subscription Details
 * GET /api/subscription-details/:subscriptionId
 */
export const getSubscriptionDetails = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { subscriptionId } = data;

		if (!subscriptionId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Subscription ID is required',
			);
		}

		try {
			const userDoc = await db.collection('users').doc(context.auth.uid).get();
			const storedSubscriptionId = String(
				userDoc.data()?.subscription?.stripeSubscriptionId || '',
			).trim();
			if (!userDoc.exists || storedSubscriptionId !== String(subscriptionId)) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'This subscription does not belong to the signed-in account.',
				);
			}
			const subscription = await getStripe().subscriptions.retrieve(
				subscriptionId,
				{ expand: ['discounts'] },
			);
			return {
				id: subscription.id,
				status: subscription.status,
				billingDisclosure: await buildStripeBillingDisclosure(
					getStripe(),
					subscription,
				),
			};
		} catch (error) {
			if (error instanceof functions.https.HttpsError) throw error;
			console.error('Error getting subscription details:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to get subscription details',
			);
		}
	});

/**
 * Sync current authenticated user's subscription from Stripe.
 * Backstop for missed webhook deliveries or manual Stripe dashboard edits.
 */
export const syncSubscriptionFromStripe = functions
	.runWith({ secrets: STRIPE_FUNCTION_SECRETS })
	.https.onCall(async (_data, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const userId = context.auth.uid;
		const userRef = db.collection('users').doc(userId);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'User not found');
		}

		const userData = userDoc.data() || {};
		const existingSubscription = (userData.subscription || {}) as Record<
			string,
			any
		>;
		const stripeCustomerId = String(existingSubscription.stripeCustomerId || '');
		const existingStripeSubscriptionId = String(
			existingSubscription.stripeSubscriptionId || '',
		);

		if (!stripeCustomerId && !existingStripeSubscriptionId) {
			return {
				success: false,
				reason: 'No Stripe customer/subscription IDs found for user',
			};
		}

		let stripeSubscription: Stripe.Subscription | null = null;

		if (
			existingStripeSubscriptionId &&
			existingStripeSubscriptionId !== 'YOUR_SUBSCRIPTION_ID_HERE'
		) {
			try {
				stripeSubscription = await getStripe().subscriptions.retrieve(
					existingStripeSubscriptionId,
					{ expand: ['discounts'] },
				);
			} catch (error) {
				console.warn(
					`Unable to retrieve Stripe subscription ${existingStripeSubscriptionId}; falling back to customer listing.`,
				);
			}
		}

		if (!stripeSubscription && stripeCustomerId) {
			const subscriptions = await getStripe().subscriptions.list({
				customer: stripeCustomerId,
				status: 'all',
				limit: 10,
			});

			stripeSubscription =
				subscriptions.data.find((sub) =>
					['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status),
				) || subscriptions.data[0] || null;
		}

		if (!stripeSubscription) {
			return {
				success: false,
				reason: 'No Stripe subscription found for this user',
			};
		}

		const localStatus =
			stripeSubscription.status === 'active'
				? 'active'
				: stripeSubscription.status === 'trialing'
					? 'trial'
					: stripeSubscription.status === 'past_due'
						? 'past_due'
						: stripeSubscription.status === 'canceled'
							? 'cancelled'
							: String(stripeSubscription.status || 'expired');

		const currentPriceId =
			stripeSubscription.items.data[0]?.price?.id ||
			existingSubscription.currentPriceId ||
			'';
		const billingDisclosure = await buildStripeBillingDisclosure(
			getStripe(),
			stripeSubscription,
		);

		const subscriptionPatch = removeUndefinedFields({
			status: localStatus,
			plan: getPlanFromPriceId(
				String(currentPriceId),
				String(existingSubscription.plan || 'homeowner'),
			),
			currentPeriodStart: stripeSubscription.current_period_start,
			currentPeriodEnd: stripeSubscription.current_period_end,
			trialEndsAt: stripeSubscription.trial_end,
			stripeCustomerId: String(stripeSubscription.customer || stripeCustomerId),
			stripeSubscriptionId: stripeSubscription.id,
			cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
			pendingCheckoutPlan: null,
			pendingCheckoutStartedAt: null,
			billingDisclosure,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			...(stripeSubscription.status === 'canceled'
				? { canceledAt: stripeSubscription.canceled_at }
				: {}),
		});

		const mergedSubscription = buildMergedSubscription(
			existingSubscription,
			subscriptionPatch,
		);

		await userRef.update({
			subscription: mergedSubscription,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		await syncFamilyAccountSubscription(userData, mergedSubscription);

		return {
			success: true,
			source: 'stripe-sync-fallback',
			subscription: subscriptionPatch,
		};
	});

/**
 * Handle Stripe Webhook Events
 * POST /stripe/webhook
 */
export const stripeWebhook = functions
	.runWith({ secrets: STRIPE_WEBHOOK_SECRETS })
	.https.onRequest(async (req, res) => {
		const signatureHeader = req.headers['stripe-signature'];
		const sig = Array.isArray(signatureHeader)
			? signatureHeader[0]
			: signatureHeader;
		const webhookSecret = resolveStripeWebhookSecret();

		if (!webhookSecret) {
			console.error('STRIPE_WEBHOOK_SECRET is not configured.');
			res.status(500).send('Webhook secret not configured');
			return;
		}

		if (!sig) {
			res.status(400).send('Webhook Error: Missing stripe-signature header');
			return;
		}

		if (!req.rawBody || req.rawBody.length === 0) {
			console.error('Webhook Error: Missing raw request body for signature verification');
			res
				.status(400)
				.send('Webhook Error: Missing raw request body for signature verification');
			return;
		}

		try {
			const event = getStripe().webhooks.constructEvent(
				req.rawBody,
				sig,
				webhookSecret,
			);

			console.log('Received Stripe webhook event:', event.type);

			switch (event.type) {
				case 'customer.subscription.created':
					await handleSubscriptionCreated(event.data.object);
					break;
				case 'customer.subscription.updated':
					await handleSubscriptionUpdate(event.data.object);
					break;
				case 'customer.subscription.deleted':
					await handleSubscriptionCancellation(event.data.object);
					break;
				case 'customer.subscription.paused':
					await handleSubscriptionPaused(event.data.object);
					break;
				case 'customer.subscription.resumed':
					await handleSubscriptionResumed(event.data.object);
					break;
				case 'invoice.created':
					await handleInvoiceCreated(event.data.object);
					break;
				case 'invoice.finalized':
					await handleInvoiceFinalized(event.data.object);
					break;
				case 'invoice.upcoming':
					await handleInvoiceUpcoming(event.data.object);
					break;
				case 'invoice.payment_succeeded':
					await handlePaymentSuccess(event.data.object);
					break;
				case 'invoice.payment_failed':
					await handlePaymentFailure(event.data.object);
					break;
				case 'invoice.payment_action_required':
					await handlePaymentActionRequired(event.data.object);
					break;
				case 'payment_method.attached':
					await handlePaymentMethodAttached(event.data.object);
					break;
				case 'payment_method.detached':
					await handlePaymentMethodDetached(event.data.object);
					break;
				case 'customer.discount.created':
					await handleDiscountCreated(event.data.object);
					break;
				case 'customer.discount.deleted':
					await handleDiscountDeleted(event.data.object);
					break;
				default:
					console.log('Unhandled Stripe event type:', event.type);
			}

			res.json({ received: true });
		} catch (error) {
			const webhookError = error as { message?: string };
			const message = webhookError?.message || 'Unknown webhook error';
			console.error('Webhook error:', message);
			res.status(400).send(`Webhook Error: ${message}`);
		}
	});

/**
 * Handle subscription updates from Stripe webhooks
 */
const handleSubscriptionUpdate = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			const authoritativeSubscription = await getStripe().subscriptions.retrieve(
				subscription.id,
				{ expand: ['discounts'] },
			);
			const billingDisclosure = await buildStripeBillingDisclosure(
				getStripe(),
				authoritativeSubscription,
			);

			// Update subscription data
			const subscriptionData: any = {
				status:
					subscription.status === 'active'
						? 'active'
						: subscription.status === 'trialing'
							? 'trial'
							: subscription.status,
				plan: getPlanFromPriceId(
					subscription.items.data[0].price.id,
					userData?.subscription?.plan || 'homeowner',
				),
				currentPeriodStart: subscription.current_period_start,
				currentPeriodEnd: subscription.current_period_end,
				trialEndsAt: subscription.trial_end,
				stripeSubscriptionId: subscription.id,
				cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
				pendingCheckoutPlan: null,
				pendingCheckoutStartedAt: null,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				billingDisclosure,
			};

			// Check if this is a pre-scheduled subscription
			if (
				subscription.metadata?.preScheduled === 'true' &&
				subscription.status === 'trialing'
			) {
				subscriptionData.scheduledPlan = subscriptionData.plan;
				subscriptionData.hasScheduledSubscription = true;
				console.log('Pre-scheduled subscription detected:', {
					plan: subscriptionData.plan,
					trialEnd: subscription.trial_end,
				});
			}

			const sanitizedSubscriptionData = removeUndefinedFields(subscriptionData);
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				sanitizedSubscriptionData,
			);

			await userDoc.ref.update({
				subscription: mergedSubscription,
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			console.log('Subscription updated for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription update:', error);
	}
};

/**
 * Handle subscription cancellations from Stripe webhooks
 */
const handleSubscriptionCancellation = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			const billingDisclosure = await buildStripeBillingDisclosure(
				getStripe(),
				subscription as Stripe.Subscription,
			);
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				{
					status: 'cancelled',
					canceledAt: subscription.canceled_at,
					cancelAtPeriodEnd: false,
					billingDisclosure,
				},
			);

			await userDoc.ref.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			console.log('Subscription cancelled for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription cancellation:', error);
	}
};

/**
 * Handle successful payments from Stripe webhooks
 */
const handlePaymentSuccess = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Update subscription period dates
			const subscriptionData = {
				currentPeriodStart: invoice.period_start,
				currentPeriodEnd: invoice.period_end,
				status: 'active', // Ensure status is active after successful payment
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			const sanitizedSubscriptionData = removeUndefinedFields(subscriptionData);
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				sanitizedSubscriptionData,
			);

			await userDoc.ref.update({
				subscription: mergedSubscription,
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			console.log('Payment succeeded for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling payment success:', error);
	}
};

/**
 * Handle failed payments from Stripe webhooks
 */
const handlePaymentFailure = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Mark subscription as past due or cancelled based on retry attempts
			const newStatus = invoice.attempt_count >= 3 ? 'cancelled' : 'past_due';
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				{ status: newStatus },
			);

			await userDoc.ref.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			console.log(
				`Payment failed for user: ${userDoc.id}, status: ${newStatus}`,
			);
		}
	} catch (error) {
		console.error('Error handling payment failure:', error);
	}
};

/**
 * Handle subscription creation from Stripe webhooks
 */
const handleSubscriptionCreated = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			const authoritativeSubscription = await getStripe().subscriptions.retrieve(
				subscription.id,
				{ expand: ['discounts'] },
			);
			const billingDisclosure = await buildStripeBillingDisclosure(
				getStripe(),
				authoritativeSubscription,
			);

			// Update subscription data
			const subscriptionData: any = {
				status:
					subscription.status === 'active'
						? 'active'
						: subscription.status === 'trialing'
							? 'trial'
							: subscription.status,
				plan: getPlanFromPriceId(
					subscription.items.data[0].price.id,
					userData?.subscription?.plan || 'homeowner',
				),
				currentPeriodStart: subscription.current_period_start,
				currentPeriodEnd: subscription.current_period_end,
				trialEndsAt: subscription.trial_end,
				stripeSubscriptionId: subscription.id,
				cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
				pendingCheckoutPlan: null,
				pendingCheckoutStartedAt: null,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				billingDisclosure,
			};

			// Check if this is a pre-scheduled subscription
			if (
				subscription.metadata?.preScheduled === 'true' &&
				subscription.status === 'trialing'
			) {
				subscriptionData.scheduledPlan = subscriptionData.plan;
				subscriptionData.hasScheduledSubscription = true;
				console.log('Pre-scheduled subscription created:', {
					plan: subscriptionData.plan,
					trialEnd: subscription.trial_end,
				});
			}

			const sanitizedSubscriptionData = removeUndefinedFields(subscriptionData);
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				sanitizedSubscriptionData,
			);

			await userDoc.ref.update({
				subscription: mergedSubscription,
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			console.log(
				'New subscription created for user:',
				userDoc.id,
				'Plan:',
				subscriptionData.plan,
				'Status:',
				subscriptionData.status,
			);
		} else {
			console.error('No user found with customer ID:', subscription.customer);
		}
	} catch (error) {
		console.error('Error handling subscription creation:', error);
	}
};

/**
 * Handle subscription pausing from Stripe webhooks
 */
const handleSubscriptionPaused = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				{ status: 'paused' },
			);
			await userDoc.ref.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			await syncFamilyAccountSubscription(userData, mergedSubscription);
			console.log('Subscription paused for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription pause:', error);
	}
};

/**
 * Handle subscription resumption from Stripe webhooks
 */
const handleSubscriptionResumed = async (subscription: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', subscription.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				{ status: 'active' },
			);
			await userDoc.ref.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			await syncFamilyAccountSubscription(userData, mergedSubscription);
			console.log('Subscription resumed for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling subscription resume:', error);
	}
};

/**
 * Handle invoice creation from Stripe webhooks
 */
const handleInvoiceCreated = async (invoice: any) => {
	try {
		// Could send invoice preview emails or log for analytics
		console.log('Invoice created:', invoice.id, 'Amount:', invoice.amount_due);
	} catch (error) {
		console.error('Error handling invoice creation:', error);
	}
};

/**
 * Handle invoice finalization from Stripe webhooks
 */
const handleInvoiceFinalized = async (invoice: any) => {
	try {
		// Invoice is finalized and ready for payment
		console.log(
			'Invoice finalized:',
			invoice.id,
			'Amount:',
			invoice.amount_due,
		);
	} catch (error) {
		console.error('Error handling invoice finalization:', error);
	}
};

/**
 * Handle upcoming invoice notifications from Stripe webhooks
 */
const handleInvoiceUpcoming = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();

			// Could send advance billing notification email here
			console.log(
				'Upcoming invoice for user:',
				userDoc.id,
				'Amount:',
				invoice.amount_due,
				'Due:',
				invoice.due_date,
			);
		}
	} catch (error) {
		console.error('Error handling upcoming invoice:', error);
	}
};

/**
 * Handle payment action required from Stripe webhooks
 */
const handlePaymentActionRequired = async (invoice: any) => {
	try {
		// Find user by Stripe customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', invoice.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			const userData = userDoc.data();
			const mergedSubscription = buildMergedSubscription(
				userData.subscription,
				{
					status: 'incomplete',
					paymentActionRequired: true,
				},
			);

			// Mark subscription as requiring payment action
			await userDoc.ref.update({
				subscription: mergedSubscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			await syncFamilyAccountSubscription(userData, mergedSubscription);

			console.log('Payment action required for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling payment action required:', error);
	}
};

/**
 * Handle payment method attachment from Stripe webhooks
 */
const handlePaymentMethodAttached = async (paymentMethod: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', paymentMethod.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(
				'Payment method attached for user:',
				userDoc.id,
				'Type:',
				paymentMethod.type,
			);
		}
	} catch (error) {
		console.error('Error handling payment method attachment:', error);
	}
};

/**
 * Handle payment method detachment from Stripe webhooks
 */
const handlePaymentMethodDetached = async (paymentMethod: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', paymentMethod.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(
				'Payment method detached for user:',
				userDoc.id,
				'Type:',
				paymentMethod.type,
			);
		}
	} catch (error) {
		console.error('Error handling payment method detachment:', error);
	}
};

/**
 * Handle discount creation from Stripe webhooks
 */
const refreshBillingDisclosureForDiscountEvent = async (
	userDoc: admin.firestore.QueryDocumentSnapshot,
	discount: any,
): Promise<void> => {
	const userData = userDoc.data();
	const storedSubscriptionId = String(
		userData?.subscription?.stripeSubscriptionId || '',
	).trim();
	const eventSubscriptionId =
		typeof discount?.subscription === 'string'
			? discount.subscription
			: discount?.subscription?.id || '';
	const subscriptionId = eventSubscriptionId || storedSubscriptionId;
	if (!subscriptionId) return;

	const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
		expand: ['discounts'],
	});
	const billingDisclosure = await buildStripeBillingDisclosure(
		getStripe(),
		subscription,
	);
	const mergedSubscription = buildMergedSubscription(userData.subscription, {
		billingDisclosure,
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	await userDoc.ref.update({
		subscription: mergedSubscription,
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	});
	await syncFamilyAccountSubscription(userData, mergedSubscription);
};

const handleDiscountCreated = async (discount: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', discount.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			await refreshBillingDisclosureForDiscountEvent(userDoc, discount);
			console.log(
				'Discount applied for user:',
				userDoc.id,
				'Coupon:',
				discount.coupon?.id,
			);
		}
	} catch (error) {
		console.error('Error handling discount creation:', error);
	}
};

/**
 * Handle discount deletion from Stripe webhooks
 */
const handleDiscountDeleted = async (discount: any) => {
	try {
		// Find user by customer ID
		const userQuery = await db
			.collection('users')
			.where('subscription.stripeCustomerId', '==', discount.customer)
			.get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			await refreshBillingDisclosureForDiscountEvent(userDoc, discount);
			console.log('Discount removed for user:', userDoc.id);
		}
	} catch (error) {
		console.error('Error handling discount deletion:', error);
	}
};

/**
 * Helper function to map Stripe price ID to plan name
 */
function getPlanFromPriceId(
	priceId: string,
	fallbackPlan: string = 'homeowner',
): string {
	const homeownerPlusPriceIds = [
		readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId),
		readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId),
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID'),
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID'),
		readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID'),
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID'),
	].filter(Boolean) as string[];

	const propertyPriceIds = [
		readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId),
		readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId),
		readEnv('REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID'),
		readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID'),
		readEnv('STRIPE_PROPERTY_PRICE_ID'),
		readEnv('REACT_APP_STRIPE_PROPERTY_PLAN_ID'),
	].filter(Boolean) as string[];

	const multiHomeownerPriceIds = [
		readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerMonthlyPriceId),
		readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerAnnualPriceId),
	].filter(Boolean) as string[];

	const portfolioPriceIds = [
		readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId),
		readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId),
		readEnv('REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID'),
		readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID'),
		readEnv('STRIPE_PORTFOLIO_PRICE_ID'),
		readEnv('REACT_APP_STRIPE_PORTFOLIO_PLAN_ID'),
	].filter(Boolean) as string[];

	const priceMap: Record<string, string> = {
		...Object.fromEntries(
			homeownerPlusPriceIds.map((id) => [id, 'homeowner_plus']),
		),
		...Object.fromEntries(
			multiHomeownerPriceIds.map((id) => [id, 'multi_homeowner']),
		),
		...Object.fromEntries(propertyPriceIds.map((id) => [id, 'property'])),
		...Object.fromEntries(portfolioPriceIds.map((id) => [id, 'portfolio'])),
	};

	return priceMap[priceId] || fallbackPlan;
}

/**
 * Helper function to map plan name to Stripe price ID
 */
function getPriceIdFromPlan(
	plan: string,
	billingCycle: 'month' | 'year' = 'month',
): string {
	const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';
	const homeownerPlusPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId) ||
		readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID') ||
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID') ||
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID') ||
		'';
	const homeownerPlusAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId) ||
		readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID') ||
		homeownerPlusPriceId;
	const propertyPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId) ||
		readEnv('STRIPE_PROPERTY_PRICE_ID') ||
		'';
	const propertyAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId) ||
		readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID') ||
		propertyPriceId;
	const multiHomeownerPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerMonthlyPriceId) || '';
	const multiHomeownerAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerAnnualPriceId) ||
		multiHomeownerPriceId;
	const portfolioPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId) ||
		readEnv('STRIPE_PORTFOLIO_PRICE_ID') ||
		'';
	const portfolioAnnualPriceId =
		readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId) ||
		readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID') ||
		portfolioPriceId;

	const monthlyPlanMap: Record<string, string> = {
		homeowner_plus: homeownerPlusPriceId,
		multi_homeowner: multiHomeownerPriceId,
		property: propertyPriceId,
		portfolio: portfolioPriceId,
	};

	const annualPlanMap: Record<string, string> = {
		homeowner_plus: homeownerPlusAnnualPriceId,
		multi_homeowner: multiHomeownerAnnualPriceId,
		property: propertyAnnualPriceId,
		portfolio: portfolioAnnualPriceId,
	};

	return (normalizedCycle === 'year' ? annualPlanMap : monthlyPlanMap)[plan] || '';
}
