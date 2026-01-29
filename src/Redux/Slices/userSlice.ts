import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// User type matching Firebase Auth + Firestore user data
export interface User {
	id: string;
	email: string;
	role: string;
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
			state.currentUser = action.payload;
			state.authLoading = false;

			// Save to localStorage
			if (action.payload) {
				localStorage.setItem('loggedUser', JSON.stringify(action.payload));
			} else {
				localStorage.removeItem('loggedUser');
			}
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
