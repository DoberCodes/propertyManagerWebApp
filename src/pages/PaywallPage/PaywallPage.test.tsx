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

		expect(screen.getByText('Lightweight Home Record Check')).toBeInTheDocument();
		expect(screen.queryByText('Maintenance History Tracking')).not.toBeInTheDocument();

		const homeownerFeatureToggle = screen
			.getAllByRole('button', { name: 'Show 6 more features' })
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

	it('explains that equivalent paid billing begins after temporary granted access', () => {
		(useNavigate as jest.Mock).mockReturnValue(jest.fn());
		const endsAtMs = Date.now() + 30 * 24 * 60 * 60 * 1000;

		render(
			<PaywallPage
				subscription={{
					status: 'active',
					plan: 'homeowner',
					currentPeriodStart: 0,
					currentPeriodEnd: 0,
					entitlementGrants: [
						{
							grantId: 'grant-1',
							programId: 'trial-program',
							accountId: 'account-1',
							kind: 'temporary',
							state: 'active',
							bundleId: 'homeowner_plus',
							startsAtMs: Date.now() - 1_000,
							endsAtMs,
							source: 'trial',
							transition: {
								mode: 'checkout_required',
								status: 'not_configured',
							},
						},
					],
				}}
				currentPlan='homeowner'
			/>,
		);

		expect(
			screen.getByText(/complimentary Homeowner\+ access continues through/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: 'Continue after complimentary access',
			}),
		).toBeEnabled();
	});

	it('prevents redundant checkout for permanent equivalent access', () => {
		(useNavigate as jest.Mock).mockReturnValue(jest.fn());

		render(
			<PaywallPage
				subscription={{
					status: 'active',
					plan: 'homeowner',
					currentPeriodStart: 0,
					currentPeriodEnd: 0,
					entitlementGrants: [
						{
							grantId: 'grant-lifetime',
							programId: 'lifetime-program',
							accountId: 'account-1',
							kind: 'permanent',
							state: 'active',
							bundleId: 'homeowner_plus',
							startsAtMs: Date.now() - 1_000,
							endsAtMs: null,
							source: 'lifetime',
						},
					],
				}}
				currentPlan='homeowner'
			/>,
		);

		expect(
			screen.getByText(/permanent Homeowner\+ access already includes this plan/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Included permanently' }),
		).toBeDisabled();
	});
});
