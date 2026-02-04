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
exports.getSubscriptionDetails = exports.cancelSubscription = exports.verifyCheckoutSession = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16',
});
const db = admin.firestore();
/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 * Body: { priceId, userId, email, successUrl, cancelUrl }
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId, userId, email, successUrl, cancelUrl } = data;
    if (!priceId || !userId || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        // Get user data to check current subscription
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        let customerId = (_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        // Create or retrieve Stripe customer
        if (!customerId) {
            const customer = await stripe.customers.create({
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
        const session = await stripe.checkout.sessions.create({
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
        console.error('Error creating checkout session:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
    }
});
/**
 * Verify Checkout Session Success
 * POST /api/verify-checkout-session
 * Body: { sessionId }
 */
exports.verifyCheckoutSession = functions.https.onCall(async (data, context) => {
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
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== 'paid') {
            throw new functions.https.HttpsError('failed-precondition', 'Payment not completed');
        }
        const firebaseUID = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.firebaseUID;
        if (!firebaseUID) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid session metadata');
        }
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        // Update user subscription in Firestore
        const subscriptionData = {
            status: 'active',
            plan: getPlanFromPriceId(subscription.items.data[0].price.id),
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
        };
        await db.collection('users').doc(firebaseUID).update({
            subscription: subscriptionData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
exports.cancelSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = data;
    if (!subscriptionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        // Cancel subscription in Stripe
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        // Update user subscription status
        const userQuery = await db
            .collection('users')
            .where('subscription.stripeSubscriptionId', '==', subscriptionId)
            .get();
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            await userDoc.ref.update({
                'subscription.status': 'cancelled',
                'subscription.canceledAt': subscription.cancel_at,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
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
exports.getSubscriptionDetails = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { subscriptionId } = data;
    if (!subscriptionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription ID is required');
    }
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
    }
    catch (error) {
        console.error('Error getting subscription details:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get subscription details');
    }
});
/**
 * Helper function to map Stripe price ID to plan name
 */
function getPlanFromPriceId(priceId) {
    const priceMap = {
        [functions.config().stripe.homeowner_price_id || 'price_homeowner']: 'homeowner',
        [functions.config().stripe.basic_price_id || 'price_basic']: 'basic',
        [functions.config().stripe.professional_price_id || 'price_professional']: 'professional',
    };
    return priceMap[priceId] || 'free';
}
