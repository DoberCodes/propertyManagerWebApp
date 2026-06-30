import { apiSlice } from '../API/apiSlice';
import { resetMaintenanceRequests } from '../Slices/maintenanceRequestsSlice';
import { resetPropertyData } from '../Slices/propertyDataSlice';
import { resetTeamData } from '../Slices/teamSlice';
import type { AppDispatch } from '../store/store';

export const clearAccountScopedClientState = (dispatch: AppDispatch) => {
	dispatch(apiSlice.util.resetApiState());
	dispatch(resetPropertyData());
	dispatch(resetTeamData());
	dispatch(resetMaintenanceRequests());
};
