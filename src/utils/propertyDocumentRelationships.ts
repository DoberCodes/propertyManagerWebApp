import type {
	DocumentRelationshipEndpointType,
	PropertyKnowledgeLink,
} from '../types/PropertyKnowledgeLink.types';
import { getDocumentEndpointIds } from '../types/PropertyKnowledgeLink.types';
import type { PropertyDocument } from '../types/Property.types';

export type PropertyDocumentConnections = {
	equipmentIds: string[];
	spaceIds: string[];
	taskIds: string[];
	supplyIds: string[];
};

const uniqueIds = (values: unknown[]) =>
	Array.from(
		new Set(
			values
				.flatMap((value) => (Array.isArray(value) ? value : [value]))
				.map((value) => String(value || '').trim())
				.filter(Boolean),
		),
	);

export const getLegacyDocumentEndpointIds = (
	document: PropertyDocument,
	endpointType: DocumentRelationshipEndpointType,
): string[] => {
	if (endpointType === 'equipment') {
		return uniqueIds([
			document.links?.assetIds || [],
			document.assignedDeviceId,
		]);
	}
	if (endpointType === 'space') {
		return uniqueIds([document.links?.spaceIds || []]);
	}
	if (endpointType === 'task') {
		return uniqueIds([
			document.links?.taskIds || [],
			document.assignedTaskId,
		]);
	}
	return uniqueIds([
		document.links?.supplyIds || [],
		document.links?.partIds || [],
	]);
};

export const getPropertyDocumentConnections = (
	document: PropertyDocument,
	links: PropertyKnowledgeLink[] = [],
): PropertyDocumentConnections => ({
	equipmentIds: uniqueIds([
		getDocumentEndpointIds(links, document.id, 'equipment'),
		getLegacyDocumentEndpointIds(document, 'equipment'),
	]),
	spaceIds: uniqueIds([
		getDocumentEndpointIds(links, document.id, 'space'),
		getLegacyDocumentEndpointIds(document, 'space'),
	]),
	taskIds: uniqueIds([
		getDocumentEndpointIds(links, document.id, 'task'),
		getLegacyDocumentEndpointIds(document, 'task'),
	]),
	supplyIds: uniqueIds([
		getDocumentEndpointIds(links, document.id, 'supply'),
		getLegacyDocumentEndpointIds(document, 'supply'),
	]),
});

export const documentIsLinkedToEndpoint = (
	document: PropertyDocument,
	links: PropertyKnowledgeLink[],
	endpointType: DocumentRelationshipEndpointType,
	endpointId: string,
) => {
	const connections = getPropertyDocumentConnections(document, links);
	const ids =
		endpointType === 'equipment'
			? connections.equipmentIds
			: endpointType === 'space'
			? connections.spaceIds
			: endpointType === 'task'
			? connections.taskIds
			: connections.supplyIds;
	return ids.includes(String(endpointId));
};
