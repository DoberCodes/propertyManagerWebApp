import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User as FirebaseUser,
	updateProfile,
	sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../Redux/Slices/userSlice';
import { USER_ROLES } from '../constants/roles';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
	email: string,
	password: string,
): Promise<User> => {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password,
		);
		const user = await getUserProfile(userCredential.user.uid);
		return user;
	} catch (error: any) {
		console.error('Sign in error:', error);
		throw new Error(getAuthErrorMessage(error.code));
	}
};

/**
 * Create new user account
 */
export const signUpWithEmail = async (
	email: string,
	password: string,
	firstName: string,
	lastName: string,
	role: string = USER_ROLES.ADMIN,
): Promise<User> => {
	try {
		// Create Firebase Auth user
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password,
		);

		// Update display name in Firebase Auth
		await updateProfile(userCredential.user, {
			displayName: `${firstName} ${lastName}`,
		});

		// Create user profile in Firestore
		const userProfile: User = {
			id: userCredential.user.uid,
			firstName,
			lastName,
			email,
			role: role as any,
			title: getRoleTitleFromRole(role),
			image: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=22c55e&color=fff`,
		};

		await setDoc(doc(db, 'users', userCredential.user.uid), {
			...userProfile,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		// Create default property group
		await setDoc(
			doc(db, 'propertyGroups', `${userCredential.user.uid}_default`),
			{
				userId: userCredential.user.uid,
				name: 'My Properties',
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			},
		);

		// Create default team group
		await setDoc(doc(db, 'teamGroups', `${userCredential.user.uid}_default`), {
			userId: userCredential.user.uid,
			name: 'My Team',
			linkedProperties: [],
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		return userProfile;
	} catch (error: any) {
		console.error('Sign up error:', error);
		throw new Error(getAuthErrorMessage(error.code));
	}
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
	try {
		await signOut(auth);
		localStorage.removeItem('loggedUser');
	} catch (error: any) {
		console.error('Sign out error:', error);
		throw new Error('Failed to sign out');
	}
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<User> => {
	try {
		const userDoc = await getDoc(doc(db, 'users', uid));

		if (!userDoc.exists()) {
			throw new Error('User profile not found');
		}

		// Convert Firestore Timestamps to ISO strings for Redux serialization
		const rawData: any = userDoc.data();
		const serializedData: any = { ...rawData, id: uid };
		if (
			rawData.createdAt &&
			typeof rawData.createdAt === 'object' &&
			'toDate' in rawData.createdAt
		) {
			serializedData.createdAt = rawData.createdAt.toDate().toISOString();
		}
		if (
			rawData.updatedAt &&
			typeof rawData.updatedAt === 'object' &&
			'toDate' in rawData.updatedAt
		) {
			serializedData.updatedAt = rawData.updatedAt.toDate().toISOString();
		}

		return serializedData as User;
	} catch (error: any) {
		console.error('Get user profile error:', error);
		throw new Error('Failed to load user profile');
	}
};

/**
 * Listen to authentication state changes
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

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
	try {
		await sendPasswordResetEmail(auth, email);
	} catch (error: any) {
		console.error('Password reset error:', error);
		throw new Error(getAuthErrorMessage(error.code));
	}
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
	switch (errorCode) {
		case 'auth/user-not-found':
			return 'No account found with this email address';
		case 'auth/wrong-password':
			return 'Incorrect password';
		case 'auth/invalid-email':
			return 'Invalid email address';
		case 'auth/user-disabled':
			return 'This account has been disabled';
		case 'auth/email-already-in-use':
			return 'An account already exists with this email';
		case 'auth/weak-password':
			return 'Password should be at least 6 characters';
		case 'auth/too-many-requests':
			return 'Too many failed attempts. Please try again later';
		case 'auth/network-request-failed':
			return 'Network error. Please check your connection';
		case 'auth/invalid-credential':
			return 'Invalid email or password';
		default:
			return 'Authentication failed. Please try again';
	}
};

/**
 * Get role title from role constant
 */
const getRoleTitleFromRole = (role: string): string => {
	const roleTitles: { [key: string]: string } = {
		[USER_ROLES.ADMIN]: 'Administrator',
		[USER_ROLES.PROPERTY_MANAGER]: 'Property Manager',
		[USER_ROLES.ASSISTANT_MANAGER]: 'Assistant Manager',
		[USER_ROLES.MAINTENANCE_LEAD]: 'Maintenance Lead',
		[USER_ROLES.MAINTENANCE]: 'Maintenance Technician',
		[USER_ROLES.CONTRACTOR]: 'Contractor',
		[USER_ROLES.TENANT]: 'Tenant',
	};
	return roleTitles[role] || 'User';
};
