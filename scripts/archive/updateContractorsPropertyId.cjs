const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://maintley.firebaseio.com',
});

const db = admin.firestore();

async function updateContractorsWithPropertyId() {
	try {
		console.log('Updating contractors with propertyId...');

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

		// Update contractors with propertyId
		const contractorUpdates = [
			{ id: 'contractor-landscaping', propertyId: 'prop-residential-1' },
			{ id: 'contractor-painting', propertyId: 'prop-residential-2' },
			{ id: 'contractor-electrical', propertyId: 'prop-commercial-1' },
		];

		for (const update of contractorUpdates) {
			const contractorRef = db.collection('contractors').doc(update.id);
			await contractorRef.update({
				propertyId: update.propertyId,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			console.log(
				`Updated contractor ${update.id} with propertyId ${update.propertyId}`,
			);
		}

		console.log('Contractor updates complete!');
	} catch (error) {
		console.error('Error:', error);
	} finally {
		process.exit(0);
	}
}

updateContractorsWithPropertyId();
