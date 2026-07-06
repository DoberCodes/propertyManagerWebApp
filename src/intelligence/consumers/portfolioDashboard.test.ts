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
	it('does not repeat overdue work in the Maintley Intelligence spotlight', () => {
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

		expect(result.primarySuggestion).toBeNull();
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
			currentDate: '2026-01-15T12:00:00.000Z',
			createdAt: '2026-01-15T12:00:00.000Z',
		});
		const homeownerPlusResult = runDashboardIntelligence({
			properties: [property],
			systems: [hvac],
			tasks: [recurringTask],
			maintenanceHistory,
			planId: 'homeowner_plus',
			currentDate: '2026-01-15T12:00:00.000Z',
			createdAt: '2026-01-15T12:00:00.000Z',
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

	it('uses paid dashboard hierarchy: history trends before seasonal context before Maintley Knowledge', () => {
		const property = makeProperty('property-1', 'Main Home');
		const hvac = makeSystem('hvac-1', property.id, {
			filterSize: '',
		});
		const recurringTask = makeTask('task-1', property.id, {
			title: 'General HVAC Care',
			dueDate: '2026-12-01',
			isRecurring: true,
			devices: [hvac.id],
		});
		const maintenanceHistory = [
			{
				id: 'history-filter',
				deviceId: hvac.id,
				title: 'Replace HVAC filter',
				date: '2026-01-01T12:00:00.000Z',
			},
		];

		const result = runDashboardIntelligence({
			properties: [property],
			systems: [hvac],
			tasks: [recurringTask],
			maintenanceHistory,
			planId: 'homeowner_plus',
			currentDate: '2026-10-01T12:00:00.000Z',
			createdAt: '2026-10-01T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.source).toBe('history_inference');
		expect(result.primarySuggestion?.ruleId).toBe(
			'baseline-maintenance-cadence-overdue',
		);
	});

	it('uses seasonal context before Maintley Knowledge when no history trend is available', () => {
		const property = makeProperty('property-1', 'Main Home');
		const hvac = makeSystem('hvac-1', property.id, {
			filterSize: '',
		});
		const recurringTask = makeTask('task-1', property.id, {
			title: 'General HVAC Care',
			dueDate: '2026-12-01',
			isRecurring: true,
			devices: [hvac.id],
		});

		const result = runDashboardIntelligence({
			properties: [property],
			systems: [hvac],
			tasks: [recurringTask],
			maintenanceHistory: [],
			planId: 'homeowner_plus',
			currentDate: '2026-07-01T12:00:00.000Z',
			createdAt: '2026-07-01T12:00:00.000Z',
		});

		expect(result.primarySuggestion?.source).toBe('context');
		expect(result.primarySuggestion?.ruleId).toBe('seasonal-context-guidance');
	});

	it('uses seasonal context instead of recurring reminder setup on paid dashboard', () => {
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

		expect(result.primarySuggestion?.ruleId).toBe('seasonal-context-guidance');
		expect(result.primarySuggestion?.source).toBe('context');
		expect(result.primarySuggestion?.title).toBe(
			'Inspect roof and clear gutters before summer storms',
		);
		expect(result.primarySuggestion?.whyItMatters).toBe(
			'Summer storms can turn small roof or gutter issues into leaks, overflow, siding damage, or foundation problems. This gives the home record a clear seasonal exterior check.',
		);
		expect(result.primarySuggestion?.suggestedActionLabel).toBe(
			'Create seasonal task',
		);
		expect(result.primarySuggestion?.contextLabel).toBe('Maple Duplex');
		expect(result.primarySuggestion?.propertyTitle).toBe('Maple Duplex');
		expect(result.primarySuggestion?.suggestedTask).toEqual(
			expect.objectContaining({
				title: 'Inspect roof and clear gutters before summer storms',
				propertyId: property.id,
				dueDate: '2026-07-14',
				status: 'Initiated',
				priority: 'High',
				category: 'Exterior',
				isRecurring: false,
			}),
		);
	});

	it('does not surface recurring reminder setup when another paid spotlight finding is available', () => {
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

		expect(result.primarySuggestion?.ruleId).toBe('seasonal-context-guidance');
		expect(result.primarySuggestion?.title).not.toMatch(/recurring reminder/i);
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
	});
});
