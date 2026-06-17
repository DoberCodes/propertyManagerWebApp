#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const shouldCleanupOrphans = args.includes('--cleanup-orphans');
const shouldCleanupLegacyGroupId = args.includes('--cleanup-legacy-groupid');
const shouldDropDeprecatedCollections = args.includes('--drop-deprecated-collections');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SERVICE_ACCOUNT_PATH =
	process.env.GOOGLE_APPLICATION_CREDENTIALS ||
	path.resolve(PROJECT_ROOT, 'serviceAccountKey.json');

const PROPERTY_GROUP_MEMBERSHIPS_COLLECTION = 'propertyGroupMemberships';

const DEPRECATED_COLLECTIONS = [
	// Intentionally empty for now.
	// Add a collection name here before using --drop-deprecated-collections.
];

function toEpochMillis(value, fallback = Date.now()) {
	if (!value) return fallback;
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		return Number.isNaN(parsed) ? fallback : parsed;
	}
	if (typeof value.toMillis === 'function') {
		return value.toMillis();
	}
	if (typeof value.seconds === 'number') {
		return value.seconds * 1000;
	}
	return fallback;
}

function getCredential() {
	if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
		throw new Error(
			`Service account key not found at ${SERVICE_ACCOUNT_PATH}. Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json at repo root.`,
		);
	}

	const key = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
	if (key.project_id) {
		process.env.GCLOUD_PROJECT = key.project_id;
		process.env.GOOGLE_CLOUD_PROJECT = key.project_id;
	}
	return admin.credential.cert(key);
}

function initFirestore() {
	if (!admin.apps.length) {
		admin.initializeApp({ credential: getCredential() });
	}
	return admin.firestore();
}

async function fetchAll(collectionRef) {
	const snapshot = await collectionRef.get();
	return snapshot.docs;
}

async function commitDeletes(db, refs, dryRun) {
	if (refs.length === 0) return 0;
	if (dryRun) return refs.length;

	let deleted = 0;
	for (let i = 0; i < refs.length; i += 450) {
		const chunk = refs.slice(i, i + 450);
		const batch = db.batch();
		chunk.forEach((ref) => batch.delete(ref));
		await batch.commit();
		deleted += chunk.length;
	}

	return deleted;
}

async function commitUpdates(db, updates, dryRun) {
	if (updates.length === 0) return 0;
	if (dryRun) return updates.length;

	let updated = 0;
	for (let i = 0; i < updates.length; i += 450) {
		const chunk = updates.slice(i, i + 450);
		const batch = db.batch();
		chunk.forEach(({ ref, data }) => batch.update(ref, data));
		await batch.commit();
		updated += chunk.length;
	}

	return updated;
}

