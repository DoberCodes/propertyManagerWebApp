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
const entitlements_1 = require("@maintley/entitlements");
const params_1 = require("firebase-functions/params");
const ensureFamilyAccount_1 = require("./ensureFamilyAccount");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
const stripeBillingDisclosure_1 = require("./stripeBillingDisclosure");
const stripeSubscriptionSelection_1 = require("./stripeSubscriptionSelection");
const grantAwareCheckout_1 = require("./grantAwareCheckout");
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
const FUNCTIONS_CONFIG_EXPORT = (0, params_1.defineJsonSecret)('FUNCTIONS_CONFIG_EXPORT');
const STRIPE_FUNCTION_SECRETS = [STRIPE_SECRET_KEY, FUNCTIONS_CONFIG_EXPORT];
const STRIPE_WEBHOOK_SECRETS = [
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    FUNCTIONS_CONFIG_EXPORT,
];
const optionalStringParam = (name) => (0, params_1.defineString)(name, { default: '' });
const STRIPE_PRICE_PARAMS = {
    homeownerPlusMonthlyPriceId: optionalStringParam('STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID'),
    homeownerPlusAnnualPriceId: optionalStringParam('STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID'),
    multiHomeownerMonthlyPriceId: optionalStringParam('STRIPE_MULTI_HOMEOWNER_MONTHLY_PRICE_ID'),
    multiHomeownerAnnualPriceId: optionalStringParam('STRIPE_MULTI_HOMEOWNER_ANNUAL_PRICE_ID'),
    propertyMonthlyPriceId: optionalStringParam('STRIPE_PROPERTY_MONTHLY_PRICE_ID'),
    propertyAnnualPriceId: optionalStringParam('STRIPE_PROPERTY_ANNUAL_PRICE_ID'),
    portfolioMonthlyPriceId: optionalStringParam('STRIPE_PORTFOLIO_MONTHLY_PRICE_ID'),
    portfolioAnnualPriceId: optionalStringParam('STRIPE_PORTFOLIO_ANNUAL_PRICE_ID'),
};
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
const readStringParam = (param) => {
    try {
        return sanitizeSecret(param.value() || process.env[param.name] || '');
    }
    catch (error) {
        return sanitizeSecret(process.env[param.name] || '');
    }
};
const readEnv = (name) => sanitizeSecret(process.env[name] || '');
let exportedFunctionsConfigCache;
const getExportedFunctionsConfig = () => {
    if (exportedFunctionsConfigCache !== undefined) {
        return exportedFunctionsConfigCache || {};
    }
    try {
        exportedFunctionsConfigCache = FUNCTIONS_CONFIG_EXPORT.value() || {};
        return exportedFunctionsConfigCache;
    }
    catch (error) {
        const rawExport = readEnv('FUNCTIONS_CONFIG_EXPORT');
        if (rawExport) {
            try {
                exportedFunctionsConfigCache = JSON.parse(rawExport);
                return exportedFunctionsConfigCache || {};
            }
            catch (parseError) {
                console.warn('Unable to parse FUNCTIONS_CONFIG_EXPORT as JSON.');
            }
        }
        exportedFunctionsConfigCache = null;
        return {};
    }
};
const readExportedStripeConfig = (key) => {
    const exportedConfig = getExportedFunctionsConfig();
    return sanitizeSecret(exportedConfig?.stripe?.[key] || '');
};
const normalizePromoCode = (value) => {
    return sanitizeSecret(String(value || ''));
};
const resolveStripeSecretKey = () => {
    let secretFromManager = '';
    try {
        secretFromManager = STRIPE_SECRET_KEY.value() || '';
    }
    catch (error) {
        console.warn('Unable to read STRIPE_SECRET_KEY from Secret Manager');
    }
    const secretFromEnv = process.env.STRIPE_SECRET_KEY || '';
    const secretFromExportedConfig = readExportedStripeConfig('secret_key');
    return sanitizeSecret(secretFromManager || secretFromEnv || secretFromExportedConfig);
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
    const secretFromExportedConfig = readExportedStripeConfig('webhook_secret');
    return sanitizeSecret(secretFromManager || secretFromEnv || secretFromExportedConfig);
};
const getStripe = () => {
    if (!stripe) {
        const stripeSecretKey = resolveStripeSecretKey();
        if (!stripeSecretKey) {
            throw new Error('Stripe secret key is not configured. Set STRIPE_SECRET_KEY in Secret Manager or the functions environment.');
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
    const homeownerPlusPriceId = readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId) ||
        readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID') ||
        readExportedStripeConfig('homeowner_plus_monthly_price_id') ||
        readExportedStripeConfig('homeowner_plus_price_id') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID');
    const homeownerPlusAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId) ||
        readExportedStripeConfig('homeowner_plus_annual_price_id') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID');
    const propertyPriceId = readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId) ||
        readEnv('STRIPE_PROPERTY_PRICE_ID') ||
        readExportedStripeConfig('property_monthly_price_id') ||
        readExportedStripeConfig('property_price_id') ||
        readEnv('REACT_APP_STRIPE_PROPERTY_PLAN_ID');
    const multiHomeownerPriceId = readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerMonthlyPriceId) ||
        readExportedStripeConfig('multi_homeowner_monthly_price_id');
    const multiHomeownerAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerAnnualPriceId) ||
        readExportedStripeConfig('multi_homeowner_annual_price_id');
    const propertyAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId) ||
        readExportedStripeConfig('property_annual_price_id') ||
        readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID');
    const portfolioPriceId = readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId) ||
        readEnv('STRIPE_PORTFOLIO_PRICE_ID') ||
        readExportedStripeConfig('portfolio_monthly_price_id') ||
        readExportedStripeConfig('portfolio_price_id') ||
        readEnv('REACT_APP_STRIPE_PORTFOLIO_PLAN_ID');
    const portfolioAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId) ||
        readExportedStripeConfig('portfolio_annual_price_id') ||
        readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID');
    const monthlyPriceMap = {
        homeowner_plus: homeownerPlusPriceId,
        multi_homeowner: multiHomeownerPriceId,
        property: propertyPriceId,
        portfolio: portfolioPriceId,
    };
    const annualPriceMap = {
        homeowner_plus: homeownerPlusAnnualPriceId || homeownerPlusPriceId,
        multi_homeowner: multiHomeownerAnnualPriceId || multiHomeownerPriceId,
        property: propertyAnnualPriceId || propertyPriceId,
        portfolio: portfolioAnnualPriceId || portfolioPriceId,
    };
    return ((normalizedCycle === 'year' ? annualPriceMap : monthlyPriceMap)[normalizedPlan] || '');
};
const CHECKOUT_PLAN_IDS = [
    'homeowner_plus',
    'multi_homeowner',
    'property',
    'portfolio',
];
const LEGACY_PRICE_ONLY_CHECKOUT_REMOVAL_RELEASE = '2.10.0';
const resolveConfiguredPlanForPriceId = (priceId) => {
    const normalizedPriceId = sanitizeSecret(String(priceId || ''));
    if (!normalizedPriceId)
        return '';
    for (const planId of CHECKOUT_PLAN_IDS) {
        for (const billingCycle of ['month', 'year']) {
            if (resolvePriceIdForPlan(planId, billingCycle) === normalizedPriceId) {
                return planId;
            }
        }
    }
    return '';
};
const resolvePromotionCodeId = async (promoCode) => {
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
const toTimestampMs = (value) => {
    if (typeof value === 'number')
        return value;
    if (value &&
        typeof value === 'object' &&
        typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    return Date.parse(String(value || ''));
};
const loadAccountEntitlementGrants = async (accountId) => {
    const snapshot = await db
        .collection('familyAccounts')
        .doc(accountId)
        .collection('entitlementGrants')
        .get();
    return snapshot.docs.map((doc) => {
        const grant = doc.data() || {};
        return {
            ...grant,
            grantId: String(grant.grantId || doc.id),
            programId: String(grant.programId || ''),
            accountId: String(grant.accountId || accountId),
            kind: String(grant.kind || ''),
            state: String(grant.state || ''),
            startsAtMs: toTimestampMs(grant.startsAtMs || grant.startsAt),
            endsAtMs: grant.endsAtMs || grant.endsAt
                ? toTimestampMs(grant.endsAtMs || grant.endsAt)
                : null,
            source: String(grant.source || 'support'),
        };
    });
};
const getStripePaymentMethodStatus = async (subscription) => {
    if (subscription.status === 'active' || subscription.default_payment_method) {
        return 'usable';
    }
    const customer = typeof subscription.customer === 'string'
        ? await getStripe().customers.retrieve(subscription.customer)
        : subscription.customer;
    if (customer &&
        !customer.deleted &&
        customer.invoice_settings?.default_payment_method) {
        return 'usable';
    }
    return 'missing';
};
const updateGrantTransitionsAfterCheckout = async (params) => {
    const uniqueGrantIds = Array.from(new Set(params.grantIds.filter(Boolean)));
    if (!uniqueGrantIds.length)
        return;
    const accountRef = db.collection('familyAccounts').doc(params.accountId);
    const grantRefs = uniqueGrantIds.map((grantId) => accountRef.collection('entitlementGrants').doc(grantId));
    const checkoutSessionId = String(params.session?.id || '');
    const stripeCustomerId = String(params.session?.customer || '') ||
        (typeof params.subscription.customer === 'string'
            ? params.subscription.customer
            : params.subscription.customer?.id || '');
    const requestBase = checkoutSessionId
        ? `checkout:${checkoutSessionId}`
        : `subscription:${params.subscription.id}:${params.targetPlanId}:${params.billingCycle}`;
    const conversionSet = new Set(params.conversionGrantIds);
    const recurringPrice = params.subscription.items.data[0]?.price;
    const transitionFirstChargeAtSeconds = params.firstChargeAtSeconds || params.subscription.current_period_start;
    const shouldConvertDuringCheckout = !params.optedOut && !params.failureReason && params.subscription.status === 'active';
    const auditDescriptors = uniqueGrantIds.map((grantId) => {
        const action = params.optedOut
            ? 'billing_transition.opted_out'
            : params.failureReason
                ? 'billing_transition.updated'
                : conversionSet.has(grantId) && shouldConvertDuringCheckout
                    ? 'grant.converted'
                    : 'billing_transition.linked';
        const requestId = `${requestBase}:${grantId}:${action}`;
        const auditEventId = (0, entitlements_1.getAdminAuditEventId)(action, requestId);
        return {
            action,
            requestId,
            auditEventId,
            auditRef: db.collection('admin_audit_logs').doc(auditEventId),
        };
    });
    await db.runTransaction(async (transaction) => {
        const snapshots = await Promise.all([
            transaction.get(accountRef),
            ...grantRefs.map((grantRef) => transaction.get(grantRef)),
            ...auditDescriptors.map(({ auditRef }) => transaction.get(auditRef)),
        ]);
        const accountSnapshot = snapshots[0];
        const grantSnapshots = snapshots.slice(1, 1 + grantRefs.length);
        const auditSnapshots = snapshots.slice(1 + grantRefs.length);
        const account = accountSnapshot.data() || {};
        const projection = (account.effectiveEntitlementProjection || {});
        const projectedGrants = Array.isArray(projection.activeGrants)
            ? [...projection.activeGrants]
            : [];
        for (let index = 0; index < grantSnapshots.length; index += 1) {
            const grantSnapshot = grantSnapshots[index];
            if (!grantSnapshot.exists)
                continue;
            const grant = grantSnapshot.data() || {};
            const grantId = uniqueGrantIds[index];
            const shouldConvertNow = conversionSet.has(grantId) && shouldConvertDuringCheckout;
            const nextState = shouldConvertNow ? 'converted' : String(grant.state || 'active');
            const transition = {
                ...(grant.transition || {}),
                mode: params.optedOut ? 'checkout_required' : 'automatic',
                targetPlanId: params.targetPlanId,
                billingCycle: params.billingCycle === 'year' ? 'annual' : 'monthly',
                currency: String(recurringPrice?.currency || '').toLowerCase(),
                recurringAmountMinor: Number(recurringPrice?.unit_amount || 0),
                firstChargeAt: transitionFirstChargeAtSeconds
                    ? transitionFirstChargeAtSeconds * 1000
                    : null,
                paymentMethodStatus: params.paymentMethodStatus,
                disclosureVersion: 'grant-aware-checkout-v1',
                termsVersion: 'grant-aware-checkout-v1',
                consentAt: grant.transition?.consentAt ||
                    admin.firestore.FieldValue.serverTimestamp(),
                consentActorUserId: params.userId,
                consentSource: grant.transition?.consentSource ||
                    (checkoutSessionId
                        ? 'stripe_checkout'
                        : 'authenticated_subscription_change'),
                stripeCustomerId,
                stripeSubscriptionId: params.subscription.id,
                ...(checkoutSessionId
                    ? { stripeCheckoutSessionId: checkoutSessionId }
                    : {}),
                status: params.optedOut
                    ? 'opted_out'
                    : params.failureReason
                        ? 'failed'
                        : shouldConvertNow
                            ? 'converted'
                            : 'scheduled',
                ...(params.failureReason
                    ? { failureReason: params.failureReason }
                    : { failureReason: null }),
            };
            transaction.update(grantRefs[index], {
                state: nextState,
                transition,
                ...(shouldConvertNow
                    ? {
                        terminalReason: 'Customer activated a higher paid plan.',
                        terminalAtMs: Date.now(),
                    }
                    : {}),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const projectionIndex = projectedGrants.findIndex((candidate) => String(candidate?.grantId || '') === grantId);
            if (projectionIndex >= 0) {
                if (shouldConvertNow) {
                    projectedGrants.splice(projectionIndex, 1);
                }
                else {
                    projectedGrants[projectionIndex] = {
                        ...projectedGrants[projectionIndex],
                        transition,
                    };
                }
            }
            const { action, requestId, auditEventId, auditRef } = auditDescriptors[index];
            const auditSnapshot = auditSnapshots[index];
            if (!auditSnapshot.exists) {
                transaction.create(auditRef, {
                    eventId: auditEventId,
                    action,
                    category: 'billing_transition',
                    actorUserId: params.userId,
                    targetAccountId: params.accountId,
                    targetUserId: params.userId,
                    grantId,
                    programId: String(grant.programId || ''),
                    stripeCustomerId,
                    stripeSubscriptionId: params.subscription.id,
                    reason: params.optedOut
                        ? 'Customer opted out of paid continuation through Stripe billing management.'
                        : params.failureReason
                            ? `Stripe reported a billing-recovery state: ${params.failureReason}.`
                            : shouldConvertNow
                                ? 'Customer activated a higher paid plan through Stripe Checkout.'
                                : 'Customer established paid continuation through Stripe Checkout.',
                    requestId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    before: { state: grant.state, transition: grant.transition || null },
                    after: { state: nextState, transition },
                });
            }
        }
        transaction.set(accountRef, {
            effectiveEntitlementProjection: {
                ...projection,
                activeGrants: projectedGrants,
                activeBundleIds: Array.from(new Set(projectedGrants
                    .map((grant) => String(grant?.bundleId || ''))
                    .filter(Boolean))),
                bundleVersions: Array.from(new Set(projectedGrants
                    .map((grant) => {
                    const bundleId = String(grant?.bundleId || '');
                    const bundleVersion = String(grant?.bundleVersion || '');
                    return bundleId && bundleVersion
                        ? `${bundleId}@${bundleVersion}`
                        : '';
                })
                    .filter(Boolean))),
                bundleExpirationsMs: projectedGrants.reduce((expirations, grant) => {
                    const bundleId = String(grant?.bundleId || '');
                    if (!bundleId)
                        return expirations;
                    const endsAtMs = grant?.endsAtMs == null
                        ? null
                        : Number(grant.endsAtMs);
                    if (endsAtMs == null) {
                        expirations[bundleId] = null;
                        return expirations;
                    }
                    const hasCurrent = Object.prototype.hasOwnProperty.call(expirations, bundleId);
                    const current = expirations[bundleId];
                    if (!hasCurrent || (current != null && endsAtMs > current)) {
                        expirations[bundleId] = endsAtMs;
                    }
                    return expirations;
                }, {}),
                nextTransitionAtMs: projectedGrants
                    .map((grant) => Number(grant?.endsAtMs || 0))
                    .filter((endsAtMs) => endsAtMs > Date.now())
                    .sort((left, right) => left - right)[0] || null,
                calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
};
const applyGrantTransitionMetadata = async (params) => {
    const metadata = {
        ...(params.subscription.metadata || {}),
        ...(params.session?.metadata || {}),
    };
    const targetPlanId = String(metadata.targetPlanId || '');
    const billingCycle = String(metadata.billingCycle || '');
    const transitionGrantIds = String(metadata.transitionGrantIds || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    if (!transitionGrantIds.length ||
        !CHECKOUT_PLAN_IDS.includes(targetPlanId) ||
        !['month', 'year'].includes(billingCycle)) {
        return;
    }
    const conversionGrantIds = String(metadata.conversionGrantIds || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const parsedFirstChargeAt = Number(metadata.firstChargeAt || 0);
    const optedOut = Boolean(params.subscription.cancel_at_period_end) ||
        params.subscription.status === 'canceled';
    const failureReason = [
        'past_due',
        'unpaid',
        'incomplete',
        'incomplete_expired',
    ].includes(params.subscription.status)
        ? params.subscription.status
        : null;
    const paymentMethodStatus = failureReason
        ? 'requires_action'
        : await getStripePaymentMethodStatus(params.subscription);
    await updateGrantTransitionsAfterCheckout({
        accountId: String(params.userData?.accountId || params.userId),
        userId: params.userId,
        grantIds: transitionGrantIds,
        conversionGrantIds,
        targetPlanId,
        billingCycle: billingCycle,
        firstChargeAtSeconds: Number.isFinite(parsedFirstChargeAt) && parsedFirstChargeAt > 0
            ? parsedFirstChargeAt
            : null,
        paymentMethodStatus,
        optedOut,
        failureReason,
        session: params.session,
        subscription: params.subscription,
    });
};
const BUSINESS_PLAN_IDS = new Set(['property', 'portfolio']);
const assertMultiHomeownerSelfDowngradeAllowed = async (accountId, currentPlanId) => {
    if (!BUSINESS_PLAN_IDS.has(String(currentPlanId || '').toLowerCase())) {
        return;
    }
    const normalizedAccountId = String(accountId || '').trim();
    const [familyAccount, teamMembersByAccount, legacyTeamMembers, residentProfiles, residentInvites, properties,] = await Promise.all([
        db.collection('familyAccounts').doc(normalizedAccountId).get(),
        db.collection('teamMembers').where('accountId', '==', normalizedAccountId).get(),
        db.collection('teamMembers').where('userId', '==', normalizedAccountId).get(),
        db.collection('tenantProfiles').where('accountId', '==', normalizedAccountId).get(),
        db.collection('tenantInvitationCodes').where('accountId', '==', normalizedAccountId).get(),
        db.collection('properties').where('accountId', '==', normalizedAccountId).get(),
    ]);
    const issues = [];
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
        throw new functions.https.HttpsError('failed-precondition', `Before switching to Multi-Homeowner, resolve these business-only items: ${issues.join(', ')}. No records were changed.`, { code: 'multi-homeowner-downgrade-blocked', issues });
    }
};
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
    const reusableStatuses = new Set(['active', 'trialing', 'past_due']);
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
            .set({
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
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId: requestedPriceId, planId, billingCycle, userId, email, successUrl, cancelUrl, promoCode: requestedPromoCode, } = data;
    const normalizedPlanId = String(planId || '').trim().toLowerCase();
    const normalizedBillingCycle = String(billingCycle || '').toLowerCase();
    const authenticatedUserId = context.auth.uid;
    if (String(userId || '').trim() !== authenticatedUserId) {
        throw new functions.https.HttpsError('permission-denied', 'Checkout can only be created for the signed-in account');
    }
    const resolvedRequestedPriceId = sanitizeSecret(String(requestedPriceId || ''));
    let checkoutPlanId = normalizedPlanId;
    let resolvedPriceId = '';
    if (checkoutPlanId) {
        if (!CHECKOUT_PLAN_IDS.includes(checkoutPlanId)) {
            throw new functions.https.HttpsError('invalid-argument', 'Checkout requires a supported paid plan ID.');
        }
        if (!['month', 'year'].includes(normalizedBillingCycle)) {
            throw new functions.https.HttpsError('invalid-argument', 'Checkout requires a monthly or annual billing cycle.');
        }
        resolvedPriceId = resolvePriceIdForPlan(checkoutPlanId, normalizedBillingCycle);
    }
    else {
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
    if (checkoutPlanId === 'multi_homeowner' &&
        !subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.multiHomeownerPlan) {
        throw new functions.https.HttpsError('failed-precondition', 'Multi-Homeowner is not currently available.');
    }
    if (!resolvedPriceId || !userId || !email) {
        throw new functions.https.HttpsError('failed-precondition', `No server-owned Stripe price is configured for plan '${String(planId || '')}', or the legacy price-only request is not recognized.`);
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
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }
        const userData = userDoc.data() || {};
        const accountId = String(userData.accountId || authenticatedUserId);
        if (checkoutPlanId === 'multi_homeowner') {
            await assertMultiHomeownerSelfDowngradeAllowed(accountId, String(userData?.subscription?.plan || ''));
        }
        await (0, ensureFamilyAccount_1.ensureFamilyAccountForUser)(authenticatedUserId, {
            accountId,
            syncSubscription: true,
            subscription: userData.subscription,
        }, userData);
        console.log('User data retrieved:', userData);
        const entitlementGrants = await loadAccountEntitlementGrants(accountId);
        const grantCheckoutPolicy = (0, grantAwareCheckout_1.getGrantAwareCheckoutPolicy)({
            grants: entitlementGrants,
            targetPlanId: checkoutPlanId,
            nowMs: Date.now(),
        });
        if (grantCheckoutPolicy.kind === 'blocked_permanent') {
            throw new functions.https.HttpsError('failed-precondition', `This account already has permanent ${grantCheckoutPolicy.effectiveGrantPlanId.replace(/_/g, ' ')} access. Choose a higher plan to add capabilities.`, {
                code: 'redundant-permanent-grant-checkout',
                grantPlanId: grantCheckoutPolicy.effectiveGrantPlanId,
            });
        }
        if (grantCheckoutPolicy.kind !== 'standard' &&
            !subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.complimentaryPaidTransitions) {
            throw new functions.https.HttpsError('failed-precondition', 'Complimentary access upgrades are temporarily unavailable while billing transitions are being enabled.', { code: 'complimentary-paid-transitions-disabled' });
        }
        const transitionGrantIds = grantCheckoutPolicy.kind === 'delayed'
            ? grantCheckoutPolicy.controllingGrantIds
            : grantCheckoutPolicy.kind === 'immediate_upgrade'
                ? grantCheckoutPolicy.conversionGrantIds
                : [];
        const conversionGrantIds = grantCheckoutPolicy.kind === 'delayed' ||
            grantCheckoutPolicy.kind === 'immediate_upgrade'
            ? grantCheckoutPolicy.conversionGrantIds
            : [];
        const firstChargeAtSeconds = grantCheckoutPolicy.kind === 'delayed'
            ? grantCheckoutPolicy.firstChargeAtSeconds
            : null;
        const grantTransitionMetadata = {
            grantCheckoutPolicy: grantCheckoutPolicy.kind,
            ...(grantCheckoutPolicy.kind === 'delayed'
                ? { preScheduled: 'true' }
                : {}),
            targetPlanId: checkoutPlanId,
            billingCycle: normalizedBillingCycle,
            transitionGrantIds: transitionGrantIds.join(','),
            conversionGrantIds: conversionGrantIds.join(','),
            ...(firstChargeAtSeconds
                ? { firstChargeAt: String(firstChargeAtSeconds) }
                : {}),
        };
        const accountPromoCode = normalizePromoCode(requestedPromoCode || userData?.subscription?.promoCode);
        let promotionCodeId = null;
        if (accountPromoCode) {
            promotionCodeId = await resolvePromotionCodeId(accountPromoCode);
            if (!promotionCodeId) {
                console.warn(`Promo code '${accountPromoCode}' was provided but no active Stripe Promotion Code was found. Proceeding without discount.`);
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
        const existingSubscription = await findReusableSubscription(customerId, sanitizeSecret(String(userData?.subscription?.stripeSubscriptionId || '')));
        if (existingSubscription) {
            if (grantCheckoutPolicy.kind === 'delayed' &&
                existingSubscription.status !== 'trialing') {
                throw new functions.https.HttpsError('failed-precondition', 'This account already has current Stripe billing. Maintley support must schedule this grant-aware plan change so the existing subscription is not charged incorrectly.', { code: 'existing-subscription-schedule-required' });
            }
            const subscriptionItem = existingSubscription.items.data[0];
            if (!subscriptionItem?.id) {
                throw new functions.https.HttpsError('failed-precondition', 'Existing Stripe subscription has no subscription item to update.');
            }
            console.log('Updating existing Stripe subscription instead of creating a new one:', {
                subscriptionId: existingSubscription.id,
                subscriptionItemId: subscriptionItem.id,
                currentPriceId: subscriptionItem.price?.id,
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
                proration_behavior: grantCheckoutPolicy.kind === 'delayed'
                    ? 'none'
                    : 'create_prorations',
                ...(firstChargeAtSeconds
                    ? { trial_end: firstChargeAtSeconds }
                    : {}),
                metadata: {
                    ...(existingSubscription.metadata || {}),
                    firebaseUID: userId,
                    ...grantTransitionMetadata,
                    ...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
                },
            });
            const updatedPriceId = updatedSubscription.items.data[0]?.price?.id || resolvedPriceId;
            const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), updatedSubscription);
            const subscriptionData = removeUndefinedFields({
                status: toLocalSubscriptionStatus(updatedSubscription.status),
                plan: getPlanFromPriceId(updatedPriceId, checkoutPlanId || userData?.subscription?.plan || 'homeowner'),
                currentPeriodStart: updatedSubscription.current_period_start,
                currentPeriodEnd: updatedSubscription.current_period_end,
                trialEndsAt: updatedSubscription.trial_end,
                stripeCustomerId: String(updatedSubscription.customer || customerId),
                stripeSubscriptionId: updatedSubscription.id,
                hasScheduledSubscription: grantCheckoutPolicy.kind === 'delayed' &&
                    updatedSubscription.status === 'trialing',
                scheduledPlan: grantCheckoutPolicy.kind === 'delayed' &&
                    updatedSubscription.status === 'trialing'
                    ? checkoutPlanId
                    : null,
                pendingCheckoutPlan: null,
                pendingCheckoutStartedAt: null,
                billingDisclosure,
                ...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
            });
            const mergedSubscription = buildMergedSubscription(userData?.subscription, subscriptionData);
            await userRef.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            await updateGrantTransitionsAfterCheckout({
                accountId,
                userId: authenticatedUserId,
                grantIds: transitionGrantIds,
                conversionGrantIds,
                targetPlanId: checkoutPlanId,
                billingCycle: normalizedBillingCycle,
                firstChargeAtSeconds,
                paymentMethodStatus: await getStripePaymentMethodStatus(updatedSubscription),
                subscription: updatedSubscription,
            });
            return {
                subscriptionUpdated: true,
                subscriptionId: updatedSubscription.id,
                subscription: mergedSubscription,
            };
        }
        // Create checkout session
        const checkoutSessionParams = {
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: resolvedPriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            payment_method_collection: 'always',
            success_url: successUrl,
            cancel_url: cancelUrl,
            ...(promotionCodeId
                ? { discounts: [{ promotion_code: promotionCodeId }] }
                : {}),
            metadata: {
                firebaseUID: userId,
                ...grantTransitionMetadata,
                ...(accountPromoCode ? { promoCode: accountPromoCode } : {}),
            },
            subscription_data: {
                metadata: {
                    firebaseUID: userId,
                    ...grantTransitionMetadata,
                },
                ...(firstChargeAtSeconds
                    ? { trial_end: firstChargeAtSeconds }
                    : {}),
            },
        };
        const session = transitionGrantIds.length
            ? await getStripe().checkout.sessions.create(checkoutSessionParams, {
                idempotencyKey: `grant-aware-checkout:${accountId}:${checkoutPlanId}:${normalizedBillingCycle}:${transitionGrantIds.join('-')}`,
            })
            : await getStripe().checkout.sessions.create(checkoutSessionParams);
        return { sessionId: session.id, url: session.url };
    }
    catch (error) {
        const stripeError = error;
        console.error('Error creating checkout session:', {
            message: stripeError?.message,
            code: stripeError?.code,
            type: stripeError?.type,
        });
        if (stripeError?.message?.includes('No such price')) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe price ID is invalid. Verify REACT_APP_STRIPE_*_PLAN_ID values and deployed function config.');
        }
        if (stripeError?.message?.includes('Invalid API Key')) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key is invalid or missing in backend configuration.');
        }
        throw new functions.https.HttpsError('internal', stripeError?.message || 'Failed to create checkout session');
    }
});
/**
 * Validate Stripe Promotion Code
 * Callable body: { promoCode }
 */
exports.validatePromotionCode = functions
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (data) => {
    const normalizedPromoCode = normalizePromoCode(data?.promoCode).toLowerCase();
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
        const couponRef = match?.coupon;
        const couponId = typeof couponRef === 'string' ? couponRef : couponRef?.id || null;
        return {
            valid: Boolean(match),
            code: normalizedPromoCode,
            promotionCodeId: match?.id || null,
            couponId,
            message: match
                ? 'Promo code is valid.'
                : 'Invalid or expired promo code.',
        };
    }
    catch (error) {
        const stripeError = error;
        console.error('Error validating promotion code:', {
            message: stripeError?.message,
            code: stripeError?.code,
            type: stripeError?.type,
        });
        throw new functions.https.HttpsError('internal', stripeError?.message || 'Failed to validate promo code');
    }
});
/**
 * Create Trial Subscription in Stripe
 * POST /api/create-trial-subscription
 * Body: { priceId, userId, email, trialDays }
 */
exports.createTrialSubscription = functions
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId: requestedPriceId, planId, promoCode, userId, email, trialDays = 30, } = data;
    const normalizedPromoCode = normalizePromoCode(promoCode);
    const resolvedPriceId = resolvePriceIdForPlan(String(planId || '')) ||
        sanitizeSecret(String(requestedPriceId || ''));
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
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (data, context) => {
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
        const firebaseUID = session.metadata?.firebaseUID;
        if (!firebaseUID) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid session metadata');
        }
        if (firebaseUID !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'This checkout session belongs to a different account');
        }
        // Get subscription details
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), subscription);
        const subscriptionStatus = toLocalSubscriptionStatus(subscription.status);
        if (!['active', 'trial'].includes(subscriptionStatus)) {
            throw new functions.https.HttpsError('failed-precondition', `Subscription not active yet (status: ${subscription.status || 'unknown'})`);
        }
        // Update user subscription in Firestore
        const subscriptionData = {
            status: subscriptionStatus,
            plan: getPlanFromPriceId(subscription.items.data[0].price.id),
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            trialEndsAt: subscription.trial_end,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            pendingCheckoutPlan: null,
            pendingCheckoutStartedAt: null,
            billingDisclosure,
            hasScheduledSubscription: subscription.status === 'trialing' &&
                subscription.metadata?.preScheduled === 'true',
            scheduledPlan: subscription.status === 'trialing' &&
                subscription.metadata?.preScheduled === 'true'
                ? getPlanFromPriceId(subscription.items.data[0].price.id)
                : null,
        };
        const userRef = db.collection('users').doc(firebaseUID);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const mergedSubscription = buildMergedSubscription(userData?.subscription, subscriptionData);
        await userRef.update({
            subscription: mergedSubscription,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await syncFamilyAccountSubscription(userData, mergedSubscription);
        await applyGrantTransitionMetadata({
            userId: firebaseUID,
            userData,
            session,
            subscription,
        });
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
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = data;
    if (!subscriptionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        const userRef = db.collection('users').doc(context.auth.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data() || {};
        const storedSubscriptionId = String(userData?.subscription?.stripeSubscriptionId || '').trim();
        if (!userDoc.exists || storedSubscriptionId !== String(subscriptionId)) {
            throw new functions.https.HttpsError('permission-denied', 'This subscription does not belong to the signed-in account.');
        }
        // Cancel subscription in Stripe
        const subscription = await getStripe().subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), subscription);
        const mergedSubscription = buildMergedSubscription(userData.subscription, {
            status: toLocalSubscriptionStatus(subscription.status),
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            canceledAt: subscription.canceled_at,
            billingDisclosure,
        });
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
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Error canceling subscription:', error);
        throw new functions.https.HttpsError('internal', 'Failed to cancel subscription');
    }
});
/**
 * Get Subscription Details
 * GET /api/subscription-details/:subscriptionId
 */
