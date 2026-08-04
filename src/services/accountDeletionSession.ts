import type { NavigateFunction } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { logout } from '../Redux/Slices/userSlice';
import type { AppDispatch } from '../Redux/store/store';
import { clearAccountScopedClientState } from '../Redux/utils/clearAccountScopedClientState';

type FinalizeDeletedAccountSessionArgs = {
	userId: string;
	dispatch: AppDispatch;
	navigate: NavigateFunction;
	notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
	signOutCurrentUser?: () => Promise<void>;
};

export const finalizeDeletedAccountSession = async ({
	userId,
	dispatch,
	navigate,
	notify,
	signOutCurrentUser = () => signOut(auth),
}: FinalizeDeletedAccountSessionArgs) => {
	try {
		await signOutCurrentUser();
	} catch (error) {
		// The trusted deletion Function has already removed the account. A local
		// sign-out failure must not leave the app waiting for an auth callback that
		// may never arrive.
		console.warn('Deleted account could not complete Firebase sign-out:', error);
	}

	clearAccountScopedClientState(dispatch, {
		userId,
		clearLocalStorage: true,
	});
	dispatch(logout());
	notify('Your Maintley account has been deleted.', 'success');
	navigate('/', { replace: true });
};
