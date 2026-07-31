const test = require('node:test');
const assert = require('node:assert/strict');

const {
	SUMMARY_END,
	SUMMARY_START,
	buildSummary,
	redactSensitiveText,
	updatePullRequestBody,
} = require('./generatePullRequestSummary.cjs');

const metadata = {
	files: [
		{ filename: 'functions/example.ts', additions: 12, deletions: 2 },
		{ filename: '.github/workflows/example.yml', additions: 5, deletions: 1 },
		{ filename: 'scripts/example.test.cjs', additions: 20, deletions: 0 },
	],
	commits: [{ commit: { message: 'Secure Beta deployment\n\nLonger details' } }],
};

test('builds a deterministic summary from metadata without file contents', () => {
	const summary = buildSummary(metadata);
	assert.match(summary, /3 changed files · \+37 \/ -3/);
	assert.match(summary, /Firebase Functions: 1 file/);
	assert.match(summary, /CI\/CD and release automation: 1 file/);
	assert.match(summary, /Secure Beta deployment/);
	assert.match(summary, /1 automated test file changed/);
});

test('replaces only the marked block and preserves manual content', () => {
	const existing = [
		'## Customer Release Note',
		'',
		'Manual customer context.',
		'',
		SUMMARY_START,
		'Old generated text',
		SUMMARY_END,
		'',
		'## Notes',
		'',
		'Manual deployment note.',
	].join('\n');
	const updated = updatePullRequestBody(existing, 'New generated text');
	assert.match(updated, /Manual customer context\./);
	assert.match(updated, /Manual deployment note\./);
	assert.match(updated, /New generated text/);
	assert.doesNotMatch(updated, /Old generated text/);
});

test('appends a marked block when an older PR body has no markers', () => {
	const updated = updatePullRequestBody('## Summary\n\nManual text.', 'Generated text');
	assert.match(updated, /Manual text\.[\s\S]*maintley-pr-summary:start/);
	assert.equal((updated.match(/maintley-pr-summary:start/g) || []).length, 1);
});

test('rejects incomplete marker blocks instead of overwriting the body', () => {
	assert.throws(
		() => updatePullRequestBody(`Manual text\n${SUMMARY_START}\nOld text`, 'New text'),
		/malformed Maintley summary marker block/,
	);
});

test('redacts common provider secrets and secret assignments in commit subjects', () => {
	const unsafe =
		'Rotate sk_live_example123 and whsec_example123 with RESEND_API_KEY=re_example123456789';
	const safe = redactSensitiveText(unsafe);
	assert.doesNotMatch(safe, /sk_live_example123|whsec_example123|re_example123456789/);
	assert.match(safe, /\[redacted Stripe key\]/);
	assert.match(safe, /\[redacted webhook secret\]/);
});

test('neutralizes summary markers supplied through commit subjects', () => {
	const summary = buildSummary({
		files: [{ filename: 'src/example.ts', additions: 1, deletions: 0 }],
		commits: [{ commit: { message: `Try ${SUMMARY_END} injection` } }],
	});
	assert.doesNotMatch(summary, new RegExp(SUMMARY_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	assert.match(summary, /&lt;!-- maintley-pr-summary:end --&gt;/);
});
