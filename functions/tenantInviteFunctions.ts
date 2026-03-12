import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { assertInviteCapability } from './inviteAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

interface CreateTenantInviteRequest {
	propertyId?: string;
	tenantEmail?: string;
	code: string;
}

interface RevokeTenantInviteRequest {
	propertyId?: string;
	tenantEmail: string;
}

interface RedeemTenantInviteRequest {
	promoCode: string;
}

interface ValidateTenantInviteRequest {
	promoCode: string;
	tenantEmail: string;
}

const upsertTenantAccessFromInvites = async (params: {
	uid: string;
	email: string;
}): Promise<{
	linkedAccountIds: string[];
	linkedPropertyIds: string[];
}> => {
	const normalizedEmail = String(params.email || '').trim().toLowerCase();
	if (!normalizedEmail) {
		return { linkedAccountIds: [], linkedPropertyIds: [] };
	}

	const invitesSnapshot = await db
		.collection('tenantInvitationCodes')
		.where('tenantEmail', '==', normalizedEmail)
		.where('status', 'in', ['active', 'redeemed'])
		.get();

	if (invitesSnapshot.empty) {
		return { linkedAccountIds: [], linkedPropertyIds: [] };
	}

	const accountIds = new Set<string>();
	const propertyIds = new Set<string>();

	invitesSnapshot.docs.forEach((inviteDoc) => {
		const invite = inviteDoc.data() as any;
		const inviteAccountId = String(invite?.accountId || '').trim();
		const invitePropertyId = String(invite?.propertyId || '').trim();

		if (inviteAccountId) {
			accountIds.add(inviteAccountId);
		}

		if (invitePropertyId) {
			propertyIds.add(invitePropertyId);
		}
	});

	const linkedAccountIds = Array.from(accountIds);
	const linkedPropertyIds = Array.from(propertyIds);

	const userRef = db.collection('users').doc(params.uid);
	const userSnapshot = await userRef.get();
	const userData = userSnapshot.data() || {};

	if (linkedAccountIds.length > 0) {
		const primaryAccountId = linkedAccountIds[0];
		await userRef.set(
			{
				accountId: primaryAccountId,
				isAccountOwner: false,
				updatedAt: new Date().toISOString(),
			},
			{ merge: true },
		);

		for (const accountId of linkedAccountIds) {
			const membershipRef = db
				.collection('accountMemberships')
				.doc(`${params.uid}_${accountId}`);
			await membershipRef.set(
				{
					accountId,
					userId: params.uid,
					email: normalizedEmail,
					role: 'tenant',
					status: 'active',
					updatedAt: new Date().toISOString(),
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
		}
	}

	for (const propertyId of linkedPropertyIds) {
		const propertyRef = db.collection('properties').doc(propertyId);
		const propertySnapshot = await propertyRef.get();
		if (!propertySnapshot.exists) {
			continue;
		}

		const propertyData = propertySnapshot.data() || {};
		const existingTenants = (propertyData.tenants || []) as any[];
		const tenantAlreadyLinked = existingTenants.some(
			(tenant) =>
				String(tenant?.email || '').trim().toLowerCase() === normalizedEmail,
		);

		if (!tenantAlreadyLinked) {
			const fallbackFirstName = String(userData?.firstName || '').trim();
			const fallbackLastName = String(userData?.lastName || '').trim();
			existingTenants.push({
				id: `tenant_${params.uid}`,
				firstName: fallbackFirstName,
				lastName: fallbackLastName,
				email: normalizedEmail,
				phone: String(userData?.phone || '').trim(),
				createdAt: new Date().toISOString(),
			});

			await propertyRef.update({
				tenants: existingTenants,
				updatedAt: new Date().toISOString(),
			});
		}
	}

	return { linkedAccountIds, linkedPropertyIds };
};

export const validateTenantInvitationCode = functions.https.onCall(
	async (data: ValidateTenantInviteRequest) => {
		const promoCode = String(data?.promoCode || '').trim().toLowerCase();
		const tenantEmail = String(data?.tenantEmail || '').trim().toLowerCase();

		if (!promoCode || !tenantEmail) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'promoCode and tenantEmail are required',
			);
		}

		const snapshot = await db
			.collection('tenantInvitationCodes')
			.where('tenantEmail', '==', tenantEmail)
			.where('codeLower', '==', promoCode)
			.where('status', '==', 'active')
			.limit(1)
			.get();

		return {
			valid: !snapshot.empty,
		};
	},
);

