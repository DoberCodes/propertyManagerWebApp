import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
	AdminPortalAuditLogRecord,
	AdminPortalUserRecord,
	AdminBillingCoupon,
} from '../../services/adminPortalService';
import { fetchAuditLogs, fetchAdminUsers, fetchBillingCoupons } from '../thunks/adminPortalThunks';

export interface AdminPortalState {
	auditLogs: {
		data: AdminPortalAuditLogRecord[];
		loading: boolean;
		error: string | null;
		lastLoadedAt: string | null;
		query: string;
		action: string;
		targetId: string;
	};
	users: {
		data: AdminPortalUserRecord[];
		loading: boolean;
		error: string | null;
		lastLoadedAt: string | null;
		query: string;
		listFilter: string;
	};
	billingCoupons: {
		data: AdminBillingCoupon[];
		loading: boolean;
		error: string | null;
		lastLoadedAt: string | null;
	};
}

const initialState: AdminPortalState = {
	auditLogs: {
		data: [],
		loading: false,
		error: null,
		lastLoadedAt: null,
		query: '',
		action: '',
		targetId: '',
	},
	users: {
		data: [],
		loading: false,
		error: null,
		lastLoadedAt: null,
		query: '',
		listFilter: '',
	},
	billingCoupons: {
		data: [],
		loading: false,
		error: null,
		lastLoadedAt: null,
	},
};

const adminPortalSlice = createSlice({
	name: 'adminPortal',
	initialState,
	reducers: {
		// Audit logs
		setAuditLogsLoading: (state, action: PayloadAction<boolean>) => {
			state.auditLogs.loading = action.payload;
		},
		setAuditLogsData: (state, action: PayloadAction<AdminPortalAuditLogRecord[]>) => {
			state.auditLogs.data = action.payload;
			state.auditLogs.loading = false;
			state.auditLogs.error = null;
			state.auditLogs.lastLoadedAt = new Date().toLocaleTimeString();
		},
		setAuditLogsError: (state, action: PayloadAction<string | null>) => {
			state.auditLogs.error = action.payload;
			state.auditLogs.loading = false;
		},
		setAuditLogsFilters: (
			state,
			action: PayloadAction<{ query?: string; action?: string; targetId?: string }>,
		) => {
			if (action.payload.query !== undefined) state.auditLogs.query = action.payload.query;
			if (action.payload.action !== undefined) state.auditLogs.action = action.payload.action;
			if (action.payload.targetId !== undefined) state.auditLogs.targetId = action.payload.targetId;
		},
		clearAuditLogs: (state) => {
			state.auditLogs = initialState.auditLogs;
		},

		// Users
		setUsersLoading: (state, action: PayloadAction<boolean>) => {
			state.users.loading = action.payload;
		},
		setUsersData: (state, action: PayloadAction<AdminPortalUserRecord[]>) => {
			state.users.data = action.payload;
			state.users.loading = false;
			state.users.error = null;
			state.users.lastLoadedAt = new Date().toLocaleTimeString();
		},
		setUsersError: (state, action: PayloadAction<string | null>) => {
			state.users.error = action.payload;
			state.users.loading = false;
		},
		setUsersFilters: (state, action: PayloadAction<{ query?: string; listFilter?: string }>) => {
			if (action.payload.query !== undefined) state.users.query = action.payload.query;
			if (action.payload.listFilter !== undefined) state.users.listFilter = action.payload.listFilter;
		},
		clearUsers: (state) => {
			state.users = initialState.users;
		},

		// Billing coupons
		setBillingCouponsLoading: (state, action: PayloadAction<boolean>) => {
			state.billingCoupons.loading = action.payload;
		},
		setBillingCouponsData: (state, action: PayloadAction<AdminBillingCoupon[]>) => {
			state.billingCoupons.data = action.payload;
			state.billingCoupons.loading = false;
			state.billingCoupons.error = null;
			state.billingCoupons.lastLoadedAt = new Date().toLocaleTimeString();
		},
		setBillingCouponsError: (state, action: PayloadAction<string | null>) => {
			state.billingCoupons.error = action.payload;
			state.billingCoupons.loading = false;
		},
		addBillingCoupon: (state, action: PayloadAction<AdminBillingCoupon>) => {
			state.billingCoupons.data.unshift(action.payload);
		},
		clearBillingCoupons: (state) => {
			state.billingCoupons = initialState.billingCoupons;
		},
	},
	extraReducers: (builder) => {
		// Audit Logs Thunk
		builder.addCase(fetchAuditLogs.pending, (state) => {
			state.auditLogs.loading = true;
			state.auditLogs.error = null;
		});
		builder.addCase(fetchAuditLogs.fulfilled, (state, action) => {
			state.auditLogs.data = action.payload;
			state.auditLogs.loading = false;
			state.auditLogs.error = null;
			state.auditLogs.lastLoadedAt = new Date().toLocaleTimeString();
		});
		builder.addCase(fetchAuditLogs.rejected, (state, action) => {
			state.auditLogs.loading = false;
			state.auditLogs.error =
				action.error.message || 'Failed to load audit logs.';
		});

		// Users Thunk
		builder.addCase(fetchAdminUsers.pending, (state) => {
			state.users.loading = true;
			state.users.error = null;
		});
		builder.addCase(fetchAdminUsers.fulfilled, (state, action) => {
			state.users.data = action.payload;
			state.users.loading = false;
			state.users.error = null;
			state.users.lastLoadedAt = new Date().toLocaleTimeString();
		});
		builder.addCase(fetchAdminUsers.rejected, (state, action) => {
			state.users.loading = false;
			state.users.error = action.error.message || 'Failed to load users.';
		});

		// Billing Coupons Thunk
		builder.addCase(fetchBillingCoupons.pending, (state) => {
			state.billingCoupons.loading = true;
			state.billingCoupons.error = null;
		});
		builder.addCase(fetchBillingCoupons.fulfilled, (state, action) => {
			state.billingCoupons.data = action.payload;
			state.billingCoupons.loading = false;
			state.billingCoupons.error = null;
			state.billingCoupons.lastLoadedAt = new Date().toLocaleTimeString();
		});
		builder.addCase(fetchBillingCoupons.rejected, (state, action) => {
			state.billingCoupons.loading = false;
			state.billingCoupons.error =
				action.error.message || 'Failed to load billing coupons.';
		});
	},
});

export const {
	setAuditLogsLoading,
	setAuditLogsData,
	setAuditLogsError,
	setAuditLogsFilters,
	clearAuditLogs,
	setUsersLoading,
	setUsersData,
	setUsersError,
	setUsersFilters,
	clearUsers,
	setBillingCouponsLoading,
	setBillingCouponsData,
	setBillingCouponsError,
	addBillingCoupon,
	clearBillingCoupons,
} = adminPortalSlice.actions;

export default adminPortalSlice.reducer;
