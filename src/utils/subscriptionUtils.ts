// Subscription utilities and helpers
import {
	TRIAL_DURATION_DAYS,
	SUBSCRIPTION_PLANS,
	SUBSCRIPTION_STATUS,
	SubscriptionStatus,
} from '../constants/subscriptions';
import {
	normalizePlanId,
	resolveAccountEntitlements,
} from '@maintley/entitlements';

export interface SubscriptionData {
	status: SubscriptionStatus;
	plan: string;
	currentPeriodStart: number;
	currentPeriodEnd: number;
	trialEndsAt?: number | null;
	canceledAt?: number;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
	promoCode?: string;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
	pendingCheckoutPlan?: string;
	pendingCheckoutStartedAt?: number;
}

const UNLIMITED_DEVICE_LIMIT_SENTINEL = 999;
const UNLIMITED_FEATURE_LIMIT_SENTINEL = 999;

const resolvePlanId = (planId: string): string => normalizePlanId(planId);

const getPlanById = (planId: string) => {
	const normalizedPlanId = resolvePlanId(planId);
	return Object.values(SUBSCRIPTION_PLANS).find((p) => p.id === normalizedPlanId);
};

const getEffectivePlan = (subscription: SubscriptionData) =>
	getPlanById(getEffectiveSubscriptionPlanId(subscription));

export const getEffectiveSubscriptionPlanId = (
	subscription?: Pick<
		SubscriptionData,
		| 'plan'
		| 'status'
		| 'trialEndsAt'
		| 'hasScheduledSubscription'
		| 'scheduledPlan'
		| 'pendingCheckoutPlan'
		| 'stripeSubscriptionId'
	> | null,
	fallbackPlanId = 'homeowner',
): string => {
	return resolveAccountEntitlements({
		subscription,
		fallbackPlanId,
		mode: 'compatibility',
		allowLegacyPlanWithoutStatus: true,
	}).basePlanId;
};

export const isUnlimitedDeviceLimit = (maxDevices?: number): boolean =>
	!Number.isFinite(maxDevices || 0) ||
	(maxDevices || 0) >= UNLIMITED_DEVICE_LIMIT_SENTINEL;

export const isUnlimitedFeatureLimit = (limit?: number): boolean =>
	!Number.isFinite(limit || 0) ||
	(limit || 0) >= UNLIMITED_FEATURE_LIMIT_SENTINEL;

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
 * Check if subscription is in a legacy access period
 */
