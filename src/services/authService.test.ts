import {
	addFamilyMember,
	getFamilyMembers,
	removeFamilyMember,
	getUserProfile,
	signUpWithEmail,
	checkEmailExists,
} from './authService';
import { USER_ROLES } from '../constants/roles';
import { SUBSCRIPTION_STATUS } from '../constants/subscriptions';

// Mock Firebase modules
jest.mock('../config/firebase', () => ({
	auth: {
		currentUser: { uid: 'test-user-id', email: 'test@example.com' },
	},
	db: {},
	functions: {},
}));

jest.mock('firebase/auth', () => ({
	createUserWithEmailAndPassword: jest.fn(),
	updateProfile: jest.fn(),
	sendPasswordResetEmail: jest.fn(),
	httpsCallable: jest.fn(),
	fetchSignInMethodsForEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
	doc: jest.fn(),
	getDoc: jest.fn(),
	getDocFromServer: jest.fn(),
	setDoc: jest.fn(),
	updateDoc: jest.fn(),
	collection: jest.fn(),
	query: jest.fn(),
	where: jest.fn(),
	getDocs: jest.fn(),
	addDoc: jest.fn(),
	deleteDoc: jest.fn(),
	serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/functions', () => ({
	connectFunctionsEmulator: jest.fn(),
	getFunctions: jest.fn(() => ({ app: 'test-functions-app' })),
	httpsCallable: jest.fn(),
}));

