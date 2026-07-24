import { SUBSCRIPTION_STATUS } from '../constants/subscriptions';
import {
	canAdvancedAuditTrail,
	canAccessReportBuilder,
	canExportData,
	canExportReports,
	canLinkParts,
	canManageTeam,
	canManageTenants,
	canTrackWarranties,
	canUseAdvancedTeamManagement,
	canUseNotifications,
	canUseRecurringTasks,
	canUseSimpleTeamManagement,
	canUseSuggestedMaintenancePackages,
	canViewReports,
	getEffectiveSubscriptionPlanId,
	getActiveHomeownerPlusTrial,
	getMaxFilesForPlan,
	getMaxPropertiesForPlan,
	getMaxStorageGbForPlan,
	getSuggestedMaintenancePackageLimit,
	SubscriptionData,
} from './subscriptionUtils';

const activeSubscription = (plan: string): SubscriptionData => ({
	status: SUBSCRIPTION_STATUS.ACTIVE,
	plan,
	currentPeriodStart: 0,
	currentPeriodEnd: 9999999999,
});

const expiredSubscription = (plan: string): SubscriptionData => ({
	status: SUBSCRIPTION_STATUS.EXPIRED,
	plan,
	currentPeriodStart: 0,
	currentPeriodEnd: 0,
	trialEndsAt: 0,
});

