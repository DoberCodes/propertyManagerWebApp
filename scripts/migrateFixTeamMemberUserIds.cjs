// scripts/migrateFixTeamMemberUserIds.cjs
// Migration: Ensure all teamMembers have the correct userId based on their email

// Load project_id from serviceAccountKey.json and set env vars
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
const db = admin.firestore();
const auth = admin.auth();

async function main() {
	const teamMembersSnap = await db.collection('teamMembers').get();
	let updated = 0;
	let missing = 0;

	for (const doc of teamMembersSnap.docs) {
		const member = doc.data();
		if (!member.email) continue;
		// Look up user by email
		let userId = member.userId;
		try {
			const userRecord = await auth.getUserByEmail(member.email);
			if (userRecord && userRecord.uid !== member.userId) {
				userId = userRecord.uid;
				await doc.ref.update({ userId });
				updated++;
				console.log(
					`Updated userId for teamMember ${doc.id} (${member.email}) to ${userId}`,
				);
			}
		} catch (e) {
			missing++;
			console.warn(`No user found for teamMember ${doc.id} (${member.email})`);
		}
	}
	console.log(
		`Migration complete! Updated: ${updated}, Missing users: ${missing}`,
	);
}

main().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
