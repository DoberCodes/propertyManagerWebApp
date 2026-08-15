import {
	getEquipmentSpaceIds,
	getEndpointSupplyIds,
	getDocumentEndpointIds,
	getEndpointDocumentIds,
	getSupplyEndpointIds,
	getTaskSpaceIds,
	PropertyKnowledgeLink,
} from './PropertyKnowledgeLink.types';

const makeLink = (
	overrides: Partial<PropertyKnowledgeLink>,
): PropertyKnowledgeLink => ({
	id: 'link-1',
	accountId: 'account-1',
	propertyId: 'property-1',
	fromType: 'task',
	fromId: 'task-1',
	relationshipType: 'occurs_in',
	toType: 'space',
	toId: 'space-1',
	source: 'manual',
	createdAt: '2026-08-01T00:00:00.000Z',
	createdBy: 'user-1',
	updatedAt: '2026-08-01T00:00:00.000Z',
	updatedBy: 'user-1',
	...overrides,
});

describe('Property Knowledge Link selectors', () => {
	it('keeps Task and Equipment Space relationships semantically separate', () => {
		const links = [
			makeLink({}),
			makeLink({
				id: 'link-2',
				fromType: 'equipment',
				fromId: 'equipment-1',
				relationshipType: 'located_in',
				toId: 'space-2',
			}),
			makeLink({ id: 'link-3', fromId: 'task-2', toId: 'space-3' }),
		];

		expect(getTaskSpaceIds(links, 'task-1')).toEqual(['space-1']);
		expect(getEquipmentSpaceIds(links, 'equipment-1')).toEqual(['space-2']);
	});

	it('derives both sides of Supply relationships without duplicate state', () => {
		const links = [
			makeLink({
				id: 'supply-link-1',
				fromType: 'equipment',
				fromId: 'equipment-1',
				relationshipType: 'uses',
				toType: 'supply',
				toId: 'supply-1',
			}),
			makeLink({
				id: 'supply-link-2',
				fromType: 'space',
				fromId: 'space-1',
				relationshipType: 'uses',
				toType: 'supply',
				toId: 'supply-1',
			}),
		];

		expect(getSupplyEndpointIds(links, 'supply-1', 'equipment')).toEqual([
			'equipment-1',
		]);
		expect(getSupplyEndpointIds(links, 'supply-1', 'space')).toEqual([
			'space-1',
		]);
		expect(getEndpointSupplyIds(links, 'equipment', 'equipment-1')).toEqual([
			'supply-1',
		]);
	});

	it('derives both sides of Document relationships from canonical links', () => {
		const links = [
			makeLink({
				id: 'document-link-1',
				fromType: 'document',
				fromId: 'document-1',
				relationshipType: 'documents',
				toType: 'equipment',
				toId: 'equipment-1',
			}),
			makeLink({
				id: 'document-link-2',
				fromType: 'document',
				fromId: 'document-1',
				relationshipType: 'documents',
				toType: 'space',
				toId: 'space-1',
			}),
		];

		expect(getDocumentEndpointIds(links, 'document-1', 'equipment')).toEqual([
			'equipment-1',
		]);
		expect(getEndpointDocumentIds(links, 'space', 'space-1')).toEqual([
			'document-1',
		]);
	});
});
