// migrateTasksAssignedToObject.cjs
// Migration script to update all Firestore tasks so that assignedTo is an object { id, name, email }
// Usage: node scripts/migrateTasksAssignedToObject.cjs

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
		if (data.assignedTo && typeof data.assignedTo === 'string') {
			// Try to get user info from users collection
			let userDoc = null;
			try {
				userDoc = await db.collection('users').doc(data.assignedTo).get();
			} catch {}
			let name = '';
			let email = '';
			if (userDoc && userDoc.exists) {
				const user = userDoc.data();
				if (user.firstName && user.lastName) {
					name = `${user.firstName} ${user.lastName}`;
				} else if (user.firstName) {
					name = user.firstName;
				} else if (user.name) {
					name = user.name;
				} else if (user.email) {
					name = user.email;
				} else {
					name = data.assignedTo;
				}
				email = user.email || '';
			} else {
				name = data.assignedTo;
			}
			const assignedToObj = {
				id: data.assignedTo,
				name,
				email,
			};
			await doc.ref.update({ assignedTo: assignedToObj });
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
