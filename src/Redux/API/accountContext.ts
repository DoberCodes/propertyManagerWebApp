import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const getTeamInviteAccountId = async (
	email?: string,
	promoCode?: string,
): Promise<{ accountId: string; teamMemberId?: string } | null> => {
	const normalizedEmail = String(email || '').trim().toLowerCase();
	const normalizedCode = String(promoCode || '').trim().toLowerCase();

	if (!normalizedEmail) {
		return null;
	}

	const inviteQuery = normalizedCode.startsWith('team-')
		? query(
				collection(db, 'teamMemberInvitationCodes'),
				where('teamMemberEmail', '==', normalizedEmail),
				where('codeLower', '==', normalizedCode),
		  )
		: query(
				collection(db, 'teamMemberInvitationCodes'),
				where('teamMemberEmail', '==', normalizedEmail),
		  );
	const inviteSnapshot = await getDocs(inviteQuery);

	for (const inviteDoc of inviteSnapshot.docs) {
		const inviteData = inviteDoc.data() || {};
		const status = String(inviteData.status || '').trim().toLowerCase();
		if (status && status !== 'active' && status !== 'redeemed') {
			continue;
		}

		const accountId = String(inviteData.accountId || '').trim();
		if (accountId) {
			return {
				accountId,
				teamMemberId: String(inviteData.teamMemberId || '').trim() || undefined,
			};
		}
	}

	return null;
};

export const resolveAccessibleAccountIds = async (): Promise<string[]> => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User not authenticated');
	}

	const uid = currentUser.uid;
	const accountIds = new Set<string>();

	const membershipsQuery = query(
		collection(db, 'accountMemberships'),
		where('userId', '==', uid),
	);
	const membershipsSnapshot = await getDocs(membershipsQuery);

	membershipsSnapshot.docs.forEach((membershipDoc) => {
		const membershipData = membershipDoc.data() || {};
		const status = String(membershipData.status || 'active').trim();
		const accountId = String(membershipData.accountId || '').trim();
		if (accountId && status !== 'disabled') {
			accountIds.add(accountId);
		}
	});

	const primaryAccountId = await resolveTargetUserId();
	if (primaryAccountId) {
		accountIds.add(primaryAccountId);
	}

	if (accountIds.size === 0) {
		accountIds.add(uid);
	}

	return Array.from(accountIds);
};

export const resolveTargetUserId = async (): Promise<string> => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User not authenticated');
	}

	const uid = currentUser.uid;
	const userRef = doc(db, 'users', uid);
	const userSnapshot = await getDoc(userRef);
	const userData = userSnapshot.data() || {};

	const accountId = String(userData.accountId || '').trim();
	const isAccountOwner = userData.isAccountOwner === true;

	if (isAccountOwner) {
		return accountId || uid;
	}

	if (accountId && userData.isTeamMemberAccount !== true) {
		return accountId;
	}

	const teamInviteAccess = await getTeamInviteAccountId(
		userData.email || currentUser.email || undefined,
		userData.subscription?.promoCode,
	);

	if (teamInviteAccess?.accountId) {
		try {
			await updateDoc(userRef, {
				accountId: teamInviteAccess.accountId,
				isAccountOwner: false,
				isTeamMemberAccount: true,
				...(teamInviteAccess.teamMemberId
					? { teamMemberId: teamInviteAccess.teamMemberId }
					: {}),
				updatedAt: new Date().toISOString(),
			});
		} catch (error) {
			console.warn('Could not backfill team member account link:', error);
		}
		return teamInviteAccess.accountId;
	}

	if (accountId) {
		return accountId;
	}

	const familyQuery = query(
		collection(db, 'familyAccounts'),
		where('memberIds', 'array-contains', uid),
		limit(1),
	);
	const familySnapshot = await getDocs(familyQuery);

	if (familySnapshot.empty) {
		return uid;
	}

	const familyDoc = familySnapshot.docs[0];
	const familyData = familyDoc.data() || {};
	const ownerId = String(familyData.ownerId || '').trim() || uid;

	if (userSnapshot.exists()) {
		try {
			await updateDoc(userRef, {
				accountId: ownerId,
				isAccountOwner: ownerId === uid,
				updatedAt: new Date().toISOString(),
			});
		} catch (error) {
			console.warn('Could not backfill accountId on user profile:', error);
		}
	}

	return ownerId;
};
