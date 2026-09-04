import {
	finalizeCurrentUserEmailVerification,
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
});
