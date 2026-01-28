import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MaintenanceRequestItem {
	id: string;
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Urgent';
	category: string;
	status:
		| 'Pending'
		| 'Under Review'
		| 'Approved'
		| 'Converted to Task'
		| 'Rejected';
	propertyId: string;
	propertyTitle: string;
	submittedBy: string; // User ID
	submittedByName: string;
	submittedAt: string;
	unit?: string; // Apartment/unit number for multi-unit properties
	suite?: string; // Suite identifier for commercial properties
	reviewedBy?: string; // User ID
	reviewedAt?: string;
	convertedToTaskId?: string;
	files?: Array<{ name: string; url: string; size: number }>;
	notes?: string;
}

export interface MaintenanceRequestsState {
	requests: MaintenanceRequestItem[];
	notifications: number; // Count of unread requests
}

const initialState: MaintenanceRequestsState = {
	requests: [],
	notifications: 0,
};

export const maintenanceRequestsSlice = createSlice({
	name: 'maintenanceRequests',
	initialState,
	reducers: {
		addMaintenanceRequest: (
			state,
			action: PayloadAction<MaintenanceRequestItem>,
		) => {
			state.requests.push(action.payload);
			state.notifications += 1;
		},
		updateRequestStatus: (
			state,
			action: PayloadAction<{
				id: string;
				status: MaintenanceRequestItem['status'];
				reviewedBy?: string;
				reviewedAt?: string;
			}>,
		) => {
			const request = state.requests.find((r) => r.id === action.payload.id);
			if (request) {
				request.status = action.payload.status;
				request.reviewedBy = action.payload.reviewedBy;
				request.reviewedAt = action.payload.reviewedAt;
			}
		},
		convertRequestToTask: (
			state,
			action: PayloadAction<{ requestId: string; taskId: string }>,
		) => {
			const request = state.requests.find(
				(r) => r.id === action.payload.requestId,
			);
			if (request) {
				request.status = 'Converted to Task';
				request.convertedToTaskId = action.payload.taskId;
			}
		},
		markRequestAsReviewed: (
			state,
			action: PayloadAction<{ id: string; reviewedBy: string }>,
		) => {
			const request = state.requests.find((r) => r.id === action.payload.id);
			if (request && request.status === 'Pending') {
				request.status = 'Under Review';
				request.reviewedBy = action.payload.reviewedBy;
				request.reviewedAt = new Date().toISOString();
			}
		},
		clearNotifications: (state) => {
			state.notifications = 0;
		},
		deleteMaintenanceRequest: (state, action: PayloadAction<string>) => {
			state.requests = state.requests.filter((r) => r.id !== action.payload);
		},
	},
});

export const {
	addMaintenanceRequest,
	updateRequestStatus,
	convertRequestToTask,
	markRequestAsReviewed,
	clearNotifications,
	deleteMaintenanceRequest,
} = maintenanceRequestsSlice.actions;

export default maintenanceRequestsSlice.reducer;
