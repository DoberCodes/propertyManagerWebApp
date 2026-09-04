import {
	finalizeCurrentUserEmailVerification,
	reconcileCurrentUserEmailVerification,
	refreshCurrentUserEmailVerification,
	sendCurrentUserEmailVerification,
} from './emailVerificationService';
import { auth } from '../config/firebase';
import { callFirebaseFunction } from '../config/firebaseFunctions';
import { getUserProfile } from './userProfileService';
import { reload, sendEmailVerification } from 'firebase/auth';

jest.mock('../config/firebase', () => ({
	auth: { currentUser: null },
}));
jest.mock('../config/firebaseFunctions', () => ({
	callFirebaseFunction: jest.fn(),
}));
jest.mock('./userProfileService', () => ({
	getUserProfile: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
	reload: jest.fn(),
	sendEmailVerification: jest.fn(),
}));

describe('email verification service', () => {
	const firebaseUser = {
		uid: 'user-1',
		email: 'owner@example.com',
		emailVerified: false,
		getIdToken: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(auth as any).currentUser = firebaseUser;
		firebaseUser.emailVerified = false;
	});

	it('sends Firebase verification with a Maintley return route', async () => {
		await sendCurrentUserEmailVerification();

		expect(sendEmailVerification).toHaveBeenCalledWith(
			firebaseUser,
			expect.objectContaining({
				url: expect.stringMatching(/\/verify-email$/),
				handleCodeInApp: false,
			}),
		);
	});

	it('refreshes the Firebase user and token after verification', async () => {
		(reload as jest.Mock).mockImplementation(async () => {
			firebaseUser.emailVerified = true;
		});

		await expect(refreshCurrentUserEmailVerification()).resolves.toBe(true);
		expect(firebaseUser.getIdToken).toHaveBeenCalledWith(true);
	});

	it('uses the trusted finalizer before returning an active profile', async () => {
		(reload as jest.Mock).mockImplementation(async () => {
			firebaseUser.emailVerified = true;
		});
		(callFirebaseFunction as jest.Mock).mockResolvedValue({ data: { status: 'active' } });
		(getUserProfile as jest.Mock).mockResolvedValue({
			id: 'user-1',
			email: 'owner@example.com',
			registrationStatus: 'active',
		});

		await expect(finalizeCurrentUserEmailVerification()).resolves.toEqual(
			expect.objectContaining({ registrationStatus: 'active' }),
		);
		expect(callFirebaseFunction).toHaveBeenCalledWith(
			'finalizeEmailVerification',
			{},
		);
	});

	it('does not call the finalizer before Firebase confirms verification', async () => {
		await expect(finalizeCurrentUserEmailVerification()).rejects.toThrow(
			/not verified yet/i,
		);
		expect(callFirebaseFunction).not.toHaveBeenCalled();
	});

	it('automatically activates a verified pending profile when a session resumes', async () => {
		(reload as jest.Mock).mockImplementation(async () => {
			firebaseUser.emailVerified = true;
		});
		(callFirebaseFunction as jest.Mock).mockResolvedValue({ data: { status: 'active' } });
		(getUserProfile as jest.Mock).mockResolvedValue({
			id: 'user-1',
			email: 'owner@example.com',
			registrationStatus: 'active',
		});

		await expect(
			reconcileCurrentUserEmailVerification({
				id: 'user-1',
				email: 'owner@example.com',
				role: 'admin',
				registrationStatus: 'pending_email_verification',
			}),
		).resolves.toEqual(expect.objectContaining({ registrationStatus: 'active' }));
		expect(callFirebaseFunction).toHaveBeenCalledWith(
			'finalizeEmailVerification',
			{},
		);
	});

	it('keeps an unverified pending profile pending when a session resumes', async () => {
		const pendingUser = {
			id: 'user-1',
			email: 'owner@example.com',
			role: 'admin' as const,
			registrationStatus: 'pending_email_verification' as const,
		};

		await expect(
			reconcileCurrentUserEmailVerification(pendingUser),
		).resolves.toBe(pendingUser);
		expect(callFirebaseFunction).not.toHaveBeenCalled();
	});

	it('keeps the pending boundary when automatic reconciliation is unavailable', async () => {
		const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const pendingUser = {
			id: 'user-1',
			email: 'owner@example.com',
			role: 'admin' as const,
			registrationStatus: 'pending_email_verification' as const,
		};
		(reload as jest.Mock).mockRejectedValue(new Error('network unavailable'));

		await expect(
			reconcileCurrentUserEmailVerification(pendingUser),
		).resolves.toBe(pendingUser);
		expect(consoleWarnSpy).toHaveBeenCalled();
		consoleWarnSpy.mockRestore();
	});
});
