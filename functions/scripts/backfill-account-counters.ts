import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const countCollectionDocsForAccount = async (
	collectionName: string,
	accountId: string,
): Promise<number> => {
	const snapshot = await db
		.collection(collectionName)
		.where('accountId', '==', accountId)
		.get();
	return snapshot.size;
};

const run = async (): Promise<void> => {
	console.log('Starting account counter backfill...');

	const familyAccountsSnapshot = await db.collection('familyAccounts').get();
	let processed = 0;
	let skipped = 0;

	for (const familyDoc of familyAccountsSnapshot.docs) {
		const accountId = familyDoc.id;
		const familyData = familyDoc.data() || {};

		if (!accountId) {
			skipped += 1;
			continue;
		}

		const [propertyCount, deviceCount] = await Promise.all([
			countCollectionDocsForAccount('properties', accountId),
			countCollectionDocsForAccount('devices', accountId),
		]);

		await familyDoc.ref.set(
			{
				propertyCount,
				deviceCount,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		processed += 1;
		console.log(
			`Backfilled ${accountId}: properties=${propertyCount}, devices=${deviceCount}`,
		);
		void familyData;
	}

	console.log(
		`Account counter backfill completed. Processed=${processed}, skipped=${skipped}`,
	);
};

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Account counter backfill failed:', error);
		process.exit(1);
	});