import { fireEvent, render, screen } from '@testing-library/react';
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

	test('hides inactive coupons until the administrator explicitly shows history', () => {
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({
				adminPortal: {
					billingCoupons: {
						data: [
							{ id: 'active', code: 'CURRENT25', active: true, status: 'active' },
							{ id: 'expired', code: 'OLD25', active: false, status: 'expired' },
						],
						loading: false,
						error: null,
						lastLoadedAt: null,
					},
				},
			}),
		);
		render(<AdminBillingToolsPanel sessionToken='admin-session' />);

		expect(screen.getByText('CURRENT25')).toBeInTheDocument();
		expect(screen.queryByText('OLD25')).not.toBeInTheDocument();
		fireEvent.click(screen.getByLabelText('Show inactive and expired coupons'));
		expect(screen.getByText('OLD25')).toBeInTheDocument();
	});
});
