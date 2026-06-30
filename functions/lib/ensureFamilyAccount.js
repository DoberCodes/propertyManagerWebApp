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
exports.ensureFamilyAccount = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const deriveMembershipRoles = (isAccountOwner, userRole) => {
    const roles = new Set(['member']);
    const normalizedRole = String(userRole || '').trim().toLowerCase();
    if (isAccountOwner) {
        roles.add('family_owner');
        roles.add('account_owner');
        roles.add('admin');
    }
    if (normalizedRole === 'admin' || normalizedRole === 'property_manager') {
        roles.add('admin');
    }
    if (normalizedRole === 'assistant_manager') {
        roles.add('manager');
    }
    return Array.from(roles);
};
const serializeFirestoreValue = (value) => {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value.map((item) => serializeFirestoreValue(item));
    if (typeof value === 'object') {
        if (value && typeof value.toDate === 'function') {
            return value.toDate().toISOString();
        }
        const output = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            output[key] = serializeFirestoreValue(nestedValue);
        }
        return output;
    }
    return value;
};
exports.ensureFamilyAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
    }
    const userData = userDoc.data() || {};
    const requestedAccountId = String(data?.accountId || '').trim();
    const accountId = requestedAccountId || String(userData.accountId || '').trim() || uid;
    const isOwner = userData.isAccountOwner === true ||
        accountId === uid ||
        userData.id === uid;
    const accountRef = db.collection('familyAccounts').doc(accountId);
    const membershipRef = db
        .collection('accountMemberships')
        .doc(`${accountId}_${uid}`);
    await db.runTransaction(async (transaction) => {
        const accountDoc = await transaction.get(accountRef);
        const membershipDoc = await transaction.get(membershipRef);
        const desiredRoles = deriveMembershipRoles(isOwner, String(userData.role || ''));
        if (!membershipDoc.exists) {
            transaction.set(membershipRef, {
                accountId,
                userId: uid,
                roles: desiredRoles,
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        else {
            const existingMembership = membershipDoc.data() || {};
            const existingRoles = Array.isArray(existingMembership.roles)
                ? existingMembership.roles
                : [];
            const mergedRoles = Array.from(new Set([...existingRoles, ...desiredRoles]));
            transaction.update(membershipRef, {
                roles: mergedRoles,
                status: 'active',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        if (!accountDoc.exists) {
            if (!isOwner || accountId !== uid) {
                throw new functions.https.HttpsError('permission-denied', 'Only account owners can initialize family account records');
            }
            const subscriptionToStore = data?.subscription ||
                userData.subscription ||
                null;
            transaction.set(accountRef, {
                id: accountId,
                ownerId: uid,
                memberIds: [uid],
                propertyCount: 0,
                deviceCount: 0,
                subscription: subscriptionToStore,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }
        if (data?.syncSubscription && isOwner) {
            const subscriptionToStore = data?.subscription ||
                userData.subscription;
            if (subscriptionToStore) {
                transaction.update(accountRef, {
                    subscription: subscriptionToStore,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
    });
    const finalAccountDoc = await accountRef.get();
    const finalData = finalAccountDoc.data() || {};
    return {
        id: accountId,
        ownerId: finalData.ownerId,
        memberIds: Array.isArray(finalData.memberIds) ? finalData.memberIds : [],
        subscription: serializeFirestoreValue(finalData.subscription),
        updatedAt: serializeFirestoreValue(finalData.updatedAt),
    };
});
