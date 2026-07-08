import { MaintleyIntelligenceRule } from '../types';
import { expectsRecurringCareRecord } from '../assetRecordExpectations';
import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { getAssetDisplayName, hasLinkedRecurringTask, makeFinding } from './helpers';

export const missingMaintenanceCoverageRule: MaintleyIntelligenceRule = {
	id: 'systems-missing-actionable-maintenance-coverage',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (!expectsRecurringCareRecord(system)) return [];
			if (hasLinkedRecurringTask(system, context.tasks)) return [];

			const baseline = getBaselineDefinitionForAsset(system);
			const suggestedCadence = baseline?.suggestedMaintenanceCadence || [];
			if (suggestedCadence.length === 0) return [];

			const systemName = getAssetDisplayName(system);

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:missing-maintenance-coverage:${system.id}`,
					ruleId: 'systems-missing-actionable-maintenance-coverage',
					affectedSystemIds: [system.id],
					category: 'Maintenance Opportunities',
					severity: 'high',
					priority: 'high',
					source: 'knowledge_pack',
					title: `Add a recurring reminder for ${systemName}`,
					description: `${systemName} does not have a linked recurring task.`,
					whyItMatters:
						'Recurring tasks help turn important maintenance into a visible schedule.',
					suggestedActionLabel: 'Create task',
					suggestedActionType: 'create_task',
					requiredCapabilities: ['recurring_tasks'],
					metadata: {
						systemId: system.id,
						systemName,
						baselineAssetType: baseline?.assetType,
						suggestedMaintenanceCadence: suggestedCadence.map((cadence) => ({
							id: cadence.id,
							label: cadence.label,
							intervalDays: cadence.intervalDays,
						})),
					},
				}),
			];
		}),
};
