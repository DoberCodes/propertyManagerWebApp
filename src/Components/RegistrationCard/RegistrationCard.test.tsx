import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegistrationCard } from './RegistrationCard';

jest.mock('react-redux', () => ({
	useDispatch: () => jest.fn(),
}));

jest.mock('../../services/authService', () => ({
	signUpWithEmail: jest.fn(),
	checkEmailExists: jest.fn().mockResolvedValue(false),
	validateTenantInviteForRegistration: jest.fn().mockResolvedValue(false),
	validateTeamInviteForRegistration: jest.fn().mockResolvedValue({ valid: false }),
}));

jest.mock('../../services/complimentaryAccessCodeService', () => ({
	complimentaryAccessCodesEnabled: true,
	previewComplimentaryAccessCode: jest.fn(),
	redeemComplimentaryAccessCode: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
	auth: { currentUser: null },
}));

jest.mock('../../pages/PaywallPage/PaywallPage', () => ({
	PaywallPage: () => <div>Plan selection</div>,
}));

describe('RegistrationCard complimentary access', () => {
	test('offers a separate optional complimentary access-code field', async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<RegistrationCard />
			</MemoryRouter>,
		);

		await user.type(screen.getByPlaceholderText('First Name *'), 'Jamie');
		await user.type(screen.getByPlaceholderText('Last Name *'), 'Homeowner');
		await user.click(screen.getByRole('button', { name: /^next$/i }));

		expect(screen.getByText('Have a complimentary access code?')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText('Complimentary access code')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /enter access code/i }));
		expect(screen.getByPlaceholderText('Complimentary access code')).toBeInTheDocument();
		expect(screen.getByText(/separate from a Stripe coupon/i)).toBeInTheDocument();
	});
});
