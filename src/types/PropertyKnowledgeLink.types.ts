export type PropertyKnowledgeEndpointType =
	| 'equipment'
	| 'space'
	| 'task'
	| 'document'
	| 'supply'
	| 'maintenance_event';

export type PropertyKnowledgeRelationshipType =
	| 'located_in'
	| 'occurs_in'
	| 'uses'
	| 'documents';

export type PropertyKnowledgeLinkSource =
	| 'manual'
	| 'document_review'
	| 'intelligence_review'
	| 'migration';

export interface PropertyKnowledgeLink {
	id: string;
	accountId: string;
	propertyId: string;
	fromType: PropertyKnowledgeEndpointType;
	fromId: string;
	relationshipType: PropertyKnowledgeRelationshipType;
	toType: PropertyKnowledgeEndpointType;
	toId: string;
	source: PropertyKnowledgeLinkSource;
	createdAt: string;
	createdBy: string;
	updatedAt: string;
	updatedBy: string;
}

export const getEquipmentSpaceIds = (
	links: PropertyKnowledgeLink[],
	equipmentId: string,
): string[] =>
	links
		.filter(
			(link) =>
				link.fromType === 'equipment' &&
				link.fromId === equipmentId &&
				link.relationshipType === 'located_in' &&
				link.toType === 'space',
		)
		.map((link) => link.toId);

export const getTaskSpaceIds = (
	links: PropertyKnowledgeLink[],
	taskId: string,
): string[] =>
	links
		.filter(
			(link) =>
				link.fromType === 'task' &&
				link.fromId === taskId &&
				link.relationshipType === 'occurs_in' &&
				link.toType === 'space',
		)
		.map((link) => link.toId);

export const getSupplyEndpointIds = (
	links: PropertyKnowledgeLink[],
	supplyId: string,
	endpointType: 'equipment' | 'space' | 'task',
): string[] =>
	links
		.filter(
			(link) =>
				link.fromType === endpointType &&
				link.relationshipType === 'uses' &&
				link.toType === 'supply' &&
				link.toId === supplyId,
		)
		.map((link) => link.fromId);

export const getEndpointSupplyIds = (
	links: PropertyKnowledgeLink[],
	endpointType: 'equipment' | 'space' | 'task',
	endpointId: string,
): string[] =>
	links
		.filter(
			(link) =>
				link.fromType === endpointType &&
				link.fromId === endpointId &&
				link.relationshipType === 'uses' &&
				link.toType === 'supply',
		)
		.map((link) => link.toId);

export type DocumentRelationshipEndpointType =
	| 'equipment'
	| 'space'
	| 'task'
	| 'supply';

export const getDocumentEndpointIds = (
	links: PropertyKnowledgeLink[],
	documentId: string,
	endpointType: DocumentRelationshipEndpointType,
): string[] =>
	links
		.filter(
			(link) =>
				link.fromType === 'document' &&
				link.fromId === documentId &&
				link.relationshipType === 'documents' &&
				link.toType === endpointType,
		)
		.map((link) => link.toId);

export const getEndpointDocumentIds = (
	links: PropertyKnowledgeLink[],
	endpointType: DocumentRelationshipEndpointType,
	endpointId: string,
): string[] =>
	links
		.filter(
			(link) =>
				link.fromType === 'document' &&
				link.relationshipType === 'documents' &&
				link.toType === endpointType &&
				link.toId === endpointId,
		)
		.map((link) => link.fromId);
