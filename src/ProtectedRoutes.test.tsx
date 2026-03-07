import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoutes } from './ProtectedRoutes';

const mockDispatch = jest.fn();
let mockState: any;

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selector: any) => selector(mockState),
}));

jest.mock('./Redux/Slices/userSlice', () => ({
	logout: () => ({ type: 'user/logout' }),
}));

jest.mock('./utils/subscriptionUtils', () => ({
	isSubscriptionActive: (subscription: any) =>
		subscription?.status === 'active' || subscription?.status === 'trial',
}));

const renderProtectedRoute = (
	path: string,
	options: { requireSubscription?: boolean; allowExpiredUsers?: boolean } = {},
) => {
	const { requireSubscription = false, allowExpiredUsers = false } = options;

	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route path='/login' element={<div>Login Page</div>} />
				<Route path='/paywall' element={<div>Paywall Page</div>} />
				<Route
					path='/report'
					element={
						<ProtectedRoutes
							requireSubscription={requireSubscription}
							allowExpiredUsers={allowExpiredUsers}>
							<div>Report Page</div>
						</ProtectedRoutes>
					}
				/>
			</Routes>
		</MemoryRouter>,
	);
};

describe('ProtectedRoutes', () => {
	beforeEach(() => {
		mockDispatch.mockClear();
		mockState = {
			user: {
				currentUser: null,
				authLoading: false,
			},
		};
	});

	it('redirects unauthenticated users to login', () => {
		renderProtectedRoute('/report');

		expect(screen.getByText('Login Page')).toBeInTheDocument();
	});

	it('redirects authenticated users without subscription to paywall when required', () => {
		mockState.user.currentUser = {
			id: 'u1',
			email: 'user@test.com',
			role: 'homeowner',
		};

		renderProtectedRoute('/report', { requireSubscription: true });

		expect(screen.getByText('Paywall Page')).toBeInTheDocument();
	});

	it('redirects users with expired subscription when expired access is not allowed', () => {
		mockState.user.currentUser = {
			id: 'u1',
			email: 'user@test.com',
			role: 'homeowner',
			subscription: {
				status: 'expired',
				plan: 'homeowner',
				currentPeriodStart: 1,
				currentPeriodEnd: 1,
			},
		};

		renderProtectedRoute('/report', { requireSubscription: true });

		expect(screen.getByText('Paywall Page')).toBeInTheDocument();
	});

	it('allows users with active subscription when subscription is required', () => {
		mockState.user.currentUser = {
			id: 'u1',
			email: 'user@test.com',
			role: 'homeowner',
			subscription: {
				status: 'active',
				plan: 'homeowner',
				currentPeriodStart: 1,
				currentPeriodEnd: 1,
			},
		};

		renderProtectedRoute('/report', { requireSubscription: true });

		expect(screen.getByText('Report Page')).toBeInTheDocument();
	});

	it('allows expired users when allowExpiredUsers is true', () => {
		mockState.user.currentUser = {
			id: 'u1',
			email: 'user@test.com',
			role: 'homeowner',
			subscription: {
				status: 'expired',
				plan: 'homeowner',
				currentPeriodStart: 1,
				currentPeriodEnd: 1,
			},
		};

		renderProtectedRoute('/report', {
			requireSubscription: true,
			allowExpiredUsers: true,
		});

		expect(screen.getByText('Report Page')).toBeInTheDocument();
	});
});
