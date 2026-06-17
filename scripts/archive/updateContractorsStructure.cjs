const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://maintley.firebaseio.com',
});

const db = admin.firestore();

async function updateContractorsStructure() {
	try {
		console.log('Updating contractors structure...');

		// Update contractors with proper name/company structure
		const contractorUpdates = [
			{
				id: 'contractor-landscaping',
				name: 'John Smith', // Contact person name
				company: 'GreenThumb Landscaping', // Company name
			},
			{
				id: 'contractor-painting',
				name: 'Sarah Johnson', // Contact person name
				company: 'ColorMasters Painting', // Company name
			},
			{
				id: 'contractor-electrical',
				name: 'Mike Davis', // Contact person name
				company: 'Spark Electric', // Company name
			},
		];

		for (const update of contractorUpdates) {
			const contractorRef = db.collection('contractors').doc(update.id);
			await contractorRef.update({
				name: update.name,
				company: update.company,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			console.log(
				`Updated contractor ${update.id} with name: ${update.name}, company: ${update.company}`,
			);
		}

		console.log('Contractor structure updates complete!');
	} catch (error) {
		console.error('Error:', error);
	} finally {
		process.exit(0);
	}
}

updateContractorsStructure();
