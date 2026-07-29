import {
	getDefaultPropertyClassification,
	getPropertyClassificationOptions,
	isClassificationValidForType,
	normalizePropertyType,
} from './propertyTaxonomy';

describe('property taxonomy', () => {
	it('normalizes legacy broad types without changing their meaning', () => {
		expect(normalizePropertyType('Single Family')).toBe('residential');
		expect(normalizePropertyType('Single-Family')).toBe('residential');
		expect(normalizePropertyType('Multi-Family')).toBe('multi_unit');
		expect(normalizePropertyType('Commercial')).toBe('commercial');
	});

	it('defaults only residential records to a classification', () => {
		expect(getDefaultPropertyClassification('residential')).toBe('single_family');
		expect(getDefaultPropertyClassification('multi_unit')).toBeUndefined();
		expect(getDefaultPropertyClassification('commercial')).toBeUndefined();
	});

	it('keeps classifications within their broad type', () => {
		expect(isClassificationValidForType('residential', 'condo')).toBe(true);
		expect(isClassificationValidForType('residential', 'duplex')).toBe(false);
		expect(getPropertyClassificationOptions('commercial')).toHaveLength(6);
	});
});
