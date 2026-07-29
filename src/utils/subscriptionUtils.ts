// Subscription utilities and helpers
import {
	TRIAL_DURATION_DAYS,
	SUBSCRIPTION_PLANS,
	SUBSCRIPTION_STATUS,
	SubscriptionStatus,
} from '../constants/subscriptions';
import {
	CapabilityId,
	EntitlementGrant,
	getEntitlementLimit,
	getPlanPreset,
	hasCapability,
	LimitId,
	normalizePlanId,
	resolveAccountEntitlements,
} from '@maintley/entitlements';
import { ENTITLEMENT_FEATURE_FLAGS } from '../entitlements/featureFlags';

export { ENTITLEMENT_FEATURE_FLAGS } from '../entitlements/featureFlags';

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
	entitlementAccountId?: string;
	entitlementGrants?: EntitlementGrant[];
}

const UNLIMITED_DEVICE_LIMIT_SENTINEL = 999;
const UNLIMITED_FEATURE_LIMIT_SENTINEL = 999;

const resolvePlanId = (planId: string): string => normalizePlanId(planId);

const getPlanById = (planId: string) => {
	const normalizedPlanId = resolvePlanId(planId);
	return Object.values(SUBSCRIPTION_PLANS).find((p) => p.id === normalizedPlanId);
};

const resolveSubscriptionEntitlements = (
	subscription?: Parameters<typeof getEffectiveSubscriptionPlanId>[0],
) => {
	const grants = Array.isArray(subscription?.entitlementGrants)
		? (subscription.entitlementGrants as EntitlementGrant[])
		: [];
	const accountId =
		String(subscription?.entitlementAccountId || '').trim() ||
		String(grants[0]?.accountId || '').trim();

	return resolveAccountEntitlements({
		subscription,
		accountId,
		grants,
		fallbackPlanId: 'homeowner',
		mode: 'compatibility',
		allowLegacyPlanWithoutStatus: true,
		featureFlags: ENTITLEMENT_FEATURE_FLAGS,
	});
};

const subscriptionHasCapability = (
	subscription: Parameters<typeof getEffectiveSubscriptionPlanId>[0],
	capabilityId: CapabilityId,
): boolean => hasCapability(resolveSubscriptionEntitlements(subscription), capabilityId);

const hasActiveSubscriptionOrGrant = (subscription: SubscriptionData): boolean =>
	isSubscriptionActive(subscription) ||
	resolveSubscriptionEntitlements(subscription).activeGrantIds.length > 0;

const getPlanLimit = (planId: string, limitId: LimitId): number =>
	getEntitlementLimit(getPlanPreset(planId), limitId);

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
		| 'entitlementAccountId'
		| 'entitlementGrants'
	> | null,
	fallbackPlanId = 'homeowner',
): string => {
	return resolveAccountEntitlements({
		subscription,
		accountId: String(subscription?.entitlementAccountId || '').trim(),
		grants: subscription?.entitlementGrants || [],
		fallbackPlanId,
		mode: 'compatibility',
		allowLegacyPlanWithoutStatus: true,
		featureFlags: ENTITLEMENT_FEATURE_FLAGS,
	}).basePlanId;
};

export const isIntentionalFreeAccountSubscription = (
	subscription?: Partial<SubscriptionData> | null,
): boolean =>
	Boolean(
		subscription &&
			getEffectiveSubscriptionPlanId(subscription as SubscriptionData) ===
				'homeowner' &&
			String(subscription.status || '').trim().toLowerCase() === 'active' &&
			!String(subscription.pendingCheckoutPlan || '').trim() &&
			!String(subscription.stripeCustomerId || '').trim() &&
			!String(subscription.stripeSubscriptionId || '').trim(),
	);

export const getEffectiveAccessPlanId = (
	subscription?: Parameters<typeof getEffectiveSubscriptionPlanId>[0],
): string => {
	const result = resolveSubscriptionEntitlements(subscription);
	const candidates = [
		result.basePlanId,
		...result.appliedBundleIds.map((value) => String(value).split('@')[0]),
	];
	const rank: Record<string, number> = {
		guest: 0,
		team: 0,
		tenant: 0,
		homeowner: 1,
		homeowner_plus: 2,
		property: 3,
		portfolio: 4,
	};
	return candidates.reduce((best, candidate) =>
		(rank[candidate] || 0) > (rank[best] || 0) ? candidate : best,
	result.basePlanId);
};

