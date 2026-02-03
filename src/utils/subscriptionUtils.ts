// Subscription utilities and helpers
import {
	TRIAL_DURATION_DAYS,
	SUBSCRIPTION_STATUS,
	SubscriptionStatus,
} from '../constants/subscriptions';

export interface SubscriptionData {
	status: SubscriptionStatus;
	plan: string;
	currentPeriodStart: number;
	currentPeriodEnd: number;
	trialEndsAt?: number;
	canceledAt?: number;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
}

/**
 * Calculate trial end date
 */
export const calculateTrialEndDate = (): number => {
	const now = new Date();
	const trialEnd = new Date(
		now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
	);
	return Math.floor(trialEnd.getTime() / 1000); // Return as Unix timestamp
};

/**
 * Check if subscription is in trial period
 */
export const isTrialActive = (subscription: SubscriptionData): boolean => {
	if (subscription.status !== SUBSCRIPTION_STATUS.TRIAL) return false;
	if (!subscription.trialEndsAt) return false;
	const now = Math.floor(Date.now() / 1000);
	return now < subscription.trialEndsAt;
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = (
	subscription: SubscriptionData,
): boolean => {
	if (subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
		return isTrialActive(subscription);
	}
	return subscription.status === SUBSCRIPTION_STATUS.ACTIVE;
};

/**
 * Get days remaining in trial
 */
export const getTrialDaysRemaining = (
	subscription: SubscriptionData,
): number => {
	if (!subscription.trialEndsAt) return 0;
	const now = Math.floor(Date.now() / 1000);
	const daysRemaining = Math.ceil(
		(subscription.trialEndsAt - now) / (24 * 60 * 60),
	);
	return Math.max(0, daysRemaining);
};

/**
 * Create initial subscription for new user (free trial)
 */
export const createTrialSubscription = (
	plan: string = 'free',
): SubscriptionData => {
	const now = Math.floor(Date.now() / 1000);
	const trialEndsAt = calculateTrialEndDate();

	return {
		status: SUBSCRIPTION_STATUS.TRIAL,
		plan,
		currentPeriodStart: now,
		currentPeriodEnd: trialEndsAt,
		trialEndsAt,
	};
};

/**
 * Format subscription display text
 */
export const getSubscriptionDisplayText = (
	subscription: SubscriptionData,
): string => {
	if (subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
		const daysRemaining = getTrialDaysRemaining(subscription);
		return `Free Trial - ${daysRemaining} days remaining`;
	}

	if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
		return `Active - ${subscription.plan} plan`;
	}

	if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) {
		return 'Subscription Cancelled';
	}

	if (subscription.status === SUBSCRIPTION_STATUS.EXPIRED) {
		return 'Subscription Expired';
	}

	return 'Inactive';
};
