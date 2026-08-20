import {
	formatPropertyAddress,
	getPropertyAddressFormValues,
	isCompletePropertyAddress,
} from './propertyAddress';

describe('propertyAddress', () => {
	it('formats a complete structured address for compatibility displays', () => {
		expect(
			formatPropertyAddress({
				streetAddress: '123 Main Street',
				unit: 'Apt 4',
				city: 'Columbus',
				state: 'oh',
				postalCode: '43215',
				countryCode: 'US',
			}),
		).toBe('123 Main Street, Apt 4, Columbus, OH 43215');
	});

	it('presents an unambiguous legacy address in structured fields', () => {
		expect(
			getPropertyAddressFormValues(
				'123 Main Street, Apt 4, Columbus, OH 43215',
			),
		).toEqual({
			streetAddress: '123 Main Street',
			unit: 'Apt 4',
			city: 'Columbus',
			state: 'OH',
			postalCode: '43215',
			countryCode: 'US',
		});
	});

	it('does not guess missing legacy address components', () => {
		expect(getPropertyAddressFormValues('123 Main Street')).toEqual({
			streetAddress: '123 Main Street',
			unit: '',
			city: '',
			state: '',
			postalCode: '',
			countryCode: 'US',
		});
	});

	it('requires a valid US state abbreviation and ZIP code', () => {
		expect(
			isCompletePropertyAddress({
				streetAddress: '123 Main Street',
				city: 'Columbus',
				state: 'OH',
				postalCode: '43215-1234',
				countryCode: 'US',
			}),
		).toBe(true);
		expect(
			isCompletePropertyAddress({
				streetAddress: '123 Main Street',
				city: 'Columbus',
				state: 'Ohio',
				postalCode: '43215',
				countryCode: 'US',
			}),
		).toBe(false);
	});
});
