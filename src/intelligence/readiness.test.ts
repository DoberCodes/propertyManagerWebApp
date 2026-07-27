import { Device } from '../types/Property.types';
import { Task } from '../types/Task.types';
import { deriveMaintleyIntelligenceReadiness } from './readiness';

const system = (overrides: Partial<Device> = {}): Device =>
	({
		id: 'hvac-1',
		assetType: 'HVAC',
		type: 'HVAC',
		...overrides,
	}) as Device;

const task = (overrides: Partial<Task> = {}): Task =>
	({
		id: 'task-1',
		userId: 'user-1',
		propertyId: 'property-1',
		property: 'property-1',
		title: 'Replace filter',
		dueDate: '2026-08-01',
		status: 'Pending',
		isRecurring: true,
		devices: ['hvac-1'],
		...overrides,
	}) as Task;

describe('Maintley Intelligence readiness', () => {
	it('starts without property context instead of producing a score', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [],
			tasks: [],
			maintenanceHistory: [],
		});

		expect(result.categories.map((category) => category.level)).toEqual([
			'starting',
			'starting',
			'starting',
		]);
		expect(result).not.toHaveProperty('score');
		expect(result).not.toHaveProperty('percentage');
	});

	it('marks recognized equipment context ready without grading record completeness', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [],
			maintenanceHistory: [],
		});

		expect(result.categories[0]).toEqual(
			expect.objectContaining({
				id: 'equipment_context',
				level: 'ready',
				levelLabel: 'Ready',
			}),
		);
	});

	it('builds equipment context when some records have an unknown type', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system(), system({ id: 'unknown-1', assetType: 'Unknown', type: 'Unknown' })],
			tasks: [],
			maintenanceHistory: [],
		});

		expect(result.categories[0]).toEqual(
			expect.objectContaining({
				level: 'building_context',
				evidence: { applicableRecords: 2, supportedRecords: 1 },
			}),
		);
	});

	it('marks maintenance coverage ready when recurring care is linked', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [task()],
			maintenanceHistory: [],
		});

		expect(result.categories[1]).toEqual(
			expect.objectContaining({
				id: 'maintenance_coverage',
				level: 'ready',
			}),
		);
	});

	it('does not count completed recurring tasks as upcoming maintenance coverage', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [task({ status: 'Completed' })],
			maintenanceHistory: [],
		});

		expect(result.categories[1].level).toBe('building_context');
	});

	it('marks linked service history ready', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [],
			maintenanceHistory: [
				{
					id: 'event-1',
					propertyId: 'property-1',
					deviceIds: ['hvac-1'],
					title: 'HVAC serviced',
					serviceDate: '2026-07-01',
				},
			],
		});

		expect(result.categories[2]).toEqual(
			expect.objectContaining({
				id: 'service_history',
				level: 'ready',
			}),
		);
	});
});
