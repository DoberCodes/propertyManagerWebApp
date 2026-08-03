import { getRecommendationResolutionPlan } from './resolutionEngine';
import { MaintleyFinding } from './types';

const makeFinding = (
	overrides: Partial<MaintleyFinding> = {},
): MaintleyFinding => ({
	id: overrides.id || 'finding-1',
	ruleId: overrides.ruleId || 'major-systems-missing-install-dates',
	propertyId: 'property-1',
	affectedSystemIds: ['system-1'],
	category: 'Missing Information',
	severity: 'medium',
	priority: 'medium',
	source: 'property_memory',
	title: 'Add install date for Water Heater',
	description: 'Water Heater does not have an install date recorded.',
	whyItMatters:
		'Install dates help with maintenance planning, warranty review, and long-term replacement planning.',
	suggestedActionLabel: 'Open equipment record',
	suggestedActionType: 'edit_system',
	requiredPlan: 'homeowner',
	requiredCapabilities: [],
	metadata: {
		systemId: 'system-1',
		systemName: 'Water Heater',
		...(overrides.metadata || {}),
	},
	createdAt: '2026-07-03T12:00:00.000Z',
	...overrides,
});

describe('Maintley Resolution Engine', () => {
	it('maps missing install dates to an asset edit workflow', () => {
		const plan = getRecommendationResolutionPlan(makeFinding());

		expect(plan).toEqual(
			expect.objectContaining({
				resolutionType: 'edit_asset',
				assetLabel: 'Water Heater',
				sectionLabel: 'Documentation',
				missingFields: ['install date'],
				fieldTargets: ['installationDate'],
				primaryActionType: 'edit_system',
			}),
		);
		expect(plan?.options.map((option) => option.actionType)).toContain(
			'upload_document',
		);
	});

	it('maps missing recurring maintenance to a task workflow', () => {
		const plan = getRecommendationResolutionPlan(
			makeFinding({
				ruleId: 'systems-missing-actionable-maintenance-coverage',
				category: 'Maintenance Opportunities',
				title: 'Add a recurring reminder for Water Heater',
				suggestedActionLabel: 'Create task',
				suggestedActionType: 'create_task',
			}),
		);

		expect(plan).toEqual(
			expect.objectContaining({
				resolutionType: 'create_task',
				actionLabel: 'Create reminder',
				sectionLabel: 'Maintenance',
				fieldTargets: [],
				primaryActionType: 'create_task',
			}),
		);
	});

	it('shows known recurring maintenance cadences as task choices', () => {
		const plan = getRecommendationResolutionPlan(
			makeFinding({
				ruleId: 'systems-missing-actionable-maintenance-coverage',
				category: 'Maintenance Opportunities',
				title: 'Add a recurring reminder for Water Heater',
				suggestedActionLabel: 'Create task',
				suggestedActionType: 'create_task',
				metadata: {
					systemId: 'system-1',
					systemName: 'Water Heater',
					suggestedMaintenanceCadence: [
						{
							id: 'water-heater-flush',
							label: 'Flush water heater',
							intervalDays: 365,
						},
						{
							id: 'water-heater-anode-rod-check',
							label: 'Inspect water heater anode rod',
							intervalDays: 1095,
						},
					],
				},
			}),
		);

		expect(plan?.actionLabel).toBe('Choose reminder');
		expect(plan?.primaryActionLabel).toBe('Create custom task');
		expect(plan?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					label: 'Add Flush water heater',
					actionType: 'create_task',
					metadata: expect.objectContaining({
						selectedMaintenanceCadence: expect.objectContaining({
							label: 'Flush water heater',
							intervalDays: 365,
						}),
					}),
				}),
				expect.objectContaining({
					label: 'Add Inspect water heater anode rod',
					actionType: 'create_task',
				}),
			]),
		);
	});

	it('preserves missing field names for equipment detail recommendations', () => {
		const plan = getRecommendationResolutionPlan(
			makeFinding({
				ruleId: 'systems-missing-important-identification',
				title: 'Add make, model for Water Heater',
				metadata: {
					systemId: 'system-1',
					systemName: 'Water Heater',
					missingFields: ['brand', 'model'],
				},
			}),
		);

		expect(plan?.missingFields).toEqual(['make', 'model']);
		expect(plan?.fieldTargets).toEqual(['brand', 'model']);
		expect(plan?.whatToDo).toContain('make or model');
	});

	it('does not create a resolution workflow for overdue task review', () => {
		const plan = getRecommendationResolutionPlan(
			makeFinding({
				ruleId: 'overdue-tasks-exist',
				category: 'Overdue Work',
				title: 'Maintley has recorded maintenance tasks that are now overdue.',
				suggestedActionLabel: 'Review Tasks',
				suggestedActionType: 'open_task',
			}),
		);

		expect(plan).toBeUndefined();
	});
});
