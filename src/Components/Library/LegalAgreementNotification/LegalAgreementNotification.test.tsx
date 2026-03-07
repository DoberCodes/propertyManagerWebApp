import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LegalAgreementNotification from './LegalAgreementNotification';

const mockDispatch = jest.fn();
const mockUpdateUser = jest.fn(() => ({
	unwrap: () => Promise.resolve({}),
}));

const mockCurrentUser = {
	id: 'test-user-id',
	email: 'owner@example.com',
	firstName: 'Test',
	lastName: 'Owner',
	legalAgreement: {
		agreedToTerms: false,
		agreedVersion: '0.0.1',
		documents: {},
	},
};

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selector: any) =>
		selector({
			user: {
				currentUser: mockCurrentUser,
			},
		}),
}));

jest.mock('../../../Redux/API/userSlice', () => ({
	useUpdateUserMutation: () => [mockUpdateUser, { isLoading: false }],
}));

describe('LegalAgreementNotification Select All', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
		mockUpdateUser.mockClear();
	});

	it('should toggle all legal checkboxes via Select all legal documents', async () => {
		render(<LegalAgreementNotification />);

		await screen.findByText(/Legal Documents Required/i);

		const acceptButton = screen.getByRole('button', {
			name: /Accept & Continue/i,
		});
		const selectAllCheckbox = screen.getByLabelText(
			/Select all legal documents/i,
		);

		expect(acceptButton).toBeDisabled();

		fireEvent.click(selectAllCheckbox);
		expect(acceptButton).toBeEnabled();

		fireEvent.click(selectAllCheckbox);
		expect(acceptButton).toBeDisabled();
	});

	it('should allow accepting legal docs after using Select all', async () => {
		render(<LegalAgreementNotification />);

		await screen.findByText(/Legal Documents Required/i);

		const selectAllCheckbox = screen.getByLabelText(
			/Select all legal documents/i,
		);
		const acceptButton = screen.getByRole('button', {
			name: /Accept & Continue/i,
		});

		fireEvent.click(selectAllCheckbox);
		fireEvent.click(acceptButton);

		await waitFor(() => {
			expect(mockUpdateUser).toHaveBeenCalledTimes(1);
		});
	});
});
