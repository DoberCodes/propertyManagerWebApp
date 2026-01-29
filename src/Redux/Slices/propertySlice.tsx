import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query';

export interface homeState {}

type HomeResponse = homeState[];

export const propertyApi = createApi({
	baseQuery: fetchBaseQuery({ baseUrl: '/' }),
	tagTypes: ['Properties'],
	endpoints: (build) => ({
		getProperties: build.query<HomeResponse, void>({
			query: () => 'properties',
			providesTags: (result: any) =>
				result ? result.map(({ id }) => ({ type: 'Properties', id })) : [],
		}),
	}),
});

// export const propertySlice = createSlice({
// 	name: 'property',
// 	initialState: {
// 		id: '',
// 		UserId: '',
// 		HouseholdName: '',
// 		AllTasks: [],
// 	},
// 	reducers: {
// 		setProperty: (state, action) => {
// 			state.HouseholdName = action.payload.HouseholdName;
// 			state.UserId = action.payload.UserId;
// 			state.id = action.payload._id;
// 		},
// 		setAllTasks: (state, action) => {
// 			state.AllTasks = action.payload;
// 		},
// 	},
// });

// export const { setProperty, setAllTasks } = propertySlice.actions;

// export default propertySlice.reducer;
