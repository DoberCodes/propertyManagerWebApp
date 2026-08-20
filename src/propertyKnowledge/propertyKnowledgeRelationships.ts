import type { Device } from '../types/Property.types';
import type { PropertyKnowledgeEquipmentSuggestion } from '../types/PropertyKnowledge.types';
import { normalizeAssetType, normalizeAssetVariant } from '../utils/systemTypes';

export type PropertyKnowledgeRelationshipSelection = {
	matchedDeviceIds: string[];
	pendingEquipmentSuggestionIds: string[];
};

type ResolvePropertyKnowledgeRelationshipsInput = {
	relatedEquipmentSuggestionIds?: string[];
	relatedAssetTypes: string[];
	relatedAssetVariant?: string;
	matchedDeviceIds?: string[];
	equipmentSuggestions: PropertyKnowledgeEquipmentSuggestion[];
	equipmentValues: Record<
		string,
		{ accepted?: boolean; matchedDeviceId?: string }
	>;
	propertyDevices: Device[];
};

const matchesTypeAndVariant = ({
	assetType,
	assetVariant,
	relatedAssetTypes,
	relatedAssetVariant,
}: {
	assetType?: string;
	assetVariant?: string;
	relatedAssetTypes: string[];
	relatedAssetVariant?: string;
}) =>
	relatedAssetTypes.some((relatedAssetType) =>
		normalizeAssetType(assetType) === normalizeAssetType(relatedAssetType) &&
		(!relatedAssetVariant ||
			normalizeAssetVariant(relatedAssetType, assetVariant) ===
				normalizeAssetVariant(relatedAssetType, relatedAssetVariant)),
	);

export const resolvePropertyKnowledgeRelationships = ({
	relatedEquipmentSuggestionIds,
	relatedAssetTypes,
	relatedAssetVariant,
	matchedDeviceIds = [],
	equipmentSuggestions,
	equipmentValues,
	propertyDevices,
}: ResolvePropertyKnowledgeRelationshipsInput): PropertyKnowledgeRelationshipSelection => {
	const compatibleSuggestionIds = relatedEquipmentSuggestionIds?.length
		? relatedEquipmentSuggestionIds
		: equipmentSuggestions
				.filter((equipment) =>
					matchesTypeAndVariant({
						assetType: equipment.assetType,
						assetVariant: equipment.assetVariant,
						relatedAssetTypes,
						relatedAssetVariant,
					}),
				)
				.map((equipment) => equipment.id);
	const acceptedSuggestionIds = compatibleSuggestionIds.filter(
		(id) => equipmentValues[id]?.accepted !== false,
	);
	const resolvedDeviceIds = acceptedSuggestionIds
		.map((id) => equipmentValues[id]?.matchedDeviceId)
		.filter((id): id is string => Boolean(id));
	const fallbackDeviceIds = compatibleSuggestionIds.length === 0
		? propertyDevices
				.filter((device) =>
					matchesTypeAndVariant({
						assetType: device.assetType || device.type,
						assetVariant: device.assetVariant,
						relatedAssetTypes,
						relatedAssetVariant,
					}),
				)
				.map((device) => String(device.id))
		: [];

	return {
		matchedDeviceIds: Array.from(new Set([
			...matchedDeviceIds.map(String),
			...resolvedDeviceIds.map(String),
			...fallbackDeviceIds,
		])),
		pendingEquipmentSuggestionIds: acceptedSuggestionIds.filter(
			(id) => !equipmentValues[id]?.matchedDeviceId,
		),
	};
};
