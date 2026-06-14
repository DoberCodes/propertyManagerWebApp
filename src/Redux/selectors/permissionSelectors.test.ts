import {
	selectIsTenant,
	selectIsContractor,
	selectIsHomeowner,
	selectCanAccessTeam,
	selectCanInviteTeamMembers,
	selectCanManageTenants,
	selectCanAccessProperties,
	selectCanAccessReadOnlyFeatures,
	selectCanViewAllPages,
} from './permissionSelectors';
import { USER_ROLES } from '../../constants/roles';
import { SUBSCRIPTION_STATUS } from '../../constants/subscriptions';

describe('permission selectors', () => {
	describe('selectIsTenant', () => {
		it('returns true when user role is tenant', () => {
			expect(
				selectIsTenant({
					user: { currentUser: { role: USER_ROLES.TENANT } },
				} as any),
			).toBe(true);
		});

		it('returns false for other roles or missing user', () => {
			expect(
				selectIsTenant({
					user: { currentUser: { role: USER_ROLES.ADMIN } },
				} as any),
			).toBe(false);
			expect(selectIsTenant({ user: { currentUser: null } } as any)).toBe(
				false,
			);
		});
	});

	describe('selectIsContractor', () => {
		it('returns true for contractor role', () => {
			expect(
				selectIsContractor({
					user: { currentUser: { role: USER_ROLES.CONTRACTOR } },
				} as any),
			).toBe(true);
		});

		it('returns false for non-contractor roles', () => {
			expect(
				selectIsContractor({
					user: { currentUser: { role: USER_ROLES.ADMIN } },
				} as any),
			).toBe(false);
		});
	});

	describe('selectIsHomeowner', () => {
		it('returns true when subscription.plan is a homeowner plan', () => {
			expect(
				selectIsHomeowner({
					user: { currentUser: { subscription: { plan: 'homeowner' } } },
				} as any),
			).toBe(true);
			expect(
				selectIsHomeowner({
					user: { currentUser: { subscription: { plan: 'homeowner_plus' } } },
				} as any),
			).toBe(true);
			expect(
				selectIsHomeowner({
					user: { currentUser: { subscription: { plan: 'team' } } },
				} as any),
			).toBe(false);
		});

		it('returns false when no subscription or different plan', () => {
			expect(selectIsHomeowner({ user: { currentUser: null } } as any)).toBe(
				false,
			);
			expect(
				selectIsHomeowner({
					user: { currentUser: { subscription: { plan: 'property' } } },
				} as any),
			).toBe(false);
		});
	});

	describe('selectCanAccessProperties', () => {
	it('returns true for current subscription plans', () => {
		expect(
			selectCanAccessProperties({
				user: { currentUser: { subscription: { plan: 'property' } } },
			} as any),
		).toBe(true);
	});

	it('returns true for local Homeowner plan and false for missing subscription', () => {
		expect(
			selectCanAccessProperties({
				user: { currentUser: { subscription: { plan: 'homeowner' } } },
			} as any),
		).toBe(true);
			expect(
				selectCanAccessProperties({ user: { currentUser: null } } as any),
			).toBe(false);
		});
	});

	describe('selectCanAccessTeam', () => {
		it('returns true for active Property and Portfolio team permissions', () => {
			const state: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'portfolio',
						},
					},
				},
			};
			const propertyState: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'property',
						},
					},
				},
			};
			expect(selectCanAccessTeam(state)).toBe(true);
			expect(selectCanAccessTeam(propertyState)).toBe(true);
		});

	it('returns false for Homeowner plan or inactive subscription', () => {
		const freeState: any = {
			user: {
				currentUser: {
					subscription: { status: SUBSCRIPTION_STATUS.ACTIVE, plan: 'homeowner' },
				},
			},
		};
			const expiredState: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.EXPIRED,
							plan: 'property',
						},
					},
				},
			};

			expect(selectCanAccessTeam(freeState)).toBe(false);
			expect(selectCanAccessTeam(expiredState)).toBe(false);
		});
	});

	describe('selectCanInviteTeamMembers', () => {
		it('matches team invite capability for Property and Portfolio', () => {
			const state: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'portfolio',
						},
					},
				},
			};
			const propertyState: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'property',
						},
					},
				},
			};
			expect(selectCanInviteTeamMembers(state)).toBe(true);
			expect(selectCanInviteTeamMembers(propertyState)).toBe(true);
		});

		it('returns false when user has no subscription', () => {
			expect(
				selectCanInviteTeamMembers({ user: { currentUser: null } } as any),
			).toBe(false);
		});
	});

	describe('selectCanManageTenants', () => {
		it('returns true for active Property and Portfolio tenant management capability', () => {
			const state: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'portfolio',
						},
					},
				},
			};
			const propertyState: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'property',
						},
					},
				},
			};
			expect(selectCanManageTenants(state)).toBe(true);
			expect(selectCanManageTenants(propertyState)).toBe(true);
		});

		it('returns false for plans without tenant management capability', () => {
			const state: any = {
				user: {
					currentUser: {
						subscription: { status: SUBSCRIPTION_STATUS.ACTIVE, plan: 'homeowner' },
					},
				},
			};
			expect(selectCanManageTenants(state)).toBe(false);
		});
	});

	describe('selectCanAccessReadOnlyFeatures', () => {
		it('returns true for active subscription', () => {
			const state: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.ACTIVE,
							plan: 'portfolio',
						},
					},
				},
			};
			expect(selectCanAccessReadOnlyFeatures(state)).toBe(true);
		});

		it('returns true for expired subscription (read-only allowed)', () => {
			const state: any = {
				user: {
					currentUser: {
						subscription: {
							status: SUBSCRIPTION_STATUS.EXPIRED,
							plan: 'portfolio',
						},
					},
				},
			};
			expect(selectCanAccessReadOnlyFeatures(state)).toBe(true);
		});

		it('returns false when no subscription or not active/expired', () => {
			expect(
				selectCanAccessReadOnlyFeatures({ user: { currentUser: null } } as any),
			).toBe(false);
		});
	});

	describe('selectCanViewAllPages', () => {
		it('returns true for roles included in PAGE_VIEW_ROLES (maintenance)', () => {
			expect(
				selectCanViewAllPages({
					user: { currentUser: { role: USER_ROLES.MAINTENANCE } },
				} as any),
			).toBe(true);
		});

		it('returns false for tenant', () => {
			expect(
				selectCanViewAllPages({
					user: { currentUser: { role: USER_ROLES.TENANT } },
				} as any),
			).toBe(false);
		});
	});
});
