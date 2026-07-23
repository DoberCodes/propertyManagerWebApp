import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { PaywallPage } from './PaywallPage';

jest.mock('react-router-dom', () => ({
	useNavigate: jest.fn(),
}));

jest.mock('../../utils/platform', () => ({
	isNativeApp: () => false,
}));

jest.mock('../../services/stripeService', () => ({
	createCheckoutSession: jest.fn(),
	redirectToCheckout: jest.fn(),
	validatePromotionCode: jest.fn(),
}));

describe('PaywallPage free-plan recovery', () => {
	it('shows Free as current while a cancelled checkout is being cleared', () => {
		const navigate = jest.fn();
		(useNavigate as jest.Mock).mockReturnValue(navigate);

		render(
			<PaywallPage
				subscription={{
					status: 'active',
					plan: 'homeowner',
					currentPeriodStart: 0,
					currentPeriodEnd: 0,
					pendingCheckoutPlan: 'homeowner_plus',
					pendingCheckoutStartedAt: 1,
				}}
				currentPlan='homeowner'
				userId='user-123'
				userEmail='owner@example.com'
			/>,
		);

		expect(
			screen.getByRole('button', { name: 'Current Plan' }),
		).toBeDisabled();
	});

	it('keeps plan cards concise while allowing the full feature list to be reviewed', () => {
		(useNavigate as jest.Mock).mockReturnValue(jest.fn());

		render(
			<PaywallPage
				subscription={{
					status: 'active',
					plan: 'homeowner',
					currentPeriodStart: 0,
					currentPeriodEnd: 0,
				}}
				currentPlan='homeowner'
			/>,
		);

		expect(screen.getByText('Basic Record Gap Check')).toBeInTheDocument();
		expect(screen.queryByText('Maintenance History Tracking')).not.toBeInTheDocument();

		const homeownerFeatureToggle = screen
			.getAllByRole('button', { name: 'Show 5 more features' })
			.find(
				(button) =>
					button.getAttribute('aria-controls') === 'homeowner-plan-features',
			);
		expect(homeownerFeatureToggle).toBeDefined();
		fireEvent.click(homeownerFeatureToggle as HTMLButtonElement);

		expect(screen.getByText('Maintenance History Tracking')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Show fewer features' }),
		).toHaveAttribute('aria-expanded', 'true');
	});
});
