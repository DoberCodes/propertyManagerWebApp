import { render, screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { handleCheckoutSuccess } from '../../services/stripeService';
import { getUserProfile } from '../../services/userProfileService';
import { CheckoutCompletionPage } from './CheckoutCompletionPage';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn(),
	useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
	useLocation: jest.fn(),
	useNavigate: jest.fn(),
}));

jest.mock('../../services/stripeService', () => ({
	handleCheckoutSuccess: jest.fn(),
}));

jest.mock('../../services/userProfileService', () => ({
	getUserProfile: jest.fn(),
}));

jest.mock('../../Components/Library/SplashScreen', () => ({
	SplashScreen: ({ title }: { title: string }) => <div>{title}</div>,
}));

const dispatch = jest.fn();
const navigate = jest.fn();
const pendingUser = {
	id: 'user-123',
	email: 'owner@example.com',
	role: 'landlord',
	subscription: {
		status: 'active',
		plan: 'homeowner',
		pendingCheckoutPlan: 'homeowner_plus',
	},
};

describe('CheckoutCompletionPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({ user: { currentUser: pendingUser } }),
		);
		(useLocation as jest.Mock).mockReturnValue({
			search: '?session_id=cs_test_123',
		});
		(useNavigate as jest.Mock).mockReturnValue(navigate);
	});

	it('refreshes the paid account before navigating to the dashboard', async () => {
		const refreshedUser = {
			...pendingUser,
			subscription: {
				...pendingUser.subscription,
				plan: 'homeowner_plus',
				pendingCheckoutPlan: undefined,
			},
		};
		(handleCheckoutSuccess as jest.Mock).mockResolvedValue({ success: true });
		(getUserProfile as jest.Mock).mockResolvedValue(refreshedUser);

		render(<CheckoutCompletionPage />);

		expect(screen.getByText('Finishing your account')).toBeInTheDocument();
		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }),
		);
		expect(handleCheckoutSuccess).toHaveBeenCalledWith('cs_test_123');
		expect(getUserProfile).toHaveBeenCalledWith('user-123');
		expect(dispatch).toHaveBeenCalled();
	});

	it('shows a recovery action when checkout verification fails', async () => {
		(handleCheckoutSuccess as jest.Mock).mockRejectedValue(
			new Error('temporary failure'),
		);

		render(<CheckoutCompletionPage />);

		expect(await screen.findByText('We need one more moment')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
		expect(navigate).not.toHaveBeenCalled();
	});
});
