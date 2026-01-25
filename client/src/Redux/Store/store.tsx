import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../Slices/userSlice';
import navigationReducer from '../Slices/Nav/navigationSlice';
import { propertyApi } from '../Slices/propertySlice';

export const store = configureStore({
	reducer: {
		user: userReducer,
		[propertyApi.reducerPath]: propertyApi.reducer,
		navigation: navigationReducer,
	},
	middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
