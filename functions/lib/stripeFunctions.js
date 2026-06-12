"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.syncSubscriptionFromStripe = exports.getSubscriptionDetails = exports.cancelSubscription = exports.verifyCheckoutSession = exports.createTrialSubscription = exports.validatePromotionCode = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
if (!admin.apps.length) {
    admin.initializeApp();
}
// Initialize Stripe lazily to avoid accessing secrets at deployment time
let stripe = null;
const sanitizeSecret = (value) => {
    return value
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .trim();
};
const getLegacyStripeConfig = () => {
    var _a, _b;
    try {
        const legacyConfig = (_b = (_a = functions).config) === null || _b === void 0 ? void 0 : _b.call(_a);
        return ((legacyConfig === null || legacyConfig === void 0 ? void 0 : legacyConfig.stripe) || {});
    }
    catch (error) {
        return {};
    }
};
const normalizePromoCode = (value) => {
    return sanitizeSecret(String(value || ''));
};
const resolveStripeSecretKey = () => {
    var _a, _b, _c;
    let secretFromManager = '';
    try {
        secretFromManager = STRIPE_SECRET_KEY.value() || '';
    }
    catch (error) {
        console.warn('Unable to read STRIPE_SECRET_KEY from Secret Manager');
    }
    let secretFromFunctionsConfig = '';
    try {
        const legacyConfig = (_b = (_a = functions).config) === null || _b === void 0 ? void 0 : _b.call(_a);
        secretFromFunctionsConfig = ((_c = legacyConfig === null || legacyConfig === void 0 ? void 0 : legacyConfig.stripe) === null || _c === void 0 ? void 0 : _c.secret_key) || '';
    }
    catch (error) {
        console.warn('Legacy functions.config() is unavailable in this runtime');
    }
    const secretFromEnv = process.env.STRIPE_SECRET_KEY || '';
    return sanitizeSecret(secretFromManager || secretFromFunctionsConfig || secretFromEnv);
};
const resolveStripeWebhookSecret = () => {
    let secretFromManager = '';
    try {
        secretFromManager = STRIPE_WEBHOOK_SECRET.value() || '';
    }
    catch (error) {
        console.warn('Unable to read STRIPE_WEBHOOK_SECRET from Secret Manager');
    }
    const secretFromEnv = process.env.STRIPE_WEBHOOK_SECRET || '';
    return sanitizeSecret(secretFromManager || secretFromEnv);
};
const getStripe = () => {
    if (!stripe) {
        const stripeSecretKey = resolveStripeSecretKey();
        if (!stripeSecretKey) {
            throw new Error('Stripe secret key is not configured. Set STRIPE_SECRET_KEY (Secret Manager) or stripe.secret_key (functions config).');
        }
        stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
        console.log('Stripe key loaded: YES');
    }
    return stripe;
};
const resolvePriceIdForPlan = (planId, billingCycle = 'month') => {
    const normalizedPlan = String(planId || '').trim().toLowerCase();
    const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';
    const legacyStripe = getLegacyStripeConfig();
    const homePriceId = sanitizeSecret(process.env.STRIPE_HOME_MONTHLY_PRICE_ID || '') ||
        sanitizeSecret(process.env.STRIPE_HOME_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.home_monthly_price_id || '') ||
        sanitizeSecret(legacyStripe.home_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOME_PLAN_ID || '') ||
        sanitizeSecret(process.env.STRIPE_HOMEOWNER_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.homeowner_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID || '');
    const homeAnnualPriceId = sanitizeSecret(process.env.STRIPE_HOME_ANNUAL_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.home_annual_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOME_ANNUAL_PLAN_ID || '');
    const homeownerLegacyPriceId = sanitizeSecret(process.env.STRIPE_HOMEOWNER_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.homeowner_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID || '');
    const homeownerPlusPriceId = sanitizeSecret(process.env.STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID || '') ||
        sanitizeSecret(process.env.STRIPE_HOMEOWNER_PLUS_PRICE_ID || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID || '');
    const homeownerPlusAnnualPriceId = sanitizeSecret(process.env.STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID || '');
    const propertyPriceId = sanitizeSecret(process.env.STRIPE_PROPERTY_MONTHLY_PRICE_ID || '') ||
        sanitizeSecret(process.env.STRIPE_PROPERTY_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.property_monthly_price_id || '') ||
        sanitizeSecret(legacyStripe.property_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID || '') ||
        sanitizeSecret(process.env.STRIPE_BASIC_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.basic_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_BASIC_PLAN_ID || '');
    const propertyAnnualPriceId = sanitizeSecret(process.env.STRIPE_PROPERTY_ANNUAL_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.property_annual_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID || '');
    const basicLegacyPriceId = sanitizeSecret(process.env.STRIPE_BASIC_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.basic_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_BASIC_PLAN_ID || '');
    const portfolioPriceId = sanitizeSecret(process.env.STRIPE_PORTFOLIO_MONTHLY_PRICE_ID || '') ||
        sanitizeSecret(process.env.STRIPE_PORTFOLIO_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.portfolio_monthly_price_id || '') ||
        sanitizeSecret(legacyStripe.portfolio_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID || '') ||
        sanitizeSecret(process.env.STRIPE_PROFESSIONAL_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.professional_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID || '');
    const portfolioAnnualPriceId = sanitizeSecret(process.env.STRIPE_PORTFOLIO_ANNUAL_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.portfolio_annual_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID || '');
    const professionalLegacyPriceId = sanitizeSecret(process.env.STRIPE_PROFESSIONAL_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.professional_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID || '');
    const freePriceId = sanitizeSecret(process.env.STRIPE_FREE_PRICE_ID || '') ||
        sanitizeSecret(legacyStripe.free_price_id || '') ||
        sanitizeSecret(process.env.REACT_APP_STRIPE_FREE_PLAN_ID || '');
    const monthlyPriceMap = {
        home: homePriceId,
        homeowner_plus: homeownerPlusPriceId,
        property: propertyPriceId,
        portfolio: portfolioPriceId,
        // Legacy aliases
        homeowner: homePriceId || homeownerLegacyPriceId,
        homeownerplus: homeownerPlusPriceId,
        'homeowner+': homeownerPlusPriceId,
        basic: propertyPriceId || basicLegacyPriceId,
        professional: portfolioPriceId || professionalLegacyPriceId,
        free: freePriceId,
        guest: freePriceId,
        tenant: freePriceId,
    };
    const annualPriceMap = {
        home: homeAnnualPriceId || homePriceId,
        homeowner_plus: homeownerPlusAnnualPriceId || homeownerPlusPriceId,
        property: propertyAnnualPriceId || propertyPriceId,
        portfolio: portfolioAnnualPriceId || portfolioPriceId,
        // Legacy aliases
        homeowner: homeAnnualPriceId || homePriceId || homeownerLegacyPriceId,
        homeownerplus: homeownerPlusAnnualPriceId || homeownerPlusPriceId,
        'homeowner+': homeownerPlusAnnualPriceId || homeownerPlusPriceId,
        basic: propertyAnnualPriceId || propertyPriceId || basicLegacyPriceId,
        professional: portfolioAnnualPriceId ||
            portfolioPriceId ||
            professionalLegacyPriceId,
        free: freePriceId,
        guest: freePriceId,
        tenant: freePriceId,
    };
    return ((normalizedCycle === 'year' ? annualPriceMap : monthlyPriceMap)[normalizedPlan] || '');
};
const resolvePromotionCodeId = async (promoCode) => {
    var _a;
    if (!promoCode) {
        return null;
    }
    const promotionCodes = await getStripe().promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
    });
    return ((_a = promotionCodes.data[0]) === null || _a === void 0 ? void 0 : _a.id) || null;
};
const db = admin.firestore();
const removeUndefinedFields = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
};
const buildMergedSubscription = (existingSubscription, patch) => {
    return removeUndefinedFields({
        ...(existingSubscription || {}),
        ...patch,
    });
};
const toLocalSubscriptionStatus = (stripeStatus) => {
    if (stripeStatus === 'active')
        return 'active';
    if (stripeStatus === 'trialing')
        return 'trial';
    if (stripeStatus === 'canceled')
        return 'cancelled';
    return stripeStatus || 'expired';
};
const findReusableSubscription = async (customerId, existingSubscriptionId) => {
    const reusableStatuses = new Set(['active', 'trialing', 'past_due', 'incomplete']);
    if (existingSubscriptionId) {
        try {
            const subscription = await getStripe().subscriptions.retrieve(existingSubscriptionId);
            if (reusableStatuses.has(subscription.status)) {
                return subscription;
            }
        }
        catch (error) {
            console.warn(`Unable to retrieve existing Stripe subscription ${existingSubscriptionId}; falling back to customer subscription lookup.`, error);
        }
    }
    const subscriptions = await getStripe().subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
    });
    return (subscriptions.data.find((subscription) => reusableStatuses.has(subscription.status)) || null);
};
const syncFamilyAccountSubscription = async (userData, subscription) => {
    const accountId = userData === null || userData === void 0 ? void 0 : userData.accountId;
    if (!accountId) {
        return;
    }
    try {
        await db
            .collection('familyAccounts')
            .doc(accountId)
            .set({
            subscription: removeUndefinedFields(subscription),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    catch (error) {
        console.warn(`Failed to sync family account subscription for account ${accountId}:`, error);
    }
};
/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 * Body: { priceId, userId, email, successUrl, cancelUrl }
 */
exports.createCheckoutSession = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId: legacyPriceId, planId, billingCycle, userId, email, successUrl, cancelUrl, promoCode: requestedPromoCode, } = data;
    const normalizedPlanId = String(planId || '').trim().toLowerCase();
    const resolvedPlanPriceId = resolvePriceIdForPlan(normalizedPlanId, String(billingCycle || '').toLowerCase() === 'year' ? 'year' : 'month');
    const resolvedPriceId = normalizedPlanId
        ? resolvedPlanPriceId
        : sanitizeSecret(String(legacyPriceId || ''));
    if (!resolvedPriceId || !userId || !email) {
        throw new functions.https.HttpsError('invalid-argument', `Missing required Stripe configuration: no price ID resolved for plan '${String(planId || '')}'. Configure STRIPE_*_PRICE_ID in functions environment.`);
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
        const userData = userDoc.data();
        console.log('User data retrieved:', userData);
        const accountPromoCode = normalizePromoCode(requestedPromoCode || ((_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.promoCode));
        let promotionCodeId = null;
        if (accountPromoCode) {
            promotionCodeId = await resolvePromotionCodeId(accountPromoCode);
            if (!promotionCodeId) {
                console.warn(`Promo code '${accountPromoCode}' was provided but no active Stripe Promotion Code was found. Proceeding without discount.`);
            }
        }
        let customerId = (_b = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _b === void 0 ? void 0 : _b.stripeCustomerId;
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
        const existingSubscription = await findReusableSubscription(customerId, sanitizeSecret(String(((_c = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _c === void 0 ? void 0 : _c.stripeSubscriptionId) || '')));
        if (existingSubscription) {
            const subscriptionItem = existingSubscription.items.data[0];
            if (!(subscriptionItem === null || subscriptionItem === void 0 ? void 0 : subscriptionItem.id)) {
                throw new functions.https.HttpsError('failed-precondition', 'Existing Stripe subscription has no subscription item to update.');
            }
            console.log('Updating existing Stripe subscription instead of creating a new one:', {
                subscriptionId: existingSubscription.id,
                subscriptionItemId: subscriptionItem.id,
                currentPriceId: (_d = subscriptionItem.price) === null || _d === void 0 ? void 0 : _d.id,
                newPriceId: resolvedPriceId,
            });
            const updatedSubscription = await getStripe().subscriptions.update(existingSubscription.id, {
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
            });
            const updatedPriceId = ((_f = (_e = updatedSubscription.items.data[0]) === null || _e === void 0 ? void 0 : _e.price) === null || _f === void 0 ? void 0 : _f.id) || resolvedPriceId;
            const subscriptionData = removeUndefinedFields({
                status: toLocalSubscriptionStatus(updatedSubscription.status),
                plan: getPlanFromPriceId(updatedPriceId, normalizedPlanId || ((_g = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _g === void 0 ? void 0 : _g.plan) || 'home'),
                currentPeriodStart: updatedSubscription.current_period_start,
                currentPeriodEnd: updatedSubscription.current_period_end,
                trialEndsAt: updatedSubscription.trial_end,
                stripeCustomerId: String(updatedSubscription.customer || customerId),
                stripeSubscriptionId: updatedSubscription.id,
                hasScheduledSubscription: false,
                scheduledPlan: null,
                ...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
            });
            const mergedSubscription = buildMergedSubscription(userData === null || userData === void 0 ? void 0 : userData.subscription, subscriptionData);
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
    }
    catch (error) {
        const stripeError = error;
        console.error('Error creating checkout session:', {
            message: stripeError === null || stripeError === void 0 ? void 0 : stripeError.message,
            code: stripeError === null || stripeError === void 0 ? void 0 : stripeError.code,
            type: stripeError === null || stripeError === void 0 ? void 0 : stripeError.type,
        });
        if ((_h = stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) === null || _h === void 0 ? void 0 : _h.includes('No such price')) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe price ID is invalid. Verify REACT_APP_STRIPE_*_PLAN_ID values and deployed function config.');
        }
        if ((_j = stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) === null || _j === void 0 ? void 0 : _j.includes('Invalid API Key')) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key is invalid or missing in backend configuration.');
        }
        throw new functions.https.HttpsError('internal', (stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) || 'Failed to create checkout session');
    }
});
/**
 * Validate Stripe Promotion Code
 * Callable body: { promoCode }
 */
exports.validatePromotionCode = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (data) => {
    const normalizedPromoCode = normalizePromoCode(data === null || data === void 0 ? void 0 : data.promoCode).toLowerCase();
    if (!normalizedPromoCode) {
        throw new functions.https.HttpsError('invalid-argument', 'promoCode is required');
    }
    try {
        const promotionCodes = await getStripe().promotionCodes.list({
            code: normalizedPromoCode,
            active: true,
            limit: 1,
        });
        const match = promotionCodes.data[0];
        const couponRef = match === null || match === void 0 ? void 0 : match.coupon;
        const couponId = typeof couponRef === 'string' ? couponRef : (couponRef === null || couponRef === void 0 ? void 0 : couponRef.id) || null;
        return {
            valid: Boolean(match),
            code: normalizedPromoCode,
            promotionCodeId: (match === null || match === void 0 ? void 0 : match.id) || null,
            couponId,
            message: match
                ? 'Promo code is valid.'
                : 'Invalid or expired promo code.',
        };
    }
    catch (error) {
        const stripeError = error;
        console.error('Error validating promotion code:', {
            message: stripeError === null || stripeError === void 0 ? void 0 : stripeError.message,
            code: stripeError === null || stripeError === void 0 ? void 0 : stripeError.code,
            type: stripeError === null || stripeError === void 0 ? void 0 : stripeError.type,
        });
        throw new functions.https.HttpsError('internal', (stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) || 'Failed to validate promo code');
    }
});
/**
 * Create Trial Subscription in Stripe
 * POST /api/create-trial-subscription
 * Body: { priceId, userId, email, trialDays }
 */
exports.createTrialSubscription = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (data, context) => {
    var _a;
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId: legacyPriceId, planId, promoCode, userId, email, trialDays = 30, } = data;
    const normalizedPromoCode = normalizePromoCode(promoCode);
    const resolvedPriceId = resolvePriceIdForPlan(String(planId || '')) ||
        sanitizeSecret(String(legacyPriceId || ''));
    if (!resolvedPriceId || !userId || !email) {
        throw new functions.https.HttpsError('invalid-argument', `Missing required Stripe configuration: no price ID resolved for plan '${String(planId || '')}'. Configure STRIPE_*_PRICE_ID in functions environment.`);
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
        let customerId = (_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
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
    }
    catch (error) {
        console.error('Error creating trial subscription:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create trial subscription');
    }
});
/**
 * Verify Checkout Session Success
 * POST /api/verify-checkout-session
 * Body: { sessionId }
 */
exports.verifyCheckoutSession = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { sessionId } = data;
    if (!sessionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Session ID is required');
    }
    try {
        // Retrieve session from Stripe
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        const normalizedPaymentStatus = String(session.payment_status || '').toLowerCase();
        const acceptablePaymentStatuses = ['paid', 'no_payment_required'];
        if (!acceptablePaymentStatuses.includes(normalizedPaymentStatus)) {
            throw new functions.https.HttpsError('failed-precondition', `Payment not completed (status: ${normalizedPaymentStatus || 'unknown'})`);
        }
        const firebaseUID = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.firebaseUID;
        if (!firebaseUID) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid session metadata');
        }
        // Get subscription details
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        // Update user subscription in Firestore
        const subscriptionData = {
            status: 'active',
            plan: getPlanFromPriceId(subscription.items.data[0].price.id),
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            trialEndsAt: subscription.trial_end,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
        };
        const userRef = db.collection('users').doc(firebaseUID);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const mergedSubscription = buildMergedSubscription(userData === null || userData === void 0 ? void 0 : userData.subscription, subscriptionData);
        await userRef.update({
            subscription: mergedSubscription,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await syncFamilyAccountSubscription(userData, mergedSubscription);
        return { success: true, subscription: subscriptionData };
    }
    catch (error) {
        console.error('Error verifying checkout session:', error);
        throw new functions.https.HttpsError('internal', 'Failed to verify checkout session');
    }
});
/**
 * Cancel Subscription
 * POST /api/cancel-subscription
 * Body: { subscriptionId }
 */
