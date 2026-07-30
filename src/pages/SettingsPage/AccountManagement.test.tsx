import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { AccountManagement } from './AccountManagement';
import { previewComplimentaryAccessCode } from 'services/complimentaryAccessCodeService';

jest.mock('react-redux', () => ({
	useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
	useNavigate: () => jest.fn(),
}));

jest.mock('utils/platform', () => ({
	isNativeApp: () => false,
}));

jest.mock('services/complimentaryAccessCodeService', () => ({
	complimentaryAccessCodesEnabled: true,
	previewComplimentaryAccessCode: jest.fn(),
	redeemComplimentaryAccessCode: jest.fn(),
}));

describe('AccountManagement complimentary access', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({
				user: {
					currentUser: {
						id: 'user-1',
						accountId: 'user-1',
						isAccountOwner: true,
						role: 'homeowner',
						subscription: {
							plan: 'homeowner',
							status: 'active',
						},
					},
				},
			}),
		);
	});

	test('shows activation only after a successful access review', async () => {
		const user = userEvent.setup();
		(previewComplimentaryAccessCode as jest.Mock).mockResolvedValue({
			label: 'Community partner access',
			durationDays: 30,
			bundleId: 'homeowner_plus',
		});

		render(<AccountManagement setShowCancelSubscriptionModal={jest.fn()} />);

		expect(
			screen.queryByRole('button', { name: /activate complimentary access/i }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /have an access code/i }));
		await user.type(screen.getByPlaceholderText(/enter access code/i), 'ACCESS-CODE-123');
		await user.click(screen.getByRole('button', { name: /review access/i }));

		expect(await screen.findByText('Community partner access')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /activate complimentary access/i }),
		).toBeInTheDocument();
	});
});
