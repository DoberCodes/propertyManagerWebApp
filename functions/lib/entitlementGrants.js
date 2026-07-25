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
exports.finalizeFirstPropertyTrial = exports.issueHomeownerPlusTrialOnFirstProperty = exports.issueFirstPropertyTrial = exports.getInitialTrialEligibility = exports.isIntentionalFreeOwnerSubscription = exports.HOMEOWNER_PLUS_TRIAL_DURATION_DAYS = exports.HOMEOWNER_PLUS_TRIAL_POLICY_VERSION = exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID = exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const entitlements_1 = require("@maintley/entitlements");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
const accountAuthz_1 = require("./accountAuthz");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID = 'homeowner_plus_first_property_trial_v1';
exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID = 'homeowner_plus_first_property_trial';
exports.HOMEOWNER_PLUS_TRIAL_POLICY_VERSION = 'v1';
exports.HOMEOWNER_PLUS_TRIAL_DURATION_DAYS = 30;
const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';
const SYSTEM_ACTOR_ID = 'system:first-property-trial';
const isTrialIssuanceEnabled = () => subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.homeownerPlusProductTrial === true &&
    subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.internalEntitlementGrantIssuance === true;
const asRecord = (value) => typeof value === 'object' && value ? value : {};
const isIntentionalFreeOwnerSubscription = (value) => {
    return (0, entitlements_1.isFirstPropertyTrialEligible)({
        homeownerPlusProductTrial: true,
        internalEntitlementGrantIssuance: true,
        accountCreatedAtMs: 1,
        eligibilityStartMs: 1,
        subscription: asRecord(value),
    });
};
exports.isIntentionalFreeOwnerSubscription = isIntentionalFreeOwnerSubscription;
const serializeCallableValue = (value) => {
    if (value instanceof admin.firestore.Timestamp) {
        return value.toDate().toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(serializeCallableValue);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
            key,
            serializeCallableValue(entry),
        ]));
    }
    return value;
};
const getInitialTrialEligibility = (subscription, accountCreatedAt) => {
    const eligibilityStartMs = Date.parse(String(process.env.HOMEOWNER_PLUS_TRIAL_ELIGIBILITY_START_AT || ''));
    const createdAtMs = accountCreatedAt &&
        typeof accountCreatedAt.toMillis === 'function'
        ? accountCreatedAt.toMillis()
        : Date.parse(String(accountCreatedAt || ''));
    if (!(0, entitlements_1.isFirstPropertyTrialEligible)({
        homeownerPlusProductTrial: subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.homeownerPlusProductTrial,
        internalEntitlementGrantIssuance: subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.internalEntitlementGrantIssuance,
        accountCreatedAtMs: createdAtMs,
        eligibilityStartMs,
        subscription: asRecord(subscription),
    })) {
        return null;
    }
    return {
        programId: exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
        policyVersion: exports.HOMEOWNER_PLUS_TRIAL_POLICY_VERSION,
        status: 'eligible',
        eligibleAt: admin.firestore.FieldValue.serverTimestamp(),
    };
};
exports.getInitialTrialEligibility = getInitialTrialEligibility;
const createTrialGrant = (accountId, ownerId, propertyId, startsAtMs) => ({
    grantId: exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID,
    programId: exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
    accountId,
    kind: 'temporary',
    state: 'active',
    bundleId: 'homeowner_plus',
    bundleVersion: entitlements_1.BUNDLE_VERSION,
    startsAtMs,
    endsAtMs: startsAtMs + exports.HOMEOWNER_PLUS_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
    source: 'trial',
    beneficiaryUserId: ownerId,
    idempotencyKey: `${exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID}:${accountId}`,
    issuedByUserId: SYSTEM_ACTOR_ID,
    issuedAtMs: startsAtMs,
    auditReason: 'Eligible homeowner created the first property.',
    policyVersion: exports.HOMEOWNER_PLUS_TRIAL_POLICY_VERSION,
    transition: {
        mode: 'checkout_required',
        targetPlanId: 'homeowner_plus',
        status: 'not_configured',
    },
    triggerPropertyId: propertyId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
const issueFirstPropertyTrial = async (accountId, propertyId, startsAtMs) => {
    if (!isTrialIssuanceEnabled())
        return 'disabled';
    const normalizedAccountId = String(accountId || '').trim();
    const normalizedPropertyId = String(propertyId || '').trim();
    if (!normalizedAccountId || !normalizedPropertyId)
        return 'ineligible';
    const accountRef = db.collection('familyAccounts').doc(normalizedAccountId);
    const ownerRef = db.collection('users').doc(normalizedAccountId);
    const grantRef = accountRef
        .collection('entitlementGrants')
        .doc(exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID);
    const requestId = `${exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID}:${normalizedAccountId}`;
    const auditEventId = (0, entitlements_1.getAdminAuditEventId)('grant.created', requestId);
    const auditRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(auditEventId);
    return db.runTransaction(async (transaction) => {
        const [accountSnapshot, ownerSnapshot, grantSnapshot] = await Promise.all([
            transaction.get(accountRef),
            transaction.get(ownerRef),
            transaction.get(grantRef),
        ]);
        if (grantSnapshot.exists)
            return 'already_exists';
        if (!accountSnapshot.exists || !ownerSnapshot.exists)
            return 'ineligible';
        const account = accountSnapshot.data() || {};
        const owner = ownerSnapshot.data() || {};
        const programState = asRecord(asRecord(account.entitlementPrograms)[exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID]);
        const accountOwnerId = String(account.ownerId || '').trim();
        const propertyCount = Number(account.propertyCount || 0);
        const ownerIsEligible = accountOwnerId === normalizedAccountId &&
            owner.isAccountOwner !== false &&
            owner.isTeamMemberAccount !== true;
        const accountSubscription = account.subscription;
        const ownerSubscription = owner.subscription;
        if (programState.status !== 'eligible' ||
            programState.consumedAt ||
            propertyCount < 1 ||
            !ownerIsEligible ||
            !(0, exports.isIntentionalFreeOwnerSubscription)(accountSubscription) ||
            !(0, exports.isIntentionalFreeOwnerSubscription)(ownerSubscription)) {
            return 'ineligible';
        }
        const safeStartsAtMs = Number.isFinite(startsAtMs) ? startsAtMs : Date.now();
        const grant = createTrialGrant(normalizedAccountId, accountOwnerId, normalizedPropertyId, safeStartsAtMs);
        const endsAtMs = Number(grant.endsAtMs);
        const existingProjection = asRecord(account.effectiveEntitlementProjection);
        const existingProjectedGrants = Array.isArray(existingProjection.activeGrants)
            ? existingProjection.activeGrants.filter((candidate) => String(asRecord(candidate).grantId || '') !== grant.grantId)
            : [];
        const activeGrants = [
            ...existingProjectedGrants,
            {
                grantId: grant.grantId,
                programId: grant.programId,
                accountId: grant.accountId,
                kind: grant.kind,
                state: grant.state,
                bundleId: grant.bundleId,
                bundleVersion: grant.bundleVersion,
                startsAtMs: grant.startsAtMs,
                endsAtMs: grant.endsAtMs,
                source: grant.source,
                policyVersion: grant.policyVersion,
                transition: grant.transition,
            },
        ];
        const activeBundleIds = Array.from(new Set([
            ...(Array.isArray(existingProjection.activeBundleIds)
                ? existingProjection.activeBundleIds.map(String)
                : []),
            'homeowner_plus',
        ]));
        const bundleVersions = Array.from(new Set([
            ...(Array.isArray(existingProjection.bundleVersions)
                ? existingProjection.bundleVersions.map(String)
                : []),
            `homeowner_plus@${entitlements_1.BUNDLE_VERSION}`,
        ]));
        const existingBundleExpirations = asRecord(existingProjection.bundleExpirationsMs);
        const existingHomeownerPlusEndsAtMs = Number(existingBundleExpirations.homeowner_plus);
        const bundleExpirationsMs = {
            ...existingBundleExpirations,
            homeowner_plus: Number.isFinite(existingHomeownerPlusEndsAtMs)
                ? Math.max(existingHomeownerPlusEndsAtMs, endsAtMs)
                : endsAtMs,
        };
        const existingTransitionAtMs = Number(existingProjection.nextTransitionAtMs);
        const nextTransitionAtMs = Number.isFinite(existingTransitionAtMs) && existingTransitionAtMs > safeStartsAtMs
            ? Math.min(existingTransitionAtMs, endsAtMs)
            : endsAtMs;
        transaction.create(grantRef, grant);
        transaction.set(accountRef, {
            entitlementPrograms: {
                ...asRecord(account.entitlementPrograms),
                [exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID]: {
                    ...programState,
                    status: 'issued',
                    grantId: exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID,
                    consumedAt: admin.firestore.FieldValue.serverTimestamp(),
                    triggerPropertyId: normalizedPropertyId,
                },
            },
            effectiveEntitlementProjection: {
                resolverVersion: 'v1',
                bundleVersions,
                activeBundleIds,
                bundleExpirationsMs,
                activeGrants,
                calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
                nextTransitionAtMs,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.create(auditRef, {
            eventId: auditEventId,
            action: 'grant.created',
            category: 'entitlement_grant',
            targetType: 'account',
            targetId: normalizedAccountId,
            targetAccountId: normalizedAccountId,
            targetUserId: accountOwnerId,
            actorUserId: SYSTEM_ACTOR_ID,
            performedBy: {
                uid: SYSTEM_ACTOR_ID,
                displayName: 'Maintley automated trial program',
            },
            grantId: exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID,
            programId: exports.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
            reason: 'Eligible homeowner created the first property.',
            requestId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            before: { effectivePlan: 'homeowner', activeGrantIds: [] },
            after: {
                effectivePlan: 'homeowner_plus',
                activeGrantIds: [exports.HOMEOWNER_PLUS_TRIAL_GRANT_ID],
                endsAtMs,
            },
            metadata: {
                policyVersion: exports.HOMEOWNER_PLUS_TRIAL_POLICY_VERSION,
                triggerPropertyId: normalizedPropertyId,
                source: 'firestore.property.created',
            },
        });
        return 'created';
    });
};
exports.issueFirstPropertyTrial = issueFirstPropertyTrial;
exports.issueHomeownerPlusTrialOnFirstProperty = functions.firestore
    .document('properties/{propertyId}')
    .onCreate(async (snapshot, context) => {
    const property = snapshot.data() || {};
    const accountId = String(property.accountId || property.userId || '').trim();
    const eventTimeMs = Date.parse(String(context.timestamp || ''));
    const result = await (0, exports.issueFirstPropertyTrial)(accountId, context.params.propertyId, Number.isFinite(eventTimeMs) ? eventTimeMs : Date.now());
    functions.logger.info('First-property trial issuance evaluated', {
        accountId,
        propertyId: context.params.propertyId,
        result,
    });
});
exports.finalizeFirstPropertyTrial = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
    const uid = String(context.auth?.uid || '').trim();
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to finish first-property setup.');
    }
    const propertyId = String(data?.propertyId || '').trim();
    if (!propertyId || propertyId.length > 160) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid property is required.');
    }
    const accountId = await (0, accountAuthz_1.resolveAccountIdForUser)(uid);
    await (0, accountAuthz_1.assertAccountRole)(uid, accountId, ['account_owner']);
    const propertySnapshot = await db.collection('properties').doc(propertyId).get();
    if (!propertySnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Property was not found.');
    }
    const property = propertySnapshot.data() || {};
    const propertyAccountId = String(property.accountId || property.userId || '').trim();
    if (propertyAccountId !== accountId) {
        throw new functions.https.HttpsError('permission-denied', 'This property does not belong to the active account.');
    }
    const createdAtMs = Date.parse(String(property.createdAt || ''));
    const result = await (0, exports.issueFirstPropertyTrial)(accountId, propertyId, Number.isFinite(createdAtMs) ? createdAtMs : Date.now());
    const accountSnapshot = await db.collection('familyAccounts').doc(accountId).get();
    return {
        result,
        accountId,
        effectiveEntitlementProjection: serializeCallableValue(accountSnapshot.data()?.effectiveEntitlementProjection || null),
    };
});
