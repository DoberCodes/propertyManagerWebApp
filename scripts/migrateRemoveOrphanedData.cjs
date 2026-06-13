#!/usr/bin/env node

/**
 * Migration script to remove all data not connected to current users or properties.
 * Safe to run repeatedly — supports dry-run preview before applying changes.
 *
 * USAGE:
 *   node scripts/migrateRemoveOrphanedData.cjs           (dry-run, safe preview)
 *   node scripts/migrateRemoveOrphanedData.cjs --apply   (permanently delete orphans)
 *
 * HOW TO MAINTAIN AS APP EXPANDS:
 * ===============================
 * 1. Add new user-owned collections to COLLECTION_CONFIG.userOwned
 * 2. Add new property-related collections to COLLECTION_CONFIG.propertyRelated
 * 3. Add new shared user array fields to COLLECTION_CONFIG.sharedUserArrays
 *
 * The script handles:
 * - Phase 1: Direct user ownership (documents with userId field pointing to deleted user)
 * - Phase 2: Property relationships (documents referencing a deleted propertyId)
 * - Phase 3: Shared user references (arrays containing deleted user IDs)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const isDryRun = !process.argv.includes('--apply');
if (isDryRun) {
	console.log('🔍 DRY RUN MODE — no data will be deleted.');
	console.log('   Pass --apply to permanently remove orphaned documents.\n');
} else {
	console.log('⚠️  APPLY MODE — orphaned data will be permanently deleted.\n');
}

/**
 * Configuration for collections and their relationships.
 * Add new collections here as the app expands.
 */
const COLLECTION_CONFIG = {
	// Collections with direct user ownership — orphaned when user is deleted
	// field can be '__docId' to use the Firestore document id as the user id.
	userOwned: [
		{ name: 'propertyGroups', field: 'userId' },
		{ name: 'teamGroups', field: 'userId' },
		{ name: 'teamMembers', field: 'userId' },
		{ name: 'favorites', field: 'userId' },
		{ name: 'tasks', field: 'userId' }, // Tasks can also be property-related (checked in Phase 2)
		{ name: 'users', field: '__docId' }, // USER PROFILE DATA — CRITICAL
		{ name: 'notifications', field: 'userId' },
		{ name: 'contractors', field: 'userId' },
		{ name: 'maintenanceHistory', field: 'userId' },
		{ name: 'tenantProfiles', field: 'landlordId' },
		{ name: 'accountMemberships', field: 'userId' },
		{ name: 'familyInvites', field: 'createdByUserId' },
		{ name: 'tenantInvitationCodes', field: 'createdByUserId' },
		{ name: 'teamMemberInvitationCodes', field: 'createdByUserId' },
		{ name: 'tenantPromoCodes', field: 'userId' },
		{ name: 'teamMemberPromoCodes', field: 'userId' },
		{ name: 'activityLogs', field: 'userId' },
		{ name: 'recentlyViewed', field: 'userId' },
		{ name: 'deviceSubscriptions', field: 'userId' },
		{ name: 'taskReminderEmailDeliveries', field: 'recipientUserId' },
	],

	// Collections that reference propertyId — orphaned when a property is deleted
	// NOTE: this is the single source of truth. cleanPropertyRelatedCollections()
	// uses this config directly — do NOT add a separate list elsewhere.
	propertyRelated: [
		{ name: 'tasks', field: 'propertyId' },
		{ name: 'suites', field: 'propertyId' },
		{ name: 'units', field: 'propertyId' },
		{ name: 'devices', field: 'location.propertyId' }, // nested field
		{ name: 'propertyShares', field: 'propertyId' },
		{ name: 'userInvitations', field: 'propertyId' },
		{ name: 'tenantInvitationCodes', field: 'propertyId' },
		{ name: 'tenantProfiles', field: 'propertyId' },
		{ name: 'maintenanceHistory', field: 'propertyId' },
		{ name: 'maintenanceEvents', field: 'propertyId' },
		{ name: 'maintenanceRequests', field: 'propertyId' },
		{ name: 'notifications', field: 'data.propertyId' }, // nested field
		{ name: 'contractors', field: 'propertyId' },
		{ name: 'favorites', field: 'propertyId' },
		{ name: 'propertyGroupMemberships', field: 'propertyId' },
		// Future: { name: 'propertyDocuments', field: 'propertyId' },
	],

	// Collections that reference taskId — orphaned when a task is deleted
	taskRelated: [{ name: 'taskReminderEmailDeliveries', field: 'taskId' }],

	// Collections with shared user references (arrays of user IDs to prune)
	sharedUserArrays: [
		{
			collection: 'properties',
			fields: ['coOwners', 'administrators', 'viewers'],
		},
		// Future: { collection: 'teamGroups', fields: ['memberIds', 'managerIds'] },
	],
};

