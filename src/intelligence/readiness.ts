import { Device } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { mergeMaintenanceHistoryWithDeviceSources } from '../maintenanceHistory/maintenanceHistoryAdapter';
import {
	expectsMaintenanceHistoryRecord,
	expectsRecurringCareRecord,
} from './assetRecordExpectations';
import { getDeviceAssetType, UNKNOWN_ASSET_TYPE } from '../utils/systemTypes';
import { getBaselineDefinitionForAsset } from './baselineCareLibrary';

export const MAINTLEY_INTELLIGENCE_READINESS_VERSION = 'maintley-readiness-v2';

export type MaintleyIntelligenceReadinessLevel =
	| 'starting'
	| 'building_context'
	| 'ready';

export type MaintleyIntelligenceReadinessCategoryId =
	| 'equipment_context'
	| 'maintenance_coverage'
	| 'service_history';

export interface MaintleyIntelligenceReadinessCategory {
	id: MaintleyIntelligenceReadinessCategoryId;
	title: string;
	level: MaintleyIntelligenceReadinessLevel;
	levelLabel: string;
	summary: string;
	nextStep: string;
	evidence: {
		applicableRecords: number;
		supportedRecords: number;
		scheduledRecords?: number;
		guidedRecords?: number;
		customScheduleRecords?: number;
		historyLinkedRecords?: number;
		patternRecords?: number;
	};
}

export interface MaintleyIntelligenceReadinessResult {
	version: typeof MAINTLEY_INTELLIGENCE_READINESS_VERSION;
	categories: MaintleyIntelligenceReadinessCategory[];
}

export interface PropertyIntelligenceReadinessResult {
	propertyId: string;
	propertyTitle: string;
	propertySlug: string;
	readiness: MaintleyIntelligenceReadinessResult;
}

export interface MaintleyIntelligenceReadinessInput {
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
}

const ACTIVE_RECURRING_TASK_STATUSES = new Set([
	'Initiated',
	'Pending',
	'In Progress',
	'Awaiting Approval',
	'Overdue',
	'Hold',
]);

const levelLabel = (
	categoryId: MaintleyIntelligenceReadinessCategoryId,
	level: MaintleyIntelligenceReadinessLevel,
): MaintleyIntelligenceReadinessCategory['levelLabel'] => {
	if (categoryId === 'equipment_context') {
		if (level === 'ready') return 'Recorded';
		if (level === 'building_context') return 'Partly recorded';
		return 'Not recorded yet';
	}
	if (categoryId === 'maintenance_coverage') {
		if (level === 'ready') return 'Scheduled';
		if (level === 'building_context') return 'Partly scheduled';
		return 'Not scheduled yet';
	}
	if (level === 'ready') return 'Informed';
	if (level === 'building_context') return 'Building history';
	return 'No history yet';
};

const normalizedId = (value: unknown): string => String(value || '').trim();
const normalizedText = (value: unknown): string =>
	String(value || '').trim().toLowerCase();

const hasUsableRecurringSchedule = (task: Task): boolean =>
	task.isRecurring === true &&
	ACTIVE_RECURRING_TASK_STATUSES.has(task.status) &&
	Boolean(task.recurrenceFrequency) &&
	Boolean(task.dueDate) &&
	Number.isFinite(new Date(task.dueDate).getTime());

const taskMatchesMaintleyGuidance = (task: Task, system: Device): boolean => {
	const baseline = getBaselineDefinitionForAsset(system);
	if (!baseline) return false;
	const taskText = normalizedText(`${task.title || ''} ${task.description || ''}`);
	return baseline.suggestedMaintenanceCadence.some((cadence) =>
		cadence.matchTerms.some((term) => taskText.includes(normalizedText(term))),
	);
};

