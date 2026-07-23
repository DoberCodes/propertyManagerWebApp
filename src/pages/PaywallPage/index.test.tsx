import { render, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import PaywallPageIndex from './index';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { callFirebaseFunction } from '../../config/firebaseFunctions';

jest.mock('react-redux', () => ({
	useDispatch: jest.fn(),
	useSelector: jest.fn(),
}));

jest.mock('../../Redux/API/userSlice', () => ({
	useUpdateUserMutation: jest.fn(),
}));

jest.mock('../../config/firebaseFunctions', () => ({
	callFirebaseFunction: jest.fn(),
}));

jest.mock('./PaywallPage', () => () => <div>Plans</div>);

describe('Paywall checkout cancellation', () => {
	it('clears pending checkout from user and family account subscriptions', async () => {
		const dispatch = jest.fn();
		const unwrap = jest.fn().mockResolvedValue({});
		const updateUser = jest.fn().mockReturnValue({ unwrap });
		const user = {
			id: 'user-123',
			accountId: 'account-123',
			email: 'owner@example.com',
			subscription: {
				status: 'active',
				plan: 'homeowner',
				currentPeriodStart: 1,
				currentPeriodEnd: 2,
				pendingCheckoutPlan: 'homeowner_plus',
				pendingCheckoutStartedAt: 3,
				promoCode: 'FOUNDER2',
			},
		};

		(useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({ user: { currentUser: user } }),
		);
		(useUpdateUserMutation as jest.Mock).mockReturnValue([updateUser]);
		(callFirebaseFunction as jest.Mock).mockResolvedValue({ data: {} });

		render(
			<MemoryRouter initialEntries={['/paywall?checkout=cancelled']}>
				<PaywallPageIndex />
			</MemoryRouter>,
		);

		const confirmedSubscription = {
			status: 'active',
			plan: 'homeowner',
			currentPeriodStart: 1,
			currentPeriodEnd: 2,
			promoCode: 'FOUNDER2',
		};
		await waitFor(() =>
			expect(callFirebaseFunction).toHaveBeenCalledWith(
				'ensureFamilyAccount',
				{
					accountId: 'account-123',
					syncSubscription: true,
					subscription: confirmedSubscription,
				},
			),
		);
		expect(updateUser).toHaveBeenCalledWith({
			id: 'user-123',
			updates: { subscription: confirmedSubscription },
		});
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					subscription: confirmedSubscription,
				}),
			}),
		);
	});
});
