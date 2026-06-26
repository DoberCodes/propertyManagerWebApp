import { Device } from '../types/Property.types';

export interface AssetTypeDefinition {
	value: string;
	label: string;
	variants: string[];
	matchTerms: string[];
	category: string;
	knowledgePack: string;
}

export const UNKNOWN_ASSET_TYPE = 'Unknown';

export const ASSET_TYPE_DEFINITIONS: AssetTypeDefinition[] = [
	{
		value: 'HVAC',
		label: 'HVAC',
		variants: [
			'Furnace',
			'Heat Pump',
			'Central AC',
			'Mini Split',
			'Air Handler',
			'Boiler',
			'Radiator',
			'Geothermal',
		],
		matchTerms: [
			'hvac',
			'air conditioner',
			'air conditioning',
			'central air',
			'central ac',
			'cooling',
			'condenser',
			'furnace',
			'heat pump',
			'mini split',
			'air handler',
			'boiler',
			'radiator',
			'geothermal',
		],
		category: 'hvac',
		knowledgePack: 'hvac',
	},
	{
		value: 'Water Heater',
		label: 'Water Heater',
		variants: [
			'Tank Gas',
			'Tank Electric',
			'Tankless Gas',
			'Tankless Electric',
			'Heat Pump',
			'Solar',
		],
		matchTerms: [
			'water heater',
			'hot water heater',
			'tankless',
			'heat pump water heater',
			'solar water heater',
		],
		category: 'plumbing',
		knowledgePack: 'water_heater',
	},
	{
		value: 'Refrigerator',
		label: 'Refrigerator',
		variants: [
			'Standard',
			'French Door',
			'Side-by-Side',
			'Bottom Freezer',
			'Top Freezer',
			'Built-In',
		],
		matchTerms: ['refrigerator', 'fridge'],
		category: 'kitchen',
		knowledgePack: 'refrigerator',
	},
	{
		value: 'Dishwasher',
		label: 'Dishwasher',
		variants: [],
		matchTerms: ['dishwasher'],
		category: 'kitchen',
		knowledgePack: 'dishwasher',
	},
	{
		value: 'Range / Oven',
		label: 'Range / Oven',
		variants: [],
		matchTerms: ['range', 'oven', 'stove'],
		category: 'kitchen',
		knowledgePack: 'range_oven',
	},
	{
		value: 'Cooktop',
		label: 'Cooktop',
		variants: [],
		matchTerms: ['cooktop'],
		category: 'kitchen',
		knowledgePack: 'cooktop',
	},
	{
		value: 'Microwave',
		label: 'Microwave',
		variants: [],
		matchTerms: ['microwave'],
		category: 'kitchen',
		knowledgePack: 'microwave',
	},
	{
		value: 'Freezer',
		label: 'Freezer',
		variants: [],
		matchTerms: ['freezer'],
		category: 'kitchen',
		knowledgePack: 'freezer',
	},
	{
		value: 'Range Hood',
		label: 'Range Hood',
		variants: [],
		matchTerms: ['range hood', 'hood vent'],
		category: 'kitchen',
		knowledgePack: 'range_hood',
	},
	{
		value: 'Disposal',
		label: 'Disposal',
		variants: [],
		matchTerms: ['disposal', 'garbage disposal'],
		category: 'kitchen',
		knowledgePack: 'disposal',
	},
	{
		value: 'Washer',
		label: 'Washer',
		variants: [],
		matchTerms: ['washer', 'washing machine'],
		category: 'utility',
		knowledgePack: 'washer',
	},
	{
		value: 'Dryer',
		label: 'Dryer',
		variants: [],
		matchTerms: ['dryer', 'clothes dryer'],
		category: 'utility',
		knowledgePack: 'dryer',
	},
	{
		value: 'Electrical Panel',
		label: 'Electrical Panel',
		variants: [],
		matchTerms: ['electrical panel', 'breaker panel', 'main panel'],
		category: 'utility',
		knowledgePack: 'electrical_panel',
	},
	{
		value: 'Internet Equipment',
		label: 'Internet Equipment',
		variants: ['Modem', 'Router', 'Gateway', 'Mesh Node'],
		matchTerms: ['internet equipment', 'modem', 'router', 'gateway', 'wifi'],
		category: 'utility',
		knowledgePack: 'internet_equipment',
	},
	{
		value: 'Roof',
		label: 'Roof',
		variants: [],
		matchTerms: ['roof', 'roofing'],
		category: 'structural',
		knowledgePack: 'roof',
	},
	{
		value: 'Deck',
		label: 'Deck',
		variants: [],
		matchTerms: ['deck'],
		category: 'exterior',
		knowledgePack: 'deck',
	},
	{
		value: 'Patio',
		label: 'Patio',
		variants: [],
		matchTerms: ['patio'],
		category: 'exterior',
		knowledgePack: 'patio',
	},
	{
		value: 'Porch',
		label: 'Porch',
		variants: [],
		matchTerms: ['porch'],
		category: 'exterior',
		knowledgePack: 'porch',
	},
	{
		value: 'Fence',
		label: 'Fence',
		variants: [],
		matchTerms: ['fence', 'fencing'],
		category: 'exterior',
		knowledgePack: 'fence',
	},
	{
		value: 'Driveway',
		label: 'Driveway',
		variants: [],
		matchTerms: ['driveway'],
		category: 'exterior',
		knowledgePack: 'driveway',
	},
	{
		value: 'Retaining Wall',
		label: 'Retaining Wall',
		variants: [],
		matchTerms: ['retaining wall'],
		category: 'exterior',
		knowledgePack: 'retaining_wall',
	},
	{
		value: 'Gutter System',
		label: 'Gutter System',
		variants: [],
		matchTerms: ['gutter system', 'gutter', 'gutters', 'downspout'],
		category: 'exterior',
		knowledgePack: 'gutter_system',
	},
	{
		value: 'Siding',
		label: 'Siding',
		variants: [],
		matchTerms: ['siding', 'cladding'],
		category: 'exterior',
		knowledgePack: 'siding',
	},
	{
		value: 'Windows',
		label: 'Windows',
		variants: [],
		matchTerms: ['window', 'windows'],
		category: 'structural',
		knowledgePack: 'windows',
	},
	{
		value: 'Doors',
		label: 'Doors',
		variants: [],
		matchTerms: ['door', 'doors'],
		category: 'structural',
		knowledgePack: 'doors',
	},
	{
		value: 'Garage Door',
		label: 'Garage Door',
		variants: [],
		matchTerms: ['garage door', 'garage opener'],
		category: 'exterior',
		knowledgePack: 'garage_door',
	},
	{
		value: 'Sump Pump',
		label: 'Sump Pump',
		variants: [],
		matchTerms: ['sump pump'],
		category: 'water_management',
		knowledgePack: 'sump_pump',
	},
	{
		value: 'Fireplace',
		label: 'Fireplace',
		variants: [],
		matchTerms: ['fireplace'],
		category: 'safety',
		knowledgePack: 'fireplace',
	},
	{
		value: 'Chimney',
		label: 'Chimney',
		variants: [],
		matchTerms: ['chimney', 'flue'],
		category: 'safety',
		knowledgePack: 'chimney',
	},
	{
		value: 'Foundation',
		label: 'Foundation',
		variants: [],
		matchTerms: ['foundation', 'basement foundation', 'slab'],
		category: 'structural',
		knowledgePack: 'foundation',
	},
	{
		value: 'Water Softener',
		label: 'Water Softener',
		variants: [],
		matchTerms: ['water softener', 'softener'],
		category: 'water_management',
		knowledgePack: 'water_softener',
	},
	{
		value: 'Irrigation',
		label: 'Irrigation',
		variants: [],
		matchTerms: ['irrigation', 'sprinkler', 'sprinkler system'],
		category: 'water_management',
		knowledgePack: 'irrigation',
	},
	{
		value: 'Well Pump',
		label: 'Well Pump',
		variants: [],
		matchTerms: ['well pump', 'well'],
		category: 'water_management',
		knowledgePack: 'well_pump',
	},
	{
		value: 'Septic',
		label: 'Septic',
		variants: ['Septic Tank', 'Lift Station'],
		matchTerms: ['septic', 'septic tank'],
		category: 'water_management',
		knowledgePack: 'septic',
	},
	{
		value: 'Solar',
		label: 'Solar',
		variants: ['PV', 'Battery', 'Inverter'],
		matchTerms: ['solar', 'pv', 'inverter', 'battery backup'],
		category: 'energy',
		knowledgePack: 'solar',
	},
	{
		value: 'Safety Device',
		label: 'Safety Device',
		variants: ['Smoke Detector', 'Carbon Monoxide Detector', 'Combo Detector'],
		matchTerms: [
			'safety device',
			'smoke detector',
			'smoke alarm',
			'carbon monoxide detector',
			'co detector',
			'combo detector',
			'fire alarm',
		],
		category: 'safety',
		knowledgePack: 'safety_device',
	},
	{
		value: 'Security System',
		label: 'Security System',
		variants: [],
		matchTerms: ['security system', 'home security', 'alarm system', 'camera system'],
		category: 'safety',
		knowledgePack: 'security_system',
	},
	{
		value: 'Outdoor Equipment',
		label: 'Outdoor Equipment',
		variants: [
			'Generator',
			'Pressure Washer',
			'Chainsaw',
			'String Trimmer',
			'Leaf Blower',
			'Snow Blower',
			'Lawn Mower',
		],
		matchTerms: [
			'outdoor equipment',
			'generator',
			'pressure washer',
			'chainsaw',
			'string trimmer',
			'weed eater',
			'leaf blower',
			'snow blower',
			'lawn mower',
			'mower',
		],
		category: 'outdoor_equipment',
		knowledgePack: 'outdoor_equipment',
	},
	{
		value: 'Pool',
		label: 'Pool',
		variants: ['Pool', 'Spa', 'Hot Tub'],
		matchTerms: ['pool', 'spa', 'hot tub'],
		category: 'pool_spa',
		knowledgePack: 'pool_spa',
	},
	{
		value: UNKNOWN_ASSET_TYPE,
		label: 'Other / Unknown',
		variants: [],
		matchTerms: ['unknown', 'other'],
		category: 'other',
		knowledgePack: 'other',
	},
];

