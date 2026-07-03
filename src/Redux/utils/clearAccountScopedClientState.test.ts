import { apiSlice } from '../API/apiSlice';
import { resetMaintenanceRequests } from '../Slices/maintenanceRequestsSlice';
import { resetPropertyData } from '../Slices/propertyDataSlice';
import { resetTeamData } from '../Slices/teamSlice';
import { clearAccountScopedClientState } from './clearAccountScopedClientState';

describe('clearAccountScopedClientState', () => {
	it('clears cached API data and account-scoped redux slices', () => {
		const dispatch = jest.fn();

		clearAccountScopedClientState(dispatch as any);

		expect(dispatch).toHaveBeenCalledTimes(4);
		expect(dispatch).toHaveBeenNthCalledWith(1, apiSlice.util.resetApiState());
		expect(dispatch).toHaveBeenNthCalledWith(2, resetPropertyData());
		expect(dispatch).toHaveBeenNthCalledWith(3, resetTeamData());
		expect(dispatch).toHaveBeenNthCalledWith(4, resetMaintenanceRequests());
	});
});
