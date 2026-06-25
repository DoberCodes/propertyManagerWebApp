import {
	MaintleyCapability,
	MaintleyFinding,
	MaintleyPlanId,
	MaintleyRequiredPlan,
} from './types';
import { getCapabilitiesForPlan } from './capabilities';

const PLAN_RANK: Record<MaintleyPlanId, number> = {
	guest: 0,
	tenant: 0,
	homeowner: 0,
	homeowner_plus: 1,
	property: 2,
	team: 2,
	portfolio: 3,
};

export const normalizeMaintleyPlanId = (planId?: string): MaintleyPlanId => {
	const normalizedPlanId = String(planId || '')
		.trim()
		.toLowerCase();
	if (normalizedPlanId in PLAN_RANK) {
		return normalizedPlanId as MaintleyPlanId;
	}
	return 'homeowner';
};

export const canAccessMaintleyFinding = (
	finding: Pick<MaintleyFinding, 'requiredPlan'>,
	planId?: string,
): boolean =>
	PLAN_RANK[normalizeMaintleyPlanId(planId)] >=
	PLAN_RANK[normalizeMaintleyPlanId(finding.requiredPlan)];

export const filterFindingsForPlan = (
	findings: MaintleyFinding[],
	planId?: string,
): MaintleyFinding[] =>
	findings.filter((finding) => canAccessMaintleyFinding(finding, planId));

export const filterFindingsForPlanAndCapabilities = (
	findings: MaintleyFinding[],
	planId?: string,
	capabilities: Partial<Record<MaintleyCapability, boolean>> = getCapabilitiesForPlan(
		normalizeMaintleyPlanId(planId),
	),
): MaintleyFinding[] =>
	findings.filter((finding) =>
		canAccessMaintleyFinding(finding, planId) &&
		finding.requiredCapabilities.every(
			(capability) => capabilities[capability] === true,
		),
	);

export const requiredPlanOrDefault = (
	requiredPlan?: MaintleyRequiredPlan,
): MaintleyRequiredPlan => requiredPlan || 'homeowner';
