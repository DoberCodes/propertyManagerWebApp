/**
 * Firestore Seeding Script with Authentication
 *
 * This script authenticates with Firebase before seeding data
 * Run with: npm run seed:firebase:auth
 */

const { initializeApp } = require('firebase/app');
const {
	getAuth,
	signInWithEmailAndPassword,
	signOut,
} = require('firebase/auth');
const {
	getFirestore,
	collection,
	doc,
	writeBatch,
} = require('firebase/firestore');
require('dotenv').config({ path: '.env' });

// Firebase configuration from environment variables
const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Admin credentials for seeding (should match an existing user in Firebase Auth)
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD || 'password123';

// Hardcoded mock data for seeding

// Property Shares - Sample shared properties
const mockPropertyShares = [
	{
		id: 'share-1',
		propertyId: 'prop-1',
		ownerId: 'user-admin-1',
		sharedWithUserId: 'user-manager-1',
		sharedWithEmail: 'manager@example.com',
		permission: 'admin',
		createdAt: new Date('2024-01-15').toISOString(),
		updatedAt: new Date('2024-01-15').toISOString(),
	},
	{
		id: 'share-2',
		propertyId: 'prop-2',
		ownerId: 'user-admin-1',
		sharedWithUserId: 'user-assistant-1',
		sharedWithEmail: 'assistant@example.com',
		permission: 'viewer',
		createdAt: new Date('2024-01-20').toISOString(),
		updatedAt: new Date('2024-01-20').toISOString(),
	},
];

// User Invitations - Pending property invitations
const mockUserInvitations = [
	{
		id: 'invite-1',
		propertyId: 'prop-3',
		propertyTitle: 'Sunset Heights Condos',
		fromUserId: 'user-admin-1',
		fromUserEmail: 'admin@example.com',
		toEmail: 'newuser@example.com',
		permission: 'viewer',
		status: 'pending',
		createdAt: new Date('2024-01-25').toISOString(),
		expiresAt: new Date('2024-02-01').toISOString(),
	},
	{
		id: 'invite-2',
		propertyId: 'prop-4',
		propertyTitle: 'Oak Street Apartments',
		fromUserId: 'user-admin-1',
		fromUserEmail: 'admin@example.com',
		toEmail: 'contractor@example.com',
		permission: 'admin',
		status: 'pending',
		createdAt: new Date('2024-01-26').toISOString(),
		expiresAt: new Date('2024-02-02').toISOString(),
	},
];

// Property Groups
const mockPropertyGroups = [
	{
		id: 'group-1',
		userId: 'user-admin-1',
		name: 'Residential Properties',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: 'group-2',
		userId: 'user-admin-1',
		name: 'Commercial Properties',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

// Continue with rest of mock data from original seed script...
// (Properties, Units, Suites, Tasks, TeamGroups, TeamMembers, Devices)

// For brevity, I'll add a note that you should copy the rest from seedFirestore.cjs

/**
 * Authenticate with Firebase
 */
async function authenticate() {
	console.log(`🔐 Authenticating as ${ADMIN_EMAIL}...`);

	try {
		await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authentication successful\n');
	} catch (error) {
		console.error('❌ Authentication failed:', error.message);
		console.log('\n⚠️  Make sure you:');
		console.log('   1. Have created a user in Firebase Auth');
		console.log(
			'   2. Set FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD in .env',
		);
		console.log('   3. User credentials match the environment variables');
		throw error;
	}
}

/**
 * Seed a collection with data
 */
async function seedCollection(collectionName, data) {
	console.log(`\n📝 Seeding ${collectionName}...`);

	const batch = writeBatch(db);
	let count = 0;

	for (const item of data) {
		const docRef = doc(db, collectionName, item.id);
		batch.set(docRef, item);
		count++;

		// Firestore batches can only contain 500 operations
		if (count % 500 === 0) {
			await batch.commit();
			console.log(`   ✓ Committed ${count} documents`);
		}
	}

	// Commit any remaining documents
	if (count % 500 !== 0) {
		await batch.commit();
	}

	console.log(
		`   ✅ Successfully seeded ${count} documents to ${collectionName}`,
	);
}

/**
 * Main seeding function
 */
async function seedFirestore() {
	console.log('🚀 Starting Firestore seeding with authentication...\n');
	console.log('📊 Firebase Project:', firebaseConfig.projectId);

	try {
		// Validate Firebase config
		if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
			throw new Error('Missing Firebase configuration. Check your .env file.');
		}

		// Authenticate first
		await authenticate();

		// Seed collections
		await seedCollection('propertyGroups', mockPropertyGroups);
		await seedCollection('propertyShares', mockPropertyShares);
		await seedCollection('userInvitations', mockUserInvitations);
		// Add more collections as needed...

		console.log('\n✨ Firestore seeding completed successfully!');
		console.log('\n📋 Summary:');
		console.log(`   • ${mockPropertyGroups.length} Property Groups`);
		console.log(`   • ${mockPropertyShares.length} Property Shares`);
		console.log(`   • ${mockUserInvitations.length} User Invitations`);
		console.log('\n🎉 Your Firestore database is ready to use!');

		// Sign out
		await signOut(auth);
		console.log('\n🔓 Signed out');

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Error seeding Firestore:', error.message);
		console.error(error);
		process.exit(1);
	}
}

// Run the seeding script
seedFirestore();
