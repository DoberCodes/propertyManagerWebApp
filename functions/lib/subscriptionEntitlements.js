"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEffectiveSubscriptionPlanId = exports.isSubscriptionCurrentlyEntitled = exports.normalizePlanId = void 0;
const CURRENT_PLAN_IDS = new Set([
    'homeowner',
    'homeowner_plus',
    'property',
    'portfolio',
    'guest',
    'team',
    'tenant',
]);
const PAID_PLAN_IDS = new Set(['homeowner_plus', 'property', 'portfolio']);
const normalizePlanId = (planId) => {
    const normalizedPlanId = String(planId || '').trim().toLowerCase();
    return CURRENT_PLAN_IDS.has(normalizedPlanId) ? normalizedPlanId : 'homeowner';
};
exports.normalizePlanId = normalizePlanId;
const isSubscriptionCurrentlyEntitled = (subscription) => {
    if (!subscription?.status)
        return false;
    if (subscription.status === 'active')
        return true;
    if (subscription.status !== 'trial')
        return false;
    if (!subscription.trialEndsAt)
        return true;
    return subscription.trialEndsAt > Date.now() / 1000;
};
exports.isSubscriptionCurrentlyEntitled = isSubscriptionCurrentlyEntitled;
const getEffectiveSubscriptionPlanId = (subscription, fallbackPlanId = 'homeowner') => {
    if (!(0, exports.isSubscriptionCurrentlyEntitled)(subscription)) {
        return (0, exports.normalizePlanId)(fallbackPlanId);
    }
    const pendingCheckoutPlan = (0, exports.normalizePlanId)(subscription?.pendingCheckoutPlan);
    if (PAID_PLAN_IDS.has(pendingCheckoutPlan) &&
        !String(subscription?.stripeSubscriptionId || '').trim()) {
        return (0, exports.normalizePlanId)(fallbackPlanId);
    }
    return (0, exports.normalizePlanId)(subscription?.plan || fallbackPlanId);
};
exports.getEffectiveSubscriptionPlanId = getEffectiveSubscriptionPlanId;
