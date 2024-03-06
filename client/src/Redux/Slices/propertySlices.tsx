import { createSlice } from '@reduxjs/toolkit';

export interface homeState {}

export const propertySlice = createSlice({
	name: 'property',
	initialState: {
		id: '',
		UserId: '',
		HouseholdName: '',
		AllTasks: [],
	},
	reducers: {
		setProperty: (state, action) => {
			state.HouseholdName = action.payload.HouseholdName;
			state.UserId = action.payload.UserId;
			state.id = action.payload._id;
		},
		setAllTasks: (state, action) => {
			state.AllTasks = action.payload;
		},
	},
});

export const { setProperty, setAllTasks } = propertySlice.actions;

export default propertySlice.reducer;
