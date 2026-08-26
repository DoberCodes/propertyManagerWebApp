import type { Device } from '../types/Property.types';
import type { PropertyKnowledgeLink } from '../types/PropertyKnowledgeLink.types';
import {
	getAttachedEquipmentIds,
	getEquipmentPrimaryId,
} from '../types/PropertyKnowledgeLink.types';

export const isCombinedEquipment = (equipment?: Partial<Device> | null): boolean =>
	equipment?.recordScope === 'combined';

export const isAttachedEquipment = (
	equipmentId: string,
	links: PropertyKnowledgeLink[],
): boolean => Boolean(getEquipmentPrimaryId(links, equipmentId));

export const getTopLevelEquipment = <T extends Pick<Device, 'id'>>(
	equipment: T[],
	links: PropertyKnowledgeLink[],
): T[] => equipment.filter((item) => !isAttachedEquipment(String(item.id), links));

export const getAttachedEquipment = <T extends Pick<Device, 'id'>>(
	equipment: T[],
	links: PropertyKnowledgeLink[],
	primaryEquipmentId: string,
): T[] => {
	const attachedIds = new Set(
		getAttachedEquipmentIds(links, primaryEquipmentId),
	);
	return equipment.filter((item) => attachedIds.has(String(item.id)));
};

export const getEquipmentContextIds = (
	equipmentId: string,
	links: PropertyKnowledgeLink[],
): string[] => [equipmentId, ...getAttachedEquipmentIds(links, equipmentId)];

export const recordReferencesEquipment = (
	record: {
		deviceId?: unknown;
		deviceIds?: unknown[];
		devices?: unknown[];
	},
	equipmentIds: Iterable<string>,
): boolean => {
	const relevantIds = new Set(Array.from(equipmentIds, (id) => String(id)));
	if (relevantIds.has(String(record.deviceId || ''))) return true;
	return [record.deviceIds, record.devices].some(
		(values) =>
			Array.isArray(values) &&
			values.some((id) => relevantIds.has(String(id))),
	);
};
