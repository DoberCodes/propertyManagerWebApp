const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const indexes = JSON.parse(
	fs.readFileSync(path.join(projectRoot, 'firestore.indexes.json'), 'utf8'),
).indexes;
const firebaseConfig = JSON.parse(
	fs.readFileSync(path.join(projectRoot, 'firebase.json'), 'utf8'),
);

const hasIndex = (collectionGroup, expectedFields) =>
	indexes.some(
		(index) =>
			index.collectionGroup === collectionGroup &&
			expectedFields.every((expected) =>
				index.fields.some(
					(field) =>
						field.fieldPath === expected.fieldPath &&
						field.order === expected.order,
				),
			),
	);

test('firebase config points to the versioned Firestore index contract', () => {
	assert.equal(firebaseConfig.firestore.indexes, 'firestore.indexes.json');
});

test('versioned indexes cover the ordered invite and notification queries', () => {
	assert.equal(
		hasIndex('familyInvites', [
			{ fieldPath: 'accountId', order: 'ASCENDING' },
			{ fieldPath: 'createdAt', order: 'DESCENDING' },
		]),
		true,
	);
	assert.equal(
		hasIndex('notifications', [
			{ fieldPath: 'userId', order: 'ASCENDING' },
			{ fieldPath: 'createdAt', order: 'DESCENDING' },
		]),
		true,
	);
});

test('versioned indexes cover task reminder deduplication', () => {
	assert.equal(
		hasIndex('notifications', [
			{ fieldPath: 'type', order: 'ASCENDING' },
			{ fieldPath: 'data.taskId', order: 'ASCENDING' },
			{ fieldPath: 'data.notificationId', order: 'ASCENDING' },
			{ fieldPath: 'createdAt', order: 'ASCENDING' },
		]),
		true,
	);
});
