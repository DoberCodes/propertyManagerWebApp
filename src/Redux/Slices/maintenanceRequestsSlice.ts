import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MaintenanceRequestItem {
	id: string;
	propertyId: string;
	propertyTitle: string;
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Emergency' | 'Urgent';
	status:
		| 'Pending'
		| 'In Progress'
		| 'Completed'
		| 'Cancelled'
		| 'Converted to Task';
	requestedBy: string;
	requestedByEmail: string;
	requestedDate: string;
	assignedTo?: string;
	completedDate?: string;
	notes?: string;
	images?: string[];
	// Additional fields used in the app
	submittedBy?: string;
	submittedByName?: string;
	submittedAt?: string;
	unit?: string;
	suite?: string;
	category?: string;
	files?: Array<{ name: string; url: string; size: number; type: string }>;
	convertedToTaskId?: string;
}

interface MaintenanceRequestsState {
	requests: MaintenanceRequestItem[];
}

const initialState: MaintenanceRequestsState = {
	requests: [],
};

const maintenanceRequestsSlice = createSlice({
	name: 'maintenanceRequests',
	initialState,
	reducers: {
		addMaintenanceRequest: (
			state,
			action: PayloadAction<MaintenanceRequestItem>,
		) => {
			state.requests.push(action.payload);
		},
		updateMaintenanceRequest: (
			state,
			action: PayloadAction<MaintenanceRequestItem>,
		) => {
			const index = state.requests.findIndex((r) => r.id === action.payload.id);
			if (index !== -1) {
				state.requests[index] = action.payload;
			}
		},
		deleteMaintenanceRequest: (state, action: PayloadAction<string>) => {
			state.requests = state.requests.filter((r) => r.id !== action.payload);
		},
		convertRequestToTask: (state, action: PayloadAction<string>) => {
			// Mark request as converted (or remove it)
			const request = state.requests.find((r) => r.id === action.payload);
			if (request) {
				request.status = 'Completed';
			}
		},
		setMaintenanceRequests: (
			state,
			action: PayloadAction<MaintenanceRequestItem[]>,
		) => {
			state.requests = action.payload;
		},
	},
});

export const {
	addMaintenanceRequest,
	updateMaintenanceRequest,
	deleteMaintenanceRequest,
	convertRequestToTask,
	setMaintenanceRequests,
} = maintenanceRequestsSlice.actions;

export default maintenanceRequestsSlice.reducer;
