const test = require('node:test');
const assert = require('node:assert/strict');

const {
	formatDotenv,
	selectContractValues,
	splitRootValues,
	validateEnvironment,
} = require('./organizeLocalEnvironment.cjs');

test('separates browser values from operational values', () => {
	const result = splitRootValues(new Map([
		['REACT_APP_FIREBASE_PROJECT_ID', 'project'],
		['GITHUB_TOKEN', 'secret'],
	]));
	assert.deepEqual(Object.fromEntries(result.react), {
		REACT_APP_FIREBASE_PROJECT_ID: 'project',
	});
	assert.deepEqual(Object.fromEntries(result.operations), {
		GITHUB_TOKEN: 'secret',
	});
});

test('rejects project and Stripe mode mismatches', () => {
	assert.throws(() => validateEnvironment(new Map([
		['REACT_APP_FIREBASE_PROJECT_ID', 'production'],
		['REACT_APP_STRIPE_PUBLIC_KEY', 'pk_test_value'],
	]), {
		projectId: 'development',
		stripePrefix: 'pk_test_',
		label: 'Development',
	}));
	assert.throws(() => validateEnvironment(new Map([
		['REACT_APP_FIREBASE_PROJECT_ID', 'development'],
		['REACT_APP_STRIPE_PUBLIC_KEY', 'pk_live_value'],
	]), {
		projectId: 'development',
		stripePrefix: 'pk_test_',
		label: 'Development',
	}));
});

test('formats values without printing them in metadata', () => {
	const formatted = formatDotenv('Example', new Map([['TOKEN', 'value with spaces']]));
	assert.match(formatted, /TOKEN="value with spaces"/);
});

test('selects every declared value, retaining empty placeholders and safe defaults', () => {
	const entries = [
		{ name: 'REACT_APP_ONE', scope: 'web', environments: ['development'], developmentDefault: '', example: '' },
		{ name: 'REACT_APP_TWO', scope: 'web', environments: ['development'], developmentDefault: 'false', example: '' },
	];
	const selected = selectContractValues(entries, 'development', 'web', [new Map([
		['REACT_APP_ONE', 'configured'],
		['REACT_APP_LEGACY', 'ignored'],
	])]);
	assert.deepEqual(Object.fromEntries(selected), {
		REACT_APP_ONE: 'configured',
		REACT_APP_TWO: 'false',
	});
});

test('retains an empty placeholder for an unconfigured declared value', () => {
	const entries = [
		{ name: 'REACT_APP_REQUIRED', scope: 'web', environments: ['development'], developmentDefault: '', example: '' },
	];
	assert.deepEqual(Object.fromEntries(selectContractValues(entries, 'development', 'web', [new Map()])), {
		REACT_APP_REQUIRED: '',
	});
});

test('formats values in manifest order with section headings', () => {
	const values = new Map([
		['REACT_APP_FIREBASE_PROJECT_ID', 'maintleybeta'],
		['REACT_APP_STRIPE_PRICE_ID', ''],
	]);
	const formatted = formatDotenv('Example', values, [
		{ name: 'REACT_APP_FIREBASE_PROJECT_ID', section: 'Browser Firebase' },
		{ name: 'REACT_APP_STRIPE_PRICE_ID', section: 'Browser Stripe' },
	]);
	assert.ok(formatted.indexOf('# Browser Firebase') < formatted.indexOf('# Browser Stripe'));
	assert.match(formatted, /REACT_APP_STRIPE_PRICE_ID=""/);
});
