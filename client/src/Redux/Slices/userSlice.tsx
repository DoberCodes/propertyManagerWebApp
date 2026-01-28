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

// Mock users for testing different roles
// Password for each user is their role value (e.g., 'admin', 'property_manager')
export const MOCK_USERS: User[] = [
	{
		id: 'user-admin-1',
		firstName: 'Admin',
		lastName: 'User',
		email: 'admin@test.com',
		role: USER_ROLES.ADMIN,
		title: 'System Administrator',
		image: 'https://via.placeholder.com/120?text=AU',
	},
	{
		id: 'user-pm-1',
		firstName: 'John',
		lastName: 'Smith',
		email: 'john@test.com',
		role: USER_ROLES.PROPERTY_MANAGER,
		title: 'Senior Property Manager',
		image: 'https://via.placeholder.com/120?text=JS',
	},
	{
		id: 'user-am-1',
		firstName: 'Sarah',
		lastName: 'Johnson',
		email: 'sarah@test.com',
		role: USER_ROLES.ASSISTANT_MANAGER,
		title: 'Assistant Manager',
		image: 'https://via.placeholder.com/120?text=SJ',
	},
	{
		id: 'user-ml-1',
		firstName: 'Mike',
		lastName: 'Rodriguez',
		email: 'mike@test.com',
		role: USER_ROLES.MAINTENANCE_LEAD,
		title: 'Maintenance Lead',
		image: 'https://via.placeholder.com/120?text=MR',
	},
	{
		id: 'user-mt-1',
		firstName: 'Chris',
		lastName: 'Thompson',
		email: 'chris@test.com',
		role: USER_ROLES.MAINTENANCE,
		title: 'Maintenance Technician',
		image: 'https://via.placeholder.com/120?text=CT',
	},
	{
		id: 'user-contractor-1',
		firstName: 'David',
		lastName: 'Lee',
		email: 'david@test.com',
		role: USER_ROLES.CONTRACTOR,
		title: 'Independent Contractor',
		image: 'https://via.placeholder.com/120?text=DL',
	},
	{
		id: 'user-tenant-1',
		firstName: 'Emily',
		lastName: 'Brown',
		email: 'emily@test.com',
		role: USER_ROLES.TENANT,
		title: 'Tenant',
		image: 'https://via.placeholder.com/120?text=EB',
		assignedPropertyId: 1, // Downtown Apartments
	},
];

// Helper function for mock authentication
export const authenticateMockUser = (
	email: string,
	password: string,
): User | null => {
	const user = MOCK_USERS.find((u) => u.email === email);
	if (user && password === user.role) {
		return user;
	}
	return null;
};

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
		switchMockUser: (state, action: PayloadAction<string>) => {
			const user = MOCK_USERS.find((u) => u.id === action.payload);
			if (user) {
				state.currentUser = user;
				state.isAuthenticated = true;

				// Update legacy fields
				state.cred = {
					UserId: user.id,
					UserName: `${user.firstName} ${user.lastName}`,
				};
				state.Profile = {
					HouseHoldName: `${user.firstName} ${user.lastName}`,
					email: user.email,
				};
			}
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
	switchMockUser,
	logout,
	updateUserProfile,
	setUserCred,
} = userSlice.actions;

export default userSlice.reducer;
