import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { useGetMyFeedbackTicketsQuery } from 'Redux/API/apiSlice';
import { SupportPage } from './SupportPage';
import type { MyFeedbackTicket } from 'Redux/API/apiSlice';

jest.mock('Redux/API/apiSlice', () => ({
	useGetMyFeedbackTicketsQuery: jest.fn(),
}));

jest.mock('Components/Library', () => ({
	GenericModal: ({
		isOpen,
		title,
		onClose,
		children,
	}: {
		isOpen: boolean;
		title: string;
		onClose: () => void;
		children: React.ReactNode;
	}) =>
		isOpen ? (
			<div role='dialog' aria-label={title}>
				<h2>{title}</h2>
				<button type='button' title='Close modal' onClick={onClose}>
					Close
				</button>
				{children}
			</div>
		) : null,
}));

jest.mock('Components/FeedbackForm', () => ({
	FeedbackForm: ({ onClose }: { onClose: () => void }) => (
		<button type='button' onClick={onClose}>
			Close mocked support form
		</button>
	),
}));

const mockedUseGetMyFeedbackTicketsQuery =
	useGetMyFeedbackTicketsQuery as jest.Mock;

const renderSupportPage = (
	tickets: MyFeedbackTicket[],
	initialRoute = '/support?view=requests',
) => {
	mockedUseGetMyFeedbackTicketsQuery.mockReturnValue({
		data: tickets,
		isLoading: false,
		isFetching: false,
		error: undefined,
		refetch: jest.fn(),
	});

	const store = configureStore({
		reducer: {
			user: () => ({
				currentUser: {
					id: 'user-1',
					email: 'owner@example.com',
					maintley_role: null,
				},
			}),
		},
	});

	return render(
		<Provider store={store}>
			<MemoryRouter
				initialEntries={[initialRoute]}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<SupportPage />
			</MemoryRouter>
		</Provider>,
	);
};

describe('SupportPage customer tickets', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows resolved tickets as testing fix and only displays customer-visible Maintley updates', () => {
		renderSupportPage([
			{
				id: 'ticket-testing',
				ticketNumber: 'MNT-000018',
				type: 'bug_report',
				subject: 'Profile picture not showing',
				message: 'The profile picture is not displaying.',
				status: 'resolved',
				publicStatus: 'testing',
				createdAt: '2026-06-30T12:00:00.000Z',
				updatedAt: '2026-06-30T13:00:00.000Z',
				adminNotes: [
					{
						note: 'Internal stack trace and deployment note.',
						createdAt: '2026-06-30T13:05:00.000Z',
						noteType: 'internal',
						visibility: 'internal',
					},
					{
						note: 'We implemented a fix and are completing final testing.',
						createdAt: '2026-06-30T13:10:00.000Z',
						noteType: 'maintley_update',
						visibility: 'customer',
					},
				],
			},
		]);

		const ticket = screen
			.getByText('Profile picture not showing')
			.closest('article, section, div');

		expect(screen.getByText('Testing Fix')).toBeInTheDocument();
		expect(screen.queryByText('Closed')).not.toBeInTheDocument();
		expect(screen.getAllByText(/Latest Maintley update/i).length).toBeGreaterThan(0);
		expect(
			screen.getByText('We implemented a fix and are completing final testing.'),
		).toBeInTheDocument();
		expect(screen.queryByText('Internal stack trace and deployment note.')).not.toBeInTheDocument();
		expect(ticket).toBeTruthy();
	});

	it('only places truly closed tickets in the closed request list', async () => {
		const user = userEvent.setup();
		renderSupportPage([
			{
				id: 'ticket-testing',
				ticketNumber: 'MNT-000018',
				type: 'bug_report',
				subject: 'Testing ticket',
				message: 'Still being tested.',
				status: 'resolved',
				publicStatus: 'testing',
				createdAt: '2026-06-30T12:00:00.000Z',
			},
			{
				id: 'ticket-closed',
				ticketNumber: 'MNT-000019',
				type: 'feature_request',
				subject: 'Closed ticket',
				message: 'This ticket is closed.',
				status: 'closed',
				publicStatus: 'closed',
				createdAt: '2026-06-29T12:00:00.000Z',
				closedAt: '2026-06-30T12:00:00.000Z',
			},
		]);

		expect(screen.getByText('Testing ticket')).toBeInTheDocument();
		expect(screen.queryByText('Closed ticket')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /open \(1\)/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /closed \(1\)/i })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /closed \(1\)/i }));

		expect(screen.getByText('Closed ticket')).toBeInTheDocument();
		expect(screen.queryByText('Testing ticket')).not.toBeInTheDocument();

		expect(screen.getByText('Closed')).toBeInTheDocument();
	});
});
