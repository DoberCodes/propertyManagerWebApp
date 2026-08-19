const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveBetaVersion } = require('./resolveBetaVersion.cjs');

test('uses the accumulated pull request count for a stable Beta build', () => {
	assert.deepEqual(
		resolveBetaVersion({
			candidateMetadata: { version: '2.15.0', pullRequests: 3 },
		}),
		{ label: 'v2.15.0-beta.3', sequence: 3, version: '2.15.0' },
	);
});

test('projects the next PR number from the current Beta base', () => {
	assert.deepEqual(
		resolveBetaVersion({
			baseMetadata: { version: '2.15.0', pullRequests: 3 },
			candidateMetadata: { version: '2.15.0', pullRequests: 1 },
		}),
		{ label: 'v2.15.0-beta.4', sequence: 4, version: '2.15.0' },
	);
});

test('keeps the higher candidate version when the current PR raises the release impact', () => {
	assert.deepEqual(
		resolveBetaVersion({
			baseMetadata: { version: '2.14.1', pullRequests: 1 },
			candidateMetadata: { version: '2.15.0', pullRequests: 1 },
		}),
		{ label: 'v2.15.0-beta.2', sequence: 2, version: '2.15.0' },
	);
});

test('does not lower an accumulated candidate for a later patch PR', () => {
	assert.deepEqual(
		resolveBetaVersion({
			baseMetadata: { version: '2.15.0', pullRequests: 2 },
			candidateMetadata: { version: '2.14.1', pullRequests: 1 },
		}),
		{ label: 'v2.15.0-beta.3', sequence: 3, version: '2.15.0' },
	);
});