export const isTrialActive = (subscription: SubscriptionData): boolean => {
	if (subscription.status !== SUBSCRIPTION_STATUS.TRIAL) return false;
	// If trialEndsAt is null or undefined, it's unlimited access (always active)
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
 * Check if user has an expired legacy access period
 */
export const isTrialExpired = (subscription: SubscriptionData): boolean => {
	return subscription.status === SUBSCRIPTION_STATUS.EXPIRED;
};

/**
 * Check if user can access read-only features (reports, settings) even after an access period expires
 */
export const canAccessReadOnlyFeatures = (
	subscription: SubscriptionData,
): boolean => {
	return isSubscriptionActive(subscription) || isTrialExpired(subscription);
};

/**
 * Get days remaining in legacy access period
 */
export const getTrialDaysRemaining = (
	subscription: SubscriptionData,
): number => {
	// If trialEndsAt is null or undefined, it's unlimited access
	if (!subscription.trialEndsAt) return -1; // Return -1 to indicate unlimited
	const now = Math.floor(Date.now() / 1000);
	const daysRemaining = Math.ceil(
		(subscription.trialEndsAt - now) / (24 * 60 * 60),
	);
	return Math.max(0, daysRemaining);
};

/**
 * Create initial subscription data for legacy access-period flows
 */
export const createTrialSubscription = (
	plan: string = 'homeowner',
	promoCode?: string,
): SubscriptionData => {
	const now = Math.floor(Date.now() / 1000);

	// Check for unlimited access promo code
	const envPromoCode = process.env.REACT_APP_UNLIMITED_TRIAL_PROMO_CODE;
	const isUnlimitedTrial =
		promoCode &&
		envPromoCode &&
		promoCode.toLowerCase() === envPromoCode.toLowerCase();

	// Check for expired access promo code (for testing expired access functionality)
	const expiredPromoCode = process.env.REACT_APP_EXPIRED_TRIAL_PROMO_CODE;
	const isExpiredTrial =
		promoCode &&
		expiredPromoCode &&
		promoCode.toLowerCase() === expiredPromoCode.toLowerCase();

	const trialEndsAt = isUnlimitedTrial ? null : calculateTrialEndDate();

	// If it's expired access, set status to EXPIRED and trialEndsAt to past date
	if (isExpiredTrial) {
		const pastDate = now - 86400; // 1 day ago
		return {
			status: SUBSCRIPTION_STATUS.EXPIRED,
			plan,
			currentPeriodStart: pastDate,
			currentPeriodEnd: pastDate,
			trialEndsAt: pastDate,
		};
	}

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
	const plan = getPlanById(planId);
	return plan?.maxProperties ?? 1; // Default to Homeowner if plan not found
};

/**
 * Get the maximum number of devices allowed for a subscription plan
 */
export const getMaxDevicesForPlan = (planId: string): number => {
	const plan = getPlanById(planId);
	const maxDevices = plan?.maxDevices ?? 15; // Default to Homeowner if plan not found
	return isUnlimitedDeviceLimit(maxDevices) ? Number.POSITIVE_INFINITY : maxDevices;
};

export const getMaxFilesForPlan = (planId: string): number => {
	const plan = getPlanById(planId);
	return Number(plan?.maxFiles ?? 0);
};

export const getMaxStorageGbForPlan = (planId: string): number => {
	const plan = getPlanById(planId);
	return Number(plan?.maxStorageGb ?? 0);
};

export const canUseTaskReminderEmails = (
	subscription?: Pick<
		SubscriptionData,
		| 'plan'
		| 'status'
		| 'trialEndsAt'
		| 'hasScheduledSubscription'
		| 'scheduledPlan'
		| 'pendingCheckoutPlan'
		| 'stripeSubscriptionId'
	> | null,
): boolean => {
	const effectivePlan = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
	return ['homeowner_plus', 'property', 'portfolio'].includes(effectivePlan);
};

export const canUsePropertyInsights = (
	subscription?: Pick<
		SubscriptionData,
		| 'plan'
		| 'status'
		| 'trialEndsAt'
		| 'hasScheduledSubscription'
		| 'scheduledPlan'
		| 'pendingCheckoutPlan'
		| 'stripeSubscriptionId'
	> | null,
): boolean => {
	const effectivePlan = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
	return ['homeowner_plus', 'property', 'portfolio'].includes(effectivePlan);
};

export const canUsePropertyKnowledgeAcquisition = (
	subscription?: Pick<
		SubscriptionData,
		| 'plan'
		| 'status'
		| 'trialEndsAt'
		| 'hasScheduledSubscription'
		| 'scheduledPlan'
		| 'pendingCheckoutPlan'
		| 'stripeSubscriptionId'
	> | null,
): boolean => {
	const effectivePlan = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
	return ['homeowner_plus', 'property', 'portfolio'].includes(effectivePlan);
};

/**
 * Check if user can add more properties based on their subscription and role
 */
export const canAddProperty = (
	subscription: SubscriptionData,
	currentPropertyCount: number,
	userRole?: string,
): boolean => {
	// Property guests cannot create their own properties
	if (
		userRole === 'property_guest' ||
		userRole === 'team_member' ||
		userRole === 'tenant'
	) {
		return false;
	}

	if (!isSubscriptionActive(subscription)) {
		return false; // No active subscription
	}

	const maxProperties = getMaxPropertiesForPlan(
		getEffectiveSubscriptionPlanId(subscription),
	);
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

	const maxProperties = getMaxPropertiesForPlan(
		getEffectiveSubscriptionPlanId(subscription),
	);
	return Math.max(0, maxProperties - currentPropertyCount);
};

/**
 * Check if user can add more devices based on their subscription
 */
export const canAddDevice = (
	subscription: SubscriptionData,
	currentDeviceCount: number,
): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const maxDevices = getMaxDevicesForPlan(
		getEffectiveSubscriptionPlanId(subscription),
	);
	return currentDeviceCount < maxDevices;
};

/**
 * Get remaining device slots for a subscription
 */
export const getRemainingDeviceSlots = (
	subscription: SubscriptionData,
	currentDeviceCount: number,
): number => {
	if (!isSubscriptionActive(subscription)) {
		return 0;
	}

	const maxDevices = getMaxDevicesForPlan(
		getEffectiveSubscriptionPlanId(subscription),
	);
	if (isUnlimitedDeviceLimit(maxDevices)) {
		return Number.POSITIVE_INFINITY;
	}
	return Math.max(0, maxDevices - currentDeviceCount);
};

