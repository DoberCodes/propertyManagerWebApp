"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecoverablePaidConversionSuppression = exports.hasConfirmedPaidSubscription = void 0;
const PAID_PLAN_IDS = new Set(['homeowner_plus', 'property', 'portfolio']);
const ENTITLED_BILLING_STATUSES = new Set(['active', 'trial', 'trialing']);
const normalize = (value) => String(value || '').trim().toLowerCase();
const hasConfirmedPaidSubscription = (subscription, nowMs = Date.now()) => {
    if (!subscription || typeof subscription !== 'object')
        return false;
    const record = subscription;
    const plan = normalize(record.plan);
    const status = normalize(record.status);
    const stripeSubscriptionId = String(record.stripeSubscriptionId || '').trim();
    if (!PAID_PLAN_IDS.has(plan) || !ENTITLED_BILLING_STATUSES.has(status) || !stripeSubscriptionId) {
        return false;
    }
    if (!['trial', 'trialing'].includes(status))
        return true;
    const trialEndsAt = Number(record.trialEndsAt || 0);
    return !trialEndsAt || trialEndsAt * 1000 > nowMs;
};
exports.hasConfirmedPaidSubscription = hasConfirmedPaidSubscription;
const isRecoverablePaidConversionSuppression = (delivery) => {
    if (!delivery || typeof delivery !== 'object')
        return false;
    const record = delivery;
    return record.status === 'skipped' && record.outcome === 'suppressed_paid_conversion';
};
exports.isRecoverablePaidConversionSuppression = isRecoverablePaidConversionSuppression;
