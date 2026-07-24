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
exports.manageManualOccupancy = exports.hasHistoricalResidentContinuity = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const entitlements_1 = require("@maintley/entitlements");
const accountAuthz_1 = require("./accountAuthz");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const CONTINUITY_BUNDLES = new Set(['property', 'portfolio']);
const cleanText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);
const sanitizeOccupant = (value) => {
    const firstName = cleanText(value.firstName, 80);
    const lastName = cleanText(value.lastName, 80);
    const email = cleanText(value.email, 254).toLowerCase();
    const phone = cleanText(value.phone, 40);
    const leaseEnd = cleanText(value.leaseEnd, 40);
    const tenantInvitationCodeId = cleanText(value.tenantInvitationCodeId, 160);
    if (!firstName || !lastName || !email || !email.includes('@')) {
        throw new functions.https.HttpsError('invalid-argument', 'First name, last name, and a valid email are required.');
    }
    return {
        firstName,
        lastName,
        email,
        phone,
        leaseEnd,
        ...(tenantInvitationCodeId ? { tenantInvitationCodeId } : {}),
    };
};
const hasHistoricalResidentContinuity = (params) => {
    const account = params.account || {};
    const continuity = account.resourceContinuity || {};
    const historicalPlan = String(account.subscription?.plan || '').trim().toLowerCase();
    return (continuity.residentManagementPreviouslyEntitled === true ||
        CONTINUITY_BUNDLES.has(historicalPlan) ||
        (params.propertyTenants || []).length > 0 ||
        (params.grantBundles || []).some((bundleId) => CONTINUITY_BUNDLES.has(bundleId)));
};
exports.hasHistoricalResidentContinuity = hasHistoricalResidentContinuity;
exports.manageManualOccupancy = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign in to manage occupancy records.');
    }
    const action = String(data?.action || '');
    const propertyId = cleanText(data?.propertyId, 180);
    const tenantId = cleanText(data?.tenantId, 180);
    if (!['create', 'update', 'remove'].includes(action) || !propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid occupancy action and property are required.');
    }
    if (action !== 'create' && !tenantId) {
        throw new functions.https.HttpsError('invalid-argument', 'A resident record is required.');
    }
    const accountId = await (0, accountAuthz_1.resolveAccountIdForUser)(context.auth.uid);
    await (0, accountAuthz_1.assertAccountRole)(context.auth.uid, accountId, ['account_owner', 'admin', 'manager']);
    const propertyRef = db.collection('properties').doc(propertyId);
    const accountRef = db.collection('familyAccounts').doc(accountId);
    const [propertySnapshot, accountSnapshot, grantsSnapshot] = await Promise.all([
        propertyRef.get(),
        accountRef.get(),
        accountRef.collection('entitlementGrants').get(),
    ]);
    if (!propertySnapshot.exists || String(propertySnapshot.data()?.accountId || '') !== accountId) {
        throw new functions.https.HttpsError('not-found', 'Property not found for this account.');
    }
    const propertyTenants = Array.isArray(propertySnapshot.data()?.tenants)
        ? propertySnapshot.data().tenants
        : [];
    const entitlements = await (0, subscriptionEntitlements_1.resolveEntitlementsForAccount)(accountId);
    const canInviteTenantAccess = (0, entitlements_1.hasCapability)(entitlements, 'residents.manage');
    const historicalContinuity = (0, exports.hasHistoricalResidentContinuity)({
        account: accountSnapshot.data() || {},
        propertyTenants,
        grantBundles: grantsSnapshot.docs.map((doc) => String(doc.data().bundleId || '')),
    });
    if (action === 'create' && !canInviteTenantAccess && !historicalContinuity) {
        throw new functions.https.HttpsError('permission-denied', 'Adding resident records is available after eligible rental access has been established.');
    }
    const occupantInput = data?.occupant || {};
    const occupant = action === 'create' ? sanitizeOccupant(occupantInput) : null;
    const result = await db.runTransaction(async (transaction) => {
        const current = await transaction.get(propertyRef);
        if (!current.exists || String(current.data()?.accountId || '') !== accountId) {
            throw new functions.https.HttpsError('not-found', 'Property not found for this account.');
        }
        const tenants = Array.isArray(current.data()?.tenants) ? [...current.data().tenants] : [];
        const index = tenantId
            ? tenants.findIndex((candidate) => String(candidate?.id || '') === tenantId)
            : -1;
        let effectiveTenantId = tenantId;
        if (action === 'create') {
            effectiveTenantId = `tenant_${propertyId}_${Date.now()}_${context.auth.uid.slice(0, 8)}`;
            tenants.push({
                id: effectiveTenantId,
                ...occupant,
                accessStatus: 'manual_only',
                createdAt: new Date().toISOString(),
            });
        }
        else if (index < 0) {
            throw new functions.https.HttpsError('not-found', 'Resident record not found.');
        }
        else if (action === 'update') {
            const sanitizedUpdate = sanitizeOccupant({
                ...tenants[index],
                ...occupantInput,
            });
            tenants[index] = {
                ...tenants[index],
                ...sanitizedUpdate,
                updatedAt: new Date().toISOString(),
            };
        }
        else {
            tenants.splice(index, 1);
        }
        transaction.update(propertyRef, {
            tenants,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (canInviteTenantAccess) {
            transaction.set(accountRef, {
                resourceContinuity: {
                    residentManagementPreviouslyEntitled: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
            }, { merge: true });
        }
        return effectiveTenantId;
    });
    return {
        success: true,
        tenantId: result,
        canInviteTenantAccess,
        manualOnly: !canInviteTenantAccess,
    };
});
