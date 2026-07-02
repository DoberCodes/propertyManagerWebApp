/**
 * Ticket Utilities
 * Handles ticket calculations and transformations
 */

import { AdminFeedbackTicket } from '../../../services/adminPortalService';
import {
	StatusOption,
	DEFAULT_TICKET_COUNTS,
	MAINTLEY_STATUS_UPDATE_MESSAGES,
	normalizeStatusForAdmin,
} from '../constants';

export interface AdminTicketGroup {
	primaryTicket: AdminFeedbackTicket;
	tickets: AdminFeedbackTicket[];
}

/**
 * Calculate count of tickets by status
 *
 * @param tickets - Array of feedback tickets
 * @returns Object with count of each status
 */
export const calculateTicketCounts = (
	tickets: AdminFeedbackTicket[],
): Record<StatusOption, number> => {
	const counts = { ...DEFAULT_TICKET_COUNTS };

	for (const ticket of tickets) {
		const status = normalizeStatusForAdmin(ticket.status) as StatusOption;
		counts[status] += 1;
	}

	return counts;
};

/**
 * Generate display ticket number with fallback
 *
 * The returned value must be something the backend can resolve when pasted back
 * into the link field. If no ticket number exists yet, fall back to the raw
 * Firestore document ID instead of fabricating a synthetic code.
 *
 * @param ticketNumber - Stored ticket number
 * @param ticketId - Document ID fallback source
 * @returns Backend-resolvable ticket reference
 */
export const getDisplayTicketNumber = (ticketNumber: string | undefined, ticketId: string): string => {
	const rawTicketNumber = String(ticketNumber || '').trim();
	const rawTicketId = String(ticketId || '').trim();
	return rawTicketNumber || rawTicketId || 'UNKNOWN-TICKET';
};

export const buildStatusChangeMaintleyUpdate = (
	nextStatus: string,
	customUpdate?: string,
): string | undefined => {
	const normalizedStatus = normalizeStatusForAdmin(nextStatus);
	const standardUpdate = MAINTLEY_STATUS_UPDATE_MESSAGES[normalizedStatus];
	const trimmedCustomUpdate = String(customUpdate || '').trim();

	if (!standardUpdate) return trimmedCustomUpdate || undefined;
	if (!trimmedCustomUpdate) return standardUpdate;
	if (trimmedCustomUpdate === standardUpdate) return standardUpdate;

	return `${standardUpdate}\n\n${trimmedCustomUpdate}`;
};

export const groupTicketsForDisplay = (
	tickets: AdminFeedbackTicket[],
): AdminTicketGroup[] => {
	const ticketOrder = new Map<string, number>();
	tickets.forEach((ticket, index) => {
		ticketOrder.set(String(ticket.id || ''), index);
	});

	const groups = new Map<string, AdminFeedbackTicket[]>();
	for (const ticket of tickets) {
		const ticketId = String(ticket.id || '').trim();
		if (!ticketId) continue;

		const primaryTicketId = String(ticket.linkedPrimaryTicketId || ticketId).trim() || ticketId;
		const existing = groups.get(primaryTicketId) || [];
		existing.push(ticket);
		groups.set(primaryTicketId, existing);
	}

	return [...groups.entries()]
		.map(([primaryTicketId, groupTickets]) => {
			const primaryTicket =
				groupTickets.find((ticket) => String(ticket.id || '') === primaryTicketId) ||
				groupTickets[0];

			const sortedTickets = [...groupTickets].sort((left, right) => {
				if (String(left.id || '') === String(primaryTicket.id || '')) return -1;
				if (String(right.id || '') === String(primaryTicket.id || '')) return 1;

				return (
					(ticketOrder.get(String(left.id || '')) || 0) -
					(ticketOrder.get(String(right.id || '')) || 0)
				);
			});

			return {
				primaryTicket,
				tickets: sortedTickets,
			};
		})
		.sort((left, right) => {
			return (
				(ticketOrder.get(String(left.primaryTicket.id || '')) || 0) -
				(ticketOrder.get(String(right.primaryTicket.id || '')) || 0)
			);
		});
};
