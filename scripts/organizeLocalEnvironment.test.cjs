const test = require('node:test');
const assert = require('node:assert/strict');

const {
	formatDotenv,
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
