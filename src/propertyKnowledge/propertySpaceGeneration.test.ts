import type { PropertySpace } from '../types/Space.types';
import {
	buildPropertyProfileSpaceTemplates,
	ensureGeneratedPropertySpaces,
	getSetupAreaSpaceTemplates,
	hasValidBathroomCount,
	hasValidBedroomCount,
	planGeneratedPropertySpaces,
} from './propertySpaceGeneration';

const space = (overrides: Partial<PropertySpace>): PropertySpace => ({
	id: 'space-1',
	accountId: 'account-1',
	propertyId: 'property-1',
	name: 'Kitchen',
	type: 'interior',
	isArchived: false,
	source: 'manual',
	createdBy: 'user-1',
	updatedBy: 'user-1',
	createdAt: '2026-08-03T00:00:00.000Z',
	updatedAt: '2026-08-03T00:00:00.000Z',
	...overrides,
});

describe('property Space generation', () => {
	it('builds numbered bedrooms, full bathrooms, and a half bathroom', () => {
		expect(
			buildPropertyProfileSpaceTemplates({ bedrooms: 3, bathrooms: 2.5 }).map(
				(template) => template.name,
			),
		).toEqual([
			'Bedroom 1',
			'Bedroom 2',
			'Bedroom 3',
			'Bathroom 1',
			'Bathroom 2',
			'Half Bathroom 1',
		]);
	});

	it('accepts only non-negative half-step bathroom counts', () => {
		expect(hasValidBathroomCount(2.5)).toBe(true);
		expect(hasValidBathroomCount(2.25)).toBe(false);
		expect(hasValidBathroomCount(-0.5)).toBe(false);
	});

	it('accepts only non-negative whole bedroom counts', () => {
		expect(hasValidBedroomCount(3)).toBe(true);
		expect(hasValidBedroomCount(0)).toBe(true);
		expect(hasValidBedroomCount(2.5)).toBe(false);
		expect(hasValidBedroomCount(-1)).toBe(false);
	});

	it('reuses generated Spaces after they are renamed', () => {
		const existing = space({
			name: 'Main Kitchen',
			generationKey: 'setup:kitchen',
		});
		expect(
			planGeneratedPropertySpaces(
				getSetupAreaSpaceTemplates('kitchen', {}),
				[existing],
			)[0],
		).toMatchObject({ status: 'reuse', space: existing });
	});

	it('reuses a manually created normalized name and flags archived matches', () => {
		const template = getSetupAreaSpaceTemplates('kitchen', {});
		expect(
			planGeneratedPropertySpaces(template, [space({ name: ' kitchen ' })])[0]
				.status,
		).toBe('reuse');
		expect(
			planGeneratedPropertySpaces(template, [space({ isArchived: true })])[0]
				.status,
		).toBe('archived_conflict');
	});

	it('preserves a user-selected Space type instead of generating a duplicate name', () => {
		const userCreatedKitchen = space({
			name: 'Kitchen',
			type: 'utility',
		});
		expect(
			planGeneratedPropertySpaces(
				getSetupAreaSpaceTemplates('kitchen', {}),
				[userCreatedKitchen],
			)[0],
		).toMatchObject({ status: 'reuse', space: userCreatedKitchen });
	});

	it('does not generate automatic utility or safety Spaces', () => {
		expect(getSetupAreaSpaceTemplates('utility-systems', {})).toEqual([]);
		expect(getSetupAreaSpaceTemplates('safety', {})).toEqual([]);
	});

	it('creates missing reviewed Spaces and reuses them on a repeat save', async () => {
		const templates = buildPropertyProfileSpaceTemplates({
			bedrooms: 1,
			bathrooms: 1,
		});
		const createdSpaces: PropertySpace[] = [];
		const createSpace = jest.fn(async (input) => {
			const created = space({
				...input,
				id: `space-${createdSpaces.length + 1}`,
			});
			createdSpaces.push(created);
			return created;
		});

		const first = await ensureGeneratedPropertySpaces({
			accountId: 'account-1',
			propertyId: 'property-1',
			templates,
			existingSpaces: [],
			source: 'property_profile',
			createSpace,
		});
		expect(first.created.map((created) => created.name)).toEqual([
			'Bedroom 1',
			'Bathroom 1',
		]);

		const repeat = await ensureGeneratedPropertySpaces({
			accountId: 'account-1',
			propertyId: 'property-1',
			templates,
			existingSpaces: createdSpaces,
			source: 'property_profile',
			createSpace,
		});
		expect(repeat.created).toEqual([]);
		expect(repeat.reused).toHaveLength(2);
		expect(createSpace).toHaveBeenCalledTimes(2);
	});
});