export type ActiveGrantedPlanAccess = {
	programId: string;
	planId: string;
	kind: 'temporary' | 'permanent';
	source: EntitlementGrant['source'];
	endsAtMs: number | null;
	grantIds: string[];
	transition?: EntitlementGrant['transition'];
};

const GRANTED_PLAN_RANK: Record<string, number> = {
	homeowner_plus: 1,
	property: 2,
	portfolio: 3,
};

export const getActiveGrantedPlanAccess = (
	subscription?: Pick<SubscriptionData, 'entitlementGrants'> | null,
	nowMs = Date.now(),
): ActiveGrantedPlanAccess | null => {
	const activeGrants = (subscription?.entitlementGrants || []).filter((grant) => {
		const startsAtMs = Number(grant.startsAtMs || 0);
		const endsAtMs = Number(grant.endsAtMs || 0);
		return (
			grant.state === 'active' &&
			startsAtMs <= nowMs &&
			(grant.kind === 'permanent' || (Number.isFinite(endsAtMs) && endsAtMs > nowMs)) &&
			Boolean(grant.bundleId && GRANTED_PLAN_RANK[grant.bundleId])
		);
	});

	if (!activeGrants.length) return null;

	const planId = activeGrants.reduce((highestPlanId, grant) => {
		const candidatePlanId = String(grant.bundleId || '');
		return (GRANTED_PLAN_RANK[candidatePlanId] || 0) >
			(GRANTED_PLAN_RANK[highestPlanId] || 0)
			? candidatePlanId
			: highestPlanId;
	}, '');
	const planGrants = activeGrants.filter((grant) => grant.bundleId === planId);
	const permanentGrant = planGrants.find((grant) => grant.kind === 'permanent');
	const representativeGrant = permanentGrant || planGrants.reduce((latest, grant) =>
		Number(grant.endsAtMs || 0) > Number(latest.endsAtMs || 0) ? grant : latest,
	planGrants[0]);

	return {
		programId: representativeGrant.programId,
		planId,
		kind: permanentGrant ? 'permanent' : 'temporary',
		source: representativeGrant.source,
		endsAtMs: permanentGrant ? null : Number(representativeGrant.endsAtMs || 0),
		grantIds: planGrants.map((grant) => grant.grantId),
		...(representativeGrant.transition
			? { transition: representativeGrant.transition }
			: {}),
	};
};

export type HomeownerPlusTrialSummary = {
	grantId: string;
	programId: string;
	startsAtMs: number;
	endsAtMs: number;
	daysRemaining: number;
};

export const getActiveHomeownerPlusTrial = (
	subscription?: Pick<
		SubscriptionData,
		'entitlementGrants'
	> | null,
	nowMs = Date.now(),
): HomeownerPlusTrialSummary | null => {
	const grant = subscription?.entitlementGrants?.find((candidate) => {
		const startsAtMs = Number(candidate.startsAtMs);
		const endsAtMs = Number(candidate.endsAtMs);
		return (
			candidate.programId === 'homeowner_plus_first_property_trial_v1' &&
			candidate.state === 'active' &&
			candidate.bundleId === 'homeowner_plus' &&
			Number.isFinite(startsAtMs) &&
			startsAtMs <= nowMs &&
			Number.isFinite(endsAtMs) &&
			endsAtMs > nowMs
		);
	});

	if (!grant) return null;
	const startsAtMs = Number(grant.startsAtMs);
	const endsAtMs = Number(grant.endsAtMs);
	return {
		grantId: grant.grantId,
		programId: grant.programId,
		startsAtMs,
		endsAtMs,
		daysRemaining: Math.max(
			1,
			Math.ceil((endsAtMs - nowMs) / (24 * 60 * 60 * 1000)),
		),
	};
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
	return getPlanLimit(planId, 'properties');
};

/**
 * Get the maximum number of devices allowed for a subscription plan
 */
export const getMaxDevicesForPlan = (planId: string): number => {
	const maxDevices = getPlanLimit(planId, 'devices');
	return isUnlimitedDeviceLimit(maxDevices) ? Number.POSITIVE_INFINITY : maxDevices;
};

export const getMaxFilesForPlan = (planId: string): number => {
	return getPlanLimit(planId, 'files');
};

