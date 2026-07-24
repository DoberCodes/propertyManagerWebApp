import * as functions from 'firebase-functions/v1';
import {
	CapabilityId,
	DEFAULT_ENTITLEMENT_FEATURE_FLAGS,
	EntitlementGrant,
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
	homeownerPlusProductTrial:
		process.env.ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL === 'true',
	internalEntitlementGrantIssuance:
		process.env.ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE === 'true',
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

const toGrantMillis = (value: unknown): number | null => {
	if (Number.isFinite(Number(value))) return Number(value);
	if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
		return (value as { toMillis: () => number }).toMillis();
	}
	return null;
};

export const resolveEntitlementsForAccount = async (
	accountId: string,
	subscription?: SubscriptionEntitlementLike | null,
	nowMs = Date.now(),
) => {
	const admin = await import('firebase-admin');
	if (!admin.apps.length) admin.initializeApp();
	const normalizedAccountId = String(accountId || '').trim();
	if (!normalizedAccountId) {
		return resolveAccountEntitlements({
			subscription,
			fallbackPlanId: 'homeowner',
			mode: 'compatibility',
			featureFlags: ENTITLEMENT_FEATURE_FLAGS,
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
		} as EntitlementGrant;
	});

	return resolveAccountEntitlements({
		accountId: normalizedAccountId,
		subscription,
		grants,
		fallbackPlanId: 'homeowner',
		mode: 'compatibility',
		featureFlags: ENTITLEMENT_FEATURE_FLAGS,
		nowMs,
	});
};
