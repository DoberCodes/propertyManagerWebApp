#!/usr/bin/env node

/**
 * Prune Firestore data that is not connected to active Firebase Auth users.
 *
 * Safety:
 * - Dry-run by default (no writes)
 * - Use --apply for permanent deletion
 *
 * Usage:
 *   node scripts/migratePruneInactiveUserData.cjs
 *   node scripts/migratePruneInactiveUserData.cjs --apply
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

const args = new Set(process.argv.slice(2));
const isDryRun = !args.has('--apply');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const USER_LINK_FIELDS = new Set([
	'userId',
	'ownerId',
	'createdBy',
	'updatedBy',
	'assignedTo',
	'assignedToId',
	'inviterId',
	'invitedBy',
	'tenantId',
	'managerId',
	'fromUserId',
	'sharedWithUserId',
]);

const USER_LINK_ARRAY_FIELDS = new Set([
	'userIds',
	'memberIds',
	'assigneeIds',
	'coOwners',
	'administrators',
	'viewers',
]);

const ACCOUNT_LINK_FIELDS = new Set(['accountId', 'familyAccountId']);
const PROPERTY_LINK_FIELDS = new Set(['propertyId']);

function toStr(value) {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function getNestedValue(obj, path) {
	if (!obj || !path) return undefined;
	return path.split('.').reduce((acc, key) => {
		if (acc && typeof acc === 'object') return acc[key];
		return undefined;
	}, obj);
}

function splitDocPath(path) {
	return String(path || '')
		.split('/')
		.filter(Boolean);
}

function getPathAncestorId(pathSegments, collectionName) {
	for (let i = 0; i < pathSegments.length - 1; i += 2) {
		if (pathSegments[i] === collectionName) {
			return pathSegments[i + 1] || '';
		}
	}
	return '';
}

async function listAllActiveUserIds() {
	const ids = new Set();
	let nextPageToken;

	do {
		const result = await auth.listUsers(1000, nextPageToken);
		for (const user of result.users) {
			ids.add(user.uid);
		}
		nextPageToken = result.pageToken;
	} while (nextPageToken);

	return ids;
}

async function buildConnectivitySeeds(activeUserIds) {
	const activeAccountIds = new Set();
	const activePropertyIds = new Set();

	const memberships = await db.collection('accountMemberships').get();
	for (const doc of memberships.docs) {
		const data = doc.data() || {};
		const userId = toStr(data.userId);
		const accountId = toStr(data.accountId);
		if (userId && accountId && activeUserIds.has(userId)) {
			activeAccountIds.add(accountId);
		}
	}

	const properties = await db.collection('properties').get();
	for (const doc of properties.docs) {
		const data = doc.data() || {};
		const owner = toStr(data.userId) || toStr(data.ownerId);
		const accountId = toStr(data.accountId);
		const coOwners = Array.isArray(data.coOwners) ? data.coOwners : [];
		const administrators = Array.isArray(data.administrators)
			? data.administrators
			: [];
		const viewers = Array.isArray(data.viewers) ? data.viewers : [];

		const linkedToActiveUser =
			(owner && activeUserIds.has(owner)) ||
			coOwners.some((id) => activeUserIds.has(toStr(id))) ||
			administrators.some((id) => activeUserIds.has(toStr(id))) ||
			viewers.some((id) => activeUserIds.has(toStr(id)));

		if (accountId && activeAccountIds.has(accountId)) {
			activePropertyIds.add(doc.id);
			continue;
		}

		if (linkedToActiveUser) {
			activePropertyIds.add(doc.id);
			if (accountId) activeAccountIds.add(accountId);
		}
	}

	return { activeAccountIds, activePropertyIds };
}

function inspectDocConnections(docPath, collectionId, data, seeds) {
	const { activeUserIds, activeAccountIds, activePropertyIds } = seeds;
	const reasons = [];
	let hasLinkSignal = false;

	const pathSegments = splitDocPath(docPath);
	const docId = pathSegments[pathSegments.length - 1] || '';

	if (collectionId === 'familyAccounts') {
		hasLinkSignal = true;
		if (activeAccountIds.has(docId)) {
			return { shouldDelete: false, reason: 'familyAccounts/<active account>' };
		}
		return { shouldDelete: true, reason: 'familyAccounts/<inactive account>' };
	}

	if (collectionId === 'properties') {
		hasLinkSignal = true;
		if (activePropertyIds.has(docId)) {
			return { shouldDelete: false, reason: 'properties/<active property>' };
		}
		return { shouldDelete: true, reason: 'properties/<inactive property>' };
	}

	if (collectionId === 'accountMemberships') {
		hasLinkSignal = true;
		const userId = toStr(data.userId);
		const accountId = toStr(data.accountId);
		if (!userId || !activeUserIds.has(userId)) {
			return {
				shouldDelete: true,
				reason: 'accountMemberships user is not active in Auth',
			};
		}
		if (!accountId || !activeAccountIds.has(accountId)) {
			return {
				shouldDelete: true,
				reason: 'accountMemberships points to inactive account',
			};
		}
		return {
			shouldDelete: false,
			reason: 'accountMemberships linked to active user/account',
		};
	}

	const userAncestorId = getPathAncestorId(pathSegments, 'users');
	if (userAncestorId) {
		hasLinkSignal = true;
		if (activeUserIds.has(userAncestorId)) {
			reasons.push('path:users/<active uid>');
		} else {
			return { shouldDelete: true, reason: 'path:users/<inactive uid>' };
		}
	}

	const propertyAncestorId = getPathAncestorId(pathSegments, 'properties');
	if (propertyAncestorId) {
		hasLinkSignal = true;
		if (activePropertyIds.has(propertyAncestorId)) {
			reasons.push('path:properties/<active property>');
		} else {
			return {
				shouldDelete: true,
				reason: 'path:properties/<inactive property>',
			};
		}
	}

	const accountAncestorId = getPathAncestorId(pathSegments, 'familyAccounts');
	if (accountAncestorId) {
		hasLinkSignal = true;
		if (activeAccountIds.has(accountAncestorId)) {
			reasons.push('path:familyAccounts/<active account>');
		} else {
			return {
				shouldDelete: true,
				reason: 'path:familyAccounts/<inactive account>',
			};
		}
	}

	if (collectionId === 'users') {
		hasLinkSignal = true;
		const userDocId = docId;
		if (activeUserIds.has(userDocId)) {
			reasons.push('users/<active uid>');
		} else {
			return { shouldDelete: true, reason: 'users/<inactive uid>' };
		}
	}

	for (const field of USER_LINK_FIELDS) {
		const value = toStr(getNestedValue(data, field));
		if (!value) continue;
		hasLinkSignal = true;
		if (activeUserIds.has(value)) {
			reasons.push(`field:${field}=active user`);
		}
	}

	for (const field of USER_LINK_ARRAY_FIELDS) {
		const arr = getNestedValue(data, field);
		if (!Array.isArray(arr) || arr.length === 0) continue;
		hasLinkSignal = true;
		if (arr.some((value) => activeUserIds.has(toStr(value)))) {
			reasons.push(`array:${field} contains active user`);
		}
	}

	for (const field of ACCOUNT_LINK_FIELDS) {
		const value = toStr(getNestedValue(data, field));
		if (!value) continue;
		hasLinkSignal = true;
		if (activeAccountIds.has(value)) {
			reasons.push(`field:${field}=active account`);
		}
	}

	for (const field of PROPERTY_LINK_FIELDS) {
		const value = toStr(getNestedValue(data, field));
		if (!value) continue;
		hasLinkSignal = true;
		if (activePropertyIds.has(value)) {
			reasons.push(`field:${field}=active property`);
		}
	}

	const nestedPropertyId = toStr(getNestedValue(data, 'location.propertyId'));
	if (nestedPropertyId) {
		hasLinkSignal = true;
		if (activePropertyIds.has(nestedPropertyId)) {
			reasons.push('field:location.propertyId=active property');
		}
	}

	if (!hasLinkSignal) {
		return {
			shouldDelete: false,
			reason: 'no ownership signals (kept for safety)',
		};
	}

	if (reasons.length > 0) {
		return { shouldDelete: false, reason: reasons.join('; ') };
	}

	return { shouldDelete: true, reason: 'has ownership signals but no active links' };
}

async function processCollectionRecursive(collectionRef, seeds, stats) {
	const collectionPath = collectionRef.path;
	const snapshot = await collectionRef.get();

	if (!stats.collections[collectionPath]) {
		stats.collections[collectionPath] = { scanned: 0, wouldDelete: 0, deleted: 0 };
	}

	let batch = db.batch();
	let pending = 0;

	const flushBatch = async () => {
		if (isDryRun || pending === 0) return;
		await batch.commit();
		batch = db.batch();
		pending = 0;
	};

	for (const doc of snapshot.docs) {
		const docPath = doc.ref.path;
		const data = doc.data() || {};
		stats.collections[collectionPath].scanned += 1;
		stats.scanned += 1;

		const decision = inspectDocConnections(
			docPath,
			doc.ref.parent.id,
			data,
			seeds,
		);

		if (decision.shouldDelete) {
			stats.wouldDelete += 1;
			stats.collections[collectionPath].wouldDelete += 1;
			console.log(
				`${isDryRun ? '[DRY RUN] Would delete' : 'Deleting'} ${docPath} (${decision.reason})`,
			);

			if (!isDryRun) {
				batch.delete(doc.ref);
				pending += 1;
				stats.deleted += 1;
				stats.collections[collectionPath].deleted += 1;
				if (pending >= 400) {
					await flushBatch();
				}
			}
		}

		const subcollections = await doc.ref.listCollections();
		for (const sub of subcollections) {
			await processCollectionRecursive(sub, seeds, stats);
		}
	}

	await flushBatch();
}

async function run() {
	console.log(
		`Starting inactive-user prune (${isDryRun ? 'dry-run' : 'apply'})...`,
	);

	const activeUserIds = await listAllActiveUserIds();
	console.log(`Active Firebase Auth users: ${activeUserIds.size}`);

	const { activeAccountIds, activePropertyIds } = await buildConnectivitySeeds(
		activeUserIds,
	);
	console.log(`Active accounts inferred: ${activeAccountIds.size}`);
	console.log(`Active properties inferred: ${activePropertyIds.size}`);

	const seeds = { activeUserIds, activeAccountIds, activePropertyIds };
	const rootCollections = await db.listCollections();

	const stats = {
		scanned: 0,
		wouldDelete: 0,
		deleted: 0,
		collections: {},
	};

	for (const collectionRef of rootCollections) {
		await processCollectionRecursive(collectionRef, seeds, stats);
	}

	console.log('\nSummary:');
	console.log(`Mode: ${isDryRun ? 'dry-run' : 'apply'}`);
	console.log(`Documents scanned: ${stats.scanned}`);
	console.log(`Documents ${isDryRun ? 'to delete' : 'deleted'}: ${stats.wouldDelete}`);

	const collectionEntries = Object.entries(stats.collections)
		.filter(([, value]) => value.wouldDelete > 0)
		.sort((a, b) => b[1].wouldDelete - a[1].wouldDelete);

	if (collectionEntries.length === 0) {
		console.log('No orphaned documents found based on active-user linkage rules.');
	} else {
		for (const [path, value] of collectionEntries) {
			console.log(
				`  - ${path}: scanned=${value.scanned}, wouldDelete=${value.wouldDelete}, deleted=${value.deleted}`,
			);
		}
	}

	if (isDryRun) {
		console.log('\nRun again with --apply to perform permanent deletions.');
	}
}

run().catch((error) => {
	console.error('Prune script failed:', error);
	process.exit(1);
});
