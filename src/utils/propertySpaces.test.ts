import {
	getNextPropertySpaceSortOrder,
	getPropertySpaceTypeLabel,
	isPropertySpaceType,
	sortPropertySpaces,
} from './propertySpaces';
import { PropertySpace } from '../types/Space.types';

const makeSpace = (
	id: string,
	name: string,
	sortOrder?: number,
): PropertySpace => ({
	id,
	accountId: 'account-1',
	propertyId: 'property-1',
	name,
	type: 'interior',
	sortOrder,
	isArchived: false,
	source: 'manual',
	createdBy: 'user-1',
	updatedBy: 'user-1',
	createdAt: '2026-07-31T00:00:00.000Z',
	updatedAt: '2026-07-31T00:00:00.000Z',
});

describe('property Spaces', () => {
	it('uses the approved Space type vocabulary', () => {
		expect(isPropertySpaceType('grounds')).toBe(true);
		expect(isPropertySpaceType('room')).toBe(false);
		expect(getPropertySpaceTypeLabel('utility')).toBe('Utility');
	});

	it('orders Spaces by display order and then name', () => {
		const spaces = [
			makeSpace('3', 'Attic'),
			makeSpace('2', 'Kitchen', 20),
			makeSpace('1', 'Living Room', 10),
		];

		expect(sortPropertySpaces(spaces).map((space) => space.id)).toEqual([
			'1',
			'2',
			'3',
		]);
	});

	it('leaves room between automatically assigned display orders', () => {
		expect(
			getNextPropertySpaceSortOrder([
				makeSpace('1', 'Living Room', 10),
				makeSpace('2', 'Kitchen', 30),
			]),
		).toBe(40);
	});
});
