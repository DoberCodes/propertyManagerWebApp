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

const rootDir = path.resolve(__dirname, '..');

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

test('guards shared Beta backend previews with one owner and stable restoration', () => {
	const previewWorkflow = fs.readFileSync(
		path.join(rootDir, '.github', 'workflows', 'firebase-beta-backend-preview.yml'),
		'utf8',
	);
	const stableWorkflow = fs.readFileSync(
		path.join(rootDir, '.github', 'workflows', 'firebase-deploy-environments.yml'),
		'utf8',
	);
	const prepareJob = previewWorkflow.slice(
		previewWorkflow.indexOf('  prepare-backend-preview:'),
		previewWorkflow.indexOf('  beta-backend-preview:'),
	);
	const deployJob = previewWorkflow.slice(
		previewWorkflow.indexOf('  beta-backend-preview:'),
	);

	assert.match(prepareJob, /Wait for required pull request checks/);
	assert.doesNotMatch(prepareJob, /group: firebase-stable-development/);
	assert.match(deployJob, /needs: prepare-backend-preview/);
	assert.match(previewWorkflow, /group: firebase-stable-development/);
	assert.match(previewWorkflow, /HEAD_REPOSITORY.*GITHUB_REPOSITORY/);
	assert.match(previewWorkflow, /gh pr checks .*--required/);
	assert.match(previewWorkflow, /self_check='Deploy or restore Beta backend'/);
	assert.match(previewWorkflow, /\$1 != self/);
	assert.match(previewWorkflow, /--project maintleybeta/);
	assert.match(previewWorkflow, /firebase deploy\s+--project beta/);
	assert.match(
		previewWorkflow,
		/--only functions,firestore:rules,storage/,
	);
	assert.doesNotMatch(previewWorkflow, /--only[^\n]*firestore:indexes/);
	assert.match(previewWorkflow, /github\.event\.pull_request\.merged == false/);
	assert.match(previewWorkflow, /beta-backend-active/);
	assert.match(deployJob, /Revalidate request after acquiring Beta deployment lock/);
	assert.match(deployJob, /CURRENT_SHA.*EXPECTED_SHA/);
	assert.match(deployJob, /HEAD_REPOSITORY.*GITHUB_REPOSITORY/);
	assert.match(deployJob, /PR_STATE.*open/);
	assert.match(stableWorkflow, /ACTIVE_BACKEND_PREVIEWS/);
	assert.match(stableWorkflow, /Clear pull request backend-preview ownership/);
	assert.match(
		stableWorkflow,
		/targets=\("hosting:beta" "functions" "firestore:rules" "storage"\)/,
	);
	assert.doesNotMatch(
		stableWorkflow,
		/targets=\("hosting:beta" "functions" "firestore:rules" "firestore:indexes" "storage"\)/,
	);
});

test('maps the shared Storage target to the correct environment bucket', () => {
	const firebaseConfig = JSON.parse(
		fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'),
	);
	const firebaseRc = JSON.parse(
		fs.readFileSync(path.join(rootDir, '.firebaserc'), 'utf8'),
	);

	assert.deepEqual(firebaseConfig.storage, [
		{ target: 'default', rules: 'storage.rules' },
	]);
	assert.deepEqual(
		firebaseRc.targets.maintleybeta.storage.default,
		['maintleybeta.firebasestorage.app'],
	);
	assert.deepEqual(
		firebaseRc.targets['mypropertymanager-cda42'].storage.default,
		['mypropertymanager-cda42.firebasestorage.app'],
	);
});
