const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEnvironmentContract, defaultFor, entriesFor } = require('./environmentContract.cjs');
const {
	extractDefinedFirebaseSecretNames,
	validateContractCoverage,
	validateFirebaseSecretCoverage,
} = require('./validateEnvironmentContract.cjs');

test('parses annotated environment entries', () => {
	const entries = parseEnvironmentContract([
		'# Browser Firebase ----------------------------------------------------------',
		'# @maintley-env scope=web delivery=github-variable environments=development,production required=true developmentDefault=test localDefault=local-test',
		'REACT_APP_SAMPLE=',
	].join('\n'));
	assert.equal(entries.length, 1);
	assert.equal(entries[0].required, true);
	assert.equal(entries[0].section, 'Browser Firebase');
	assert.equal(entries[0].localDefault, 'local-test');
	assert.equal(defaultFor(entries[0], 'development'), 'test');
	assert.equal(entriesFor(entries, 'production').length, 1);
});

test('requires metadata for every dotenv entry', () => {
	assert.throws(() => parseEnvironmentContract('UNDECLARED=value'), /missing a # @maintley-env declaration/);
});

test('reports Maintley-owned runtime variables missing from the contract', () => {
	const entries = [{ name: 'REACT_APP_KNOWN' }];
	assert.deepEqual(
		validateContractCoverage(entries, new Set(['REACT_APP_KNOWN', 'REACT_APP_NEW', 'NODE_ENV'])),
		['REACT_APP_NEW'],
	);
});

test('requires defineSecret and defineJsonSecret declarations in the Firebase secret contract', () => {
	const defined = extractDefinedFirebaseSecretNames(`
		const API_KEY = defineSecret('API_KEY');
		const LEGACY_CONFIG = defineJsonSecret<Record<string, any>>(
			'LEGACY_CONFIG',
		);
	`);
	assert.deepEqual([...defined], ['API_KEY', 'LEGACY_CONFIG']);
	assert.deepEqual(
		validateFirebaseSecretCoverage([
			{ name: 'API_KEY', scope: 'functions', delivery: 'firebase-secret' },
		], defined),
		['LEGACY_CONFIG'],
	);
});
