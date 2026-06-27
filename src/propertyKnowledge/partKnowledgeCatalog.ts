import type {
	ExtractedPartSuggestion,
	PartKnowledgeCategory,
} from '../types/PropertyKnowledge.types';

export interface PartKnowledgeDefinition {
	id: string;
	label: string;
	category: PartKnowledgeCategory;
	relatedAssetTypes: string[];
	matchTerms: string[];
	commonFields?: string[];
	defaultTarget: 'part';
}

export const PART_KNOWLEDGE_CATALOG: PartKnowledgeDefinition[] = [
	{
		id: 'thermostat',
		label: 'Thermostat',
		category: 'accessory',
		relatedAssetTypes: ['hvac', 'heat_pump', 'furnace', 'central_ac', 'mini_split'],
		matchTerms: ['thermostat', 'smart thermostat', 'honeywell t6', 'ecobee', 'nest'],
		commonFields: ['brand', 'model', 'installDate', 'warranty'],
		defaultTarget: 'part',
	},
	{
		id: 'capacitor',
		label: 'Capacitor',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac'],
		matchTerms: ['capacitor', 'run capacitor', 'start capacitor'],
		commonFields: ['partNumber', 'rating'],
		defaultTarget: 'part',
	},
	{
		id: 'air_filter',
		label: 'Air filter',
		category: 'consumable',
		relatedAssetTypes: ['hvac', 'heat_pump', 'furnace', 'central_ac'],
		matchTerms: ['air filter', 'hvac filter', 'furnace filter', 'return filter'],
		commonFields: ['size', 'mervRating', 'replacementInterval'],
		defaultTarget: 'part',
	},
	{
		id: 'refrigerant',
		label: 'Refrigerant',
		category: 'supply',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac', 'mini_split'],
		matchTerms: ['refrigerant', 'r-410a', 'r410a', 'r-22', 'r22', 'r-32', 'r32'],
		commonFields: ['type'],
		defaultTarget: 'part',
	},
	{
		id: 'drain_pan',
		label: 'Drain pan',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac', 'furnace'],
		matchTerms: ['drain pan', 'condensate pan'],
		commonFields: ['size', 'material'],
		defaultTarget: 'part',
	},
	{
		id: 'safety_switch',
		label: 'Safety switch',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac', 'furnace'],
		matchTerms: ['safety switch', 'float switch', 'overflow switch'],
		commonFields: ['partNumber'],
		defaultTarget: 'part',
	},
	{
		id: 'disconnect_box',
		label: 'Disconnect box',
		category: 'accessory',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac', 'mini_split'],
		matchTerms: ['disconnect box', 'ac disconnect', 'service disconnect'],
		commonFields: ['voltage'],
		defaultTarget: 'part',
	},
	{
		id: 'contactor',
		label: 'Contactor',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac'],
		matchTerms: ['contactor', 'compressor contactor'],
		commonFields: ['partNumber', 'voltage'],
		defaultTarget: 'part',
	},
	{
		id: 'blower_motor',
		label: 'Blower motor',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'furnace', 'central_ac'],
		matchTerms: ['blower motor', 'fan motor', 'ecm motor'],
		commonFields: ['partNumber', 'voltage'],
		defaultTarget: 'part',
	},
	{
		id: 'condensate_pump',
		label: 'Condensate pump',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'furnace', 'central_ac'],
		matchTerms: ['condensate pump', 'condensation pump'],
		commonFields: ['partNumber'],
		defaultTarget: 'part',
	},
	{
		id: 'coil',
		label: 'Coil',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac'],
		matchTerms: ['coil', 'evaporator coil', 'multi-position coil'],
		commonFields: ['model', 'partNumber'],
		defaultTarget: 'part',
	},
	{
		id: 'condenser',
		label: 'Condenser',
		category: 'part',
		relatedAssetTypes: ['hvac', 'heat_pump', 'central_ac'],
		matchTerms: ['condenser', 'heat pump condenser', 'ac condenser'],
		commonFields: ['model', 'partNumber'],
		defaultTarget: 'part',
	},
];

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
	return PART_KNOWLEDGE_CATALOG.find((definition) =>
		definition.matchTerms.some((term) => normalized.includes(normalizeText(term))),
	);
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
			confidence: 0.65,
		});
	});

	return suggestions;
};
