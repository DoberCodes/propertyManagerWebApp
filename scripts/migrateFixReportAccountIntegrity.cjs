const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const APPLY_CHANGES = process.argv.includes('--apply');
const KEY_PATH = path.resolve(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(KEY_PATH)) {
	console.error('Missing serviceAccountKey.json at', KEY_PATH);
	process.exit(1);
}

const serviceAccount = require(KEY_PATH);

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		projectId: serviceAccount.project_id,
	});
}

const db = admin.firestore();

const COLLECTIONS = [
	{ name: 'tasks', propertyField: 'propertyId' },
	{ name: 'maintenanceHistory', propertyField: 'propertyId' },
	{ name: 'units', propertyField: 'propertyId' },
	{ name: 'devices', propertyField: 'location.propertyId' },
	{ name: 'contractors', propertyField: 'propertyId' },
	{ name: 'tenantProfiles', propertyField: 'propertyId' },
];

const getNestedValue = (obj, fieldPath) =>
	fieldPath
		.split('.')
		.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

async function commitInChunks(updates) {
	if (!updates.length) return;

	const CHUNK_SIZE = 400;
	for (let index = 0; index < updates.length; index += CHUNK_SIZE) {
		const chunk = updates.slice(index, index + CHUNK_SIZE);
		const batch = db.batch();
		for (const update of chunk) {
			batch.update(update.ref, update.data);
		}
		await batch.commit();
	}
}

async function main() {
	console.log(`Starting report account integrity ${APPLY_CHANGES ? 'migration' : 'audit'}...`);

	const propertiesSnapshot = await db.collection('properties').get();
	const propertyAccountMap = new Map();

	for (const propertyDoc of propertiesSnapshot.docs) {
		const propertyData = propertyDoc.data() || {};
		const accountId = String(propertyData.accountId || '').trim();
		if (accountId) {
			propertyAccountMap.set(propertyDoc.id, accountId);
		}
	}

	const collectionResults = [];
	let totalUpdates = 0;
	const pendingUpdates = [];

	for (const config of COLLECTIONS) {
		const snapshot = await db.collection(config.name).get();

		let missingPropertyId = 0;
		let unknownProperty = 0;
		let missingAccountId = 0;
		let mismatchedAccountId = 0;
		let updateCandidates = 0;
		const sampleUpdates = [];

		for (const doc of snapshot.docs) {
			const data = doc.data() || {};
			const propertyId = String(getNestedValue(data, config.propertyField) || '').trim();
			const currentAccountId = String(data.accountId || '').trim();

			if (!propertyId) {
				missingPropertyId += 1;
				continue;
			}

			const expectedAccountId = propertyAccountMap.get(propertyId) || '';
			if (!expectedAccountId) {
				unknownProperty += 1;
				continue;
			}

			if (!currentAccountId) {
				missingAccountId += 1;
			}

			if (currentAccountId !== expectedAccountId) {
				mismatchedAccountId += 1;
				updateCandidates += 1;
				totalUpdates += 1;

				const updateData = {
					accountId: expectedAccountId,
					updatedAt: new Date().toISOString(),
				};

				pendingUpdates.push({ ref: doc.ref, data: updateData });

				if (sampleUpdates.length < 10) {
					sampleUpdates.push({
						docId: doc.id,
						propertyId,
						currentAccountId: currentAccountId || '<missing>',
						expectedAccountId,
					});
				}
			}
		}

		collectionResults.push({
			collection: config.name,
			totalDocs: snapshot.size,
			missingPropertyId,
			unknownProperty,
			missingAccountId,
			mismatchedAccountId,
			updateCandidates,
			sampleUpdates,
		});
	}

	if (APPLY_CHANGES && pendingUpdates.length > 0) {
		await commitInChunks(pendingUpdates);
	}

	console.log(
		JSON.stringify(
			{
				mode: APPLY_CHANGES ? 'apply' : 'dry-run',
				propertiesWithAccountId: propertyAccountMap.size,
				totalUpdateCandidates: totalUpdates,
				updatesApplied: APPLY_CHANGES ? pendingUpdates.length : 0,
				collections: collectionResults,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});
