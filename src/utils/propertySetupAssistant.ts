import { PropertySetupAssistantState } from '../types/Property.types';
import {
	SUGGESTED_SYSTEMS,
	SuggestedSystemId,
	SuggestedSystemTemplate,
} from './suggestedMaintenance';

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

const SYSTEM_BY_ID = new Map<SuggestedSystemId, SuggestedSystemTemplate>(
	SUGGESTED_SYSTEMS.map((system) => [system.id, system]),
);

export const PROPERTY_SETUP_AREAS: PropertySetupAssistantArea[] = [
	{
		id: 'kitchen',
		title: 'Kitchen',
		hint: 'Review common kitchen appliances and fixtures.',
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
		hint: 'Track laundry appliances and vent-related care.',
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
		],
	},
];

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

export const getPropertySetupProgress = (
	setupAssistant?: PropertySetupAssistantState,
) => {
	const items = setupAssistant?.items || {};
	const reviewed = PROPERTY_SETUP_AREAS.reduce((count, area) => {
		const areaReviewedCount = area.itemIds.filter((itemId) => {
			const status = items[itemId]?.status;
			return status === 'present' || status === 'not_present';
		}).length;
		return count + areaReviewedCount;
	}, 0);

	return {
		reviewed,
		total: PROPERTY_SETUP_TOTAL_ITEMS,
		isComplete: reviewed >= PROPERTY_SETUP_TOTAL_ITEMS,
	};
};

export const getFirstIncompleteSetupAreaId = (
	setupAssistant?: PropertySetupAssistantState,
): PropertySetupAreaId => {
	const items = setupAssistant?.items || {};
	const incompleteArea = PROPERTY_SETUP_AREAS.find((area) =>
		area.itemIds.some((itemId) => {
			const status = items[itemId]?.status;
			return status !== 'present' && status !== 'not_present';
		}),
	);

	return incompleteArea?.id || PROPERTY_SETUP_AREAS[0].id;
};
