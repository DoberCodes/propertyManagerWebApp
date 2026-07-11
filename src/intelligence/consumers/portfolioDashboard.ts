import { Device, Property } from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import {
	MaintleyCapability,
	MaintleyFinding,
	MaintleyFindingActionType,
	MaintleyFindingCategory,
	MaintleyFindingPriority,
	MaintleyFindingSeverity,
	MaintleyFindingSource,
	MaintleyPlanId,
} from '../types';
import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { runMaintleyIntelligence } from '../engine';
import { normalizeMaintleyPlanId } from '../planFilter';
import {
	getAssetDisplayName,
	normalizeText,
} from '../rules/helpers';

export interface DashboardIntelligenceInput {
	properties: Property[];
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	planId?: string;
	capabilities?: Partial<Record<MaintleyCapability, boolean>>;
	currentDate?: Date | string;
	createdAt?: string;
	limit?: number;
}

export interface DashboardIntelligenceSuggestion {
	id: string;
	ruleId: string;
	title: string;
	description: string;
	whyItMatters: string;
	evidenceSummary?: string;
	evidenceDetails?: DashboardIntelligenceEvidenceDetail[];
	contextLabel: string;
	propertyTitle: string;
	suggestedActionLabel: string;
	suggestedActionType: MaintleyFindingActionType;
	category: MaintleyFindingCategory;
	severity: MaintleyFindingSeverity;
	priority: MaintleyFindingPriority;
	source: MaintleyFindingSource;
	affectedPropertyIds: string[];
	affectedSystemIds: string[];
	relatedTaskIds: string[];
	suggestedTask?: DashboardSuggestedTaskPrefill;
	metadata: Record<string, unknown>;
}

export interface DashboardIntelligenceEvidenceDetail {
	label: string;
	text: string;
}

export interface DashboardSuggestedTaskPrefill {
	title: string;
	propertyId: string;
	devices?: string[];
	dueDate?: string;
	status?: string;
	priority?: string;
	category?: string;
	notes?: string;
	isRecurring?: boolean;
	recurrenceFrequency?: string;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: string;
}

export interface DashboardIntelligenceResult {
	generatedAt: string;
	propertiesReviewed: number;
	suggestions: DashboardIntelligenceSuggestion[];
	primarySuggestion: DashboardIntelligenceSuggestion | null;
}

const getRecordPropertyId = (record: any): string =>
	String(record?.propertyId || record?.location?.propertyId || '').trim();

const getRecordPropertyTitle = (record: any): string =>
	String(record?.propertyTitle || record?.property || '').trim();

const getSystemPropertyId = (system: Device): string =>
	String(system?.location?.propertyId || '').trim();

const getTaskPropertyId = (task: Task): string =>
	String(task?.propertyId || '').trim();

const getTaskPropertyTitle = (task: Task): string =>
	String((task as any)?.property || (task as any)?.propertyTitle || '').trim();

const getRelatedTaskIds = (findings: MaintleyFinding[]): string[] =>
	Array.from(
		new Set(
			findings.flatMap((finding) => {
				if (Array.isArray(finding.metadata.affectedTaskIds)) {
					return finding.metadata.affectedTaskIds
						.map((taskId) => String(taskId || '').trim())
						.filter(Boolean);
				}

				const taskId = String(finding.metadata.taskId || '').trim();
				return taskId ? [taskId] : [];
			}),
		),
	);

const PRIORITY_RANK: Record<MaintleyFindingPriority, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

const SEVERITY_RANK: Record<MaintleyFindingSeverity, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

const DASHBOARD_PAID_SOURCE_RANK: Record<MaintleyFindingSource, number> = {
	history_inference: 0,
	context: 1,
	knowledge_pack: 2,
	property_memory: 3,
};

const DASHBOARD_EXCLUDED_RULE_IDS = new Set([
	'overdue-tasks-exist',
	'systems-missing-actionable-maintenance-coverage',
]);

const DASHBOARD_PAID_SPOTLIGHT_SOURCES = new Set<MaintleyFindingSource>([
	'history_inference',
	'context',
	'knowledge_pack',
]);

