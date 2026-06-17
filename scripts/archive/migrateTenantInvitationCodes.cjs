const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateTenantPromoCodes() {
	console.log(
		'Starting migration of tenantPromoCodes to tenantInvitationCodes...',
	);

	try {
		const snapshot = await db.collection('tenantPromoCodes').get();
		const batch = db.batch();
		let migratedCount = 0;

		for (const doc of snapshot.docs) {
			const data = doc.data();

			// Create new document in tenantInvitationCodes collection
			const newDocRef = db.collection('tenantInvitationCodes').doc();
			const newData = {
				...data,
				// Rename fields if needed (keeping same structure for now)
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			};

			batch.set(newDocRef, newData);
			migratedCount++;

			// Delete old document
			batch.delete(doc.ref);
		}

		await batch.commit();
		console.log(
			`Successfully migrated ${migratedCount} documents to tenantInvitationCodes collection.`,
		);
	} catch (error) {
		console.error('Error migrating tenant promo codes:', error);
	}
}

async function migrateTenantFields() {
	console.log('Starting migration of tenant field names...');

	try {
		const propertiesSnapshot = await db.collection('properties').get();
		let updatedCount = 0;

		for (const propertyDoc of propertiesSnapshot.docs) {
			const propertyData = propertyDoc.data();
			const tenants = propertyData.tenants || [];

			let hasUpdates = false;
			const updatedTenants = tenants.map((tenant) => {
				if (tenant.tenantPromoCodeId) {
					hasUpdates = true;
					return {
						...tenant,
						tenantInvitationCodeId: tenant.tenantPromoCodeId,
						// Remove old field
						...Object.fromEntries(
							Object.entries(tenant).filter(
								([key]) => key !== 'tenantPromoCodeId',
							),
						),
					};
				}
				return tenant;
			});

			if (hasUpdates) {
				await propertyDoc.ref.update({ tenants: updatedTenants });
				updatedCount++;
			}
		}

		console.log(
			`Successfully updated ${updatedCount} properties with new tenant field names.`,
		);
	} catch (error) {
		console.error('Error migrating tenant fields:', error);
	}
}

async function main() {
	try {
		await migrateTenantPromoCodes();
		await migrateTenantFields();
		console.log('All migrations completed successfully!');
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}

	process.exit(0);
}

main();
