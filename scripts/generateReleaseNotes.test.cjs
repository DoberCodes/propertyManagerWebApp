const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
	formatCustomerReleaseNotes,
	getReleasePrepVersionFromSubject,
	inferBump,
	inferCustomerCategory,
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

test('selects the highest reachable release when merge ancestry is not first-parent ordered', () => {
	const result = selectMergedReleaseBoundary(
		[
			{ sha: 'prep-125', subject: 'release: prepare v2.12.5' },
			{ sha: 'release-122', subject: 'Release v2.12.2 (#105)' },
			{ sha: 'feature-2', subject: 'Repair branch ancestry (#135)' },
			{ sha: 'release-124', subject: 'Release v2.12.4 (#109)' },
			{ sha: 'release-123', subject: 'Release v2.12.3 (#107)' },
		],
		'feature-2',
	);

	assert.equal(result.sha, 'release-124');
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

test('classifies features as minor releases and customer-facing new features', () => {
	assert.equal(inferBump({ title: 'feat: add connected property supplies', labels: [], body: '' }), 'minor');
	assert.equal(
		inferCustomerCategory({
			title: 'feat: add connected property supplies',
			labels: [],
			files: ['src/pages/PropertyDetailPage/SuppliesSection.tsx'],
			body: '',
			engineeringCategory: 'highlights',
		}),
		'whatsNew',
	);
});

test('classifies fixes as patch releases and customer-facing fixes', () => {
	assert.equal(inferBump({ title: 'fix: preserve archived relationships', labels: [], body: '' }), 'patch');
	assert.equal(
		inferCustomerCategory({
			title: 'fix: preserve archived relationships',
			labels: [],
			files: ['src/example.ts'],
			body: '',
			engineeringCategory: 'fixes',
		}),
		'fixes',
	);
});

test('does not treat pull request template guidance as a breaking change', () => {
	const template = fs
		.readFileSync(path.join(__dirname, '..', '.github', 'pull_request_template.md'), 'utf8')
		.replace(
			'Release type: <!-- feat, feat!, fix, perf, refactor, docs, chore, ci, build, or test -->',
			'Release type: fix',
		);

	assert.equal(
		inferBump({
			title: 'fix: complete property supplies workspace',
			labels: [],
			body: template,
		}),
		'patch',
	);
});

test('keeps explicit breaking declarations as major releases', () => {
	assert.equal(
		inferBump({
			title: 'Update the property model',
			labels: [],
			body: 'BREAKING CHANGE: Existing integrations must use the new endpoint.',
		}),
		'major',
	);
});

test('keeps internal maintenance out of customer release notes', () => {
	assert.equal(inferBump({ title: 'ci: validate PR titles', labels: [], body: '' }), 'none');
	assert.equal(
		inferCustomerCategory({
			title: 'ci: validate PR titles',
			labels: [],
			files: ['.github/workflows/pull-request-summary.yml'],
			body: '',
			engineeringCategory: 'maintenance',
		}),
		'',
	);
});

test('allows explicit release-impact labels to override inferred bumps', () => {
	assert.equal(
		inferBump({ title: 'fix: compatibility repair', labels: ['release:minor'], body: '' }),
		'minor',
	);
	assert.equal(
		inferBump({ title: 'feat: internal prototype', labels: ['release:none'], body: '' }),
		'none',
	);
});

test('keeps an explicit feature label in New Features even when backend files changed', () => {
	assert.equal(
		inferCustomerCategory({
			title: 'Add connected property supplies',
			labels: ['feature'],
			files: ['functions/propertyKnowledgeLinks.ts'],
			body: '',
			engineeringCategory: 'backend',
		}),
		'whatsNew',
	);
});

test('renders features separately from improvements', () => {
	const notes = formatCustomerReleaseNotes({
		version: '2.13.0',
		entries: [
			{ customerCategory: 'whatsNew', customerSummary: 'Add connected property supplies' },
			{ customerCategory: 'improvements', customerSummary: 'Improve dashboard responsiveness' },
		],
	});
	assert.match(notes, /## New Features[\s\S]*Add connected property supplies/);
	assert.match(notes, /## Improvements[\s\S]*Improve dashboard responsiveness/);
});
