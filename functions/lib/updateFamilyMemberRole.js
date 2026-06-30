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
exports.updateFamilyMemberRole = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.updateFamilyMemberRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const callerUid = context.auth.uid;
    const accountId = String(data?.accountId || '').trim();
    const memberId = String(data?.memberId || '').trim();
    const role = String(data?.role || '').trim();
    if (!accountId || !memberId || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'accountId, memberId, and role are required');
    }
    if (!['admin', 'member'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Role must be either admin or member');
    }
    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data() || {};
    const accountDoc = await db.collection('familyAccounts').doc(accountId).get();
    if (!accountDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Family account not found');
    }
    const accountData = accountDoc.data() || {};
    const memberIds = Array.isArray(accountData.memberIds)
        ? accountData.memberIds
        : [];
    const callerIsOwner = accountData.ownerId === callerUid;
    const callerIsAdmin = callerData.accountId === accountId && callerData.role === 'admin';
    if (!callerIsOwner && !callerIsAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Only account owners or admins can update family member roles');
    }
    if (!memberIds.includes(memberId)) {
        throw new functions.https.HttpsError('not-found', 'Family member not found in account');
    }
    if (memberId === accountData.ownerId) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot change the account owner role');
    }
    await db.collection('users').doc(memberId).update({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const membershipRef = db
        .collection('accountMemberships')
        .doc(`${accountId}_${memberId}`);
    const membershipDoc = await membershipRef.get();
    if (membershipDoc.exists) {
        await membershipRef.set({
            roles: [role],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return {
        success: true,
        message: `Updated family member role to ${role}`,
    };
});
