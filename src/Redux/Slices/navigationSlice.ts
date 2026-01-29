import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
	tabSelection: number;
	sidebarOpen: boolean;
}

const initialState: NavigationState = {
	tabSelection: 0,
	sidebarOpen: true,
};

const navigationSlice = createSlice({
	name: 'navigation',
	initialState,
	reducers: {
		setTabSelection: (state, action: PayloadAction<number>) => {
			state.tabSelection = action.payload;
		},
		toggleSidebar: (state) => {
			state.sidebarOpen = !state.sidebarOpen;
		},
		setSidebarOpen: (state, action: PayloadAction<boolean>) => {
			state.sidebarOpen = action.payload;
		},
	},
});

export const { setTabSelection, toggleSidebar, setSidebarOpen } =
	navigationSlice.actions;

export default navigationSlice.reducer;
