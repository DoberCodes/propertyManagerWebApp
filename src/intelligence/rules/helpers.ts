import { Device } from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import {
	getDeviceAssetClassificationText,
	getDeviceAssetVariant,
	getDeviceAssetType,
} from '../../utils/systemTypes';
import {
	MaintleyFinding,
	MaintleyCapability,
	MaintleyFindingSource,
	MaintleyIntelligenceContext,
	MaintleyRequiredPlan,
} from '../types';
import { getRequiredPlanForFindingSource } from '../planFilter';

export const normalizeText = (value: unknown): string =>
	String(value || '')
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

export const isBlank = (value: unknown): boolean =>
	value === undefined ||
	value === null ||
	String(value).trim().length === 0;

export const getAssetDisplayName = (asset: Device): string =>
	[
		asset.brand,
		getDeviceAssetVariant(asset) || getDeviceAssetType(asset),
		asset.model,
	]
		.filter(Boolean)
		.join(' ')
		.trim() ||
	getDeviceAssetType(asset) ||
	'this asset';

export const isTaskOpen = (task: Task): boolean =>
	!['Completed', 'Rejected'].includes(task.status);

export const getTaskDate = (task: Task): Date | null => {
	if (!task.dueDate) return null;
	const parsed = new Date(task.dueDate);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const hasLinkedRecurringTask = (
	system: Device,
	tasks: Task[],
): boolean =>
	tasks.some(
		(task) => {
			if (!isTaskOpen(task) || task.isRecurring !== true) {
				return false;
			}

			const linkedSystemIds = new Set<string>();
			if (Array.isArray(task.devices)) {
				task.devices.forEach((deviceId) => {
					if (deviceId !== undefined && deviceId !== null) {
						linkedSystemIds.add(String(deviceId));
					}
				});
			}

			const legacyDeviceId = (task as Task & { deviceId?: string | number })
				.deviceId;
			if (legacyDeviceId !== undefined && legacyDeviceId !== null) {
				linkedSystemIds.add(String(legacyDeviceId));
			}

			return linkedSystemIds.has(String(system.id));
		},
	);

const historyMatchesSystem = (history: any, systemId: string): boolean => {
	const deviceId = String(history?.deviceId || history?.systemId || '');
	const deviceIds = Array.isArray(history?.deviceIds)
		? history.deviceIds.map(String)
		: [];
	const taskDeviceIds = Array.isArray(history?.devices)
		? history.devices.map(String)
		: [];

	return (
		deviceId === systemId ||
		deviceIds.includes(systemId) ||
		taskDeviceIds.includes(systemId)
	);
};

export const hasMaintenanceHistory = (
	system: Device,
	maintenanceHistory: any[],
): boolean => {
	if (Array.isArray(system.maintenanceHistory) && system.maintenanceHistory.length > 0) {
		return true;
	}

	return maintenanceHistory.some((record) => historyMatchesSystem(record, system.id));
};

export const isSafetyTrackingSystem = (system: Device): boolean => {
	if (getDeviceAssetType(system) === 'Safety Device') return true;
	const systemText = normalizeText(getDeviceAssetClassificationText(system));
	return (
		systemText.includes('smoke') ||
		systemText.includes('carbon monoxide') ||
		systemText.includes(' co detector') ||
		systemText === 'co detector' ||
		systemText.includes('fire alarm')
	);
};

export const makeFinding = (
	context: MaintleyIntelligenceContext,
	finding: Omit<
		MaintleyFinding,
		| 'propertyId'
		| 'createdAt'
		| 'affectedAssetIds'
		| 'affectedSystemIds'
		| 'requiredPlan'
		| 'requiredCapabilities'
		| 'baselineVersion'
		| 'source'
	> & {
		affectedAssetIds?: string[];
		affectedSystemIds?: string[];
		source?: MaintleyFindingSource;
		requiredPlan?: MaintleyRequiredPlan;
		requiredCapabilities?: MaintleyCapability[];
		baselineVersion?: string;
	},
): MaintleyFinding => {
	const source = finding.source || 'property_memory';

	return {
		...finding,
		source,
		propertyId: context.property.id,
		affectedAssetIds: finding.affectedAssetIds || finding.affectedSystemIds || [],
		affectedSystemIds: finding.affectedSystemIds || finding.affectedAssetIds || [],
		requiredPlan:
			finding.requiredPlan || getRequiredPlanForFindingSource(source),
		requiredCapabilities: finding.requiredCapabilities || [],
		baselineVersion: finding.baselineVersion || context.baselineVersion,
		createdAt: context.createdAt,
	};
};

export const getMaintenanceHistoryDate = (history: any): Date | null => {
	const dateValue =
		history?.date ||
		history?.completedAt ||
		history?.completionDate ||
		history?.createdAt ||
		history?.updatedAt;
	if (!dateValue) return null;
	const parsed = new Date(dateValue);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getMaintenanceHistoryText = (history: any): string =>
	normalizeText(
		[
			history?.title,
			history?.description,
			history?.notes,
			history?.completionNotes,
			history?.type,
			history?.category,
		]
			.filter(Boolean)
			.join(' '),
	);
