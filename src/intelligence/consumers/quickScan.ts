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
		title: 'Overdue maintenance tasks need review.',
		description: 'One or more open maintenance tasks are past due.',
		whyItMatters:
			'Overdue work directly affects maintenance execution and should be reviewed first.',
		suggestedActionLabel: 'Open Tasks',
		suggestedActionType: 'open_tasks',
	},
	{
		ruleId: 'safety-systems-missing-maintenance-history',
		idSuffix: 'safety-device-history',
		category: 'Maintenance Opportunities',
		severity: 'high',
		priority: 'high',
		title: 'Safety device maintenance tracking has not been started.',
		description:
			'Smoke or carbon monoxide detector records do not show maintenance history yet.',
		whyItMatters:
			'Recording checks or battery changes helps keep safety-device maintenance visible in the property timeline.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'systems-missing-actionable-maintenance-coverage',
		idSuffix: 'recurring-maintenance',
		category: 'Maintenance Opportunities',
		severity: 'high',
		priority: 'high',
		title: 'Recurring maintenance is missing for several systems.',
		description:
			'Some systems do not have linked recurring maintenance tasks.',
		whyItMatters:
			'Recurring tasks help turn important maintenance into a visible schedule.',
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
		title: 'Some maintenance may be due based on Maintley baseline care.',
		description:
			'Maintley found saved maintenance history that is older than the baseline interval for some systems.',
		whyItMatters:
			'Baseline care intervals help turn your maintenance history into practical next steps without relying on manufacturer-specific assumptions.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'systems-missing-maintenance-history',
		idSuffix: 'maintenance-history',
		category: 'Maintenance Opportunities',
		severity: 'medium',
		priority: 'medium',
		title: 'Maintenance tracking has not been started for many systems.',
		description: 'Some systems do not have maintenance history saved yet.',
		whyItMatters:
			'Recording maintenance history helps build a useful service timeline and future recommendations.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'systems-missing-important-identification',
		idSuffix: 'system-identification',
		category: 'Missing Information',
		severity: 'medium',
		priority: 'medium',
		title: 'Important identification details are missing for some systems.',
		description:
			'Some systems are missing make or model information in the saved record.',
		whyItMatters:
			'Make and model details make records more useful when finding manuals, parts, or service notes.',
		suggestedActionLabel: 'Review Systems',
		suggestedActionType: 'open_systems',
	},
	{
		ruleId: 'major-systems-missing-install-dates',
		idSuffix: 'install-dates',
		category: 'Missing Information',
		severity: 'medium',
		priority: 'medium',
		title: 'Install dates are missing for many major systems.',
		description: 'Some systems do not have install dates recorded.',
		whyItMatters:
			'Install dates help with maintenance planning, warranty review, and long-term replacement planning.',
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
