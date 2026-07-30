// HISTORICAL DIAGNOSTIC ONLY.
// Archived on 2026-07-25. This script contains historical fixtures and must not
// be run against production without an explicit project and data-safety review.

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://maintley.firebaseio.com',
});

const db = admin.firestore();

async function checkDeviceLocations() {
	try {
		console.log('Checking device location data...');

		// Get user ID for property@example.com
		const userQuery = await db
			.collection('users')
			.where('email', '==', 'property@example.com')
			.get();
		if (userQuery.empty) {
			console.log('User not found');
			return;
		}

		const userId = userQuery.docs[0].id;
		console.log('User ID:', userId);

		// Get all devices for this user
		const devicesQuery = await db
			.collection('devices')
			.where('userId', '==', userId)
			.get();
		console.log(`\nFound ${devicesQuery.size} devices for user`);

		devicesQuery.docs.forEach((doc) => {
			const data = doc.data();
			console.log(`- ${data.type}: ${data.brand} ${data.model}`);
			console.log(
				`  Location: propertyId=${data.location?.propertyId}, unitId=${data.location?.unitId}, suiteId=${data.location?.suiteId}`,
			);
		});
	} catch (error) {
		console.error('Error:', error);
	} finally {
		process.exit(0);
	}
}

checkDeviceLocations();
