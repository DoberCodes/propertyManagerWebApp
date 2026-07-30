export const PROPERTY_TYPES = ['residential', 'multi_unit', 'commercial'] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type LegacyPropertyType =
	| 'Single Family'
	| 'Single-Family'
	| 'Multi-Family'
	| 'Commercial';
export type PropertyTypeInput = PropertyType | LegacyPropertyType | string;

export const PROPERTY_CLASSIFICATIONS = [
	'single_family',
	'condo',
	'townhome',
	'apartment',
	'duplex',
	'triplex',
	'fourplex',
	'apartment_building',
	'other_multi_unit',
	'commercial_suite',
	'standalone_commercial',
	'multi_tenant_commercial',
	'mixed_use',
	'industrial_warehouse',
	'other_commercial',
] as const;

export type PropertyClassification = (typeof PROPERTY_CLASSIFICATIONS)[number];

export const PROPERTY_TYPE_OPTIONS: ReadonlyArray<{ value: PropertyType; label: string }> = [
	{ value: 'residential', label: 'Residential' },
	{ value: 'multi_unit', label: 'Multi-unit' },
	{ value: 'commercial', label: 'Commercial' },
];

const CLASSIFICATION_OPTIONS: Record<
	PropertyType,
	ReadonlyArray<{ value: PropertyClassification; label: string }>
> = {
	residential: [
		{ value: 'single_family', label: 'Single-family home' },
		{ value: 'condo', label: 'Condo' },
		{ value: 'townhome', label: 'Townhome' },
		{ value: 'apartment', label: 'Apartment' },
	],
	multi_unit: [
		{ value: 'duplex', label: 'Duplex' },
		{ value: 'triplex', label: 'Triplex' },
		{ value: 'fourplex', label: 'Fourplex' },
		{ value: 'apartment_building', label: 'Apartment building' },
		{ value: 'other_multi_unit', label: 'Other multi-unit property' },
	],
	commercial: [
		{ value: 'commercial_suite', label: 'Commercial suite' },
		{ value: 'standalone_commercial', label: 'Standalone commercial building' },
		{ value: 'multi_tenant_commercial', label: 'Multi-tenant commercial building' },
		{ value: 'mixed_use', label: 'Mixed-use building' },
		{ value: 'industrial_warehouse', label: 'Industrial or warehouse' },
		{ value: 'other_commercial', label: 'Other commercial property' },
	],
};

export const normalizePropertyType = (value?: PropertyTypeInput | null): PropertyType => {
	const normalized = String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');
	if (normalized === 'multi_family' || normalized === 'multifamily' || normalized === 'multi_unit') {
		return 'multi_unit';
	}
	if (normalized === 'commercial') return 'commercial';
	return 'residential';
};

export const getPropertyTypeLabel = (value?: PropertyTypeInput | null): string =>
	PROPERTY_TYPE_OPTIONS.find((option) => option.value === normalizePropertyType(value))?.label ||
	'Residential';

export const getPropertyClassificationOptions = (type?: PropertyTypeInput | null) =>
	CLASSIFICATION_OPTIONS[normalizePropertyType(type)];

export const isClassificationValidForType = (
	type: PropertyTypeInput | null | undefined,
	classification?: string | null,
): classification is PropertyClassification =>
	Boolean(
		classification &&
			getPropertyClassificationOptions(type).some((option) => option.value === classification),
	);

export const getDefaultPropertyClassification = (
	type?: PropertyTypeInput | null,
): PropertyClassification | undefined =>
	normalizePropertyType(type) === 'residential' ? 'single_family' : undefined;

export const getPropertyClassificationLabel = (
	classification?: string | null,
): string | undefined => {
	if (!classification) return undefined;
	return Object.values(CLASSIFICATION_OPTIONS)
		.flat()
		.find((option) => option.value === classification)?.label;
};

export const isResidentialProperty = (type?: PropertyTypeInput | null) =>
	normalizePropertyType(type) === 'residential';
export const isMultiUnitProperty = (type?: PropertyTypeInput | null) =>
	normalizePropertyType(type) === 'multi_unit';
export const isCommercialProperty = (type?: PropertyTypeInput | null) =>
	normalizePropertyType(type) === 'commercial';
