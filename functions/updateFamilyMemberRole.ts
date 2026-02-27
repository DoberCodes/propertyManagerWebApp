import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

interface UpdateFamilyMemberRoleRequest {
	accountId: string;
	memberId: string;
	role: 'admin' | 'member';
}

export const updateFamilyMemberRole = functions.https.onCall(
	async (data: UpdateFamilyMemberRoleRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const callerUid = context.auth.uid;
		const accountId = String(data?.accountId || '').trim();
		const memberId = String(data?.memberId || '').trim();
		const role = String(data?.role || '').trim() as 'admin' | 'member';

		if (!accountId || !memberId || !role) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'accountId, memberId, and role are required',
			);
		}

		if (!['admin', 'member'].includes(role)) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Role must be either admin or member',
			);
		}

		const callerDoc = await db.collection('users').doc(callerUid).get();
		const callerData = callerDoc.data() || {};
		const accountDoc = await db.collection('familyAccounts').doc(accountId).get();

		if (!accountDoc.exists) {
			throw new functions.https.HttpsError('not-found', 'Family account not found');
		}

		const accountData = accountDoc.data() || {};
		const memberIds = Array.isArray(accountData.memberIds)
			? (accountData.memberIds as string[])
			: [];

		const callerIsOwner = accountData.ownerId === callerUid;
		const callerIsAdmin =
			callerData.accountId === accountId && callerData.role === 'admin';

		if (!callerIsOwner && !callerIsAdmin) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Only account owners or admins can update family member roles',
			);
		}

		if (!memberIds.includes(memberId)) {
			throw new functions.https.HttpsError(
				'not-found',
				'Family member not found in account',
			);
		}

		if (memberId === accountData.ownerId) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Cannot change the account owner role',
			);
		}

		await db.collection('users').doc(memberId).update({
			role,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		const membershipRef = db
			.collection('accountMemberships')
			.doc(`${accountId}_${memberId}`);
		const membershipDoc = await membershipRef.get();
		if (membershipDoc.exists) {
			await membershipRef.set(
				{
					roles: [role],
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
		}

		return {
			success: true,
			message: `Updated family member role to ${role}`,
		};
	},
);