async function getAllCurrentUserIds() {
	console.log('Fetching all current Firebase Auth users...');

	const userIds = new Set();
	let nextPageToken;

	try {
		do {
			const listUsersResult = await auth.listUsers(1000, nextPageToken);
			listUsersResult.users.forEach((userRecord) => {
				userIds.add(userRecord.uid);
			});
			nextPageToken = listUsersResult.pageToken;
		} while (nextPageToken);

		console.log(`Found ${userIds.size} current users in Firebase Auth`);
		return userIds;
	} catch (error) {
		console.error('Error fetching users from Firebase Auth:', error);
		throw error;
	}
}

/**
 * Fetch all current property IDs by scanning the properties collection.
 * Uses a full scan rather than a userId-filtered query to avoid the Firestore
 * 'in' operator 30-element limit.
 */
async function getAllCurrentPropertyIds() {
	console.log('Fetching all current property IDs...');
	const snapshot = await db.collection('properties').get();
	const ids = new Set(snapshot.docs.map((d) => d.id));
	console.log(`Found ${ids.size} properties in Firestore`);
	return ids;
}

async function getAllCurrentTaskIds() {
	console.log('Fetching all current task IDs...');
	const snapshot = await db.collection('tasks').get();
	const ids = new Set(snapshot.docs.map((d) => d.id));
	console.log(`Found ${ids.size} tasks in Firestore`);
	return ids;
}

async function cleanCollection(
	collectionName,
	userIds,
	userIdField = 'userId',
) {
	console.log(`\n🔍 Checking collection: ${collectionName}`);

	try {
		const collectionRef = db.collection(collectionName);
		const snapshot = await collectionRef.get();

		if (snapshot.empty) {
			console.log(`   📭 Collection ${collectionName} is empty`);
			return 0;
		}

		let orphanedCount = 0;
		let batch = db.batch();
		let batchSize = 0;

		for (const doc of snapshot.docs) {
			const data = doc.data();
			const userId = userIdField === '__docId' ? doc.id : data[userIdField];

			if (!userId || userIds.has(userId)) continue;

			console.log(
				`   🗑️  ${isDryRun ? '[DRY RUN] Would delete' : 'Deleting'} ${doc.id} (${userIdField}: ${userId})`,
			);
			orphanedCount++;

			if (!isDryRun) {
				batch.delete(doc.ref);
				batchSize++;

				if (batchSize >= 500) {
					await batch.commit();
					batch = db.batch();
					batchSize = 0;
				}
			}
		}

		if (!isDryRun && batchSize > 0) {
			await batch.commit();
		}

		console.log(
			`   ✅ ${isDryRun ? 'Would remove' : 'Removed'} ${orphanedCount} orphaned documents from ${collectionName}`,
		);
		return orphanedCount;
	} catch (error) {
		console.error(`   ❌ Error cleaning collection ${collectionName}:`, error);
		return 0;
	}
}

