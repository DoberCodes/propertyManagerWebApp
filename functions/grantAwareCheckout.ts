import { EntitlementGrant, PaidPlanId } from '@maintley/entitlements';

const PAID_PLAN_RANK: Record<PaidPlanId, number> = {
	homeowner_plus: 1,
	multi_homeowner: 2,
	property: 3,
	portfolio: 4,
};

export type GrantAwareCheckoutPolicy =
	| { kind: 'standard'; effectiveGrantPlanId: null }
	| {
			kind: 'blocked_permanent';
			effectiveGrantPlanId: PaidPlanId;
			grantIds: string[];
	  }
	| {
			kind: 'delayed';
			effectiveGrantPlanId: PaidPlanId;
			firstChargeAtSeconds: number;
			controllingGrantIds: string[];
			conversionGrantIds: string[];
	  }
	| {
			kind: 'immediate_upgrade';
			effectiveGrantPlanId: PaidPlanId;
			conversionGrantIds: string[];
	  };

const isPaidPlanId = (value: unknown): value is PaidPlanId =>
	Object.prototype.hasOwnProperty.call(PAID_PLAN_RANK, String(value || ''));

const isActiveGrant = (grant: EntitlementGrant, nowMs: number): boolean => {
	if (grant.state !== 'active' || Number(grant.startsAtMs) > nowMs) return false;
	if (grant.kind === 'permanent') return grant.endsAtMs == null;
	const endsAtMs = Number(grant.endsAtMs || 0);
	return Number.isFinite(endsAtMs) && endsAtMs > nowMs;
};

const isCheckoutConvertible = (grant: EntitlementGrant): boolean =>
	grant.kind === 'temporary' && grant.transition?.mode === 'checkout_required';

export const getGrantAwareCheckoutPolicy = (params: {
	grants: EntitlementGrant[];
	targetPlanId: PaidPlanId;
	nowMs: number;
}): GrantAwareCheckoutPolicy => {
	const { grants, targetPlanId, nowMs } = params;
	const activePlanGrants = grants.filter(
		(grant) => isActiveGrant(grant, nowMs) && isPaidPlanId(grant.bundleId),
	);
	if (!activePlanGrants.length) {
		return { kind: 'standard', effectiveGrantPlanId: null };
	}

	const effectiveGrantPlanId = activePlanGrants.reduce<PaidPlanId>(
		(highest, grant) => {
			const candidate = grant.bundleId as PaidPlanId;
			return PAID_PLAN_RANK[candidate] > PAID_PLAN_RANK[highest]
				? candidate
				: highest;
		},
		activePlanGrants[0].bundleId as PaidPlanId,
	);
	const controllingGrants = activePlanGrants.filter(
		(grant) => grant.bundleId === effectiveGrantPlanId,
	);
	const targetRank = PAID_PLAN_RANK[targetPlanId];
	const grantRank = PAID_PLAN_RANK[effectiveGrantPlanId];
	const permanentGrantsCoveringTarget = activePlanGrants.filter(
		(grant) =>
			grant.kind === 'permanent' &&
			PAID_PLAN_RANK[grant.bundleId as PaidPlanId] >= targetRank,
	);

	if (permanentGrantsCoveringTarget.length) {
		const highestPermanentPlanId = permanentGrantsCoveringTarget.reduce<PaidPlanId>(
			(highest, grant) => {
				const candidate = grant.bundleId as PaidPlanId;
				return PAID_PLAN_RANK[candidate] > PAID_PLAN_RANK[highest]
					? candidate
					: highest;
			},
			permanentGrantsCoveringTarget[0].bundleId as PaidPlanId,
		);
		return {
			kind: 'blocked_permanent',
			effectiveGrantPlanId: highestPermanentPlanId,
			grantIds: permanentGrantsCoveringTarget.map((grant) => grant.grantId),
		};
	}

	const convertibleGrants = activePlanGrants.filter(isCheckoutConvertible);
	if (targetRank > grantRank) {
		if (!convertibleGrants.length) {
			return { kind: 'standard', effectiveGrantPlanId: null };
		}
		return {
			kind: 'immediate_upgrade',
			effectiveGrantPlanId,
			conversionGrantIds: convertibleGrants.map((grant) => grant.grantId),
		};
	}

	const controllingTemporaryGrants = controllingGrants.filter(
		(grant) => grant.kind === 'temporary',
	);
	const firstChargeAtMs = controllingTemporaryGrants.reduce(
		(latest, grant) => Math.max(latest, Number(grant.endsAtMs || 0)),
		0,
	);
	const controllingConvertibleGrants = controllingTemporaryGrants.filter(
		isCheckoutConvertible,
	);

	if (!firstChargeAtMs || !controllingConvertibleGrants.length) {
		return { kind: 'standard', effectiveGrantPlanId: null };
	}

	return {
		kind: 'delayed',
		effectiveGrantPlanId,
		firstChargeAtSeconds: Math.floor(firstChargeAtMs / 1000),
		controllingGrantIds: controllingTemporaryGrants.map(
			(grant) => grant.grantId,
		),
		conversionGrantIds:
			targetRank === grantRank
				? controllingConvertibleGrants.map((grant) => grant.grantId)
				: [],
	};
};
