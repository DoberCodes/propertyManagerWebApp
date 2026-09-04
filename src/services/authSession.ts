import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../Redux/Slices/userSlice';
import { getUserProfile } from './userProfileService';
import { reconcileCurrentUserEmailVerification } from './emailVerificationService';

type AuthStateChangeOptions = {
	onAuthUserResolving?: (userId: string | null) => void;
};

/**
 * Listen to authentication state changes for app startup.
 *
 * This module intentionally stays smaller than authService so the initial app
 * shell does not import registration, billing, legal, and team-management flows.
 */
export const onAuthStateChange = (
	callback: (user: User | null) => void | Promise<void>,
	options: AuthStateChangeOptions = {},
): (() => void) => {
	return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
		options.onAuthUserResolving?.(firebaseUser?.uid || null);

		if (firebaseUser) {
			try {
				const userProfile = await getUserProfile(firebaseUser.uid);
				const resolvedUser = await reconcileCurrentUserEmailVerification(userProfile);
				await callback(resolvedUser);
			} catch (error) {
				console.error('Error loading user profile:', error);
				await callback(null);
			}
		} else {
			await callback(null);
		}
	});
};
