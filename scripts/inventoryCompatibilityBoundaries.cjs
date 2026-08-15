#!/usr/bin/env node

/**
 * Report-only inventory for compatibility data that remains behind shared
 * adapters. This command has no apply mode and never writes to Firebase.
 */

const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const {
	summarizeCompatibilityInventory,
} = require('./lib/compatibilityInventoryCore.cjs');

const rootDir = path.resolve(__dirname, '..');
const tmpDir = path.join(rootDir, 'tmp');
const COLLECTIONS = [
	'properties',
	'devices',
	'users',
	'accountMemberships',
	'propertyDocuments',
	'maintenanceHistory',
	'maintenanceEvents',
	'propertySupplies',
	'propertyKnowledgeLinks',
];

const parseArgs = (argv) => {
	const values = new Map();
	const flags = new Set();
	for (const arg of argv) {
		if (!arg.startsWith('--')) continue;
		const separator = arg.indexOf('=');
		if (separator === -1) flags.add(arg.slice(2));
		else values.set(arg.slice(2, separator), arg.slice(separator + 1));
	}
	return { flags, values };
};

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

const safeReportPath = (requestedPath, generatedAt) => {
	const defaultName = `compatibility-inventory-${generatedAt.replace(/[:.]/g, '-')}.json`;
	const resolved = requestedPath
		? path.resolve(rootDir, requestedPath)
		: path.join(tmpDir, defaultName);
	const relative = path.relative(tmpDir, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error('Inventory reports must be written inside the repository tmp/ directory.');
	}
	if (path.extname(resolved).toLowerCase() !== '.json') {
		throw new Error('Inventory report path must end in .json.');
	}
	return resolved;
};

const recordsFor = (snapshot) =>
	snapshot.docs.map((document) => ({ id: document.id, data: document.data() || {} }));

async function main() {
	const { flags, values } = parseArgs(process.argv.slice(2));
	if (flags.has('help')) {
		console.log('Report-only compatibility boundary inventory.');
		console.log(
			'Usage: node scripts/inventoryCompatibilityBoundaries.cjs --confirm-project=<project-id> [--account-id=<id>] [--report=tmp/<name>.json]',
		);
		return;
	}
	if (flags.has('apply') || values.has('apply')) {
		throw new Error('This inventory is permanently report-only and has no apply mode.');
	}

	const serviceAccount = loadServiceAccount();
	const projectId = String(serviceAccount.project_id || '').trim();
	if (!projectId) throw new Error('The Firebase service account has no project_id.');
	if (values.get('confirm-project') !== projectId) {
		throw new Error(
			`Read refused. Pass --confirm-project=${projectId} after confirming the intended Firebase project.`,
		);
	}

	if (!admin.apps.length) {
		admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
	}
	const generatedAt = new Date().toISOString();
	const accountFilter = String(values.get('account-id') || '').trim();
	const reportPath = safeReportPath(values.get('report'), generatedAt);
	const db = admin.firestore();

	console.log('Compatibility boundary inventory: REPORT ONLY');
	console.log(`Firebase project: ${projectId}`);
	console.log(accountFilter ? `Account scope: ${accountFilter}` : 'Account scope: all accounts');
	console.log('No Firebase writes will be performed.');

	const snapshots = await Promise.all(
		COLLECTIONS.map((collectionName) => db.collection(collectionName).get()),
	);
	const records = Object.fromEntries(
		COLLECTIONS.map((collectionName, index) => [
			collectionName,
			recordsFor(snapshots[index]),
		]),
	);
	const summary = summarizeCompatibilityInventory(records, accountFilter);
	const report = {
		reportVersion: 1,
		mode: 'report_only',
		generatedAt,
		projectId,
		accountFilter: accountFilter || null,
		writesPerformed: false,
		summary,
	};

	fs.mkdirSync(path.dirname(reportPath), { recursive: true });
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
	console.log(JSON.stringify(summary, null, 2));
	console.log(`Report written: ${path.relative(rootDir, reportPath)}`);
	console.log('No Firebase writes were performed.');
}

main().catch((error) => {
	console.error('Compatibility inventory failed:', error.message || error);
	process.exit(1);
});
