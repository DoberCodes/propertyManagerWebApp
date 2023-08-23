import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
	name: 'user',
	initialState: {
		cred: {
			UID: '',
			householdName: '',
			email: '',
			firstName: '',
			lastName: '',
		},
	},
	reducers: {
		setUser: (state, action) => {
			state.cred = action.payload;
		},
	},
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;
