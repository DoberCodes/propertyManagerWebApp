const test = require('node:test');
const assert = require('node:assert/strict');

const {
	buildDesiredVariables,
	buildPlan,
	environmentConfigs,
	findFirebaseSecrets,
	parseArgs,
	parseDotenv,
	verifyVariableNames,
} = require('./syncGitHubEnvironment.cjs');

const manifest = {
	requiredReactKeys: [
		'REACT_APP_FIREBASE_PROJECT_ID',
		'REACT_APP_STRIPE_PUBLIC_KEY',
	],
	functionVariableKeys: ['STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID'],
	firebaseSecretKeys: ['STRIPE_SECRET_KEY'],
};

const development = {
	githubEnvironment: 'development',
	destinationPrefix: 'DEV_',
	firebaseProjectId: 'maintleybeta',
	stripePublishablePrefix: 'pk_test_',
};

test('parses dotenv without exposing comments or invalid keys', () => {
	const values = parseDotenv([
		'# comment',
		'REACT_APP_FIREBASE_PROJECT_ID=maintleybeta',
		'export REACT_APP_STRIPE_PUBLIC_KEY="pk_test_value"',
		'invalid-key=no',
	].join('\n'));
	assert.deepEqual(Object.fromEntries(values), {
		REACT_APP_FIREBASE_PROJECT_ID: 'maintleybeta',
		REACT_APP_STRIPE_PUBLIC_KEY: 'pk_test_value',
	});
});

test('requires explicit confirmation before pruning', () => {
	assert.throws(() => parseArgs(['--environment', 'development', '--prune']));
	assert.deepEqual(
		parseArgs([
			'--environment',
			'development',
			'--apply',
			'--prune',
			'--confirm-prune',
			'development',
		]),
		{
			environment: 'development',
			reactFile: '',
			functionsFile: '',
			apply: true,
			prune: true,
			confirmPrune: 'development',
			repository: '',
		},
	);
});

test('maps browser and non-secret Functions variables with an environment prefix', () => {
	const reactValues = new Map([
		['REACT_APP_FIREBASE_PROJECT_ID', 'maintleybeta'],
		['REACT_APP_STRIPE_PUBLIC_KEY', 'pk_test_value'],
		['REACT_APP_OPTIONAL', 'enabled'],
	]);
	const functionValues = new Map([
		['STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID', 'price_test'],
		['STRIPE_SECRET_KEY', 'must-not-upload'],
	]);
	const desired = buildDesiredVariables({
		reactValues,
		functionValues,
		manifest,
		environmentConfig: development,
	});
	assert.deepEqual(Object.fromEntries(desired), {
		DEV_REACT_APP_FIREBASE_PROJECT_ID: 'maintleybeta',
		DEV_REACT_APP_STRIPE_PUBLIC_KEY: 'pk_test_value',
		DEV_REACT_APP_OPTIONAL: 'enabled',
		DEV_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID: 'price_test',
	});
	assert.deepEqual(findFirebaseSecrets(functionValues, manifest), ['STRIPE_SECRET_KEY']);
});

test('release validation reuses production browser values without Functions configuration', () => {
	assert.deepEqual(environmentConfigs['release-validation'], {
		githubEnvironment: 'release-validation',
		destinationPrefix: 'PROD_',
		defaultReactFile: '.env.prod',
		defaultFunctionsFile: '',
		firebaseProjectId: 'mypropertymanager-cda42',
		stripePublishablePrefix: 'pk_live_',
	});
});

test('rejects cross-environment Firebase and Stripe values', () => {
	assert.throws(() => buildDesiredVariables({
		reactValues: new Map([
			['REACT_APP_FIREBASE_PROJECT_ID', 'mypropertymanager-cda42'],
			['REACT_APP_STRIPE_PUBLIC_KEY', 'pk_test_value'],
		]),
		functionValues: null,
		manifest,
		environmentConfig: development,
	}));
	assert.throws(() => buildDesiredVariables({
		reactValues: new Map([
			['REACT_APP_FIREBASE_PROJECT_ID', 'maintleybeta'],
			['REACT_APP_STRIPE_PUBLIC_KEY', 'pk_live_value'],
		]),
		functionValues: null,
		manifest,
		environmentConfig: development,
	}));
});

test('prunes only managed environment-prefixed names', () => {
	const desired = new Map([['DEV_REACT_APP_FIREBASE_PROJECT_ID', 'maintleybeta']]);
	const plan = buildPlan({
		desired,
		existingNames: new Set([
			'DEV_REACT_APP_FIREBASE_PROJECT_ID',
			'DEV_REACT_APP_OLD',
			'DEV_GOOGLE_SERVICE_ACCOUNT',
		]),
		destinationPrefix: 'DEV_',
	});
	assert.deepEqual(plan.stale, ['DEV_REACT_APP_OLD']);
});

test('retries verification while GitHub environment writes propagate', () => {
	let attempt = 0;
	const missing = verifyVariableNames(['ONE', 'TWO'], () => {
		attempt += 1;
		return new Set(attempt === 1 ? ['ONE'] : ['ONE', 'TWO']);
	}, { attempts: 2, delayMs: 0 });
	assert.deepEqual(missing, []);
	assert.equal(attempt, 2);
});
