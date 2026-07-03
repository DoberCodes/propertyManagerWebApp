import { act, renderHook, waitFor } from '@testing-library/react';
import {
	listAdminFeedbackTickets,
	updateAdminFeedbackTicketStatus,
} from '../../../services/adminPortalService';
import { ERROR_MESSAGES } from '../constants';
import { useAdminTickets } from './useAdminTickets';
import type { AdminFeedbackTicket } from '../../../services/adminPortalService';

jest.mock('../../../services/adminPortalService', () => ({
	listAdminFeedbackTickets: jest.fn(),
	updateAdminFeedbackTicketStatus: jest.fn(),
}));

const mockedListTickets = listAdminFeedbackTickets as jest.MockedFunction<
	typeof listAdminFeedbackTickets
>;
const mockedUpdateTicket = updateAdminFeedbackTicketStatus as jest.MockedFunction<
	typeof updateAdminFeedbackTicketStatus
>;

const tickets: AdminFeedbackTicket[] = [
	{ id: 'ticket-received', status: 'received', type: 'feedback' },
	{ id: 'ticket-progress', status: 'in_progress', type: 'bug_report' },
	{ id: 'ticket-testing', status: 'resolved', type: 'bug_report' },
	{ id: 'ticket-closed', status: 'closed', type: 'feature_request' },
];

describe('useAdminTickets', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedListTickets.mockResolvedValue(tickets);
		mockedUpdateTicket.mockResolvedValue(undefined);
	});

	it('loads open tickets by default and filters closed tickets on the client', async () => {
		const { result } = renderHook(() => useAdminTickets());

		await act(async () => {
			await result.current.loadTickets('admin-token');
		});

		expect(mockedListTickets).toHaveBeenCalledWith({
			sessionToken: 'admin-token',
			status: undefined,
			type: undefined,
			limit: 200,
		});
		expect(result.current.tickets.map((ticket) => ticket.id)).toEqual([
			'ticket-received',
			'ticket-progress',
			'ticket-testing',
		]);
		expect(result.current.ticketCounts).toEqual({
			received: 1,
			in_progress: 1,
			resolved: 1,
			closed: 0,
		});
	});

	it('loads closed group tickets without sending closed_group to the backend', async () => {
		const { result } = renderHook(() => useAdminTickets());

		await act(async () => {
			await result.current.loadTickets('admin-token', 'closed_group');
		});

		expect(mockedListTickets).toHaveBeenCalledWith({
			sessionToken: 'admin-token',
			status: undefined,
			type: undefined,
			limit: 200,
		});
		expect(result.current.tickets.map((ticket) => ticket.id)).toEqual([
			'ticket-closed',
		]);
	});

	it('passes specific status and type filters to the backend', async () => {
		const { result } = renderHook(() => useAdminTickets());

		await act(async () => {
			await result.current.loadTickets('admin-token', 'resolved', 'bug_report');
		});

		expect(mockedListTickets).toHaveBeenCalledWith({
			sessionToken: 'admin-token',
			status: 'resolved',
			type: 'bug_report',
			limit: 200,
		});
		expect(result.current.tickets).toEqual(tickets);
	});

	it('stores a load error and clears the loading state', async () => {
		mockedListTickets.mockRejectedValueOnce(new Error('Unable to load'));
		const { result } = renderHook(() => useAdminTickets());

		await act(async () => {
			await result.current.loadTickets('admin-token');
		});

		expect(result.current.actionError).toBe('Unable to load');
		expect(result.current.loadingTickets).toBe(false);
		expect(result.current.tickets).toEqual([]);
	});

	it('uses the default load error when the thrown value has no message', async () => {
		mockedListTickets.mockRejectedValueOnce({});
		const { result } = renderHook(() => useAdminTickets());

		await act(async () => {
			await result.current.loadTickets('admin-token');
		});

		expect(result.current.actionError).toBe(ERROR_MESSAGES.LOAD_TICKETS_FAILED);
	});

	it('updates a ticket and reloads with the active filters', async () => {
		const { result } = renderHook(() => useAdminTickets());

		act(() => {
			result.current.setStatusFilter('open');
			result.current.setTypeFilter('bug_report');
		});

		await act(async () => {
			await result.current.handleStatusUpdate(
				'admin-token',
				'ticket-progress',
				'resolved',
				'Internal note',
				'Customer update',
				'bug_report',
			);
		});

		expect(mockedUpdateTicket).toHaveBeenCalledWith({
			sessionToken: 'admin-token',
			ticketId: 'ticket-progress',
			status: 'resolved',
			internalNote: 'Internal note',
			resolutionNotes: 'Customer update',
			type: 'bug_report',
		});
		expect(mockedListTickets).toHaveBeenLastCalledWith({
			sessionToken: 'admin-token',
			status: undefined,
			type: 'bug_report',
			limit: 200,
		});
		expect(result.current.activeTicketId).toBeNull();
		expect(result.current.actionError).toBe('');
	});

	it('records update errors and resets the active ticket id', async () => {
		mockedUpdateTicket.mockRejectedValueOnce(new Error('Update failed'));
		const { result } = renderHook(() => useAdminTickets());

		await act(async () => {
			await result.current.handleStatusUpdate(
				'admin-token',
				'ticket-progress',
				'in_progress',
			);
		});

		await waitFor(() => {
			expect(result.current.actionError).toBe('Update failed');
		});
		expect(result.current.activeTicketId).toBeNull();
		expect(mockedListTickets).not.toHaveBeenCalled();
	});
});
