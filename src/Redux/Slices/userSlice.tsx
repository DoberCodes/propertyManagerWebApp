import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { USER_ROLES, UserRole } from '../../constants/roles';

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: UserRole;
	title: string;
	image?: string;
	assignedPropertyId?: number; // For tenants - restricts access to specific property
}

export interface UserState {
	currentUser: User | null;
	isAuthenticated: boolean;
	authLoading: boolean; // Track if auth state is being initialized
	// Legacy fields for backward compatibility
	cred: {
		UserId: string;
		UserName: string;
	};
	Profile: {
		HouseHoldName: string;
		email: string;
	};
}

const initialState: UserState = {
	currentUser: null, // No user logged in by default
	isAuthenticated: false,
	authLoading: true, // Start with true to prevent premature redirects
	cred: {
		UserId: '',
		UserName: '',
	},
	Profile: {
		HouseHoldName: '',
		email: '',
	},
};

export const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setCurrentUser: (state, action: PayloadAction<User | null>) => {
			state.currentUser = action.payload;
			state.isAuthenticated = action.payload !== null;

			// Update legacy fields
			if (action.payload) {
				state.cred = {
					UserId: action.payload.id,
					UserName: `${action.payload.firstName} ${action.payload.lastName}`,
				};
				state.Profile = {
					HouseHoldName: `${action.payload.firstName} ${action.payload.lastName}`,
					email: action.payload.email,
				};
			} else {
				state.cred = { UserId: '', UserName: '' };
				state.Profile = { HouseHoldName: '', email: '' };
			}
		},
		setAuthLoading: (state, action: PayloadAction<boolean>) => {
			state.authLoading = action.payload;
		},
		logout: (state) => {
			state.currentUser = null;
			state.isAuthenticated = false;
			state.cred = { UserId: '', UserName: '' };
			state.Profile = { HouseHoldName: '', email: '' };
		},
		updateUserProfile: (
			state,
			action: PayloadAction<Partial<Omit<User, 'id' | 'role'>>>,
		) => {
			if (state.currentUser) {
				state.currentUser = { ...state.currentUser, ...action.payload };
			}
		},
		// Legacy action for backward compatibility
		setUserCred: (state, action) => {
			state.cred = action.payload;
		},
	},
});

export const {
	setCurrentUser,
	setAuthLoading,
	logout,
	updateUserProfile,
	setUserCred,
} = userSlice.actions;

export default userSlice.reducer;
