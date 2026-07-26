import { render, screen } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { adminPortalListComplimentaryAccessCodes } from '../../../services/adminPortalService';
import { AdminBillingToolsPanel } from './AdminBillingToolsPanel';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn(),
	useSelector: jest.fn(),
}));

jest.mock('../../../services/adminPortalService', () => ({
	adminPortalCreateBillingCoupon: jest.fn(),
	adminPortalCreateComplimentaryAccessCode: jest.fn(),
	adminPortalListComplimentaryAccessCodes: jest.fn(),
}));

describe('AdminBillingToolsPanel', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useDispatch as unknown as jest.Mock).mockReturnValue(jest.fn());
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({
				adminPortal: {
					billingCoupons: {
						data: [],
						loading: false,
						error: null,
						lastLoadedAt: null,
					},
				},
			}),
		);
	});

	test('keeps Stripe coupons and complimentary access codes collapsed by default', () => {
		render(<AdminBillingToolsPanel sessionToken='admin-session' />);

		const stripeSection = screen.getByText('Stripe Coupons').closest('details');
		const accessSection = screen.getByText('Complimentary Access Codes').closest('details');

		expect(stripeSection).not.toHaveAttribute('open');
		expect(accessSection).not.toHaveAttribute('open');
		expect(adminPortalListComplimentaryAccessCodes).not.toHaveBeenCalled();
	});
});
