#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const APPLY_CHANGES = process.argv.includes('--apply');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SERVICE_ACCOUNT_PATH =
	process.env.GOOGLE_APPLICATION_CREDENTIALS ||
	path.resolve(PROJECT_ROOT, 'serviceAccountKey.json');

const FEEDBACK_COLLECTION = 'feedback';
const FEEDBACK_TICKET_PREFIX = 'MNT';

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

function formatFeedbackTicketNumber(sequence) {
	return `${FEEDBACK_TICKET_PREFIX}-${String(sequence).padStart(6, '0')}`;
}

function computeTicketNumber(data, docId) {
	const existing = String(data.ticketNumber || '').trim();
	if (existing) return existing;

	const sequence = Number(data.ticketSequence || 0);
	if (Number.isFinite(sequence) && sequence > 0) {
		return formatFeedbackTicketNumber(sequence);
	}

	return `MNT-LEGACY-${String(docId || '').slice(0, 6).toUpperCase()}`;
}

async function commitInChunks(db, updates) {
	if (!updates.length) return 0;

	let updated = 0;
	for (let index = 0; index < updates.length; index += 400) {
		const chunk = updates.slice(index, index + 400);
		const batch = db.batch();
		for (const update of chunk) {
			batch.update(update.ref, update.data);
		}
		await batch.commit();
		updated += chunk.length;
	}

	return updated;
}

async function main() {
	console.log(`Starting feedback ticket number ${APPLY_CHANGES ? 'migration' : 'audit'}...`);

	const db = initFirestore();
	const snapshot = await db.collection(FEEDBACK_COLLECTION).get();

	const docs = snapshot.docs;
	const updates = [];
	const numberOwners = new Map();
	const duplicateEntries = [];

	let docsWithExistingTicketNumber = 0;
	let docsUsingSequence = 0;
	let docsUsingLegacyFallback = 0;

	for (const doc of docs) {
		const data = doc.data() || {};
		const existing = String(data.ticketNumber || '').trim();
		const computed = computeTicketNumber(data, doc.id);
		const normalized = computed.toUpperCase();

		if (existing) {
			docsWithExistingTicketNumber += 1;
		} else if (Number(data.ticketSequence || 0) > 0) {
			docsUsingSequence += 1;
		} else {
			docsUsingLegacyFallback += 1;
		}

		const existingOwner = numberOwners.get(normalized);
		if (existingOwner && existingOwner !== doc.id) {
			duplicateEntries.push({
				ticketNumber: normalized,
				firstDocId: existingOwner,
				secondDocId: doc.id,
			});
		} else {
			numberOwners.set(normalized, doc.id);
		}

		if (!existing) {
			updates.push({
				ref: doc.ref,
				data: {
					ticketNumber: computed,
					updatedAt: new Date().toISOString(),
				},
				docId: doc.id,
				computed,
			});
		}
	}

	const report = {
		mode: APPLY_CHANGES ? 'apply' : 'dry-run',
		collection: FEEDBACK_COLLECTION,
		totalDocs: docs.length,
		docsWithExistingTicketNumber,
		backfillCandidates: updates.length,
		candidateBreakdown: {
			fromTicketSequence: docsUsingSequence,
			fromLegacyFallback: docsUsingLegacyFallback,
		},
		duplicateTicketNumbersFound: duplicateEntries.length,
		duplicateSamples: duplicateEntries.slice(0, 20),
		sampleBackfills: updates.slice(0, 20).map((entry) => ({
			docId: entry.docId,
			ticketNumber: entry.computed,
		})),
	};

	if (duplicateEntries.length > 0) {
		console.log(JSON.stringify(report, null, 2));
		throw new Error(
			'Aborting because duplicate ticket numbers were detected. Resolve duplicates before applying this migration.',
		);
	}

	if (APPLY_CHANGES && updates.length > 0) {
		report.updatesApplied = await commitInChunks(db, updates);
	} else {
		report.updatesApplied = 0;
	}

	console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
	console.error('Feedback ticket number migration failed:', error);
	process.exit(1);
});