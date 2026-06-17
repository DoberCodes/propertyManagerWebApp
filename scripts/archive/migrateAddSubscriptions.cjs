#!/usr/bin/env node

/**
 * Migration script to add subscription data to existing users
 * Run with: node scripts/migrateAddSubscriptions.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateUsers() {
	console.log('Starting subscription migration...');

	try {
		const usersRef = db.collection('users');
		const snapshot = await usersRef.get();

		let migratedCount = 0;
		let skippedCount = 0;

		for (const doc of snapshot.docs) {
			const userData = doc.data();

			// Check if user already has subscription data
			if (userData.subscription) {
				console.log(`User ${doc.id} already has subscription data - skipping`);
				skippedCount++;
				continue;
			}

			// Create trial subscription for user
			const now = Math.floor(Date.now() / 1000);
			const trialDuration = 14 * 24 * 60 * 60; // 14 days in seconds
			const trialEndsAt = now + trialDuration;

			const subscription = {
				status: 'trial',
				plan: 'free',
				currentPeriodStart: now,
				currentPeriodEnd: trialEndsAt,
				trialEndsAt: trialEndsAt,
			};

			// Update user document
			await usersRef.doc(doc.id).update({
				subscription: subscription,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			console.log(
				`Added subscription data to user ${doc.id} (${userData.email})`,
			);
			migratedCount++;
		}

		console.log(`\nMigration complete!`);
		console.log(`Users migrated: ${migratedCount}`);
		console.log(`Users skipped: ${skippedCount}`);
		console.log(`Total users processed: ${snapshot.size}`);
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrateUsers()
	.then(() => {
		console.log('Migration script finished');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Migration script failed:', error);
		process.exit(1);
	});
