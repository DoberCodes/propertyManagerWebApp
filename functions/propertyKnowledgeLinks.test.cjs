const test = require('node:test');
const assert = require('node:assert/strict');
const {
	buildPropertyKnowledgeLinkId,
	normalizeSpaceIds,
} = require('./lib/propertyKnowledgeLinks.js');

test('normalizes selected Space IDs deterministically', () => {
	assert.deepEqual(normalizeSpaceIds([' space-b ', 'space-a', 'space-b', '', null]), [
		'space-a',
		'space-b',
	]);
});

test('builds a stable relationship ID from both endpoints', () => {
	const input = {
		propertyId: 'property-1',
		fromType: 'equipment',
		fromId: 'equipment-1',
		relationshipType: 'located_in',
		toType: 'space',
		toId: 'space-1',
	};
	const first = buildPropertyKnowledgeLinkId(input);
	const second = buildPropertyKnowledgeLinkId(input);
	assert.equal(first, second);
	assert.match(first, /^pkl_[a-f0-9]{64}$/);
	assert.notEqual(
		first,
		buildPropertyKnowledgeLinkId({ ...input, toId: 'space-2' }),
	);
	assert.notEqual(
		first,
		buildPropertyKnowledgeLinkId({
			...input,
			fromType: 'task',
			fromId: 'task-1',
			relationshipType: 'occurs_in',
		}),
	);
});
