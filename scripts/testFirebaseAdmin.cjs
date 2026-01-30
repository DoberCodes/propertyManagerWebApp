// scripts/testFirebaseAdmin.cjs
// Minimal test: connect to Firebase Admin and list first 5 users

const fs = require('fs');
const keyPath =
	process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
if (key.project_id) {
	process.env.GCLOUD_PROJECT = key.project_id;
	process.env.GOOGLE_CLOUD_PROJECT = key.project_id;
}

const admin = require('firebase-admin');
admin.initializeApp({
	credential: admin.credential.cert(key),
});
const auth = admin.auth();

async function main() {
	try {
		const listUsersResult = await auth.listUsers(5);
		console.log('Successfully connected! First 5 users:');
		listUsersResult.users.forEach((userRecord) => {
			console.log(userRecord.email, userRecord.uid);
		});
		process.exit(0);
	} catch (err) {
		console.error('Firebase Admin connection failed:', err);
		process.exit(1);
	}
}

main();
