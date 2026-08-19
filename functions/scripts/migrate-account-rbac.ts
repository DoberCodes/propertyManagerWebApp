import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

type UserRecord = {
	accountId?: string;
	isAccountOwner?: boolean;
	role?: string;
	email?: string;
};

type CollectionMigration = {
	name: string;
	ownerField: string;
};

const ACCOUNT_SCOPED_COLLECTIONS: CollectionMigration[] = [
	{ name: 'propertyGroups', ownerField: 'userId' },
	{ name: 'properties', ownerField: 'userId' },
	{ name: 'tasks', ownerField: 'userId' },
	{ name: 'teamGroups', ownerField: 'userId' },
	{ name: 'teamMembers', ownerField: 'userId' },
	{ name: 'units', ownerField: 'userId' },
	{ name: 'devices', ownerField: 'userId' },
	{ name: 'suites', ownerField: 'userId' },
	{ name: 'contractors', ownerField: 'userId' },
	{ name: 'maintenanceHistory', ownerField: 'userId' },
	{ name: 'tenantInvitationCodes', ownerField: 'landlordId' },
	{ name: 'tenantProfiles', ownerField: 'landlordId' },
];

const roleToPermissionRoles = (role?: string): string[] => {
	if (!role) return ['member'];
	if (role === 'admin') return ['admin'];
	if (
		role === 'property_manager' ||
		role === 'assistant_manager' ||
		role === 'maintenance_lead'
	) {
		return ['manager'];
	}
	if (role === 'tenant') return ['tenant'];
	return ['member'];
};

const membershipDocId = (accountId: string, userId: string): string =>
	`${accountId}_${userId}`;

const upsertMembership = async (
	accountId: string,
	userId: string,
	roles: string[],
	source: string,
): Promise<void> => {
	const ref = db
		.collection('accountMemberships')
		.doc(membershipDocId(accountId, userId));

	await ref.set(
		{
			accountId,
			userId,
			status: 'active',
			roles: admin.firestore.FieldValue.arrayUnion(...roles),
			source,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{ merge: true },
	);
};

const migrateUsersAndMemberships = async (): Promise<
	Map<string, { accountId: string; role?: string }>
> => {
	const userMap = new Map<string, { accountId: string; role?: string }>();
	const usersSnapshot = await db.collection('users').get();

	for (const userDoc of usersSnapshot.docs) {
		const uid = userDoc.id;
		const data = (userDoc.data() || {}) as UserRecord;
		const accountId = String(data.accountId || uid).trim() || uid;
		const isAccountOwner = accountId === uid || data.isAccountOwner === true;

		userMap.set(uid, { accountId, role: data.role });

		await userDoc.ref.set(
			{
				accountId,
				isAccountOwner,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		await upsertMembership(
			accountId,
			uid,
			[
				...(isAccountOwner ? ['account_owner', 'admin'] : []),
				...roleToPermissionRoles(data.role),
			],
			'user-migration',
		);
	}

	return userMap;
};

const migrateFamilyMemberships = async (
	userMap: Map<string, { accountId: string; role?: string }>,
): Promise<void> => {
	const familySnapshot = await db.collection('familyAccounts').get();

	for (const familyDoc of familySnapshot.docs) {
		const accountId = familyDoc.id;
		const familyData = familyDoc.data() || {};
		const ownerId = String(familyData.ownerId || '').trim();
		const memberIds = Array.isArray(familyData.memberIds)
			? (familyData.memberIds as string[])
			: [];

		if (ownerId) {
			await upsertMembership(
				accountId,
				ownerId,
				['family_owner', 'account_owner', 'admin'],
				'family-migration',
			);
		}

		for (const memberId of memberIds) {
			if (!memberId) continue;
			if (memberId === ownerId) continue;

			const userRole = userMap.get(memberId)?.role;
			const familyRole =
				userRole === 'admin' ? 'family_admin' : 'family_member';

			await upsertMembership(
				accountId,
				memberId,
				[familyRole, ...(userRole === 'admin' ? ['admin'] : ['member'])],
				'family-migration',
			);

			const userRef = db.collection('users').doc(memberId);
			await userRef.set(
				{
					accountId,
					isAccountOwner: false,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
		}
	}
};

const migrateCollectionAccountIds = async (
	userMap: Map<string, { accountId: string; role?: string }>,
): Promise<void> => {
	for (const migration of ACCOUNT_SCOPED_COLLECTIONS) {
		const snapshot = await db.collection(migration.name).get();
		const writer = db.bulkWriter();
		let updatedCount = 0;

		for (const document of snapshot.docs) {
			const data = document.data() as Record<string, unknown>;
			const ownerUserId = String(data[migration.ownerField] || '').trim();
			if (!ownerUserId) continue;

			const accountId = userMap.get(ownerUserId)?.accountId || ownerUserId;
			const currentAccountId = String(data.accountId || '').trim();
			if (currentAccountId === accountId) continue;

			writer.set(
				document.ref,
				{
					accountId,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
			updatedCount += 1;
		}

		await writer.close();
		console.log(`Migrated ${updatedCount} docs in ${migration.name}`);
	}
};

const migrateTenantsToMemberships = async (): Promise<void> => {
	const tenantProfiles = await db.collection('tenantProfiles').get();
	for (const tenantDoc of tenantProfiles.docs) {
		const data = tenantDoc.data() as Record<string, unknown>;
		const accountId = String(data.accountId || '').trim();
		const tenantId = String(data.tenantId || '').trim();
		if (!accountId || !tenantId) continue;

		await upsertMembership(accountId, tenantId, ['tenant'], 'tenant-migration');
	}
};

const run = async (): Promise<void> => {
	console.log('Starting account RBAC migration...');

	const userMap = await migrateUsersAndMemberships();
	console.log(`Processed ${userMap.size} users`);

	await migrateFamilyMemberships(userMap);
	console.log('Family memberships migrated');

	await migrateCollectionAccountIds(userMap);
	console.log('Account-scoped collections migrated');

	await migrateTenantsToMemberships();
	console.log('Tenant memberships migrated');

	console.log('Account RBAC migration completed successfully');
};

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Migration failed:', error);
		process.exit(1);
	});
