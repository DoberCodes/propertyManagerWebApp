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

export type SubscriptionEntitlementLike = {
	status?: string;
	plan?: string;
	trialEndsAt?: number | null;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
	pendingCheckoutPlan?: string;
	stripeSubscriptionId?: string;
};

export const normalizePlanId = (planId?: unknown): string => {
	const normalizedPlanId = String(planId || '').trim().toLowerCase();
	return CURRENT_PLAN_IDS.has(normalizedPlanId) ? normalizedPlanId : 'homeowner';
};

export const isSubscriptionCurrentlyEntitled = (
	subscription?: SubscriptionEntitlementLike | null,
): boolean => {
	if (!subscription?.status) return false;
	if (subscription.status === 'active') return true;
	if (subscription.status !== 'trial') return false;
	if (!subscription.trialEndsAt) return true;
	return subscription.trialEndsAt > Date.now() / 1000;
};

export const getEffectiveSubscriptionPlanId = (
	subscription?: SubscriptionEntitlementLike | null,
	fallbackPlanId = 'homeowner',
): string => {
	if (!isSubscriptionCurrentlyEntitled(subscription)) {
		return normalizePlanId(fallbackPlanId);
	}

	const pendingCheckoutPlan = normalizePlanId(subscription?.pendingCheckoutPlan);
	if (
		PAID_PLAN_IDS.has(pendingCheckoutPlan) &&
		!String(subscription?.stripeSubscriptionId || '').trim()
	) {
		return normalizePlanId(fallbackPlanId);
	}

	return normalizePlanId(subscription?.plan || fallbackPlanId);
};

