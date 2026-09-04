import {
	beginAccountDeletionSession,
	finalizeDeletedAccountSession,
	isAccountDeletionSessionActive,
} from './accountDeletionSession';

describe('finalizeDeletedAccountSession', () => {
	it('clears local auth state and opens the landing page after deletion', async () => {
		const dispatch = jest.fn();
		const navigate = jest.fn();
		const notify = jest.fn();
		const signOutCurrentUser = jest.fn().mockResolvedValue(undefined);
		beginAccountDeletionSession();

		await finalizeDeletedAccountSession({
			userId: 'user-1',
			dispatch: dispatch as any,
			navigate,
			notify,
			signOutCurrentUser,
		});

		expect(signOutCurrentUser).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'user/logout' }),
		);
		expect(notify).toHaveBeenCalledWith(
			'Your Maintley account has been deleted.',
			'success',
		);
		expect(navigate).toHaveBeenCalledWith('/', { replace: true });
		expect(navigate.mock.invocationCallOrder[0]).toBeLessThan(
			dispatch.mock.invocationCallOrder[0],
		);
		expect(isAccountDeletionSessionActive()).toBe(false);
	});

	it('still completes the redirect when Firebase sign-out fails', async () => {
		const dispatch = jest.fn();
		const navigate = jest.fn();
		const notify = jest.fn();
		const signOutError = new Error('auth user already removed');
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		beginAccountDeletionSession();

		await finalizeDeletedAccountSession({
			userId: 'user-1',
			dispatch: dispatch as any,
			navigate,
			notify,
			signOutCurrentUser: jest.fn().mockRejectedValue(signOutError),
		});

		expect(warnSpy).toHaveBeenCalledWith(
			'Deleted account could not complete Firebase sign-out:',
			signOutError,
		);
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'user/logout' }),
		);
		expect(navigate).toHaveBeenCalledWith('/', { replace: true });
		expect(isAccountDeletionSessionActive()).toBe(false);
		warnSpy.mockRestore();
	});
});
