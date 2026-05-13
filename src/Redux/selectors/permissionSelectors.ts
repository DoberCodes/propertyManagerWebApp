import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store/store';
import { UserRole } from '../../constants/roles';
import { isTenant, canViewAllPages } from '../../utils/permissions';
import {
	canManageTeam,
	canManageTenants,
	canAccessReadOnlyFeatures,
} from '../../utils/subscriptionUtils';

const selectUser = (state: RootState) => state.user.currentUser;

export const selectIsTenant = createSelector([selectUser], (user) => {
	return !!user && isTenant(user.role as UserRole);
});

export const selectIsContractor = createSelector([selectUser], (user) => {
	return !!user && (user.role as string) === 'contractor';
});

export const selectIsHomeowner = createSelector([selectUser], (user) => {
	const plan = String(user?.subscription?.plan || '').toLowerCase();
	return !!user && (plan === 'home' || plan === 'homeowner');
});

export const selectCanAccessTeam = createSelector([selectUser], (user) => {
	if (!user || !user.subscription) return false;
	return canManageTeam(user.subscription);
});

export const selectCanInviteTeamMembers = createSelector(
	[selectUser],
	(user) => {
		if (!user || !user.subscription) return false;
		return canManageTeam(user.subscription);
	},
);

export const selectCanManageTenants = createSelector([selectUser], (user) => {
	if (!user || !user.subscription) return false;
	return canManageTenants(user.subscription);
});

export const selectCanAccessProperties = createSelector(
	[selectUser],
	(user) => {
		if (!user || !user.subscription) return false;
		return user.subscription.plan !== 'free';
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
