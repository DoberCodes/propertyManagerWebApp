import { createSlice } from '@reduxjs/toolkit';

export const navigationSlice = createSlice({
	name: 'navigation',
	initialState: {
		tabSelection: 0,
	},
	reducers: {
		setTabSelection: (state, action) => {
			state.tabSelection = action.payload;
		},
	},
});

export const { setTabSelection } = navigationSlice.actions;

export default navigationSlice.reducer;
