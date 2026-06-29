import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppLoadingState {
	isLoading: boolean;
	title?: string;
	message?: string;
	steps?: string[];
	activeRequests: Record<
		string,
		{
			title?: string;
			message?: string;
			steps?: string[];
		}
	>;
}

interface AppState {
	isMobile: boolean;
	activeTab: string;
	loading: AppLoadingState;
}

const initialState: AppState = {
	isMobile: false,
	activeTab: 'details', // Added for tab persistence
	loading: {
		isLoading: false,
		title: undefined,
		message: undefined,
		steps: undefined,
		activeRequests: {},
	},
};

const resolveLoadingState = (
	activeRequests: AppLoadingState['activeRequests'],
): AppLoadingState => {
	const requests = Object.values(activeRequests);
	const latestRequest = requests[requests.length - 1];

	return {
		isLoading: Boolean(latestRequest),
		title: latestRequest?.title,
		message: latestRequest?.message,
		steps: latestRequest?.steps,
		activeRequests,
	};
};

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		setIsMobile: (state, action) => {
			state.isMobile = action.payload;
		},
		setActiveTab: (state, action) => {
			state.activeTab = action.payload; // Action to set the active tab
		},
		resetActiveTab: (state) => {
			state.activeTab = 'details'; // Action to reset the active tab
		},
		showAppLoading: (
			state,
			action: PayloadAction<
				| {
						key?: string;
						title?: string;
						message?: string;
						steps?: string[];
				  }
				| undefined
			>,
		) => {
			const key = action.payload?.key || 'global';
			const activeRequests = {
				...state.loading.activeRequests,
				[key]: {
					title: action.payload?.title,
					message: action.payload?.message,
					steps: action.payload?.steps,
				},
			};
			state.loading = resolveLoadingState(activeRequests);
		},
		hideAppLoading: (state, action: PayloadAction<string | undefined>) => {
			const key = action.payload || 'global';
			const { [key]: _removed, ...activeRequests } =
				state.loading.activeRequests;
			state.loading = resolveLoadingState(activeRequests);
		},
	},
});

export const {
	setIsMobile,
	setActiveTab,
	resetActiveTab,
	showAppLoading,
	hideAppLoading,
} = appSlice.actions;

export default appSlice.reducer;
