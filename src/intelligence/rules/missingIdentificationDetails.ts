import { MaintleyIntelligenceRule } from '../types';
import { getAssetDisplayName, isBlank, makeFinding } from './helpers';

export const missingIdentificationDetailsRule: MaintleyIntelligenceRule = {
	id: 'systems-missing-important-identification',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			const missingFields: string[] = [];
			if (isBlank(system.brand)) missingFields.push('make');
			if (isBlank(system.model)) missingFields.push('model');
			if (missingFields.length === 0) return [];

			const systemName = getAssetDisplayName(system);

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:missing-identification:${system.id}`,
					ruleId: 'systems-missing-important-identification',
					affectedSystemIds: [system.id],
					category: 'Missing Information',
					severity: 'medium',
					priority: 'medium',
					title: `Add ${missingFields.join(', ')} for ${systemName}`,
					description: `${systemName} is missing ${missingFields.join(
						', ',
					)} in the saved system record.`,
					whyItMatters:
						'Make and model details make records more useful when finding manuals, parts, or service notes.',
					suggestedActionLabel: 'Open system record',
					suggestedActionType: 'edit_system',
					metadata: {
						systemId: system.id,
						systemName,
						missingFields,
					},
				}),
			];
		}),
};
