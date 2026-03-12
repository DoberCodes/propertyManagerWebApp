import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const deriveMembershipRoles = (
	isAccountOwner: boolean,
	userRole?: string,
): string[] => {
	const roles = new Set<string>(['member']);
	const normalizedRole = String(userRole || '').trim().toLowerCase();

	if (isAccountOwner) {
		roles.add('family_owner');
		roles.add('account_owner');
		roles.add('admin');
	}

	if (normalizedRole === 'admin' || normalizedRole === 'property_manager') {
		roles.add('admin');
	}

	if (normalizedRole === 'assistant_manager') {
		roles.add('manager');
	}

	return Array.from(roles);
};

const serializeFirestoreValue = (value: unknown): unknown => {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value))
		return value.map((item) => serializeFirestoreValue(item));
	if (typeof value === 'object') {
		if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
			return ((value as { toDate: () => Date }).toDate() as Date).toISOString();
		}
		const output: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(
			value as Record<string, unknown>,
		)) {
			output[key] = serializeFirestoreValue(nestedValue);
		}
		return output;
	}
	return value;
};

interface EnsureFamilyAccountRequest {
	accountId?: string;
	syncSubscription?: boolean;
	subscription?: Record<string, unknown>;
}

export const ensureFamilyAccount = functions.https.onCall(
	async (data: EnsureFamilyAccountRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const uid = context.auth.uid;
		const userRef = db.collection('users').doc(uid);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			throw new functions.https.HttpsError(
				'not-found',
				'User profile not found',
			);
		}

		const userData = userDoc.data() || {};
		const requestedAccountId = String(data?.accountId || '').trim();
		const accountId =
			requestedAccountId || String(userData.accountId || '').trim() || uid;
		const isOwner =
			userData.isAccountOwner === true ||
			accountId === uid ||
			userData.id === uid;

		const accountRef = db.collection('familyAccounts').doc(accountId);
		const membershipRef = db
			.collection('accountMemberships')
			.doc(`${accountId}_${uid}`);

		await db.runTransaction(async (transaction) => {
			const accountDoc = await transaction.get(accountRef);
			const membershipDoc = await transaction.get(membershipRef);
			const desiredRoles = deriveMembershipRoles(isOwner, String(userData.role || ''));

			if (!membershipDoc.exists) {
				transaction.set(membershipRef, {
					accountId,
					userId: uid,
					roles: desiredRoles,
					status: 'active',
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			} else {
				const existingMembership = membershipDoc.data() || {};
				const existingRoles = Array.isArray(existingMembership.roles)
					? (existingMembership.roles as string[])
					: [];
				const mergedRoles = Array.from(
					new Set([...existingRoles, ...desiredRoles]),
				);

				transaction.update(membershipRef, {
					roles: mergedRoles,
					status: 'active',
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
			}

			if (!accountDoc.exists) {
				if (!isOwner || accountId !== uid) {
					throw new functions.https.HttpsError(
						'permission-denied',
						'Only account owners can initialize family account records',
					);
				}

				const subscriptionToStore =
					(data?.subscription as Record<string, unknown> | undefined) ||
					(userData.subscription as Record<string, unknown> | undefined) ||
					null;

				transaction.set(accountRef, {
					id: accountId,
					ownerId: uid,
					memberIds: [uid],
					subscription: subscriptionToStore,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
				return;
			}

			if (data?.syncSubscription && isOwner) {
				const subscriptionToStore =
					(data?.subscription as Record<string, unknown> | undefined) ||
					(userData.subscription as Record<string, unknown> | undefined);

				if (subscriptionToStore) {
					transaction.update(accountRef, {
						subscription: subscriptionToStore,
						updatedAt: admin.firestore.FieldValue.serverTimestamp(),
					});
				}
			}
		});

		const finalAccountDoc = await accountRef.get();
		const finalData = finalAccountDoc.data() || {};

		return {
			id: accountId,
			ownerId: finalData.ownerId,
			memberIds: Array.isArray(finalData.memberIds) ? finalData.memberIds : [],
			subscription: serializeFirestoreValue(finalData.subscription),
			updatedAt: serializeFirestoreValue(finalData.updatedAt),
		};
	},
);
