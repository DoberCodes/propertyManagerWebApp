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
	const accountOwnerRef = doc(db, 'users', accountId);
	const accountOwnerSnap = await getDoc(accountOwnerRef);
	if (!accountOwnerSnap.exists()) {
		return null;
	}

	const accountOwnerData = accountOwnerSnap.data() || {};
	const subscription = accountOwnerData.subscription as SubscriptionData | undefined;
	return subscription || null;
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
