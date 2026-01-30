/**
 * Migration: Ensure all existing users are added as members to their own 'My Team' group
 * - For each user, ensure a 'My Team' group exists
 * - Add the user as a TeamMember in their own group if not already present
 * - Fills out all available user info
 *
 * Run with: node scripts/migrateAddUserToMyTeam.cjs
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
	serverTimestamp,
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

async function ensureMyTeamGroup(userId) {
	const groupQuery = query(
		collection(db, 'teamGroups'),
		where('userId', '==', userId),
		where('name', '==', 'My Team'),
	);
	const groupSnapshot = await getDocs(groupQuery);
	if (!groupSnapshot.empty) {
		return groupSnapshot.docs[0].id;
	}
	const groupRef = doc(collection(db, 'teamGroups'));
	await setDoc(groupRef, {
		userId,
		name: 'My Team',
		linkedProperties: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
	return groupRef.id;
}

async function ensureUserIsTeamMember(user, groupId) {
	const memberQuery = query(
		collection(db, 'teamMembers'),
		where('groupId', '==', groupId),
		where('email', '==', user.email),
	);
	const memberSnapshot = await getDocs(memberQuery);
	if (!memberSnapshot.empty) {
		// Patch all found docs to ensure userId is set
		for (const docSnap of memberSnapshot.docs) {
			const data = docSnap.data();
			if (!data.userId || data.userId !== user.id) {
				await setDoc(
					doc(db, 'teamMembers', docSnap.id),
					{
						...data,
						userId: user.id,
						updatedAt: new Date().toISOString(),
					},
					{ merge: true },
				);
				console.log(`Patched TeamMember ${docSnap.id} with userId ${user.id}`);
			}
		}
		return;
	}
	const memberRef = doc(collection(db, 'teamMembers'));
	await setDoc(memberRef, {
		userId: user.id,
		groupId,
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		title: user.title || '',
		email: user.email,
		phone: user.phone || '',
		role: user.role || 'property_manager',
		address: user.address || '',
		image: user.image || '',
		notes: '',
		linkedProperties: [],
		taskHistory: [],
		files: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
}

async function migrate() {
	const usersSnapshot = await getDocs(collection(db, 'users'));
	for (const userDoc of usersSnapshot.docs) {
		const user = { id: userDoc.id, ...userDoc.data() };
		const groupId = await ensureMyTeamGroup(user.id);
		await ensureUserIsTeamMember(user, groupId);
		console.log(
			`Ensured user ${user.email} is a member of their My Team group.`,
		);
	}

	// Patch all teamMembers missing userId by looking up user by email
	const allMembersSnapshot = await getDocs(collection(db, 'teamMembers'));
	for (const memberDoc of allMembersSnapshot.docs) {
		const member = memberDoc.data();
		if (!member.userId && member.email) {
			const userQuery = query(
				collection(db, 'users'),
				where('email', '==', member.email),
			);
			const userSnap = await getDocs(userQuery);
			if (!userSnap.empty) {
				const userId = userSnap.docs[0].id;
				await setDoc(
					doc(db, 'teamMembers', memberDoc.id),
					{
						...member,
						userId,
						updatedAt: new Date().toISOString(),
					},
					{ merge: true },
				);
				console.log(
					`Patched shared TeamMember ${memberDoc.id} with userId ${userId}`,
				);
			}
		}
	}
	console.log('Migration complete!');
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
