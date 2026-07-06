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
} from '../types';
import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { runMaintleyIntelligence } from '../engine';
import { compareMaintleyFindings } from '../prioritization';
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

export interface DashboardSuggestedTaskPrefill {
	title: string;
	propertyId: string;
	devices?: string[];
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

const makeDashboardSuggestion = (
	finding: MaintleyFinding,
	propertyLookup: Map<string, Property>,
	systemLookup: Map<string, Device>,
): DashboardIntelligenceSuggestion => {
	const propertyTitle = getPropertyTitle(propertyLookup, finding.propertyId);

	return {
		id: `maintley-intelligence:dashboard:${finding.id}`,
		ruleId: finding.ruleId,
		title: finding.title,
		description: finding.description,
		whyItMatters: finding.whyItMatters,
		contextLabel: propertyTitle,
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
	const suggestions = [...propertyFindings]
		.sort(compareMaintleyFindings)
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
