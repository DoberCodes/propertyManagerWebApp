// scripts/migrateRemoveSharedPropertiesGroups.cjs
// Migration: Remove all 'Shared Properties' team groups and property groups, but keep 'My Team' and 'My Properties' groups
// Run with: node scripts/migrateRemoveSharedPropertiesGroups.cjs

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
	credential: applicationDefault(),
});

const db = getFirestore();

async function removeSharedPropertiesGroups() {
	// Remove 'Shared Properties' team groups
	const teamGroupQuery = db
		.collection('teamGroups')
		.where('name', '==', 'Shared Properties');
	const teamGroupSnapshot = await teamGroupQuery.get();
	for (const groupDoc of teamGroupSnapshot.docs) {
		await db.collection('teamGroups').doc(groupDoc.id).delete();
		console.log(`Deleted teamGroup: ${groupDoc.id}`);
	}

	// Remove all team members in deleted groups
	const deletedTeamGroupIds = teamGroupSnapshot.docs.map((doc) => doc.id);
	if (deletedTeamGroupIds.length > 0) {
		const memberQuery = db
			.collection('teamMembers')
			.where('groupId', 'in', deletedTeamGroupIds);
		const memberSnapshot = await memberQuery.get();
		for (const memberDoc of memberSnapshot.docs) {
			await db.collection('teamMembers').doc(memberDoc.id).delete();
			console.log(`Deleted teamMember: ${memberDoc.id}`);
		}
	}

	// Remove 'Shared Properties' property groups
	const propertyGroupQuery = db
		.collection('propertyGroups')
		.where('name', '==', 'Shared Properties');
	const propertyGroupSnapshot = await propertyGroupQuery.get();
	for (const groupDoc of propertyGroupSnapshot.docs) {
		await db.collection('propertyGroups').doc(groupDoc.id).delete();
		console.log(`Deleted propertyGroup: ${groupDoc.id}`);
	}

	// Ensure every user has a 'My Team' team group and 'My Properties' property group
	const usersSnapshot = await db.collection('users').get();
	for (const userDoc of usersSnapshot.docs) {
		const userId = userDoc.id;
		// My Team
		const myTeamQuery = db
			.collection('teamGroups')
			.where('userId', '==', userId)
			.where('name', '==', 'My Team');
		const myTeamSnapshot = await myTeamQuery.get();
		if (myTeamSnapshot.empty) {
			await db.collection('teamGroups').add({
				userId,
				name: 'My Team',
				linkedProperties: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			console.log(`Created 'My Team' for user: ${userId}`);
		}
		// My Properties
		const myPropsQuery = db
			.collection('propertyGroups')
			.where('userId', '==', userId)
			.where('name', '==', 'My Properties');
		const myPropsSnapshot = await myPropsQuery.get();
		if (myPropsSnapshot.empty) {
			await db.collection('propertyGroups').add({
				userId,
				name: 'My Properties',
				properties: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			console.log(`Created 'My Properties' for user: ${userId}`);
		}
	}

	console.log('Migration complete!');
}

removeSharedPropertiesGroups().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
