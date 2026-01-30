/**
 * Migration: Ensure all users have default property and team groups
 * - Adds 'My Properties' to propertyGroups if missing
 * - Adds 'My Team' to teamGroups if missing
 * - Adds 'Shared Properties' and 'Shared Property Team' if missing for shared logic
 *
 * Run with: node scripts/migrateDefaultGroups.cjs
 */

const { initializeApp } = require('firebase/app');
const {
	getFirestore,
	collection,
	getDocs,
	setDoc,
	doc,
	query,
	where,
} = require('firebase/firestore');
require('dotenv').config({ path: '.env' });

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function ensureGroup(collectionName, userId, groupName, extra = {}) {
	const groupQuery = query(
		collection(db, collectionName),
		where('userId', '==', userId),
		where('name', '==', groupName),
	);
	const groupSnapshot = await getDocs(groupQuery);
	if (groupSnapshot.empty) {
		const now = new Date().toISOString();
		await setDoc(doc(collection(db, collectionName)), {
			userId,
			name: groupName,
			createdAt: now,
			updatedAt: now,
			...extra,
		});
		console.log(
			`Created '${groupName}' in ${collectionName} for user ${userId}`,
		);
	}
}

async function migrate() {
	const usersSnapshot = await getDocs(collection(db, 'users'));
	for (const userDoc of usersSnapshot.docs) {
		const userId = userDoc.id;
		await ensureGroup('propertyGroups', userId, 'My Properties');
		await ensureGroup('teamGroups', userId, 'My Team', {
			linkedProperties: [],
		});
		await ensureGroup('propertyGroups', userId, 'Shared Properties');
		await ensureGroup('teamGroups', userId, 'Shared Property Team', {
			linkedProperties: [],
		});
	}
	console.log('Migration complete!');
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
