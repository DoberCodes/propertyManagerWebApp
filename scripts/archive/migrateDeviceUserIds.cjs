const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://maintley.firebaseio.com',
});

const db = admin.firestore();

async function migrateDeviceUserIds() {
	try {
		console.log('Starting device userId migration...');

		// Get the actual user ID
		const userQuery = await db
			.collection('users')
			.where('email', '==', 'property@example.com')
			.get();

		if (userQuery.empty) {
			console.log('User not found');
			return;
		}

		const actualUserId = userQuery.docs[0].id;
		console.log('Actual user ID:', actualUserId);

		// Update all devices to use the actual userId
		const devicesSnapshot = await db.collection('devices').get();
		console.log(`Found ${devicesSnapshot.size} devices to update`);

		const batch = db.batch();
		let updateCount = 0;

		devicesSnapshot.docs.forEach((doc) => {
			const deviceRef = doc.ref;
			batch.update(deviceRef, {
				userId: actualUserId,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			updateCount++;
		});

		await batch.commit();
		console.log(`Updated ${updateCount} devices with correct userId`);

		// Update all contractors to use the actual userId
		const contractorsSnapshot = await db.collection('contractors').get();
		console.log(`Found ${contractorsSnapshot.size} contractors to update`);

		const contractorBatch = db.batch();
		let contractorUpdateCount = 0;

		contractorsSnapshot.docs.forEach((doc) => {
			const contractorRef = doc.ref;
			contractorBatch.update(contractorRef, {
				userId: actualUserId,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			contractorUpdateCount++;
		});

		await contractorBatch.commit();
		console.log(
			`Updated ${contractorUpdateCount} contractors with correct userId`,
		);

		console.log('Migration completed successfully!');
	} catch (error) {
		console.error('Migration failed:', error);
	}
}

migrateDeviceUserIds();
