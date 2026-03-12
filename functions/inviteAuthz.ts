import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { assertAccountRole, resolveAccountIdForUser } from './accountAuthz';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const PLAN_CAPABILITIES = {
	team: new Set(['basic', 'professional']),
	tenant: new Set(['basic', 'professional']),
} as const;

type InviteCapability = keyof typeof PLAN_CAPABILITIES;

type SubscriptionLike = {
	status?: string;
	plan?: string;
	trialEndsAt?: number | null;
};

const isTrialActive = (subscription: SubscriptionLike): boolean => {
	if (subscription.status !== 'trial') {
		return false;
	}

	if (!subscription.trialEndsAt) {
		return true;
	}

	return subscription.trialEndsAt > Date.now() / 1000;
};

const isSubscriptionActive = (subscription?: SubscriptionLike): boolean => {
	if (!subscription) {
		return false;
	}

	return subscription.status === 'active' || isTrialActive(subscription);
};

export const assertInviteCapability = async (
	uid: string,
	capability: InviteCapability,
): Promise<{ accountId: string; subscription: SubscriptionLike }> => {
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
	const subscription = (accountOwnerData.subscription || {}) as SubscriptionLike;
	const normalizedPlan = String(subscription.plan || '').trim().toLowerCase();

	if (!isSubscriptionActive(subscription)) {
		throw new functions.https.HttpsError(
			'permission-denied',
			'An active subscription is required for this invite action',
		);
	}

	if (!PLAN_CAPABILITIES[capability].has(normalizedPlan)) {
		throw new functions.https.HttpsError(
			'permission-denied',
			capability === 'team'
				? 'Your current subscription plan does not allow inviting team members.'
				: 'Your current subscription plan does not allow inviting tenants.',
		);
	}

	return { accountId, subscription };
};
