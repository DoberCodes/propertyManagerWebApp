#!/usr/bin/env node

/**
 * Safely updates Maintley-generated legacy "Appliance" wording to "Equipment".
 *
 * Safe behavior:
 * - Dry-run by default
 * - Idempotent exact string replacements
 * - Does not rename collections, fields, routes, storage paths, or user records
 * - Avoids broad free-form rewrites; only known generated strings are touched
 *
 * Usage:
 *   node scripts/migrateEquipmentTerminology.cjs
 *   node scripts/migrateEquipmentTerminology.cjs --apply
 *   node scripts/migrateEquipmentTerminology.cjs --apply --limit=500
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

const generatedTextReplacements = [
	['--- Linked Appliance Details ---', '--- Linked Equipment Details ---'],
	['--- End Linked Appliance Details ---', '--- End Linked Equipment Details ---'],
	[
		'Use these linked appliance details while performing this task:',
		'Use these linked equipment details while performing this task:',
	],
	[
		'No additional appliance specs saved yet.',
		'No additional equipment specs saved yet.',
	],
	[
		'maintenance task created from the appliance page.',
		'maintenance task created from the equipment page.',
	],
	['Appliance Log', 'Equipment Log'],
	['Appliance/System', 'Equipment'],
];

const exactValueReplacements = new Map([
	['Appliance', 'Equipment'],
	['Appliances', 'Equipment'],
	['Appliance Log', 'Equipment Log'],
	['Appliance/System', 'Equipment'],
]);

const collectionPlans = [
	{
		name: 'tasks',
		fields: ['description', 'notes', 'title', 'category'],
	},
	{
		name: 'maintenanceEvents',
		fields: ['title', 'description', 'notes', 'type', 'maintenanceType', 'category'],
	},
	{
		name: 'maintenanceHistory',
		fields: ['title', 'description', 'notes', 'type', 'maintenanceType', 'category'],
	},
	{
		name: 'maintenanceRequests',
		fields: ['category', 'issueType', 'description', 'notes'],
	},
	{
		name: 'notifications',
		fields: ['title', 'message', 'actionLabel'],
	},
	{
		name: 'maintleyEvents',
		fields: ['title', 'message', 'actionLabel'],
	},
];

const applyKnownStringReplacements = (value) => {
	if (typeof value !== 'string') return value;

	if (exactValueReplacements.has(value)) {
		return exactValueReplacements.get(value);
	}

	return generatedTextReplacements.reduce(
		(nextValue, [from, to]) => nextValue.split(from).join(to),
		value,
	);
};

const buildUpdates = (data, fields) => {
	const updates = {};

	for (const field of fields) {
		if (!Object.prototype.hasOwnProperty.call(data, field)) continue;

		const currentValue = data[field];
		const nextValue = applyKnownStringReplacements(currentValue);
		if (nextValue !== currentValue) {
			updates[field] = nextValue;
		}
	}

	return updates;
};

async function run() {
	console.log(
		isDryRun
			? 'DRY RUN MODE: No writes will be performed.'
			: 'APPLY MODE: Generated legacy wording will be updated.',
	);
	if (limit) {
		console.log(`Processing at most ${limit} documents per collection.`);
	}

	let scanned = 0;
	let changed = 0;
	let written = 0;
	let errors = 0;

	for (const plan of collectionPlans) {
		let query = db.collection(plan.name).orderBy(admin.firestore.FieldPath.documentId());
		if (limit) {
			query = query.limit(limit);
		}

		const snapshot = await query.get();
		if (snapshot.empty) {
			console.log(`${plan.name}: no documents found.`);
			continue;
		}

		let collectionChanged = 0;
		let batch = db.batch();
		let batchOps = 0;
		const maxBatchOps = 450;

		for (const doc of snapshot.docs) {
			scanned += 1;
			try {
				const updates = buildUpdates(doc.data(), plan.fields);
				const updateKeys = Object.keys(updates);
				if (updateKeys.length === 0) continue;

				changed += 1;
				collectionChanged += 1;
				console.log(`${plan.name}/${doc.id}: ${updateKeys.join(', ')}`);

				if (!isDryRun) {
					batch.update(doc.ref, updates);
					batchOps += 1;

					if (batchOps >= maxBatchOps) {
						await batch.commit();
						written += batchOps;
						batch = db.batch();
						batchOps = 0;
					}
				}
			} catch (error) {
				errors += 1;
				console.error(`${plan.name}/${doc.id}: ${error.message || error}`);
			}
		}

		if (!isDryRun && batchOps > 0) {
			await batch.commit();
			written += batchOps;
		}

		console.log(`${plan.name}: ${collectionChanged} document(s) need updates.`);
	}

	console.log('\nMigration summary');
	console.log('-----------------');
	console.log(`Scanned: ${scanned}`);
	console.log(`Needs update: ${changed}`);
	console.log(isDryRun ? `Would update: ${changed}` : `Updated: ${written}`);
	console.log(`Errors: ${errors}`);

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
