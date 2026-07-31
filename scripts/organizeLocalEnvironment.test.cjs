const test = require('node:test');
const assert = require('node:assert/strict');

const {
	formatControlDotenv,
	formatDotenv,
	selectLocalOverrideEntries,
	selectContractValues,
	validateEnvironment,
	valuesWithPrefix,
} = require('./organizeLocalEnvironment.cjs');

test('selects only values for the requested environment prefix', () => {
	assert.deepEqual(Object.fromEntries(valuesWithPrefix(new Map([
		['BETA_REACT_APP_FIREBASE_PROJECT_ID', 'maintleybeta'],
		['PROD_REACT_APP_FIREBASE_PROJECT_ID', 'production'],
	]), 'BETA_')), {
		REACT_APP_FIREBASE_PROJECT_ID: 'maintleybeta',
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
	const selected = selectContractValues(entries, 'development', () => true, [new Map([
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
	assert.deepEqual(Object.fromEntries(selectContractValues(entries, 'development', () => true, [new Map()])), {
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

test('formats one organized control file for local, beta, and production', () => {
	const entries = [{ name: 'REACT_APP_FIREBASE_PROJECT_ID', section: 'Browser Firebase' }];
	const formatted = formatControlDotenv(new Map([
		['local', new Map([['REACT_APP_FIREBASE_PROJECT_ID', 'local']])],
		['beta', new Map([['REACT_APP_FIREBASE_PROJECT_ID', 'beta']])],
		['production', new Map([['REACT_APP_FIREBASE_PROJECT_ID', 'prod']])],
	]), new Map([
		['local', entries],
		['beta', entries],
		['production', entries],
	]), new Map([
		['beta', [{ name: 'STRIPE_SECRET_KEY', required: true }]],
	]), {
		localRequired: [{ name: 'KEYSTORE_PASSWORD' }],
		localOptional: [{ name: 'STRIPE_TEST_SECRET_KEY' }],
		github: [{ name: 'E2E_DEMO_PASSWORD' }],
	});
	assert.match(formatted, /LOCAL_REACT_APP_FIREBASE_PROJECT_ID="local"/);
	assert.match(formatted, /BETA_REACT_APP_FIREBASE_PROJECT_ID="beta"/);
	assert.match(formatted, /PROD_REACT_APP_FIREBASE_PROJECT_ID="prod"/);
	assert.match(formatted, /# Required: STRIPE_SECRET_KEY/);
	assert.match(formatted, /# KEYSTORE_PASSWORD/);
	assert.match(formatted, /# STRIPE_TEST_SECRET_KEY/);
	assert.match(formatted, /# E2E_DEMO_PASSWORD/);
});

test('keeps only local differences and explicitly local-only entries as overrides', () => {
	const entries = [
		{ name: 'SHARED', delivery: 'github-variable' },
		{ name: 'DIFFERENT', delivery: 'github-variable' },
		{ name: 'EMULATOR', delivery: 'local-only' },
	];
	const selected = selectLocalOverrideEntries(
		entries,
		new Map([['SHARED', 'same'], ['DIFFERENT', 'local'], ['EMULATOR', 'localhost']]),
		new Map([['SHARED', 'same'], ['DIFFERENT', 'beta']]),
	);
	assert.deepEqual(selected.map(({ name }) => name), ['DIFFERENT', 'EMULATOR']);
});
