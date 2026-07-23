import {
	SubscriptionEntitlementLike,
	isSubscriptionCurrentlyEntitled as resolveSubscriptionCurrentlyEntitled,
	normalizePlanId,
	resolveAccountEntitlements,
} from '@maintley/entitlements';

export type { SubscriptionEntitlementLike } from '@maintley/entitlements';

export { normalizePlanId };

export const isSubscriptionCurrentlyEntitled = (
	subscription?: SubscriptionEntitlementLike | null,
): boolean => resolveSubscriptionCurrentlyEntitled(subscription);

export const getEffectiveSubscriptionPlanId = (
	subscription?: SubscriptionEntitlementLike | null,
	fallbackPlanId = 'homeowner',
): string =>
	resolveAccountEntitlements({
		subscription,
		fallbackPlanId,
		mode: 'compatibility',
	}).basePlanId;

export const canUsePropertyKnowledgeAcquisition = (
	subscription?: SubscriptionEntitlementLike | null,
): boolean =>
	resolveAccountEntitlements({
		subscription,
		fallbackPlanId: 'homeowner',
		mode: 'compatibility',
	}).capabilities['property_knowledge.acquire'];
