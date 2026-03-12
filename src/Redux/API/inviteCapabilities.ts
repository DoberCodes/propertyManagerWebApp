import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
	canManageTeam,
	canManageTenants,
	SubscriptionData,
} from '../../utils/subscriptionUtils';

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

export const assertCanInviteTeamMembers = async (
	accountId: string,
): Promise<void> => {
	const subscription = await getAccountSubscription(accountId);
	if (!subscription || !canManageTeam(subscription)) {
		throw new Error(
			'Your current subscription plan does not allow inviting team members.',
		);
	}
};

export const assertCanInviteTenants = async (
	accountId: string,
): Promise<void> => {
	const subscription = await getAccountSubscription(accountId);
	if (!subscription || !canManageTenants(subscription)) {
		throw new Error(
			'Your current subscription plan does not allow inviting tenants.',
		);
	}
};
