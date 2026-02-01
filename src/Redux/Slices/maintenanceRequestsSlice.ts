import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MaintenanceRequestItem } from '../../types/MaintenanceRequest.types';

// Re-export types for backward compatibility
export type { MaintenanceRequestItem } from '../../types/MaintenanceRequest.types';

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
