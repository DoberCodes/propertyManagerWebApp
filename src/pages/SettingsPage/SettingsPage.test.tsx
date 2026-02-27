import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { apiSlice } from '../../Redux/API/apiSlice';
import userSlice, { setCurrentUser, User } from '../../Redux/Slices/userSlice';

// Mock dependencies
jest.mock('services/authService', () => ({
	addFamilyMember: jest.fn(),
	getFamilyMembers: jest.fn(),
	removeFamilyMember: jest.fn(),
	updateFamilyMember: jest.fn(),
}));

jest.mock('config/firebase', () => ({
	auth: {},
	db: {},
}));

jest.mock('react-router-dom', () => ({
	useNavigate: () => jest.fn(),
}));

// Mock the subscription utilities
jest.mock('utils/subscriptionUtils', () => ({
	getSubscriptionPlanDetails: jest.fn(() => ({
		name: 'Homeowner',
		price: 9.99,
		features: ['Multiple properties', 'Team management'],
	})),
	isTrialActive: jest.fn(() => false),
	isTrialExpired: jest.fn(() => false),
	getTrialDaysRemaining: jest.fn(() => 0),
}));

const mockUser: User = {
	id: 'test-user-id',
	email: 'owner@example.com',
	firstName: 'Test',
	lastName: 'Owner',
	role: 'homeowner',
	accountId: 'test-user-id',
	isAccountOwner: true,
	subscription: {
		plan: 'homeowner',
		status: 'active',
		currentPeriodStart: Date.now() / 1000,
		currentPeriodEnd: Date.now() / 1000 + 365 * 24 * 60 * 60,
	},
} as User;

