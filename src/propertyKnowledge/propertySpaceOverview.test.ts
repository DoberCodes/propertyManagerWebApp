import type { PropertyKnowledgeLink } from '../types/PropertyKnowledgeLink.types';
import { buildPropertySpaceOverview } from './propertySpaceOverview';

const link = (
	overrides: Partial<PropertyKnowledgeLink>,
): PropertyKnowledgeLink => ({
	id: 'link',
	accountId: 'account-1',
	propertyId: 'property-1',
	fromType: 'equipment',
	fromId: 'equipment-1',
	relationshipType: 'located_in',
	toType: 'space',
	toId: 'space-1',
	source: 'manual',
	createdAt: '2026-08-01T00:00:00.000Z',
	createdBy: 'user-1',
	updatedAt: '2026-08-01T00:00:00.000Z',
	updatedBy: 'user-1',
	...overrides,
});

const task = (overrides: Record<string, any>) => ({
	id: 'task-1',
	userId: 'user-1',
	propertyId: 'property-1',
	title: 'Task',
	dueDate: '2026-08-25',
	status: 'Pending',
	property: 'property-1',
	...overrides,
});

describe('property Space overview', () => {
	it('collects every canonical record connected to a Space', () => {
		const links = [
			link({}),
			link({
				id: 'task-link',
				fromType: 'task',
				fromId: 'task-1',
				relationshipType: 'occurs_in',
			}),
			link({
				id: 'supply-link',
				fromType: 'space',
				fromId: 'space-1',
				relationshipType: 'uses',
				toType: 'supply',
				toId: 'supply-1',
			}),
			link({
				id: 'document-link',
				fromType: 'document',
				fromId: 'document-1',
				relationshipType: 'documents',
			}),
		];

		const result = buildPropertySpaceOverview({
			spaceId: 'space-1',
			links,
			equipment: [{ id: 'equipment-1' } as any],
			tasks: [task({}) as any],
			supplies: [{ id: 'supply-1' } as any],
			documents: [{ id: 'document-1', links: {} } as any],
			maintenanceHistory: [],
			now: new Date('2026-08-20T12:00:00.000Z'),
		});

		expect(result.equipment.map((item) => item.id)).toEqual(['equipment-1']);
		expect(result.tasks.map((item) => item.id)).toEqual(['task-1']);
		expect(result.supplies.map((item) => item.id)).toEqual(['supply-1']);
		expect(result.documents.map((item) => item.id)).toEqual(['document-1']);
	});

	it('derives overdue and recent maintenance context from connected records', () => {
		const links = [
			link({}),
			link({
				id: 'task-link',
				fromType: 'task',
				fromId: 'task-1',
				relationshipType: 'occurs_in',
			}),
		];
		const result = buildPropertySpaceOverview({
			spaceId: 'space-1',
			links,
			equipment: [{ id: 'equipment-1' } as any],
			tasks: [
				task({ id: 'task-1', title: 'Replace filter', dueDate: '2026-08-01' }) as any,
				task({ id: 'completed', status: 'Completed' }) as any,
			],
			supplies: [],
			documents: [],
			maintenanceHistory: [
				{
					id: 'history-old',
					deviceIds: ['equipment-1'],
					completionDate: '2026-06-01',
				},
				{
					id: 'history-new',
					linkedTaskIds: ['task-1'],
					completionDate: '2026-07-01',
				},
			],
			now: new Date('2026-08-20T12:00:00.000Z'),
		});

		expect(result.overdueTaskCount).toBe(1);
		expect(result.nextTask?.title).toBe('Replace filter');
		expect(result.recentMaintenance.map((record) => record.id)).toEqual([
			'history-new',
			'history-old',
		]);
	});

	it('does not infer records from another Space', () => {
		const result = buildPropertySpaceOverview({
			spaceId: 'space-2',
			links: [link({})],
			equipment: [{ id: 'equipment-1' } as any],
			tasks: [],
			supplies: [],
			documents: [],
			maintenanceHistory: [{ id: 'history-1', deviceIds: ['equipment-1'] }],
		});

		expect(result.equipment).toEqual([]);
		expect(result.recentMaintenance).toEqual([]);
	});
});
