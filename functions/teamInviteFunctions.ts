import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { assertInviteCapability } from './inviteAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

interface CreateTeamMemberInviteRequest {
	teamMemberId: string;
	teamMemberEmail: string;
	code: string;
}

interface RevokeTeamMemberInviteRequest {
	teamMemberId: string;
}

interface RedeemTeamMemberInviteRequest {
	promoCode: string;
	teamMemberEmail?: string;
}

interface ValidateTeamMemberInviteRequest {
	promoCode: string;
	teamMemberEmail: string;
}

export const validateTeamMemberInvitationCode = functions.https.onCall(
	async (data: ValidateTeamMemberInviteRequest) => {
		const promoCode = String(data?.promoCode || '').trim().toLowerCase();
		const teamMemberEmail = String(data?.teamMemberEmail || '')
			.trim()
			.toLowerCase();

		if (!promoCode || !teamMemberEmail) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'promoCode and teamMemberEmail are required',
			);
		}

		const snapshot = await db
			.collection('teamMemberInvitationCodes')
			.where('teamMemberEmail', '==', teamMemberEmail)
			.where('codeLower', '==', promoCode)
			.where('status', '==', 'active')
			.limit(1)
			.get();

		if (snapshot.empty) {
			return { valid: false };
		}

		const inviteDoc = snapshot.docs[0];
		const inviteData = inviteDoc.data() as {
			teamMemberId?: string;
			accountId?: string;
			expiresAt?: string;
		};

		if (inviteData.expiresAt) {
			const expiresAtMs = new Date(inviteData.expiresAt).getTime();
			if (!Number.isNaN(expiresAtMs) && expiresAtMs < Date.now()) {
				return { valid: false };
			}
		}

		let teamMemberRole: string | null = null;
		if (inviteData.teamMemberId) {
			const teamMemberDoc = await db
				.collection('teamMembers')
				.doc(inviteData.teamMemberId)
				.get();
			if (teamMemberDoc.exists) {
				const teamMemberData = teamMemberDoc.data() as { role?: string };
				teamMemberRole = teamMemberData?.role || null;
			}
		}

		return {
			valid: true,
			teamMemberId: inviteData.teamMemberId || null,
			accountId: inviteData.accountId || null,
			role: teamMemberRole,
		};
	},
);

export const createTeamMemberInvitationCode = functions.https.onCall(
	async (data: CreateTeamMemberInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const teamMemberId = String(data?.teamMemberId || '').trim();
		const teamMemberEmail = String(data?.teamMemberEmail || '')
			.trim()
			.toLowerCase();
		const code = String(data?.code || '').trim();

		if (!teamMemberId || !teamMemberEmail || !code) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'teamMemberId, teamMemberEmail, and code are required',
			);
		}

		const { accountId } = await assertInviteCapability(context.auth.uid, 'team');
		const now = new Date().toISOString();
		const expiresAt = new Date(
			Date.now() + 7 * 24 * 60 * 60 * 1000,
		).toISOString();
		const invitationCode = {
			code,
			codeLower: code.toLowerCase(),
			status: 'active' as const,
			accountId,
			createdBy: context.auth.uid,
			createdByUserId: context.auth.uid,
			createdByEmail: context.auth.token.email || undefined,
			email: teamMemberEmail,
			teamMemberEmail,
			teamMemberId,
			createdAt: now,
			updatedAt: now,
			expiresAt,
		};

		const docRef = await db
			.collection('teamMemberInvitationCodes')
			.add(invitationCode);

		return {
			id: docRef.id,
			...invitationCode,
		};
	},
);

export const revokeTeamMemberInvitationCode = functions.https.onCall(
	async (data: RevokeTeamMemberInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const teamMemberId = String(data?.teamMemberId || '').trim();
		if (!teamMemberId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'teamMemberId is required',
			);
		}

		const { accountId } = await assertInviteCapability(context.auth.uid, 'team');
		const snapshot = await db
			.collection('teamMemberInvitationCodes')
			.where('accountId', '==', accountId)
			.where('teamMemberId', '==', teamMemberId)
			.where('status', '==', 'active')
			.get();

		const now = new Date().toISOString();
		const batch = db.batch();
		snapshot.docs.forEach((docSnap) => {
			batch.update(docSnap.ref, {
				status: 'revoked',
				revokedAt: now,
				updatedAt: now,
			});
		});
		await batch.commit();

		return { success: true, revokedCount: snapshot.size };
	},
);

export const redeemTeamMemberInvitationCode = functions.https.onCall(
	async (data: RedeemTeamMemberInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const promoCode = String(data?.promoCode || '').trim().toLowerCase();
		const requestedEmail = String(data?.teamMemberEmail || '')
			.trim()
			.toLowerCase();
		const callerEmail = String(context.auth.token.email || '').trim().toLowerCase();

		if (!promoCode) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'promoCode is required',
			);
		}

		if (!callerEmail) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Authenticated user email is required',
			);
		}

		if (requestedEmail && requestedEmail !== callerEmail) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Promo code is not valid for this email',
			);
		}

		const snapshot = await db
			.collection('teamMemberInvitationCodes')
			.where('teamMemberEmail', '==', callerEmail)
			.where('codeLower', '==', promoCode)
			.where('status', '==', 'active')
			.limit(1)
			.get();

		if (snapshot.empty) {
			throw new functions.https.HttpsError(
				'not-found',
				'Invalid or expired promo code',
			);
		}

		const promoDoc = snapshot.docs[0];
		const now = new Date().toISOString();
		await promoDoc.ref.update({
			status: 'redeemed',
			redeemedByUserId: context.auth.uid,
			redeemedByEmail: callerEmail,
			redeemedAt: now,
			expiresAt: null,
			updatedAt: now,
		});

		return { success: true };
	},
);
