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

	if (accountId) {
		return isAccountOwner ? accountId || uid : accountId;
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
