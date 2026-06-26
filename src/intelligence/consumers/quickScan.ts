import { runMaintleyIntelligence } from '../engine';
import {
	filterFindingsForPlanAndCapabilities,
} from '../planFilter';
import { prioritizeMaintleyFindings } from '../prioritization';
import {
	MaintleyCapability,
	MaintleyFinding,
	MaintleyFindingActionType,
	MaintleyFindingCategory,
	MaintleyFindingPriority,
	MaintleyFindingSeverity,
	MaintleyIntelligenceInput,
	MaintleyRequiredPlan,
} from '../types';

export const QUICK_SCAN_FINDING_LIMIT = 5;

interface QuickScanOptions {
	planId?: string;
	capabilities?: Partial<Record<MaintleyCapability, boolean>>;
	limit?: number;
	includePremiumOpportunity?: boolean;
}

interface SummaryConfig {
	ruleId: string;
	idSuffix: string;
	category: MaintleyFindingCategory;
	severity: MaintleyFindingSeverity;
	priority: MaintleyFindingPriority;
	title: string;
	description: string;
	whyItMatters: string;
	suggestedActionLabel: string;
	suggestedActionType: MaintleyFindingActionType;
	requiredPlan?: MaintleyRequiredPlan;
}

const SUMMARY_CONFIGS: SummaryConfig[] = [
	{
		ruleId: 'overdue-tasks-exist',
		idSuffix: 'overdue-tasks',
		category: 'Overdue Work',
		severity: 'high',
		priority: 'high',
		title: 'Maintley has recorded maintenance tasks that are now overdue.',
		description: "Maintley's records show one or more open maintenance tasks are past due.",
		whyItMatters:
			'Reviewing these recorded tasks helps keep maintenance visible and prevents it from slipping further behind.',
		suggestedActionLabel: 'Review Tasks',
		suggestedActionType: 'open_task',
	},
	{
		ruleId: 'safety-systems-missing-maintenance-history',
		idSuffix: 'safety-device-history',
		category: 'Maintenance Opportunities',
		severity: 'high',
		priority: 'high',
		title: "Maintley's records do not show safety-device maintenance history.",
		description:
			"Maintley's records do not include battery tests or battery replacements for smoke or carbon monoxide detectors yet.",
		whyItMatters:
			'Recording tests and battery changes creates a clear history for the next check.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'systems-missing-actionable-maintenance-coverage',
		idSuffix: 'recurring-maintenance',
		category: 'Maintenance Opportunities',
		severity: 'high',
		priority: 'high',
		title: 'Maintley does not currently have recurring maintenance recorded for several systems.',
		description:
			"Maintley's records do not show linked recurring maintenance tasks for some systems.",
		whyItMatters:
			'Recurring schedules help keep service intervals visible before routine care is forgotten.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
		requiredPlan: 'homeowner_plus',
	},
	{
		ruleId: 'baseline-maintenance-cadence-overdue',
		idSuffix: 'baseline-maintenance-cadence',
		category: 'Maintenance Opportunities',
		severity: 'medium',
		priority: 'medium',
		title: "Maintley's records suggest some routine care may be ready for another look.",
		description:
			'Maintley found saved maintenance history that is older than the baseline interval for some systems.',
		whyItMatters:
			'Comparing saved history with baseline care intervals helps turn old records into practical next steps.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'systems-missing-maintenance-history',
		idSuffix: 'maintenance-history',
		category: 'Maintenance Opportunities',
		severity: 'medium',
		priority: 'medium',
		title: "Maintenance history hasn't been started for several systems.",
		description: "Maintley's records do not show saved maintenance history for some systems yet.",
		whyItMatters:
			'Starting the history creates a clearer record of what was serviced, when it happened, and what may need attention next.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'systems-missing-important-identification',
		idSuffix: 'system-identification',
		category: 'Missing Information',
		severity: 'medium',
		priority: 'medium',
		title: "Some systems could be easier to identify in Maintley's records.",
		description:
			"Maintley's records do not show make or model information for some systems.",
		whyItMatters:
			'Make and model details make future manuals, parts, warranty claims, and service notes easier to find.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'major-systems-missing-install-dates',
		idSuffix: 'install-dates',
		category: 'Missing Information',
		severity: 'medium',
		priority: 'medium',
		title: 'No install date has been recorded for several major systems.',
		description: "Maintley's records do not show install dates for some major systems.",
		whyItMatters:
			'Recording install dates makes warranty tracking, service planning, and future replacements much easier.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
];

const getAffectedTaskIds = (findings: MaintleyFinding[]): string[] =>
	Array.from(
		new Set(
			findings
				.map((finding) => String(finding.metadata.taskId || ''))
				.filter(Boolean),
		),
	);

const getAffectedSystemIds = (findings: MaintleyFinding[]): string[] =>
	Array.from(
		new Set(findings.flatMap((finding) => finding.affectedSystemIds)),
	);

const getAffectedAssetIds = (findings: MaintleyFinding[]): string[] =>
	Array.from(
		new Set(
			findings.flatMap(
				(finding) => finding.affectedAssetIds || finding.affectedSystemIds,
			),
		),
	);

const makeSummaryFinding = (
	config: SummaryConfig,
	findings: MaintleyFinding[],
): MaintleyFinding | null => {
	if (findings.length === 0) return null;

	const firstFinding = findings[0];

	return {
		id: `maintley-intelligence:${firstFinding.propertyId}:quick-scan-summary:${config.idSuffix}`,
		ruleId: config.ruleId,
		propertyId: firstFinding.propertyId,
		affectedAssetIds: getAffectedAssetIds(findings),
		affectedSystemIds: getAffectedSystemIds(findings),
		category: config.category,
		severity: config.severity,
		priority: config.priority,
		title: config.title,
		description: config.description,
		whyItMatters: config.whyItMatters,
		suggestedActionLabel: config.suggestedActionLabel,
		suggestedActionType: config.suggestedActionType,
		requiredPlan: config.requiredPlan || firstFinding.requiredPlan,
		requiredCapabilities: firstFinding.requiredCapabilities,
		metadata: {
			sourceFindingIds: findings.map((finding) => finding.id),
			affectedTaskIds: getAffectedTaskIds(findings),
			affectedAssetIds: getAffectedAssetIds(findings),
			affectedSystemIds: getAffectedSystemIds(findings),
		},
		createdAt: firstFinding.createdAt,
	};
};

const makePremiumRecurringMaintenanceOpportunity = (
	findings: MaintleyFinding[],
	planId?: string,
	capabilities?: Partial<Record<MaintleyCapability, boolean>>,
): MaintleyFinding | null => {
	const lockedCoverageFindings = findings.filter(
		(finding) =>
			finding.ruleId === 'systems-missing-actionable-maintenance-coverage' &&
			!filterFindingsForPlanAndCapabilities([finding], planId, capabilities)
				.length,
	);
	if (lockedCoverageFindings.length === 0) return null;

	const firstFinding = lockedCoverageFindings[0];

	return {
		id: `maintley-intelligence:${firstFinding.propertyId}:quick-scan-premium:recurring-maintenance`,
		ruleId: 'premium-recurring-maintenance-opportunity',
		propertyId: firstFinding.propertyId,
		affectedAssetIds: [],
		affectedSystemIds: [],
		category: 'Maintenance Opportunities',
		severity: 'medium',
		priority: 'medium',
		title: 'Recurring maintenance recommendations are available with Homeowner+.',
		description:
			'Some systems could benefit from recurring maintenance coverage, which is available on Homeowner+ and higher plans.',
		whyItMatters:
			'Recurring schedules help keep routine care visible when you are ready for more maintenance automation.',
		suggestedActionLabel: 'Learn More',
		suggestedActionType: 'view_plan_options',
		requiredPlan: 'homeowner_plus',
		requiredCapabilities: ['recurring_tasks'],
		metadata: {
			sourceFindingIds: lockedCoverageFindings.map((finding) => finding.id),
		},
		createdAt: firstFinding.createdAt,
	};
};

export const selectQuickScanFindings = (
	findings: MaintleyFinding[],
	options: QuickScanOptions = {},
): MaintleyFinding[] => {
	const limit = options.limit || QUICK_SCAN_FINDING_LIMIT;
	const candidateFindings = filterFindingsForPlanAndCapabilities(
		findings.filter((finding) => finding.priority !== 'low'),
		options.planId,
		options.capabilities,
	);
	const summaryRuleIds = new Set(SUMMARY_CONFIGS.map((config) => config.ruleId));
	const summaryFindings = SUMMARY_CONFIGS.map((config) =>
		makeSummaryFinding(
			config,
			candidateFindings.filter((finding) => finding.ruleId === config.ruleId),
		),
	).filter((finding): finding is MaintleyFinding => Boolean(finding));
	const passthroughFindings = candidateFindings.filter(
		(finding) => !summaryRuleIds.has(finding.ruleId),
	);
	const premiumOpportunity =
		options.includePremiumOpportunity === true
			? makePremiumRecurringMaintenanceOpportunity(
				findings,
				options.planId,
				options.capabilities,
			)
			: null;
	const prioritizedFindings = prioritizeMaintleyFindings([
		...summaryFindings,
		...passthroughFindings,
	]);

	if (!premiumOpportunity) {
		return prioritizedFindings.slice(0, limit);
	}

	return [
		...prioritizedFindings.slice(0, Math.max(0, limit - 1)),
		premiumOpportunity,
	];
};

export const runQuickPropertyScan = (
	input: MaintleyIntelligenceInput,
	options: QuickScanOptions = {},
): MaintleyFinding[] =>
	selectQuickScanFindings(
		runMaintleyIntelligence({
			...input,
			planId: undefined,
			capabilities: undefined,
		}).findings,
		options,
	);
