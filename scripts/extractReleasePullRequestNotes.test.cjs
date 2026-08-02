const assert = require('node:assert/strict');
const test = require('node:test');
const {
	CUSTOMER_NOTES_END,
	CUSTOMER_NOTES_START,
	extractCustomerReleaseNotes,
	mergeCustomerNotesMetadata,
} = require('./extractReleasePullRequestNotes.cjs');

test('extracts the marked customer notes block for the prepared version', () => {
	const body = [
		'This PR prepares Maintley v2.13.0 for release.',
		'',
		CUSTOMER_NOTES_START,
		'# Maintley v2.13.0',
		'',
		'## New Features',
		'- Add connected property supplies',
		CUSTOMER_NOTES_END,
		'',
		'Internal footer that must not be published.',
	].join('\n');

	assert.equal(
		extractCustomerReleaseNotes(body, '2.13.0'),
		'# Maintley v2.13.0\n\n## New Features\n- Add connected property supplies\n',
	);
});

test('supports release pull requests created before explicit block markers', () => {
	const body = [
		'This PR prepares Maintley v2.13.0 for release.',
		'',
		'Customer release notes preview:',
		'',
		'# Maintley v2.13.0',
		'',
		'Here is what is new.',
	].join('\n');

	assert.equal(
		extractCustomerReleaseNotes(body, '2.13.0'),
		'# Maintley v2.13.0\n\nHere is what is new.\n',
	);
});

test('rejects notes whose heading does not match the prepared version', () => {
	assert.throws(
		() => extractCustomerReleaseNotes(
			`${CUSTOMER_NOTES_START}\n# Maintley v2.13.1\n${CUSTOMER_NOTES_END}`,
			'2.13.0',
		),
		/heading must be "# Maintley v2\.13\.0"/,
	);
});

test('records the release pull request as the customer-note source', () => {
	const notes = '# Maintley v2.13.0\n';
	assert.deepEqual(
		mergeCustomerNotesMetadata({ counts: { entries: 2 } }, '2.13.0', notes),
		{
			counts: { entries: 2 },
			version: '2.13.0',
			notes,
			customerNotes: notes,
			customerNotesSource: 'release-pull-request-preview',
		},
	);
});
