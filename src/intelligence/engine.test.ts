import { Device, Property } from '../types/Property.types';
import { Task } from '../types/Task.types';
import {
	BASELINE_CARE_LIBRARY_VERSION,
	getBaselineDefinitionForAsset,
} from './baselineCareLibrary';
import { runMaintleyIntelligence } from './engine';
import { filterFindingsForPlanAndCapabilities } from './planFilter';
import { missingMaintenanceCoverageRule } from './rules';

const property: Property = {
	id: 'property-1',
	userId: 'user-1',
	title: 'Test Home',
	slug: 'test-home',
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
		propertyId: property.id,
	},
	status: 'Active',
	...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
	id: overrides.id || 'task-1',
	userId: 'user-1',
	propertyId: property.id,
	title: 'Replace filter',
	dueDate: '2099-01-01',
	status: 'Pending',
	property: property.title,
	...overrides,
});

describe('Maintley Intelligence engine', () => {
	it('generates structured findings from modular rules', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [
				makeSystem({
					id: 'water-heater',
					type: 'Water Heater',
					installationDate: '',
				}),
			],
			tasks: [
				makeTask({
					id: 'overdue-task',
					title: 'Inspect water heater',
					dueDate: '2020-01-01',
				}),
			],
			maintenanceHistory: [],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		expect(result.propertyId).toBe(property.id);
		expect(result.generatedAt).toBe('2026-06-24T12:00:00.000Z');
		expect(result.baselineVersion).toBe(BASELINE_CARE_LIBRARY_VERSION);
		expect(result.systemsReviewed).toBe(1);
		expect(result.tasksReviewed).toBe(1);
		expect(result.summary.total).toBe(result.findings.length);
		expect(result.findings.length).toBeGreaterThan(0);
		expect(result.findings[0]).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				ruleId: expect.any(String),
				propertyId: property.id,
				category: expect.any(String),
				severity: expect.any(String),
				priority: expect.any(String),
				source: expect.any(String),
				title: expect.any(String),
				description: expect.any(String),
				whyItMatters: expect.any(String),
				suggestedActionLabel: expect.any(String),
				suggestedActionType: expect.any(String),
				requiredPlan: expect.any(String),
				requiredCapabilities: expect.any(Array),
				baselineVersion: BASELINE_CARE_LIBRARY_VERSION,
				metadata: expect.any(Object),
			}),
		);
	});

	it('keeps recurring maintenance coverage as a Homeowner+ finding', () => {
		const context = {
			property,
			systems: [makeSystem({ id: 'hvac' })],
			tasks: [],
			maintenanceHistory: [],
			documents: [],
			files: [],
			capabilities: {},
			currentDate: new Date('2026-06-24T12:00:00.000Z'),
			baselineVersion: BASELINE_CARE_LIBRARY_VERSION,
			createdAt: '2026-06-24T12:00:00.000Z',
		};
		const findings = missingMaintenanceCoverageRule.evaluate(context);

		expect(findings).toHaveLength(1);
		expect(findings[0]).toEqual(
			expect.objectContaining({
				ruleId: 'systems-missing-actionable-maintenance-coverage',
				source: 'knowledge_pack',
				requiredPlan: 'homeowner_plus',
				requiredCapabilities: ['recurring_tasks'],
				affectedSystemIds: ['hvac'],
			}),
		);
	});

	it('filters findings by plan capability', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [makeSystem({ id: 'hvac' })],
			tasks: [],
			maintenanceHistory: [{ id: 'history-1', deviceId: 'hvac' }],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const freeFindings = filterFindingsForPlanAndCapabilities(
			result.findings,
			'homeowner',
		);
		const paidFindings = filterFindingsForPlanAndCapabilities(
			result.findings,
			'homeowner_plus',
		);

		expect(
			freeFindings.some(
				(finding) =>
					finding.ruleId ===
					'systems-missing-actionable-maintenance-coverage',
			),
		).toBe(false);
		expect(
			paidFindings.some(
				(finding) =>
					finding.ruleId ===
					'systems-missing-actionable-maintenance-coverage',
			),
		).toBe(true);
	});

	it('uses recommendation source to gate knowledge-pack findings by plan', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [
				makeSystem({
					id: 'hvac',
					type: 'HVAC',
					filterSize: '',
				}),
			],
			tasks: [
				makeTask({
					id: 'overdue-task',
					title: 'Review saved task',
					dueDate: '2020-01-01',
				}),
			],
			maintenanceHistory: [{ id: 'history-1', deviceId: 'hvac' }],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const freeFindings = filterFindingsForPlanAndCapabilities(
			result.findings,
			'homeowner',
		);
		const paidFindings = filterFindingsForPlanAndCapabilities(
			result.findings,
			'homeowner_plus',
		);

		expect(
			freeFindings.some(
				(finding) =>
					finding.ruleId === 'knowledge-pack-record-details-missing',
			),
		).toBe(false);
		expect(
			paidFindings.some(
				(finding) =>
					finding.ruleId === 'knowledge-pack-record-details-missing',
			),
		).toBe(true);
		expect(
			freeFindings.some(
				(finding) => finding.ruleId === 'overdue-tasks-exist',
			),
		).toBe(true);
	});

	it('can apply plan and capability filtering inside the engine flow', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [makeSystem({ id: 'hvac' })],
			tasks: [],
			maintenanceHistory: [{ id: 'history-1', deviceId: 'hvac' }],
			planId: 'homeowner',
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		expect(
			result.findings.some(
				(finding) =>
					finding.ruleId ===
					'systems-missing-actionable-maintenance-coverage',
			),
		).toBe(false);
	});

	it('compares maintenance history dates against Maintley baseline cadence', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [makeSystem({ id: 'hvac', type: 'HVAC' })],
			tasks: [],
			maintenanceHistory: [
				{
					id: 'history-filter',
					deviceId: 'hvac',
					title: 'Replace HVAC filter',
					date: '2026-01-01T12:00:00.000Z',
				},
			],
			currentDate: '2026-07-01T12:00:00.000Z',
			createdAt: '2026-07-01T12:00:00.000Z',
		});
		const cadenceFinding = result.findings.find(
			(finding) => finding.ruleId === 'baseline-maintenance-cadence-overdue',
		);

		expect(cadenceFinding).toEqual(
			expect.objectContaining({
				baselineVersion: BASELINE_CARE_LIBRARY_VERSION,
				source: 'knowledge_pack',
				requiredPlan: 'homeowner_plus',
				title: 'Replace or inspect HVAC filter may be due for Maintley HVAC Model A.',
				affectedSystemIds: ['hvac'],
			}),
		);
		expect(cadenceFinding?.metadata).toEqual(
			expect.objectContaining({
				baselineCadenceId: 'hvac-filter-replacement',
				baselineIntervalDays: 90,
				elapsedDays: 181,
				baselineVersion: BASELINE_CARE_LIBRARY_VERSION,
			}),
		);
	});

	it('does not create a cadence finding when baseline interval has not elapsed', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [makeSystem({ id: 'hvac', type: 'HVAC' })],
			tasks: [],
			maintenanceHistory: [
				{
					id: 'history-filter',
					deviceId: 'hvac',
					title: 'Replace HVAC filter',
					date: '2026-06-01T12:00:00.000Z',
				},
			],
			currentDate: '2026-07-01T12:00:00.000Z',
			createdAt: '2026-07-01T12:00:00.000Z',
		});

		expect(
			result.findings.some(
				(finding) => finding.ruleId === 'baseline-maintenance-cadence-overdue',
			),
		).toBe(false);
	});

	it('defines baseline knowledge packs for common homeowner asset types', () => {
		const assetTypes = [
			'HVAC',
			'Water Heater',
			'Refrigerator',
			'Washer',
			'Dryer',
			'Roof',
			'Smoke/CO Detector',
		];

		assetTypes.forEach((assetType) => {
			const definition = getBaselineDefinitionForAsset(
				makeSystem({ id: assetType, type: assetType }),
			);

			expect(definition).toEqual(
				expect.objectContaining({
					assetType,
					recommendedFields: expect.any(Array),
					suggestedMaintenanceCadence: expect.any(Array),
					maintenanceTopics: expect.any(Array),
					partsAndSupplies: expect.any(Array),
					recommendedDocuments: expect.any(Array),
					lifecycle: expect.objectContaining({
						notes: expect.any(Array),
					}),
					seasonalGuidance: expect.any(Object),
				}),
			);
			expect(definition?.suggestedMaintenanceCadence.length).toBeGreaterThan(0);
			expect(definition?.partsAndSupplies.length).toBeGreaterThan(0);
		});
	});

	it('recommends recording filter size for assets whose knowledge pack needs it', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [
				makeSystem({
					id: 'hvac',
					type: 'HVAC',
					filterSize: '',
				}),
			],
			tasks: [],
			maintenanceHistory: [{ id: 'history-1', deviceId: 'hvac' }],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		const finding = result.findings.find(
			(item) => item.ruleId === 'knowledge-pack-record-details-missing',
		);

		expect(finding).toEqual(
			expect.objectContaining({
				title: 'Add filter size for Maintley HVAC Model A',
				source: 'knowledge_pack',
				requiredPlan: 'homeowner_plus',
				affectedSystemIds: ['hvac'],
				metadata: expect.objectContaining({
					baselineAssetType: 'HVAC',
					missingFields: ['filter size'],
				}),
			}),
		);
	});

	it('does not recommend filter size when filter information is already tracked', () => {
		const result = runMaintleyIntelligence({
			property,
			systems: [
				makeSystem({
					id: 'hvac',
					type: 'HVAC',
					filterSize: '',
					serviceItems: [
						{
							id: 'filter-1',
							category: 'filter',
							name: 'HVAC Filter',
							size: '20x25x1',
						},
					],
				}),
			],
			tasks: [],
			maintenanceHistory: [{ id: 'history-1', deviceId: 'hvac' }],
			createdAt: '2026-06-24T12:00:00.000Z',
		});

		expect(
			result.findings.some(
				(item) => item.ruleId === 'knowledge-pack-record-details-missing',
			),
		).toBe(false);
	});
});
