#!/usr/bin/env node

/**
 * Report-only Maintenance History migration inventory.
 *
 * This command has no apply mode and performs no Firestore writes. It reads
 * canonical events, legacy collection records, and embedded property/equipment
 * history to classify migration candidates before any backfill is designed.
 *
 * Usage:
 *   node scripts/inventoryMaintenanceHistory.cjs --confirm-project=<project-id>
 *   node scripts/inventoryMaintenanceHistory.cjs \
 *     --confirm-project=<project-id> \
 *     --account-id=<account-id> \
 *     --report=tmp/maintenance-history-inventory.json
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const {
	OUTCOMES,
	buildCanonicalIndex,
	buildPropertyIndexes,
	classifyCollectionRecord,
	classifyEmbeddedRecord,
	summarizeResults,
} = require('./lib/maintenanceHistoryInventoryCore.cjs');

const rootDir = path.resolve(__dirname, '..');
const tmpDir = path.join(rootDir, 'tmp');

function parseArgs(argv) {
	const values = new Map();
	const flags = new Set();
	for (const arg of argv) {
		if (!arg.startsWith('--')) continue;
		const separator = arg.indexOf('=');
		if (separator === -1) flags.add(arg.slice(2));
		else values.set(arg.slice(2, separator), arg.slice(separator + 1));
	}
	return { flags, values };
}

function normalizeId(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function loadServiceAccount() {
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
}

function safeReportPath(requestedPath, generatedAt) {
	const defaultName = `maintenance-history-inventory-${generatedAt.replace(/[:.]/g, '-')}.json`;
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
}

function documentRecords(snapshot) {
	return snapshot.docs.map((document) => ({ id: document.id, data: document.data() || {} }));
}

function accountIdForProperty(property) {
	const data = property?.data || {};
	return normalizeId(data.accountId || data.userId || data.ownerId);
}

function addCrossSourceDuplicateReview(results) {
	const migratable = new Set([OUTCOMES.READY, OUTCOMES.READY_WITH_INFERENCE]);
	const bySignature = new Map();
	for (const result of results) {
		if (!migratable.has(result.outcome)) continue;
		const matches = bySignature.get(result.signature) || [];
		matches.push(result);
		bySignature.set(result.signature, matches);
	}

	for (const matches of bySignature.values()) {
		if (matches.length < 2) continue;
		for (const result of matches) {
			result.outcome = OUTCOMES.POSSIBLE_DUPLICATE;
			if (!result.reasons.includes('legacy_candidates_share_signature')) {
				result.reasons.push('legacy_candidates_share_signature');
			}
			result.duplicateLegacySources = matches
				.filter((candidate) => candidate !== result)
				.map((candidate) => `${candidate.sourceType}:${candidate.sourceId}`)
				.sort();
		}
	}
}

async function main() {
	const { flags, values } = parseArgs(process.argv.slice(2));
	if (flags.has('help')) {
		console.log('Report-only Maintenance History migration inventory.');
		console.log(
			'Usage: node scripts/inventoryMaintenanceHistory.cjs --confirm-project=<project-id> [--account-id=<id>] [--report=tmp/<name>.json]',
		);
		return;
	}
	if (flags.has('apply') || values.has('apply')) {
		throw new Error('This inventory is permanently report-only and has no apply mode.');
	}

	const serviceAccount = loadServiceAccount();
	const projectId = normalizeId(serviceAccount.project_id);
	if (!projectId) throw new Error('The Firebase service account has no project_id.');
	if (values.get('confirm-project') !== projectId) {
		throw new Error(
			`Read refused. Pass --confirm-project=${projectId} after confirming the intended Firebase project.`,
		);
	}

	if (!admin.apps.length) {
		admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
	}
	const db = admin.firestore();
	const generatedAt = new Date().toISOString();
	const reportPath = safeReportPath(values.get('report'), generatedAt);
	const accountFilter = normalizeId(values.get('account-id'));

	console.log('Maintenance History migration inventory: REPORT ONLY');
	console.log(`Firebase project: ${projectId}`);
	console.log(accountFilter ? `Account scope: ${accountFilter}` : 'Account scope: all accounts');
	console.log('No Firestore writes will be performed.');

	const [propertySnapshot, deviceSnapshot, legacySnapshot, eventSnapshot] =
		await Promise.all([
			db.collection('properties').get(),
			db.collection('devices').get(),
			db.collection('maintenanceHistory').get(),
			db.collection('maintenanceEvents').get(),
		]);

	const properties = documentRecords(propertySnapshot);
	const devices = documentRecords(deviceSnapshot);
	const legacyRecords = documentRecords(legacySnapshot);
	const canonicalEvents = documentRecords(eventSnapshot);
	const propertyIndexes = buildPropertyIndexes(properties);
	const canonicalIndex = buildCanonicalIndex(canonicalEvents);
	const results = [];

	for (const record of legacyRecords) {
		results.push(
			classifyCollectionRecord({
				id: record.id,
				data: record.data,
				propertyIndexes,
				canonicalIndex,
			}),
		);
	}

	for (const property of properties) {
		for (const fieldName of ['taskHistory', 'maintenanceHistory']) {
			const entries = Array.isArray(property.data[fieldName]) ? property.data[fieldName] : [];
			entries.forEach((entry, index) => {
				results.push(
					classifyEmbeddedRecord({
						sourceType: `property.${fieldName}`,
						sourceId: `properties/${property.id}/${fieldName}/${index}`,
						data: entry || {},
						property,
						canonicalIndex,
					}),
				);
			});
		}
	}

	for (const device of devices) {
		const propertyId = normalizeId(device.data?.location?.propertyId || device.data?.propertyId);
		const property = propertyIndexes.byId.get(propertyId) || null;
		const entries = Array.isArray(device.data.maintenanceHistory)
			? device.data.maintenanceHistory
			: [];
		entries.forEach((entry, index) => {
			results.push(
				classifyEmbeddedRecord({
					sourceType: 'device.maintenanceHistory',
					sourceId: `devices/${device.id}/maintenanceHistory/${index}`,
					data: entry || {},
					property,
					deviceId: device.id,
					canonicalIndex,
				}),
			);
		});
	}

	addCrossSourceDuplicateReview(results);
	const scopedResults = accountFilter
		? results.filter((result) => result.resolvedAccountId === accountFilter)
		: results;
	const scopedProperties = accountFilter
		? properties.filter((property) => accountIdForProperty(property) === accountFilter)
		: properties;
	const scopedEvents = accountFilter
		? canonicalEvents.filter(
				(event) => normalizeId(event.data.accountId) === accountFilter,
			)
		: canonicalEvents;

	const report = {
		reportVersion: 1,
		mode: 'report_only',
		generatedAt,
		projectId,
		accountFilter: accountFilter || null,
		writesPerformed: false,
		collections: {
			propertiesScanned: scopedProperties.length,
			devicesScanned: accountFilter
				? devices.filter((device) => {
						const propertyId = normalizeId(
							device.data?.location?.propertyId || device.data?.propertyId,
						);
						return scopedProperties.some((property) => property.id === propertyId);
					}).length
				: devices.length,
			legacyCollectionRecordsScanned: accountFilter
				? scopedResults.filter((result) => result.sourceType === 'maintenanceHistory').length
				: legacyRecords.length,
			canonicalEventsScanned: scopedEvents.length,
		},
		summary: summarizeResults(scopedResults),
		records: scopedResults.sort((a, b) =>
			`${a.sourceType}:${a.sourceId}`.localeCompare(`${b.sourceType}:${b.sourceId}`),
		),
	};

	fs.mkdirSync(path.dirname(reportPath), { recursive: true });
	fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

	console.log('\nInventory summary');
	console.log('-----------------');
	console.log(`Migration candidates: ${report.summary.totalCandidates}`);
	for (const [outcome, count] of Object.entries(report.summary.outcomes).sort()) {
		console.log(`${outcome}: ${count}`);
	}
	console.log(`Canonical events scanned: ${report.collections.canonicalEventsScanned}`);
	console.log(`Report written: ${path.relative(rootDir, reportPath)}`);
	console.log('No Firestore writes were performed.');
}

main().catch((error) => {
	console.error('Maintenance History inventory failed:', error.message || error);
	process.exit(1);
});
