import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../Slices/userSlice';
import propertyReducer from '../Slices/propertySlices';

export const store = configureStore({
	reducer: {
		user: userReducer,
		property: propertyReducer,
	},
	middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
