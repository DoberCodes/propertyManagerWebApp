import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegistrationPage } from './RegistrationPage';

jest.mock('react-redux', () => ({
	useSelector: jest.fn(),
}));

jest.mock('../../utils/platform', () => ({
	isNativeApp: () => false,
}));

jest.mock('../../Components/LoadingState', () => ({
	LoadingState: ({ title }: { title?: string }) => <div>{title}</div>,
}));

jest.mock('../../Components/RegistrationCard/RegistrationCard', () => ({
	RegistrationCard: () => <div>Registration form</div>,
}));

describe('RegistrationPage checkout gate', () => {
	it('does not enter the app while a paid checkout is pending', () => {
		(useSelector as unknown as jest.Mock).mockImplementation((selector) =>
			selector({
				user: {
					authLoading: false,
					currentUser: {
						id: 'user-123',
						role: 'admin',
						subscription: {
							status: 'active',
							plan: 'homeowner',
							pendingCheckoutPlan: 'homeowner_plus',
						},
					},
				},
			}),
		);

		render(
			<MemoryRouter
				initialEntries={['/registration']}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
			>
				<Routes>
					<Route path="/registration" element={<RegistrationPage />} />
					<Route
						path="/checkout/start"
						element={<div>Checkout start page</div>}
					/>
				</Routes>
			</MemoryRouter>,
		);

		expect(screen.getByText('Checkout start page')).toBeInTheDocument();
		expect(screen.queryByText('Registration form')).not.toBeInTheDocument();
	});
});
