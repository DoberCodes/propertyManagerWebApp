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
exports.sendPushOnNotificationCreate = (0, firestore_1.onDocumentCreated)('notifications/{notificationId}', async (event) => {
    var _a;
    const notification = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!notification || !notification.userId)
        return;
    // Get the recipient user's push token
    const userDoc = await db.collection('users').doc(notification.userId).get();
    const user = userDoc.exists ? userDoc.data() : null;
    const pushToken = user && user.pushToken;
    if (!pushToken) {
        console.log('No push token for user', notification.userId);
        return;
    }
    // Compose the push notification
    const payload = {
        notification: {
            title: notification.title || 'New Notification',
            body: notification.message || '',
        },
        data: {
            notificationId: event.params.notificationId,
            ...(notification.data && typeof notification.data === 'object'
                ? notification.data
                : {}),
        },
    };
    // Send the push notification via FCM
    try {
        const response = await admin.messaging().sendToDevice(pushToken, payload);
        console.log('Push sent to', pushToken, response);
    }
    catch (err) {
        console.error('Error sending push notification:', err);
    }
});
