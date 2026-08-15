import type { PropertyKnowledgeLink } from '../types/PropertyKnowledgeLink.types';
import { getSupplyEndpointIds } from '../types/PropertyKnowledgeLink.types';

export type EquipmentSupplyLinkUpdate = {
	supplyId: string;
	equipmentIds: string[];
	spaceIds: string[];
	taskIds: string[];
};

export const buildEquipmentSupplyLinkUpdates = ({
	links,
	equipmentId,
	originalSupplyIds,
	desiredSupplyIds,
}: {
	links: PropertyKnowledgeLink[];
	equipmentId: string;
	originalSupplyIds: string[];
	desiredSupplyIds: string[];
}): EquipmentSupplyLinkUpdate[] => {
	const desired = new Set(desiredSupplyIds);
	const reviewedSupplyIds = Array.from(
		new Set([...originalSupplyIds, ...desiredSupplyIds]),
	);

	return reviewedSupplyIds.map((supplyId) => {
		const currentEquipmentIds = getSupplyEndpointIds(
			links,
			supplyId,
			'equipment',
		);
		return {
			supplyId,
			equipmentIds: desired.has(supplyId)
				? Array.from(new Set([...currentEquipmentIds, equipmentId]))
				: currentEquipmentIds.filter((id) => id !== equipmentId),
			spaceIds: getSupplyEndpointIds(links, supplyId, 'space'),
			taskIds: getSupplyEndpointIds(links, supplyId, 'task'),
		};
	});
};
