const admin = require('firebase-admin');
const path = require('path');

const svc = require(path.resolve(__dirname, '../../serviceAccountKey.json'));
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(svc),
		projectId: svc.project_id,
	});
}

const db = admin.firestore();

async function main() {
	const propertiesSnapshot = await db.collection('properties').get();
	const propertyAccountById = new Map();
	for (const propertyDoc of propertiesSnapshot.docs) {
		const data = propertyDoc.data() || {};
		propertyAccountById.set(
			propertyDoc.id,
			String(data.accountId || '').trim(),
		);
	}

	const checks = [
		{ collection: 'tasks', propertyField: 'propertyId' },
		{ collection: 'contractors', propertyField: 'propertyId' },
		{ collection: 'maintenanceHistory', propertyField: 'propertyId' },
		{ collection: 'units', propertyField: 'propertyId' },
		{ collection: 'suites', propertyField: 'propertyId' },
		{ collection: 'devices', propertyField: 'location.propertyId' },
	];

	const stats = [];

	for (const check of checks) {
		const snapshot = await db.collection(check.collection).get();
		let withProperty = 0;
		let missingProperty = 0;
		let missingAccountId = 0;
		let mismatchedAccountId = 0;
		const examples = [];

		for (const doc of snapshot.docs) {
			const data = doc.data() || {};
			const ownAccountId = String(data.accountId || '').trim();
			if (!ownAccountId) missingAccountId += 1;

			let propertyId = '';
			if (check.propertyField === 'location.propertyId') {
				propertyId = String(data.location?.propertyId || '').trim();
			} else {
				propertyId = String(data[check.propertyField] || '').trim();
			}

			if (!propertyId) continue;
			withProperty += 1;

			const propertyAccountId = propertyAccountById.get(propertyId);
			if (!propertyAccountId) {
				missingProperty += 1;
				continue;
			}

			if (
				ownAccountId &&
				propertyAccountId &&
				ownAccountId !== propertyAccountId
			) {
				mismatchedAccountId += 1;
				if (examples.length < 10) {
					examples.push({
						docId: doc.id,
						propertyId,
						ownAccountId,
						propertyAccountId,
					});
				}
			}
		}

		stats.push({
			collection: check.collection,
			total: snapshot.size,
			withProperty,
			missingProperty,
			missingAccountId,
			mismatchedAccountId,
			examples,
		});
	}

	console.log(
		JSON.stringify(
			{ propertiesTotal: propertiesSnapshot.size, stats },
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error('Audit failed:', error);
	process.exit(1);
});
