import type {
	ExtractedPartSuggestion,
	PartKnowledgeCategory,
} from '../types/PropertyKnowledge.types';

import { HVAC_PART_KNOWLEDGE_CATALOG } from './assets/hvac';

export interface PartKnowledgeDefinition {
	id: string;
	label: string;
	category: PartKnowledgeCategory;
	relatedAssetTypes: string[];
	matchTerms: string[];
	commonFields?: string[];
	defaultTarget: 'part';
}

export interface AssetPartCatalog {
	[assetType: string]: PartKnowledgeDefinition[];
}

export const PART_KNOWLEDGE_CATALOG: AssetPartCatalog = {
	hvac: HVAC_PART_KNOWLEDGE_CATALOG,

};

const normalizeText = (value: string) =>
	String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const cleanPartName = (value: string) =>
	String(value || '')
		.replace(/\bModel\s*:?\s*[A-Z0-9-]{5,}/gi, '')
		.replace(/\s+\d+\s+\$[0-9,.]+\s+\$[0-9,.]+.*$/, '')
		.replace(/\s+\$[0-9,.]+.*$/, '')
		.trim();

const findDefinitionForText = (text: string) => {
	const normalized = normalizeText(text);
	for (const assetType in PART_KNOWLEDGE_CATALOG) {
		const definitions = PART_KNOWLEDGE_CATALOG[assetType];
		for (const definition of definitions) {
			if (definition.matchTerms.some((term) => normalized.includes(normalizeText(term)))) {
				return definition;
			}
		}
	}
	return undefined;
};

export const matchPartKnowledgeFromLines = (
	lines: string[],
): ExtractedPartSuggestion[] => {
	const seen = new Set<string>();
	const suggestions: ExtractedPartSuggestion[] = [];

	lines.forEach((line, index) => {
		const cleanedName = cleanPartName(line);
		if (!cleanedName) return;
		if (/^labor\b|^permit fee\b|^subtotal\b|^total\b/i.test(cleanedName)) return;

		const definition = findDefinitionForText(cleanedName);
		if (!definition) return;

		const dedupeKey = `${definition.id}:${normalizeText(cleanedName)}`;
		if (seen.has(dedupeKey)) return;
		seen.add(dedupeKey);

		suggestions.push({
			id: `part-${definition.id}-${index + 1}`,
			partKnowledgeId: definition.id,
			label: definition.label,
			name: cleanedName,
			category: definition.category,
			relatedAssetTypes: definition.relatedAssetTypes,
			targetEntity: 'part',
			sourceText: line,
			confidence: 0.68,
			confidenceLevel: 'medium',
			confidenceReason: 'Matched from the parts catalog and needs review.',
		});
	});

	return suggestions;
};
