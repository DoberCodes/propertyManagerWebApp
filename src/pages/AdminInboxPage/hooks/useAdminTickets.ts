/**
 * useAdminTickets Hook
 * Manages ticket loading, filtering, and status updates
 */

import { useMemo, useState } from 'react';
import {
	AdminFeedbackTicket,
	listAdminFeedbackTickets,
	updateAdminFeedbackTicketStatus,
} from '../../../services/adminPortalService';
import { ERROR_MESSAGES } from '../constants';
import { calculateTicketCounts } from '../utils/ticketUtils';
import type { TypeOption } from '../constants';

export interface UseAdminTicketsReturn {
	tickets: AdminFeedbackTicket[];
	loadingTickets: boolean;
	statusFilter: string;
	typeFilter: TypeOption;
	actionError: string;
	activeTicketId: string | null;
	ticketCounts: Record<string, number>;
	setStatusFilter: (value: string) => void;
	setTypeFilter: (value: TypeOption) => void;
	setActionError: (value: string) => void;
	loadTickets: (token: string, status?: string, type?: string) => Promise<void>;
	handleRefresh: (token: string) => Promise<void>;
	handleApplyFilters: (token: string) => Promise<void>;
	handleStatusUpdate: (
		token: string,
		ticketId: string,
		nextStatus: string,
		internalNote?: string,
		resolutionNotes?: string,
		nextType?: string,
	) => Promise<void>;
}

export const useAdminTickets = (): UseAdminTicketsReturn => {
	const [tickets, setTickets] = useState<AdminFeedbackTicket[]>([]);
	const [loadingTickets, setLoadingTickets] = useState(false);
	const [statusFilter, setStatusFilter] = useState('');
	const [typeFilter, setTypeFilter] = useState<TypeOption>('all');
	const [actionError, setActionError] = useState('');
	const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

	const isClosedLikeStatus = (value: string): boolean => {
		const normalized = String(value || '').trim().toLowerCase();
		return normalized === 'closed';
	};

	const applyClientStatusFilter = (
		list: AdminFeedbackTicket[],
		statusValue: string,
	): AdminFeedbackTicket[] => {
		if (!statusValue || statusValue === 'open') {
			return list.filter((ticket) => !isClosedLikeStatus(String(ticket.status || '')));
		}

		if (statusValue === 'closed_group') {
			return list.filter((ticket) => isClosedLikeStatus(String(ticket.status || '')));
		}

		return list;
	};

	const loadTickets = async (token: string, status?: string, type?: string) => {
		setLoadingTickets(true);
		setActionError('');
		try {
			const requestedStatus = String(status || '').trim().toLowerCase();
			const statusForApi =
				requestedStatus && requestedStatus !== 'open' && requestedStatus !== 'closed_group'
					? requestedStatus
					: undefined;

			const list = await listAdminFeedbackTickets({
				sessionToken: token,
				status: statusForApi,
				type: type && type !== 'all' ? type : undefined,
				limit: 200,
			});
			setTickets(applyClientStatusFilter(list, requestedStatus));
		} catch (error: any) {
			setActionError(error?.message || ERROR_MESSAGES.LOAD_TICKETS_FAILED);
		} finally {
			setLoadingTickets(false);
		}
	};

	const handleRefresh = async (token: string) => {
		await loadTickets(token, statusFilter, typeFilter);
	};

	const handleApplyFilters = async (token: string) => {
		await loadTickets(token, statusFilter, typeFilter);
	};

	const handleStatusUpdate = async (
		token: string,
		ticketId: string,
		nextStatus: string,
		internalNote?: string,
		resolutionNotes?: string,
		nextType?: string,
	) => {
		setActionError('');
		setActiveTicketId(ticketId);
		try {
			await updateAdminFeedbackTicketStatus({
				sessionToken: token,
				ticketId,
				status: nextStatus,
				internalNote,
				resolutionNotes,
				type: nextType,
			});
			await loadTickets(token, statusFilter, typeFilter);
		} catch (error: any) {
			setActionError(error?.message || ERROR_MESSAGES.UPDATE_TICKET_FAILED);
		} finally {
			setActiveTicketId(null);
		}
	};

	const ticketCounts = useMemo(() => calculateTicketCounts(tickets), [tickets]);

	return {
		tickets,
		loadingTickets,
		statusFilter,
		typeFilter,
		actionError,
		activeTicketId,
		ticketCounts,
		setStatusFilter,
		setTypeFilter,
		setActionError,
		loadTickets,
		handleRefresh,
		handleApplyFilters,
		handleStatusUpdate,
	};
};
