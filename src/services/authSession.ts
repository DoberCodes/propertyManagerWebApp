import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../Redux/Slices/userSlice';
import { getUserProfile } from './userProfileService';

/**
 * Listen to authentication state changes for app startup.
 *
 * This module intentionally stays smaller than authService so the initial app
 * shell does not import registration, billing, legal, and team-management flows.
 */
export const onAuthStateChange = (
	callback: (user: User | null) => void,
): (() => void) => {
	return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
		if (firebaseUser) {
			try {
				const userProfile = await getUserProfile(firebaseUser.uid);
				callback(userProfile);
			} catch (error) {
				console.error('Error loading user profile:', error);
				callback(null);
			}
		} else {
			callback(null);
		}
	});
};
