/**
 * Update App Version in Firestore
 *
 * This script updates the appConfig/version document in Firestore
 * to trigger the update notification for users on older versions.
 *
 * Usage: node scripts/updateAppVersion.cjs <version> [release notes]
 * Example: node scripts/updateAppVersion.cjs 1.0.1 "Bug fixes and performance improvements"
 */

const admin = require('firebase-admin');
const path = require('path');

// Get command line arguments
const newVersion = process.argv[2];
const releaseNotes = process.argv[3] || 'Bug fixes and improvements';

if (!newVersion) {
	console.error('❌ Error: Version number is required');
	console.log(
		'Usage: node scripts/updateAppVersion.cjs <version> [release notes]',
	);
	console.log(
		'Example: node scripts/updateAppVersion.cjs 1.0.1 "Bug fixes and performance improvements"',
	);
	process.exit(1);
}

// Validate version format (semver)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
	console.error(
		'❌ Error: Invalid version format. Use semantic versioning (e.g., 1.0.0)',
	);
	process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(
	path.join(__dirname, '..', 'serviceAccountKey.json'),
);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateAppVersion() {
	try {
		const versionRef = db.collection('appConfig').doc('version');

		// Get current version
		const currentDoc = await versionRef.get();
		const currentVersion = currentDoc.exists
			? currentDoc.data().version
			: 'none';

		const versionData = {
			version: newVersion,
			releaseDate: new Date().toISOString(),
			releaseNotes: releaseNotes,
			updatedAt: new Date().toISOString(),
			previousVersion: currentVersion,
		};

		await versionRef.set(versionData, { merge: true });

		console.log('✅ App version updated successfully!');
		console.log('Previous Version:', currentVersion);
		console.log('New Version:', newVersion);
		console.log('Release Date:', versionData.releaseDate);
		console.log('Release Notes:', releaseNotes);
		console.log(
			'\n📱 Users with older versions will now see the update notification!',
		);

		process.exit(0);
	} catch (error) {
		console.error('❌ Error updating app version:', error);
		process.exit(1);
	}
}

// Run the update
updateAppVersion();
