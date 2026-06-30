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
});
