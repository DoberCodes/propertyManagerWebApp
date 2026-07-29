#!/usr/bin/env node
'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const { normalizeLegacyPropertyTaxonomy } = require('./propertyTaxonomyMigrationCore.cjs');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const apply = process.argv.includes('--apply');

async function run() {
	console.log(apply ? 'APPLY MODE: Property taxonomy updates will be written.' : 'DRY RUN: No writes will be performed.');
	const snapshot = await db.collection('properties').get();
	let changed = 0;
	let written = 0;
	let batch = db.batch();
	let batchSize = 0;

	for (const document of snapshot.docs) {
		const updates = normalizeLegacyPropertyTaxonomy(document.data());
		if (Object.keys(updates).length === 0) continue;
		changed += 1;
		console.log(`properties/${document.id}: ${JSON.stringify(updates)}`);
		if (!apply) continue;
		batch.update(document.ref, updates);
		batchSize += 1;
		if (batchSize === 450) {
			await batch.commit();
			written += batchSize;
			batch = db.batch();
			batchSize = 0;
		}
	}

	if (apply && batchSize > 0) {
		await batch.commit();
		written += batchSize;
	}
	console.log(`Scanned: ${snapshot.size}; changes: ${changed}; written: ${written}.`);
}

run().then(() => process.exit(0)).catch((error) => {
	console.error(error);
	process.exit(1);
});
