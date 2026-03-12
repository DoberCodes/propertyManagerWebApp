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
exports.syncTenantAccessFromInvites = exports.redeemTenantInvitationCode = exports.revokeTenantInvitationCode = exports.createTenantInvitationCode = exports.validateTenantInvitationCode = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const inviteAuthz_1 = require("./inviteAuthz");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const upsertTenantAccessFromInvites = async (params) => {
    const normalizedEmail = String(params.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        return { linkedAccountIds: [], linkedPropertyIds: [] };
    }
    const invitesSnapshot = await db
        .collection('tenantInvitationCodes')
        .where('tenantEmail', '==', normalizedEmail)
        .where('status', 'in', ['active', 'redeemed'])
        .get();
    if (invitesSnapshot.empty) {
        return { linkedAccountIds: [], linkedPropertyIds: [] };
    }
    const accountIds = new Set();
    const propertyIds = new Set();
    invitesSnapshot.docs.forEach((inviteDoc) => {
        const invite = inviteDoc.data();
        const inviteAccountId = String((invite === null || invite === void 0 ? void 0 : invite.accountId) || '').trim();
        const invitePropertyId = String((invite === null || invite === void 0 ? void 0 : invite.propertyId) || '').trim();
        if (inviteAccountId) {
            accountIds.add(inviteAccountId);
        }
        if (invitePropertyId) {
            propertyIds.add(invitePropertyId);
        }
    });
    const linkedAccountIds = Array.from(accountIds);
    const linkedPropertyIds = Array.from(propertyIds);
    const userRef = db.collection('users').doc(params.uid);
    const userSnapshot = await userRef.get();
    const userData = userSnapshot.data() || {};
    if (linkedAccountIds.length > 0) {
        const primaryAccountId = linkedAccountIds[0];
        await userRef.set({
            accountId: primaryAccountId,
            isAccountOwner: false,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        for (const accountId of linkedAccountIds) {
            const membershipRef = db
                .collection('accountMemberships')
                .doc(`${params.uid}_${accountId}`);
            await membershipRef.set({
                accountId,
                userId: params.uid,
                email: normalizedEmail,
                role: 'tenant',
                status: 'active',
                updatedAt: new Date().toISOString(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
    for (const propertyId of linkedPropertyIds) {
        const propertyRef = db.collection('properties').doc(propertyId);
        const propertySnapshot = await propertyRef.get();
        if (!propertySnapshot.exists) {
            continue;
        }
        const propertyData = propertySnapshot.data() || {};
        const existingTenants = (propertyData.tenants || []);
        const tenantAlreadyLinked = existingTenants.some((tenant) => String((tenant === null || tenant === void 0 ? void 0 : tenant.email) || '').trim().toLowerCase() === normalizedEmail);
        if (!tenantAlreadyLinked) {
            const fallbackFirstName = String((userData === null || userData === void 0 ? void 0 : userData.firstName) || '').trim();
            const fallbackLastName = String((userData === null || userData === void 0 ? void 0 : userData.lastName) || '').trim();
            existingTenants.push({
                id: `tenant_${params.uid}`,
                firstName: fallbackFirstName,
                lastName: fallbackLastName,
                email: normalizedEmail,
                phone: String((userData === null || userData === void 0 ? void 0 : userData.phone) || '').trim(),
                createdAt: new Date().toISOString(),
            });
            await propertyRef.update({
                tenants: existingTenants,
                updatedAt: new Date().toISOString(),
            });
        }
    }
    return { linkedAccountIds, linkedPropertyIds };
};
exports.validateTenantInvitationCode = functions.https.onCall(async (data) => {
    const promoCode = String((data === null || data === void 0 ? void 0 : data.promoCode) || '').trim().toLowerCase();
    const tenantEmail = String((data === null || data === void 0 ? void 0 : data.tenantEmail) || '').trim().toLowerCase();
    if (!promoCode || !tenantEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'promoCode and tenantEmail are required');
    }
    const snapshot = await db
        .collection('tenantInvitationCodes')
        .where('tenantEmail', '==', tenantEmail)
        .where('codeLower', '==', promoCode)
        .where('status', '==', 'active')
        .limit(1)
        .get();
    return {
        valid: !snapshot.empty,
    };
});
exports.createTenantInvitationCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const propertyId = String((data === null || data === void 0 ? void 0 : data.propertyId) || '').trim() || undefined;
    const tenantEmail = String((data === null || data === void 0 ? void 0 : data.tenantEmail) || '').trim().toLowerCase();
    const code = String((data === null || data === void 0 ? void 0 : data.code) || '').trim();
    if (!tenantEmail || !code) {
        throw new functions.https.HttpsError('invalid-argument', 'tenantEmail and code are required');
    }
    const { accountId } = await (0, inviteAuthz_1.assertInviteCapability)(context.auth.uid, 'tenant');
    const now = new Date().toISOString();
    const invitationCode = {
        code,
        codeLower: code.toLowerCase(),
        status: 'active',
        createdByUserId: context.auth.uid,
        createdByEmail: context.auth.token.email || undefined,
        accountId,
        propertyId,
        email: tenantEmail,
        tenantEmail,
        createdAt: now,
        updatedAt: now,
    };
    const sanitized = Object.fromEntries(Object.entries(invitationCode).filter(([, value]) => value !== undefined));
    const docRef = await db.collection('tenantInvitationCodes').add(sanitized);
    return {
        id: docRef.id,
        ...sanitized,
    };
});
exports.revokeTenantInvitationCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const propertyId = String((data === null || data === void 0 ? void 0 : data.propertyId) || '').trim() || undefined;
    const tenantEmail = String((data === null || data === void 0 ? void 0 : data.tenantEmail) || '').trim().toLowerCase();
    if (!tenantEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'tenantEmail is required');
    }
    const { accountId } = await (0, inviteAuthz_1.assertInviteCapability)(context.auth.uid, 'tenant');
    let inviteQuery = db
        .collection('tenantInvitationCodes')
        .where('accountId', '==', accountId)
        .where('tenantEmail', '==', tenantEmail)
        .where('status', '==', 'active');
    if (propertyId) {
        inviteQuery = inviteQuery.where('propertyId', '==', propertyId);
    }
    const snapshot = await inviteQuery.get();
    const now = new Date().toISOString();
    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
            status: 'revoked',
            revokedAt: now,
            updatedAt: now,
        });
    });
    await batch.commit();
    return { success: true, revokedCount: snapshot.size };
});
exports.redeemTenantInvitationCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const promoCode = String((data === null || data === void 0 ? void 0 : data.promoCode) || '').trim().toLowerCase();
    const callerEmail = String(context.auth.token.email || '').trim().toLowerCase();
    if (!promoCode) {
        throw new functions.https.HttpsError('invalid-argument', 'promoCode is required');
    }
    if (!callerEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Authenticated user email is required');
    }
    const snapshot = await db
        .collection('tenantInvitationCodes')
        .where('tenantEmail', '==', callerEmail)
        .where('codeLower', '==', promoCode)
        .where('status', '==', 'active')
        .limit(1)
        .get();
    if (snapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'Invalid or expired tenant promo code');
    }
    const promoDoc = snapshot.docs[0];
    const now = new Date().toISOString();
    await promoDoc.ref.update({
        status: 'redeemed',
        redeemedByUserId: context.auth.uid,
        redeemedByEmail: callerEmail,
        redeemedAt: now,
        updatedAt: now,
    });
    const accessSyncResult = await upsertTenantAccessFromInvites({
        uid: context.auth.uid,
        email: callerEmail,
    });
    return {
        success: true,
        linkedAccountIds: accessSyncResult.linkedAccountIds,
        linkedPropertyIds: accessSyncResult.linkedPropertyIds,
    };
});
exports.syncTenantAccessFromInvites = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const callerEmail = String(context.auth.token.email || '')
        .trim()
        .toLowerCase();
    if (!callerEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Authenticated user email is required');
    }
    const result = await upsertTenantAccessFromInvites({
        uid: context.auth.uid,
        email: callerEmail,
    });
    return {
        success: true,
        linkedAccountIds: result.linkedAccountIds,
        linkedPropertyIds: result.linkedPropertyIds,
    };
});
