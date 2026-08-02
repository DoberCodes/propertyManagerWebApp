import {
	buildPropertySupplyDraftFromBarcode,
	buildPropertySupplyDraftFromServiceItem,
	findPropertySupplyByBarcode,
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

	it('preserves equipment service-item details when promoting a Supply', () => {
		expect(
			buildPropertySupplyDraftFromServiceItem({
				category: 'filter',
				name: 'Furnace filter',
				partNumber: 'ABC-123',
				size: '16 x 25 x 1',
				mervRating: '11',
				replacementInterval: 'Every 3 months',
			}),
		).toMatchObject({
			type: 'filter',
			partNumber: 'ABC-123',
			size: '16 x 25 x 1',
			mervRating: '11',
			replacementInterval: 'Every 3 months',
		});
	});

	it('captures a scanned barcode for reviewed Supply creation', () => {
		const draft = buildPropertySupplyDraftFromBarcode('012345678905');
		expect(draft.barcodeValue).toBe('012345678905');
		expect(draft.partNumber).toBe('012345678905');
	});

	it('finds an existing Supply before a scanned duplicate is created', () => {
		const existing = { ...supply('1', 'Air Filter'), barcodeValue: 'ABC-123' };
		expect(findPropertySupplyByBarcode([existing], 'abc-123')?.id).toBe('1');
	});
});
