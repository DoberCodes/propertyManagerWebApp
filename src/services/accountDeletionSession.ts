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

let accountDeletionSessionActive = false;

export const beginAccountDeletionSession = () => {
	accountDeletionSessionActive = true;
};

export const endAccountDeletionSession = () => {
	accountDeletionSessionActive = false;
};

export const isAccountDeletionSessionActive = () => accountDeletionSessionActive;

export const finalizeDeletedAccountSession = async ({
	userId,
	dispatch,
	navigate,
	notify,
	signOutCurrentUser = () => signOut(auth),
}: FinalizeDeletedAccountSessionArgs) => {
	// Leave the protected route before clearing the authenticated Redux user.
	// Otherwise ProtectedRoutes can win the render race and redirect the deleted
	// account to /login before the intended public landing navigation is applied.
	navigate('/', { replace: true });
	clearAccountScopedClientState(dispatch, {
		userId,
		clearLocalStorage: true,
	});
	dispatch(logout());
	notify('Your Maintley account has been deleted.', 'success');

	try {
		await signOutCurrentUser();
	} catch (error) {
		// The trusted deletion Function has already removed the account. A local
		// sign-out failure must not leave the app waiting for an auth callback that
		// may never arrive.
		console.warn('Deleted account could not complete Firebase sign-out:', error);
	} finally {
		endAccountDeletionSession();
	}
};
