"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUsePropertyKnowledgeAcquisition = exports.getEffectiveSubscriptionPlanId = exports.isSubscriptionCurrentlyEntitled = exports.normalizePlanId = void 0;
const entitlements_1 = require("@maintley/entitlements");
Object.defineProperty(exports, "normalizePlanId", { enumerable: true, get: function () { return entitlements_1.normalizePlanId; } });
const isSubscriptionCurrentlyEntitled = (subscription) => (0, entitlements_1.isSubscriptionCurrentlyEntitled)(subscription);
exports.isSubscriptionCurrentlyEntitled = isSubscriptionCurrentlyEntitled;
const getEffectiveSubscriptionPlanId = (subscription, fallbackPlanId = 'homeowner') => (0, entitlements_1.resolveAccountEntitlements)({
    subscription,
    fallbackPlanId,
    mode: 'compatibility',
}).basePlanId;
exports.getEffectiveSubscriptionPlanId = getEffectiveSubscriptionPlanId;
const canUsePropertyKnowledgeAcquisition = (subscription) => (0, entitlements_1.resolveAccountEntitlements)({
    subscription,
    fallbackPlanId: 'homeowner',
    mode: 'compatibility',
}).capabilities['property_knowledge.acquire'];
exports.canUsePropertyKnowledgeAcquisition = canUsePropertyKnowledgeAcquisition;
