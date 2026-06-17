const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function migrateTeamMemberPromoCodes() {
	console.log(
		'Starting migration of teamMemberPromoCodes to teamMemberInvitationCodes...',
	);

	try {
		// Get all documents from the old collection
		const oldCollectionRef = db.collection('teamMemberPromoCodes');
		const snapshot = await oldCollectionRef.get();

		if (snapshot.empty) {
			console.log(
				'No documents found in teamMemberPromoCodes collection. Migration complete.',
			);
			return;
		}

		console.log(`Found ${snapshot.size} documents to migrate...`);

		// Create batch for new collection
		const batch = db.batch();
		const newCollectionRef = db.collection('teamMemberInvitationCodes');

		// Copy each document to the new collection
		snapshot.forEach((doc) => {
			const data = doc.data();
			const newDocRef = newCollectionRef.doc(doc.id);

			// Copy all data as-is (no field name changes needed for now)
			batch.set(newDocRef, data);
			console.log(`Migrating document: ${doc.id}`);
		});

		// Commit the batch
		await batch.commit();
		console.log(
			'Successfully migrated all documents to teamMemberInvitationCodes collection.',
		);

		// Optional: Delete old collection after verification
		// Note: Uncomment the following lines only after verifying the migration worked
		/*
    console.log('Deleting old collection...');
    const deleteBatch = db.batch();
    snapshot.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log('Old collection deleted.');
    */
	} catch (error) {
		console.error('Migration failed:', error);
		throw error;
	}
}

// Also need to migrate team member documents to update field names
async function migrateTeamMemberFields() {
	console.log('Starting migration of team member field names...');

	try {
		// Get all team members
		const teamMembersRef = db.collection('teamMembers');
		const snapshot = await teamMembersRef.get();

		if (snapshot.empty) {
			console.log('No team members found. Field migration complete.');
			return;
		}

		console.log(`Found ${snapshot.size} team members to update...`);

		const batch = db.batch();

		snapshot.forEach((doc) => {
			const data = doc.data();

			// Check if the document has the old field names
			if (data.promoCodeId || data.promoCodeStatus || data.expiresAt) {
				const updateData = {};

				// Rename fields
				if (data.promoCodeId) {
					updateData.invitationCodeId = data.promoCodeId;
					updateData.promoCodeId = admin.firestore.FieldValue.delete();
				}

				if (data.promoCodeStatus) {
					updateData.invitationCodeStatus = data.promoCodeStatus;
					updateData.promoCodeStatus = admin.firestore.FieldValue.delete();
				}

				if (data.expiresAt) {
					updateData.invitationCodeExpiresAt = data.expiresAt;
					updateData.expiresAt = admin.firestore.FieldValue.delete();
				}

				if (Object.keys(updateData).length > 0) {
					batch.update(doc.ref, updateData);
					console.log(`Updating team member: ${doc.id}`);
				}
			}
		});

		if (batch._ops && batch._ops.length > 0) {
			await batch.commit();
			console.log('Successfully updated team member field names.');
		} else {
			console.log('No team member field updates needed.');
		}
	} catch (error) {
		console.error('Team member field migration failed:', error);
		throw error;
	}
}

// Run the migrations
async function runMigrations() {
	try {
		await migrateTeamMemberPromoCodes();
		await migrateTeamMemberFields();
		console.log('All migrations completed successfully!');
	} catch (error) {
		console.error('Migration process failed:', error);
		process.exit(1);
	}
}

// Execute if run directly
if (require.main === module) {
	runMigrations();
}

module.exports = {
	migrateTeamMemberPromoCodes,
	migrateTeamMemberFields,
	runMigrations,
};
