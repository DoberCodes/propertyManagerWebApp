'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
	OUTCOMES,
	planLegacyTaskSpaceLinks,
} = require('./taskSpaceMigrationCore.cjs');

const task = (id, location, overrides = {}) => ({
	id,
	data: {
		accountId: 'account-1',
		propertyId: 'property-1',
		location,
		...overrides,
	},
});

const space = (id, name, overrides = {}) => ({
	id,
	data: {
		accountId: 'account-1',
		propertyId: 'property-1',
		name,
		isArchived: false,
		...overrides,
	},
});

test('plans only a unique exact normalized Task-to-Space match', () => {
	const [result] = planLegacyTaskSpaceLinks({
		tasks: [task('task-1', '  Living   Room ')],
		spaces: [space('space-1', 'Living Room'), space('space-2', 'Kitchen')],
	});

	assert.equal(result.outcome, OUTCOMES.READY);
	assert.equal(result.spaceId, 'space-1');
	assert.equal(result.link.source, 'migration');
	assert.match(result.linkId, /^pkl_[a-f0-9]{64}$/);
});

test('does not guess when no exact match exists or duplicate names are ambiguous', () => {
	const results = planLegacyTaskSpaceLinks({
		tasks: [task('task-1', 'Living'), task('task-2', 'Kitchen')],
		spaces: [
			space('space-1', 'Living Room'),
			space('space-2', 'Kitchen'),
			space('space-3', 'kitchen'),
		],
	});

	assert.equal(results[0].outcome, OUTCOMES.UNMATCHED);
	assert.equal(results[1].outcome, OUTCOMES.AMBIGUOUS);
});

test('ignores archived Spaces and remains repeat-safe for an existing link', () => {
	const archived = planLegacyTaskSpaceLinks({
		tasks: [task('task-1', 'Garage')],
		spaces: [space('space-1', 'Garage', { isArchived: true })],
	});
	assert.equal(archived[0].outcome, OUTCOMES.UNMATCHED);

	const existing = planLegacyTaskSpaceLinks({
		tasks: [task('task-1', 'Garage')],
		spaces: [space('space-1', 'Garage')],
		links: [
			{
				id: 'link-1',
				data: {
					fromType: 'task',
					fromId: 'task-1',
					relationshipType: 'occurs_in',
					toType: 'space',
					toId: 'space-1',
				},
			},
		],
	});
	assert.equal(existing[0].outcome, OUTCOMES.ALREADY_LINKED);
});

test('never crosses Property or account boundaries', () => {
	const [result] = planLegacyTaskSpaceLinks({
		tasks: [task('task-1', 'Kitchen')],
		spaces: [
			space('space-1', 'Kitchen', { propertyId: 'property-2' }),
			space('space-2', 'Kitchen', { accountId: 'account-2' }),
		],
	});
	assert.equal(result.outcome, OUTCOMES.UNMATCHED);
});
