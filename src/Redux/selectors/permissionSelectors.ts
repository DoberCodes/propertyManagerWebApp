import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store/store';
import { UserRole } from '../../constants/roles';
import { isTenant, canViewAllPages } from '../../utils/permissions';
import {
	canManageTeam,
	canManageTenants,
	canAccessReadOnlyFeatures,
	getEffectiveAccessPlanId,
	getEffectiveSubscriptionPlanId,
} from '../../utils/subscriptionUtils';

const selectUser = (state: RootState) => state.user.currentUser;

const hasTeamInvitePromoCode = (user: ReturnType<typeof selectUser>): boolean =>
	String((user as any)?.subscription?.promoCode || '')
		.trim()
		.toUpperCase()
		.startsWith('TEAM-');

const isTeamMemberAccount = (user: ReturnType<typeof selectUser>): boolean =>
	!!user &&
	(hasTeamInvitePromoCode(user) ||
		(user.isAccountOwner !== true &&
			(user as any).isTeamMemberAccount === true));

export const selectIsTeamMemberAccount = createSelector([selectUser], (user) =>
	isTeamMemberAccount(user),
);

export const selectIsTenant = createSelector([selectUser], (user) => {
	return !!user && isTenant(user.role as UserRole);
});

export const selectIsContractor = createSelector([selectUser], (user) => {
	return !!user && (user.role as string) === 'contractor';
});

export const selectIsHomeowner = createSelector([selectUser], (user) => {
	if (!user) return false;
	if (user.workspaceMode) return user.workspaceMode === 'homeowner';

	const plan = getEffectiveAccessPlanId(user.subscription);
	return !!user &&
		(plan === 'homeowner' ||
			plan === 'homeowner_plus');
});

export const selectCanAccessTeam = createSelector([selectUser], (user) => {
	if (isTeamMemberAccount(user)) return false;
	if (!user || !user.subscription) return false;
	return canManageTeam(user.subscription) || user.hasExistingTeamMembers === true;
});

export const selectCanInviteTeamMembers = createSelector(
	[selectUser],
	(user) => {
		if (isTeamMemberAccount(user)) return false;
		if (!user || !user.subscription) return false;
		return canManageTeam(user.subscription);
	},
);

export const selectCanManageTenants = createSelector([selectUser], (user) => {
	if (isTeamMemberAccount(user)) return false;
	if (!user || !user.subscription) return false;
	return canManageTenants(user.subscription);
});

export const selectCanAccessProperties = createSelector(
	[selectUser],
	(user) => {
		if (isTeamMemberAccount(user)) return true;
		if (!user || !user.subscription) return false;
		return !!getEffectiveSubscriptionPlanId(user.subscription, 'homeowner');
	},
);

export const selectCanAccessReadOnlyFeatures = createSelector(
	[selectUser],
	(user) => {
		if (!user || !user.subscription) return false;
		return canAccessReadOnlyFeatures(user.subscription);
	},
);

export const selectCanViewAllPages = createSelector([selectUser], (user) => {
	if (!user) return false;
	return canViewAllPages(user.role as UserRole);
});

