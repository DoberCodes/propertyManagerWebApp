import { USER_ROLES } from '../constants/roles';
import { getFallbackRoute } from './fallbackRoute';

describe('getFallbackRoute', () => {
	it('uses an absolute dashboard route for authenticated non-tenant users', () => {
		expect(getFallbackRoute('homeowner')).toBe('/dashboard');
		expect(getFallbackRoute(undefined)).toBe('/dashboard');
	});

	it('uses an absolute tenant profile route for tenants', () => {
		expect(getFallbackRoute(USER_ROLES.TENANT)).toBe('/tenant-profile');
	});
});
