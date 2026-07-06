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
import { getRoleCapabilities } from '../../utils/permissions';

export type TeamMemberAccess = {
	id?: string;
	accountId?: string;
	email?: string;
	role?: string;
	userAccountId?: string;
	linkedProperties?: string[];
};

export type AccountAccessContext = {
	userId: string;
	accountIds: string[];
	activeAccountId: string;
	userRole: string;
	isScopedTeamMember: boolean;
	allowedPropertyIds: string[];
	teamMember?: TeamMemberAccess;
	canManageTasks: boolean;
	canManageProperties: boolean;
	canManageDocuments: boolean;
	canManageMaintenance: boolean;
	canManageTeam: boolean;
};

const normalizeEmail = (email?: string | null) =>
	String(email || '').trim().toLowerCase();

const normalizeRole = (role?: string | null) =>
	String(role || '').trim().toLowerCase();

const isTeamPromoCode = (promoCode?: string) =>
	String(promoCode || '').trim().toUpperCase().startsWith('TEAM-');

const docToObject = <T extends Record<string, unknown>>(snapshot: any): T | null => {
	if (!snapshot?.exists?.()) return null;
	return {
		id: snapshot.id,
		...(snapshot.data?.() || {}),
	} as T;
};

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

export const getTeamMemberForAccountUser = async (
	accountIds: string[],
	userData: any,
	userId: string,
	authEmail?: string | null,
): Promise<TeamMemberAccess | null> => {
	const normalizedEmail = normalizeEmail(userData?.email || authEmail);
	const teamMemberId = String(userData?.teamMemberId || '').trim();

	for (const accountId of accountIds) {
		try {
			if (teamMemberId) {
				const memberDoc = await getDoc(doc(db, 'teamMembers', teamMemberId));
				const member = docToObject<TeamMemberAccess>(memberDoc);
				if (member && (!member.accountId || member.accountId === accountId)) {
					return member;
				}
			}

			const byUserQuery = query(
				collection(db, 'teamMembers'),
				where('accountId', '==', accountId),
				where('userAccountId', '==', userId),
			);
			const byUserSnapshot = await getDocs(byUserQuery);
			if (!byUserSnapshot.empty) {
				return docToObject<TeamMemberAccess>(byUserSnapshot.docs[0]);
			}

			if (normalizedEmail) {
				const byEmailQuery = query(
					collection(db, 'teamMembers'),
					where('accountId', '==', accountId),
					where('email', '==', normalizedEmail),
				);
				const byEmailSnapshot = await getDocs(byEmailQuery);
				if (!byEmailSnapshot.empty) {
					return docToObject<TeamMemberAccess>(byEmailSnapshot.docs[0]);
				}

				const accountMembersQuery = query(
					collection(db, 'teamMembers'),
					where('accountId', '==', accountId),
				);
				const accountMembersSnapshot = await getDocs(accountMembersQuery);
				const emailMatch = accountMembersSnapshot.docs
					.map((memberDoc) => docToObject<TeamMemberAccess>(memberDoc))
					.find(
						(member) =>
							normalizeEmail(member?.email) === normalizedEmail,
					);
				if (emailMatch) {
					return emailMatch;
				}
			}
		} catch (error) {
			console.warn('Could not resolve team member access:', error);
		}
	}

	return null;
};

export const resolveAccountAccessContext = async (): Promise<AccountAccessContext> => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		throw new Error('User not authenticated');
	}

	const userId = currentUser.uid;
	const userSnapshot = await getDoc(doc(db, 'users', userId));
	const userData = userSnapshot.data?.() || {};
	const accountIds = await resolveAccessibleAccountIds();
	const activeAccountId = accountIds[0] || userId;
	const teamMember = await getTeamMemberForAccountUser(
		accountIds,
		userData,
		userId,
		currentUser.email,
	);
	const userRole = normalizeRole(teamMember?.role || userData?.role);
	const teamMemberProfile =
		userData?.isTeamMemberAccount === true ||
		isTeamPromoCode(userData?.subscription?.promoCode) ||
		Boolean(teamMember);
	const isAdminLike = userData?.isAccountOwner === true || userRole === 'admin';
	const isScopedTeamMember = teamMemberProfile && !isAdminLike;
	const allowedPropertyIds = isScopedTeamMember
		? (teamMember?.linkedProperties || []).filter(Boolean)
		: [];
	const capabilities = isAdminLike
		? {
				canManageTasks: true,
				canManageProperties: true,
				canManageDocuments: true,
				canManageMaintenance: true,
				canManageMaintenanceHistory: true,
				canManageAppliances: true,
				canManageTeam: true,
		  }
		: getRoleCapabilities(userRole);

	return {
		userId,
		accountIds,
		activeAccountId,
		userRole,
		isScopedTeamMember,
		allowedPropertyIds,
		...(teamMember ? { teamMember } : {}),
		canManageTasks: capabilities.canManageTasks,
		canManageProperties: capabilities.canManageProperties,
		canManageDocuments:
			capabilities.canManageProperties ||
			capabilities.canManageAppliances ||
			capabilities.canManageMaintenanceHistory,
		canManageMaintenance: capabilities.canManageMaintenanceHistory,
		canManageTeam: capabilities.canManageTeam,
	};
};

export const filterRecordsByAccessProperties = <T>(
	records: T[],
	accessContext: Pick<
		AccountAccessContext,
		'isScopedTeamMember' | 'allowedPropertyIds'
	>,
	getPropertyId: (record: T) => string | undefined,
): T[] => {
	if (!accessContext.isScopedTeamMember) {
		return records;
	}

	const allowedPropertyIds = new Set(accessContext.allowedPropertyIds);
	if (allowedPropertyIds.size === 0) {
		return [];
	}

	return records.filter((record) => {
		const propertyId = getPropertyId(record);
		return propertyId ? allowedPropertyIds.has(String(propertyId)) : false;
	});
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