const normalize = (value: unknown): string =>
	String(value || '')
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const toPackKey = (value: string): string => normalize(value).replace(/\s+/g, '_');

export const getAssetTypeOptions = () =>
	ASSET_TYPE_DEFINITIONS.map(({ value, label }) => ({ value, label }));

export const getAssetVariantOptions = (assetType?: string): string[] => {
	const normalizedType = normalize(assetType);
	return (
		ASSET_TYPE_DEFINITIONS.find(
			(definition) => normalize(definition.value) === normalizedType,
		)?.variants || []
	);
};

export const normalizeAssetType = (value?: string): string => {
	const normalizedValue = normalize(value);
	if (!normalizedValue) return UNKNOWN_ASSET_TYPE;

	const exactMatch = ASSET_TYPE_DEFINITIONS.find(
		(definition) => normalize(definition.value) === normalizedValue,
	);
	if (exactMatch) return exactMatch.value;

	const inferredMatch = ASSET_TYPE_DEFINITIONS.find((definition) =>
		definition.matchTerms.some((term) => normalizedValue.includes(normalize(term))),
	);
	return inferredMatch?.value || value?.trim() || UNKNOWN_ASSET_TYPE;
};

export const normalizeAssetVariant = (
	assetType?: string,
	assetVariant?: string,
): string => {
	const trimmedVariant = String(assetVariant || '').trim();
	if (!trimmedVariant) return '';
	const variantOptions = getAssetVariantOptions(assetType);
	const normalizedVariant = normalize(trimmedVariant);
	return (
		variantOptions.find((option) => normalize(option) === normalizedVariant) ||
		trimmedVariant
	);
};

