#!/usr/bin/env node

/**
 * Cleanup script for retired shared-properties feature data.
 *
 * Default behavior is dry-run.
 * Use --apply to execute deletions.
 *
 * Targets:
 * - propertyShares (all docs)
 * - userInvitations where permission indicates property sharing
 * - notifications of share-related types
 * - propertyGroups named "Shared Properties" (case-insensitive)
 * - teamGroups named "Shared Properties" (case-insensitive)
 * - propertyGroupMemberships linked to removed shared property groups
 */

const path = require('path');
const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));
const isApply = args.has('--apply');
const isDryRun = !isApply;

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
}

const db = admin.firestore();

const SHARE_PERMISSIONS = ['viewer', 'admin', 'co-owner'];
const SHARE_NOTIFICATION_TYPES = ['share_invitation', 'share_invitation_accepted'];
const SHARED_GROUP_NAME = 'shared properties';

async function chunkedDelete(docRefs, dryRun) {
	if (docRefs.length === 0) return 0;
	if (dryRun) return docRefs.length;

	let deleted = 0;
	for (let i = 0; i < docRefs.length; i += 450) {
		const batch = db.batch();
		const slice = docRefs.slice(i, i + 450);
		slice.forEach((ref) => batch.delete(ref));
		await batch.commit();
		deleted += slice.length;
	}
	return deleted;
}

async function getAllDocs(collectionName) {
	const snap = await db.collection(collectionName).get();
	return snap.docs;
}

async function getSharePropertyGroups() {
	const docs = await getAllDocs('propertyGroups');
	return docs.filter((d) => {
		const name = String(d.data()?.name || '').trim().toLowerCase();
		return name === SHARED_GROUP_NAME;
	});
}

async function getShareTeamGroups() {
	const docs = await getAllDocs('teamGroups');
	return docs.filter((d) => {
		const name = String(d.data()?.name || '').trim().toLowerCase();
		return name === SHARED_GROUP_NAME;
	});
}

async function cleanup() {
	const summary = {
		mode: isDryRun ? 'dry-run' : 'apply',
		propertyShares: 0,
		userInvitations: 0,
		notifications: 0,
		propertyGroups: 0,
		teamGroups: 0,
		propertyGroupMemberships: 0,
		total: 0,
	};

	console.log(`Starting shared-properties cleanup (${summary.mode})...`);

	// 1) propertyShares: remove all
	const propertySharesDocs = await getAllDocs('propertyShares');
	summary.propertyShares = await chunkedDelete(
		propertySharesDocs.map((d) => d.ref),
		isDryRun,
	);

	// 2) userInvitations: remove share-related invitations by permission
	const invitationsQuery = await db
		.collection('userInvitations')
		.where('permission', 'in', SHARE_PERMISSIONS)
		.get();
	summary.userInvitations = await chunkedDelete(
		invitationsQuery.docs.map((d) => d.ref),
		isDryRun,
	);

	// 3) notifications: remove share-related notification types
	const notificationsQuery = await db
		.collection('notifications')
		.where('type', 'in', SHARE_NOTIFICATION_TYPES)
		.get();
	summary.notifications = await chunkedDelete(
		notificationsQuery.docs.map((d) => d.ref),
		isDryRun,
	);

	// 4) propertyGroups: remove groups named Shared Properties
	const sharedPropertyGroups = await getSharePropertyGroups();
	const sharedPropertyGroupIds = new Set(sharedPropertyGroups.map((d) => d.id));
	summary.propertyGroups = await chunkedDelete(
		sharedPropertyGroups.map((d) => d.ref),
		isDryRun,
	);

	// 5) propertyGroupMemberships: remove rows linked to removed shared groups
	if (sharedPropertyGroupIds.size > 0) {
		const membershipDocs = await getAllDocs('propertyGroupMemberships');
		const toDeleteMemberships = membershipDocs.filter((d) =>
			sharedPropertyGroupIds.has(String(d.data()?.groupId || '')),
		);
		summary.propertyGroupMemberships = await chunkedDelete(
			toDeleteMemberships.map((d) => d.ref),
			isDryRun,
		);
	}

	// 6) teamGroups: remove groups named Shared Properties
	const sharedTeamGroups = await getShareTeamGroups();
	summary.teamGroups = await chunkedDelete(
		sharedTeamGroups.map((d) => d.ref),
		isDryRun,
	);

	summary.total =
		summary.propertyShares +
		summary.userInvitations +
		summary.notifications +
		summary.propertyGroups +
		summary.teamGroups +
		summary.propertyGroupMemberships;

	console.log('Cleanup summary:');
	console.table(summary);

	if (isDryRun) {
		console.log('Dry-run complete. Re-run with --apply to execute deletions.');
	} else {
		console.log('Apply complete. Shared-properties related data has been removed.');
	}
}

cleanup().catch((error) => {
	console.error('Shared-properties cleanup failed:', error);
	process.exit(1);
});
