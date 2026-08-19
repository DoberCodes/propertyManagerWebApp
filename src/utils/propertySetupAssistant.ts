import { PropertySetupAssistantState } from '../types/Property.types';
import {
	SUGGESTED_SYSTEMS,
	SuggestedSystemId,
	SuggestedSystemTemplate,
} from './suggestedMaintenance';
import {
	getAssetVariantOptions,
	normalizeAssetType,
} from './systemTypes';

export type PropertySetupAreaId =
	| 'kitchen'
	| 'bathrooms'
	| 'laundry'
	| 'garage'
	| 'exterior'
	| 'utility-systems'
	| 'safety';

export type PropertySetupAssistantStatus =
	| 'present'
	| 'not_present'
	| 'unknown';

export interface PropertySetupAssistantItem {
	id: SuggestedSystemId;
	label: string;
	system: SuggestedSystemTemplate;
}

export interface PropertySetupAssistantArea {
	id: PropertySetupAreaId;
	title: string;
	hint: string;
	itemIds: SuggestedSystemId[];
}

export type PropertySetupPath =
	| 'essentials'
	| 'room_by_room'
	| 'existing_report';

const SYSTEM_BY_ID = new Map<SuggestedSystemId, SuggestedSystemTemplate>(
	SUGGESTED_SYSTEMS.map((system) => [system.id, system]),
);

export const PROPERTY_SETUP_AREAS: PropertySetupAssistantArea[] = [
	{
		id: 'kitchen',
		title: 'Kitchen',
		hint: 'Review common kitchen equipment and fixtures.',
		itemIds: [
			'refrigerator',
			'dishwasher',
			'garbage-disposal',
			'range-oven',
			'microwave',
		],
	},
	{
		id: 'bathrooms',
		title: 'Bathrooms',
		hint: 'Look for safety outlets and visible plumbing items.',
		itemIds: ['gfci-outlets', 'plumbing-fixtures'],
	},
	{
		id: 'laundry',
		title: 'Laundry',
		hint: 'Track laundry equipment and vent-related care.',
		itemIds: ['washer', 'dryer'],
	},
	{
		id: 'garage',
		title: 'Garage',
		hint: 'Review garage systems and backup power items.',
		itemIds: ['garage-door', 'electrical-panel', 'generator'],
	},
	{
		id: 'exterior',
		title: 'Exterior',
		hint: 'Capture exterior systems that often create seasonal tasks.',
		itemIds: [
			'gutters-downspouts',
			'roof',
			'windows-doors',
			'deck-patio',
			'irrigation-system',
			'pool-spa',
		],
	},
	{
		id: 'utility-systems',
		title: 'Utility Systems',
		hint: 'Review major comfort, water, and drainage systems.',
		itemIds: [
			'hvac',
			'water-heater',
			'sump-pump',
			'water-softener',
			'well-pump',
			'septic-system',
		],
	},
	{
		id: 'safety',
		title: 'Safety',
		hint: 'Track safety systems and seasonal review items.',
		itemIds: [
			'smoke-detectors',
			'carbon-monoxide-detectors',
			'fireplace-chimney',
			'radon-mitigation-system',
		],
	},
];

const PROPERTY_SETUP_ESSENTIAL_ITEM_IDS = new Set<SuggestedSystemId>([
	'gfci-outlets',
	'dryer',
	'electrical-panel',
	'gutters-downspouts',
	'roof',
	'hvac',
	'water-heater',
	'smoke-detectors',
	'carbon-monoxide-detectors',
]);

export const PROPERTY_SETUP_ESSENTIAL_AREAS: PropertySetupAssistantArea[] =
	PROPERTY_SETUP_AREAS.map((area) => ({
		...area,
		itemIds: area.itemIds.filter((itemId) =>
			PROPERTY_SETUP_ESSENTIAL_ITEM_IDS.has(itemId),
		),
	})).filter((area) => area.itemIds.length > 0);

export const PROPERTY_SETUP_TOTAL_ITEMS = PROPERTY_SETUP_AREAS.reduce(
	(total, area) => total + area.itemIds.length,
	0,
);

export const getPropertySetupItem = (
	id: SuggestedSystemId,
): PropertySetupAssistantItem | null => {
	const system = SYSTEM_BY_ID.get(id);
	if (!system) {
		return null;
	}

	return {
		id,
		label: system.label,
		system,
	};
};

const SETUP_ITEM_SUBTYPE_OPTIONS: Partial<Record<SuggestedSystemId, string[]>> = {
	'smoke-detectors': ['Smoke Detector', 'Combo Detector'],
	'carbon-monoxide-detectors': [
		'Carbon Monoxide Detector',
		'Combo Detector',
	],
};

export const getPropertySetupSubtypeOptions = (
	id: SuggestedSystemId,
): string[] => {
	const explicitOptions = SETUP_ITEM_SUBTYPE_OPTIONS[id];
	if (explicitOptions) return explicitOptions;
	const item = getPropertySetupItem(id);
	return item
		? getAssetVariantOptions(normalizeAssetType(item.system.deviceType))
		: [];
};

export const getPropertySetupInstanceName = (
	id: SuggestedSystemId,
	index: number,
): string => {
	const item = getPropertySetupItem(id);
	const label = item?.label || 'Equipment';
	return index === 0 ? label : `${label} ${index + 1}`;
};

export const isDistributedPropertySetupItem = (
	id: SuggestedSystemId,
): boolean =>
	id === 'smoke-detectors' || id === 'carbon-monoxide-detectors';

export const getUnreviewedDetectedSetupItemIds = (
	items: NonNullable<PropertySetupAssistantState['items']> = {},
	detectedItemIds: SuggestedSystemId[],
) =>
	detectedItemIds.filter((itemId) => {
		const status = items[itemId]?.status;
		return status !== 'present' && status !== 'not_present';
	});

export const getPropertySetupProgress = (
	setupAssistant?: PropertySetupAssistantState,
	areas: PropertySetupAssistantArea[] = PROPERTY_SETUP_AREAS,
) => {
	const items = setupAssistant?.items || {};
	const reviewed = areas.reduce((count, area) => {
		const areaReviewedCount = area.itemIds.filter((itemId) => {
			const status = items[itemId]?.status;
			return status === 'present' || status === 'not_present';
		}).length;
		return count + areaReviewedCount;
	}, 0);

	return {
		reviewed,
		total: areas.reduce((total, area) => total + area.itemIds.length, 0),
		isComplete:
			reviewed >= areas.reduce((total, area) => total + area.itemIds.length, 0),
	};
};

export const getFirstIncompleteSetupAreaId = (
	setupAssistant?: PropertySetupAssistantState,
	areas: PropertySetupAssistantArea[] = PROPERTY_SETUP_AREAS,
): PropertySetupAreaId => {
	const items = setupAssistant?.items || {};
	const incompleteArea = areas.find((area) =>
		area.itemIds.some((itemId) => {
			const status = items[itemId]?.status;
			return status !== 'present' && status !== 'not_present';
		}),
	);

	return incompleteArea?.id || areas[0]?.id || PROPERTY_SETUP_AREAS[0].id;
};
