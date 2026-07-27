import { Device } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { mergeMaintenanceHistoryWithDeviceSources } from '../maintenanceHistory/maintenanceHistoryAdapter';
import {
	expectsMaintenanceHistoryRecord,
	expectsRecurringCareRecord,
} from './assetRecordExpectations';
import { getDeviceAssetType, UNKNOWN_ASSET_TYPE } from '../utils/systemTypes';

export const MAINTLEY_INTELLIGENCE_READINESS_VERSION = 'maintley-readiness-v1';

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
	levelLabel: 'Starting' | 'Building context' | 'Ready';
	summary: string;
	nextStep: string;
	evidence: {
		applicableRecords: number;
		supportedRecords: number;
	};
}

export interface MaintleyIntelligenceReadinessResult {
	version: typeof MAINTLEY_INTELLIGENCE_READINESS_VERSION;
	categories: MaintleyIntelligenceReadinessCategory[];
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
	level: MaintleyIntelligenceReadinessLevel,
): MaintleyIntelligenceReadinessCategory['levelLabel'] => {
	if (level === 'ready') return 'Ready';
	if (level === 'building_context') return 'Building context';
	return 'Starting';
};

const normalizedId = (value: unknown): string => String(value || '').trim();

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
		levelLabel: levelLabel(level),
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

	tasks.forEach((task) => {
		if (
			task.isRecurring !== true ||
			!ACTIVE_RECURRING_TASK_STATUSES.has(task.status)
		) {
			return;
		}
		linkedTaskSystemIds(task).forEach((id) => {
			if (applicableIds.has(id)) coveredIds.add(id);
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
		levelLabel: levelLabel(level),
		summary,
		nextStep,
		evidence: {
			applicableRecords: applicableSystems.length,
			supportedRecords: coveredIds.size,
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

	maintenanceHistory.forEach((record) => {
		historySystemIds(record).forEach((id) => {
			if (applicableIds.has(id)) linkedIds.add(id);
		});
	});

	const level: MaintleyIntelligenceReadinessLevel =
		maintenanceHistory.length === 0
			? 'starting'
			: applicableSystems.length === 0 || linkedIds.size === applicableSystems.length
				? 'ready'
				: 'building_context';
	const summary =
		level === 'starting'
			? 'Record completed work so Maintley can use service history in future guidance.'
			: level === 'ready'
				? applicableSystems.length === 0
					? 'Maintley can use the saved property service history as context for future guidance.'
					: 'Maintley can use linked service history as context for all tracked equipment that needs it.'
				: linkedIds.size === 0
					? 'Maintley can show the property history, but linking completed work to equipment will provide more specific context.'
					: `Maintley can use linked service history for ${linkedIds.size} of ${applicableSystems.length} tracked equipment records.`;
	const remaining = Math.max(0, applicableSystems.length - linkedIds.size);
	const nextStep =
		level === 'starting'
			? 'Record the most recent maintenance or repair.'
			: remaining > 0
				? `Connect completed work to ${remaining} ${remaining === 1 ? 'equipment record' : 'equipment records'} as service happens.`
				: 'Keep recording completed work as service happens.';

	return {
		id: 'service_history',
		title: 'Service history',
		level,
		levelLabel: levelLabel(level),
		summary,
		nextStep,
		evidence: {
			applicableRecords:
				applicableSystems.length || maintenanceHistory.length,
			supportedRecords:
				applicableSystems.length > 0 ? linkedIds.size : maintenanceHistory.length,
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
