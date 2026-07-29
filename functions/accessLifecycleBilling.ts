const PAID_PLAN_IDS = new Set(['homeowner_plus', 'property', 'portfolio']);
const ENTITLED_BILLING_STATUSES = new Set(['active', 'trial', 'trialing']);

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();

export const hasConfirmedPaidSubscription = (
	subscription: unknown,
	nowMs = Date.now(),
): boolean => {
	if (!subscription || typeof subscription !== 'object') return false;
	const record = subscription as Record<string, unknown>;
	const plan = normalize(record.plan);
	const status = normalize(record.status);
	const stripeSubscriptionId = String(record.stripeSubscriptionId || '').trim();
	if (!PAID_PLAN_IDS.has(plan) || !ENTITLED_BILLING_STATUSES.has(status) || !stripeSubscriptionId) {
		return false;
	}
	if (!['trial', 'trialing'].includes(status)) return true;
	const trialEndsAt = Number(record.trialEndsAt || 0);
	return !trialEndsAt || trialEndsAt * 1000 > nowMs;
};

export const isRecoverablePaidConversionSuppression = (delivery: unknown): boolean => {
	if (!delivery || typeof delivery !== 'object') return false;
	const record = delivery as Record<string, unknown>;
	return record.status === 'skipped' && record.outcome === 'suppressed_paid_conversion';
};
