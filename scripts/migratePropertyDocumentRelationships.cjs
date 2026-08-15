#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const {
	planPropertyDocumentRelationshipMigration,
} = require('./propertyDocumentRelationshipMigrationCore.cjs');

const rootDir = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const valueFor = (name) =>
	process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) || '';
const confirmedProject = valueFor('confirm-project');
const requestedAccountId = valueFor('account-id').trim();

const serviceAccountPath =
	process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(rootDir, 'serviceAccountKey.json');
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !fs.existsSync(serviceAccountPath)) {
	throw new Error(
		'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON before running this migration.',
	);
}
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
	? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
	: JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const projectId = String(serviceAccount.project_id || '').trim();
if (!projectId || confirmedProject !== projectId) {
	throw new Error(`Pass --confirm-project=${projectId || 'PROJECT_ID'} to confirm the target project.`);
}

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const records = (snapshot) =>
	snapshot.docs.map((document) => ({ id: document.id, data: document.data() || {} }));

const run = async () => {
	console.log(`${apply ? 'APPLY' : 'DRY RUN'}: property document relationships`);
	console.log(`Project: ${projectId}`);
	if (requestedAccountId) console.log(`Account filter: ${requestedAccountId}`);
	const snapshots = await Promise.all(
		[
			'properties',
			'propertyDocuments',
			'devices',
			'tasks',
			'propertySpaces',
			'propertySupplies',
			'propertyKnowledgeLinks',
		].map((collectionName) => db.collection(collectionName).get()),
	);
	const [properties, documents, devices, tasks, spaces, supplies, links] =
		snapshots.map(records);
	const accountMatches = (record) =>
		!requestedAccountId ||
		String(record.data.accountId || record.data.userId || '') === requestedAccountId;
	const plan = planPropertyDocumentRelationshipMigration({
		properties: properties.filter(accountMatches),
		// Keep endpoint collections complete so records with missing legacy account
		// fields are still resolved through their Property and cross-account ID
		// collisions remain visible in the dry-run report.
		documents,
		devices,
		tasks,
		spaces,
		supplies,
		links,
		now: new Date().toISOString(),
	});
	console.log(`Documents evaluated: ${plan.evaluatedDocuments}`);
	console.log(`Legacy references evaluated: ${plan.evaluatedReferences}`);
	console.log(`First-class documents to create: ${plan.documentsToCreate.length}`);
	console.log(`Canonical relationships to create: ${plan.linksToCreate.length}`);
	console.log(`Unresolved references preserved: ${plan.unresolved.length}`);
	plan.unresolved.slice(0, 25).forEach((item) =>
		console.log(
			`  ${item.propertyId}/${item.documentId} ${item.field}:${item.endpointId} - ${item.reason}`,
		),
	);
	if (plan.unresolved.length > 25) {
		console.log(`  ...and ${plan.unresolved.length - 25} more unresolved references.`);
	}
	if (!apply) {
		console.log('No writes performed. Re-run with --apply after reviewing this summary.');
		return;
	}
	const writes = [
		...plan.documentsToCreate.map((item) => ({ collection: 'propertyDocuments', ...item })),
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
	console.log('Embedded documents and legacy link arrays were preserved for compatibility.');
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
