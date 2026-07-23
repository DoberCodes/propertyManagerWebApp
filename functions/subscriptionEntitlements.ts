import * as functions from 'firebase-functions/v1';
import {
	CapabilityId,
	DEFAULT_ENTITLEMENT_FEATURE_FLAGS,
	getEntitlementLimit,
	hasCapability,
	LimitId,
	SubscriptionEntitlementLike,
	isSubscriptionCurrentlyEntitled as resolveSubscriptionCurrentlyEntitled,
	normalizePlanId,
	resolveAccountEntitlements,
} from '@maintley/entitlements';

export type { SubscriptionEntitlementLike } from '@maintley/entitlements';

export { normalizePlanId };

export const ENTITLEMENT_FEATURE_FLAGS = Object.freeze({
	...DEFAULT_ENTITLEMENT_FEATURE_FLAGS,
	multiHomeownerPlan: process.env.ENABLE_MULTI_HOMEOWNER_PLAN === 'true',
});

const DEFAULT_DENY_DIAGNOSTIC_CODES = new Set([
	'unknown_plan',
	'disabled_plan',
	'unknown_bundle_version',
	'unknown_capability',
	'unknown_limit',
	'unknown_grant_bundle',
]);

const resolveSubscriptionEntitlements = (
	subscription?: SubscriptionEntitlementLike | null,
) => {
	const result = resolveAccountEntitlements({
		subscription,
		fallbackPlanId: 'homeowner',
		mode: 'compatibility',
		featureFlags: ENTITLEMENT_FEATURE_FLAGS,
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
		const storedPlanId = normalizePlanId(subscription?.plan, 'homeowner');
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

export const isSubscriptionCurrentlyEntitled = (
	subscription?: SubscriptionEntitlementLike | null,
): boolean => resolveSubscriptionCurrentlyEntitled(subscription);

export const getEffectiveSubscriptionPlanId = (
	subscription?: SubscriptionEntitlementLike | null,
	fallbackPlanId = 'homeowner',
): string =>
	fallbackPlanId === 'homeowner'
		? resolveSubscriptionEntitlements(subscription).basePlanId
		: resolveAccountEntitlements({
				subscription,
				fallbackPlanId,
				mode: 'compatibility',
				featureFlags: ENTITLEMENT_FEATURE_FLAGS,
		  }).basePlanId;

export const hasSubscriptionCapability = (
	subscription: SubscriptionEntitlementLike | null | undefined,
	capabilityId: CapabilityId,
): boolean =>
	hasCapability(resolveSubscriptionEntitlements(subscription), capabilityId);

export const getSubscriptionLimit = (
	subscription: SubscriptionEntitlementLike | null | undefined,
	limitId: LimitId,
): number =>
	getEntitlementLimit(resolveSubscriptionEntitlements(subscription), limitId);

export const canUsePropertyKnowledgeAcquisition = (
	subscription?: SubscriptionEntitlementLike | null,
): boolean => hasSubscriptionCapability(subscription, 'property_knowledge.acquire');
