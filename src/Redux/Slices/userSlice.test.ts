import userReducer, {
	beginAuthTransition,
	setCurrentUser,
	setUserCred,
	setAuthLoading,
	logout,
	updateEntitlementProjection,
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
			expect(actual.authLoading).toBe(false);
			expect(localStorageMock.getItem('loggedUser')).toBe(
				JSON.stringify({
					token: 'firebase-token-user-123',
					user: mockUser,
				}),
			);
		});

		it('should handle beginAuthTransition', () => {
			const stateWithUser = {
				currentUser: mockUser as any,
				cred: { token: 'abc' },
				authLoading: false,
			};
			localStorageMock.setItem('loggedUser', JSON.stringify(mockUser));

			const actual = userReducer(stateWithUser, beginAuthTransition());

			expect(actual.currentUser).toBeNull();
			expect(actual.cred).toBeNull();
			expect(actual.authLoading).toBe(true);
			expect(localStorageMock.getItem('loggedUser')).toBeNull();
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

		it('applies only the current account entitlement projection', () => {
			const stateWithUser = userReducer(
				initialState,
				setCurrentUser({
					...mockUser,
					accountId: 'account-1',
					subscription: {
						status: 'active',
						plan: 'homeowner',
						currentPeriodStart: 0,
						currentPeriodEnd: 1,
					},
				} as any),
			);
			const grant = {
				grantId: 'trial-grant',
				programId: 'homeowner_plus_first_property_trial_v1',
				accountId: 'account-1',
				kind: 'temporary',
				state: 'active',
				startsAtMs: 1,
				endsAtMs: 2,
				source: 'trial',
			} as const;
			const actual = userReducer(
				stateWithUser,
				updateEntitlementProjection({
					accountId: 'account-1',
					projection: { activeGrants: [grant] },
				}),
			);

			expect(actual.currentUser?.subscription?.entitlementAccountId).toBe('account-1');
			expect(actual.currentUser?.subscription?.entitlementGrants).toEqual([grant]);
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
