const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFunctionValues, parseArgs } = require('./bootstrapEnvironment.cjs');

const entries = [
	{
		name: 'STRIPE_PRICE_ID', scope: 'functions', delivery: 'github-variable', environments: ['development'],
		required: true, source: 'REACT_APP_STRIPE_PRICE_ID', example: '', developmentDefault: '', productionDefault: '',
	},
	{
		name: 'ENABLE_FEATURE', scope: 'functions', delivery: 'github-variable', environments: ['development'],
		required: false, source: '', example: 'false', developmentDefault: 'false', productionDefault: 'false',
	},
];

test('derives Functions values from the browser source and safe defaults', () => {
	const result = buildFunctionValues(entries, 'development', [new Map([
		['REACT_APP_STRIPE_PRICE_ID', 'price_test_value'],
	])]);
	assert.deepEqual(Object.fromEntries(result.values), {
		STRIPE_PRICE_ID: 'price_test_value',
		ENABLE_FEATURE: 'false',
	});
	assert.deepEqual(result.missing, []);
});

test('reports required values that cannot be derived', () => {
	assert.deepEqual(buildFunctionValues(entries, 'development', [new Map()]).missing, ['STRIPE_PRICE_ID']);
});

test('supports dry-run, apply, strict, and secret checks', () => {
	assert.deepEqual(parseArgs(['--environment', 'production', '--apply', '--strict', '--check-secrets']), {
		environment: 'production', apply: true, strict: true, checkSecrets: true,
	});
});
