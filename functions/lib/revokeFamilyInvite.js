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
exports.revokeFamilyInvite = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.revokeFamilyInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const inviteId = String(data?.inviteId || '').trim();
    const accountId = String(data?.accountId || '').trim();
    if (!inviteId || !accountId) {
        throw new functions.https.HttpsError('invalid-argument', 'inviteId and accountId are required');
    }
    const accountDoc = await db
        .collection('familyAccounts')
        .doc(accountId)
        .get();
    if (!accountDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Family account not found');
    }
    const accountData = accountDoc.data() || {};
    if (accountData.ownerId !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only account owners can revoke invites');
    }
    const inviteRef = db.collection('familyInvites').doc(inviteId);
    const inviteDoc = await inviteRef.get();
    if (!inviteDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Invite not found');
    }
    const inviteData = inviteDoc.data() || {};
    if (inviteData.accountId !== accountId) {
        throw new functions.https.HttpsError('permission-denied', 'Invite does not belong to this family account');
    }
    if (inviteData.status !== 'pending') {
        return { success: true, message: 'Invite already closed' };
    }
    await inviteRef.update({
        status: 'revoked',
        updatedAt: Date.now(),
        revokedAt: Date.now(),
        revokedBy: context.auth.uid,
    });
    return { success: true, message: 'Invite revoked' };
});
