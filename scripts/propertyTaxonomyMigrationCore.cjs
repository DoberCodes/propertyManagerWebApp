'use strict';

const normalizeLegacyPropertyTaxonomy = (data = {}) => {
	const propertyType = String(data.propertyType || '').trim();
	if (propertyType === 'Single Family' || propertyType === 'Single-Family') {
		return {
			...(propertyType !== 'residential' && { propertyType: 'residential' }),
			...(!data.propertyClassification && { propertyClassification: 'single_family' }),
		};
	}
	if (propertyType === 'Multi-Family') return { propertyType: 'multi_unit' };
	if (propertyType === 'Commercial') return { propertyType: 'commercial' };
	if (!propertyType) {
		return {
			propertyType: 'residential',
			...(!data.propertyClassification && { propertyClassification: 'single_family' }),
		};
	}
	return {};
};

module.exports = { normalizeLegacyPropertyTaxonomy };
