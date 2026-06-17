#!/usr/bin/env node

/**
 * Migration script to update user roles based on userType
 * This ensures users have correct roles for backward compatibility
 * while permissions are controlled by subscription plans
 * Run with: node scripts/migrateUserRolesBySubscription.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Role mapping based on userType (independent of subscription plan)
// Permissions are now controlled by subscription plans, not roles
const getRoleFromUserType = (userType) => {
	switch (userType) {
		case 'homeowner':
			return 'admin'; // Homeowners are admins of their properties
		case 'propertyManager':
		case 'landlord':
			return 'property_manager';
		case 'tenant':
			return 'tenant';
		case 'contractor':
			return 'contractor';
		default:
			return 'admin'; // Default to admin for backward compatibility
	}
};

async function migrateUserRoles() {
	console.log('Starting user role migration based on subscription plans...');

	try {
		const usersRef = db.collection('users');
		const snapshot = await usersRef.get();

		let migratedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const doc of snapshot.docs) {
			const userData = doc.data();
			const userId = doc.id;

			try {
				// Skip users without subscription data
				if (!userData.subscription) {
					console.log(
						`User ${userId} (${userData.email}) has no subscription data - skipping`,
					);
					skippedCount++;
					continue;
				}

				const currentRole = userData.role;
				const userType = userData.userType || 'homeowner'; // Default to homeowner if not set
				const subscriptionPlan = userData.subscription.plan || 'free';

				// Calculate correct role based on userType only (permissions controlled by subscription)
				const correctRole = getRoleFromUserType(userType);

				// Only update if role doesn't match what it should be based on userType
				if (currentRole === correctRole) {
					console.log(
						`User ${userId} (${userData.email}) already has correct role '${correctRole}' - skipping`,
					);
					skippedCount++;
					continue;
				}

				// Update user document with correct role
				await usersRef.doc(userId).update({
					role: correctRole,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});

				console.log(
					`Updated user ${userId} (${userData.email}): role '${currentRole}' -> '${correctRole}' (userType: ${userType})`,
				);
				migratedCount++;
			} catch (userError) {
				console.error(`Error processing user ${userId}:`, userError);
				errorCount++;
			}
		}

		console.log(`\nMigration complete!`);
		console.log(`Users migrated: ${migratedCount}`);
		console.log(`Users skipped: ${skippedCount}`);
		console.log(`Errors: ${errorCount}`);
		console.log(`Total users processed: ${snapshot.size}`);

		if (errorCount > 0) {
			console.log(
				'\n⚠️  Some users had errors during migration. Please check the logs above.',
			);
		}
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrateUserRoles()
	.then(() => {
		console.log('Migration script finished successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Migration script failed:', error);
		process.exit(1);
	});
