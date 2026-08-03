const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
	MANAGED_START,
	MANAGED_END,
	USER_NOTES_MARKER,
	parseAdr,
	buildIssueBody,
	buildIssueLabels,
	buildIssuePatch,
} = require('./syncAdrImplementationTrackers.cjs');

const makeAdr = (status = 'Accepted - phased implementation') =>
	parseAdr(
		'project-docs/ADR/0099-example.md',
		`# ADR 0099: Example Decision

Status: ${status}

## Implementation Tracking

- [x] First phase
- [ ] Final phase

## Context
Example.`,
	);

test('parses a structured ADR implementation checklist', () => {
	const adr = makeAdr();

	assert.deepEqual(adr.implementationChecklist, [
		{ checked: true, text: 'First phase' },
		{ checked: false, text: 'Final phase' },
	]);
	assert.match(buildIssueBody(adr), /- \[x\] First phase/);
	assert.match(buildIssueBody(adr), /- \[ \] Final phase/);
});

test('repository ADRs use standard titles and status lines', () => {
	const adrDirectory = path.resolve(__dirname, '../project-docs/ADR');
	const files = fs
		.readdirSync(adrDirectory)
		.filter((file) => /^\d{4}-.+\.md$/.test(file))
		.sort();

	assert.ok(files.length > 0);

	for (const file of files) {
		const content = fs.readFileSync(path.join(adrDirectory, file), 'utf8');
		const expectedNumber = file.slice(0, 4);
		assert.match(
			content,
			new RegExp(`^# ADR ${expectedNumber}: .+`, 'm'),
			`${file} must use the standard numbered ADR title`,
		);
		assert.match(
			content,
			/^Status: .+/m,
			`${file} must use a single-line ADR status`,
		);
	}
});

test('updates only the managed section and preserves tracker notes', () => {
	const adr = makeAdr();
	const initialBody = buildIssueBody(adr);
	const withNotes = initialBody.replace(
		'Human-authored notes added below this line are preserved when the ADR checklist syncs.',
		'Deployment owner: Austin.\n\nKeep this operational note.',
	);
	const updatedAdr = makeAdr('Accepted - in progress');
	const updatedBody = buildIssueBody(updatedAdr, withNotes);

	assert.match(updatedBody, new RegExp(MANAGED_START));
	assert.match(updatedBody, new RegExp(MANAGED_END));
	assert.match(updatedBody, new RegExp(USER_NOTES_MARKER));
	assert.match(updatedBody, /Deployment owner: Austin/);
	assert.match(updatedBody, /Keep this operational note/);
	assert.match(updatedBody, /Accepted - in progress/);
});

test('migrates the unchanged legacy template without duplicating it as notes', () => {
	const adr = makeAdr('Accepted');
	const legacyBody = `<!-- ${adr.marker} -->

This issue tracks implementation of ADR 0099.

ADR:
${adr.filePath}

Current ADR Status:
Accepted

Implementation Checklist
- [ ] Data model / Firestore shape
- [ ] Backend / Functions
- [ ] Rules / permissions
- [ ] UI / user workflow
- [ ] Documentation updates
- [ ] Tests / validation
- [ ] Deployment notes

Completion Criteria
- ADR behavior is implemented.
- Documentation reflects the implemented behavior.
- Tests or manual validation are recorded.
- ADR status is updated to Implemented or Accepted - initial implementation.
`;
	const migratedBody = buildIssueBody(adr, legacyBody);

	assert.match(migratedBody, /Human-authored notes added below this line/);
	assert.doesNotMatch(migratedBody, /Previous tracker body/);
});

test('preserves an edited legacy tracker during managed-section migration', () => {
	const adr = makeAdr('Accepted');
	const editedLegacyBody = `<!-- ${adr.marker} -->

This issue tracks implementation of ADR 0099.

Operator note: preserve this context.`;
	const migratedBody = buildIssueBody(adr, editedLegacyBody);

	assert.match(migratedBody, /Previous tracker body/);
	assert.match(migratedBody, /Operator note: preserve this context/);
});

test('reconciles managed labels while preserving unrelated labels', () => {
	const labels = buildIssueLabels(makeAdr(), [
		{ name: 'needs-planning' },
		{ name: 'customer-impact' },
	]);

	assert.deepEqual(labels, [
		'customer-impact',
		'adr',
		'implementation-tracker',
		'architecture',
		'in-progress',
	]);
});

test('implemented ADR closes an open tracker', () => {
	const adr = makeAdr('Implemented');
	const patch = buildIssuePatch(adr, {
		title: 'ADR 0099 - Example Decision',
		body: buildIssueBody(makeAdr()),
		labels: [{ name: 'in-progress' }],
		state: 'open',
	});

	assert.equal(patch.state, 'closed');
	assert.ok(patch.labels.includes('implemented'));
	assert.ok(!patch.labels.includes('in-progress'));
});

test('accepted ADR never reopens a manually closed tracker', () => {
	const adr = makeAdr();
	const patch = buildIssuePatch(adr, {
		title: 'ADR 0099 - Example Decision',
		body: buildIssueBody(adr),
		labels: buildIssueLabels(adr),
		state: 'closed',
	});

	assert.equal(Object.hasOwn(patch, 'state'), false);
});
