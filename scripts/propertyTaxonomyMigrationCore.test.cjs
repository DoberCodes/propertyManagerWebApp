'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLegacyPropertyTaxonomy } = require('./propertyTaxonomyMigrationCore.cjs');

test('maps single-family records and supplies the only safe inferred classification', () => {
	assert.deepEqual(normalizeLegacyPropertyTaxonomy({ propertyType: 'Single Family' }), {
		propertyType: 'residential',
		propertyClassification: 'single_family',
	});
});

test('maps multi-unit and commercial records without guessing classification', () => {
	assert.deepEqual(normalizeLegacyPropertyTaxonomy({ propertyType: 'Multi-Family' }), {
		propertyType: 'multi_unit',
	});
	assert.deepEqual(normalizeLegacyPropertyTaxonomy({ propertyType: 'Commercial' }), {
		propertyType: 'commercial',
	});
});

test('is repeat-safe and preserves existing classification', () => {
	assert.deepEqual(
		normalizeLegacyPropertyTaxonomy({ propertyType: 'residential', propertyClassification: 'condo' }),
		{},
	);
	assert.deepEqual(
		normalizeLegacyPropertyTaxonomy({ propertyType: 'Single Family', propertyClassification: 'condo' }),
		{ propertyType: 'residential' },
	);
});
