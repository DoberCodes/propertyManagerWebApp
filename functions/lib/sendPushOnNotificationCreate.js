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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushOnNotificationCreate = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
const db = admin.firestore();
const PUSH_NOTIFICATION_PLANS = new Set([
    'homeowner_plus',
    'property',
    'portfolio',
]);
const isTrialActive = (subscription) => {
    if ((subscription === null || subscription === void 0 ? void 0 : subscription.status) !== 'trial') {
        return false;
    }
    if (!subscription.trialEndsAt) {
        return true;
    }
    return subscription.trialEndsAt > Date.now() / 1000;
};
const canUsePushNotifications = (subscription) => {
    if (!subscription) {
        return false;
    }
    if (subscription.status !== 'active' && !isTrialActive(subscription)) {
        return false;
    }
    const scheduledPlan = String(subscription.scheduledPlan || '').trim().toLowerCase();
    const rawPlan = subscription.hasScheduledSubscription && scheduledPlan
        ? scheduledPlan
        : String(subscription.plan || '').trim().toLowerCase();
    return PUSH_NOTIFICATION_PLANS.has(rawPlan);
};
/**
 * Clean up invalid push tokens from user documents
 */
async function cleanupInvalidPushToken(userId, pushToken) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if ((userData === null || userData === void 0 ? void 0 : userData.pushToken) === pushToken) {
                // Remove the invalid token
                await userRef.update({
                    pushToken: admin.firestore.FieldValue.delete(),
                    pushTokenUpdatedAt: admin.firestore.FieldValue.delete(),
                });
                console.log(`Cleaned up invalid push token for user ${userId}`);
            }
        }
    }
    catch (error) {
        console.error(`Failed to cleanup push token for user ${userId}:`, error);
    }
}
function toMessageData(notificationId, data) {
    const messageData = { notificationId };
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return messageData;
    }
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) {
            continue;
        }
        messageData[key] =
            typeof value === 'string' ? value : JSON.stringify(value);
    }
    return messageData;
}
exports.sendPushOnNotificationCreate = (0, firestore_1.onDocumentCreated)('notifications/{notificationId}', async (event) => {
    var _a, _b;
    const notification = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!notification || !notification.userId) {
        console.log('Invalid notification document - missing userId');
        return;
    }
    console.log(`Processing notification ${event.params.notificationId} for user ${notification.userId}`);
    // Get the recipient user's push token
    const userDoc = await db.collection('users').doc(notification.userId).get();
    const user = userDoc.exists ? userDoc.data() : null;
    if (!user) {
        console.log(`User ${notification.userId} not found`);
        return;
    }
    const pushToken = user.pushToken;
    if (!pushToken) {
        console.log(`No push token for user ${notification.userId}`);
        return;
    }
    if (!canUsePushNotifications(user.subscription)) {
        console.log(`Push skipped for user ${notification.userId}: plan does not include push notifications`);
        return;
    }
    // Check user notification preferences. The app stores preferences on the
    // user doc; keep the old userPreferences doc as a backward-compatible fallback.
    const userPreferencesDoc = await db
        .collection('userPreferences')
        .doc(notification.userId)
        .get();
    const userPreferences = userPreferencesDoc.exists
        ? (_b = userPreferencesDoc.data()) === null || _b === void 0 ? void 0 : _b.notificationPreferences
        : null;
    const notificationPreferences = user.notificationPreferences || userPreferences || null;
    if ((notificationPreferences === null || notificationPreferences === void 0 ? void 0 : notificationPreferences.enabled) === false) {
        console.log(`Notifications are disabled for user ${notification.userId}`);
        return;
    }
    const notificationType = notification.type; // Assuming notification.type exists
    if (notificationType &&
        (notificationPreferences === null || notificationPreferences === void 0 ? void 0 : notificationPreferences.types) &&
        notificationPreferences.types[notificationType] === false) {
        console.log(`Notification type '${notificationType}' is disabled for user ${notification.userId}`);
        return;
    }
    const messageData = toMessageData(event.params.notificationId, notification.data);
    // Send the push notification via FCM
    try {
        const message = {
            token: pushToken,
            notification: {
                title: notification.title || 'New Notification',
                body: notification.message || '',
            },
            data: messageData,
        };
        const response = await admin.messaging().send(message);
        console.log(`Push sent successfully to user ${notification.userId}:`, response);
    }
    catch (err) {
        console.error(`Error sending push notification to user ${notification.userId}:`, err);
        const errorCode = String((err === null || err === void 0 ? void 0 : err.code) || '');
        if (errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token') {
            await cleanupInvalidPushToken(notification.userId, pushToken);
        }
    }
});
