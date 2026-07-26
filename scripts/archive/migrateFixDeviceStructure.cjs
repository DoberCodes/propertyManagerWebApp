#!/usr/bin/env node

// HISTORICAL MUTATING MIGRATION. DO NOT RUN AGAINST PRODUCTION.
// Archived on 2026-07-25. It contains hard-coded historical fixtures, performs
// Firestore writes, and has no dry-run or current project confirmation guard.
// Retained only as evidence of the prior device-structure migration.

/**
 * Migration script to fix device data structure
 * Updates devices to use the correct location object structure
 * Historical invocation: node scripts/migrateFixDeviceStructure.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Target user email
const TARGET_EMAIL = 'property@example.com';

async function fixDeviceStructure(userId) {
	console.log(`Fixing device structure for user ${userId}...`);

	try {
		// Get all devices for this user
		const devicesRef = db.collection('devices');
		const devicesQuery = await devicesRef.where('userId', '==', userId).get();

		console.log(`Found ${devicesQuery.size} devices to update`);

		let updatedCount = 0;
		let skippedCount = 0;

		for (const doc of devicesQuery.docs) {
			const deviceData = doc.data();

			// Check if device already has the correct location structure
			if (deviceData.location && typeof deviceData.location === 'object') {
				console.log(
					`Device ${doc.id} already has correct structure - skipping`,
				);
				skippedCount++;
				continue;
			}

			// Create the location object from the existing properties
			const location = {
				propertyId: deviceData.propertyId || '',
				...(deviceData.unitId && { unitId: deviceData.unitId }),
				...(deviceData.suiteId && { suiteId: deviceData.suiteId }),
			};

			// Remove the old properties and add the location object
			const updates = {
				location,
				...(!deviceData.propertyId && {
					propertyId: admin.firestore.FieldValue.delete(),
				}),
				...(!deviceData.unitId && {
					unitId: admin.firestore.FieldValue.delete(),
				}),
				...(!deviceData.suiteId && {
					suiteId: admin.firestore.FieldValue.delete(),
				}),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};

			await devicesRef.doc(doc.id).update(updates);
			console.log(
				`Updated device ${doc.id} (${deviceData.name || deviceData.type})`,
			);
			updatedCount++;
		}

		console.log(`\nDevice structure fix complete!`);
		console.log(`Devices updated: ${updatedCount}`);
		console.log(`Devices skipped: ${skippedCount}`);
	} catch (error) {
		console.error('❌ Error fixing device structure:', error);
		throw error;
	}
}

async function findPropertyUser() {
	console.log(`Looking for user with email: ${TARGET_EMAIL}`);

	try {
		// Find user in Firestore
		const usersRef = db.collection('users');
		const userQuery = await usersRef.where('email', '==', TARGET_EMAIL).get();

		if (!userQuery.empty) {
			const userDoc = userQuery.docs[0];
			console.log(`✅ Found user: ${userDoc.id}`);
			return userDoc.id;
		} else {
			throw new Error(
				'User property@example.com not found. Please run the initial mock data migration first.',
			);
		}
	} catch (error) {
		console.error('❌ Error finding user:', error);
		throw error;
	}
}

async function migrateFixDeviceStructure() {
	console.log('🚀 Starting migration: Fix device data structure');

	try {
		// Find the property user
		const userId = await findPropertyUser();

		// Fix device structure
		await fixDeviceStructure(userId);

		console.log('\n🎉 Device structure migration completed successfully!');
		console.log(`User: ${TARGET_EMAIL} (ID: ${userId})`);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrateFixDeviceStructure()
	.then(() => {
		console.log('\n✅ Device structure migration script finished successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Device structure migration script failed:', error);
		process.exit(1);
	});
