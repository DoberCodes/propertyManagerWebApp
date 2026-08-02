const assert = require('node:assert/strict');
const test = require('node:test');
const { classifyWorkflowChanges } = require('./workflowChangeClassification.cjs');

test('documentation-only changes avoid product and backend classifications', () => {
	assert.deepEqual(
		classifyWorkflowChanges(['project-docs/docs/Operations/TESTING.md']),
		{
			backend: false,
			ci: false,
			documentation_only: true,
			e2e: false,
			frontend: false,
			paths: ['project-docs/docs/Operations/TESTING.md'],
			release_only: false,
		},
	);
});

test('frontend changes select browser coverage', () => {
	const result = classifyWorkflowChanges(['src/pages/Dashboard.tsx']);
	assert.equal(result.frontend, true);
	assert.equal(result.e2e, true);
	assert.equal(result.backend, false);
});

test('Functions and rules changes select backend coverage', () => {
	const result = classifyWorkflowChanges(['functions/index.ts', 'firestore.rules']);
	assert.equal(result.backend, true);
	assert.equal(result.frontend, false);
});

test('release-only changes are recognized independently', () => {
	const result = classifyWorkflowChanges([
		'package.json',
		'client/package.json',
		'android/app/build.gradle',
	]);
	assert.equal(result.release_only, true);
	assert.equal(result.frontend, true);
});
