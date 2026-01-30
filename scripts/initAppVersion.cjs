/**
 * Initialize App Version in Firestore
 *
 * This script creates or updates the appConfig/version document in Firestore
 * to enable the app update notification system.
 *
 * Usage: node scripts/initAppVersion.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(
	path.join(__dirname, '..', 'serviceAccountKey.json'),
);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initAppVersion() {
	try {
		const versionRef = db.collection('appConfig').doc('version');

		const versionData = {
			version: '1.0.0', // Current app version
			releaseDate: new Date().toISOString(),
			releaseNotes:
				'Initial release with comprehensive notification system for all CRUD operations.',
			updatedAt: new Date().toISOString(),
		};

		await versionRef.set(versionData, { merge: true });

		console.log('✅ App version document initialized successfully!');
		console.log('Version:', versionData.version);
		console.log('Release Date:', versionData.releaseDate);
		console.log('Release Notes:', versionData.releaseNotes);

		process.exit(0);
	} catch (error) {
		console.error('❌ Error initializing app version:', error);
		process.exit(1);
	}
}

// Run the initialization
initAppVersion();
