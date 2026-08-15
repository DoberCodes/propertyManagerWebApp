#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { planPropertySupplyMigration } = require('./propertySupplyMigrationCore.cjs');

const rootDir = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const valueFor = (name) =>
	process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) || '';
const confirmedProject = valueFor('confirm-project');
const requestedAccountId = valueFor('account-id').trim();

const serviceAccountPath =
	process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(rootDir, 'serviceAccountKey.json');
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
	? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
	: JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const projectId = String(serviceAccount.project_id || '').trim();
if (!projectId || confirmedProject !== projectId) {
	throw new Error(`Pass --confirm-project=${projectId || 'PROJECT_ID'} to confirm the target project.`);
}

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const records = (snapshot) => snapshot.docs.map((document) => ({ id: document.id, data: document.data() || {} }));

const run = async () => {
	console.log(`${apply ? 'APPLY' : 'DRY RUN'}: equipment service items to property Supplies`);
	console.log(`Project: ${projectId}`);
	if (requestedAccountId) console.log(`Account filter: ${requestedAccountId}`);
	const [deviceSnapshot, supplySnapshot, linkSnapshot] = await Promise.all([
		db.collection('devices').get(),
		db.collection('propertySupplies').get(),
		db.collection('propertyKnowledgeLinks').get(),
	]);
	const accountMatches = (record) =>
		!requestedAccountId || String(record.data.accountId || record.data.userId || '') === requestedAccountId;
	const plan = planPropertySupplyMigration({
		devices: records(deviceSnapshot).filter(accountMatches),
		supplies: records(supplySnapshot).filter(accountMatches),
		links: records(linkSnapshot).filter(accountMatches),
		now: new Date().toISOString(),
	});
	console.log(`Embedded items evaluated: ${plan.evaluated}`);
	console.log(`Invalid items skipped: ${plan.skipped}`);
	console.log(`Supplies to create: ${plan.suppliesToCreate.length}`);
	console.log(`Equipment links to create: ${plan.linksToCreate.length}`);
	if (!apply) {
		console.log('No writes performed. Re-run with --apply after reviewing this summary.');
		return;
	}
	const writes = [
		...plan.suppliesToCreate.map((item) => ({ collection: 'propertySupplies', ...item })),
		...plan.linksToCreate.map((item) => ({ collection: 'propertyKnowledgeLinks', ...item })),
	];
	for (let index = 0; index < writes.length; index += 450) {
		const batch = db.batch();
		writes.slice(index, index + 450).forEach((item) =>
			batch.create(db.collection(item.collection).doc(item.id), item.data),
		);
		await batch.commit();
	}
	console.log(`Writes completed: ${writes.length}`);
	console.log('Legacy device.serviceItems were preserved for compatibility and verification.');
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
