import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

export type AccountMembership = {
	accountId: string;
	userId: string;
	roles: string[];
	status?: 'active' | 'disabled';
};

export const resolveAccountIdForUser = async (uid: string): Promise<string> => {
	const userDoc = await db.collection('users').doc(uid).get();
	const userData = userDoc.data() || {};
	const directAccountId = String(userData.accountId || '').trim();
	if (directAccountId) return directAccountId;

	const familySnapshot = await db
		.collection('familyAccounts')
		.where('memberIds', 'array-contains', uid)
		.limit(1)
		.get();

	if (!familySnapshot.empty) {
		return familySnapshot.docs[0].id;
	}

	return uid;
};

export const getMembership = async (
	accountId: string,
	uid: string,
): Promise<AccountMembership | null> => {
	const membershipIds = [`${accountId}_${uid}`, `${uid}_${accountId}`];
	let membershipDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | null = null;

	for (const membershipId of membershipIds) {
		const candidate = await db
			.collection('accountMemberships')
			.doc(membershipId)
			.get();
		if (candidate.exists) {
			membershipDoc = candidate;
			break;
		}
	}

	if (!membershipDoc || !membershipDoc.exists) {
		return null;
	}

	const data = membershipDoc.data() || {};
	const normalizedRoles = Array.isArray(data.roles)
		? (data.roles as string[])
		: typeof data.role === 'string' && data.role.trim().length > 0
			? [String(data.role).trim()]
			: [];

	return {
		accountId: String(data.accountId || accountId),
		userId: String(data.userId || uid),
		roles: normalizedRoles,
		status: (data.status as 'active' | 'disabled') || 'active',
	};
};

export const hasAnyRole = (
	membership: AccountMembership | null,
	roles: string[],
): boolean => {
	if (!membership) return false;
	if (membership.status === 'disabled') return false;
	return roles.some((role) => membership.roles.includes(role));
};

export const assertAccountRole = async (
	uid: string,
	accountId: string,
	roles: string[],
): Promise<void> => {
	const membership = await getMembership(accountId, uid);
	if (hasAnyRole(membership, roles)) {
		return;
	}

	// Legacy fallback: infer owner/admin role from user profile when membership records
	// are missing or stale.
	const userDoc = await db.collection('users').doc(uid).get();
	const userData = userDoc.data() || {};
	const normalizedUserRole = String(userData.role || '').trim().toLowerCase();
	const isAccountOwner =
		userData.isAccountOwner === true || String(accountId).trim() === String(uid).trim();

	const inferredRoles = new Set<string>();
	if (isAccountOwner) {
		inferredRoles.add('account_owner');
	}
	if (normalizedUserRole === 'admin') {
		inferredRoles.add('admin');
	}
	if (normalizedUserRole === 'manager') {
		inferredRoles.add('manager');
	}

	if (roles.some((role) => inferredRoles.has(role))) {
		return;
	}

	throw new functions.https.HttpsError(
		'permission-denied',
		'You do not have permission for this account action',
	);
};
