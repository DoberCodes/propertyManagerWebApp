const test = require('node:test');
const assert = require('node:assert/strict');
const {
	buildFunctionValues,
	formatDotenv,
	parseArgs,
	readGitHubVariableOverrides,
	summarizeFirebaseCommandFailure,
} = require('./bootstrapEnvironment.cjs');

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

test('reads prefixed GitHub environment variables without retaining the delivery prefix', () => {
	assert.deepEqual(Object.fromEntries(readGitHubVariableOverrides('development', JSON.stringify({
		DEV_STRIPE_PRICE_ID: 'price_test',
		PROD_STRIPE_PRICE_ID: 'price_live',
	}))), {
		STRIPE_PRICE_ID: 'price_test',
	});
});

test('groups generated Functions values in manifest order', () => {
	const formatted = formatDotenv('development', new Map([
		['STRIPE_PRICE_ID', ''],
		['APP_URL', 'https://example.test'],
	]), [
		{ name: 'STRIPE_PRICE_ID', section: 'Functions Stripe pricing' },
		{ name: 'APP_URL', section: 'Functions application identity' },
	]);
	assert.ok(formatted.indexOf('# Functions Stripe pricing') < formatted.indexOf('# Functions application identity'));
	assert.match(formatted, /STRIPE_PRICE_ID=""/);
});

test('summarizes Firebase authorization failures without requiring command output passthrough', () => {
	assert.equal(summarizeFirebaseCommandFailure({
		status: 1,
		stdout: '',
		stderr: "Error: Permission 'secretmanager.secrets.get' denied for resource.",
	}), "Error: Permission 'secretmanager.secrets.get' denied for resource.");
});
