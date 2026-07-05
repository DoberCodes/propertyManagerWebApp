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
exports.sendPushForNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
const PUSH_NOTIFICATION_PLANS = new Set([
    'homeowner_plus',
    'property',
    'portfolio',
]);
const getDb = () => admin.firestore();
const canUsePushNotifications = (subscription) => {
    if (!subscription) {
        return false;
    }
    const effectivePlan = (0, subscriptionEntitlements_1.getEffectiveSubscriptionPlanId)(subscription, 'homeowner');
    return PUSH_NOTIFICATION_PLANS.has(effectivePlan);
};
const getUserPushTokens = (user, options = {}) => {
    const tokens = new Set();
    const legacyToken = String(user.pushToken || '').trim();
    if (legacyToken) {
        tokens.add(legacyToken);
    }
    if (Array.isArray(user.pushTokens)) {
        for (const record of user.pushTokens) {
            const token = String(record?.token || '').trim();
            const platform = String(record?.platform || '').trim().toLowerCase();
            if (!token || record?.disabled === true) {
                continue;
            }
            if (options.androidOnly && platform === 'web') {
                continue;
            }
            tokens.add(token);
        }
    }
    return Array.from(tokens);
};
const cleanupInvalidPushToken = async (userId, pushToken) => {
    try {
        const userRef = getDb().collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const updates = {};
            if (userData?.pushToken === pushToken) {
                updates.pushToken = admin.firestore.FieldValue.delete();
                updates.pushTokenUpdatedAt = admin.firestore.FieldValue.delete();
            }
            if (Array.isArray(userData?.pushTokens)) {
                const nextPushTokens = userData.pushTokens.filter((record) => String(record?.token || '').trim() !== pushToken);
                if (nextPushTokens.length !== userData.pushTokens.length) {
                    updates.pushTokens = nextPushTokens;
                }
            }
            if (Object.keys(updates).length > 0) {
                await userRef.update(updates);
                console.log(`Cleaned up invalid push token for user ${userId}`);
            }
        }
    }
    catch (error) {
        console.error(`Failed to cleanup push token for user ${userId}:`, error);
    }
};
const toMessageData = (notificationId, data, actionUrl) => {
    const messageData = { notificationId };
    if (actionUrl) {
        messageData.actionUrl = String(actionUrl);
    }
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
};
const sendPushForNotification = async (notificationId, notification, options = {}) => {
    if (!notification || !notification.userId) {
        console.log('Invalid notification document - missing userId');
        return;
    }
    const userId = String(notification.userId);
    const userDoc = await getDb().collection('users').doc(userId).get();
    const user = userDoc.exists ? userDoc.data() : null;
    if (!user) {
        console.log(`User ${userId} not found`);
        return;
    }
    const pushTokens = getUserPushTokens(user, options);
    if (pushTokens.length === 0) {
        console.log(`No push tokens for user ${userId}`);
        return;
    }
    if (!canUsePushNotifications(user.subscription)) {
        console.log(`Push skipped for user ${userId}: plan does not include push notifications`);
        return;
    }
    const userPreferencesDoc = await getDb()
        .collection('userPreferences')
        .doc(userId)
        .get();
    const userPreferences = userPreferencesDoc.exists
        ? userPreferencesDoc.data()?.notificationPreferences
        : null;
    const notificationPreferences = user.notificationPreferences || userPreferences || null;
    if (notificationPreferences?.enabled === false) {
        console.log(`Notifications are disabled for user ${userId}`);
        return;
    }
    const notificationType = notification.type;
    if (notificationType &&
        notificationPreferences?.types &&
        notificationPreferences.types[notificationType] === false) {
        console.log(`Notification type '${notificationType}' is disabled for user ${userId}`);
        return;
    }
    const messageData = toMessageData(notificationId, notification.data, notification.actionUrl);
    try {
        const message = {
            tokens: pushTokens,
            notification: {
                title: notification.title || 'New Notification',
                body: notification.message || '',
            },
            data: messageData,
            webpush: {
                notification: {
                    icon: '/icons/icon-192.png',
                    badge: '/icons/icon-192.png',
                },
            },
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Push delivery for user ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed`);
        const cleanupPromises = response.responses
            .map((sendResponse, index) => ({ sendResponse, token: pushTokens[index] }))
            .filter(({ sendResponse }) => {
            const errorCode = String(sendResponse.error?.code || '');
            return (errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-registration-token');
        })
            .map(({ token }) => cleanupInvalidPushToken(userId, token));
        await Promise.all(cleanupPromises);
    }
    catch (err) {
        console.error(`Error sending push notification to user ${userId}:`, err);
    }
};
exports.sendPushForNotification = sendPushForNotification;