exports.cancelSubscription = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = data;
    if (!subscriptionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        // Cancel subscription in Stripe
        const subscription = await getStripe().subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        // Update user subscription status
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeSubscriptionId', '==', subscriptionId)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const mergedSubscription = buildMergedSubscription(userData.subscription, {
                status: 'cancelled',
                canceledAt: subscription.cancel_at,
            });
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
        }
        return { success: true, cancelAt: subscription.cancel_at };
    }
    catch (error) {
        console.error('Error canceling subscription:', error);
        throw new functions.https.HttpsError('internal', 'Failed to cancel subscription');
    }
});
/**
 * Get Subscription Details
 * GET /api/subscription-details/:subscriptionId
 */
exports.getSubscriptionDetails = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = data;
    if (!subscriptionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        return subscription;
    }
    catch (error) {
        console.error('Error getting subscription details:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get subscription details');
    }
});
/**
 * Sync current authenticated user's subscription from Stripe.
 * Backstop for missed webhook deliveries or manual Stripe dashboard edits.
 */
exports.syncSubscriptionFromStripe = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
    .https.onCall(async (_data, context) => {
    var _a, _b, _c;
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }
    const userData = userDoc.data() || {};
    const existingSubscription = (userData.subscription || {});
    const stripeCustomerId = String(existingSubscription.stripeCustomerId || '');
    const existingStripeSubscriptionId = String(existingSubscription.stripeSubscriptionId || '');
    if (!stripeCustomerId && !existingStripeSubscriptionId) {
        return {
            success: false,
            reason: 'No Stripe customer/subscription IDs found for user',
        };
    }
    let stripeSubscription = null;
    if (existingStripeSubscriptionId &&
        existingStripeSubscriptionId !== 'YOUR_SUBSCRIPTION_ID_HERE') {
        try {
            stripeSubscription = await getStripe().subscriptions.retrieve(existingStripeSubscriptionId);
        }
        catch (error) {
            console.warn(`Unable to retrieve Stripe subscription ${existingStripeSubscriptionId}; falling back to customer listing.`);
        }
    }
    if (!stripeSubscription && stripeCustomerId) {
        const subscriptions = await getStripe().subscriptions.list({
            customer: stripeCustomerId,
            status: 'all',
            limit: 10,
        });
        stripeSubscription =
            subscriptions.data.find((sub) => ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)) || subscriptions.data[0] || null;
    }
    if (!stripeSubscription) {
        return {
            success: false,
            reason: 'No Stripe subscription found for this user',
        };
    }
    const localStatus = stripeSubscription.status === 'active'
        ? 'active'
        : stripeSubscription.status === 'trialing'
            ? 'trial'
            : stripeSubscription.status === 'past_due'
                ? 'past_due'
                : stripeSubscription.status === 'canceled'
                    ? 'cancelled'
                    : String(stripeSubscription.status || 'expired');
    const currentPriceId = ((_c = (_b = stripeSubscription.items.data[0]) === null || _b === void 0 ? void 0 : _b.price) === null || _c === void 0 ? void 0 : _c.id) ||
        existingSubscription.currentPriceId ||
        '';
    const subscriptionPatch = removeUndefinedFields({
        status: localStatus,
        plan: getPlanFromPriceId(String(currentPriceId), String(existingSubscription.plan || 'free')),
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        trialEndsAt: stripeSubscription.trial_end,
        stripeCustomerId: String(stripeSubscription.customer || stripeCustomerId),
        stripeSubscriptionId: stripeSubscription.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(stripeSubscription.status === 'canceled'
            ? { canceledAt: stripeSubscription.canceled_at }
            : {}),
    });
    const mergedSubscription = buildMergedSubscription(existingSubscription, subscriptionPatch);
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
exports.stripeWebhook = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] })
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
        const event = getStripe().webhooks.constructEvent(req.rawBody, sig, webhookSecret);
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
    }
    catch (error) {
        const webhookError = error;
        const message = (webhookError === null || webhookError === void 0 ? void 0 : webhookError.message) || 'Unknown webhook error';
        console.error('Webhook error:', message);
        res.status(400).send(`Webhook Error: ${message}`);
    }
});
/**
 * Handle subscription updates from Stripe webhooks
 */
