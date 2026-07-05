import { apiSlice } from '../API/apiSlice';
import { resetMaintenanceRequests } from '../Slices/maintenanceRequestsSlice';
import { resetPropertyData } from '../Slices/propertyDataSlice';
import { resetTeamData } from '../Slices/teamSlice';
import { clearAccountScopedClientState } from './clearAccountScopedClientState';
import { clearUserLocalStorage } from '../../utils/localStorageCleanup';

jest.mock('../../utils/localStorageCleanup', () => ({
	clearUserLocalStorage: jest.fn(),
}));

describe('clearAccountScopedClientState', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('clears cached API data and account-scoped redux slices', () => {
		const dispatch = jest.fn();

		clearAccountScopedClientState(dispatch as any);

		expect(dispatch).toHaveBeenCalledTimes(4);
		expect(dispatch).toHaveBeenNthCalledWith(1, apiSlice.util.resetApiState());
		expect(dispatch).toHaveBeenNthCalledWith(2, resetPropertyData());
		expect(dispatch).toHaveBeenNthCalledWith(3, resetTeamData());
		expect(dispatch).toHaveBeenNthCalledWith(4, resetMaintenanceRequests());
		expect(clearUserLocalStorage).not.toHaveBeenCalled();
	});

	it('can also clear previous user local storage during auth transitions', () => {
		const dispatch = jest.fn();

		clearAccountScopedClientState(dispatch as any, {
			userId: 'previous-user',
			clearLocalStorage: true,
		});

		expect(clearUserLocalStorage).toHaveBeenCalledWith('previous-user');
	});
});
