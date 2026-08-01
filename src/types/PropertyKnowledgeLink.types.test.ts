import {
	getEquipmentSpaceIds,
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
});
