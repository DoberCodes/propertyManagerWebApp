let mockAuthStateCallback: ((user: { uid: string } | null) => Promise<void>) | null =
	null;

jest.mock('firebase/auth', () => ({
	onAuthStateChanged: jest.fn((_auth, callback) => {
		mockAuthStateCallback = callback;
		return jest.fn();
	}),
}));

jest.mock('../config/firebase', () => ({
	auth: {},
}));

jest.mock('./userProfileService', () => ({
	getUserProfile: jest.fn(),
}));

describe('authSession', () => {
	const loadAuthSession = () =>
		require('./authSession') as typeof import('./authSession');
	const loadUserProfileService = () =>
		require('./userProfileService') as typeof import('./userProfileService');

	beforeEach(() => {
		mockAuthStateCallback = null;
		(loadUserProfileService().getUserProfile as jest.Mock).mockReset();
	});

	it('notifies the app before resolving profile changes', async () => {
		const { onAuthStateChange } = loadAuthSession();
		const { getUserProfile } = loadUserProfileService();
		const events: string[] = [];

		(getUserProfile as jest.Mock).mockImplementation(async () => {
			events.push('load-profile');
			return { id: 'user-b', email: 'b@example.com', role: 'admin' };
		});

		const onResolvedUser = jest.fn(() => {
			events.push('resolved-user');
		});

		onAuthStateChange(onResolvedUser, {
			onAuthUserResolving: (userId) => {
				events.push(`resolving-${userId || 'none'}`);
			},
		});

		expect(mockAuthStateCallback).toEqual(expect.any(Function));
		await mockAuthStateCallback?.({ uid: 'user-b' });

		expect(events).toEqual([
			'resolving-user-b',
			'load-profile',
			'resolved-user',
		]);
		expect(onResolvedUser).toHaveBeenCalledWith({
			id: 'user-b',
			email: 'b@example.com',
			role: 'admin',
		});

		events.length = 0;
		onResolvedUser.mockClear();
		(getUserProfile as jest.Mock).mockClear();

		await mockAuthStateCallback?.(null);

		expect(events).toEqual(['resolving-none', 'resolved-user']);
		expect(getUserProfile).not.toHaveBeenCalled();
		expect(onResolvedUser).toHaveBeenCalledWith(null);
	});
});
