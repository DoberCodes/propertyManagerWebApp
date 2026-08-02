import {
	getPropertySupplyTypeLabel,
	sortPropertySupplies,
} from './propertySupplies';
import { PropertySupply } from '../types/Supply.types';

const supply = (id: string, name: string): PropertySupply => ({
	id,
	accountId: 'account-1',
	propertyId: 'property-1',
	name,
	type: 'other',
	isArchived: false,
	source: 'manual',
	createdBy: 'user-1',
	updatedBy: 'user-1',
	createdAt: '2026-08-01T00:00:00.000Z',
	updatedAt: '2026-08-01T00:00:00.000Z',
});

describe('propertySupplies', () => {
	it('sorts supplies by name without mutating the source list', () => {
		const source = [supply('2', 'Water Filter'), supply('1', 'Air Filter')];
		expect(sortPropertySupplies(source).map((item) => item.id)).toEqual([
			'1',
			'2',
		]);
		expect(source.map((item) => item.id)).toEqual(['2', '1']);
	});

	it('returns homeowner-friendly type labels', () => {
		expect(getPropertySupplyTypeLabel('paint_and_finish')).toBe(
			'Paint & finish',
		);
	});
});
