#!/usr/bin/env node
'use strict';

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const { normalizeLegacyPropertyTaxonomy } = require('./propertyTaxonomyMigrationCore.cjs');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const apply = process.argv.includes('--apply');
const verbose = process.argv.includes('--verbose');
const confirmedProject = process.argv
	.find((argument) => argument.startsWith('--confirm-project='))
	?.split('=')[1];
const projectId = String(serviceAccount.project_id || '').trim();

if (apply && (!confirmedProject || confirmedProject !== projectId)) {
	throw new Error(
		`Apply mode requires --confirm-project=${projectId || '<service-account-project>'}.`,
	);
}

async function run() {
	console.log(apply ? 'APPLY MODE: Property taxonomy updates will be written.' : 'DRY RUN: No writes will be performed.');
	const snapshot = await db.collection('properties').get();
	let changed = 0;
	let written = 0;
	const updateCounts = { residential: 0, multi_unit: 0, commercial: 0 };
	let batch = db.batch();
	let batchSize = 0;

	for (const document of snapshot.docs) {
		const updates = normalizeLegacyPropertyTaxonomy(document.data());
		if (Object.keys(updates).length === 0) continue;
		changed += 1;
		if (updates.propertyType && updates.propertyType in updateCounts) {
			updateCounts[updates.propertyType] += 1;
		}
		if (verbose) console.log(`properties/${document.id}: ${JSON.stringify(updates)}`);
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
	console.log(`Project: ${projectId}; scanned: ${snapshot.size}; changes: ${changed}; written: ${written}.`);
	console.log(`Type updates: residential=${updateCounts.residential}, multi_unit=${updateCounts.multi_unit}, commercial=${updateCounts.commercial}.`);
}

run().then(() => process.exit(0)).catch((error) => {
	console.error(error);
	process.exit(1);
});
