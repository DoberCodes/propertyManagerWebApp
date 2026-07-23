import {
	MaintleyCapability,
	MaintleyFindingSource,
	MaintleyFinding,
	MaintleyPlanId,
	MaintleyRequiredPlan,
} from './types';
import { getCapabilitiesForPlan } from './capabilities';
import {
	CapabilityId,
	getPlanPreset,
	hasCapability,
	normalizePlanId,
} from '@maintley/entitlements';

const REQUIRED_PLAN_CAPABILITY: Record<
	MaintleyRequiredPlan,
	CapabilityId | null
> = {
	homeowner: null,
	homeowner_plus: 'property_intelligence.use',
	property: 'team.manage',
	portfolio: 'team.advanced',
};

const SOURCE_REQUIRED_PLAN: Record<MaintleyFindingSource, MaintleyRequiredPlan> = {
	property_memory: 'homeowner',
	knowledge_pack: 'homeowner_plus',
	history_inference: 'homeowner_plus',
	context: 'homeowner_plus',
};

export const normalizeMaintleyPlanId = (planId?: string): MaintleyPlanId => {
	return normalizePlanId(planId, 'homeowner') as MaintleyPlanId;
};

export const getRequiredPlanForFindingSource = (
	source?: MaintleyFindingSource,
): MaintleyRequiredPlan =>
	source ? SOURCE_REQUIRED_PLAN[source] : 'homeowner';

export const canAccessMaintleyFinding = (
	finding: Partial<Pick<MaintleyFinding, 'requiredPlan'>> & {
		source?: MaintleyFindingSource;
	},
	planId?: string,
): boolean => {
	const requiredPlan = finding.source
		? getRequiredPlanForFindingSource(finding.source)
		: finding.requiredPlan || 'homeowner';
	const requiredCapability = REQUIRED_PLAN_CAPABILITY[requiredPlan];
	return requiredCapability === null
		? true
		: hasCapability(
				getPlanPreset(normalizeMaintleyPlanId(planId)),
				requiredCapability,
		  );
};

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