const isExpandedIntelligencePlan = (planId: MaintleyPlanId): boolean =>
	!['guest', 'tenant', 'homeowner'].includes(planId);

const compareDashboardFindings = (
	left: MaintleyFinding,
	right: MaintleyFinding,
	planId: MaintleyPlanId,
): number => {
	if (isExpandedIntelligencePlan(planId)) {
		const sourceDelta =
			DASHBOARD_PAID_SOURCE_RANK[left.source] -
			DASHBOARD_PAID_SOURCE_RANK[right.source];
		if (sourceDelta !== 0) return sourceDelta;
	}

	const priorityDelta =
		PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
	if (priorityDelta !== 0) return priorityDelta;

	const severityDelta =
		SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
	if (severityDelta !== 0) return severityDelta;

	const seasonalRankDelta =
		Number(left.metadata.seasonalTaskRank || Number.MAX_SAFE_INTEGER) -
		Number(right.metadata.seasonalTaskRank || Number.MAX_SAFE_INTEGER);
	if (seasonalRankDelta !== 0) return seasonalRankDelta;

	return left.title.localeCompare(right.title);
};

const filterDashboardSpotlightFindings = (
	findings: MaintleyFinding[],
	planId: MaintleyPlanId,
): MaintleyFinding[] => {
	const eligibleFindings = findings.filter(
		(finding) => !DASHBOARD_EXCLUDED_RULE_IDS.has(finding.ruleId),
	);

	if (!isExpandedIntelligencePlan(planId)) {
		return eligibleFindings;
	}

	const paidSpotlightFindings = eligibleFindings.filter((finding) =>
		DASHBOARD_PAID_SPOTLIGHT_SOURCES.has(finding.source),
	);

	return paidSpotlightFindings.length > 0
		? paidSpotlightFindings
		: eligibleFindings;
};

const getAffectedSystemIds = (finding: MaintleyFinding): string[] =>
	Array.from(
		new Set(finding.affectedSystemIds || []),
	);

const getPrimaryAffectedSystemId = (finding: MaintleyFinding): string => {
	const metadataSystemId = String(finding.metadata.systemId || '').trim();
	return metadataSystemId || getAffectedSystemIds(finding)[0] || '';
};

const getRecurrenceForIntervalDays = (
	intervalDays?: number,
): Pick<
	DashboardSuggestedTaskPrefill,
	'recurrenceFrequency' | 'recurrenceInterval' | 'recurrenceCustomUnit'
> => {
	switch (intervalDays) {
		case 7:
			return { recurrenceFrequency: 'weekly' };
		case 14:
			return { recurrenceFrequency: 'biweekly' };
		case 30:
			return { recurrenceFrequency: 'monthly' };
		case 90:
			return { recurrenceFrequency: 'quarterly' };
		case 365:
			return { recurrenceFrequency: 'yearly' };
		case 180:
			return {
				recurrenceFrequency: 'custom',
				recurrenceInterval: 6,
				recurrenceCustomUnit: 'months',
			};
		default:
			if (intervalDays && intervalDays > 0) {
				return {
					recurrenceFrequency: 'custom',
					recurrenceInterval: intervalDays,
					recurrenceCustomUnit: 'days',
				};
			}
			return {};
	}
};

const getRecurringTaskTitleForSystem = (
	system: Device | undefined,
	systemName: string,
): string => {
	const systemText = normalizeText(
		[
			systemName,
			system?.type,
			system?.assetType,
			system?.assetVariant,
			system?.brand,
			system?.model,
		].filter(Boolean).join(' '),
	);

	if (systemText.includes('carbon monoxide')) {
		return 'Test Carbon Monoxide Detector';
	}

	if (systemText.includes('smoke')) {
		return 'Test Smoke Detector';
	}

	const baselineDefinition = system
		? getBaselineDefinitionForAsset(system)
		: null;
	const cadenceTitle =
		baselineDefinition?.suggestedMaintenanceCadence?.[0]?.label;

	if (cadenceTitle) {
		return cadenceTitle;
	}

	return `Maintain ${systemName}`;
};

