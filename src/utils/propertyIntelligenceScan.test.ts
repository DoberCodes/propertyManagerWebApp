import { Device, Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import {
	getQuickPropertyScanRecommendations,
	runPropertyScanV1,
} from './propertyIntelligenceScan';

const baseProperty: Property = {
	id: 'property-1',
	userId: 'user-1',
	title: 'Test Home',
	slug: 'test-home',
	address: '123 Test St',
	propertyType: 'Single Family',
	bedrooms: 3,
	bathrooms: 2,
};

const makeSystem = (overrides: Partial<Device> = {}): Device => ({
	id: overrides.id || 'system-1',
	userId: 'user-1',
	type: 'HVAC',
	brand: 'Maintley',
	model: 'Model A',
	serialNumber: 'SN-1',
	installationDate: '2020-01-01',
	location: {
		propertyId: baseProperty.id,
	},
	status: 'Active',
	...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
	id: overrides.id || 'task-1',
	userId: 'user-1',
	propertyId: baseProperty.id,
	title: 'Replace filter',
	dueDate: '2099-01-01',
	status: 'Pending',
	property: baseProperty.title,
	...overrides,
});

describe('propertyIntelligenceScan Quick Property Scan', () => {
	it('limits visible Quick Scan recommendations to five', () => {
		const systems = Array.from({ length: 8 }, (_, index) =>
			makeSystem({
				id: `system-${index}`,
				brand: '',
				model: '',
				serialNumber: '',
				installationDate: '',
				type: index === 0 ? 'Smoke Detector' : `Appliance ${index}`,
			}),
		);
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems,
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner_plus' },
		);

		expect(quickRecommendations).toHaveLength(5);
	});

	it('aggregates repeated system findings into theme recommendations', () => {
		const systems = ['hvac', 'water-heater', 'dishwasher'].map((id) =>
			makeSystem({ id, type: id }),
		);
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems,
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner' },
		);
		const maintenanceSummary = quickRecommendations.find(
			(recommendation) =>
				recommendation.ruleId === 'systems-missing-maintenance-history',
		);

		expect(maintenanceSummary?.title).toBe(
			'Maintenance tracking has not been started for many systems.',
		);
		expect(maintenanceSummary?.relatedSystemIds).toHaveLength(3);
		expect(
			quickRecommendations.some((recommendation) =>
				recommendation.title.startsWith('Record first maintenance note'),
			),
		).toBe(false);
	});

	it('keeps low-severity serial number gaps out of Quick Scan', () => {
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems: [makeSystem({ serialNumber: '' })],
			tasks: [],
			maintenanceHistory: [{ id: 'history-1', deviceId: 'system-1' }],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner_plus' },
		);

		expect(
			quickRecommendations.some((recommendation) =>
				recommendation.title.toLowerCase().includes('serial number'),
			),
		).toBe(false);
	});

	it('hides locked recurring-maintenance deficiencies on the free plan and shows one premium opportunity', () => {
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems: [
				makeSystem({ id: 'hvac', type: 'HVAC' }),
				makeSystem({ id: 'water-heater', type: 'Water Heater' }),
			],
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner', includePremiumOpportunity: true },
		);

		expect(
			quickRecommendations.some(
				(recommendation) =>
					recommendation.title ===
					'Recurring maintenance is missing for several systems.',
			),
		).toBe(false);
		expect(
			quickRecommendations.filter(
				(recommendation) =>
					recommendation.recommendationType === 'premium_opportunity',
			),
		).toHaveLength(1);
	});

	it('shows recurring maintenance as an actionable Homeowner+ recommendation', () => {
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems: [
				makeSystem({ id: 'hvac', type: 'HVAC' }),
				makeSystem({ id: 'water-heater', type: 'Water Heater' }),
			],
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner_plus', includePremiumOpportunity: true },
		);
		const recurringSummary = quickRecommendations.find(
			(recommendation) =>
				recommendation.title ===
				'Recurring maintenance is missing for several systems.',
		);

		expect(recurringSummary?.recommendationType).toBe('feature');
		expect(recurringSummary?.requiredPlan).toBe('homeowner_plus');
		expect(
			quickRecommendations.some(
				(recommendation) =>
					recommendation.recommendationType === 'premium_opportunity',
			),
		).toBe(false);
	});

	it('prioritizes smoke and carbon monoxide detector history gaps as high priority', () => {
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems: [
				makeSystem({
					id: 'smoke-detector',
					type: 'Smoke Detector',
					brand: 'Kidde',
					model: 'i9010',
				}),
				makeSystem({
					id: 'co-detector',
					type: 'Carbon Monoxide Detector',
					brand: 'First Alert',
					model: 'CO400',
				}),
				makeSystem({ id: 'dishwasher', type: 'Dishwasher' }),
			],
			tasks: [],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner' },
		);
		const safetySummary = quickRecommendations.find(
			(recommendation) =>
				recommendation.ruleId ===
				'safety-systems-missing-maintenance-history',
		);
		const generalMaintenanceSummary = quickRecommendations.find(
			(recommendation) =>
				recommendation.ruleId === 'systems-missing-maintenance-history',
		);

		expect(safetySummary?.severity).toBe('high');
		expect([...(safetySummary?.relatedSystemIds || [])].sort()).toEqual([
			'co-detector',
			'smoke-detector',
		]);
		expect(generalMaintenanceSummary?.relatedSystemIds).toEqual(['dishwasher']);
	});

	it('keeps overdue task details available for dialog drill-down', () => {
		const scan = runPropertyScanV1({
			property: baseProperty,
			systems: [],
			tasks: [
				makeTask({
					id: 'overdue-1',
					title: 'Replace HVAC filter',
					dueDate: '2020-01-01',
				}),
				makeTask({
					id: 'overdue-2',
					title: 'Check smoke detectors',
					dueDate: '2020-01-02',
				}),
			],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const quickRecommendations = getQuickPropertyScanRecommendations(
			scan.activeRecommendations,
			undefined,
			{ planId: 'homeowner' },
		);
		const overdueSummary = quickRecommendations.find(
			(recommendation) =>
				recommendation.ruleId === 'overdue-tasks-exist',
		);

		expect(overdueSummary?.suggestedActionType).toBe('open_tasks');
		expect([...(overdueSummary?.relatedTaskIds || [])].sort()).toEqual([
			'overdue-1',
			'overdue-2',
		]);
	});
});
