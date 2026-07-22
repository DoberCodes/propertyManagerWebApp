const test = require('node:test');
const assert = require('node:assert/strict');

const {
	getReleasePrepVersionFromSubject,
	selectAutomaticReleaseVersion,
} = require('./generateReleaseNotes.cjs');

test('recognizes merged and branch release-preparation commit subjects', () => {
	assert.equal(getReleasePrepVersionFromSubject('Release v2.8.2 (#69)'), '2.8.2');
	assert.equal(getReleasePrepVersionFromSubject('release: prepare v2.8.2'), '2.8.2');
	assert.equal(getReleasePrepVersionFromSubject('Improve public navigation (#68)'), '');
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
