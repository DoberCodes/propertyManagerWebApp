import { Device, Property } from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import { runDashboardIntelligence } from './portfolioDashboard';

const makeProperty = (id: string, title: string): Property => ({
	id,
	userId: 'user-1',
	title,
	slug: title.toLowerCase().replace(/\s+/g, '-'),
});

const makeSystem = (
	id: string,
	propertyId: string,
	overrides: Partial<Device> = {},
): Device => ({
	id,
	userId: 'user-1',
	type: 'HVAC',
	assetType: 'HVAC',
	brand: 'Maintley',
	model: `Model ${id}`,
	installationDate: '2020-01-01',
	location: { propertyId },
	status: 'Active',
	...overrides,
});

const makeTask = (
	id: string,
	propertyId: string,
	overrides: Partial<Task> = {},
): Task => ({
	id,
	userId: 'user-1',
	propertyId,
	property: propertyId,
	title: `Task ${id}`,
	dueDate: '2026-06-01',
	status: 'Initiated',
	priority: 'Medium',
	...overrides,
});

describe('Dashboard Intelligence consumer', () => {
	it('prioritizes overdue work across visible properties', () => {
		const firstProperty = makeProperty('property-1', 'Main Home');
		const secondProperty = makeProperty('property-2', 'Lake House');

		const result = runDashboardIntelligence({
			properties: [firstProperty, secondProperty],
			systems: [],
			tasks: [
				makeTask('task-1', firstProperty.id, {
					title: 'Replace HVAC Filter',
				}),
				makeTask('task-2', secondProperty.id, {
					title: 'Flush Water Heater',
				}),
			],
			maintenanceHistory: [],
			planId: 'homeowner',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.ruleId).toBe('overdue-tasks-exist');
		expect(result.primarySuggestion?.title).toBe(
			'Review overdue task: Flush Water Heater',
		);
		expect(result.primarySuggestion?.contextLabel).toBe('Lake House');
		expect(result.primarySuggestion?.affectedPropertyIds).toEqual([secondProperty.id]);
		expect(result.primarySuggestion?.relatedTaskIds).toEqual(['task-2']);
	});

	it('returns one specific finding instead of aggregating repeated findings', () => {
		const firstProperty = makeProperty('property-1', 'Main Home');
		const secondProperty = makeProperty('property-2', 'Lake House');

		const result = runDashboardIntelligence({
			properties: [firstProperty, secondProperty],
			systems: [
				makeSystem('system-1', firstProperty.id),
				makeSystem('system-2', secondProperty.id),
			],
			tasks: [],
			maintenanceHistory: [],
			planId: 'homeowner',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.ruleId).toBe(
			'systems-missing-maintenance-history',
		);
		expect(result.primarySuggestion?.title).toBe(
			'Record first maintenance note for Maintley HVAC Model system-1',
		);
		expect(result.primarySuggestion?.contextLabel).toBe('Main Home');
		expect(result.primarySuggestion?.affectedPropertyIds).toEqual([firstProperty.id]);
		expect(result.primarySuggestion?.affectedSystemIds).toEqual(['system-1']);
	});

	it('respects plan filtering for knowledge-pack guidance', () => {
		const property = makeProperty('property-1', 'Main Home');
		const hvac = makeSystem('hvac-1', property.id, {
			filterSize: '',
		});
		const recurringTask = makeTask('task-1', property.id, {
			title: 'Replace HVAC Filter',
			dueDate: '2026-08-01',
			isRecurring: true,
			devices: [hvac.id],
		});
		const maintenanceHistory = [{ id: 'history-1', deviceId: hvac.id }];

		const homeownerResult = runDashboardIntelligence({
			properties: [property],
			systems: [hvac],
			tasks: [recurringTask],
			maintenanceHistory,
			planId: 'homeowner',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});
		const homeownerPlusResult = runDashboardIntelligence({
			properties: [property],
			systems: [hvac],
			tasks: [recurringTask],
			maintenanceHistory,
			planId: 'homeowner_plus',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});

		expect(homeownerResult.primarySuggestion).toBeNull();
		expect(homeownerPlusResult.primarySuggestion?.ruleId).toBe(
			'knowledge-pack-record-details-missing',
		);
		expect(homeownerPlusResult.primarySuggestion?.title).toBe(
			'Add filter size for Maintley HVAC Model hvac-1',
		);
		expect(homeownerPlusResult.primarySuggestion?.contextLabel).toBe(
			'Main Home',
		);
	});

	it('keeps property context even when only one property is evaluated', () => {
		const property = makeProperty('property-1', 'Maple Duplex');

		const result = runDashboardIntelligence({
			properties: [property],
			systems: [
				makeSystem('co-detector-1', property.id, {
					type: 'Safety Device',
					assetType: 'Safety Device',
					brand: '',
					model: '',
					assetVariant: 'Carbon Monoxide Detector',
				} as Partial<Device>),
			],
			tasks: [],
			maintenanceHistory: [],
			planId: 'homeowner_plus',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.title).toBe(
			'Add a recurring reminder for Carbon Monoxide Detector',
		);
		expect(result.primarySuggestion?.contextLabel).toBe('Maple Duplex');
		expect(result.primarySuggestion?.propertyTitle).toBe('Maple Duplex');
		expect(result.primarySuggestion?.suggestedTask).toEqual({
			title: 'Test Carbon Monoxide Detector',
			propertyId: property.id,
			devices: ['co-detector-1'],
			status: 'Initiated',
			priority: 'High',
			category: 'Safety',
			notes:
				'Recording checks or battery changes keeps safety-device maintenance visible in the property timeline.',
			isRecurring: true,
			recurrenceFrequency: 'monthly',
		});
	});

	it('advances to the next recurring reminder suggestion after the first system is covered', () => {
		const property = makeProperty('property-1', 'Maple Duplex');
		const firstDetector = makeSystem('co-detector-1', property.id, {
			type: 'Safety Device',
			assetType: 'Safety Device',
			brand: '',
			model: '',
			assetVariant: 'Carbon Monoxide Detector',
		} as Partial<Device>);
		const secondDetector = makeSystem('co-detector-2', property.id, {
			type: 'Safety Device',
			assetType: 'Safety Device',
			brand: '',
			model: '',
			assetVariant: 'Smoke Detector',
		} as Partial<Device>);

		const result = runDashboardIntelligence({
			properties: [property],
			systems: [firstDetector, secondDetector],
			tasks: [
				makeTask('task-1', property.id, {
					title: 'Test Carbon Monoxide Detector',
					isRecurring: true,
					devices: [firstDetector.id],
				}),
			],
			maintenanceHistory: [],
			planId: 'homeowner_plus',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.title).toBe(
			'Add a recurring reminder for Smoke Detector',
		);
		expect(result.primarySuggestion?.affectedSystemIds).toEqual([
			secondDetector.id,
		]);
	});

	it('treats legacy recurring task deviceId links as covered systems', () => {
		const property = makeProperty('property-1', 'Maple Duplex');
		const detector = makeSystem('co-detector-1', property.id, {
			type: 'Safety Device',
			assetType: 'Safety Device',
			brand: '',
			model: '',
			assetVariant: 'Carbon Monoxide Detector',
		} as Partial<Device>);

		const result = runDashboardIntelligence({
			properties: [property],
			systems: [detector],
			tasks: [
				makeTask('task-1', property.id, {
					title: 'Test Carbon Monoxide Detector',
					isRecurring: true,
					deviceId: detector.id,
				} as Partial<Task>),
			],
			maintenanceHistory: [],
			planId: 'homeowner_plus',
			currentDate: '2026-06-30T12:00:00.000Z',
			createdAt: '2026-06-30T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.ruleId).not.toBe(
			'systems-missing-actionable-maintenance-coverage',
		);
		expect(result.primarySuggestion?.affectedSystemIds || []).not.toContain(
			detector.id,
		);
	});
});
