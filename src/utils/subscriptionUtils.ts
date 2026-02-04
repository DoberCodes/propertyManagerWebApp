// Subscription utilities and helpers
import {
	TRIAL_DURATION_DAYS,
	SUBSCRIPTION_PLANS,
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
	// If trialEndsAt is undefined, it's an unlimited trial (always active)
	if (!subscription.trialEndsAt) return true;
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
	promoCode?: string,
): SubscriptionData => {
	const now = Math.floor(Date.now() / 1000);

	// Check for unlimited trial promo code
	const isUnlimitedTrial = promoCode === process.env.UNLIMITED_TRIAL_PROMO_CODE;
	const trialEndsAt = isUnlimitedTrial ? undefined : calculateTrialEndDate();

	return {
		status: SUBSCRIPTION_STATUS.TRIAL,
		plan,
		currentPeriodStart: now,
		currentPeriodEnd: trialEndsAt || now + 365 * 24 * 60 * 60, // 1 year for unlimited
		trialEndsAt,
	};
};

/**
 * Get the maximum number of properties allowed for a subscription plan
 */
export const getMaxPropertiesForPlan = (planId: string): number => {
	const plan = Object.values(SUBSCRIPTION_PLANS).find((p) => p.id === planId);
	return plan?.maxProperties || 1; // Default to 1 if plan not found
};

/**
 * Check if user can add more properties based on their subscription
 */
export const canAddProperty = (
	subscription: SubscriptionData,
	currentPropertyCount: number,
): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false; // No active subscription
	}

	const maxProperties = getMaxPropertiesForPlan(subscription.plan);
	return currentPropertyCount < maxProperties;
};

/**
 * Get remaining property slots for a subscription
 */
export const getRemainingPropertySlots = (
	subscription: SubscriptionData,
	currentPropertyCount: number,
): number => {
	if (!isSubscriptionActive(subscription)) {
		return 0;
	}

	const maxProperties = getMaxPropertiesForPlan(subscription.plan);
	return Math.max(0, maxProperties - currentPropertyCount);
};

/**
 * Check if subscription plan allows team management
 */
export const canManageTeam = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = Object.values(SUBSCRIPTION_PLANS).find(
		(p) => p.id === subscription.plan,
	);
	return plan?.permissions.canManageTeam || false;
};

/**
 * Check if subscription plan allows viewing reports
 */
export const canViewReports = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = Object.values(SUBSCRIPTION_PLANS).find(
		(p) => p.id === subscription.plan,
	);
	return plan?.permissions.canViewReports || false;
};

/**
 * Check if subscription plan allows data export
 */
export const canExportData = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = Object.values(SUBSCRIPTION_PLANS).find(
		(p) => p.id === subscription.plan,
	);
	return plan?.permissions.canExportData || false;
};

/**
 * Check if subscription plan includes priority support
 */
export const hasPrioritySupport = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = Object.values(SUBSCRIPTION_PLANS).find(
		(p) => p.id === subscription.plan,
	);
	return plan?.permissions.prioritySupport || false;
};

/**
 * Get subscription plan details
 */
export const getSubscriptionPlanDetails = (planId: string) => {
	return Object.values(SUBSCRIPTION_PLANS).find((p) => p.id === planId);
};
