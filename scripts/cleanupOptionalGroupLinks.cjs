#!/usr/bin/env node

/**
 * Cleanup script for optional property/team group links.
 *
 * Default mode is dry-run.
 * Use --apply to persist changes.
 *
 * Targets:
 * - properties.groupId that is empty/invalid -> removed
 * - teamMembers.groupId that is empty/invalid -> removed
 * - propertyGroupMemberships rows with missing property/group or empty ids -> deleted
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

async function commitUpdates(updates, dryRun) {
	if (updates.length === 0) return 0;
	if (dryRun) return updates.length;

	let updated = 0;
	for (let i = 0; i < updates.length; i += 450) {
		const slice = updates.slice(i, i + 450);
		const batch = db.batch();
		for (const item of slice) {
			batch.update(item.ref, item.data);
		}
		await batch.commit();
		updated += slice.length;
	}
	return updated;
}

async function commitDeletes(refs, dryRun) {
	if (refs.length === 0) return 0;
	if (dryRun) return refs.length;

	let deleted = 0;
	for (let i = 0; i < refs.length; i += 450) {
		const slice = refs.slice(i, i + 450);
		const batch = db.batch();
		for (const ref of slice) {
			batch.delete(ref);
		}
		await batch.commit();
		deleted += slice.length;
	}
	return deleted;
}

function normalizeId(value) {
	if (typeof value !== 'string') return '';
	return value.trim();
}

async function run() {
	const mode = isDryRun ? 'dry-run' : 'apply';
	console.log(`Starting optional-group cleanup (${mode})...`);

	const [propertyGroupsSnap, teamGroupsSnap, propertiesSnap, teamMembersSnap, membershipsSnap] =
		await Promise.all([
			db.collection('propertyGroups').get(),
			db.collection('teamGroups').get(),
			db.collection('properties').get(),
			db.collection('teamMembers').get(),
			db.collection('propertyGroupMemberships').get(),
		]);

	const propertyGroupIds = new Set(propertyGroupsSnap.docs.map((doc) => doc.id));
	const teamGroupIds = new Set(teamGroupsSnap.docs.map((doc) => doc.id));
	const propertyIds = new Set(propertiesSnap.docs.map((doc) => doc.id));

	const summary = {
		mode,
		propertiesScanned: propertiesSnap.size,
		teamMembersScanned: teamMembersSnap.size,
		membershipsScanned: membershipsSnap.size,
		propertiesGroupCleared: 0,
		teamMembersGroupCleared: 0,
		membershipsDeleted: 0,
		totalChanges: 0,
	};

	const propertyUpdates = [];
	for (const propertyDoc of propertiesSnap.docs) {
		const data = propertyDoc.data() || {};
		if (!Object.prototype.hasOwnProperty.call(data, 'groupId')) {
			continue;
		}

		const rawGroupId = data.groupId;
		const normalizedGroupId = normalizeId(rawGroupId);
		const shouldClear =
			rawGroupId == null ||
			normalizedGroupId.length === 0 ||
			!propertyGroupIds.has(normalizedGroupId);

		if (shouldClear) {
			propertyUpdates.push({
				ref: propertyDoc.ref,
				data: {
					groupId: admin.firestore.FieldValue.delete(),
					updatedAt: new Date().toISOString(),
				},
			});
		}
	}

	const teamMemberUpdates = [];
	for (const teamMemberDoc of teamMembersSnap.docs) {
		const data = teamMemberDoc.data() || {};
		if (!Object.prototype.hasOwnProperty.call(data, 'groupId')) {
			continue;
		}

		const rawGroupId = data.groupId;
		const normalizedGroupId = normalizeId(rawGroupId);
		const shouldClear =
			rawGroupId == null ||
			normalizedGroupId.length === 0 ||
			!teamGroupIds.has(normalizedGroupId);

		if (shouldClear) {
			teamMemberUpdates.push({
				ref: teamMemberDoc.ref,
				data: {
					groupId: admin.firestore.FieldValue.delete(),
					updatedAt: new Date().toISOString(),
				},
			});
		}
	}

	const membershipDeletes = [];
	for (const membershipDoc of membershipsSnap.docs) {
		const data = membershipDoc.data() || {};
		const groupId = normalizeId(data.groupId);
		const propertyId = normalizeId(data.propertyId);

		const hasValidGroup = groupId.length > 0 && propertyGroupIds.has(groupId);
		const hasValidProperty = propertyId.length > 0 && propertyIds.has(propertyId);

		if (!hasValidGroup || !hasValidProperty) {
			membershipDeletes.push(membershipDoc.ref);
		}
	}

	summary.propertiesGroupCleared = await commitUpdates(propertyUpdates, isDryRun);
	summary.teamMembersGroupCleared = await commitUpdates(teamMemberUpdates, isDryRun);
	summary.membershipsDeleted = await commitDeletes(membershipDeletes, isDryRun);

	summary.totalChanges =
		summary.propertiesGroupCleared +
		summary.teamMembersGroupCleared +
		summary.membershipsDeleted;

	console.log('Cleanup summary:');
	console.table(summary);

	if (isDryRun) {
		console.log('Dry-run complete. Re-run with --apply to execute changes.');
	} else {
		console.log('Apply complete. Invalid/empty group links have been cleaned.');
	}
}

run().catch((error) => {
	console.error('Optional-group cleanup failed:', error);
	process.exit(1);
});
