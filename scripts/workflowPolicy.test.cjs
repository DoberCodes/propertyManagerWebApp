const assert = require('node:assert/strict');
const test = require('node:test');
const {
	validateActionReferences,
	validateWorkflowPolicy,
} = require('./validateWorkflowPolicy.cjs');

test('GitHub Actions workflows satisfy the repository policy', () => {
	assert.deepEqual(validateWorkflowPolicy(), []);
});

test('rejects mutable or undocumented external Action references', () => {
	const mutableIssues = [];
	validateActionReferences(
		'    uses: actions/checkout@v5',
		'.github/workflows/example.yml',
		mutableIssues,
	);
	assert.equal(mutableIssues.length, 2);
	assert.match(mutableIssues[0], /immutable 40-character commit SHA/);
	assert.match(mutableIssues[1], /release-version comment/);

	const pinnedIssues = [];
	validateActionReferences(
		'    uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0',
		'.github/workflows/example.yml',
		pinnedIssues,
	);
	validateActionReferences(
		'    uses: ./.github/workflows/local.yml',
		'.github/workflows/example.yml',
		pinnedIssues,
	);
	assert.deepEqual(pinnedIssues, []);
});