async function cleanTaskRelatedData(taskIds) {
	console.log('\n🔍 Checking task-related collections...');

	let totalRemoved = 0;

	for (const { name, field } of COLLECTION_CONFIG.taskRelated) {
		console.log(`\n🔍 Checking ${name} for orphaned task references (${field})...`);

		try {
			const collectionRef = db.collection(name);
			const snapshot = await collectionRef.get();

			if (snapshot.empty) {
				console.log(`   📭 Collection ${name} is empty`);
				continue;
			}

			let orphanedCount = 0;
			let batch = db.batch();
			let batchSize = 0;

			for (const doc of snapshot.docs) {
				const data = doc.data();
				const taskId = data[field];

				if (!taskId || taskIds.has(taskId)) continue;

				console.log(
					`   🗑️  ${isDryRun ? '[DRY RUN] Would delete' : 'Deleting'} ${name}/${doc.id} (${field}: ${taskId})`,
				);
				orphanedCount++;

				if (!isDryRun) {
					batch.delete(doc.ref);
					batchSize++;

					if (batchSize >= 500) {
						await batch.commit();
						batch = db.batch();
						batchSize = 0;
					}
				}
			}

			if (!isDryRun && batchSize > 0) {
				await batch.commit();
			}

			console.log(
				`   ✅ ${isDryRun ? 'Would remove' : 'Removed'} ${orphanedCount} orphaned documents from ${name}`,
			);
			totalRemoved += orphanedCount;
		} catch (error) {
			console.error(`   ❌ Error cleaning ${name}:`, error);
		}
	}

	return totalRemoved;
}

/**
 * Phase 2 — clean property-related collections.
 * Uses a full property scan so there is no Firestore 'in' operator size limit.
 * Reads cleanup targets from COLLECTION_CONFIG.propertyRelated.
 */
async function cleanPropertyRelatedData(propertyIds) {
	console.log('\n🔍 Checking property-related collections...');

	let totalRemoved = 0;

	for (const { name, field } of COLLECTION_CONFIG.propertyRelated) {
		console.log(`\n🔍 Checking ${name} for orphaned property references (${field})...`);

		try {
			const collectionRef = db.collection(name);
			const snapshot = await collectionRef.get();

			if (snapshot.empty) {
				console.log(`   📭 Collection ${name} is empty`);
				continue;
			}

			let orphanedCount = 0;
			let batch = db.batch();
			let batchSize = 0;

			for (const doc of snapshot.docs) {
				const data = doc.data();
				let propertyId;

				if (field.includes('.')) {
					const [parent, child] = field.split('.');
					propertyId = data[parent]?.[child];
				} else {
					propertyId = data[field];
				}

				if (!propertyId || propertyIds.has(propertyId)) continue;

				console.log(
					`   🗑️  ${isDryRun ? '[DRY RUN] Would delete' : 'Deleting'} ${name}/${doc.id} (${field}: ${propertyId})`,
				);
				orphanedCount++;

				if (!isDryRun) {
					batch.delete(doc.ref);
					batchSize++;

					if (batchSize >= 500) {
						await batch.commit();
						batch = db.batch();
						batchSize = 0;
					}
				}
			}

			if (!isDryRun && batchSize > 0) {
				await batch.commit();
			}

			console.log(
				`   ✅ ${isDryRun ? 'Would remove' : 'Removed'} ${orphanedCount} orphaned documents from ${name}`,
			);
			totalRemoved += orphanedCount;
		} catch (error) {
			console.error(`   ❌ Error cleaning ${name}:`, error);
		}
	}

	return totalRemoved;
}

async function cleanSharedUserReferences(userIds) {
	console.log('\n🔍 Cleaning shared user references from collections...');

	let totalUpdated = 0;

	for (const config of COLLECTION_CONFIG.sharedUserArrays) {
		try {
			const { collection, fields } = config;
			console.log(`   📋 Processing ${collection} (${fields.join(', ')})...`);

			const collectionRef = db.collection(collection);
			const snapshot = await collectionRef.get();

			if (snapshot.empty) {
				console.log(`      📭 Collection ${collection} is empty`);
				continue;
			}

			let updatedCount = 0;
			let batch = db.batch();
			let batchSize = 0;

			for (const doc of snapshot.docs) {
				const data = doc.data();
				let needsUpdate = false;
				const updates = {};

				for (const field of fields) {
					if (data[field] && Array.isArray(data[field])) {
						const cleanedArray = data[field].filter((id) => userIds.has(id));
						if (cleanedArray.length !== data[field].length) {
							updates[field] = cleanedArray;
							needsUpdate = true;
						}
					}
				}

				if (!needsUpdate) continue;

				console.log(
					`      🧹 ${isDryRun ? '[DRY RUN] Would update' : 'Cleaning'} shared user references in ${collection}/${doc.id}`,
				);
				updatedCount++;

				if (!isDryRun) {
					batch.update(doc.ref, updates);
					batchSize++;

					if (batchSize >= 500) {
						await batch.commit();
						batch = db.batch();
						batchSize = 0;
					}
				}
			}

			if (!isDryRun && batchSize > 0) {
				await batch.commit();
			}

			console.log(
				`      ✅ ${isDryRun ? 'Would update' : 'Cleaned'} ${updatedCount} documents in ${collection}`,
			);
			totalUpdated += updatedCount;
		} catch (error) {
			console.error(`      ❌ Error cleaning ${config.collection}:`, error);
		}
	}

	console.log(
		`   ✅ Total documents with cleaned shared references: ${totalUpdated}`,
	);
	return totalUpdated;
}

