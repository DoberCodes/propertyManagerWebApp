import {
	getAnalyticsPlanFamily,
	getAnalyticsRoleFamily,
} from './analyticsIdentity';

describe('analytics identity classifications', () => {
	it('groups detailed roles without exposing account-specific values', () => {
		expect(getAnalyticsRoleFamily('admin')).toBe('owner');
		expect(getAnalyticsRoleFamily('property_manager')).toBe('manager');
		expect(getAnalyticsRoleFamily('maintenance_lead')).toBe('contributor');
		expect(getAnalyticsRoleFamily('tenant')).toBe('tenant');
		expect(getAnalyticsRoleFamily('custom_role')).toBe('other');
	});

	it('groups product plans into stable reporting families', () => {
		expect(getAnalyticsPlanFamily('homeowner')).toBe('free');
		expect(getAnalyticsPlanFamily('homeowner_plus')).toBe('homeowner_plus');
		expect(getAnalyticsPlanFamily('property')).toBe('business');
		expect(getAnalyticsPlanFamily('portfolio')).toBe('business');
		expect(getAnalyticsPlanFamily(undefined)).toBe('unknown');
	});
});