const createMockStore = (initialState = {}) => {
	return configureStore({
		reducer: {
			user: userSlice,
			[apiSlice.reducerPath]: apiSlice.reducer,
			...initialState,
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware().concat(apiSlice.middleware),
	});
};

describe('SettingsPage Family Members', () => {
	let store: ReturnType<typeof createMockStore>;
	let mockAddFamilyMember: jest.Mock;
	let mockGetFamilyMembers: jest.Mock;
	let mockRemoveFamilyMember: jest.Mock;
	let mockUpdateFamilyMember: jest.Mock;

	beforeEach(() => {
		store = createMockStore();
		store.dispatch(setCurrentUser(mockUser));

		mockAddFamilyMember = require('services/authService').addFamilyMember;
		mockGetFamilyMembers = require('services/authService').getFamilyMembers;
		mockRemoveFamilyMember = require('services/authService').removeFamilyMember;
		mockUpdateFamilyMember = require('services/authService').updateFamilyMember;

		mockAddFamilyMember.mockClear();
		mockGetFamilyMembers.mockClear();
		mockRemoveFamilyMember.mockClear();
		mockUpdateFamilyMember.mockClear();
	});

	const renderSettingsPage = () => {
		return render(
			<Provider store={store}>
				<SettingsPage />
			</Provider>,
		);
	};

	describe('Family Members Section Visibility', () => {
		it('should show family members section for account owners', () => {
			mockGetFamilyMembers.mockResolvedValue([]);

			renderSettingsPage();

			expect(screen.getByText('Family Members')).toBeInTheDocument();
			expect(
				screen.getByText(/Add family members to share your subscription/),
			).toBeInTheDocument();
		});

		it('should not show family members section for family members', () => {
			const familyMemberUser = {
				...mockUser,
				id: 'family-member-id',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			store.dispatch(setCurrentUser(familyMemberUser));
			mockGetFamilyMembers.mockResolvedValue([]);

			renderSettingsPage();

			expect(screen.queryByText('Family Members')).not.toBeInTheDocument();
		});

		it('should not show family members section for users without account setup', () => {
			const userWithoutAccount = {
				...mockUser,
				accountId: undefined,
				isAccountOwner: undefined,
			};

			store.dispatch(setCurrentUser(userWithoutAccount));

			renderSettingsPage();

			expect(screen.queryByText('Family Members')).not.toBeInTheDocument();
		});
	});

	describe('Adding Family Members', () => {
		beforeEach(() => {
			mockGetFamilyMembers.mockResolvedValue([]);
		});

		it('should show add family member button when under limit', () => {
			renderSettingsPage();

			expect(screen.getByText('Add Family Member')).toBeInTheDocument();
		});

		it('should open modal when add family member button is clicked', () => {
			renderSettingsPage();

			const addButton = screen.getByText('Add Family Member');
			fireEvent.click(addButton);

			expect(
				screen.getByRole('heading', { name: 'Add Family Member' }),
			).toBeInTheDocument();
			expect(
				screen.getByPlaceholderText('Enter first name'),
			).toBeInTheDocument();
			expect(
				screen.getByPlaceholderText('Enter last name'),
			).toBeInTheDocument();
			expect(
				screen.getByPlaceholderText('Enter email address'),
			).toBeInTheDocument();
		});

		it('should successfully add a family member', async () => {
			const newFamilyMember = {
				id: 'new-member-id',
				email: 'member@example.com',
				firstName: 'New',
				lastName: 'Member',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			mockAddFamilyMember.mockResolvedValue(newFamilyMember);
			mockGetFamilyMembers.mockResolvedValue([mockUser, newFamilyMember]);

			renderSettingsPage();

			// Open modal
			const addButton = screen.getByText('Add Family Member');
			fireEvent.click(addButton);

			// Fill form
			const firstNameInput = screen.getByPlaceholderText('Enter first name');
			const lastNameInput = screen.getByPlaceholderText('Enter last name');
			const emailInput = screen.getByPlaceholderText('Enter email address');

			await userEvent.type(firstNameInput, 'New');
			await userEvent.type(lastNameInput, 'Member');
			await userEvent.type(emailInput, 'member@example.com');

			// Submit form
			const submitButton = screen.getByRole('button', { name: 'Add Member' });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockAddFamilyMember).toHaveBeenCalledWith(
					'test-user-id',
					'member@example.com',
					'New',
					'Member',
					'member',
				);
			});

			// Should reload family members
			expect(mockGetFamilyMembers).toHaveBeenCalledWith('test-user-id');
		});

		it('should show error for invalid form data', async () => {
			renderSettingsPage();

			// Open modal
			const addButton = screen.getByText('Add Family Member');
			fireEvent.click(addButton);

			// Try to submit empty form
			const submitButton = screen.getByRole('button', { name: 'Add Member' });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText('Please fill in all fields'),
				).toBeInTheDocument();
			});
		});

		it('should show error when adding fails', async () => {
			mockAddFamilyMember.mockRejectedValue(new Error('Email already exists'));

			renderSettingsPage();

			// Open modal and fill form
			const addButton = screen.getByText('Add Family Member');
			fireEvent.click(addButton);

			const firstNameInput = screen.getByPlaceholderText('Enter first name');
			const lastNameInput = screen.getByPlaceholderText('Enter last name');
			const emailInput = screen.getByPlaceholderText('Enter email address');

			await userEvent.type(firstNameInput, 'Test');
			await userEvent.type(lastNameInput, 'User');
			await userEvent.type(emailInput, 'existing@example.com');

			// Submit form
			const submitButton = screen.getByRole('button', { name: 'Add Member' });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Email already exists')).toBeInTheDocument();
			});
		});

		it('should hide add button when account is full', async () => {
			// Mock full seat usage: owner + 2 non-owner family members
			const familyMemberOne = {
				id: 'member-id',
				email: 'member@example.com',
				firstName: 'Family',
				lastName: 'Member',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};
			const familyMemberTwo = {
				id: 'member-id-2',
				email: 'member2@example.com',
				firstName: 'Family',
				lastName: 'Member Two',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			mockGetFamilyMembers.mockResolvedValue([
				mockUser,
				familyMemberOne,
				familyMemberTwo,
			]);

			renderSettingsPage();

			await waitFor(() => {
				expect(
					screen.getByText(
						'Family accounts are limited to 2 family members (plus the account owner).',
					),
				).toBeInTheDocument();
			});
			expect(screen.queryByText('Add Family Member')).not.toBeInTheDocument();
		});
	});

	describe('Displaying Family Members', () => {
		it('should display current family members', async () => {
			const familyMember = {
				id: 'member-id',
				email: 'member@example.com',
				firstName: 'Family',
				lastName: 'Member',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			mockGetFamilyMembers.mockResolvedValue([mockUser, familyMember]);

			renderSettingsPage();

			await waitFor(() => {
				expect(screen.getByText('Current Family Members:')).toBeInTheDocument();
			});
			expect(screen.getByText('Family Member')).toBeInTheDocument();
			expect(screen.getByText('member@example.com')).toBeInTheDocument();
			expect(screen.getByText('Remove')).toBeInTheDocument();
		});

		it('should not show owner in family members list', () => {
			const familyMember = {
				id: 'member-id',
				email: 'member@example.com',
				firstName: 'Family',
				lastName: 'Member',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			mockGetFamilyMembers.mockResolvedValue([mockUser, familyMember]);

			renderSettingsPage();

			// Should not show the owner in the list
			expect(screen.queryByText('Test Owner')).not.toBeInTheDocument();
			expect(screen.queryByText('owner@example.com')).not.toBeInTheDocument();
		});
	});

	describe('Removing Family Members', () => {
		it('should successfully remove a family member', async () => {
			const familyMember = {
				id: 'member-id',
				email: 'member@example.com',
				firstName: 'Family',
				lastName: 'Member',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			mockGetFamilyMembers.mockResolvedValue([mockUser, familyMember]);
			mockRemoveFamilyMember.mockResolvedValue(undefined);
			const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

			renderSettingsPage();

			const removeButton = await screen.findByText('Remove');
			fireEvent.click(removeButton);

			await waitFor(() => {
				expect(mockRemoveFamilyMember).toHaveBeenCalledWith(
					'test-user-id',
					'member-id',
					'test-user-id',
				);
			});

			// Should reload family members
			expect(mockGetFamilyMembers).toHaveBeenCalledWith('test-user-id');

			confirmSpy.mockRestore();
		});

		it('should show error when removal fails', async () => {
			const familyMember = {
				id: 'member-id',
				email: 'member@example.com',
				firstName: 'Family',
				lastName: 'Member',
				accountId: 'test-user-id',
				isAccountOwner: false,
			};

			mockGetFamilyMembers.mockResolvedValue([mockUser, familyMember]);
			mockRemoveFamilyMember.mockRejectedValue(
				new Error('Cannot remove yourself'),
			);
			const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
			const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

			renderSettingsPage();

			const removeButton = await screen.findByText('Remove');
			fireEvent.click(removeButton);

			await waitFor(() => {
				expect(alertSpy).toHaveBeenCalledWith(
					'Failed to remove family member. Please try again.',
				);
			});

			confirmSpy.mockRestore();
			alertSpy.mockRestore();
		});
	});

	describe('Loading States', () => {
		it('should show loading state when fetching family members', () => {
			mockGetFamilyMembers.mockImplementation(() => new Promise(() => {})); // Never resolves

			renderSettingsPage();

			// Should show loading or not crash
			expect(screen.getByText('Settings')).toBeInTheDocument();
		});

		it('should show loading state when adding family member', async () => {
			mockGetFamilyMembers.mockResolvedValue([]);
			mockAddFamilyMember.mockImplementation(() => new Promise(() => {})); // Never resolves

			renderSettingsPage();

			// Open modal and submit
			const addButton = screen.getByText('Add Family Member');
			fireEvent.click(addButton);

			const firstNameInput = screen.getByPlaceholderText('Enter first name');
			const lastNameInput = screen.getByPlaceholderText('Enter last name');
			const emailInput = screen.getByPlaceholderText('Enter email address');

			await userEvent.type(firstNameInput, 'Test');
			await userEvent.type(lastNameInput, 'User');
			await userEvent.type(emailInput, 'test@example.com');

			// Submit form
			const submitButton = screen.getByRole('button', { name: 'Add Member' });
			fireEvent.click(submitButton);

			// Should call the add function
			await waitFor(() => {
				expect(mockAddFamilyMember).toHaveBeenCalledWith(
					'test-user-id',
					'test@example.com',
					'Test',
					'User',
					'member',
				);
			});
		});
	});
});