const hasRecordedPattern = (system: Device, maintenanceHistory: any[]): boolean => {
	const systemId = normalizedId(system.id);
	const baseline = getBaselineDefinitionForAsset(system);
	if (!systemId || !baseline) return false;

	return baseline.suggestedMaintenanceCadence.some((cadence) => {
		const matchingDates = maintenanceHistory
			.filter((record) => historySystemIds(record).includes(systemId))
			.filter((record) => {
				const recordText = normalizedText(
					`${record?.title || ''} ${record?.description || ''} ${record?.servicePerformed || ''}`,
				);
				return cadence.matchTerms.some((term) =>
					recordText.includes(normalizedText(term)),
				);
			})
			.map((record) =>
				new Date(
					record?.serviceDate || record?.completionDate || record?.date || '',
				).getTime(),
			)
			.filter(Number.isFinite);

		return new Set(matchingDates).size >= 3;
	});
};

const linkedTaskSystemIds = (task: Task): string[] => {
	const legacyDeviceId = normalizedId(
		(task as Task & { deviceId?: string | number }).deviceId,
	);
	return Array.from(
		new Set(
			[
				...(Array.isArray(task.devices) ? task.devices : []),
				...(legacyDeviceId ? [legacyDeviceId] : []),
			]
				.map(normalizedId)
				.filter(Boolean),
		),
	);
};

const historySystemIds = (record: any): string[] =>
	Array.from(
		new Set(
			[
				...(Array.isArray(record?.deviceIds) ? record.deviceIds : []),
				record?.deviceId,
				record?.applianceId,
				record?.systemId,
				record?.relatedDeviceId,
				record?.relatedApplianceId,
				record?.equipmentId,
			]
				.map(normalizedId)
				.filter(Boolean),
		),
	);

const isKnownEquipmentType = (system: Device): boolean => {
	const type = getDeviceAssetType(system);
	return Boolean(type && type !== UNKNOWN_ASSET_TYPE);
};

const buildEquipmentContext = (
	systems: Device[],
): MaintleyIntelligenceReadinessCategory => {
	const recognized = systems.filter(isKnownEquipmentType).length;
	const level: MaintleyIntelligenceReadinessLevel =
		systems.length === 0
			? 'starting'
			: recognized === systems.length
				? 'ready'
				: 'building_context';

	const summary =
		level === 'starting'
			? 'Add equipment so Maintley can provide equipment-specific guidance.'
			: level === 'ready'
				? `Maintley recognizes ${systems.length === 1 ? 'the tracked equipment record' : `all ${systems.length} tracked equipment records`} and can use their types for more specific guidance.`
				: `Maintley recognizes ${recognized} of ${systems.length} tracked equipment records and can provide specific guidance for those records.`;
	const nextStep =
		level === 'starting'
			? 'Add the first system or appliance you want Maintley to help track.'
			: recognized < systems.length
				? `Choose an equipment type for ${systems.length - recognized} ${systems.length - recognized === 1 ? 'record' : 'records'}.`
				: 'Add model or installation details when they are available.';

	return {
		id: 'equipment_context',
		title: 'Equipment context',
		level,
		levelLabel: levelLabel('equipment_context', level),
		summary,
		nextStep,
		evidence: {
			applicableRecords: systems.length,
			supportedRecords: recognized,
		},
	};
};

