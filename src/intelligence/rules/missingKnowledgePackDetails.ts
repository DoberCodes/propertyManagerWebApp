import { Device } from '../../types/Property.types';
import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { MaintleyIntelligenceRule } from '../types';
import { getAssetDisplayName, isBlank, makeFinding, normalizeText } from './helpers';

const hasFilterServiceItem = (system: Device): boolean =>
	(system.serviceItems || []).some((item) => {
		const itemText = normalizeText(
			[item.category, item.name, item.details, item.size, item.partNumber]
				.filter(Boolean)
				.join(' '),
		);
		return itemText.includes('filter');
	});

const needsFilterSize = (system: Device): boolean => {
	const baseline = getBaselineDefinitionForAsset(system);
	if (!baseline) return false;
	if (
		!baseline.recommendedFields.some(
			(field) => normalizeText(field) === 'filter size',
		)
	) {
		return false;
	}

	return isBlank(system.filterSize) && !hasFilterServiceItem(system);
};

export const missingKnowledgePackDetailsRule: MaintleyIntelligenceRule = {
	id: 'knowledge-pack-record-details-missing',
	evaluate: (context) =>
		context.systems.flatMap((system) => {
			if (!needsFilterSize(system)) return [];

			const baseline = getBaselineDefinitionForAsset(system);
			const systemName = getAssetDisplayName(system);

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:knowledge-pack-detail:filter-size:${system.id}`,
					ruleId: 'knowledge-pack-record-details-missing',
					affectedSystemIds: [system.id],
					category: 'Missing Information',
					severity: 'medium',
					priority: 'medium',
					source: 'knowledge_pack',
					title: `Add filter size for ${systemName}`,
					description: `${systemName} does not have a filter size recorded in Maintley's equipment record.`,
					whyItMatters:
						'Knowing the filter size makes future replacements easier and helps keep supplies easier to find.',
					suggestedActionLabel: 'Open equipment record',
					suggestedActionType: 'edit_system',
					metadata: {
						systemId: system.id,
						systemName,
						baselineAssetType: baseline?.assetType,
						missingFields: ['filter size'],
						knowledgePackSections: {
							maintenanceTopics: baseline?.maintenanceTopics || [],
							partsAndSupplies: baseline?.partsAndSupplies || [],
							recommendedDocuments: baseline?.recommendedDocuments || [],
							lifecycle: baseline?.lifecycle,
							seasonalGuidance: baseline?.seasonalGuidance,
						},
					},
				}),
			];
		}),
};