describe('subscriptionUtils', () => {
	it('treats Homeowner Plus like Property for paid maintenance capabilities', () => {
		const homeownerPlus = activeSubscription('homeowner_plus');

		expect(canUseSuggestedMaintenancePackages(homeownerPlus)).toBe(true);
		expect(getSuggestedMaintenancePackageLimit(homeownerPlus)).toBe(
			Number.POSITIVE_INFINITY,
		);
		expect(canUseRecurringTasks(homeownerPlus)).toBe(true);
		expect(canUseNotifications(homeownerPlus)).toBe(true);
		expect(canViewReports(homeownerPlus)).toBe(true);
		expect(canExportData(homeownerPlus)).toBe(true);
		expect(canTrackWarranties(homeownerPlus)).toBe(true);
		expect(canLinkParts(homeownerPlus)).toBe(true);
		expect(canAdvancedAuditTrail(homeownerPlus)).toBe(true);
	});

	it('keeps Homeowner Plus homeowner-sized limits without team or tenant management', () => {
		const homeownerPlus = activeSubscription('homeowner_plus');

		expect(getMaxPropertiesForPlan('homeowner_plus')).toBe(1);
		expect(getMaxPropertiesForPlan('multi_homeowner')).toBe(5);
		expect(getMaxFilesForPlan('multi_homeowner')).toBe(250);
		expect(getMaxStorageGbForPlan('multi_homeowner')).toBe(5);
		expect(getMaxFilesForPlan('homeowner_plus')).toBe(250);
		expect(getMaxStorageGbForPlan('homeowner_plus')).toBe(5);
		expect(getMaxFilesForPlan('homeowner_plus')).toBeLessThan(
			getMaxFilesForPlan('property'),
		);
		expect(getMaxStorageGbForPlan('homeowner_plus')).toBeLessThan(
			getMaxStorageGbForPlan('property'),
		);
		expect(canManageTeam(homeownerPlus)).toBe(false);
		expect(canManageTenants(homeownerPlus)).toBe(false);
	});

	it('matches the matrix limits for Free, Property, and Portfolio', () => {
		expect(getMaxPropertiesForPlan('homeowner')).toBe(1);
		expect(getMaxFilesForPlan('homeowner')).toBe(10);
		expect(getMaxStorageGbForPlan('homeowner')).toBe(1);

		expect(getMaxPropertiesForPlan('property')).toBe(7);
		expect(getMaxFilesForPlan('property')).toBe(1500);
		expect(getMaxStorageGbForPlan('property')).toBe(15);

		expect(getMaxPropertiesForPlan('portfolio')).toBe(15);
		expect(getMaxFilesForPlan('portfolio')).toBe(5000);
		expect(getMaxStorageGbForPlan('portfolio')).toBe(25);
	});

	it('allows Free raw exports and warranty info without task generation', () => {
		const free = activeSubscription('homeowner');

		expect(canViewReports(free)).toBe(true);
		expect(canExportData(free)).toBe(true);
		expect(canAccessReportBuilder(free)).toBe(true);
		expect(canExportReports(free)).toBe(true);
		expect(canTrackWarranties(free)).toBe(true);
		expect(canUseSuggestedMaintenancePackages(free)).toBe(false);
		expect(getSuggestedMaintenancePackageLimit(free)).toBe(0);
	});

	it('allows expired users to access report exports for their existing data', () => {
		const expired = expiredSubscription('homeowner');

		expect(canViewReports(expired)).toBe(false);
		expect(canExportData(expired)).toBe(false);
		expect(canAccessReportBuilder(expired)).toBe(true);
		expect(canExportReports(expired)).toBe(true);
	});

	it('separates simple Property teams from advanced Portfolio teams', () => {
		const property = activeSubscription('property');
		const portfolio = activeSubscription('portfolio');

		expect(canManageTeam(property)).toBe(true);
		expect(canUseSimpleTeamManagement(property)).toBe(true);
		expect(canUseAdvancedTeamManagement(property)).toBe(false);

		expect(canManageTeam(portfolio)).toBe(true);
		expect(canUseSimpleTeamManagement(portfolio)).toBe(true);
		expect(canUseAdvancedTeamManagement(portfolio)).toBe(true);
	});

	it('allows resident management on Property and Portfolio only', () => {
		const free = activeSubscription('homeowner');
		const homeownerPlus = activeSubscription('homeowner_plus');
		const property = activeSubscription('property');
		const portfolio = activeSubscription('portfolio');

		expect(canManageTenants(free)).toBe(false);
		expect(canManageTenants(homeownerPlus)).toBe(false);
		expect(canManageTenants(property)).toBe(true);
		expect(canManageTenants(portfolio)).toBe(true);
	});

	it('keeps Team and Tenant as local-only non-Stripe plans', () => {
		const team = activeSubscription('team');
		const tenant = activeSubscription('tenant');

		expect(getMaxPropertiesForPlan('team')).toBe(0);
		expect(getMaxPropertiesForPlan('tenant')).toBe(0);
		expect(canManageTeam(team)).toBe(false);
		expect(canManageTenants(team)).toBe(false);
		expect(canManageTeam(tenant)).toBe(false);
		expect(canManageTenants(tenant)).toBe(false);
	});

	it('does not treat an abandoned paid checkout as paid-plan access', () => {
		const abandonedCheckout: SubscriptionData = {
			status: SUBSCRIPTION_STATUS.CANCELLED,
			plan: 'portfolio',
			currentPeriodStart: 0,
			currentPeriodEnd: 0,
			promoCode: 'summer',
			pendingCheckoutPlan: 'portfolio',
			pendingCheckoutStartedAt: 1,
		};

		expect(getEffectiveSubscriptionPlanId(abandonedCheckout)).toBe('homeowner');
		expect(canManageTeam(abandonedCheckout)).toBe(false);
		expect(canManageTenants(abandonedCheckout)).toBe(false);
	});

	it('keeps active free users on free entitlement while paid checkout is pending', () => {
		const pendingPaidCheckout: SubscriptionData = {
			status: SUBSCRIPTION_STATUS.ACTIVE,
			plan: 'homeowner',
			currentPeriodStart: 0,
			currentPeriodEnd: 9999999999,
			promoCode: 'summer',
			pendingCheckoutPlan: 'portfolio',
			pendingCheckoutStartedAt: 1,
		};

		expect(getEffectiveSubscriptionPlanId(pendingPaidCheckout)).toBe('homeowner');
		expect(canManageTeam(pendingPaidCheckout)).toBe(false);
		expect(canManageTenants(pendingPaidCheckout)).toBe(false);
		expect(canUseAdvancedTeamManagement(pendingPaidCheckout)).toBe(false);
	});

	it('does not grant paid feature access from a pending checkout on expired access', () => {
		const expiredWithPendingPaidCheckout: SubscriptionData = {
			status: SUBSCRIPTION_STATUS.EXPIRED,
			plan: 'property',
			currentPeriodStart: 0,
			currentPeriodEnd: 0,
			trialEndsAt: 0,
			pendingCheckoutPlan: 'portfolio',
			pendingCheckoutStartedAt: 1,
		};

		expect(getEffectiveSubscriptionPlanId(expiredWithPendingPaidCheckout)).toBe(
			'homeowner',
		);
		expect(canManageTeam(expiredWithPendingPaidCheckout)).toBe(false);
		expect(canManageTenants(expiredWithPendingPaidCheckout)).toBe(false);
		expect(canUseAdvancedTeamManagement(expiredWithPendingPaidCheckout)).toBe(false);
	});

	it('does not grant paid access when a pending checkout left a paid plan without Stripe confirmation', () => {
		const stalePaidCheckout: SubscriptionData = {
			status: SUBSCRIPTION_STATUS.ACTIVE,
			plan: 'portfolio',
			currentPeriodStart: 0,
			currentPeriodEnd: 9999999999,
			promoCode: 'summer',
			pendingCheckoutPlan: 'portfolio',
			pendingCheckoutStartedAt: 1,
		};

		expect(getEffectiveSubscriptionPlanId(stalePaidCheckout)).toBe('homeowner');
		expect(canManageTeam(stalePaidCheckout)).toBe(false);
		expect(canManageTenants(stalePaidCheckout)).toBe(false);
		expect(canUseAdvancedTeamManagement(stalePaidCheckout)).toBe(false);
	});

	it('keeps paid access when Stripe has confirmed the subscription', () => {
		const confirmedPaidCheckout: SubscriptionData = {
			status: SUBSCRIPTION_STATUS.ACTIVE,
			plan: 'portfolio',
			currentPeriodStart: 0,
			currentPeriodEnd: 9999999999,
			pendingCheckoutPlan: 'portfolio',
			pendingCheckoutStartedAt: 1,
			stripeSubscriptionId: 'sub_confirmed',
		};

		expect(getEffectiveSubscriptionPlanId(confirmedPaidCheckout)).toBe('portfolio');
		expect(canManageTeam(confirmedPaidCheckout)).toBe(true);
		expect(canManageTenants(confirmedPaidCheckout)).toBe(true);
		expect(canUseAdvancedTeamManagement(confirmedPaidCheckout)).toBe(true);
	});

	it('keeps scheduled future plans out of current entitlement checks', () => {
		const currentHomeownerWithScheduledPortfolio: SubscriptionData = {
			status: SUBSCRIPTION_STATUS.ACTIVE,
			plan: 'homeowner',
			currentPeriodStart: 0,
			currentPeriodEnd: 9999999999,
			hasScheduledSubscription: true,
			scheduledPlan: 'portfolio',
		};

		expect(getEffectiveSubscriptionPlanId(currentHomeownerWithScheduledPortfolio)).toBe(
			'homeowner',
		);
		expect(canManageTeam(currentHomeownerWithScheduledPortfolio)).toBe(false);
	});

	it('layers an active Homeowner+ trial grant over the Free base plan', () => {
		const nowMs = Date.now();
		const freeWithTrial: SubscriptionData = {
			...activeSubscription('homeowner'),
			entitlementAccountId: 'account-1',
			entitlementGrants: [
				{
					grantId: 'homeowner_plus_first_property_trial',
					programId: 'homeowner_plus_first_property_trial_v1',
					accountId: 'account-1',
					kind: 'temporary',
					state: 'active',
					bundleId: 'homeowner_plus',
					bundleVersion: 'v1',
					startsAtMs: nowMs - 1000,
					endsAtMs: nowMs + 30 * 24 * 60 * 60 * 1000,
					source: 'trial',
				},
			],
		};

		expect(getEffectiveSubscriptionPlanId(freeWithTrial)).toBe('homeowner');
		expect(canUseRecurringTasks(freeWithTrial)).toBe(true);
		expect(canUseNotifications(freeWithTrial)).toBe(true);
		expect(getActiveHomeownerPlusTrial(freeWithTrial, nowMs)?.daysRemaining).toBe(30);
	});

	it('falls back to Free behavior when the internal trial grant expires', () => {
		const nowMs = Date.now();
		const freeWithExpiredTrial: SubscriptionData = {
			...activeSubscription('homeowner'),
			entitlementAccountId: 'account-1',
			entitlementGrants: [
				{
					grantId: 'homeowner_plus_first_property_trial',
					programId: 'homeowner_plus_first_property_trial_v1',
					accountId: 'account-1',
					kind: 'temporary',
					state: 'active',
					bundleId: 'homeowner_plus',
					bundleVersion: 'v1',
					startsAtMs: nowMs - 31 * 24 * 60 * 60 * 1000,
					endsAtMs: nowMs - 1000,
					source: 'trial',
				},
			],
		};

		expect(canUseRecurringTasks(freeWithExpiredTrial)).toBe(false);
		expect(canUseNotifications(freeWithExpiredTrial)).toBe(false);
		expect(getActiveHomeownerPlusTrial(freeWithExpiredTrial, nowMs)).toBeNull();
	});
});