export const inferAssetVariantFromText = (
	assetType: string | undefined,
	text: string,
): string => {
	const variantOptions = getAssetVariantOptions(assetType);
	const normalizedText = normalize(text);
	if (!normalizedText) return '';

	const directMatch = [...variantOptions]
		.sort((left, right) => normalize(right).length - normalize(left).length)
		.find((option) => normalizedText.includes(normalize(option)));
	if (directMatch) return directMatch;

	if (normalize(assetType) === normalize('HVAC')) {
		if (
			normalizedText.includes('central air') ||
			normalizedText.includes('ac unit') ||
			normalizedText.includes('air conditioner')
		) {
			return 'Central AC';
		}
		if (normalizedText.includes('boiler')) return 'Boiler';
		if (normalizedText.includes('radiator')) return 'Radiator';
		if (normalizedText.includes('geothermal') || normalizedText.includes('geo')) {
			return 'Geothermal';
		}
		if (normalizedText.includes('air handler')) return 'Air Handler';
	}

	if (normalize(assetType) === normalize('Water Heater')) {
		if (normalizedText.includes('tankless') && normalizedText.includes('gas')) {
			return 'Tankless Gas';
		}
		if (
			normalizedText.includes('tankless') &&
			(normalizedText.includes('electric') || normalizedText.includes('electrical'))
		) {
			return 'Tankless Electric';
		}
		if (normalizedText.includes('tankless')) return 'Tankless Gas';
		if (normalizedText.includes('heat pump')) return 'Heat Pump';
		if (normalizedText.includes('solar')) return 'Solar';
		if (normalizedText.includes('electric') || normalizedText.includes('electrical')) {
			return 'Tank Electric';
		}
		if (normalizedText.includes('gas')) return 'Tank Gas';
	}

	if (normalize(assetType) === normalize('Refrigerator')) {
		if (normalizedText.includes('french door')) return 'French Door';
		if (normalizedText.includes('side by side')) return 'Side-by-Side';
		if (normalizedText.includes('bottom freezer')) return 'Bottom Freezer';
		if (normalizedText.includes('top freezer')) return 'Top Freezer';
		if (normalizedText.includes('built in')) return 'Built-In';
	}

	if (normalize(assetType) === normalize('Safety Device')) {
		if (
			normalizedText.includes('combo') ||
			(normalizedText.includes('smoke') && normalizedText.includes('carbon monoxide'))
		) {
			return 'Combo Detector';
		}
		if (normalizedText.includes('smoke')) return 'Smoke Detector';
		if (
			normalizedText.includes('carbon monoxide') ||
			normalizedText.includes('co detector')
		) {
			return 'Carbon Monoxide Detector';
		}
	}

	return '';
};

