import type { PropertyKnowledgeLink } from '../types/PropertyKnowledgeLink.types';
import type { PropertyDocument } from '../types/Property.types';
import {
	documentIsLinkedToEndpoint,
	getPropertyDocumentConnections,
} from './propertyDocumentRelationships';

const document: PropertyDocument = {
	id: 'document-1',
	name: 'Service report',
	url: 'https://example.com/report.pdf',
	size: 1200,
	type: 'application/pdf',
	category: 'other',
	uploadedAt: '2026-08-02T00:00:00.000Z',
	assignedDeviceId: 'equipment-legacy',
	links: {
		taskIds: ['task-legacy'],
		spaceIds: ['space-legacy'],
		partIds: ['supply-legacy'],
	},
};

const makeLink = (
	overrides: Partial<PropertyKnowledgeLink>,
): PropertyKnowledgeLink => ({
	id: 'link-1',
	accountId: 'account-1',
	propertyId: 'property-1',
	fromType: 'document',
	fromId: 'document-1',
	relationshipType: 'documents',
	toType: 'equipment',
	toId: 'equipment-canonical',
	source: 'migration',
	createdAt: '2026-08-02T00:00:00.000Z',
	createdBy: 'migration',
	updatedAt: '2026-08-02T00:00:00.000Z',
	updatedBy: 'migration',
	...overrides,
});

describe('property document relationship compatibility', () => {
	it('merges canonical relationships with legacy document fields', () => {
		const connections = getPropertyDocumentConnections(document, [
			makeLink({}),
			makeLink({ id: 'link-2', toType: 'space', toId: 'space-canonical' }),
		]);

		expect(connections).toEqual({
			equipmentIds: ['equipment-canonical', 'equipment-legacy'],
			spaceIds: ['space-canonical', 'space-legacy'],
			taskIds: ['task-legacy'],
			supplyIds: ['supply-legacy'],
		});
	});

	it('finds inverse endpoint views without duplicated ownership', () => {
		expect(
			documentIsLinkedToEndpoint(
				document,
				[makeLink({})],
				'equipment',
				'equipment-canonical',
			),
		).toBe(true);
		expect(
			documentIsLinkedToEndpoint(document, [], 'task', 'task-legacy'),
		).toBe(true);
	});
});
