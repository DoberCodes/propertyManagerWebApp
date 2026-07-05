import { apiSlice } from '../API/apiSlice';
import { resetMaintenanceRequests } from '../Slices/maintenanceRequestsSlice';
import { resetPropertyData } from '../Slices/propertyDataSlice';
import { resetTeamData } from '../Slices/teamSlice';
import type { AppDispatch } from '../store/store';
import { clearUserLocalStorage } from '../../utils/localStorageCleanup';

type ClearAccountScopedClientStateOptions = {
	userId?: string | number | null;
	clearLocalStorage?: boolean;
};

export const clearAccountScopedClientState = (
	dispatch: AppDispatch,
	options: ClearAccountScopedClientStateOptions = {},
) => {
	dispatch(apiSlice.util.resetApiState());
	dispatch(resetPropertyData());
	dispatch(resetTeamData());
	dispatch(resetMaintenanceRequests());

	if (options.clearLocalStorage) {
		clearUserLocalStorage(options.userId ?? undefined);
	}
};
