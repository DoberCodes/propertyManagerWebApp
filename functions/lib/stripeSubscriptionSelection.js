"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectCustomerSubscription = void 0;
const CURRENT_STRIPE_STATUSES = new Set([
    'active',
    'trialing',
    'past_due',
    'unpaid',
]);
/**
 * Resolve the Stripe subscription that should drive Maintley's paid billing
 * state. A current subscription always supersedes an old cancelled reference.
 * Multiple current subscriptions are an operational conflict and must not be
 * resolved by guessing.
 */
const selectCustomerSubscription = (subscriptions, storedSubscriptionId = '') => {
    const uniqueSubscriptions = Array.from(new Map(subscriptions.map((subscription) => [subscription.id, subscription])).values());
    const currentSubscriptions = uniqueSubscriptions.filter((subscription) => CURRENT_STRIPE_STATUSES.has(subscription.status));
    if (currentSubscriptions.length > 1) {
        return { kind: 'conflict', subscriptions: currentSubscriptions };
    }
    if (currentSubscriptions.length === 1) {
        return { kind: 'selected', subscription: currentSubscriptions[0] };
    }
    const storedSubscription = uniqueSubscriptions.find((subscription) => subscription.id === storedSubscriptionId);
    if (storedSubscription) {
        return { kind: 'selected', subscription: storedSubscription };
    }
    if (uniqueSubscriptions.length > 0) {
        return { kind: 'selected', subscription: uniqueSubscriptions[0] };
    }
    return { kind: 'none' };
};
exports.selectCustomerSubscription = selectCustomerSubscription;
