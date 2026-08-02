import {
	PROPERTY_SUPPLY_TYPES,
	PropertySupply,
	PropertySupplyType,
} from '../types/Supply.types';

const SUPPLY_TYPE_LABELS: Record<PropertySupplyType, string> = {
	filter: 'Filter',
	paint_and_finish: 'Paint & finish',
	lawn_and_garden: 'Lawn & garden',
	pool_and_spa: 'Pool & spa',
	electrical: 'Electrical',
	plumbing: 'Plumbing',
	hardware: 'Hardware',
	cleaning: 'Cleaning',
	other: 'Other',
};

export const PROPERTY_SUPPLY_TYPE_OPTIONS = PROPERTY_SUPPLY_TYPES.map(
	(value) => ({
		value,
		label: SUPPLY_TYPE_LABELS[value],
	}),
);

export const getPropertySupplyTypeLabel = (type: PropertySupplyType): string =>
	SUPPLY_TYPE_LABELS[type] || 'Other';

export const sortPropertySupplies = (
	supplies: PropertySupply[],
): PropertySupply[] =>
	[...supplies].sort((left, right) =>
		left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
	);
