import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { assertInviteCapability } from './inviteAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const upsertTeamMemberAccess = async (params: {
	uid: string;
	email: string;
	accountId: string;
	teamMemberId?: string;
	role?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	title?: string | null;
	phone?: string | null;
	address?: string | null;
	image?: string | null;
}) => {
	const now = new Date().toISOString();
	const normalizedEmail = String(params.email || '').trim().toLowerCase();
	const accountId = String(params.accountId || '').trim();

	if (!normalizedEmail || !accountId) {
		return;
	}

	await db.collection('users').doc(params.uid).set(
		{
			accountId,
			isAccountOwner: false,
			isTeamMemberAccount: true,
			...(params.teamMemberId ? { teamMemberId: params.teamMemberId } : {}),
			...(params.role !== undefined && params.role !== null
				? { role: params.role }
				: {}),
			...(params.firstName !== undefined && params.firstName !== null
				? { firstName: params.firstName }
				: {}),
			...(params.lastName !== undefined && params.lastName !== null
				? { lastName: params.lastName }
				: {}),
			...(params.title !== undefined && params.title !== null
				? { title: params.title }
				: {}),
			...(params.phone !== undefined && params.phone !== null
				? { phone: params.phone }
				: {}),
			...(params.address !== undefined && params.address !== null
				? { address: params.address }
				: {}),
			...(params.image !== undefined && params.image !== null
				? { image: params.image }
				: {}),
			updatedAt: now,
		},
		{ merge: true },
	);

	await db
		.collection('accountMemberships')
		.doc(`${accountId}_${params.uid}`)
		.set(
			{
				accountId,
				userId: params.uid,
				email: normalizedEmail,
				role: 'team_member',
				roles: ['team_member'],
				...(params.role ? { appRole: params.role } : {}),
				status: 'active',
				updatedAt: now,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

	if (params.teamMemberId) {
		await db.collection('teamMembers').doc(params.teamMemberId).set(
			{
				userAccountId: params.uid,
				redeemedByUserId: params.uid,
				redeemedAt: now,
				invitationCodeStatus: 'redeemed',
				updatedAt: now,
			},
			{ merge: true },
		);
	}
};

const findLinkedTeamMemberId = async (
	accountId: string,
	linkedUserId: string,
): Promise<string | null> => {
	const userAccountSnapshot = await db
		.collection('teamMembers')
		.where('accountId', '==', accountId)
		.where('userAccountId', '==', linkedUserId)
		.limit(1)
		.get();

	if (!userAccountSnapshot.empty) {
		return userAccountSnapshot.docs[0].id;
	}

	const redeemedBySnapshot = await db
		.collection('teamMembers')
		.where('accountId', '==', accountId)
		.where('redeemedByUserId', '==', linkedUserId)
		.limit(1)
		.get();

	return redeemedBySnapshot.empty ? null : redeemedBySnapshot.docs[0].id;
};

const findNextActiveTeamMembership = async (
	currentAccountId: string,
	linkedUserId: string,
): Promise<admin.firestore.QueryDocumentSnapshot | null> => {
	const membershipSnapshot = await db
		.collection('accountMemberships')
		.where('userId', '==', linkedUserId)
		.get();

	return (
		membershipSnapshot.docs.find((membershipDoc) => {
			const membership = membershipDoc.data() || {};
			const accountId = String(membership.accountId || '').trim();
			const status = String(membership.status || 'active').trim().toLowerCase();
			const roles = Array.isArray(membership.roles) ? membership.roles : [];
			const role = String(membership.role || '').trim();

			return (
				accountId &&
				accountId !== currentAccountId &&
				status !== 'disabled' &&
				status !== 'revoked' &&
				(role === 'team_member' || roles.includes('team_member'))
			);
		}) || null
	);
};

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
			.where('status', 'in', ['active', 'redeemed'])
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

		const teamMemberRef = db.collection('teamMembers').doc(teamMemberId);
		const teamMemberDoc = await teamMemberRef.get();
		const teamMemberData = teamMemberDoc.data() || {};
		const linkedUserId = String(
			teamMemberData.userAccountId || teamMemberData.redeemedByUserId || '',
		).trim();
		let shouldDeleteLinkedAccount = false;

		if (linkedUserId) {
			const nextMembership = await findNextActiveTeamMembership(
				accountId,
				linkedUserId,
			);
			const membershipRef = db
				.collection('accountMemberships')
				.doc(`${accountId}_${linkedUserId}`);
			batch.set(
				membershipRef,
				{
					status: 'disabled',
					disabledAt: now,
					updatedAt: now,
				},
				{ merge: true },
			);

			if (nextMembership) {
				const nextMembershipData = nextMembership.data() || {};
				const nextAccountId = String(nextMembershipData.accountId || '').trim();
				const nextTeamMemberId = nextAccountId
					? await findLinkedTeamMemberId(nextAccountId, linkedUserId)
					: null;

				batch.set(
					db.collection('users').doc(linkedUserId),
					{
						accountId: nextAccountId,
						isAccountOwner: false,
						isTeamMemberAccount: true,
						teamMemberId:
							nextTeamMemberId || admin.firestore.FieldValue.delete(),
						updatedAt: now,
					},
					{ merge: true },
				);
			} else {
				shouldDeleteLinkedAccount = true;
				batch.delete(db.collection('users').doc(linkedUserId));
			}
		}

		batch.set(
			teamMemberRef,
			{
				invitationCodeStatus: 'revoked',
				userAccountId: admin.firestore.FieldValue.delete(),
				redeemedByUserId: admin.firestore.FieldValue.delete(),
				redeemedAt: admin.firestore.FieldValue.delete(),
				updatedAt: now,
			},
			{ merge: true },
		);

		await batch.commit();

		if (linkedUserId && shouldDeleteLinkedAccount) {
			try {
				await admin.auth().deleteUser(linkedUserId);
			} catch (authError: any) {
				if (authError?.code !== 'auth/user-not-found') {
					console.error('Failed to delete revoked team member auth user:', authError);
				}
			}
		}

		return {
			success: true,
			revokedCount: snapshot.size,
			accountDeleted: shouldDeleteLinkedAccount,
		};
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
		const inviteData = promoDoc.data() as {
			accountId?: string;
			teamMemberId?: string;
		};
		const now = new Date().toISOString();
		await promoDoc.ref.update({
			status: 'redeemed',
			redeemedByUserId: context.auth.uid,
			redeemedByEmail: callerEmail,
			redeemedAt: now,
			expiresAt: null,
			updatedAt: now,
		});

		let teamMemberProfile: {
			role?: string;
			firstName?: string;
			lastName?: string;
			title?: string;
			phone?: string;
			address?: string;
			image?: string;
		} | null = null;
		if (inviteData.teamMemberId) {
			const teamMemberDoc = await db
				.collection('teamMembers')
				.doc(inviteData.teamMemberId)
				.get();
			if (teamMemberDoc.exists) {
				teamMemberProfile = teamMemberDoc.data() as {
					role?: string;
					firstName?: string;
					lastName?: string;
					title?: string;
					phone?: string;
					address?: string;
					image?: string;
				};
			}
		}

		if (inviteData.accountId) {
			await upsertTeamMemberAccess({
				uid: context.auth.uid,
				email: callerEmail,
				accountId: inviteData.accountId,
				teamMemberId: inviteData.teamMemberId,
				role: teamMemberProfile?.role || null,
				firstName: teamMemberProfile?.firstName || null,
				lastName: teamMemberProfile?.lastName || null,
				title: teamMemberProfile?.title || null,
				phone: teamMemberProfile?.phone || null,
				address: teamMemberProfile?.address || null,
				image: teamMemberProfile?.image || null,
			});
		}

		return {
			success: true,
			accountId: inviteData.accountId || null,
			teamMemberId: inviteData.teamMemberId || null,
		};
	},
);