export const getAssetDefinition = (
	assetType?: string,
): AssetTypeDefinition | null => {
	const normalizedType = normalizeAssetType(assetType);
	return (
		ASSET_TYPE_DEFINITIONS.find(
			(definition) => normalize(definition.value) === normalize(normalizedType),
		) || null
	);
};

export const getDeviceAssetType = (asset: Partial<Device>): string =>
	normalizeAssetType(asset.assetType || asset.type);

export const getDeviceAssetVariant = (asset: Partial<Device>): string => {
	const normalizedType = getDeviceAssetType(asset);
	return (
		normalizeAssetVariant(normalizedType, asset.assetVariant) ||
		inferAssetVariantFromText(
			normalizedType,
			[asset.type, asset.brand, asset.model].filter(Boolean).join(' '),
		)
	);
};

export const getDeviceKnowledgePack = (asset: Partial<Device>): string => {
	const explicitPack = String(asset.knowledgePack || '').trim();
	if (explicitPack) return explicitPack;

	const assetType = getDeviceAssetType(asset);
	const assetVariant = getDeviceAssetVariant(asset);
	const definition = getAssetDefinition(assetType);
	if (!definition) return toPackKey(assetType || UNKNOWN_ASSET_TYPE);
	if (!assetVariant) return `${definition.knowledgePack}.generic`;
	return `${definition.knowledgePack}.${toPackKey(assetVariant)}`;
};

export const getDeviceAssetClassificationText = (asset: Partial<Device>): string =>
	[
		getDeviceAssetType(asset),
		getDeviceAssetVariant(asset),
		asset.type,
		asset.brand,
		asset.model,
	]
		.filter(Boolean)
		.join(' ');