async function run() {
	const dryRun = !shouldApply;
	console.log('--- Property Group Membership Migration ---');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'APPLY (writes enabled)'}`);
	console.log(`Cleanup orphans: ${shouldCleanupOrphans ? 'yes' : 'no'}`);
	console.log(
		`Cleanup legacy property.groupId: ${shouldCleanupLegacyGroupId ? 'yes' : 'no'}`,
	);
	console.log(
		`Drop deprecated collections: ${shouldDropDeprecatedCollections ? 'yes' : 'no'}`,
	);

	const db = initFirestore();

	const [propertyDocs, groupDocs, membershipDocs, userDocs] = await Promise.all([
		fetchAll(db.collection('properties')),
		fetchAll(db.collection('propertyGroups')),
		fetchAll(db.collection(PROPERTY_GROUP_MEMBERSHIPS_COLLECTION)),
		fetchAll(db.collection('users')),
	]);

	const groupsById = new Map(groupDocs.map((d) => [d.id, d.data()]));
	const usersById = new Map(userDocs.map((d) => [d.id, d.data()]));

	const membershipsByPropertyId = new Map();
	for (const membershipDoc of membershipDocs) {
		const membership = membershipDoc.data() || {};
		const propertyId = String(membership.propertyId || '').trim();
		if (!propertyId) continue;
		const existing = membershipsByPropertyId.get(propertyId) || [];
		existing.push({ id: membershipDoc.id, ref: membershipDoc.ref, data: membership });
		membershipsByPropertyId.set(propertyId, existing);
	}

	const report = {
		totalProperties: propertyDocs.length,
		totalGroups: groupDocs.length,
		totalMemberships: membershipDocs.length,
		createdMemberships: 0,
		updatedMemberships: 0,
		deletedMemberships: 0,
		cleanedLegacyGroupId: 0,
		orphans: {
			propertiesMissingGroup: 0,
			propertiesMissingAccount: 0,
			propertiesWithInvalidGroup: 0,
			membershipMissingProperty: 0,
			membershipMissingGroup: 0,
			membershipAccountMismatch: 0,
		},
		deprecatedCollections: [],
	};

	const membershipCreates = [];
	const membershipUpdates = [];
	const membershipDeletes = [];
	const propertyUpdates = [];

	const propertiesById = new Map(propertyDocs.map((d) => [d.id, d.data()]));

	for (const propertyDoc of propertyDocs) {
		const property = propertyDoc.data() || {};
		const propertyId = propertyDoc.id;
		const createdAtMillis = toEpochMillis(property.createdAt, Date.now());

		let accountId = String(property.accountId || '').trim();
		const legacyGroupId = String(property.groupId || '').trim();

		if (!accountId && legacyGroupId && groupsById.has(legacyGroupId)) {
			accountId = String(groupsById.get(legacyGroupId).accountId || '').trim();
		}

		if (!accountId && property.userId) {
			const userData = usersById.get(String(property.userId)) || {};
			accountId = String(userData.accountId || '').trim();
		}

		const propertyMemberships = membershipsByPropertyId.get(propertyId) || [];
		const matchingMembership = accountId
			? propertyMemberships.find(
					(entry) => String(entry.data.accountId || '').trim() === accountId,
			  )
			: propertyMemberships[0];

		if (!accountId) {
			report.orphans.propertiesMissingAccount += 1;
		}

		if (!matchingMembership) {
			if (!legacyGroupId) {
				report.orphans.propertiesMissingGroup += 1;
				continue;
			}

			const groupData = groupsById.get(legacyGroupId);
			if (!groupData) {
				report.orphans.propertiesWithInvalidGroup += 1;
				continue;
			}

			const membershipAccountId =
				accountId || String(groupData.accountId || groupData.userId || '').trim();
			if (!membershipAccountId) {
				report.orphans.propertiesMissingAccount += 1;
				continue;
			}

			membershipCreates.push({
				accountId: membershipAccountId,
				groupId: legacyGroupId,
				propertyId,
				sortOrder: createdAtMillis,
				createdAt: new Date(createdAtMillis).toISOString(),
				updatedAt: new Date().toISOString(),
			});
			continue;
		}

		if (
			legacyGroupId &&
			String(matchingMembership.data.groupId || '').trim() !== legacyGroupId
		) {
			membershipUpdates.push({
				ref: matchingMembership.ref,
				data: {
					groupId: legacyGroupId,
					updatedAt: new Date().toISOString(),
				},
			});
		}

		if (shouldCleanupLegacyGroupId && legacyGroupId) {
			propertyUpdates.push({
				ref: propertyDoc.ref,
				data: {
					groupId: admin.firestore.FieldValue.delete(),
					updatedAt: new Date().toISOString(),
				},
			});
		}
	}

	for (const membershipDoc of membershipDocs) {
		const membership = membershipDoc.data() || {};
		const propertyId = String(membership.propertyId || '').trim();
		const groupId = String(membership.groupId || '').trim();
		const accountId = String(membership.accountId || '').trim();

		const propertyExists = propertyId && propertiesById.has(propertyId);
		const groupExists = groupId && groupsById.has(groupId);

		if (!propertyExists) {
			report.orphans.membershipMissingProperty += 1;
			membershipDeletes.push(membershipDoc.ref);
			continue;
		}

		if (!groupExists) {
			report.orphans.membershipMissingGroup += 1;
			membershipDeletes.push(membershipDoc.ref);
			continue;
		}

		const groupData = groupsById.get(groupId) || {};
		const groupAccountId = String(groupData.accountId || '').trim();
		if (groupAccountId && accountId && groupAccountId !== accountId) {
			report.orphans.membershipAccountMismatch += 1;
		}
	}

	if (shouldDropDeprecatedCollections && DEPRECATED_COLLECTIONS.length > 0) {
		for (const collectionName of DEPRECATED_COLLECTIONS) {
			const docs = await fetchAll(db.collection(collectionName));
			report.deprecatedCollections.push({
				collection: collectionName,
				documents: docs.length,
			});
			if (!dryRun && docs.length > 0) {
				await commitDeletes(
					db,
					docs.map((d) => d.ref),
					false,
				);
			}
		}
	} else {
		for (const collectionName of DEPRECATED_COLLECTIONS) {
			const docs = await fetchAll(db.collection(collectionName));
			report.deprecatedCollections.push({
				collection: collectionName,
				documents: docs.length,
			});
		}
	}

	if (!dryRun) {
		if (membershipCreates.length > 0) {
			for (let i = 0; i < membershipCreates.length; i += 450) {
				const chunk = membershipCreates.slice(i, i + 450);
				const batch = db.batch();
				chunk.forEach((payload) => {
					const ref = db.collection(PROPERTY_GROUP_MEMBERSHIPS_COLLECTION).doc();
					batch.set(ref, payload);
				});
				await batch.commit();
			}
		}

		report.updatedMemberships = await commitUpdates(db, membershipUpdates, false);
		report.cleanedLegacyGroupId = await commitUpdates(db, propertyUpdates, false);
		report.deletedMemberships = shouldCleanupOrphans
			? await commitDeletes(db, membershipDeletes, false)
			: 0;
	} else {
		report.createdMemberships = membershipCreates.length;
		report.updatedMemberships = membershipUpdates.length;
		report.cleanedLegacyGroupId = propertyUpdates.length;
		report.deletedMemberships = shouldCleanupOrphans ? membershipDeletes.length : 0;
	}

	if (!dryRun) {
		report.createdMemberships = membershipCreates.length;
	}

	console.log('\n--- Migration Summary ---');
	console.log(`Properties scanned: ${report.totalProperties}`);
	console.log(`Property groups scanned: ${report.totalGroups}`);
	console.log(`Memberships scanned: ${report.totalMemberships}`);
	console.log(`Memberships created: ${report.createdMemberships}`);
	console.log(`Memberships updated: ${report.updatedMemberships}`);
	console.log(`Memberships deleted: ${report.deletedMemberships}`);
	console.log(`Legacy property.groupId cleaned: ${report.cleanedLegacyGroupId}`);

	console.log('\nOrphan scan:');
	Object.entries(report.orphans).forEach(([key, value]) => {
		console.log(`- ${key}: ${value}`);
	});

	if (DEPRECATED_COLLECTIONS.length === 0) {
		console.log(
			'\nDeprecated collections: none configured to remove (no collection is currently marked obsolete).',
		);
	} else {
		console.log('\nDeprecated collections scan:');
		report.deprecatedCollections.forEach((entry) => {
			console.log(`- ${entry.collection}: ${entry.documents} docs`);
		});
	}

	if (dryRun) {
		console.log('\nDry run complete. Re-run with --apply to persist changes.');
	}
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Migration failed:', error);
		process.exit(1);
	});