const handleSubscriptionUpdate = async (subscription) => {
    var _a, _b;
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            // Update subscription data
            const subscriptionData = {
                status: subscription.status === 'active'
                    ? 'active'
                    : subscription.status === 'trialing'
                        ? 'trial'
                        : subscription.status,
                plan: getPlanFromPriceId(subscription.items.data[0].price.id, ((_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.plan) || 'free'),
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                trialEndsAt: subscription.trial_end,
                stripeSubscriptionId: subscription.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            // Check if this is a pre-scheduled subscription
            if (((_b = subscription.metadata) === null || _b === void 0 ? void 0 : _b.preScheduled) === 'true' &&
                subscription.status === 'trialing') {
                subscriptionData.scheduledPlan = subscriptionData.plan;
                subscriptionData.hasScheduledSubscription = true;
                console.log('Pre-scheduled subscription detected:', {
                    plan: subscriptionData.plan,
                    trialEnd: subscription.trial_end,
                });
            }
            const sanitizedSubscriptionData = removeUndefinedFields(subscriptionData);
            const mergedSubscription = buildMergedSubscription(userData.subscription, sanitizedSubscriptionData);
            await userDoc.ref.update({
                subscription: mergedSubscription,
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('Subscription updated for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling subscription update:', error);
    }
};
/**
 * Handle subscription cancellations from Stripe webhooks
 */
const handleSubscriptionCancellation = async (subscription) => {
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const mergedSubscription = buildMergedSubscription(userData.subscription, {
                status: 'cancelled',
                canceledAt: subscription.canceled_at,
            });
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('Subscription cancelled for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling subscription cancellation:', error);
    }
};
/**
 * Handle successful payments from Stripe webhooks
 */
const handlePaymentSuccess = async (invoice) => {
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
            const mergedSubscription = buildMergedSubscription(userData.subscription, sanitizedSubscriptionData);
            await userDoc.ref.update({
                subscription: mergedSubscription,
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('Payment succeeded for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling payment success:', error);
    }
};
/**
 * Handle failed payments from Stripe webhooks
 */
const handlePaymentFailure = async (invoice) => {
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
            const mergedSubscription = buildMergedSubscription(userData.subscription, { status: newStatus });
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log(`Payment failed for user: ${userDoc.id}, status: ${newStatus}`);
        }
    }
    catch (error) {
        console.error('Error handling payment failure:', error);
    }
};
/**
 * Handle subscription creation from Stripe webhooks
 */
const handleSubscriptionCreated = async (subscription) => {
    var _a, _b;
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            // Update subscription data
            const subscriptionData = {
                status: subscription.status === 'active'
                    ? 'active'
                    : subscription.status === 'trialing'
                        ? 'trial'
                        : subscription.status,
                plan: getPlanFromPriceId(subscription.items.data[0].price.id, ((_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.plan) || 'free'),
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                trialEndsAt: subscription.trial_end,
                stripeSubscriptionId: subscription.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            // Check if this is a pre-scheduled subscription
            if (((_b = subscription.metadata) === null || _b === void 0 ? void 0 : _b.preScheduled) === 'true' &&
                subscription.status === 'trialing') {
                subscriptionData.scheduledPlan = subscriptionData.plan;
                subscriptionData.hasScheduledSubscription = true;
                console.log('Pre-scheduled subscription created:', {
                    plan: subscriptionData.plan,
                    trialEnd: subscription.trial_end,
                });
            }
            const sanitizedSubscriptionData = removeUndefinedFields(subscriptionData);
            const mergedSubscription = buildMergedSubscription(userData.subscription, sanitizedSubscriptionData);
            await userDoc.ref.update({
                subscription: mergedSubscription,
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('New subscription created for user:', userDoc.id, 'Plan:', subscriptionData.plan, 'Status:', subscriptionData.status);
        }
        else {
            console.error('No user found with customer ID:', subscription.customer);
        }
    }
    catch (error) {
        console.error('Error handling subscription creation:', error);
    }
};
/**
 * Handle subscription pausing from Stripe webhooks
 */
const handleSubscriptionPaused = async (subscription) => {
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const mergedSubscription = buildMergedSubscription(userData.subscription, { status: 'paused' });
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('Subscription paused for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling subscription pause:', error);
    }
};
/**
 * Handle subscription resumption from Stripe webhooks
 */
const handleSubscriptionResumed = async (subscription) => {
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const mergedSubscription = buildMergedSubscription(userData.subscription, { status: 'active' });
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('Subscription resumed for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling subscription resume:', error);
    }
};
/**
 * Handle invoice creation from Stripe webhooks
 */
const handleInvoiceCreated = async (invoice) => {
    try {
        // Could send invoice preview emails or log for analytics
        console.log('Invoice created:', invoice.id, 'Amount:', invoice.amount_due);
    }
    catch (error) {
        console.error('Error handling invoice creation:', error);
    }
};
/**
 * Handle invoice finalization from Stripe webhooks
 */
const handleInvoiceFinalized = async (invoice) => {
    try {
        // Invoice is finalized and ready for payment
        console.log('Invoice finalized:', invoice.id, 'Amount:', invoice.amount_due);
    }
    catch (error) {
        console.error('Error handling invoice finalization:', error);
    }
};
/**
 * Handle upcoming invoice notifications from Stripe webhooks
 */
const handleInvoiceUpcoming = async (invoice) => {
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
            console.log('Upcoming invoice for user:', userDoc.id, 'Amount:', invoice.amount_due, 'Due:', invoice.due_date);
        }
    }
    catch (error) {
        console.error('Error handling upcoming invoice:', error);
    }
};
/**
 * Handle payment action required from Stripe webhooks
 */
