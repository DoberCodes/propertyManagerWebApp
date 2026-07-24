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
exports.assertInviteCapability = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const entitlements_1 = require("@maintley/entitlements");
const accountAuthz_1 = require("./accountAuthz");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const INVITE_CAPABILITIES = {
    team: 'team.manage',
    tenant: 'residents.manage',
};
const assertInviteCapability = async (uid, capability) => {
    const accountId = await (0, accountAuthz_1.resolveAccountIdForUser)(uid);
    await (0, accountAuthz_1.assertAccountRole)(uid, accountId, ['account_owner', 'admin', 'manager']);
    const accountOwnerDoc = await db.collection('users').doc(accountId).get();
    if (!accountOwnerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Account owner profile not found');
    }
    const accountOwnerData = accountOwnerDoc.data() || {};
    const subscription = (accountOwnerData.subscription ||
        {});
    const entitlements = await (0, subscriptionEntitlements_1.resolveEntitlementsForAccount)(accountId, subscription);
    if (!(0, entitlements_1.hasCapability)(entitlements, INVITE_CAPABILITIES[capability])) {
        throw new functions.https.HttpsError('permission-denied', capability === 'team'
            ? 'Your current subscription plan does not allow inviting team members.'
            : 'Your current subscription plan does not allow inviting tenants.');
    }
    return { accountId, subscription, entitlements };
};
exports.assertInviteCapability = assertInviteCapability;
