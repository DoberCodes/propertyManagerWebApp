import { hasMaintleyAdminAccess, isMaintleyOwner } from './maintleyRole';

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

describe('isMaintleyOwner', () => {
	it('distinguishes Maintley Owner from Maintley Admin and customer ownership', () => {
		expect(isMaintleyOwner('owner')).toBe(true);
		expect(isMaintleyOwner({ role: 'maintley-owner' })).toBe(true);
		expect(isMaintleyOwner('admin')).toBe(false);
		expect(isMaintleyOwner(undefined)).toBe(false);
	});
});
