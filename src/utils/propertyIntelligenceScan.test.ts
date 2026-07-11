import { Device, Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import {
	getQuickPropertyScanPremiumPreview,
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
				type: index === 0 ? 'Smoke Detector' : `Equipment ${index}`,
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

	it('selects one representative finding for repeated Quick Scan issue types', () => {
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

		expect(maintenanceSummary?.title).toMatch(/^Record first maintenance note/);
		expect(maintenanceSummary?.relatedSystemIds).toHaveLength(1);
		expect(
			quickRecommendations.filter(
				(recommendation) =>
					recommendation.ruleId === 'systems-missing-maintenance-history',
			),
		).toHaveLength(1);
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

	it('keeps the Homeowner+ preview separate from the free Quick Scan limit', () => {
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
			{ planId: 'homeowner' },
		);
		const premiumPreview = getQuickPropertyScanPremiumPreview(
			scan.activeRecommendations,
			'homeowner',
		);

		expect(
			quickRecommendations.some(
				(recommendation) =>
					recommendation.title ===
					'Maintley does not currently have recurring maintenance recorded for several systems.',
			),
		).toBe(false);
		expect(quickRecommendations).toHaveLength(1);
		expect(premiumPreview).toEqual(
			expect.objectContaining({
				requiredPlan: 'homeowner_plus',
				examples: expect.arrayContaining(['Recommended recurring maintenance']),
			}),
		);
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
			{ planId: 'homeowner_plus' },
		);
		const premiumPreview = getQuickPropertyScanPremiumPreview(
			scan.activeRecommendations,
			'homeowner_plus',
		);
		const recurringSummary = quickRecommendations.find(
			(recommendation) =>
				recommendation.ruleId ===
				'systems-missing-actionable-maintenance-coverage',
		);

		expect(recurringSummary?.recommendationType).toBe('feature');
		expect(recurringSummary?.requiredPlan).toBe('homeowner_plus');
		expect(premiumPreview).toBeNull();
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
		expect(safetySummary?.relatedSystemIds).toHaveLength(1);
		expect(['co-detector', 'smoke-detector']).toContain(
			safetySummary?.relatedSystemIds?.[0],
		);
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

		expect(overdueSummary?.suggestedActionType).toBe('open_task');
		expect(overdueSummary?.relatedTaskIds).toHaveLength(1);
		expect(['overdue-1', 'overdue-2']).toContain(
			overdueSummary?.relatedTaskIds?.[0],
		);
	});
});
