const fs = require('fs');
const path = require('path');
const {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');

const FIRESTORE_RULES_PATH = path.join(__dirname, '..', 'firestore.rules');
const STORAGE_RULES_PATH = path.join(__dirname, '..', 'storage.rules');
const FIREBASE_RC_PATH = path.join(__dirname, '..', '.firebaserc');

const resolveProjectId = () => {
	const firebaseRc = JSON.parse(fs.readFileSync(FIREBASE_RC_PATH, 'utf8'));
	const projectId = firebaseRc?.projects?.default;
	if (!projectId) {
		throw new Error('Missing default Firebase project in .firebaserc.');
	}
	return projectId;
};

const PROJECT_ID = resolveProjectId();

const accountId = 'account-owner';
const ownerUid = 'account-owner';
const legacyOwnerUid = 'legacy-account-owner';
const teamMemberUid = 'team-member-user';
const outsiderUid = 'outsider-user';
const propertyId = 'property-1';
const otherPropertyId = 'property-outsider';

const membershipId = (uid, targetAccountId = accountId) =>
	`${targetAccountId}_${uid}`;

const fileData = 'maintley test file';

async function seedFirestore(env) {
	await env.withSecurityRulesDisabled(async (context) => {
		const db = context.firestore();

		await db.doc(`users/${ownerUid}`).set({
			id: ownerUid,
			accountId,
			role: 'admin',
			isAccountOwner: true,
		});

		await db.doc(`users/${teamMemberUid}`).set({
			id: teamMemberUid,
			accountId,
			role: 'maintenance_lead',
			isTeamMemberAccount: true,
		});

		await db.doc(`users/${legacyOwnerUid}`).set({
			id: legacyOwnerUid,
			accountId,
			role: 'admin',
			isAccountOwner: true,
		});

		await db.doc(`users/${outsiderUid}`).set({
			id: outsiderUid,
			accountId: outsiderUid,
			role: 'admin',
			isAccountOwner: true,
		});

		await db.doc(`accountMemberships/${membershipId(ownerUid)}`).set({
			accountId,
			userId: ownerUid,
			roles: ['account_owner', 'admin', 'member'],
			status: 'active',
		});

		await db.doc(`accountMemberships/${membershipId(teamMemberUid)}`).set({
			accountId,
			userId: teamMemberUid,
			roles: ['maintenance_lead', 'member'],
			status: 'active',
		});

		await db.doc(`accountMemberships/${membershipId(legacyOwnerUid)}`).set({
			accountId,
			userId: legacyOwnerUid,
			roles: ['account_owner', 'admin', 'member'],
		});

		await db.doc(`accountMemberships/${membershipId(outsiderUid, outsiderUid)}`).set({
			accountId: outsiderUid,
			userId: outsiderUid,
			roles: ['account_owner', 'admin', 'member'],
			status: 'active',
		});

		await db.doc(`properties/${propertyId}`).set({
			accountId,
			userId: ownerUid,
			title: 'Sand Oak Drive',
		});

		await db.doc(`properties/${otherPropertyId}`).set({
			accountId: outsiderUid,
			userId: outsiderUid,
			title: 'Outsider Property',
		});
	});
}

function storageFor(env, uid) {
	return env.authenticatedContext(uid, { email: `${uid}@example.com` }).storage();
}

function unauthenticatedStorage(env) {
	return env.unauthenticatedContext().storage();
}

function putString(storage, filePath, contentType = 'text/plain') {
	return storage.ref(filePath).putString(fileData, 'raw', { contentType });
}

async function seedStorage(env) {
	await env.withSecurityRulesDisabled(async (context) => {
		const storage = context.storage();
		await putString(storage, `properties/${accountId}/seeded-document.txt`);
		await putString(storage, `user-profile-images/${ownerUid}/profile.png`, 'image/png');
		await putString(storage, `team-member-images/${accountId}/${teamMemberUid}/profile.png`, 'image/png');
		await putString(storage, `team-member-files/${accountId}/${teamMemberUid}/credentials.pdf`, 'application/pdf');
		await putString(storage, `device-files/${propertyId}/device-1/manual.pdf`, 'application/pdf');
		await putString(storage, `maintenance-files/${propertyId}/invoice.pdf`, 'application/pdf');
		await putString(storage, `feedback-attachments/${ownerUid}/ticket-1/screenshot.png`, 'image/png');
	});
}

async function run() {
	const firestoreRules = fs.readFileSync(FIRESTORE_RULES_PATH, 'utf8');
	const storageRules = fs.readFileSync(STORAGE_RULES_PATH, 'utf8');
	const env = await initializeTestEnvironment({
		projectId: PROJECT_ID,
		firestore: {
			rules: firestoreRules,
		},
		storage: {
			rules: storageRules,
		},
	});

	try {
		await seedFirestore(env);
		await seedStorage(env);

		const ownerStorage = storageFor(env, ownerUid);
		const legacyOwnerStorage = storageFor(env, legacyOwnerUid);
		const teamMemberStorage = storageFor(env, teamMemberUid);
		const outsiderStorage = storageFor(env, outsiderUid);
		const publicStorage = unauthenticatedStorage(env);

		await assertSucceeds(
			ownerStorage.ref(`properties/${accountId}/owner-document.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertSucceeds(
			legacyOwnerStorage.ref(`properties/${accountId}/legacy-owner-document.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertFails(
			teamMemberStorage.ref(`properties/${accountId}/team-document.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);
		await assertFails(
			outsiderStorage.ref(`properties/${accountId}/outsider-document.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);
		await assertFails(
			publicStorage.ref(`properties/${accountId}/anonymous-document.txt`).getMetadata(),
		);

		await assertSucceeds(
			ownerStorage.ref(`user-profile-images/${ownerUid}/new-profile.png`).putString(
				fileData,
				'raw',
				{ contentType: 'image/png' },
			),
		);
		await assertFails(
			teamMemberStorage.ref(`user-profile-images/${ownerUid}/spoofed-profile.png`).putString(
				fileData,
				'raw',
				{ contentType: 'image/png' },
			),
		);
		await assertFails(
			ownerStorage.ref(`user-profile-images/${ownerUid}/profile.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);
		await assertSucceeds(
			teamMemberStorage.ref(`user-profile-images/${ownerUid}/profile.png`).getMetadata(),
		);

		await assertSucceeds(
			ownerStorage.ref(`team-member-images/${accountId}/${teamMemberUid}/new-profile.png`).putString(
				fileData,
				'raw',
				{ contentType: 'image/png' },
			),
		);
		await assertFails(
			teamMemberStorage.ref(`team-member-files/${accountId}/${teamMemberUid}/note.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);
		await assertSucceeds(
			ownerStorage.ref(`team-member-files/${accountId}/${teamMemberUid}/note.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);
		await assertFails(
			outsiderStorage.ref(`team-member-files/${accountId}/${teamMemberUid}/outsider.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);

		await assertSucceeds(
			teamMemberStorage.ref(`device-files/${propertyId}/device-1/manual.pdf`).getMetadata(),
		);
		await assertFails(
			teamMemberStorage.ref(`device-files/${propertyId}/device-1/new-manual.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertSucceeds(
			ownerStorage.ref(`device-files/${propertyId}/device-1/new-manual.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertFails(
			outsiderStorage.ref(`device-files/${propertyId}/device-1/outsider.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertFails(
			ownerStorage.ref(`device-files/${otherPropertyId}/device-1/owner.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);

		await assertSucceeds(
			ownerStorage.ref(`maintenance-files/${propertyId}/invoice.pdf`).getMetadata(),
		);
		await assertFails(
			teamMemberStorage.ref(`maintenance-files/${propertyId}/new-invoice.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertSucceeds(
			ownerStorage.ref(`maintenance-files/${propertyId}/new-invoice.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);
		await assertFails(
			outsiderStorage.ref(`maintenance-files/${propertyId}/outsider.pdf`).putString(
				fileData,
				'raw',
				{ contentType: 'application/pdf' },
			),
		);

		await assertSucceeds(
			ownerStorage.ref(`properties/${accountId}/seeded-document.txt`).delete(),
		);
		await assertFails(
			teamMemberStorage.ref(`device-files/${propertyId}/device-1/manual.pdf`).delete(),
		);
		await assertFails(
			outsiderStorage.ref(`maintenance-files/${propertyId}/invoice.pdf`).delete(),
		);

		await assertSucceeds(
			ownerStorage.ref('feedback-attachments/account-owner/ticket-1/screenshot.png').getMetadata(),
		);
		await assertFails(
			teamMemberStorage.ref('feedback-attachments/account-owner/ticket-1/screenshot.png').getMetadata(),
		);
		await assertFails(
			ownerStorage.ref('feedback-attachments/account-owner/ticket-2/client-upload.png').putString(
				fileData,
				'raw',
				{ contentType: 'image/png' },
			),
		);

		const quotaPath = `properties/${accountId}/quota-approved.txt`;
		await env.withSecurityRulesDisabled(async (context) => {
			const db = context.firestore();
			await db.doc('appConfig/entitlementRollout').set({ trustedStorageQuotaRequired: true });
			await db.doc('storageUploadReservations/reservation-approved').set({
				accountId,
				storagePath: quotaPath,
				sizeBytes: Buffer.byteLength(fileData),
				status: 'reserved',
				expiresAt: new Date(Date.now() + 10 * 60 * 1000),
			});
			await db.doc('storageUploadReservations/reservation-wrong-path').set({
				accountId,
				storagePath: `properties/${accountId}/different.txt`,
				sizeBytes: Buffer.byteLength(fileData),
				status: 'reserved',
				expiresAt: new Date(Date.now() + 10 * 60 * 1000),
			});
		});
		await assertFails(
			ownerStorage.ref(`properties/${accountId}/quota-bypass.txt`).putString(
				fileData,
				'raw',
				{ contentType: 'text/plain' },
			),
		);
		await assertFails(
			ownerStorage.ref(quotaPath).putString(fileData, 'raw', {
				contentType: 'text/plain',
				customMetadata: { quotaReservationId: 'reservation-wrong-path', accountId },
			}),
		);
		await assertSucceeds(
			ownerStorage.ref(quotaPath).putString(fileData, 'raw', {
				contentType: 'text/plain',
				customMetadata: { quotaReservationId: 'reservation-approved', accountId },
			}),
		);
		await assertSucceeds(ownerStorage.ref(quotaPath).delete());

		await assertFails(
			ownerStorage.ref('unknown/path/file.txt').putString(fileData, 'raw', {
				contentType: 'text/plain',
			}),
		);

		console.log('Storage rules permission boundary tests passed.');
	} finally {
		await env.cleanup();
	}
}

run().catch((error) => {
	console.error('Storage rules permission boundary tests failed.');
	console.error(error);
	process.exit(1);
});
