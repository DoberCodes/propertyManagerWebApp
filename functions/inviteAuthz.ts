import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';
import {
	getEffectiveSubscriptionPlanId,
	isSubscriptionCurrentlyEntitled,
	SubscriptionEntitlementLike,
} from './subscriptionEntitlements';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const PLAN_CAPABILITIES = {
	team: new Set(['property', 'portfolio']),
	tenant: new Set(['property', 'portfolio']),
} as const;

type InviteCapability = keyof typeof PLAN_CAPABILITIES;

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
	const effectivePlan = getEffectiveSubscriptionPlanId(subscription, 'homeowner');

	if (!isSubscriptionCurrentlyEntitled(subscription)) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'An active subscription is required for this invite action',
		);
	}

	if (!PLAN_CAPABILITIES[capability].has(effectivePlan)) {
		throw new functions.https.HttpsError(
			'permission-denied',
			capability === 'team'
				? 'Your current subscription plan does not allow inviting team members.'
				: 'Your current subscription plan does not allow inviting tenants.',
		);
	}

	return { accountId, subscription };
};
