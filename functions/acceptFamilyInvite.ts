import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { createHash } from 'crypto';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const hashToken = (token: string): string =>
	createHash('sha256').update(token).digest('hex');

interface AcceptFamilyInviteRequest {
	inviteId: string;
	token: string;
}

const normalizeFamilyMemberRole = (role: unknown): 'admin' | 'member' =>
	role === 'admin' ? 'admin' : 'member';

const getFamilyMembershipRoles = (role: 'admin' | 'member'): string[] =>
	role === 'admin' ? ['member', 'admin'] : ['member'];

export const acceptFamilyInvite = functions.https.onCall(
	async (data: AcceptFamilyInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const inviteId = String(data?.inviteId || '').trim();
		const token = String(data?.token || '').trim();
		if (!inviteId || !token) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'inviteId and token are required',
			);
		}

		const callerUid = context.auth.uid;
		const callerEmail = String(context.auth.token.email || '').toLowerCase();
		if (!callerEmail) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Authenticated user email is required to accept an invite',
			);
		}

		const inviteRef = db.collection('familyInvites').doc(inviteId);

		await db.runTransaction(async (transaction) => {
			const inviteDoc = await transaction.get(inviteRef);
			if (!inviteDoc.exists) {
				throw new functions.https.HttpsError('not-found', 'Invite not found');
			}

			const inviteData = inviteDoc.data() || {};
			if (inviteData.status !== 'pending') {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'Invite is no longer active',
				);
			}

			if (
				typeof inviteData.expiresAt === 'number' &&
				inviteData.expiresAt <= Date.now()
			) {
				transaction.update(inviteRef, {
					status: 'expired',
					updatedAt: Date.now(),
				});
				throw new functions.https.HttpsError(
					'failed-precondition',
					'Invite has expired',
				);
			}

			if (inviteData.emailLower !== callerEmail) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'This invite is for a different email address',
				);
			}

			if (inviteData.tokenHash !== hashToken(token)) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'Invalid invite token',
				);
			}

			const accountId = String(inviteData.accountId || '').trim();
			const accountRef = db.collection('familyAccounts').doc(accountId);
			const userRef = db.collection('users').doc(callerUid);
			const membershipRef = db
				.collection('accountMemberships')
				.doc(`${accountId}_${callerUid}`);

			const [accountDoc, userDoc] = await Promise.all([
				transaction.get(accountRef),
				transaction.get(userRef),
			]);

			if (!accountDoc.exists) {
				throw new functions.https.HttpsError(
					'not-found',
					'Family account not found',
				);
			}

			if (!userDoc.exists) {
				throw new functions.https.HttpsError(
					'not-found',
					'User profile not found',
				);
			}

			const accountData = accountDoc.data() || {};
			const userData = userDoc.data() || {};
			const memberIds = Array.isArray(accountData.memberIds)
				? (accountData.memberIds as string[])
				: [];

			if (
				userData.accountId &&
				userData.accountId !== accountId &&
				userData.accountId !== callerUid
			) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					'You already belong to another family account',
				);
			}

			if (!memberIds.includes(callerUid) && memberIds.length >= 3) {
				throw new functions.https.HttpsError(
					'resource-exhausted',
					'Family account member limit has been reached',
				);
			}

			if (!memberIds.includes(callerUid)) {
				transaction.update(accountRef, {
					memberIds: admin.firestore.FieldValue.arrayUnion(callerUid),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			const role = normalizeFamilyMemberRole(inviteData.role || userData.role);

			transaction.update(userRef, {
				accountId,
				isAccountOwner: false,
				isTeamMemberAccount: false,
				onboardingCompleted: true,
				role,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			transaction.set(
				membershipRef,
				{
					accountId,
					userId: callerUid,
					roles: getFamilyMembershipRoles(role),
					status: 'active',
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);

			transaction.update(inviteRef, {
				status: 'accepted',
				acceptedAt: Date.now(),
				acceptedByUserId: callerUid,
				updatedAt: Date.now(),
			});
		});

		return { success: true, message: 'Family invite accepted' };
	},
);