const handlePaymentActionRequired = async (invoice) => {
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', invoice.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const mergedSubscription = buildMergedSubscription(userData.subscription, {
                status: 'incomplete',
                paymentActionRequired: true,
            });
            // Mark subscription as requiring payment action
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            console.log('Payment action required for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling payment action required:', error);
    }
};
/**
 * Handle payment method attachment from Stripe webhooks
 */
const handlePaymentMethodAttached = async (paymentMethod) => {
    try {
        // Find user by customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', paymentMethod.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            console.log('Payment method attached for user:', userDoc.id, 'Type:', paymentMethod.type);
        }
    }
    catch (error) {
        console.error('Error handling payment method attachment:', error);
    }
};
/**
 * Handle payment method detachment from Stripe webhooks
 */
const handlePaymentMethodDetached = async (paymentMethod) => {
    try {
        // Find user by customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', paymentMethod.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            console.log('Payment method detached for user:', userDoc.id, 'Type:', paymentMethod.type);
        }
    }
    catch (error) {
        console.error('Error handling payment method detachment:', error);
    }
};
/**
 * Handle discount creation from Stripe webhooks
 */
const handleDiscountCreated = async (discount) => {
    var _a;
    try {
        // Find user by customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', discount.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            console.log('Discount applied for user:', userDoc.id, 'Coupon:', (_a = discount.coupon) === null || _a === void 0 ? void 0 : _a.id);
        }
    }
    catch (error) {
        console.error('Error handling discount creation:', error);
    }
};
/**
 * Handle discount deletion from Stripe webhooks
 */
