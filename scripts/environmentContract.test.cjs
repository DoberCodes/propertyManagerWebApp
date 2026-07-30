const test = require('node:test');
const assert = require('node:assert/strict');
const { parseEnvironmentContract, defaultFor, entriesFor } = require('./environmentContract.cjs');
const { validateContractCoverage } = require('./validateEnvironmentContract.cjs');

test('parses annotated environment entries', () => {
	const entries = parseEnvironmentContract([
		'# Browser Firebase ----------------------------------------------------------',
		'# @maintley-env scope=web delivery=github-variable environments=development,production required=true developmentDefault=test',
		'REACT_APP_SAMPLE=',
	].join('\n'));
	assert.equal(entries.length, 1);
	assert.equal(entries[0].required, true);
	assert.equal(entries[0].section, 'Browser Firebase');
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
