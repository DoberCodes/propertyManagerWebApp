import type { PropertyKnowledgeLink } from '../types/PropertyKnowledgeLink.types';
import { buildEquipmentSupplyLinkUpdates } from './equipmentSupplyConnections';

const link = (
	fromType: 'equipment' | 'space' | 'task',
	fromId: string,
	supplyId: string,
): PropertyKnowledgeLink => ({
	id: `${fromType}-${fromId}-${supplyId}`,
	accountId: 'account-1',
	propertyId: 'property-1',
	fromType,
	fromId,
	relationshipType: 'uses',
	toType: 'supply',
	toId: supplyId,
	source: 'manual',
	createdAt: '2026-08-03T00:00:00.000Z',
	createdBy: 'user-1',
	updatedAt: '2026-08-03T00:00:00.000Z',
	updatedBy: 'user-1',
});

describe('Equipment Supply connection review', () => {
	it('adds the reviewed equipment without replacing other Supply endpoints', () => {
		const updates = buildEquipmentSupplyLinkUpdates({
			links: [
				link('equipment', 'equipment-2', 'supply-1'),
				link('space', 'space-1', 'supply-1'),
				link('task', 'task-1', 'supply-1'),
			],
			equipmentId: 'equipment-1',
			originalSupplyIds: [],
			desiredSupplyIds: ['supply-1'],
		});

		expect(updates[0]).toEqual({
			supplyId: 'supply-1',
			equipmentIds: ['equipment-2', 'equipment-1'],
			spaceIds: ['space-1'],
			taskIds: ['task-1'],
		});
	});

	it('removes only this equipment when a connection is unchecked', () => {
		const updates = buildEquipmentSupplyLinkUpdates({
			links: [
				link('equipment', 'equipment-1', 'supply-1'),
				link('equipment', 'equipment-2', 'supply-1'),
			],
			equipmentId: 'equipment-1',
			originalSupplyIds: ['supply-1'],
			desiredSupplyIds: [],
		});

		expect(updates[0].equipmentIds).toEqual(['equipment-2']);
	});
});
