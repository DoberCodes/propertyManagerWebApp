import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
	canUseAdvancedTeamManagement,
	canManageTeam,
	canManageTenants,
} from '../../utils/subscriptionUtils';
import type { SubscriptionData } from '../../utils/subscriptionUtils';

const getAccountSubscription = async (
	accountId: string,
): Promise<SubscriptionData | null> => {
	const [accountOwnerSnap, familyAccountSnap] = await Promise.all([
		getDoc(doc(db, 'users', accountId)),
		getDoc(doc(db, 'familyAccounts', accountId)),
	]);
	if (!accountOwnerSnap.exists()) {
		return null;
	}

	const accountOwnerData = accountOwnerSnap.data() || {};
	const subscription = accountOwnerData.subscription as SubscriptionData | undefined;
	const projection = familyAccountSnap.data()?.effectiveEntitlementProjection || {};
	return subscription
		? {
				...subscription,
				entitlementAccountId: accountId,
				entitlementGrants: Array.isArray(projection.activeGrants)
					? projection.activeGrants
					: [],
			}
		: null;
};

export const assertCanManageTeamMembers = async (
	accountId: string,
): Promise<void> => {
	const subscription = await getAccountSubscription(accountId);
	if (!subscription || !canManageTeam(subscription)) {
		throw new Error(
			'Your current subscription plan does not allow managing team members.',
		);
	}
};

export const assertCanInviteTeamMembers = assertCanManageTeamMembers;

export const assertCanManageAdvancedTeamSettings = async (
	accountId: string,
): Promise<void> => {
	const subscription = await getAccountSubscription(accountId);
	if (!subscription || !canUseAdvancedTeamManagement(subscription)) {
		throw new Error(
			'Advanced team roles, groups, and property assignments require Portfolio.',
		);
	}
};

export const canManageAdvancedTeamSettings = async (
	accountId: string,
): Promise<boolean> => {
	const subscription = await getAccountSubscription(accountId);
	return !!subscription && canUseAdvancedTeamManagement(subscription);
};

export const assertCanManageTenants = async (
	accountId: string,
): Promise<void> => {
	const subscription = await getAccountSubscription(accountId);
	if (!subscription || !canManageTenants(subscription)) {
		throw new Error(
			'Your current subscription plan does not allow managing tenants.',
		);
	}
};

export const assertCanInviteTenants = assertCanManageTenants;
