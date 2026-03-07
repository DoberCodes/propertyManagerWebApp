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
exports.stripeWebhook = exports.getSubscriptionDetails = exports.cancelSubscription = exports.verifyCheckoutSession = exports.createTrialSubscription = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)(process.env.STRIPE_SECRET_KEY || 'STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
if (!admin.apps.length) {
    admin.initializeApp();
}
// Initialize Stripe lazily to avoid accessing secrets at deployment time
let stripe = null;
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
    return secretFromManager || secretFromFunctionsConfig || secretFromEnv;
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
    return secretFromManager || secretFromEnv;
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
    var _a, _b, _c;
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId, userId, email, successUrl, cancelUrl } = data;
    if (!priceId || !userId || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        console.log('Creating checkout session with:', {
            priceId,
            userId,
            email,
            successUrl,
            cancelUrl,
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
                },
            });
            customerId = customer.id;
            // Update user with customer ID
            await db.collection('users').doc(userId).update({
                'subscription.stripeCustomerId': customerId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Create checkout session
        const session = await getStripe().checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                firebaseUID: userId,
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
        if ((_b = stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) === null || _b === void 0 ? void 0 : _b.includes('No such price')) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe price ID is invalid. Verify REACT_APP_STRIPE_*_PLAN_ID values and deployed function config.');
        }
        if ((_c = stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) === null || _c === void 0 ? void 0 : _c.includes('Invalid API Key')) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key is invalid or missing in backend configuration.');
        }
        throw new functions.https.HttpsError('internal', (stripeError === null || stripeError === void 0 ? void 0 : stripeError.message) || 'Failed to create checkout session');
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
    const { priceId, userId, email, trialDays = 30 } = data;
    if (!priceId || !userId || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        console.log('Creating trial subscription with:', {
            priceId,
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
                    price: priceId,
                },
            ],
            trial_period_days: trialDays,
            metadata: {
                firebaseUID: userId,
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
        if (session.payment_status !== 'paid') {
            throw new functions.https.HttpsError('failed-precondition', 'Payment not completed');
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
 * Handle Stripe Webhook Events
 * POST /stripe/webhook
 */
exports.stripeWebhook = functions
    .runWith({ secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] })
    .https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = resolveStripeWebhookSecret();
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured.');
        res.status(500).send('Webhook secret not configured');
        return;
    }
    try {
        // Handle raw body for webhook signature verification
        let rawBody;
        if (req.rawBody) {
            rawBody = req.rawBody;
        }
        else {
            // For newer Firebase Functions versions, reconstruct raw body
            rawBody = Buffer.from(JSON.stringify(req.body));
        }
        const event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
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
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error}`);
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
    const priceMap = {
        [process.env.STRIPE_HOMEOWNER_PRICE_ID || 'price_homeowner']: 'homeowner',
        [process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID || 'price_homeowner']: 'homeowner',
        [process.env.STRIPE_BASIC_PRICE_ID || 'price_basic']: 'basic',
        [process.env.REACT_APP_STRIPE_BASIC_PLAN_ID || 'price_basic']: 'basic',
        [process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional']: 'professional',
        [process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID || 'price_professional']: 'professional',
    };
    return priceMap[priceId] || fallbackPlan;
}
/**
 * Helper function to map plan name to Stripe price ID
 */
function getPriceIdFromPlan(plan) {
    const planMap = {
        homeowner: process.env.STRIPE_HOMEOWNER_PRICE_ID || 'price_homeowner',
        basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
        professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    };
    return planMap[plan] || 'price_homeowner'; // Default to homeowner
}
