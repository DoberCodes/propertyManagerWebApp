// migrateAddRecurringFields.cjs
// Migration script to backfill recurring task fields on all Firestore tasks
// Usage: node scripts/migrateAddRecurringFields.cjs

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DEFAULT_FIELDS = {
	isRecurring: false,
	recurrenceFrequency: null,
	recurrenceInterval: null,
	recurrenceCustomUnit: null,
	parentTaskId: null,
	lastRecurrenceDate: null,
};

async function migrateTasks() {
	const tasksRef = db.collectionGroup('tasks');
	const snapshot = await tasksRef.get();
	let updated = 0;

	for (const doc of snapshot.docs) {
		const data = doc.data();

		const hasRecurrenceData = Boolean(
			data.recurrenceFrequency || data.recurrenceInterval,
		);

		const updates = {};

		for (const [key, value] of Object.entries(DEFAULT_FIELDS)) {
			if (typeof data[key] === 'undefined') {
				updates[key] = value;
			}
		}

		if (typeof data.isRecurring === 'undefined' && hasRecurrenceData) {
			updates.isRecurring = true;
		}

		if (Object.keys(updates).length > 0) {
			await doc.ref.update(updates);
			updated++;
			console.log(`Updated task ${doc.id} in ${doc.ref.path}`);
		}
	}

	console.log(`Migration complete. Updated ${updated} tasks.`);
}

migrateTasks().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
