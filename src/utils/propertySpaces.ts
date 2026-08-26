import {
	PROPERTY_SPACE_TYPES,
	PropertySpace,
	PropertySpaceType,
} from '../types/Space.types';

export const PROPERTY_SPACE_TYPE_OPTIONS: Array<{
	value: PropertySpaceType;
	label: string;
}> = [
	{ value: 'interior', label: 'Interior' },
	{ value: 'utility', label: 'Utility' },
	{ value: 'storage', label: 'Storage' },
	{ value: 'exterior', label: 'Exterior' },
	{ value: 'grounds', label: 'Grounds' },
	{ value: 'amenity', label: 'Amenity' },
	{ value: 'other', label: 'Other' },
];

export const isPropertySpaceType = (
	value: unknown,
): value is PropertySpaceType =>
	PROPERTY_SPACE_TYPES.includes(value as PropertySpaceType);

export const getPropertySpaceTypeLabel = (type: PropertySpaceType): string =>
	PROPERTY_SPACE_TYPE_OPTIONS.find((option) => option.value === type)?.label ||
	'Other';

export const sortPropertySpaces = (spaces: PropertySpace[]): PropertySpace[] =>
	[...spaces].sort((left, right) => {
		const leftOrder = Number.isFinite(left.sortOrder)
			? Number(left.sortOrder)
			: Number.MAX_SAFE_INTEGER;
		const rightOrder = Number.isFinite(right.sortOrder)
			? Number(right.sortOrder)
			: Number.MAX_SAFE_INTEGER;
		return leftOrder - rightOrder || left.name.localeCompare(right.name);
	});

export const getNextPropertySpaceSortOrder = (
	spaces: Pick<PropertySpace, 'sortOrder'>[],
): number => {
	const highestOrder = spaces.reduce(
		(highest, space) =>
			Number.isFinite(space.sortOrder)
				? Math.max(highest, Number(space.sortOrder))
				: highest,
		0,
	);
	return highestOrder + 10;
};