export const getMaxStorageGbForPlan = (planId: string): number => {
	return getPlanLimit(planId, 'storage_gb');
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
	return subscriptionHasCapability(subscription, 'notifications.use');
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
	return subscriptionHasCapability(subscription, 'property_intelligence.use');
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
	return subscriptionHasCapability(subscription, 'property_knowledge.acquire');
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

	return subscriptionHasCapability(subscription, 'team.manage');
};

/**
 * Property and Portfolio can invite team members. Portfolio adds roles,
 * permissions, groups, and property-specific access.
 */
export const canUseSimpleTeamManagement = (
	subscription: SubscriptionData,
): boolean => canManageTeam(subscription);

export const canManageProperties = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'properties.manage');
};

export const canUseAdvancedTeamManagement = (
	subscription: SubscriptionData,
): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'team.advanced');
};

/**
 * Check if subscription plan allows tenant management
 */
export const canManageTenants = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'residents.manage');
};

export const canUseBusinessPropertyTypes = (
	subscription: SubscriptionData,
): boolean =>
	hasActiveSubscriptionOrGrant(subscription) &&
	subscriptionHasCapability(subscription, 'property_types.business');

export const canUseRentalManagement = (
	subscription: SubscriptionData,
): boolean =>
	hasActiveSubscriptionOrGrant(subscription) &&
	subscriptionHasCapability(subscription, 'rental_management.use');

/**
 * Check if subscription plan allows viewing reports
 */
export const canViewReports = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'reports.view');
};

export const canAccessReportBuilder = (
	subscription: SubscriptionData,
): boolean => {
	if (!canAccessReadOnlyFeatures(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'reports.view');
};

/**
 * Check if subscription plan allows data export
 */
export const canExportData = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'data.export');
};

export const canExportReports = (subscription: SubscriptionData): boolean => {
	if (!canAccessReadOnlyFeatures(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'data.export');
};

/**
 * Check if subscription plan includes priority support
 */
export const hasPrioritySupport = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'support.priority');
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

	return subscriptionHasCapability(subscription, 'maintenance_requests.submit');
};

/**
 * Check if subscription plan allows viewing tenant information
 */
export const canViewTenantInfo = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'residents.view');
};

/**
 * Check if subscription plan allows linked parts & supplies
 */
export const canLinkParts = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'parts.link');
};

/**
 * Check if subscription plan allows warranty tracking
 */
export const canTrackWarranties = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'warranties.track');
};

/**
 * Get how many suggested maintenance packages can be generated by the setup assistant.
 * A package is the task set attached to one equipment record.
 */
export const getSuggestedMaintenancePackageLimit = (
	subscription: SubscriptionData,
): number => {
	if (!hasActiveSubscriptionOrGrant(subscription)) {
		return 0;
	}

	const limit = getEntitlementLimit(
		resolveSubscriptionEntitlements(subscription),
		'suggested_maintenance_packages',
	);
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
	if (!hasActiveSubscriptionOrGrant(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'maintenance_packages.suggested');
};

export const canUseRecurringTasks = (subscription: SubscriptionData): boolean => {
	if (!hasActiveSubscriptionOrGrant(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'recurring_tasks.use');
};

export const canUseNotifications = (subscription: SubscriptionData): boolean => {
	if (!hasActiveSubscriptionOrGrant(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'notifications.use');
};

/**
 * Check if subscription plan allows advanced audit trail
 */
export const canAdvancedAuditTrail = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'audit.advanced');
};

/**
 * Check if subscription plan allows multi-unit management
 */
export const canManageMultiUnit = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'multi_unit.manage');
};

/**
 * Check if subscription plan allows portfolio-level reporting
 */
export const canPortfolioReporting = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'portfolio.reporting');
};

/**
 * Check if subscription plan allows advanced analytics
 */
export const canAdvancedAnalytics = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'analytics.advanced');
};

/**
 * Check if subscription plan allows property groups
 */
export const canPropertyGroups = (subscription: SubscriptionData): boolean => {
	if (!isSubscriptionActive(subscription)) {
		return false;
	}

	return subscriptionHasCapability(subscription, 'property_groups.manage');
};

/**
 * Get subscription plan details
 */
export const getSubscriptionPlanDetails = (planId: string) => {
	return getPlanById(planId);
};
