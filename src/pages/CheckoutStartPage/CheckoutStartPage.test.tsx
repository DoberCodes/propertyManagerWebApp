import { render, screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { CheckoutStartPage } from './CheckoutStartPage';
import {
	createCheckoutSession,
	redirectToCheckout,
} from '../../services/stripeService';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn(),
	useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useNavigate: jest.fn(),
}));

jest.mock('../../services/stripeService', () => ({
	createCheckoutSession: jest.fn(),
	redirectToCheckout: jest.fn(),
}));

jest.mock('../../services/userProfileService', () => ({
	getUserProfile: jest.fn(),
}));

jest.mock('../../Components/Library/SplashScreen', () => ({
	SplashScreen: ({ title }: { title: string }) => <div>{title}</div>,
}));

const pendingUser = {
	id: 'user-123',
	email: 'owner@example.com',
	role: 'admin',
	subscription: {
		status: 'active',
		plan: 'homeowner',
		currentPeriodStart: 0,
		currentPeriodEnd: 0,
		pendingCheckoutPlan: 'homeowner_plus',
		pendingCheckoutStartedAt: 1,
		promoCode: 'WELCOME',
	},
};

describe('CheckoutStartPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({ user: { currentUser: pendingUser } }),
		);
		(useDispatch as unknown as jest.Mock).mockReturnValue(jest.fn());
		(useNavigate as jest.Mock).mockReturnValue(jest.fn());
	});

	it('opens Stripe checkout for the pending signup plan', async () => {
		(createCheckoutSession as jest.Mock).mockResolvedValue(
			'https://checkout.stripe.com/c/pay/cs_test_pending',
		);

		render(
			<MemoryRouter>
				<CheckoutStartPage />
			</MemoryRouter>,
		);

		expect(screen.getByText('Opening secure checkout')).toBeInTheDocument();
		await waitFor(() =>
			expect(redirectToCheckout).toHaveBeenCalledWith(
				'https://checkout.stripe.com/c/pay/cs_test_pending',
			),
		);
		expect(createCheckoutSession).toHaveBeenCalledWith(
			expect.any(String),
			'user-123',
			'owner@example.com',
			undefined,
			'WELCOME',
			'homeowner_plus',
			'month',
		);
	});

	it('offers recovery instead of leaving an indefinite loading screen', async () => {
		(createCheckoutSession as jest.Mock).mockRejectedValue(
			new Error('Secure checkout took too long to respond.'),
		);

		render(
			<MemoryRouter>
				<CheckoutStartPage />
			</MemoryRouter>,
		);

		expect(await screen.findByText('Checkout did not open')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Try Secure Checkout Again' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Continue on Free' }),
		).toBeInTheDocument();
	});
});
