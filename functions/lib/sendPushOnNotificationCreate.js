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
const pushDelivery_1 = require("./pushDelivery");
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.sendPushOnNotificationCreate = (0, firestore_1.onDocumentCreated)('notifications/{notificationId}', async (event) => {
    const notification = event.data?.data();
    if (!notification || !notification.userId) {
        console.log('Invalid notification document - missing userId');
        return;
    }
    console.log(`Processing notification ${event.params.notificationId} for user ${notification.userId}`);
    if (notification.suppressAutoPush === true) {
        console.log(`Push skipped for notification ${event.params.notificationId}: handled by event channel`);
        return;
    }
    await (0, pushDelivery_1.sendPushForNotification)(event.params.notificationId, notification);
});
