const assert = require('node:assert/strict');
const test = require('node:test');
const {
	ACCOUNT_DELETION_BATCH_SIZE,
	buildAccountDeletionStoragePrefixes,
	chunkItems,
	mergeAccessRemovalUpdates,
	removeIdFromArray,
} = require('./lib/accountDeletionCore.js');

test('account deletion chunks remain below the Firestore write limit', () => {
	const chunks = chunkItems(
		Array.from({ length: 1001 }, (_, index) => index),
	);

	assert.equal(ACCOUNT_DELETION_BATCH_SIZE, 400);
	assert.deepEqual(chunks.map((chunk) => chunk.length), [400, 400, 201]);
	assert.throws(() => chunkItems([1], 501));
});

test('account deletion Storage prefixes are deterministic and deduplicated', () => {
	assert.deepEqual(
		buildAccountDeletionStoragePrefixes({
			userId: 'user-1',
			accountIds: ['account-2', 'account-1', 'account-1'],
			propertyIds: ['property-1', 'property-1'],
		}),
		[
			'device-files/property-1/',
			'feedback-attachments/user-1/',
			'maintenance-files/property-1/',
			'properties/account-1/',
			'properties/account-2/',
			'team-member-files/account-1/',
			'team-member-files/account-2/',
			'team-member-images/account-1/',
			'team-member-images/account-2/',
			'user-profile-images/user-1/',
		],
	);
});

test('account access cleanup removes only the deleted user id', () => {
	assert.deepEqual(removeIdFromArray(['user-1', 'user-2', 'user-1'], 'user-1'), [
		'user-2',
	]);
});

test('account access cleanup preserves every field update for the same property', () => {
	assert.deepEqual(
		mergeAccessRemovalUpdates(
			{
				data: { coOwners: ['user-2'] },
				removedUserFields: ['coOwners'],
			},
			{
				data: { viewers: ['user-3'] },
				removedUserFields: ['viewers'],
			},
		),
		{
			data: { coOwners: ['user-2'], viewers: ['user-3'] },
			removedUserFields: ['coOwners', 'viewers'],
		},
	);
});
