import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from '../API/apiSlice';

// User type matching Firebase Auth + Firestore user data
export interface User {
	id: string;
	email: string;
	role: string;
	userType?: string; // homeowner, landlord, etc.
	firstName?: string;
	lastName?: string;
	title?: string;
	phone?: string;
	image?: string;
	assignedPropertyId?: number;
	createdAt?: string;
	updatedAt?: string;
}

interface UserState {
	currentUser: User | null;
	cred: any; // Legacy credential object
	authLoading: boolean;
}

const initialState: UserState = {
	currentUser: null,
	cred: null,
	authLoading: true,
};

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setCurrentUser: (state, action: PayloadAction<User | null>) => {
			if (action.payload) {
				// Ensure userType is set if role is homeowner or landlord
				const userWithType = {
					...action.payload,
					userType: action.payload.userType || action.payload.role,
				};
				state.currentUser = userWithType;
				localStorage.setItem('loggedUser', JSON.stringify(userWithType));
			} else {
				state.currentUser = null;
				localStorage.removeItem('loggedUser');
			}
			state.authLoading = false;
		},
		setUserCred: (state, action: PayloadAction<any>) => {
			state.cred = action.payload;
		},
		setAuthLoading: (state, action: PayloadAction<boolean>) => {
			state.authLoading = action.payload;
		},
		logout: (state) => {
			state.currentUser = null;
			state.cred = null;
			state.authLoading = false;
			localStorage.removeItem('loggedUser');
		},
	},
});

export const { setCurrentUser, setUserCred, setAuthLoading, logout } =
	userSlice.actions;
export default userSlice.reducer;