export const createTenantInvitationCode = functions.https.onCall(
	async (data: CreateTenantInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const propertyId = String(data?.propertyId || '').trim() || undefined;
		const tenantEmail = String(data?.tenantEmail || '').trim().toLowerCase();
		const code = String(data?.code || '').trim();

		if (!tenantEmail || !code) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'tenantEmail and code are required',
			);
		}

		const { accountId } = await assertInviteCapability(
			context.auth.uid,
			'tenant',
		);
		const now = new Date().toISOString();
		const invitationCode = {
			code,
			codeLower: code.toLowerCase(),
			status: 'active' as const,
			createdByUserId: context.auth.uid,
			createdByEmail: context.auth.token.email || undefined,
			accountId,
			propertyId,
			email: tenantEmail,
			tenantEmail,
			createdAt: now,
			updatedAt: now,
		};

		const sanitized = Object.fromEntries(
			Object.entries(invitationCode).filter(([, value]) => value !== undefined),
		);
		const docRef = await db.collection('tenantInvitationCodes').add(sanitized);
		return {
			id: docRef.id,
			...sanitized,
		};
	},
);

export const revokeTenantInvitationCode = functions.https.onCall(
	async (data: RevokeTenantInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const propertyId = String(data?.propertyId || '').trim() || undefined;
		const tenantEmail = String(data?.tenantEmail || '').trim().toLowerCase();
		if (!tenantEmail) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'tenantEmail is required',
			);
		}

		const { accountId } = await assertInviteCapability(
			context.auth.uid,
			'tenant',
		);
		let inviteQuery: FirebaseFirestore.Query = db
			.collection('tenantInvitationCodes')
			.where('accountId', '==', accountId)
			.where('tenantEmail', '==', tenantEmail)
			.where('status', '==', 'active');

		if (propertyId) {
			inviteQuery = inviteQuery.where('propertyId', '==', propertyId);
		}

		const snapshot = await inviteQuery.get();
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

export const redeemTenantInvitationCode = functions.https.onCall(
	async (data: RedeemTenantInviteRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const promoCode = String(data?.promoCode || '').trim().toLowerCase();
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

		const snapshot = await db
			.collection('tenantInvitationCodes')
			.where('tenantEmail', '==', callerEmail)
			.where('codeLower', '==', promoCode)
			.where('status', '==', 'active')
			.limit(1)
			.get();

		if (snapshot.empty) {
			throw new functions.https.HttpsError(
				'not-found',
				'Invalid or expired tenant promo code',
			);
		}

		const promoDoc = snapshot.docs[0];
		const now = new Date().toISOString();
		await promoDoc.ref.update({
			status: 'redeemed',
			redeemedByUserId: context.auth.uid,
			redeemedByEmail: callerEmail,
			redeemedAt: now,
			updatedAt: now,
		});

		const accessSyncResult = await upsertTenantAccessFromInvites({
			uid: context.auth.uid,
			email: callerEmail,
		});

		return {
			success: true,
			linkedAccountIds: accessSyncResult.linkedAccountIds,
			linkedPropertyIds: accessSyncResult.linkedPropertyIds,
		};
	},
);

export const syncTenantAccessFromInvites = functions.https.onCall(
	async (_data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const callerEmail = String(context.auth.token.email || '')
			.trim()
			.toLowerCase();

		if (!callerEmail) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Authenticated user email is required',
			);
		}

		const result = await upsertTenantAccessFromInvites({
			uid: context.auth.uid,
			email: callerEmail,
		});

		return {
			success: true,
			linkedAccountIds: result.linkedAccountIds,
			linkedPropertyIds: result.linkedPropertyIds,
		};
	},
);