async function runMigration() {
	console.log('🚀 Starting orphaned data cleanup migration...\n');
	console.log('📋 Configuration loaded for collections:');
	console.log(
		`   • User-owned: ${COLLECTION_CONFIG.userOwned
			.map((c) => `${c.name}(${c.field})`)
			.join(', ')}`,
	);
	console.log(
		`   • Property-related: ${COLLECTION_CONFIG.propertyRelated
			.map((c) => `${c.name}(${c.field})`)
			.join(', ')}`,
	);
	console.log(
		`   • Task-related: ${COLLECTION_CONFIG.taskRelated
			.map((c) => `${c.name}(${c.field})`)
			.join(', ')}`,
	);
	console.log(
		`   • Shared user arrays: ${COLLECTION_CONFIG.sharedUserArrays
			.map((c) => `${c.collection}(${c.fields.join(',')})`)
			.join(', ')}\n`,
	);

	try {
		// Get all current user IDs
		const userIds = await getAllCurrentUserIds();
		// Get all current property IDs (full scan avoids Firestore 'in' limit)
		const propertyIds = await getAllCurrentPropertyIds();
		// Get all current task IDs for task-related orphan checks
		const taskIds = await getAllCurrentTaskIds();

		let totalRemoved = 0;

		// Clean collections with direct userId references
		console.log('\n🧹 Phase 1: Cleaning user-owned collections...');
		for (const collectionConfig of COLLECTION_CONFIG.userOwned) {
			const removed = await cleanCollection(
				collectionConfig.name,
				userIds,
				collectionConfig.field,
			);
			totalRemoved += removed;
		}

		// Clean property-related orphaned data
		console.log('\n🏠 Phase 2: Cleaning property-related collections...');
		const propertyRelatedRemoved = await cleanPropertyRelatedData(propertyIds);
		totalRemoved += propertyRelatedRemoved;

		// Clean task-related orphaned data
		console.log('\n🧾 Phase 3: Cleaning task-related collections...');
		const taskRelatedRemoved = await cleanTaskRelatedData(taskIds);
		totalRemoved += taskRelatedRemoved;

		// Clean shared user references
		console.log('\n👥 Phase 4: Cleaning shared user references...');
		const sharedRefsCleaned = await cleanSharedUserReferences(userIds);

		console.log('\n🎉 Migration completed successfully!');
		console.log(`📊 Summary (${isDryRun ? 'DRY RUN — no changes made' : 'APPLIED'}):`);
		console.log(`   • Total orphaned documents ${isDryRun ? 'found' : 'removed'}: ${totalRemoved}`);
		console.log(
			`   • Properties with cleaned shared references: ${sharedRefsCleaned}`,
		);
		console.log(`   • Active users preserved: ${userIds.size}`);
		console.log(`   • Active tasks preserved: ${taskIds.size}`);
		if (isDryRun) {
			console.log('\n   Run with --apply to permanently delete these documents.');
		}

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		console.error('\n🔧 Troubleshooting:');
		console.error('   • Check Firebase Admin SDK permissions');
		console.error('   • Verify serviceAccountKey.json is valid');
		console.error('   • Check network connectivity to Firebase');
		process.exit(1);
	}
}

// Run the migration
runMigration();