exports.getSubscriptionDetails = functions
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = data;
    if (!subscriptionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        const storedSubscriptionId = String(userDoc.data()?.subscription?.stripeSubscriptionId || '').trim();
        if (!userDoc.exists || storedSubscriptionId !== String(subscriptionId)) {
            throw new functions.https.HttpsError('permission-denied', 'This subscription does not belong to the signed-in account.');
        }
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId, { expand: ['discounts'] });
        return {
            id: subscription.id,
            status: subscription.status,
            billingDisclosure: await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), subscription),
        };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        console.error('Error getting subscription details:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get subscription details');
    }
});
/**
 * Sync current authenticated user's subscription from Stripe.
 * Backstop for missed webhook deliveries or manual Stripe dashboard edits.
 */
exports.syncSubscriptionFromStripe = functions
    .runWith({ secrets: STRIPE_FUNCTION_SECRETS })
    .https.onCall(async (_data, context) => {
    if (!context.auth?.uid) {
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
    let stripeCustomerId = String(existingSubscription.stripeCustomerId || '');
    const existingStripeSubscriptionId = String(existingSubscription.stripeSubscriptionId || '');
    if (!stripeCustomerId && !existingStripeSubscriptionId) {
        return {
            success: false,
            reason: 'No Stripe customer/subscription IDs found for user',
        };
    }
    const subscriptionCandidates = [];
    let storedStripeSubscription = null;
    if (existingStripeSubscriptionId &&
        existingStripeSubscriptionId !== 'YOUR_SUBSCRIPTION_ID_HERE') {
        try {
            storedStripeSubscription = await getStripe().subscriptions.retrieve(existingStripeSubscriptionId, { expand: ['discounts'] });
            if (!stripeCustomerId) {
                stripeCustomerId =
                    typeof storedStripeSubscription.customer === 'string'
                        ? storedStripeSubscription.customer
                        : storedStripeSubscription.customer?.id || '';
            }
            subscriptionCandidates.push(storedStripeSubscription);
        }
        catch (error) {
            console.warn(`Unable to retrieve stored Stripe subscription ${existingStripeSubscriptionId}; checking the customer subscription list.`);
        }
    }
    if (stripeCustomerId) {
        try {
            const subscriptions = await getStripe().subscriptions.list({
                customer: stripeCustomerId,
                status: 'all',
                limit: 100,
            });
            subscriptionCandidates.push(...subscriptions.data);
        }
        catch (error) {
            if (!storedStripeSubscription)
                throw error;
            console.warn(`Unable to list subscriptions for Stripe customer ${stripeCustomerId}; using the verified stored subscription.`);
        }
    }
    const selection = (0, stripeSubscriptionSelection_1.selectCustomerSubscription)(subscriptionCandidates, existingStripeSubscriptionId);
    if (selection.kind === 'conflict') {
        const billingSyncIssue = {
            code: 'multiple_current_subscriptions',
            stripeSubscriptionIds: selection.subscriptions.map((subscription) => subscription.id),
            detectedAt: new Date().toISOString(),
        };
        const conflictedSubscription = buildMergedSubscription(existingSubscription, { billingSyncIssue });
        await userRef.update({
            subscription: conflictedSubscription,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await syncFamilyAccountSubscription(userData, conflictedSubscription);
        console.error('Stripe billing synchronization conflict:', {
            userId,
            stripeCustomerId,
            stripeSubscriptionIds: billingSyncIssue.stripeSubscriptionIds,
        });
        return {
            success: false,
            reason: 'Multiple current Stripe subscriptions require review',
            conflict: true,
            subscription: { billingSyncIssue },
        };
    }
    if (selection.kind === 'none') {
        return {
            success: false,
            reason: 'No Stripe subscription found for this user',
        };
    }
    let stripeSubscription = selection.subscription;
    if (stripeSubscription !== storedStripeSubscription) {
        try {
            stripeSubscription = await getStripe().subscriptions.retrieve(stripeSubscription.id, { expand: ['discounts'] });
        }
        catch (error) {
            console.warn(`Unable to expand selected Stripe subscription ${stripeSubscription.id}; using the customer-list representation.`);
        }
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
    const currentPriceId = stripeSubscription.items.data[0]?.price?.id ||
        existingSubscription.currentPriceId ||
        '';
    const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), stripeSubscription);
    const subscriptionPatch = removeUndefinedFields({
        status: localStatus,
        plan: getPlanFromPriceId(String(currentPriceId), String(existingSubscription.plan || 'homeowner')),
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        trialEndsAt: stripeSubscription.trial_end,
        stripeCustomerId: String(stripeSubscription.customer || stripeCustomerId),
        stripeSubscriptionId: stripeSubscription.id,
        cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
        pendingCheckoutPlan: null,
        pendingCheckoutStartedAt: null,
        billingDisclosure,
        billingSyncIssue: null,
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
        const message = webhookError?.message || 'Unknown webhook error';
        console.error('Webhook error:', message);
        res.status(400).send(`Webhook Error: ${message}`);
    }
});
/**
 * Handle subscription updates from Stripe webhooks
 */
const handleSubscriptionUpdate = async (subscription) => {
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const authoritativeSubscription = await getStripe().subscriptions.retrieve(subscription.id, { expand: ['discounts'] });
            const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), authoritativeSubscription);
            // Update subscription data
            const subscriptionData = {
                status: subscription.status === 'active'
                    ? 'active'
                    : subscription.status === 'trialing'
                        ? 'trial'
                        : subscription.status,
                plan: getPlanFromPriceId(subscription.items.data[0].price.id, userData?.subscription?.plan || 'homeowner'),
                currentPeriodStart: subscription.current_period_start,
                currentPeriodEnd: subscription.current_period_end,
                trialEndsAt: subscription.trial_end,
                stripeSubscriptionId: subscription.id,
                cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
                pendingCheckoutPlan: null,
                pendingCheckoutStartedAt: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                billingDisclosure,
                hasScheduledSubscription: false,
                scheduledPlan: null,
            };
            // Check if this is a pre-scheduled subscription
            if (subscription.metadata?.preScheduled === 'true' &&
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
            const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), subscription);
            const mergedSubscription = buildMergedSubscription(userData.subscription, {
                status: 'cancelled',
                canceledAt: subscription.canceled_at,
                cancelAtPeriodEnd: false,
                billingDisclosure,
            });
            await userDoc.ref.update({
                subscription: mergedSubscription,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await syncFamilyAccountSubscription(userData, mergedSubscription);
            await applyGrantTransitionMetadata({
                userId: userDoc.id,
                userData,
                subscription: subscription,
            });
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
            const invoiceSubscriptionId = typeof invoice.subscription === 'string'
                ? invoice.subscription
                : invoice.subscription?.id;
            if (invoiceSubscriptionId) {
                const authoritativeSubscription = await getStripe().subscriptions.retrieve(invoiceSubscriptionId);
                await applyGrantTransitionMetadata({
                    userId: userDoc.id,
                    userData,
                    subscription: authoritativeSubscription,
                });
            }
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
    try {
        // Find user by Stripe customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', subscription.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const authoritativeSubscription = await getStripe().subscriptions.retrieve(subscription.id, { expand: ['discounts'] });
            const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), authoritativeSubscription);
            // Update subscription data
            const subscriptionData = {
                status: subscription.status === 'active'
                    ? 'active'
                    : subscription.status === 'trialing'
                        ? 'trial'
                        : subscription.status,
                plan: getPlanFromPriceId(subscription.items.data[0].price.id, userData?.subscription?.plan || 'homeowner'),
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
                hasScheduledSubscription: false,
                scheduledPlan: null,
            };
            // Check if this is a pre-scheduled subscription
            if (subscription.metadata?.preScheduled === 'true' &&
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
            await applyGrantTransitionMetadata({
                userId: userDoc.id,
                userData,
                subscription: authoritativeSubscription,
            });
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
const refreshBillingDisclosureForDiscountEvent = async (userDoc, discount) => {
    const userData = userDoc.data();
    const storedSubscriptionId = String(userData?.subscription?.stripeSubscriptionId || '').trim();
    const eventSubscriptionId = typeof discount?.subscription === 'string'
        ? discount.subscription
        : discount?.subscription?.id || '';
    const subscriptionId = eventSubscriptionId || storedSubscriptionId;
    if (!subscriptionId)
        return;
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
        expand: ['discounts'],
    });
    const billingDisclosure = await (0, stripeBillingDisclosure_1.buildStripeBillingDisclosure)(getStripe(), subscription);
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
const handleDiscountCreated = async (discount) => {
    try {
        // Find user by customer ID
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeCustomerId', '==', discount.customer)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await refreshBillingDisclosureForDiscountEvent(userDoc, discount);
            console.log('Discount applied for user:', userDoc.id, 'Coupon:', discount.coupon?.id);
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
            await refreshBillingDisclosureForDiscountEvent(userDoc, discount);
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
function getPlanFromPriceId(priceId, fallbackPlan = 'homeowner') {
    const homeownerPlusPriceIds = [
        readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId),
        readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId),
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID'),
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID'),
        readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID'),
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID'),
    ].filter(Boolean);
    const propertyPriceIds = [
        readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId),
        readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId),
        readEnv('REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID'),
        readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID'),
        readEnv('STRIPE_PROPERTY_PRICE_ID'),
        readEnv('REACT_APP_STRIPE_PROPERTY_PLAN_ID'),
    ].filter(Boolean);
    const multiHomeownerPriceIds = [
        readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerMonthlyPriceId),
        readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerAnnualPriceId),
    ].filter(Boolean);
    const portfolioPriceIds = [
        readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId),
        readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId),
        readEnv('REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID'),
        readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID'),
        readEnv('STRIPE_PORTFOLIO_PRICE_ID'),
        readEnv('REACT_APP_STRIPE_PORTFOLIO_PLAN_ID'),
    ].filter(Boolean);
    const priceMap = {
        ...Object.fromEntries(homeownerPlusPriceIds.map((id) => [id, 'homeowner_plus'])),
        ...Object.fromEntries(multiHomeownerPriceIds.map((id) => [id, 'multi_homeowner'])),
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
    const homeownerPlusPriceId = readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId) ||
        readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID') ||
        '';
    const homeownerPlusAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId) ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID') ||
        homeownerPlusPriceId;
    const propertyPriceId = readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId) ||
        readEnv('STRIPE_PROPERTY_PRICE_ID') ||
        '';
    const propertyAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId) ||
        readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID') ||
        propertyPriceId;
    const multiHomeownerPriceId = readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerMonthlyPriceId) || '';
    const multiHomeownerAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.multiHomeownerAnnualPriceId) ||
        multiHomeownerPriceId;
    const portfolioPriceId = readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId) ||
        readEnv('STRIPE_PORTFOLIO_PRICE_ID') ||
        '';
    const portfolioAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId) ||
        readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID') ||
        portfolioPriceId;
    const monthlyPlanMap = {
        homeowner_plus: homeownerPlusPriceId,
        multi_homeowner: multiHomeownerPriceId,
        property: propertyPriceId,
        portfolio: portfolioPriceId,
    };
    const annualPlanMap = {
        homeowner_plus: homeownerPlusAnnualPriceId,
        multi_homeowner: multiHomeownerAnnualPriceId,
        property: propertyAnnualPriceId,
        portfolio: portfolioAnnualPriceId,
    };
    return (normalizedCycle === 'year' ? annualPlanMap : monthlyPlanMap)[plan] || '';
}