const getTaskCategoryForSystem = (
	system: Device | undefined,
	systemName: string,
): string => {
	const systemText = normalizeText(
		[systemName, system?.type, system?.assetType, system?.assetVariant]
			.filter(Boolean)
			.join(' '),
	);

	if (
		systemText.includes('smoke') ||
		systemText.includes('carbon monoxide') ||
		systemText.includes('safety')
	) {
		return 'Safety';
	}

	if (systemText.includes('hvac') || systemText.includes('furnace')) {
		return 'HVAC';
	}

	if (systemText.includes('water heater')) {
		return 'Plumbing';
	}

	return 'Maintenance';
};

const getTaskPriorityForSystem = (
	system: Device | undefined,
	systemName: string,
): string => {
	const systemText = normalizeText(
		[systemName, system?.type, system?.assetType, system?.assetVariant]
			.filter(Boolean)
			.join(' '),
	);

	if (
		systemText.includes('smoke') ||
		systemText.includes('carbon monoxide') ||
		systemText.includes('safety')
	) {
		return 'High';
	}

	return 'Medium';
};

const buildSuggestedTaskPrefill = (
	finding: MaintleyFinding,
	systemLookup: Map<string, Device>,
): DashboardSuggestedTaskPrefill | undefined => {
	if (finding.suggestedActionType !== 'create_task') {
		return undefined;
	}

	const systemId = getPrimaryAffectedSystemId(finding);
	if (finding.ruleId === 'seasonal-context-guidance') {
		const seasonalTitle = String(finding.metadata.seasonalTaskTitle || '').trim();
		const seasonalDescription = String(
			finding.metadata.seasonalTaskDescription || finding.description || '',
		).trim();
		const seasonalDueDate = String(finding.metadata.seasonalTaskDueDate || '').trim();
		const seasonalCategory = String(
			finding.metadata.seasonalTaskCategory || 'Maintenance',
		).trim();
		const seasonalPriority = String(
			finding.metadata.seasonalTaskPriority || finding.priority || 'Medium',
		).trim();

		return {
			title: seasonalTitle || finding.title,
			propertyId: finding.propertyId,
			devices: systemId ? [systemId] : [],
			dueDate: seasonalDueDate,
			status: 'Initiated',
			priority: seasonalPriority,
			category: seasonalCategory,
			notes: [
				seasonalDescription,
				finding.whyItMatters,
				'Created from a Maintley seasonal recommendation.',
			]
				.filter(Boolean)
				.join('\n\n'),
			isRecurring: false,
		};
	}

	const system = systemId ? systemLookup.get(systemId) : undefined;
	const systemName = String(finding.metadata.systemName || '').trim() ||
		(system ? getAssetDisplayName(system) : 'this system');
	const baselineDefinition = system
		? getBaselineDefinitionForAsset(system)
		: null;
	const cadence = baselineDefinition?.suggestedMaintenanceCadence?.[0];
	const isDetector = normalizeText(systemName).includes('detector');
	const recurrence = isDetector
		? { recurrenceFrequency: 'monthly' }
		: getRecurrenceForIntervalDays(cadence?.intervalDays);

	return {
		title: getRecurringTaskTitleForSystem(system, systemName),
		propertyId: finding.propertyId,
		devices: systemId ? [systemId] : [],
		status: 'Initiated',
		priority: getTaskPriorityForSystem(system, systemName),
		category: getTaskCategoryForSystem(system, systemName),
		notes:
			cadence?.whyItMatters ||
			`Maintley Intelligence recommended creating a recurring reminder for ${systemName}.`,
		isRecurring: true,
		...recurrence,
	};
};

const getPropertyTitle = (
	propertyLookup: Map<string, Property>,
	propertyId: string,
): string => String(propertyLookup.get(propertyId)?.title || '').trim();

