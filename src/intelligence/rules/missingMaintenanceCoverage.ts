import { MaintleyIntelligenceRule } from '../types';
import { getSystemName, hasLinkedRecurringTask, makeFinding } from './helpers';

export const missingMaintenanceCoverageRule: MaintleyIntelligenceRule = {
	id: 'systems-missing-actionable-maintenance-coverage',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (hasLinkedRecurringTask(system, context.tasks)) return [];

			const systemName = getSystemName(system);

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:missing-maintenance-coverage:${system.id}`,
					ruleId: 'systems-missing-actionable-maintenance-coverage',
					affectedSystemIds: [system.id],
					category: 'Maintenance Opportunities',
					severity: 'high',
					priority: 'high',
					title: `Add a recurring reminder for ${systemName}`,
					description: `${systemName} does not have a linked recurring task.`,
					whyItMatters:
						'Recurring tasks help turn important maintenance into a visible schedule.',
					suggestedActionLabel: 'Create task',
					suggestedActionType: 'create_task',
					requiredPlan: 'homeowner_plus',
					requiredCapabilities: ['recurring_tasks'],
					metadata: {
						systemId: system.id,
						systemName,
					},
				}),
			];
		}),
};
