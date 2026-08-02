#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const {
	OUTCOMES,
	planLegacyTaskSpaceLinks,
} = require('./taskSpaceMigrationCore.cjs');

const rootDir = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const verbose = args.has('--verbose');
const valueFor = (name) =>
	process.argv
		.find((argument) => argument.startsWith(`--${name}=`))
		?.slice(name.length + 3) || '';
const confirmedProject = valueFor('confirm-project');
const requestedAccountId = valueFor('account-id').trim();

const loadServiceAccount = () => {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
	}
	const serviceAccountPath =
		process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
		path.resolve(rootDir, 'serviceAccountKey.json');
	if (!fs.existsSync(serviceAccountPath)) {
		throw new Error(
			`Service account not found at ${serviceAccountPath}. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.`,
		);
	}
	return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
};

const serviceAccount = loadServiceAccount();
const projectId = String(serviceAccount.project_id || '').trim();
if (!projectId) throw new Error('The service account is missing project_id.');
if (!confirmedProject || confirmedProject !== projectId) {
	throw new Error(`Pass --confirm-project=${projectId} to confirm the target project.`);
}

if (!admin.apps.length) {
	admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const records = (snapshot) =>
	snapshot.docs.map((document) => ({ id: document.id, data: document.data() || {} }));

const run = async () => {
	console.log(
		apply
			? 'APPLY MODE: exact legacy Task location matches will be linked to Spaces.'
			: 'DRY RUN: no Task-to-Space links will be written.',
	);
	console.log(`Project: ${projectId}`);
	if (requestedAccountId) console.log(`Account filter: ${requestedAccountId}`);

	const [tasksSnapshot, spacesSnapshot, linksSnapshot] = await Promise.all([
		db.collection('tasks').get(),
		db.collection('propertySpaces').get(),
		db.collection('propertyKnowledgeLinks').get(),
	]);
	const belongsToRequestedAccount = (record) =>
		!requestedAccountId ||
		String(record.data.accountId || record.data.userId || '').trim() ===
			requestedAccountId;
	const tasks = records(tasksSnapshot).filter(belongsToRequestedAccount);
	const spaces = records(spacesSnapshot).filter(belongsToRequestedAccount);
	const links = records(linksSnapshot).filter(belongsToRequestedAccount);
	const plan = planLegacyTaskSpaceLinks({ tasks, spaces, links });
	const summary = Object.fromEntries(Object.values(OUTCOMES).map((outcome) => [outcome, 0]));
	plan.forEach((item) => {
		summary[item.outcome] += 1;
		if (verbose) {
			console.log(
				`${item.outcome}: tasks/${item.taskId} "${item.legacyLocation}"${item.spaceId ? ` -> propertySpaces/${item.spaceId}` : ''}`,
			);
		}
	});

	const ready = plan.filter((item) => item.outcome === OUTCOMES.READY);
	let written = 0;
	if (apply) {
		for (let index = 0; index < ready.length; index += 450) {
			const batch = db.batch();
			const slice = ready.slice(index, index + 450);
			const now = new Date().toISOString();
			slice.forEach((item) => {
				batch.set(db.collection('propertyKnowledgeLinks').doc(item.linkId), {
					...item.link,
					createdAt: now,
					createdBy: 'migration:task-location-to-space',
					updatedAt: now,
					updatedBy: 'migration:task-location-to-space',
				});
			});
			await batch.commit();
			written += slice.length;
		}
	}

	console.log(`Legacy Task locations evaluated: ${plan.length}`);
	Object.entries(summary).forEach(([outcome, count]) =>
		console.log(`${outcome}: ${count}`),
	);
	console.log(`Links written: ${written}`);
	console.log('Legacy Task location fields were preserved for compatibility.');
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