const getPropertyMaintenanceHistory = (
	property: Property,
	propertySystems: Device[],
	maintenanceHistory: any[],
): any[] => {
	const propertySystemIds = new Set(propertySystems.map((system) => system.id));
	const propertyTitle = String(property.title || '').trim();

	return maintenanceHistory.filter((record) => {
		const recordPropertyId = getRecordPropertyId(record);
		if (recordPropertyId && recordPropertyId === property.id) {
			return true;
		}

		const recordPropertyTitle = getRecordPropertyTitle(record);
		if (recordPropertyTitle && recordPropertyTitle === propertyTitle) {
			return true;
		}

		const rawDeviceIds = Array.isArray(record?.deviceIds)
			? record.deviceIds
			: Array.isArray(record?.devices)
				? record.devices
				: record?.deviceId
					? [record.deviceId]
					: [];

		return rawDeviceIds.some((deviceId: unknown) =>
			propertySystemIds.has(String(deviceId).trim()),
		);
	});
};

const getNumberMetadata = (
	metadata: Record<string, unknown>,
	key: string,
): number | undefined => {
	const value = metadata[key];
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return undefined;
};

const formatDayCount = (days: number): string =>
	days === 1 ? '1 day' : `${days} days`;

const formatFriendlyTimeframe = (days: number): string => {
	if (days >= 60) {
		const months = Math.max(1, Math.round(days / 30));
		return months === 1 ? 'about 1 month' : `about ${months} months`;
	}
	return `about ${formatDayCount(days)}`;
};

const getIntervalArticle = (value: number): 'a' | 'an' => {
	const text = String(value);
	return text.startsWith('8') || text.startsWith('11') || text.startsWith('18')
		? 'an'
		: 'a';
};

const formatIntervalNoun = (days?: number): string => {
	if (!days || days <= 0) return 'an interval that may be out of sync';
	if (days >= 60) {
		const months = Math.max(1, Math.round(days / 30));
		return `about ${getIntervalArticle(months)} ${months}-month interval`;
	}
	if (days % 7 === 0 && days >= 14) {
		const weeks = days / 7;
		return `about ${getIntervalArticle(weeks)} ${weeks}-week interval`;
	}
	return `about ${getIntervalArticle(days)} ${days}-day interval`;
};

const formatRecurrenceCadence = (days?: number): string => {
	if (!days || days <= 0) return 'on a recurring schedule';
	if (days === 1) return 'every day';
	if (days === 7) return 'every week';
	if (days === 14) return 'every 2 weeks';
	if (days === 30) return 'every month';
	if (days === 90) return 'every 3 months';
	if (days === 180) return 'every 6 months';
	if (days === 365) return 'every year';
	if (days % 365 === 0) {
		const years = days / 365;
		return years === 1 ? 'every year' : `every ${years} years`;
	}
	if (days % 30 === 0) {
		const months = days / 30;
		return months === 1 ? 'every month' : `every ${months} months`;
	}
	if (days % 7 === 0) {
		const weeks = days / 7;
		return weeks === 1 ? 'every week' : `every ${weeks} weeks`;
	}
	return days === 1 ? 'every day' : `every ${days} days`;
};

const formatDateLabel = (value: unknown): string => {
	if (!value) return '';
	const parsed = new Date(String(value));
	if (Number.isNaN(parsed.getTime())) return '';
	const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
	const day = String(parsed.getUTCDate()).padStart(2, '0');
	return `${month}/${day}/${parsed.getUTCFullYear()}`;
};

const getEvidenceSubjectLabel = (label: string): string => {
	const subject = label
		.trim()
		.replace(/^replace or inspect\s+/i, '')
		.replace(/^record\s+/i, '')
		.replace(/^review\s+/i, '');

	return subject || 'this maintenance';
};

const getSpecificEvidenceSubject = (subject: string): string =>
	/^(this|that|the)\b/i.test(subject) ? subject : `this ${subject}`;

