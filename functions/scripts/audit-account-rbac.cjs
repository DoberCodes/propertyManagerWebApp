const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
	console.error('Missing serviceAccountKey.json at', keyPath);
	process.exit(1);
}

const svc = require(keyPath);
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(svc),
		projectId: svc.project_id,
	});
}

const db = admin.firestore();

async function main() {
	const usersSnap = await db.collection('users').get();
	let usersMissingAccountId = 0;
	let usersMissingMembership = 0;
	let usersDisabledMembership = 0;
	const missingMembershipUsers = [];

	for (const userDoc of usersSnap.docs) {
		const data = userDoc.data() || {};
		const accountId = String(data.accountId || '').trim();
		if (!accountId) {
			usersMissingAccountId += 1;
			continue;
		}

		const membershipId = `${accountId}_${userDoc.id}`;
		const membershipDoc = await db
			.collection('accountMemberships')
			.doc(membershipId)
			.get();

		if (!membershipDoc.exists) {
			usersMissingMembership += 1;
			if (missingMembershipUsers.length < 25) {
				missingMembershipUsers.push({
					uid: userDoc.id,
					email: data.email || '',
					accountId,
				});
			}
			continue;
		}

		const membershipData = membershipDoc.data() || {};
		if (membershipData.status && membershipData.status !== 'active') {
			usersDisabledMembership += 1;
		}
	}

	const collections = [
		'propertyGroups',
		'properties',
		'tasks',
		'maintenanceHistory',
		'teamGroups',
		'teamMembers',
		'devices',
		'units',
		'suites',
		'contractors',
	];

	const collectionStats = [];
	for (const name of collections) {
		const snapshot = await db.collection(name).get();
		let missingAccountId = 0;
		for (const doc of snapshot.docs) {
			const data = doc.data() || {};
			if (!String(data.accountId || '').trim()) {
				missingAccountId += 1;
			}
		}
		collectionStats.push({
			collection: name,
			total: snapshot.size,
			missingAccountId,
		});
	}

	const accountValueBuckets = {};
	const usersSnapshot = await db.collection('users').get();
	for (const userDoc of usersSnapshot.docs) {
		const data = userDoc.data() || {};
		const accountId = String(data.accountId || '').trim();
		if (!accountId) continue;
		accountValueBuckets[accountId] = (accountValueBuckets[accountId] || 0) + 1;
	}

	const accountStats = [];
	for (const accountId of Object.keys(accountValueBuckets)) {
		const properties = await db
			.collection('properties')
			.where('accountId', '==', accountId)
			.get();
		const groups = await db
			.collection('propertyGroups')
			.where('accountId', '==', accountId)
			.get();

		accountStats.push({
			accountId,
			users: accountValueBuckets[accountId],
			properties: properties.size,
			propertyGroups: groups.size,
		});
	}

	const lookupEmail = (process.argv[2] || process.env.E2E_DEMO_EMAIL || '')
		.toLowerCase()
		.trim();
	let lookupUser = null;
	if (lookupEmail) {
		const userByEmailSnapshot = await db
			.collection('users')
			.where('email', '==', lookupEmail)
			.limit(1)
			.get();

		if (!userByEmailSnapshot.empty) {
			const userDoc = userByEmailSnapshot.docs[0];
			const userData = userDoc.data() || {};
			const accountId = String(userData.accountId || '').trim();
			const membershipId = `${accountId}_${userDoc.id}`;
			const membership = await db
				.collection('accountMemberships')
				.doc(membershipId)
				.get();
			lookupUser = {
				email: lookupEmail,
				uid: userDoc.id,
				accountId,
				role: userData.role || null,
				isAccountOwner: !!userData.isAccountOwner,
				membershipExists: membership.exists,
				membership: membership.exists ? membership.data() : null,
			};
		}
	}

	console.log(
		JSON.stringify(
			{
				usersTotal: usersSnap.size,
				usersMissingAccountId,
				usersMissingMembership,
				usersDisabledMembership,
				missingMembershipUsers,
				collectionStats,
				accountStats,
				lookupUser,
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error('Audit failed:', error);
	process.exit(1);
});
