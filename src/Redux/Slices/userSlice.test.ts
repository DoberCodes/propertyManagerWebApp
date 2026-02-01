import userReducer, {
	setCurrentUser,
	setUserCred,
	setAuthLoading,
	logout,
	UserState,
} from './userSlice';

describe('userSlice', () => {
	const initialState: UserState = {
		currentUser: null,
		cred: null,
		authLoading: true,
	};

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		role: 'owner',
		firstName: 'Test',
		lastName: 'User',
	};

	// Mock localStorage
	const localStorageMock = (() => {
		let store: Record<string, string> = {};

		return {
			getItem: (key: string) => store[key] || null,
			setItem: (key: string, value: string) => {
				store[key] = value.toString();
			},
			removeItem: (key: string) => {
				delete store[key];
			},
			clear: () => {
				store = {};
			},
		};
	})();

	beforeEach(() => {
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
			writable: true,
		});
		localStorageMock.clear();
	});

	describe('reducers', () => {
		it('should return initial state', () => {
			expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
		});

		it('should handle setCurrentUser with user data', () => {
			const actual = userReducer(initialState, setCurrentUser(mockUser as any));

			expect(actual.currentUser).toMatchObject(mockUser);
			expect(actual.currentUser?.userType).toBe('owner');
			expect(actual.authLoading).toBe(false);
			expect(localStorageMock.getItem('loggedUser')).toBeTruthy();
		});

		it('should set userType from role if not provided', () => {
			const actual = userReducer(initialState, setCurrentUser(mockUser as any));

			expect(actual.currentUser?.userType).toBe(mockUser.role);
		});

		it('should preserve existing userType if provided', () => {
			const userWithType = { ...mockUser, userType: 'landlord' };
			const actual = userReducer(
				initialState,
				setCurrentUser(userWithType as any),
			);

			expect(actual.currentUser?.userType).toBe('landlord');
		});

		it('should handle setCurrentUser with null', () => {
			const stateWithUser = {
				...initialState,
				currentUser: mockUser as any,
			};

			const actual = userReducer(stateWithUser, setCurrentUser(null));

			expect(actual.currentUser).toBeNull();
			expect(actual.authLoading).toBe(false);
			expect(localStorageMock.getItem('loggedUser')).toBeNull();
		});

		it('should handle setUserCred', () => {
			const mockCred = { token: 'abc123', userId: 'user-123' };
			const actual = userReducer(initialState, setUserCred(mockCred));

			expect(actual.cred).toEqual(mockCred);
		});

		it('should handle setAuthLoading true', () => {
			const actual = userReducer(initialState, setAuthLoading(true));

			expect(actual.authLoading).toBe(true);
		});

		it('should handle setAuthLoading false', () => {
			const actual = userReducer(initialState, setAuthLoading(false));

			expect(actual.authLoading).toBe(false);
		});

		it('should handle logout', () => {
			const stateWithUser = {
				currentUser: mockUser as any,
				cred: { token: 'abc' },
				authLoading: false,
			};

			const actual = userReducer(stateWithUser, logout());

			expect(actual.currentUser).toBeNull();
			expect(actual.cred).toBeNull();
			expect(actual.authLoading).toBe(false);
			expect(localStorageMock.getItem('loggedUser')).toBeNull();
		});

		it('should handle multiple actions in sequence', () => {
			let state = initialState;

			// Set user
			state = userReducer(state, setCurrentUser(mockUser as any));
			expect(state.currentUser).toBeTruthy();

			// Set cred
			state = userReducer(state, setUserCred({ token: 'xyz' }));
			expect(state.cred).toEqual({ token: 'xyz' });

			// Set loading
			state = userReducer(state, setAuthLoading(false));
			expect(state.authLoading).toBe(false);

			// Logout
			state = userReducer(state, logout());
			expect(state.currentUser).toBeNull();
			expect(state.cred).toBeNull();
		});
	});
});
