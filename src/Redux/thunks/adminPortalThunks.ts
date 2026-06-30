import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAuditLogs = createAsyncThunk(
	'adminPortal/fetchAuditLogs',
	async ({
		sessionToken,
		query,
		action,
		targetId,
		limit = 200,
	}: {
		sessionToken: string;
		query?: string;
		action?: string;
		targetId?: string;
		limit?: number;
	}) => {
		const { listAdminPortalAuditLogs } = await import('../../services/adminPortalService');
		const data = await listAdminPortalAuditLogs({
			sessionToken,
			query: query?.trim() || undefined,
			action: action?.trim() || undefined,
			targetId: targetId?.trim() || undefined,
			limit,
		});
		return data;
	},
);

export const fetchAdminUsers = createAsyncThunk(
	'adminPortal/fetchUsers',
	async ({
		sessionToken,
		query,
		filter,
		limit = 250,
	}: {
		sessionToken: string;
		query?: string;
		filter?: string;
		limit?: number;
	}) => {
		const { listAdminPortalUsers } = await import('../../services/adminPortalService');
		const data = await listAdminPortalUsers({
			sessionToken,
			query: query?.trim() || undefined,
			filter: filter || undefined,
			limit,
		});
		return data;
	},
);

export const fetchBillingCoupons = createAsyncThunk(
	'adminPortal/fetchBillingCoupons',
	async ({ sessionToken, limit = 100 }: { sessionToken: string; limit?: number }) => {
		const { adminPortalListBillingCoupons } = await import('../../services/adminPortalService');
		const data = await adminPortalListBillingCoupons({
			sessionToken,
			limit,
		});
		return data;
	},
);
