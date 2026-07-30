const test = require('node:test');
const assert = require('node:assert/strict');

const {
	getReleasePrepVersionFromSubject,
	selectMergedReleaseBoundary,
	selectAutomaticReleaseVersion,
} = require('./generateReleaseNotes.cjs');

test('recognizes merged and branch release-preparation commit subjects', () => {
	assert.equal(getReleasePrepVersionFromSubject('Release v2.8.2 (#69)'), '2.8.2');
	assert.equal(getReleasePrepVersionFromSubject('release: prepare v2.8.2'), '2.8.2');
	assert.equal(getReleasePrepVersionFromSubject('Improve public navigation (#68)'), '');
});

test('uses the latest merged release as the boundary when tags are behind', () => {
	const result = selectMergedReleaseBoundary(
		[
			{ sha: 'feature-2', subject: 'Improve documents (#108)' },
			{ sha: 'release-123', subject: 'Release v2.12.3 (#107)' },
			{ sha: 'feature-1', subject: 'Improve team access (#106)' },
			{ sha: 'release-122', subject: 'Release v2.12.2 (#105)' },
		],
		'feature-2',
	);

	assert.deepEqual(result, {
		sha: 'release-123',
		subject: 'Release v2.12.3 (#107)',
	});
});

test('skips the target release merge and uses the preceding release boundary', () => {
	const result = selectMergedReleaseBoundary(
		[
			{ sha: 'release-124', subject: 'Release v2.12.4 (#109)' },
			{ sha: 'feature-2', subject: 'Improve documents (#108)' },
			{ sha: 'release-123', subject: 'Release v2.12.3 (#107)' },
		],
		'release-124',
	);

	assert.equal(result.sha, 'release-123');
});

test('keeps the prepared version when HEAD is its matching release merge', () => {
	const result = selectAutomaticReleaseVersion({
		packageVersion: '2.8.2',
		previousVersion: '2.8.0',
		selectedBump: 'patch',
		hasEntries: true,
		targetReleasePrepVersion: '2.8.2',
	});

	assert.equal(result.selectedAutomaticVersion, '2.8.2');
	assert.equal(result.targetIsMatchingReleasePrep, true);
	assert.equal(result.shouldBumpPreparedPackageVersion, false);
});

test('bumps from the prepared version after another product change lands', () => {
	const result = selectAutomaticReleaseVersion({
		packageVersion: '2.8.2',
		previousVersion: '2.8.0',
		selectedBump: 'patch',
		hasEntries: true,
		targetReleasePrepVersion: '',
	});

	assert.equal(result.selectedAutomaticVersion, '2.8.3');
	assert.equal(result.targetIsMatchingReleasePrep, false);
	assert.equal(result.shouldBumpPreparedPackageVersion, true);
});

test('does not lock the package version to a mismatched release subject', () => {
	const result = selectAutomaticReleaseVersion({
		packageVersion: '2.8.2',
		previousVersion: '2.8.0',
		selectedBump: 'patch',
		hasEntries: true,
		targetReleasePrepVersion: '2.8.1',
	});

	assert.equal(result.selectedAutomaticVersion, '2.8.3');
	assert.equal(result.targetIsMatchingReleasePrep, false);
});
