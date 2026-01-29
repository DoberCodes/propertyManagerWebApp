/**
 * Firestore Collection Structure Initialization
 *
 * Creates empty collections with structure by adding a single placeholder document
 * that can be deleted later. This establishes the collection structure in Firestore.
 * Run with: npm run init:firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
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

// Collection structures with placeholder documents
const collections = {
	propertyGroups: {
		id: '_placeholder',
		userId: 'placeholder-user',
		name: 'Placeholder - Safe to Delete',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	properties: {
		id: '_placeholder',
		groupId: 'placeholder-group',
		title: 'Placeholder Property - Safe to Delete',
		slug: 'placeholder-property',
		userId: 'placeholder-user',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	tasks: {
		id: '_placeholder',
		userId: 'placeholder-user',
		propertyId: 'placeholder-property',
		title: 'Placeholder Task - Safe to Delete',
		dueDate: new Date().toISOString(),
		status: 'Pending',
		property: 'Placeholder Property',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	teamGroups: {
		id: '_placeholder',
		userId: 'placeholder-user',
		name: 'Placeholder Team - Safe to Delete',
		linkedProperties: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	teamMembers: {
		id: '_placeholder',
		groupId: 'placeholder-group',
		firstName: 'Placeholder',
		lastName: 'Member',
		title: 'Safe to Delete',
		email: 'placeholder@example.com',
		phone: '000-000-0000',
		role: 'contractor',
		address: '',
		notes: 'This is a placeholder document to establish collection structure',
		linkedProperties: [],
		taskHistory: [],
		files: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	devices: {
		id: '_placeholder',
		userId: 'placeholder-user',
		type: 'Other',
		location: {
			propertyId: 'placeholder-property',
		},
		notes: 'Placeholder device - Safe to Delete',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	suites: {
		id: '_placeholder',
		userId: 'placeholder-user',
		propertyId: 'placeholder-property',
		name: 'Placeholder Suite - Safe to Delete',
		floor: 1,
		bedrooms: 0,
		bathrooms: 0,
		area: 0,
		isOccupied: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	units: {
		id: '_placeholder',
		userId: 'placeholder-user',
		propertyId: 'placeholder-property',
		name: 'Placeholder Unit - Safe to Delete',
		floor: 1,
		area: 0,
		isOccupied: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	propertyShares: {
		id: '_placeholder',
		propertyId: 'placeholder-property',
		ownerId: 'placeholder-owner',
		sharedWithUserId: 'placeholder-user',
		sharedWithEmail: 'placeholder@example.com',
		permission: 'viewer',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	userInvitations: {
		id: '_placeholder',
		propertyId: 'placeholder-property',
		propertyTitle: 'Placeholder Property',
		fromUserId: 'placeholder-owner',
		fromUserEmail: 'owner@example.com',
		toEmail: 'invited@example.com',
		permission: 'viewer',
		status: 'pending',
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
	},
	favorites: {
		id: '_placeholder',
		userId: 'placeholder-user',
		propertyId: 'placeholder-property',
		title: 'Placeholder Property',
		slug: 'placeholder-property',
		timestamp: Date.now(),
		createdAt: new Date().toISOString(),
	},
};

/**
 * Initialize a collection with a placeholder document
 */
async function initializeCollection(collectionName, placeholderData) {
	console.log(`📝 Initializing ${collectionName}...`);

	try {
		const docRef = doc(db, collectionName, placeholderData.id);
		await setDoc(docRef, placeholderData);
		console.log(`   ✅ Collection ${collectionName} initialized`);
	} catch (error) {
		console.error(`   ❌ Error initializing ${collectionName}:`, error.message);
		throw error;
	}
}

/**
 * Main initialization function
 */
async function initializeFirestore() {
	console.log('🚀 Initializing Firestore collection structure...\n');
	console.log('📊 Firebase Project:', firebaseConfig.projectId);
	console.log('📁 Mode: Structure Only (Placeholder Documents)\n');

	try {
		// Validate Firebase config
		if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
			throw new Error('Missing Firebase configuration. Check your .env file.');
		}

		// Initialize all collections
		for (const [collectionName, placeholderData] of Object.entries(
			collections,
		)) {
			await initializeCollection(collectionName, placeholderData);
		}

		console.log(
			'\n✨ Firestore collection structure initialized successfully!',
		);
		console.log('\n📋 Collections Created:');
		Object.keys(collections).forEach((name) => {
			console.log(`   • ${name}`);
		});
		console.log('\n💡 Next Steps:');
		console.log(
			'   1. Use your app to create real property groups and properties',
		);
		console.log(
			'   2. Delete placeholder documents (they are marked "Safe to Delete")',
		);
		console.log('   3. Start managing your properties!\n');
		console.log('🎉 Your Firestore database is ready!');

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Error initializing Firestore:', error.message);
		console.error('\n💡 Troubleshooting:');
		console.error('   1. Check Firebase Console → Firestore Database → Rules');
		console.error('   2. Temporarily use: allow read, write: if true;');
		console.error('   3. Run this script again');
		console.error('   4. Restore secure rules after initialization');
		console.error('\nSee FIRESTORE_SEEDING_FIX.md for detailed help.');
		process.exit(1);
	}
}

// Run the initialization script
initializeFirestore();