const handleDiscountDeleted = async (discount) => {
    try {
        // Find user by customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', discount.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            console.log('Discount removed for user:', userDoc.id);
        }
    }
    catch (error) {
        console.error('Error handling discount deletion:', error);
    }
};
/**
 * Helper function to map Stripe price ID to plan name
 */
function getPlanFromPriceId(priceId, fallbackPlan = 'free') {
    const homePriceIds = [
        process.env.STRIPE_HOME_MONTHLY_PRICE_ID,
        process.env.STRIPE_HOME_ANNUAL_PRICE_ID,
        process.env.REACT_APP_STRIPE_HOME_ANNUAL_PLAN_ID,
        process.env.STRIPE_HOME_PRICE_ID,
        process.env.REACT_APP_STRIPE_HOME_PLAN_ID,
        process.env.STRIPE_HOMEOWNER_PRICE_ID,
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID,
        'price_home',
        'price_homeowner',
    ].filter(Boolean);
    const homeownerPlusPriceIds = [
        process.env.STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID,
        process.env.STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID,
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID,
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID,
        process.env.STRIPE_HOMEOWNER_PLUS_PRICE_ID,
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID,
        'price_homeowner_plus',
        'price_homeowner_plus_annual',
    ].filter(Boolean);
    const propertyPriceIds = [
        process.env.STRIPE_PROPERTY_MONTHLY_PRICE_ID,
        process.env.STRIPE_PROPERTY_ANNUAL_PRICE_ID,
        process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID,
        process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID,
        process.env.STRIPE_PROPERTY_PRICE_ID,
        process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID,
        process.env.STRIPE_BASIC_PRICE_ID,
        process.env.REACT_APP_STRIPE_BASIC_PLAN_ID,
        'price_property',
        'price_property_annual',
        'price_basic',
    ].filter(Boolean);
    const portfolioPriceIds = [
        process.env.STRIPE_PORTFOLIO_MONTHLY_PRICE_ID,
        process.env.STRIPE_PORTFOLIO_ANNUAL_PRICE_ID,
        process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID,
        process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID,
        process.env.STRIPE_PORTFOLIO_PRICE_ID,
        process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID,
        process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID,
        'price_portfolio',
        'price_portfolio_annual',
        'price_professional',
    ].filter(Boolean);
    const priceMap = {
        ...Object.fromEntries(homePriceIds.map((id) => [id, 'home'])),
        ...Object.fromEntries(homeownerPlusPriceIds.map((id) => [id, 'homeowner_plus'])),
        ...Object.fromEntries(propertyPriceIds.map((id) => [id, 'property'])),
        ...Object.fromEntries(portfolioPriceIds.map((id) => [id, 'portfolio'])),
    };
    return priceMap[priceId] || fallbackPlan;
}
/**
 * Helper function to map plan name to Stripe price ID
 */
