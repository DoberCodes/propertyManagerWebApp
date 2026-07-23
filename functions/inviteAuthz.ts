import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';
import {
	hasSubscriptionCapability,
	isSubscriptionCurrentlyEntitled,
	SubscriptionEntitlementLike,
} from './subscriptionEntitlements';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const INVITE_CAPABILITIES = {
	team: 'team.manage',
	tenant: 'residents.manage',
} as const;

type InviteCapability = keyof typeof INVITE_CAPABILITIES;

export const assertInviteCapability = async (
	uid: string,
	capability: InviteCapability,
): Promise<{ accountId: string; subscription: SubscriptionEntitlementLike }> => {
	const accountId = await resolveAccountIdForUser(uid);
	await assertAccountRole(uid, accountId, ['account_owner', 'admin', 'manager']);

	const accountOwnerDoc = await db.collection('users').doc(accountId).get();
	if (!accountOwnerDoc.exists) {
		throw new functions.https.HttpsError(
			'not-found',
			'Account owner profile not found',
		);
	}

	const accountOwnerData = accountOwnerDoc.data() || {};
	const subscription = (accountOwnerData.subscription ||
		{}) as SubscriptionEntitlementLike;
	if (!isSubscriptionCurrentlyEntitled(subscription)) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'An active subscription is required for this invite action',
		);
	}

	if (!hasSubscriptionCapability(subscription, INVITE_CAPABILITIES[capability])) {
		throw new functions.https.HttpsError(
			'permission-denied',
			capability === 'team'
				? 'Your current subscription plan does not allow inviting team members.'
				: 'Your current subscription plan does not allow inviting tenants.',
		);
	}

	return { accountId, subscription };
};
