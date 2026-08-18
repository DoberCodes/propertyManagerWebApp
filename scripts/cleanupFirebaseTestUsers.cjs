/**
 * Firebase E2E/Test Data Cleanup Script
 *
 * Cleans up test users and related Firestore data for the account-based flow.
 *
 * Defaults:
 * - Deletes all Auth users matching test email pattern:
 *   test.user.<timestamp>.<random>@maintley-test.com
 * - Cascades deletes/cleanup across account-centric Firestore collections.
 *
 * Options:
 * - --dry-run: log actions without writing/deleting
 * - --include-demo-artifacts: also remove known demo-generated E2E artifacts
 *   (e.g., "RBAC Property ...", "RBAC Task ...")
 *
 * Usage:
 * - node scripts/cleanupFirebaseTestUsers.cjs
 * - node scripts/cleanupFirebaseTestUsers.cjs --dry-run
 * - node scripts/cleanupFirebaseTestUsers.cjs --include-demo-artifacts
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const includeDemoArtifacts = args.has('--include-demo-artifacts');
const targetEmail = String(process.env.E2E_TEST_EMAIL || '').trim().toLowerCase();

function loadServiceAccount() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		try {
			return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
		} catch (error) {
			throw new Error(
				`FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${error.message}`,
			);
		}
	}

	const serviceAccountPath =
		process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
		path.resolve(__dirname, '../serviceAccountKey.json');
	if (!fs.existsSync(serviceAccountPath)) {
		throw new Error(
			`Service account key not found at ${serviceAccountPath}. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or place serviceAccountKey.json at the repo root.`,
		);
	}

	return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
}

const serviceAccount = loadServiceAccount();
const expectedProjectId = process.env.E2E_FIREBASE_PROJECT_ID || '';
if (
	expectedProjectId &&
	serviceAccount.project_id &&
	serviceAccount.project_id !== expectedProjectId
) {
	throw new Error(
		`Refusing to clean Firebase test data for project "${serviceAccount.project_id}" because E2E_FIREBASE_PROJECT_ID is "${expectedProjectId}".`,
	);
}

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const TEST_EMAIL_PATTERN = /^test\.user\.\d+\.\d+@maintley-test\.com$/i;
const RBAC_PROPERTY_TITLE_PATTERN = /^RBAC Property\b/i;
const RBAC_TASK_TITLE_PATTERN = /^RBAC Task\b/i;
const CLEANUP_MARKER_PATTERN = /test property for cleanup/i;

const OWNERSHIP_FIELDS = [
	'userId',
	'accountId',
	'ownerId',
	'fromUserId',
	'sharedWithUserId',
	'inviterId',
	'invitedBy',
];

const EMAIL_FIELDS = [
	'email',
	'sharedWithEmail',
	'toEmail',
	'fromUserEmail',
	'teamMemberEmail',
];

const PROPERTY_RELATION_FIELDS = {
	tasks: ['propertyId'],
	maintenanceHistory: ['propertyId'],
	units: ['propertyId'],
	suites: ['propertyId'],
	devices: ['location.propertyId'],
	contractors: ['propertyId'],
	propertyShares: ['propertyId'],
	userInvitations: ['propertyId'],
	tenantProfiles: ['propertyId'],
	propertyGroupMemberships: ['propertyId', 'groupId'],
	propertySpaces: ['propertyId'],
	propertySupplies: ['propertyId'],
	propertyKnowledgeLinks: ['propertyId'],
	propertyDocuments: ['propertyId'],
	propertyKnowledgeSuggestions: ['propertyId'],
	maintenanceEvents: ['propertyId'],
	maintenanceEventRevisions: ['propertyId'],
	maintleyEvents: ['propertyId'],
};

const COLLECTIONS_TO_SCAN = [
	'users',
	'accountMemberships',
	'familyAccounts',
	'familyInvites',
	'propertyGroups',
	'propertyGroupMemberships',
	'properties',
	'propertySpaces',
	'propertySupplies',
	'propertyKnowledgeLinks',
	'propertyDocuments',
	'propertyKnowledgeSuggestions',
	'propertyShares',
	'userInvitations',
	'tasks',
	'maintenanceHistory',
	'maintenanceEvents',
	'maintenanceEventRevisions',
	'teamGroups',
	'teamMembers',
	'devices',
	'suites',
	'units',
	'favorites',
	'notifications',
	'maintleyEvents',
	'contractors',
	'tenantInvitationCodes',
	'tenantProfiles',
	'teamMemberInvitationCodes',
];

const COLLECTION_GROUPS_TO_SCAN = [
	'entitlementGrants',
	'accessLifecycleDeliveries',
];

function getByPath(obj, path) {
	if (!obj || !path) return undefined;
	return path.split('.').reduce((acc, key) => {
		if (acc && typeof acc === 'object') {
			return acc[key];
		}
		return undefined;
	}, obj);
}

function toStringSafe(value) {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function valueInSet(value, valueSet) {
	const normalized = toStringSafe(value);
	return normalized ? valueSet.has(normalized) : false;
}

function anyArrayValueInSet(arr, valueSet) {
	if (!Array.isArray(arr)) return false;
	for (const value of arr) {
		if (valueInSet(value, valueSet)) {
			return true;
		}
	}
	return false;
}

function isTestEmail(value) {
	const email = toStringSafe(value).toLowerCase();
	return (
		!!email &&
		TEST_EMAIL_PATTERN.test(email) &&
		(!targetEmail || email === targetEmail)
	);
}

function shouldDeleteForOwnership(data, testUserIds, testAccountIds, testEmails) {
	for (const field of OWNERSHIP_FIELDS) {
		const value = toStringSafe(data[field]);
		if (!value) continue;
		if (testUserIds.has(value) || testAccountIds.has(value)) {
			return true;
		}
	}

	for (const field of EMAIL_FIELDS) {
		const value = toStringSafe(data[field]).toLowerCase();
		if (!value) continue;
		if (testEmails.has(value) || isTestEmail(value)) {
			return true;
		}
	}

	if (anyArrayValueInSet(data.memberIds, testUserIds)) return true;
	if (anyArrayValueInSet(data.memberIds, testAccountIds)) return true;

	return false;
}

function shouldDeleteDemoArtifact(collectionName, data) {
	if (!includeDemoArtifacts) return false;

	if (collectionName === 'properties') {
		const title = toStringSafe(data.title);
		const address = toStringSafe(data.address);
		return (
			RBAC_PROPERTY_TITLE_PATTERN.test(title) ||
			CLEANUP_MARKER_PATTERN.test(title) ||
			CLEANUP_MARKER_PATTERN.test(address)
		);
	}

	if (collectionName === 'tasks') {
		const title = toStringSafe(data.title);
		return RBAC_TASK_TITLE_PATTERN.test(title);
	}

	return false;
}

function sanitizeSharedUserArrays(data, testUserIds) {
	const fields = ['coOwners', 'administrators', 'viewers'];
	const updates = {};
	let changed = false;

	for (const field of fields) {
		const currentValue = data[field];
		if (!Array.isArray(currentValue)) continue;

		const cleaned = currentValue.filter((userId) => !valueInSet(userId, testUserIds));
		if (cleaned.length !== currentValue.length) {
			updates[field] = cleaned;
			changed = true;
		}
	}

	return { changed, updates };
}

async function getTestAuthUsers() {
	const testUsers = [];
	let nextPageToken;

	do {
		const result = await auth.listUsers(1000, nextPageToken);
		for (const user of result.users) {
			const email = toStringSafe(user.email).toLowerCase();
			if (isTestEmail(email)) {
				testUsers.push({ uid: user.uid, email });
			}
		}
		nextPageToken = result.pageToken;
	} while (nextPageToken);

	return testUsers;
}

function createBatchManager() {
	let batch = db.batch();
	let pending = 0;

	const stats = {
		deletes: 0,
		updates: 0,
		deletesByCollection: {},
		updatesByCollection: {},
	};

	const bump = (bucket, collectionName) => {
		bucket[collectionName] = (bucket[collectionName] || 0) + 1;
	};

	const commit = async () => {
		if (isDryRun || pending === 0) {
			batch = db.batch();
			pending = 0;
			return;
		}
		await batch.commit();
		batch = db.batch();
		pending = 0;
	};

	const queueDelete = async (docRef, collectionName, reason) => {
		console.log(`🗑️  ${collectionName}/${docRef.id} (${reason})`);
		stats.deletes += 1;
		bump(stats.deletesByCollection, collectionName);

		if (!isDryRun) {
			batch.delete(docRef);
			pending += 1;
			if (pending >= 400) {
				await commit();
			}
		}
	};

	const queueUpdate = async (docRef, collectionName, updates, reason) => {
		console.log(`🧹 ${collectionName}/${docRef.id} (${reason})`);
		stats.updates += 1;
		bump(stats.updatesByCollection, collectionName);

		if (!isDryRun) {
			batch.update(docRef, {
				...updates,
				updatedAt: new Date().toISOString(),
			});
			pending += 1;
			if (pending >= 400) {
				await commit();
			}
		}
	};

	return {
		queueDelete,
		queueUpdate,
		commit,
		stats,
	};
}

async function cleanupFirestoreData(testUsers) {
	const testUserIds = new Set(testUsers.map((u) => u.uid));
	const testEmails = new Set(testUsers.map((u) => u.email));
	const testAccountIds = new Set(testUsers.map((u) => u.uid));

	const batchManager = createBatchManager();
	const propertyIdsToDelete = new Set();
	const propertyGroupIdsToDelete = new Set();

	console.log('\n📦 Phase 1: Identify properties/property-groups to remove...');
	const propertiesSnapshot = await db.collection('properties').get();
	for (const propertyDoc of propertiesSnapshot.docs) {
		const data = propertyDoc.data() || {};
		const ownedByTestUser = shouldDeleteForOwnership(
			data,
			testUserIds,
			testAccountIds,
			testEmails,
		);
		const isDemoArtifact = shouldDeleteDemoArtifact('properties', data);

		if (ownedByTestUser || isDemoArtifact) {
			propertyIdsToDelete.add(propertyDoc.id);
			const groupId = toStringSafe(data.groupId);
			if (groupId) propertyGroupIdsToDelete.add(groupId);
			const accountId = toStringSafe(data.accountId);
			if (accountId) testAccountIds.add(accountId);
		}

		if (!ownedByTestUser && !isDemoArtifact) {
			const { changed, updates } = sanitizeSharedUserArrays(data, testUserIds);
			if (changed) {
				await batchManager.queueUpdate(
					propertyDoc.ref,
					'properties',
					updates,
					'remove test users from shared arrays',
				);
			}
		}
	}

	const propertyGroupsSnapshot = await db.collection('propertyGroups').get();
	for (const groupDoc of propertyGroupsSnapshot.docs) {
		const data = groupDoc.data() || {};
		const shouldDelete =
			propertyGroupIdsToDelete.has(groupDoc.id) ||
			shouldDeleteForOwnership(data, testUserIds, testAccountIds, testEmails);

		if (shouldDelete) {
			propertyGroupIdsToDelete.add(groupDoc.id);
			const accountId = toStringSafe(data.accountId);
			if (accountId) testAccountIds.add(accountId);
		}
	}

	console.log('\n📦 Phase 2: Cascade deletes across Firestore collections...');
	for (const collectionName of COLLECTIONS_TO_SCAN) {
		const snapshot = await db.collection(collectionName).get();
		if (snapshot.empty) continue;

		for (const docSnapshot of snapshot.docs) {
			const data = docSnapshot.data() || {};
			let shouldDelete = shouldDeleteForOwnership(
				data,
				testUserIds,
				testAccountIds,
				testEmails,
			);

			if (!shouldDelete) {
				const relationFields = PROPERTY_RELATION_FIELDS[collectionName] || [];
				for (const fieldPath of relationFields) {
					const relationValue = toStringSafe(getByPath(data, fieldPath));
					if (!relationValue) continue;

					if (fieldPath === 'groupId' && propertyGroupIdsToDelete.has(relationValue)) {
						shouldDelete = true;
						break;
					}

					if (fieldPath !== 'groupId' && propertyIdsToDelete.has(relationValue)) {
						shouldDelete = true;
						break;
					}
				}
			}

			if (!shouldDelete && shouldDeleteDemoArtifact(collectionName, data)) {
				shouldDelete = true;
			}

			if (shouldDelete) {
				if (collectionName === 'properties') {
					propertyIdsToDelete.add(docSnapshot.id);
				}
				if (collectionName === 'propertyGroups') {
					propertyGroupIdsToDelete.add(docSnapshot.id);
				}
				await batchManager.queueDelete(
					docSnapshot.ref,
					collectionName,
					'matched test-data ownership or relation',
				);
			}
		}
	}

	for (const collectionGroupName of COLLECTION_GROUPS_TO_SCAN) {
		const snapshot = await db.collectionGroup(collectionGroupName).get();
		for (const docSnapshot of snapshot.docs) {
			const data = docSnapshot.data() || {};
			if (
				shouldDeleteForOwnership(
					data,
					testUserIds,
					testAccountIds,
					testEmails,
				)
			) {
				await batchManager.queueDelete(
					docSnapshot.ref,
					collectionGroupName,
					'matched test-data ownership in nested account records',
				);
			}
		}
	}

	await batchManager.commit();

	return {
		testUserIds,
		stats: batchManager.stats,
		propertyIdsDeleted: propertyIdsToDelete.size,
		propertyGroupsDeleted: propertyGroupIdsToDelete.size,
	};
}

async function cleanupAuthUsers(testUsers) {
	let authUsersDeleted = 0;

	for (const testUser of testUsers) {
		console.log(`🔐 Remove auth user ${testUser.email} (${testUser.uid})`);
		if (!isDryRun) {
			await auth.deleteUser(testUser.uid);
		}
		authUsersDeleted += 1;
	}

	return authUsersDeleted;
}

async function runCleanup() {
	console.log('🧹 Starting Firebase test-data cleanup...');
	console.log(`   Mode: ${isDryRun ? 'DRY RUN (no writes)' : 'APPLY'}`);
	console.log(
		`   Include demo artifacts: ${includeDemoArtifacts ? 'yes' : 'no'}`,
	);
	console.log(`   Target email: ${targetEmail || 'all matching test users'}`);

	const testUsers = await getTestAuthUsers();
	if (testUsers.length === 0 && !includeDemoArtifacts) {
		console.log(
			'ℹ️ No test users found in Auth and demo artifact cleanup disabled. Nothing to do.',
		);
		return;
	}

	console.log(`\n👤 Matched Auth test users: ${testUsers.length}`);
	testUsers.forEach((user) => console.log(`   - ${user.email} (${user.uid})`));

	const firestoreResult = await cleanupFirestoreData(testUsers);
	const authUsersDeleted = await cleanupAuthUsers(testUsers);
	const remainingTargetUsers = await getTestAuthUsers();
	if (remainingTargetUsers.length > 0) {
		throw new Error(
			`Cleanup verification failed: ${remainingTargetUsers.length} matching Auth user(s) remain.`,
		);
	}

	console.log('\n✅ Cleanup complete');
	console.log(`   Firestore deletes: ${firestoreResult.stats.deletes}`);
	console.log(`   Firestore updates: ${firestoreResult.stats.updates}`);
	console.log(`   Properties targeted: ${firestoreResult.propertyIdsDeleted}`);
	console.log(
		`   Property groups targeted: ${firestoreResult.propertyGroupsDeleted}`,
	);
	console.log(`   Auth users deleted: ${authUsersDeleted}`);

	if (Object.keys(firestoreResult.stats.deletesByCollection).length > 0) {
		console.log('\n📉 Deletes by collection:');
		for (const [collectionName, count] of Object.entries(
			firestoreResult.stats.deletesByCollection,
		)) {
			console.log(`   - ${collectionName}: ${count}`);
		}
	}

	if (Object.keys(firestoreResult.stats.updatesByCollection).length > 0) {
		console.log('\n🧽 Updates by collection:');
		for (const [collectionName, count] of Object.entries(
			firestoreResult.stats.updatesByCollection,
		)) {
			console.log(`   - ${collectionName}: ${count}`);
		}
	}
}

runCleanup()
	.catch((error) => {
		console.error('\n❌ Cleanup failed:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		try {
			await admin.app().delete();
		} catch (shutdownError) {
			console.warn('⚠️ Admin shutdown warning:', shutdownError?.message || shutdownError);
		}
	});
