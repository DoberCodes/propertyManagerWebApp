// migrateTasksMissingFields.cjs
// Migration script to backfill missing required task fields (id, notes, priority)
// Usage: node scripts/migrateTasksMissingFields.cjs

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateTasks() {
	const tasksRef = db.collectionGroup('tasks');
	const snapshot = await tasksRef.get();
	let updated = 0;

	for (const doc of snapshot.docs) {
		const data = doc.data();
		const updates = {};

		if (typeof data.id === 'undefined') {
			updates.id = doc.id;
		}

		if (typeof data.notes === 'undefined') {
			updates.notes = '';
		}

		if (typeof data.priority === 'undefined') {
			updates.priority = 'Medium';
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