const getScheduleReminderTaskText = (
	metadata: Record<string, unknown>,
	scheduledDateLabel: string,
): string => {
	const recurrenceIntervalDays = getNumberMetadata(
		metadata,
		'scheduledTaskRecurrenceIntervalDays',
	);
	const recurrenceText = formatRecurrenceCadence(recurrenceIntervalDays);
	const scheduledTaskTitle = String(metadata.scheduledTaskTitle || '').trim();

	if (scheduledTaskTitle && scheduledDateLabel) {
		return `Your recurring "${scheduledTaskTitle}" task is scheduled for ${scheduledDateLabel} and repeats ${recurrenceText}.`;
	}

	if (scheduledTaskTitle) {
		return `Your recurring "${scheduledTaskTitle}" task repeats ${recurrenceText}.`;
	}

	if (scheduledDateLabel) {
		return `Your recurring reminder is scheduled for ${scheduledDateLabel} and repeats ${recurrenceText}.`;
	}

	return `Your recurring reminder repeats ${recurrenceText}.`;
};

const getScheduleAlignmentText = (
	metadata: Record<string, unknown>,
): string => {
	const scheduledDaysFromLastService = getNumberMetadata(
		metadata,
		'scheduledTaskDaysFromLastMaintenance',
	);
	if (!scheduledDaysFromLastService || scheduledDaysFromLastService <= 0) {
		return 'Your maintenance history and recurring task may no longer line up. Reviewing the next reminder date or the recorded maintenance history may help keep them aligned.';
	}

	const intervalText = formatIntervalNoun(scheduledDaysFromLastService);
	return `Your maintenance history and recurring task currently reflect ${intervalText}. Reviewing the next reminder date or the recorded maintenance history may help keep them aligned.`;
};

const buildEvidenceDetails = (
	finding: MaintleyFinding,
): DashboardIntelligenceEvidenceDetail[] => {
	if (finding.ruleId !== 'baseline-maintenance-cadence-overdue') {
		return [];
	}

	const elapsedDays = getNumberMetadata(finding.metadata, 'elapsedDays');
	const baselineIntervalDays = getNumberMetadata(
		finding.metadata,
		'baselineIntervalDays',
	);
	const evidenceSubject = getEvidenceSubjectLabel(String(
		finding.metadata.baselineCadenceLabel || 'this maintenance',
	));
	const specificEvidenceSubject = getSpecificEvidenceSubject(evidenceSubject);
	const scheduledTaskTitle = String(
		finding.metadata.scheduledTaskTitle || '',
	).trim();
	const hasLaterScheduledTask = Boolean(
		finding.metadata.scheduledTaskId ||
		finding.metadata.taskId ||
		scheduledTaskTitle,
	);

	if (elapsedDays === undefined) {
		return [];
	}

	const elapsedText = formatFriendlyTimeframe(elapsedDays);

	if (hasLaterScheduledTask) {
		const scheduledDateLabel = formatDateLabel(
			finding.metadata.scheduledTaskDueDate,
		);
		return [
			{
				label: 'Observation',
				text: `Your maintenance history shows ${specificEvidenceSubject} was last serviced ${elapsedText} ago.`,
			},
			{
				label: 'Reminder',
				text: getScheduleReminderTaskText(
					finding.metadata,
					scheduledDateLabel,
				),
			},
			{
				label: 'Recommendation',
				text: getScheduleAlignmentText(finding.metadata),
			},
		];
	}

	const commonTimeframeText =
		baselineIntervalDays && baselineIntervalDays > 0
			? `The common timeframe is ${formatFriendlyTimeframe(baselineIntervalDays)}.`
			: 'The maintenance history suggests it may be time to review this.';

	return [
		{
			label: 'Observation',
			text: `Your maintenance history shows the ${evidenceSubject} was last serviced ${elapsedText} ago.`,
		},
		{
			label: 'Context',
			text: commonTimeframeText,
		},
		{
			label: 'Recommendation',
			text: 'It may be worth a quick look.',
		},
	];
};

const buildEvidenceSummary = (finding: MaintleyFinding): string | undefined => {
	const evidenceDetails = buildEvidenceDetails(finding);
	if (evidenceDetails.length === 0) return undefined;
	return evidenceDetails.map((detail) => detail.text).join(' ');
};