const buildMaintenanceCoverage = (
	systems: Device[],
	tasks: Task[],
): MaintleyIntelligenceReadinessCategory => {
	const applicableSystems = systems.filter(expectsRecurringCareRecord);
	const applicableIds = new Set(
		applicableSystems.map((system) => normalizedId(system.id)).filter(Boolean),
	);
	const coveredIds = new Set<string>();
	const guidedIds = new Set<string>();

	tasks.forEach((task) => {
		if (!hasUsableRecurringSchedule(task)) {
			return;
		}
		linkedTaskSystemIds(task).forEach((id) => {
			if (!applicableIds.has(id)) return;
			coveredIds.add(id);
			const system = applicableSystems.find(
				(candidate) => normalizedId(candidate.id) === id,
			);
			if (system && taskMatchesMaintleyGuidance(task, system)) {
				guidedIds.add(id);
			}
		});
	});

	const level: MaintleyIntelligenceReadinessLevel =
		applicableSystems.length === 0
			? 'starting'
			: coveredIds.size === applicableSystems.length
				? 'ready'
				: 'building_context';
	const summary =
		level === 'starting'
			? 'Add equipment that needs routine care so Maintley can suggest what to track.'
			: level === 'ready'
				? 'Maintley can use recurring tasks to show upcoming care for all tracked equipment that needs it.'
				: coveredIds.size === 0
					? 'Maintley can suggest general care for the equipment you added. Recurring tasks will let it track what is coming up.'
					: `Maintley can track upcoming care for ${coveredIds.size} of ${applicableSystems.length} equipment records that need it.`;
	const remaining = applicableSystems.length - coveredIds.size;
	const nextStep =
		level === 'starting'
			? 'Add equipment before setting up recurring care.'
			: remaining > 0
				? `Add recurring care for ${remaining} ${remaining === 1 ? 'equipment record' : 'equipment records'}.`
				: 'Keep recurring tasks current as maintenance needs change.';

	return {
		id: 'maintenance_coverage',
		title: 'Maintenance coverage',
		level,
		levelLabel: levelLabel('maintenance_coverage', level),
		summary,
		nextStep,
		evidence: {
			applicableRecords: applicableSystems.length,
			supportedRecords: coveredIds.size,
			scheduledRecords: coveredIds.size,
			guidedRecords: guidedIds.size,
			customScheduleRecords: Math.max(0, coveredIds.size - guidedIds.size),
		},
	};
};

const buildServiceHistory = (
	systems: Device[],
	maintenanceHistory: any[],
): MaintleyIntelligenceReadinessCategory => {
	const applicableSystems = systems.filter(expectsMaintenanceHistoryRecord);
	const applicableIds = new Set(
		applicableSystems.map((system) => normalizedId(system.id)).filter(Boolean),
	);
	const linkedIds = new Set<string>();
	const patternIds = new Set(
		applicableSystems
			.filter((system) => hasRecordedPattern(system, maintenanceHistory))
			.map((system) => normalizedId(system.id)),
	);

	maintenanceHistory.forEach((record) => {
		historySystemIds(record).forEach((id) => {
			if (applicableIds.has(id)) linkedIds.add(id);
		});
	});

	const level: MaintleyIntelligenceReadinessLevel =
		maintenanceHistory.length === 0 || linkedIds.size === 0
			? 'starting'
			: applicableSystems.length > 0 && patternIds.size === applicableSystems.length
				? 'ready'
				: 'building_context';
	const summary =
		level === 'starting'
			? 'Record completed work and connect it to equipment so Maintley can use service history in future guidance.'
			: level === 'ready'
				? 'Comparable dated service events support pattern-based guidance for all applicable equipment records.'
				: `${linkedIds.size} of ${applicableSystems.length} applicable equipment records have linked history, and ${patternIds.size} currently support recorded-pattern guidance.`;
	const remainingLinks = Math.max(0, applicableSystems.length - linkedIds.size);
	const remainingPatterns = Math.max(
		0,
		applicableSystems.length - patternIds.size,
	);
	const nextStep =
		level === 'starting'
			? 'Record the most recent maintenance or repair.'
			: remainingLinks > 0
				? `Connect completed work to ${remainingLinks} ${remainingLinks === 1 ? 'equipment record' : 'equipment records'} as service happens.`
				: remainingPatterns > 0
					? 'Keep recording comparable, dated service events to build pattern-based guidance.'
					: 'Keep recording completed work as service happens.';

	return {
		id: 'service_history',
		title: 'Service history',
		level,
		levelLabel: levelLabel('service_history', level),
		summary,
		nextStep,
		evidence: {
			applicableRecords: applicableSystems.length,
			supportedRecords: patternIds.size,
			historyLinkedRecords: linkedIds.size,
			patternRecords: patternIds.size,
		},
	};
};