describe('Family Account Functionality', () => {
	const mockAccountId = 'account-owner-id';
	const mockFamilyMemberId = 'family-member-id';

	beforeEach(() => {
		jest.clearAllMocks();
		const mockFetchSignInMethodsForEmail =
			require('firebase/auth').fetchSignInMethodsForEmail;
		const mockGetDocs = require('firebase/firestore').getDocs;
		const mockGetFunctions = require('firebase/functions').getFunctions;
		const mockHttpsCallable = require('firebase/functions').httpsCallable;
		mockFetchSignInMethodsForEmail.mockResolvedValue([]);
		mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
		mockGetFunctions.mockReturnValue({ app: 'test-functions-app' });
		mockHttpsCallable.mockImplementation(
			(_functions: unknown, name: string) => {
				if (name === 'getFamilyAccountSummary') {
					return jest.fn().mockResolvedValue({
						data: { accountId: mockAccountId, subscription: null },
					});
				}
				if (name === 'ensureFamilyAccount') {
					return jest.fn().mockResolvedValue({
						data: { success: true, accountId: mockAccountId },
					});
				}
				return jest.fn().mockResolvedValue({ data: { success: true } });
			},
		);
	});

	describe('addFamilyMember', () => {
		const mockHttpsCallable = require('firebase/functions').httpsCallable;

		beforeEach(() => {
			mockHttpsCallable.mockReturnValue(
				jest.fn().mockResolvedValue({
					data: {
						success: true,
						userId: 'invite-123',
						message: 'Invitation sent successfully',
					},
				}),
			);
		});

		it('should successfully add a family member', async () => {
			const result = await addFamilyMember(
				mockAccountId,
				'family@example.com',
				'Family',
				'Member',
			);

			expect(result).toEqual({
				userId: 'invite-123',
				message: 'Invitation sent successfully',
			});

			expect(mockHttpsCallable).toHaveBeenCalledWith(
				expect.any(Object),
				'createFamilyInvite',
			);
		});

		it('should throw error for existing email', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			const mockCallableFunction = jest
				.fn()
				.mockRejectedValue(new Error('User with this email already exists'));
			mockHttpsCallable.mockReturnValue(mockCallableFunction);

			await expect(
				addFamilyMember(mockAccountId, 'existing@example.com', 'Test', 'User'),
			).rejects.toThrow('User with this email already exists');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to add family member:',
				expect.any(Error),
			);
			consoleErrorSpy.mockRestore();
		});

		it('should throw error when account is full', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			const mockCallableFunction = jest
				.fn()
				.mockRejectedValue(
					new Error(
						'Family accounts are limited to 2 family members (plus the account owner)',
					),
				);
			mockHttpsCallable.mockReturnValue(mockCallableFunction);

			await expect(
				addFamilyMember(mockAccountId, 'new@example.com', 'Test', 'User'),
			).rejects.toThrow(
				'Family accounts are limited to 2 family members (plus the account owner)',
			);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to add family member:',
				expect.any(Error),
			);
			consoleErrorSpy.mockRestore();
		});
	});

	describe('getFamilyMembers', () => {
		const mockHttpsCallable = require('firebase/functions').httpsCallable;

		it('should return family members for an account', async () => {
			mockHttpsCallable.mockReturnValue(
				jest.fn().mockResolvedValue({
					data: {
						members: [
							{
								id: mockAccountId,
								firstName: 'Account',
								lastName: 'Owner',
								email: 'owner@example.com',
								accountId: mockAccountId,
								isAccountOwner: true,
							},
							{
								id: mockFamilyMemberId,
								firstName: 'Family',
								lastName: 'Member',
								email: 'member@example.com',
								accountId: mockAccountId,
								isAccountOwner: false,
							},
						],
					},
				}),
			);

			const result = await getFamilyMembers(mockAccountId);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(
				expect.objectContaining({
					id: mockAccountId,
					firstName: 'Account',
					lastName: 'Owner',
					email: 'owner@example.com',
					accountId: mockAccountId,
					isAccountOwner: true,
				}),
			);
			expect(result[1]).toEqual(
				expect.objectContaining({
					id: mockFamilyMemberId,
					firstName: 'Family',
					lastName: 'Member',
					email: 'member@example.com',
					accountId: mockAccountId,
					isAccountOwner: false,
				}),
			);
		});

		it('should return empty array for account with no members', async () => {
			mockHttpsCallable.mockReturnValue(
				jest.fn().mockResolvedValue({ data: { members: [] } }),
			);

			const result = await getFamilyMembers(mockAccountId);
			expect(result).toEqual([]);
		});
	});

	describe('removeFamilyMember', () => {
		const mockHttpsCallable = require('firebase/functions').httpsCallable;

		beforeEach(() => {
			// mock cloud function used to delete a family member account
			mockHttpsCallable.mockReturnValue(
				jest.fn().mockResolvedValue({ data: { success: true } }),
			);
		});

		it('should successfully remove a family member', async () => {
			await expect(
				removeFamilyMember(mockAccountId, mockFamilyMemberId, mockAccountId),
			).resolves.not.toThrow();
		});

		it('should throw error when trying to remove self', async () => {
			const consoleErrorSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			await expect(
				removeFamilyMember(mockAccountId, mockAccountId, mockAccountId),
			).rejects.toThrow('Cannot remove yourself from the account');

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to remove family member:',
				expect.any(Error),
			);
			consoleErrorSpy.mockRestore();
		});
	});

	describe('getUserProfile migration', () => {
		const mockGetDocFromServer = require('firebase/firestore').getDocFromServer;
		const mockUpdateDoc = require('firebase/firestore').updateDoc;
		const mockSetDoc = require('firebase/firestore').setDoc;

		it('should migrate existing user without accountId', async () => {
			const mockDoc = require('firebase/firestore').doc;
			const mockUserDoc = {
				exists: () => true,
				data: () => ({
					email: 'existing@example.com',
					firstName: 'Existing',
					lastName: 'User',
					role: USER_ROLES.ADMIN,
					subscription: { plan: 'homeowner', status: 'active' },
					// No accountId or isAccountOwner fields
				}),
			};
			const mockAccountDoc = {
				exists: () => false,
			};

			mockGetDocFromServer
				.mockResolvedValueOnce(mockUserDoc)
				.mockResolvedValueOnce(mockAccountDoc);
			mockUpdateDoc.mockResolvedValue(undefined);
			mockSetDoc.mockResolvedValue(undefined);
			mockDoc.mockReturnValue({
				_path: { segments: ['users', 'existing-user-id'] },
			});

			const result = await getUserProfile('existing-user-id');

			expect(result.accountId).toBe('existing-user-id');
			expect(result.isAccountOwner).toBe(true);
			expect(mockUpdateDoc).toHaveBeenCalled();
			const updateCall = mockUpdateDoc.mock.calls.find(
				([, payload]) => payload?.accountId === 'existing-user-id',
			);
			expect(updateCall?.[1]).toEqual(
				expect.objectContaining({
					accountId: 'existing-user-id',
					isAccountOwner: true,
				}),
			);
			expect(mockSetDoc).not.toHaveBeenCalled();
		});

		it('should not migrate user that already has accountId', async () => {
			const mockUserDoc = {
				exists: () => true,
				data: () => ({
					email: 'migrated@example.com',
					firstName: 'Migrated',
					lastName: 'User',
					role: USER_ROLES.ADMIN,
					accountId: 'account-123',
					isAccountOwner: true,
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};
			const mockAccountDoc = {
				exists: () => true,
				data: () => ({
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};

			mockGetDocFromServer
				.mockResolvedValueOnce(mockUserDoc)
				.mockResolvedValueOnce(mockAccountDoc);

			const result = await getUserProfile('migrated-user-id');

			expect(result.accountId).toBe('account-123');
			expect(result.isAccountOwner).toBe(true);
			expect(mockUpdateDoc).not.toHaveBeenCalled();
		});
	});

	describe('signUpWithEmail creates family account', () => {
		const mockCreateUserWithEmailAndPassword = jest.fn();
		const mockUpdateProfile = jest.fn();

		beforeEach(() => {
			require('firebase/auth').createUserWithEmailAndPassword.mockImplementation(
				mockCreateUserWithEmailAndPassword,
			);
			require('firebase/auth').updateProfile.mockImplementation(
				mockUpdateProfile,
			);
		});

		it('keeps paid signup on Homeowner entitlement until Stripe confirms checkout', async () => {
			const mockDoc = require('firebase/firestore').doc;
			const mockSetDoc = require('firebase/firestore').setDoc;
			const mockUpdateDoc = require('firebase/firestore').updateDoc;
			const mockHttpsCallable = require('firebase/functions').httpsCallable;
			const ensureFamilyAccount = jest.fn().mockResolvedValue({
				data: { success: true, accountId: 'new-user-id' },
			});

			mockDoc.mockImplementation(
				(_db: unknown, collectionName: string, id: string) => ({
					collectionName,
					id,
				}),
			);
			mockCreateUserWithEmailAndPassword.mockResolvedValue({
				user: { uid: 'new-user-id', email: 'paid@example.com' },
			});
			mockUpdateProfile.mockResolvedValue(undefined);
			mockSetDoc.mockResolvedValue(undefined);
			mockUpdateDoc.mockResolvedValue(undefined);
			mockHttpsCallable.mockImplementation(
				(_functions: unknown, name: string) =>
					name === 'ensureFamilyAccount'
						? ensureFamilyAccount
						: jest.fn().mockResolvedValue({ data: { success: true } }),
			);

			const result = await signUpWithEmail(
				'paid@example.com',
				'Testing123!',
				'Paid',
				'User',
				USER_ROLES.ADMIN,
				'portfolio',
				'SUMMER',
			);

			expect(result.user.subscription).toEqual(
				expect.objectContaining({
					plan: 'homeowner',
					pendingCheckoutPlan: 'portfolio',
				}),
			);

			const userProfileWrite = mockSetDoc.mock.calls.find(
				([docRef]: [{ collectionName: string; id: string }]) =>
					docRef.collectionName === 'users' && docRef.id === 'new-user-id',
			);
			expect(userProfileWrite?.[1].subscription).toEqual(
				expect.objectContaining({
					status: SUBSCRIPTION_STATUS.ACTIVE,
					plan: 'homeowner',
					promoCode: 'SUMMER',
					pendingCheckoutPlan: 'portfolio',
					pendingCheckoutStartedAt: expect.any(Number),
				}),
			);

			expect(ensureFamilyAccount).not.toHaveBeenCalled();

			const paidPlanGroupWrites = mockSetDoc.mock.calls.filter(
				([docRef]: [{ collectionName: string }]) =>
					['propertyGroups', 'teamGroups'].includes(docRef.collectionName),
			);
			expect(paidPlanGroupWrites).toEqual([]);
		});

		it('finishes family account provisioning before returning a free signup', async () => {
			const mockDoc = require('firebase/firestore').doc;
			const mockSetDoc = require('firebase/firestore').setDoc;
			const mockUpdateDoc = require('firebase/firestore').updateDoc;
			const mockHttpsCallable = require('firebase/functions').httpsCallable;
			const ensureFamilyAccount = jest.fn().mockResolvedValue({
				data: { success: true, accountId: 'free-user-id' },
			});

			mockDoc.mockImplementation(
				(_db: unknown, collectionName: string, id: string) => ({
					collectionName,
					id,
				}),
			);
			mockCreateUserWithEmailAndPassword.mockResolvedValue({
				user: { uid: 'free-user-id', email: 'free@example.com' },
			});
			mockUpdateProfile.mockResolvedValue(undefined);
			mockSetDoc.mockResolvedValue(undefined);
			mockUpdateDoc.mockResolvedValue(undefined);
			mockHttpsCallable.mockImplementation(
				(_functions: unknown, name: string) =>
					name === 'ensureFamilyAccount'
						? ensureFamilyAccount
						: jest.fn().mockResolvedValue({ data: { success: true } }),
			);

			const result = await signUpWithEmail(
				'free@example.com',
				'Testing123!',
				'Free',
				'User',
				USER_ROLES.ADMIN,
				'homeowner',
			);

			expect(result.user.subscription).toEqual(
				expect.objectContaining({
					status: SUBSCRIPTION_STATUS.ACTIVE,
					plan: 'homeowner',
				}),
			);
			expect(ensureFamilyAccount).toHaveBeenCalledWith(
				expect.objectContaining({
					accountId: 'free-user-id',
					syncSubscription: true,
				}),
			);
		});

		it('resumes profile provisioning when Firebase Auth created the current user before a network failure', async () => {
			const mockAuth = require('../config/firebase').auth;
			const mockDoc = require('firebase/firestore').doc;
			const mockSetDoc = require('firebase/firestore').setDoc;
			const mockHttpsCallable = require('firebase/functions').httpsCallable;
			const ensureFamilyAccount = jest.fn().mockResolvedValue({
				data: { success: true, accountId: 'recovered-user-id' },
			});
			const consoleWarnSpy = jest
				.spyOn(console, 'warn')
				.mockImplementation(() => {});

			mockAuth.currentUser = {
				uid: 'recovered-user-id',
				email: 'recover@example.com',
			};
			mockDoc.mockImplementation(
				(_db: unknown, collectionName: string, id: string) => ({
					collectionName,
					id,
				}),
			);
			mockCreateUserWithEmailAndPassword.mockRejectedValue(
				Object.assign(new Error('Network request failed'), {
					code: 'auth/network-request-failed',
				}),
			);
			mockUpdateProfile.mockResolvedValue(undefined);
			mockSetDoc.mockResolvedValue(undefined);
			mockHttpsCallable.mockImplementation(
				(_functions: unknown, name: string) =>
					name === 'ensureFamilyAccount'
						? ensureFamilyAccount
						: jest.fn().mockResolvedValue({ data: { success: true } }),
			);

			const result = await signUpWithEmail(
				'recover@example.com',
				'Testing123!',
				'Recover',
				'User',
				USER_ROLES.ADMIN,
				'homeowner',
			);

			expect(result.user.id).toBe('recovered-user-id');
			expect(mockSetDoc).toHaveBeenCalledWith(
				expect.objectContaining({
					collectionName: 'users',
					id: 'recovered-user-id',
				}),
				expect.objectContaining({
					email: 'recover@example.com',
				}),
			);
			expect(ensureFamilyAccount).toHaveBeenCalled();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Resuming profile provisioning'),
			);

			consoleWarnSpy.mockRestore();
		});
	});
});

describe('registration email availability', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('uses Firebase Auth without querying the protected users collection', async () => {
		const mockFetchSignInMethodsForEmail =
			require('firebase/auth').fetchSignInMethodsForEmail;
		const mockGetDocs = require('firebase/firestore').getDocs;
		mockFetchSignInMethodsForEmail.mockResolvedValue(['password']);

		await expect(checkEmailExists('owner@example.com')).resolves.toBe(true);
		expect(mockGetDocs).not.toHaveBeenCalled();
	});

	it('leaves duplicate enforcement to account creation when the pre-check fails', async () => {
		const mockFetchSignInMethodsForEmail =
			require('firebase/auth').fetchSignInMethodsForEmail;
		const consoleInfoSpy = jest
			.spyOn(console, 'info')
			.mockImplementation(() => {});
		mockFetchSignInMethodsForEmail.mockRejectedValue(
			new Error('lookup unavailable'),
		);

		await expect(checkEmailExists('owner@example.com')).resolves.toBe(false);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			'Email availability pre-check was unavailable.',
			expect.any(Error),
		);
		consoleInfoSpy.mockRestore();
	});
});
