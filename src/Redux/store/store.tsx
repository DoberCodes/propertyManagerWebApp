import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../Slices/userSlice';
import navigationReducer from '../Slices/navigationSlice';
import propertyDataReducer from '../Slices/propertyDataSlice';
import teamReducer from '../Slices/teamSlice';
import adminPortalReducer from '../Slices/adminPortalSlice';
import maintenanceRequestsReducer from '../Slices/maintenanceRequestsSlice';
import { apiSlice } from '../API/apiSlice';
import notificationMiddleware from '../middleware/notificationMiddleware';
import appSlice from '../Slices/appSlice';

// Route-specific RTK Query endpoint modules are imported by the components that use
// their hooks so they can stay in route chunks instead of the startup bundle.
export const store = configureStore({
	reducer: {
		user: userReducer,
		app: appSlice,
		[apiSlice.reducerPath]: apiSlice.reducer,
		navigation: navigationReducer,
		propertyData: propertyDataReducer,
		team: teamReducer,
		adminPortal: adminPortalReducer,
		maintenanceRequests: maintenanceRequestsReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(apiSlice.middleware, notificationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
