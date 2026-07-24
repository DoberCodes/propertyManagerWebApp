import { hasMaintleyAdminAccess } from './maintleyRole';

describe('Maintley platform roles', () => {
	it('distinguishes Maintley owner authority from customer ownership', () => {
		expect(hasMaintleyAdminAccess('owner')).toBe(true);
		expect(hasMaintleyAdminAccess('maintley_owner')).toBe(true);
		expect(hasMaintleyAdminAccess('admin')).toBe(true);
		expect(hasMaintleyAdminAccess('account_owner')).toBe(false);
		expect(hasMaintleyAdminAccess('property_owner')).toBe(false);
		expect(hasMaintleyAdminAccess('homeowner')).toBe(false);
	});
});
