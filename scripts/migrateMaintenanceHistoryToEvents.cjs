#!/usr/bin/env node

/**
 * Backfill maintenanceHistory -> maintenanceEvents.
 *
 * Safe behavior:
 * - Dry-run by default
 * - Idempotent: skips documents that already exist in maintenanceEvents
 * - Preserves original document IDs
 *
 * Usage:
 *   node scripts/migrateMaintenanceHistoryToEvents.cjs
 *   node scripts/migrateMaintenanceHistoryToEvents.cjs --apply
 *   node scripts/migrateMaintenanceHistoryToEvents.cjs --apply --limit=500
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const isDryRun = !process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

if (limitArg && (!Number.isFinite(limit) || limit <= 0)) {
	console.error('Invalid --limit value. Example: --limit=500');
	process.exit(1);
}

console.log(
	isDryRun
		? 'DRY RUN MODE: No writes will be performed.'
		: 'APPLY MODE: Documents will be written to maintenanceEvents.',
);
if (limit) {
	console.log(`Processing at most ${limit} source documents.`);
}

const sourceCollection = db.collection('maintenanceHistory');
const targetCollection = db.collection('maintenanceEvents');

const normalizeEventDoc = (data) => {
	const normalized = { ...data };

	if (!normalized.eventType) {
		normalized.eventType = 'maintenance_recorded';
	}
	if (!normalized.eventSource) {
		normalized.eventSource = 'manual_entry';
	}
	if (!normalized.updatedAt) {
		normalized.updatedAt = new Date().toISOString();
	}
	if (!normalized.createdAt) {
		normalized.createdAt = normalized.updatedAt;
	}

	Object.keys(normalized).forEach((key) => {
		if (normalized[key] === undefined) {
			delete normalized[key];
		}
	});

	return normalized;
};

async function run() {
	const startedAt = Date.now();

	let query = sourceCollection.orderBy(admin.firestore.FieldPath.documentId());
	if (limit) {
		query = query.limit(limit);
	}

	const sourceSnapshot = await query.get();
	if (sourceSnapshot.empty) {
		console.log('No source documents found in maintenanceHistory.');
		return;
	}

	let scanned = 0;
	let alreadyInTarget = 0;
	let toCreate = 0;
	let created = 0;
	let errors = 0;

	let batch = db.batch();
	let batchOps = 0;
	const maxBatchOps = 450;

	for (const sourceDoc of sourceSnapshot.docs) {
		scanned += 1;
		const targetDocRef = targetCollection.doc(sourceDoc.id);

		try {
			const targetDoc = await targetDocRef.get();
			if (targetDoc.exists) {
				alreadyInTarget += 1;
				continue;
			}

			toCreate += 1;
			const normalizedData = normalizeEventDoc(sourceDoc.data());

			if (!isDryRun) {
				batch.set(targetDocRef, normalizedData, { merge: false });
				batchOps += 1;

				if (batchOps >= maxBatchOps) {
					await batch.commit();
					created += batchOps;
					batch = db.batch();
					batchOps = 0;
				}
			}
		} catch (error) {
			errors += 1;
			console.error(`Error processing document ${sourceDoc.id}:`, error.message || error);
		}
	}

	if (!isDryRun && batchOps > 0) {
		await batch.commit();
		created += batchOps;
	}

	const elapsedMs = Date.now() - startedAt;
	console.log('\nMigration summary');
	console.log('-----------------');
	console.log(`Scanned: ${scanned}`);
	console.log(`Already in maintenanceEvents: ${alreadyInTarget}`);
	console.log(`Needs create: ${toCreate}`);
	console.log(isDryRun ? `Would create: ${toCreate}` : `Created: ${created}`);
	console.log(`Errors: ${errors}`);
	console.log(`Elapsed: ${elapsedMs} ms`);

	if (isDryRun) {
		console.log('\nRun again with --apply to perform writes.');
	}
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Migration failed:', error);
		process.exit(1);
	});
