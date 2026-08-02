const assert = require('node:assert/strict');
const test = require('node:test');
const { validateWorkflowPolicy } = require('./validateWorkflowPolicy.cjs');

test('GitHub Actions workflows satisfy the repository policy', () => {
	assert.deepEqual(validateWorkflowPolicy(), []);
});
