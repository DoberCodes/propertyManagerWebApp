import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
	name: 'user',
	initialState: {
		cred: {
			UserId: '',
			UserName: '',
		},
		Profile: {
			HouseHoldName: '',
			email: '',
		},
	},
	reducers: {
		setUserCred: (state, action) => {
			state.cred = action.payload;
		},
	},
});

export const { setUserCred } = userSlice.actions;

export default userSlice.reducer;