export const deriveMaintleyIntelligenceReadiness = (
	input: MaintleyIntelligenceReadinessInput,
): MaintleyIntelligenceReadinessResult => {
	const systems = input.systems || [];
	const tasks = input.tasks || [];
	const maintenanceHistory = mergeMaintenanceHistoryWithDeviceSources(
		input.maintenanceHistory || [],
		systems,
	);

	return {
		version: MAINTLEY_INTELLIGENCE_READINESS_VERSION,
		categories: [
			buildEquipmentContext(systems),
			buildMaintenanceCoverage(systems, tasks),
			buildServiceHistory(systems, maintenanceHistory),
		],
	};
};

export const aggregateMaintleyIntelligenceReadiness = (
	properties: PropertyIntelligenceReadinessResult[],
): MaintleyIntelligenceReadinessResult => {
	const categoryIds: MaintleyIntelligenceReadinessCategoryId[] = [
		'equipment_context',
		'maintenance_coverage',
		'service_history',
	];

	const categories = categoryIds.map((categoryId) => {
		const propertyCategories = properties
			.map((property) =>
				property.readiness.categories.find((category) => category.id === categoryId),
			)
			.filter(
				(category): category is MaintleyIntelligenceReadinessCategory =>
					Boolean(category),
			);
		const template = propertyCategories[0];
		const applicableRecords = propertyCategories.reduce(
			(total, category) => total + category.evidence.applicableRecords,
			0,
		);
		const supportedRecords = propertyCategories.reduce(
			(total, category) => total + category.evidence.supportedRecords,
			0,
		);
		const sumEvidence = (
			key:
				| 'scheduledRecords'
				| 'guidedRecords'
				| 'customScheduleRecords'
				| 'historyLinkedRecords'
				| 'patternRecords',
		) =>
			propertyCategories.reduce(
				(total, category) => total + (category.evidence[key] || 0),
				0,
			);
		const level: MaintleyIntelligenceReadinessLevel =
			applicableRecords === 0
				? 'starting'
				: supportedRecords === applicableRecords
					? 'ready'
					: 'building_context';
		const remaining = Math.max(0, applicableRecords - supportedRecords);
		const title =
			template?.title ||
			(categoryId === 'equipment_context'
				? 'Equipment context'
				: categoryId === 'maintenance_coverage'
					? 'Maintenance coverage'
					: 'Service history');
		const recordLabel = applicableRecords === 1 ? 'record' : 'records';
		const summary =
			applicableRecords === 0
				? template?.summary || 'Add property records so Maintley can provide guidance.'
				: `${supportedRecords} of ${applicableRecords} applicable ${recordLabel} support this guidance across ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}.`;
		const nextStep =
			remaining > 0
				? `Improve ${remaining} ${remaining === 1 ? 'record' : 'records'} shown in the property details.`
				: template?.nextStep || 'Keep records current as maintenance happens.';

		return {
			id: categoryId,
			title,
			level,
			levelLabel: levelLabel(categoryId, level),
			summary,
			nextStep,
			evidence: {
				applicableRecords,
				supportedRecords,
				...(categoryId === 'maintenance_coverage'
					? {
							scheduledRecords: sumEvidence('scheduledRecords'),
							guidedRecords: sumEvidence('guidedRecords'),
							customScheduleRecords: sumEvidence('customScheduleRecords'),
						}
					: {}),
				...(categoryId === 'service_history'
					? {
							historyLinkedRecords: sumEvidence('historyLinkedRecords'),
							patternRecords: sumEvidence('patternRecords'),
						}
					: {}),
			},
		};
	});

	return {
		version: MAINTLEY_INTELLIGENCE_READINESS_VERSION,
		categories,
	};
};
