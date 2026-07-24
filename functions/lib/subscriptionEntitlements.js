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
exports.resolveEntitlementsForAccount = exports.canUsePropertyKnowledgeAcquisition = exports.getSubscriptionLimit = exports.hasSubscriptionCapability = exports.getEffectiveSubscriptionPlanId = exports.isSubscriptionCurrentlyEntitled = exports.ENTITLEMENT_FEATURE_FLAGS = exports.normalizePlanId = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const entitlements_1 = require("@maintley/entitlements");
Object.defineProperty(exports, "normalizePlanId", { enumerable: true, get: function () { return entitlements_1.normalizePlanId; } });
exports.ENTITLEMENT_FEATURE_FLAGS = Object.freeze({
    ...entitlements_1.DEFAULT_ENTITLEMENT_FEATURE_FLAGS,
    multiHomeownerPlan: process.env.ENABLE_MULTI_HOMEOWNER_PLAN === 'true',
    homeownerPlusProductTrial: process.env.ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL === 'true',
    internalEntitlementGrantIssuance: process.env.ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE === 'true',
    accessLifecycleCommunication: process.env.ENABLE_ACCESS_LIFECYCLE_COMMUNICATION === 'true',
});
const DEFAULT_DENY_DIAGNOSTIC_CODES = new Set([
    'unknown_plan',
    'disabled_plan',
    'unknown_bundle_version',
    'unknown_capability',
    'unknown_limit',
    'unknown_grant_bundle',
]);
const resolveSubscriptionEntitlements = (subscription) => {
    const result = (0, entitlements_1.resolveAccountEntitlements)({
        subscription,
        fallbackPlanId: 'homeowner',
        mode: 'compatibility',
        featureFlags: exports.ENTITLEMENT_FEATURE_FLAGS,
    });
    for (const diagnostic of result.diagnostics) {
        if (DEFAULT_DENY_DIAGNOSTIC_CODES.has(diagnostic.code)) {
            functions.logger.warn('Entitlement input defaulted safely', {
                code: diagnostic.code,
                metadata: diagnostic.metadata || {},
                resolvedPlanId: result.basePlanId,
            });
        }
    }
    if (process.env.ENTITLEMENT_COMPARE_MODE === 'true') {
        const storedPlanId = (0, entitlements_1.normalizePlanId)(subscription?.plan, 'homeowner');
        functions.logger.info('Entitlement resolver comparison', {
            storedPlanId,
            resolvedPlanId: result.basePlanId,
            matches: storedPlanId === result.basePlanId,
            billingStatus: String(subscription?.status || ''),
            diagnosticCodes: result.diagnostics.map(({ code }) => code),
        });
    }
    return result;
};
const isSubscriptionCurrentlyEntitled = (subscription) => (0, entitlements_1.isSubscriptionCurrentlyEntitled)(subscription);
exports.isSubscriptionCurrentlyEntitled = isSubscriptionCurrentlyEntitled;
const getEffectiveSubscriptionPlanId = (subscription, fallbackPlanId = 'homeowner') => fallbackPlanId === 'homeowner'
    ? resolveSubscriptionEntitlements(subscription).basePlanId
    : (0, entitlements_1.resolveAccountEntitlements)({
        subscription,
        fallbackPlanId,
        mode: 'compatibility',
        featureFlags: exports.ENTITLEMENT_FEATURE_FLAGS,
    }).basePlanId;
exports.getEffectiveSubscriptionPlanId = getEffectiveSubscriptionPlanId;
const hasSubscriptionCapability = (subscription, capabilityId) => (0, entitlements_1.hasCapability)(resolveSubscriptionEntitlements(subscription), capabilityId);
exports.hasSubscriptionCapability = hasSubscriptionCapability;
const getSubscriptionLimit = (subscription, limitId) => (0, entitlements_1.getEntitlementLimit)(resolveSubscriptionEntitlements(subscription), limitId);
exports.getSubscriptionLimit = getSubscriptionLimit;
const canUsePropertyKnowledgeAcquisition = (subscription) => (0, exports.hasSubscriptionCapability)(subscription, 'property_knowledge.acquire');
exports.canUsePropertyKnowledgeAcquisition = canUsePropertyKnowledgeAcquisition;
const toGrantMillis = (value) => {
    if (Number.isFinite(Number(value)))
        return Number(value);
    if (value && typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    return null;
};
const resolveEntitlementsForAccount = async (accountId, subscription, nowMs = Date.now()) => {
    const admin = await Promise.resolve().then(() => __importStar(require('firebase-admin')));
    if (!admin.apps.length)
        admin.initializeApp();
    const normalizedAccountId = String(accountId || '').trim();
    if (!normalizedAccountId) {
        return (0, entitlements_1.resolveAccountEntitlements)({
            subscription,
            fallbackPlanId: 'homeowner',
            mode: 'compatibility',
            featureFlags: exports.ENTITLEMENT_FEATURE_FLAGS,
            nowMs,
        });
    }
    const snapshot = await admin
        .firestore()
        .collection('familyAccounts')
        .doc(normalizedAccountId)
        .collection('entitlementGrants')
        .get();
    const grants = snapshot.docs.map((grantDoc) => {
        const data = grantDoc.data() || {};
        return {
            ...data,
            grantId: String(data.grantId || grantDoc.id),
            accountId: String(data.accountId || normalizedAccountId),
            startsAtMs: toGrantMillis(data.startsAtMs ?? data.startsAt) || 0,
            endsAtMs: toGrantMillis(data.endsAtMs ?? data.endsAt),
        };
    });
    return (0, entitlements_1.resolveAccountEntitlements)({
        accountId: normalizedAccountId,
        subscription,
        grants,
        fallbackPlanId: 'homeowner',
        mode: 'compatibility',
        featureFlags: exports.ENTITLEMENT_FEATURE_FLAGS,
        nowMs,
    });
};
exports.resolveEntitlementsForAccount = resolveEntitlementsForAccount;
