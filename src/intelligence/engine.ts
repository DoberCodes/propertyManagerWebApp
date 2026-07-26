import { aggregateMaintleyFindings } from './aggregation';
import { BASELINE_CARE_LIBRARY_VERSION } from './baselineCareLibrary';
import { getCapabilitiesForPlan } from './capabilities';
import {
	filterFindingsForPlanAndCapabilities,
	normalizeMaintleyPlanId,
} from './planFilter';
import { prioritizeMaintleyFindings } from './prioritization';
import { maintleyIntelligenceRules } from './rules';
import { mergeMaintenanceHistoryWithDeviceSources } from '../maintenanceHistory/maintenanceHistoryAdapter';
import {
	MaintleyFinding,
	MaintleyIntelligenceInput,
	MaintleyIntelligenceResult,
	MaintleyIntelligenceRule,
} from './types';

const getCurrentDate = (currentDate?: Date | string): Date => {
	if (currentDate instanceof Date) return currentDate;
	if (currentDate) {
		const parsed = new Date(currentDate);
		if (!Number.isNaN(parsed.getTime())) return parsed;
	}
	return new Date();
};

const getSummary = (findings: MaintleyFinding[]) => ({
	total: findings.length,
	high: findings.filter((finding) => finding.severity === 'high').length,
	medium: findings.filter((finding) => finding.severity === 'medium').length,
	low: findings.filter((finding) => finding.severity === 'low').length,
	byCategory: findings.reduce<Record<string, number>>((summary, finding) => {
		summary[finding.category] = (summary[finding.category] || 0) + 1;
		return summary;
	}, {}),
});

export const runMaintleyIntelligence = (
	input: MaintleyIntelligenceInput,
	rules: MaintleyIntelligenceRule[] = maintleyIntelligenceRules,
): MaintleyIntelligenceResult => {
	const assets = (input.assets || input.systems || []) as typeof input.systems;
	const currentDate = getCurrentDate(input.currentDate);
	const createdAt = input.createdAt || currentDate.toISOString();
	const planId = input.planId ? normalizeMaintleyPlanId(input.planId) : undefined;
	const capabilities =
		input.capabilities ||
		(planId ? getCapabilitiesForPlan(planId) : {});
	const maintenanceHistory = mergeMaintenanceHistoryWithDeviceSources(
		input.maintenanceHistory,
		assets,
	);
	const context = {
		property: input.property,
		assets,
		systems: assets,
		tasks: input.tasks,
		maintenanceHistory,
		documents: input.documents || [],
		files: input.files || [],
		planId,
		capabilities,
		currentDate,
		baselineVersion: BASELINE_CARE_LIBRARY_VERSION,
		createdAt,
	};
	const rawFindings = aggregateMaintleyFindings(
		rules.flatMap((rule) => rule.evaluate(context)),
	);
	const findings = prioritizeMaintleyFindings(
		planId
			? filterFindingsForPlanAndCapabilities(rawFindings, planId, capabilities)
			: rawFindings,
	);

	return {
		propertyId: input.property.id,
		generatedAt: createdAt,
		baselineVersion: BASELINE_CARE_LIBRARY_VERSION,
		assetsReviewed: assets.length,
		systemsReviewed: assets.length,
		tasksReviewed: input.tasks.length,
		summary: getSummary(findings),
		findings,
	};
};