/**
 * Check if subscription plan allows team management
 */
export const canManageTeam = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canManageTeam || false;
};

/**
 * Property and Portfolio can invite team members. Portfolio adds roles,
 * permissions, groups, and property-specific access.
 */
export const canUseSimpleTeamManagement = (
	subscription: SubscriptionData,
): boolean => canManageTeam(subscription);

export const canUseAdvancedTeamManagement = (
	subscription: SubscriptionData,
): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return getEffectiveSubscriptionPlanId(subscription) === 'portfolio';
};

/**
 * Check if subscription plan allows tenant management
 */
export const canManageTenants = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canManageTenants || false;
};

/**
 * Check if subscription plan allows viewing reports
 */
export const canViewReports = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canViewReports || false;
};

export const canAccessReportBuilder = (
	subscription: SubscriptionData,
): boolean => {
	if (!canAccessReadOnlyFeatures(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canViewReports || false;
};

/**
 * Check if subscription plan allows data export
 */
export const canExportData = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canExportData || false;
};

export const canExportReports = (subscription: SubscriptionData): boolean => {
	if (!canAccessReadOnlyFeatures(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canExportData || false;
};

/**
 * Check if subscription plan includes priority support
 */
export const hasPrioritySupport = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.prioritySupport || false;
};

/**
 * Check if subscription plan allows submitting maintenance requests
 */
export const canSubmitMaintenanceRequests = (
	subscription: SubscriptionData,
): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canSubmitMaintenanceRequests || false;
};

/**
 * Check if subscription plan allows viewing tenant information
 */
export const canViewTenantInfo = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canViewTenantInfo || false;
};

/**
 * Check if subscription plan allows linked parts & supplies
 */
export const canLinkParts = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canLinkParts || false;
};

/**
 * Check if subscription plan allows warranty tracking
 */
export const canTrackWarranties = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canTrackWarranties || false;
};

/**
 * Get how many suggested maintenance packages can be generated by the setup assistant.
 * A package is the task set attached to one equipment record.
 */
export const getSuggestedMaintenancePackageLimit = (
	subscription: SubscriptionData,
): number => {
	if (!isSubscriptionActive(subscription)) {
		return 0;
	}

	const plan = getPlanById(getEffectiveSubscriptionPlanId(subscription));
	const limit = Number(plan?.permissions.suggestedMaintenancePackageLimit || 0);
	return isUnlimitedFeatureLimit(limit) ? Number.POSITIVE_INFINITY : limit;
};

/**
 * Check if the subscription allows unlimited suggested maintenance packages.
 */
export const canUseUnlimitedSuggestedMaintenancePackages = (
	subscription: SubscriptionData,
): boolean => isUnlimitedFeatureLimit(getSuggestedMaintenancePackageLimit(subscription));

/**
 * Check if the plan has paid suggested maintenance package access.
 * Free Home may still have a small starter allowance.
 */
export const canUseSuggestedMaintenancePackages = (
	subscription: SubscriptionData,
): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getPlanById(getEffectiveSubscriptionPlanId(subscription));
	return Boolean(plan?.permissions.canUseSuggestedMaintenancePackages);
};

export const canUseRecurringTasks = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getPlanById(getEffectiveSubscriptionPlanId(subscription));
	return Boolean(plan?.permissions.canUseRecurringTasks);
};

export const canUseNotifications = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getPlanById(getEffectiveSubscriptionPlanId(subscription));
	return Boolean(plan?.permissions.canUseNotifications);
};

/**
 * Check if subscription plan allows advanced audit trail
 */
export const canAdvancedAuditTrail = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canAdvancedAuditTrail || false;
};

/**
 * Check if subscription plan allows multi-unit management
 */
export const canManageMultiUnit = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canManageMultiUnit || false;
};

/**
 * Check if subscription plan allows portfolio-level reporting
 */
export const canPortfolioReporting = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canPortfolioReporting || false;
};

/**
 * Check if subscription plan allows advanced analytics
 */
export const canAdvancedAnalytics = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canAdvancedAnalytics || false;
};

/**
 * Check if subscription plan allows property groups
 */
export const canPropertyGroups = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	const plan = getEffectivePlan(subscription);
	return plan?.permissions.canPropertyGroups || false;
};

/**
 * Get subscription plan details
 */
export const getSubscriptionPlanDetails = (planId: string) => {
	return getPlanById(planId);
};
