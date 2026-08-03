import { MaintleyIntelligenceRule } from '../types';
import { expectsInstallDateRecord } from '../assetRecordExpectations';
import { getAssetDisplayName, isBlank, makeFinding } from './helpers';

export const missingInstallDatesRule: MaintleyIntelligenceRule = {
	id: 'major-systems-missing-install-dates',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (!expectsInstallDateRecord(system)) return [];
			if (!isBlank(system.installationDate)) return [];
			const systemName = getAssetDisplayName(system);

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:missing-install-date:${system.id}`,
					ruleId: 'major-systems-missing-install-dates',
					affectedSystemIds: [system.id],
					category: 'Missing Information',
					severity: 'medium',
					priority: 'medium',
					title: `Add install date for ${systemName}`,
					description: `${systemName} does not have an install date recorded.`,
					whyItMatters:
						'Install dates help with maintenance planning, warranty review, and long-term replacement planning.',
					suggestedActionLabel: 'Open equipment record',
					suggestedActionType: 'edit_system',
					metadata: {
						systemId: system.id,
						systemName,
					},
				}),
			];
		}),
};
