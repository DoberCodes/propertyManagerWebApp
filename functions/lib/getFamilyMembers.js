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
exports.getFamilyMembers = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const serializeFirestoreValue = (value) => {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value)) {
        return value.map((item) => serializeFirestoreValue(item));
    }
    if (typeof value === 'object') {
        if (value && typeof value.toDate === 'function') {
            return value.toDate().toISOString();
        }
        const serializedObject = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            serializedObject[key] = serializeFirestoreValue(nestedValue);
        }
        return serializedObject;
    }
    return value;
};
exports.getFamilyMembers = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const accountId = String(data?.accountId || '').trim();
    if (!accountId) {
        throw new functions.https.HttpsError('invalid-argument', 'accountId is required');
    }
    const accountDoc = await db
        .collection('familyAccounts')
        .doc(accountId)
        .get();
    if (!accountDoc.exists) {
        return { members: [] };
    }
    const accountData = accountDoc.data() || {};
    const memberIds = Array.isArray(accountData.memberIds)
        ? accountData.memberIds
        : [];
    const callerUid = context.auth.uid;
    const canAccess = accountData.ownerId === callerUid || memberIds.includes(callerUid);
    if (!canAccess) {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized to view this family account');
    }
    const uniqueMemberIds = Array.from(new Set(memberIds.filter(Boolean)));
    if (uniqueMemberIds.length === 0) {
        return { members: [] };
    }
    const memberDocs = await Promise.all(uniqueMemberIds.map((memberId) => db.collection('users').doc(memberId).get()));
    const members = memberDocs
        .filter((docSnapshot) => docSnapshot.exists)
        .map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(serializeFirestoreValue(docSnapshot.data()) || {}),
    }));
    return { members };
});
