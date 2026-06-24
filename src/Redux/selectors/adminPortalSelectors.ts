import { RootState } from '../store/store';

// Audit Logs Selectors
export const selectAuditLogs = (state: RootState) => state.adminPortal.auditLogs.data;
export const selectAuditLogsLoading = (state: RootState) => state.adminPortal.auditLogs.loading;
export const selectAuditLogsError = (state: RootState) => state.adminPortal.auditLogs.error;
export const selectAuditLogsLastLoaded = (state: RootState) =>
	state.adminPortal.auditLogs.lastLoadedAt;
export const selectAuditLogsFilters = (state: RootState) => ({
	query: state.adminPortal.auditLogs.query,
	action: state.adminPortal.auditLogs.action,
	targetId: state.adminPortal.auditLogs.targetId,
});

export const selectFilteredAuditLogs = (state: RootState) => {
	const { data, query, action, targetId } = state.adminPortal.auditLogs;
	return data.filter((log) => {
		if (query && !log.metadata?.toString().toLowerCase().includes(query.toLowerCase())) {
			return false;
		}
		if (action && log.action !== action) {
			return false;
		}
		if (targetId && log.targetId !== targetId) {
			return false;
		}
		return true;
	});
};

// Users Selectors
export const selectAdminUsers = (state: RootState) => state.adminPortal.users.data;
export const selectAdminUsersLoading = (state: RootState) => state.adminPortal.users.loading;
export const selectAdminUsersError = (state: RootState) => state.adminPortal.users.error;
export const selectAdminUsersLastLoaded = (state: RootState) =>
	state.adminPortal.users.lastLoadedAt;
export const selectAdminUsersFilters = (state: RootState) => ({
	query: state.adminPortal.users.query,
	listFilter: state.adminPortal.users.listFilter,
});

export const selectFilteredAdminUsers = (state: RootState) => {
	const { data, query, listFilter } = state.adminPortal.users;
	return data.filter((user) => {
		if (query) {
			const searchLower = query.toLowerCase();
				const matchesEmail = String(user.email || '').toLowerCase().includes(searchLower);
				const matchesPlan = String((user as any).planName || user.subscriptionPlan || '')
					.toLowerCase()
					.includes(searchLower);
				const matchesStatus = String((user as any).status || user.accountStatus || user.subscriptionStatus || '')
					.toLowerCase()
					.includes(searchLower);
			if (!matchesEmail && !matchesPlan && !matchesStatus) {
				return false;
			}
		}
		if (
			listFilter &&
			listFilter !== 'all' &&
				String((user as any).status || user.accountStatus || user.subscriptionStatus || '')
					.toLowerCase() !== listFilter.toLowerCase()
		) {
			return false;
		}
		return true;
	});
};

// Billing Coupons Selectors
export const selectBillingCoupons = (state: RootState) => state.adminPortal.billingCoupons.data;
export const selectBillingCouponsLoading = (state: RootState) =>
	state.adminPortal.billingCoupons.loading;
export const selectBillingCouponsError = (state: RootState) =>
	state.adminPortal.billingCoupons.error;
export const selectBillingCouponsLastLoaded = (state: RootState) =>
	state.adminPortal.billingCoupons.lastLoadedAt;
