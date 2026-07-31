const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
	findPlaintextSecretAssignments,
	parseDotenvAssignments,
	removeSecretAssignments,
} = require('./functionsEnvironmentSafety.cjs');
const {
	commandForInvoker,
	selectPublicHttpFunctions,
} = require('./ensureFirebaseFunctionInvokers.cjs');
const {
	validateDevelopmentStripeSecret,
} = require('./validateFirebaseDevelopmentSecrets.cjs');
const {
	validateCallablePreflight,
} = require('./validateCallableFunctionsPreflight.cjs');

test('parses quoted dotenv assignments without exposing values in findings', () => {
	assert.deepEqual(
		Object.fromEntries(parseDotenvAssignments('ONE="value"\nTWO=\n# ignored\n')),
		{ ONE: 'value', TWO: '' },
	);
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'maintley-env-safety-'));
	fs.writeFileSync(path.join(directory, '.env.beta'), 'STRIPE_SECRET_KEY="secret"\n');
	assert.deepEqual(
		findPlaintextSecretAssignments({
			functionsDir: directory,
			secretNames: ['STRIPE_SECRET_KEY', 'RESEND_API_KEY'],
		}).map(({ secretName }) => secretName),
		['STRIPE_SECRET_KEY'],
	);
	fs.rmSync(directory, { recursive: true, force: true });
});

test('removes only Secret Manager assignments from dotenv content', () => {
	assert.equal(
		removeSecretAssignments(
			'APP_URL=https://example.test\nSTRIPE_SECRET_KEY=secret\nEMPTY=\n',
			['STRIPE_SECRET_KEY'],
		),
		'APP_URL=https://example.test\nEMPTY=\n',
	);
});

test('requires Stripe test mode for Maintley Beta', () => {
	assert.doesNotThrow(() => validateDevelopmentStripeSecret('sk_test_example'));
	assert.throws(
		() => validateDevelopmentStripeSecret('sk_live_example'),
		/test-mode secret/,
	);
});

test('selects only callable and HTTPS Functions for public infrastructure invocation', () => {
	const selected = selectPublicHttpFunctions([
		{ id: 'callable', platform: 'gcfv1', region: 'us-central1', callableTrigger: {} },
		{ id: 'http', platform: 'gcfv2', region: 'us-central1', httpsTrigger: {}, runServiceId: 'http-service' },
		{ id: 'scheduled', platform: 'gcfv1', region: 'us-central1', scheduleTrigger: {} },
	]);
	assert.deepEqual(selected.map(({ id }) => id), ['callable', 'http']);
	assert.deepEqual(commandForInvoker(selected[0], 'maintleybeta').slice(0, 3), [
		'functions',
		'add-iam-policy-binding',
		'callable',
	]);
	assert.deepEqual(commandForInvoker(selected[1], 'maintleybeta').slice(0, 3), [
		'run',
		'services',
		'add-iam-policy-binding',
	]);
});

test('accepts a callable preflight only when infrastructure permits the origin', async () => {
	const allowedFetch = async () => ({
		status: 204,
		headers: new Headers({ 'access-control-allow-origin': 'https://maintleybeta.web.app' }),
	});
	await assert.doesNotReject(() =>
		validateCallablePreflight({
			project: 'maintleybeta',
			origin: 'https://maintleybeta.web.app',
			functionName: 'getFamilyMembers',
			fetchImpl: allowedFetch,
		}),
	);
	const forbiddenFetch = async () => ({ status: 403, headers: new Headers() });
	await assert.rejects(
		() =>
			validateCallablePreflight({
				project: 'maintleybeta',
				origin: 'https://maintleybeta.web.app',
				functionName: 'getFamilyMembers',
				fetchImpl: forbiddenFetch,
			}),
		/rejected callable preflight/,
	);
});