function getPriceIdFromPlan(plan, billingCycle = 'month') {
    const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';
    const homePriceId = process.env.STRIPE_HOME_MONTHLY_PRICE_ID ||
        process.env.STRIPE_HOME_PRICE_ID ||
        process.env.STRIPE_HOMEOWNER_PRICE_ID ||
        'price_home';
    const homeAnnualPriceId = process.env.STRIPE_HOME_ANNUAL_PRICE_ID ||
        process.env.REACT_APP_STRIPE_HOME_ANNUAL_PLAN_ID ||
        homePriceId;
    const homeownerPlusPriceId = process.env.STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID ||
        process.env.STRIPE_HOMEOWNER_PLUS_PRICE_ID ||
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID ||
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID ||
        'price_homeowner_plus';
    const homeownerPlusAnnualPriceId = process.env.STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID ||
        process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID ||
        homeownerPlusPriceId;
    const propertyPriceId = process.env.STRIPE_PROPERTY_MONTHLY_PRICE_ID ||
        process.env.STRIPE_PROPERTY_PRICE_ID ||
        process.env.STRIPE_BASIC_PRICE_ID ||
        'price_property';
    const propertyAnnualPriceId = process.env.STRIPE_PROPERTY_ANNUAL_PRICE_ID ||
        process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID ||
        propertyPriceId;
    const portfolioPriceId = process.env.STRIPE_PORTFOLIO_MONTHLY_PRICE_ID ||
        process.env.STRIPE_PORTFOLIO_PRICE_ID ||
        process.env.STRIPE_PROFESSIONAL_PRICE_ID ||
        'price_portfolio';
    const portfolioAnnualPriceId = process.env.STRIPE_PORTFOLIO_ANNUAL_PRICE_ID ||
        process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID ||
        portfolioPriceId;
    const monthlyPlanMap = {
        home: homePriceId,
        homeowner_plus: homeownerPlusPriceId,
        property: propertyPriceId,
        portfolio: portfolioPriceId,
        // Legacy aliases
        homeowner: homePriceId,
        homeownerplus: homeownerPlusPriceId,
        'homeowner+': homeownerPlusPriceId,
        basic: propertyPriceId,
        professional: portfolioPriceId,
    };
    const annualPlanMap = {
        home: homeAnnualPriceId,
        homeowner_plus: homeownerPlusAnnualPriceId,
        property: propertyAnnualPriceId,
        portfolio: portfolioAnnualPriceId,
        // Legacy aliases
        homeowner: homeAnnualPriceId,
        homeownerplus: homeownerPlusAnnualPriceId,
        'homeowner+': homeownerPlusAnnualPriceId,
        basic: propertyAnnualPriceId,
        professional: portfolioAnnualPriceId,
    };
    return (normalizedCycle === 'year' ? annualPlanMap : monthlyPlanMap)[plan] || homePriceId;
}
