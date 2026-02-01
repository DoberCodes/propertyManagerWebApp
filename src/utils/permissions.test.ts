import {
	isTenant,
	canApproveTaskCompletions,
	canManageProperties,
	canManageTeamMembers,
	getTenantPropertySlug,
} from './permissions';
import { USER_ROLES } from '../constants/roles';

describe('permissions utility functions', () => {
	describe('isTenant', () => {
		it('should return true for tenant role', () => {
			expect(isTenant(USER_ROLES.TENANT)).toBe(true);
		});

		it('should return false for non-tenant roles', () => {
			expect(isTenant(USER_ROLES.ADMIN)).toBe(false);
			expect(isTenant(USER_ROLES.PROPERTY_MANAGER)).toBe(false);
			expect(isTenant(USER_ROLES.CONTRACTOR)).toBe(false);
		});

		it('should return false for undefined role', () => {
			expect(isTenant(undefined as any)).toBe(false);
		});

		it('should return false for null role', () => {
			expect(isTenant(null as any)).toBe(false);
		});
	});

	describe('canApproveTaskCompletions', () => {
		it('should return true for admin role', () => {
			expect(canApproveTaskCompletions(USER_ROLES.ADMIN)).toBe(true);
		});

		it('should return true for property manager role', () => {
			expect(canApproveTaskCompletions(USER_ROLES.PROPERTY_MANAGER)).toBe(true);
		});

		it('should return false for tenant role', () => {
			expect(canApproveTaskCompletions(USER_ROLES.TENANT)).toBe(false);
		});

		it('should return false for contractor role', () => {
			expect(canApproveTaskCompletions(USER_ROLES.CONTRACTOR)).toBe(false);
		});

		it('should return false for undefined role', () => {
			expect(canApproveTaskCompletions(undefined as any)).toBe(false);
		});
	});

	describe('canManageProperties', () => {
		it('should return true for admin role', () => {
			expect(canManageProperties(USER_ROLES.ADMIN)).toBe(true);
		});

		it('should return true for property manager role', () => {
			expect(canManageProperties(USER_ROLES.PROPERTY_MANAGER)).toBe(true);
		});

		it('should return false for tenant role', () => {
			expect(canManageProperties(USER_ROLES.TENANT)).toBe(false);
		});

		it('should return false for contractor role', () => {
			expect(canManageProperties(USER_ROLES.CONTRACTOR)).toBe(false);
		});
	});

	describe('canManageTeamMembers', () => {
		it('should return true for admin role', () => {
			expect(canManageTeamMembers(USER_ROLES.ADMIN)).toBe(true);
		});

		it('should return true for property manager role', () => {
			expect(canManageTeamMembers(USER_ROLES.PROPERTY_MANAGER)).toBe(true);
		});

		it('should return false for tenant role', () => {
			expect(canManageTeamMembers(USER_ROLES.TENANT)).toBe(false);
		});

		it('should return false for contractor role', () => {
			expect(canManageTeamMembers(USER_ROLES.CONTRACTOR)).toBe(false);
		});
	});

	describe('getTenantPropertySlug', () => {
		it('should return property slug for valid property ID', () => {
			expect(getTenantPropertySlug(1)).toBe('downtown-apartments');
			expect(getTenantPropertySlug(2)).toBe('business-park');
			expect(getTenantPropertySlug(3)).toBe('sunset-heights');
			expect(getTenantPropertySlug(4)).toBe('oak-street-complex');
		});

		it('should return null for invalid property ID', () => {
			expect(getTenantPropertySlug(999)).toBe(null);
		});

		it('should return null if no property ID provided', () => {
			expect(getTenantPropertySlug()).toBe(null);
		});

		it('should return null for undefined property ID', () => {
			expect(getTenantPropertySlug(undefined)).toBe(null);
		});
	});
});
