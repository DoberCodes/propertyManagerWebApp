import { Device } from '../types/Property.types';
import { Task } from '../types/Task.types';
import {
	aggregateMaintleyIntelligenceReadiness,
	deriveMaintleyIntelligenceReadiness,
} from './readiness';

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
		recurrenceFrequency: 'monthly',
		recurrenceInterval: 3,
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

	it('labels recognized equipment context as recorded without grading completeness', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [],
			maintenanceHistory: [],
		});

		expect(result.categories[0]).toEqual(
				expect.objectContaining({
					id: 'equipment_context',
					level: 'ready',
					levelLabel: 'Recorded',
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
					levelLabel: 'Scheduled',
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

	it('does not count a recurring task without a usable schedule as coverage', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [task({ recurrenceFrequency: undefined })],
			maintenanceHistory: [],
		});

		expect(result.categories[1]).toEqual(
			expect.objectContaining({
				level: 'building_context',
				evidence: expect.objectContaining({ scheduledRecords: 0 }),
			}),
		);
	});

	it('separates Maintley-guided and custom recurring schedules', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system(), system({ id: 'hvac-2' })],
			tasks: [
				task(),
				task({ id: 'task-2', title: 'Custom seasonal check', devices: ['hvac-2'] }),
			],
			maintenanceHistory: [],
		});

		expect(result.categories[1].evidence).toEqual(
			expect.objectContaining({
				scheduledRecords: 2,
				guidedRecords: 1,
				customScheduleRecords: 1,
			}),
		);
	});

	it('keeps one linked service event in building history', () => {
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
					level: 'building_context',
					levelLabel: 'Building history',
					evidence: expect.objectContaining({
						historyLinkedRecords: 1,
						patternRecords: 0,
					}),
			}),
		);
	});

	it('requires three comparable dated events before exposing a recorded pattern', () => {
		const result = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [],
			maintenanceHistory: ['2026-01-01', '2026-04-01', '2026-07-01'].map(
				(serviceDate, index) => ({
					id: `event-${index}`,
					propertyId: 'property-1',
					deviceIds: ['hvac-1'],
					title: 'Replace HVAC filter',
					serviceDate,
				}),
			),
		});

		expect(result.categories[2].evidence.patternRecords).toBe(1);
		expect(result.categories[2]).toEqual(
			expect.objectContaining({
				level: 'ready',
				levelLabel: 'Informed',
			}),
		);
	});

	it('aggregates independently derived property readiness without creating a score', () => {
		const ready = deriveMaintleyIntelligenceReadiness({
			systems: [system()],
			tasks: [task()],
			maintenanceHistory: [],
		});
		const building = deriveMaintleyIntelligenceReadiness({
			systems: [system({ id: 'hvac-2' })],
			tasks: [],
			maintenanceHistory: [],
		});
		const aggregate = aggregateMaintleyIntelligenceReadiness([
			{ propertyId: 'one', propertyTitle: 'Primary Home', propertySlug: 'one', readiness: ready },
			{ propertyId: 'two', propertyTitle: 'Lake House', propertySlug: 'two', readiness: building },
		]);

		expect(aggregate.categories[1]).toEqual(
			expect.objectContaining({
				level: 'building_context',
				evidence: expect.objectContaining({ applicableRecords: 2, supportedRecords: 1 }),
			}),
		);
		expect(aggregate).not.toHaveProperty('score');
	});
});
