import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../Slices/userSlice';
import navigationReducer from '../Slices/navigationSlice';
import propertyDataReducer from '../Slices/propertyDataSlice';
import teamReducer from '../Slices/teamSlice';
import adminPortalReducer from '../Slices/adminPortalSlice';
import maintenanceRequestsReducer from '../Slices/maintenanceRequestsSlice';
import { apiSlice } from '../API/apiSlice';
import '../API/deviceSlice';
import '../API/contractorSlice';
import '../API/propertySlice';
import '../API/userSlice';
import '../API/tenantSlice';
import '../API/teamSlice';
import '../API/notificationSlice';
import '../API/maintenanceSlice';
import '../API/unitSlice';
import '../API/propertyIntelligenceSlice';
import notificationMiddleware from '../middleware/notificationMiddleware';
import appSlice from '../Slices/appSlice';

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