const makeDashboardSuggestion = (
	finding: MaintleyFinding,
	propertyLookup: Map<string, Property>,
	systemLookup: Map<string, Device>,
): DashboardIntelligenceSuggestion => {
	const propertyTitle = getPropertyTitle(propertyLookup, finding.propertyId);
	const systemId = getPrimaryAffectedSystemId(finding);
	const system = systemId ? systemLookup.get(systemId) : undefined;
	const systemName = String(finding.metadata.systemName || '').trim() ||
		(system ? getAssetDisplayName(system) : '');
	const contextLabel = [
		propertyTitle,
		finding.ruleId === 'baseline-maintenance-cadence-overdue'
			? systemName
			: '',
	]
		.filter(Boolean)
		.join(' - ');

	return {
		id: `maintley-intelligence:dashboard:${finding.id}`,
		ruleId: finding.ruleId,
		title: finding.title,
		description: finding.description,
		whyItMatters: finding.whyItMatters,
		evidenceSummary: buildEvidenceSummary(finding),
		evidenceDetails: buildEvidenceDetails(finding),
		contextLabel,
		propertyTitle,
		suggestedActionLabel: finding.suggestedActionLabel,
		suggestedActionType: finding.suggestedActionType,
		category: finding.category,
		severity: finding.severity,
		priority: finding.priority,
		source: finding.source,
		affectedPropertyIds: [finding.propertyId],
		affectedSystemIds: getAffectedSystemIds(finding),
		relatedTaskIds: getRelatedTaskIds([finding]),
		suggestedTask: buildSuggestedTaskPrefill(finding, systemLookup),
		metadata: {
			...finding.metadata,
			propertyTitle,
			sourceFindingId: finding.id,
			sourceRuleId: finding.ruleId,
		},
	};
};

export const runDashboardIntelligence = ({
	properties,
	systems,
	tasks,
	maintenanceHistory,
	planId,
	capabilities,
	currentDate,
	createdAt,
	limit = 1,
}: DashboardIntelligenceInput): DashboardIntelligenceResult => {
	const normalizedPlanId = normalizeMaintleyPlanId(planId);
	const generatedAt =
		createdAt ||
		(currentDate instanceof Date
			? currentDate.toISOString()
			: currentDate) ||
		new Date().toISOString();
	const propertyLookup = new Map(properties.map((property) => [property.id, property]));
	const systemLookup = new Map(systems.map((system) => [system.id, system]));
	const propertyFindings = properties.flatMap((property) => {
		const propertySystems = systems.filter(
			(system) => getSystemPropertyId(system) === property.id,
		);
		const propertyTasks = tasks.filter((task) => {
			const taskPropertyId = getTaskPropertyId(task);
			if (taskPropertyId && taskPropertyId === property.id) return true;

			const taskPropertyTitle = getTaskPropertyTitle(task);
			return Boolean(taskPropertyTitle && taskPropertyTitle === property.title);
		});
		const propertyMaintenanceHistory = getPropertyMaintenanceHistory(
			property,
			propertySystems,
			maintenanceHistory,
		);

		const result = runMaintleyIntelligence({
			property,
			systems: propertySystems,
			tasks: propertyTasks,
			maintenanceHistory: propertyMaintenanceHistory,
			planId: normalizedPlanId,
			capabilities,
			currentDate,
			createdAt: generatedAt,
		});

		return result.findings;
	});
	const suggestions = filterDashboardSpotlightFindings(
		propertyFindings,
		normalizedPlanId,
	)
		.sort((left, right) =>
			compareDashboardFindings(left, right, normalizedPlanId),
		)
		.slice(0, limit)
		.map((finding) =>
			makeDashboardSuggestion(
				finding,
				propertyLookup,
				systemLookup,
			),
		);

	return {
		generatedAt,
		propertiesReviewed: properties.length,
		suggestions,
		primarySuggestion: suggestions[0] || null,
	};
};
