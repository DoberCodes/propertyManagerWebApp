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
exports.assertAccountRole = exports.hasAnyRole = exports.getMembership = exports.resolveAccountIdForUser = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const resolveAccountIdForUser = async (uid) => {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const directAccountId = String(userData.accountId || '').trim();
    if (directAccountId)
        return directAccountId;
    const familySnapshot = await db
        .collection('familyAccounts')
        .where('memberIds', 'array-contains', uid)
        .limit(1)
        .get();
    if (!familySnapshot.empty) {
        return familySnapshot.docs[0].id;
    }
    return uid;
};
exports.resolveAccountIdForUser = resolveAccountIdForUser;
const getMembership = async (accountId, uid) => {
    const membershipIds = [`${accountId}_${uid}`, `${uid}_${accountId}`];
    let membershipDoc = null;
    for (const membershipId of membershipIds) {
        const candidate = await db
            .collection('accountMemberships')
            .doc(membershipId)
            .get();
        if (candidate.exists) {
            membershipDoc = candidate;
            break;
        }
    }
    if (!membershipDoc || !membershipDoc.exists) {
        return null;
    }
    const data = membershipDoc.data() || {};
    const normalizedRoles = Array.isArray(data.roles)
        ? data.roles
        : typeof data.role === 'string' && data.role.trim().length > 0
            ? [String(data.role).trim()]
            : [];
    return {
        accountId: String(data.accountId || accountId),
        userId: String(data.userId || uid),
        roles: normalizedRoles,
        status: data.status || 'active',
    };
};
exports.getMembership = getMembership;
const hasAnyRole = (membership, roles) => {
    if (!membership)
        return false;
    if (membership.status === 'disabled')
        return false;
    return roles.some((role) => membership.roles.includes(role));
};
exports.hasAnyRole = hasAnyRole;
const assertAccountRole = async (uid, accountId, roles) => {
    const membership = await (0, exports.getMembership)(accountId, uid);
    if ((0, exports.hasAnyRole)(membership, roles)) {
        return;
    }
    // Legacy fallback: infer owner/admin role from user profile when membership records
    // are missing or stale.
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const normalizedUserRole = String(userData.role || '').trim().toLowerCase();
    const isAccountOwner = userData.isAccountOwner === true || String(accountId).trim() === String(uid).trim();
    const inferredRoles = new Set();
    if (isAccountOwner) {
        inferredRoles.add('account_owner');
    }
    if (normalizedUserRole === 'admin') {
        inferredRoles.add('admin');
    }
    if (normalizedUserRole === 'manager') {
        inferredRoles.add('manager');
    }
    if (roles.some((role) => inferredRoles.has(role))) {
        return;
    }
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission for this account action');
};
exports.assertAccountRole = assertAccountRole;
