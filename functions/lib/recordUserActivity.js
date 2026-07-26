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
exports.recordUserActivity = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const MINIMUM_ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;
const toMillis = (value) => {
    if (value && typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
/**
 * Records activity only for the authenticated caller. The request deliberately
 * accepts no target user identifier, so admin inspection cannot update the
 * customer being inspected.
 */
exports.recordUserActivity = functions
    .region('us-central1')
    .https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const userRef = db.collection('users').doc(context.auth.uid);
    const nowMs = Date.now();
    let recorded = false;
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
        }
        const lastActiveMs = toMillis(snapshot.data()?.lastActiveAt);
        if (lastActiveMs && nowMs - lastActiveMs < MINIMUM_ACTIVITY_WRITE_INTERVAL_MS) {
            return;
        }
        transaction.update(userRef, {
            lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        recorded = true;
    });
    return { success: true, recorded };
});
