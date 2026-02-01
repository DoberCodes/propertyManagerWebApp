import navigationReducer, {
	setTabSelection,
	toggleSidebar,
	setSidebarOpen,
} from './navigationSlice';

describe('navigationSlice', () => {
	const initialState = {
		tabSelection: 0,
		sidebarOpen: true,
	};

	describe('reducers', () => {
		it('should return initial state', () => {
			expect(navigationReducer(undefined, { type: 'unknown' })).toEqual(
				initialState,
			);
		});

		describe('setTabSelection', () => {
			it('should set tab selection to provided index', () => {
				const actual = navigationReducer(initialState, setTabSelection(2));

				expect(actual.tabSelection).toBe(2);
			});

			it('should update tab selection from previous value', () => {
				const stateWithTab = { ...initialState, tabSelection: 1 };
				const actual = navigationReducer(stateWithTab, setTabSelection(3));

				expect(actual.tabSelection).toBe(3);
			});

			it('should handle tab selection of 0', () => {
				const stateWithTab = { ...initialState, tabSelection: 5 };
				const actual = navigationReducer(stateWithTab, setTabSelection(0));

				expect(actual.tabSelection).toBe(0);
			});

			it('should handle large tab indices', () => {
				const actual = navigationReducer(initialState, setTabSelection(100));

				expect(actual.tabSelection).toBe(100);
			});
		});

		describe('toggleSidebar', () => {
			it('should toggle sidebar from true to false', () => {
				const actual = navigationReducer(initialState, toggleSidebar());

				expect(actual.sidebarOpen).toBe(false);
			});

			it('should toggle sidebar from false to true', () => {
				const stateWithClosedSidebar = { ...initialState, sidebarOpen: false };
				const actual = navigationReducer(
					stateWithClosedSidebar,
					toggleSidebar(),
				);

				expect(actual.sidebarOpen).toBe(true);
			});

			it('should toggle sidebar multiple times', () => {
				let state = initialState;

				state = navigationReducer(state, toggleSidebar());
				expect(state.sidebarOpen).toBe(false);

				state = navigationReducer(state, toggleSidebar());
				expect(state.sidebarOpen).toBe(true);

				state = navigationReducer(state, toggleSidebar());
				expect(state.sidebarOpen).toBe(false);
			});
		});

		describe('setSidebarOpen', () => {
			it('should set sidebar to open', () => {
				const stateWithClosedSidebar = { ...initialState, sidebarOpen: false };
				const actual = navigationReducer(
					stateWithClosedSidebar,
					setSidebarOpen(true),
				);

				expect(actual.sidebarOpen).toBe(true);
			});

			it('should set sidebar to closed', () => {
				const actual = navigationReducer(initialState, setSidebarOpen(false));

				expect(actual.sidebarOpen).toBe(false);
			});

			it('should maintain sidebar state when set to same value', () => {
				const actual = navigationReducer(initialState, setSidebarOpen(true));

				expect(actual.sidebarOpen).toBe(true);
			});
		});

		describe('combined actions', () => {
			it('should handle tab selection and sidebar changes together', () => {
				let state = initialState;

				state = navigationReducer(state, setTabSelection(2));
				expect(state.tabSelection).toBe(2);
				expect(state.sidebarOpen).toBe(true);

				state = navigationReducer(state, toggleSidebar());
				expect(state.tabSelection).toBe(2);
				expect(state.sidebarOpen).toBe(false);

				state = navigationReducer(state, setTabSelection(0));
				expect(state.tabSelection).toBe(0);
				expect(state.sidebarOpen).toBe(false);
			});

			it('should not affect other state properties when updating one', () => {
				const state = { tabSelection: 5, sidebarOpen: false };

				const afterTab = navigationReducer(state, setTabSelection(7));
				expect(afterTab.sidebarOpen).toBe(false);

				const afterSidebar = navigationReducer(state, setSidebarOpen(true));
				expect(afterSidebar.tabSelection).toBe(5);
			});
		});
	});
});
