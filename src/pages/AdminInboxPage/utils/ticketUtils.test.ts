import {
	STATUS_LABELS,
	MAINTLEY_STATUS_UPDATE_MESSAGES,
	normalizeStatusForAdmin,
} from '../constants';
import {
	buildStatusChangeMaintleyUpdate,
	calculateTicketCounts,
	getDisplayTicketNumber,
	groupTicketsForDisplay,
} from './ticketUtils';
import type { AdminFeedbackTicket } from '../../../services/adminPortalService';

describe('admin ticket utilities', () => {
	it('normalizes legacy and unknown statuses into supported admin statuses', () => {
		expect(normalizeStatusForAdmin('reviewed')).toBe('in_progress');
		expect(normalizeStatusForAdmin('in_progress')).toBe('in_progress');
		expect(normalizeStatusForAdmin('resolved')).toBe('resolved');
		expect(normalizeStatusForAdmin('closed')).toBe('closed');
		expect(normalizeStatusForAdmin('unexpected')).toBe('received');
	});

	it('keeps resolved tickets customer-friendly as internally testing instead of closed', () => {
		expect(STATUS_LABELS.resolved).toBe('Internally Testing');
		expect(STATUS_LABELS.closed).toBe('Closed');
	});

	it('counts tickets after normalizing stored status values', () => {
		const tickets: AdminFeedbackTicket[] = [
			{ id: 'ticket-1', status: 'received' },
			{ id: 'ticket-2', status: 'reviewed' },
			{ id: 'ticket-3', status: 'resolved' },
			{ id: 'ticket-4', status: 'closed' },
			{ id: 'ticket-5', status: 'unknown' },
		];

		expect(calculateTicketCounts(tickets)).toEqual({
			received: 2,
			in_progress: 1,
			resolved: 1,
			closed: 1,
		});
	});

	it('builds standardized Maintley updates for status changes', () => {
		expect(buildStatusChangeMaintleyUpdate('in_progress')).toBe(
			MAINTLEY_STATUS_UPDATE_MESSAGES.in_progress,
		);
		expect(buildStatusChangeMaintleyUpdate('resolved')).toBe(
			MAINTLEY_STATUS_UPDATE_MESSAGES.resolved,
		);
		expect(buildStatusChangeMaintleyUpdate('closed')).toBe(
			MAINTLEY_STATUS_UPDATE_MESSAGES.closed,
		);
	});

	it('appends custom Maintley update text without duplicating the standard message', () => {
		expect(buildStatusChangeMaintleyUpdate('resolved', 'Validated on Android.')).toBe(
			`${MAINTLEY_STATUS_UPDATE_MESSAGES.resolved}\n\nValidated on Android.`,
		);
		expect(
			buildStatusChangeMaintleyUpdate(
				'resolved',
				MAINTLEY_STATUS_UPDATE_MESSAGES.resolved,
			),
		).toBe(MAINTLEY_STATUS_UPDATE_MESSAGES.resolved);
	});

	it('uses backend-resolvable ticket numbers with safe fallback', () => {
		expect(getDisplayTicketNumber(' MNT-000018 ', 'ticket-1')).toBe('MNT-000018');
		expect(getDisplayTicketNumber(undefined, ' ticket-1 ')).toBe('ticket-1');
		expect(getDisplayTicketNumber('', '')).toBe('UNKNOWN-TICKET');
	});

	it('groups linked tickets under the primary ticket while preserving display order', () => {
		const tickets: AdminFeedbackTicket[] = [
			{ id: 'primary-1', subject: 'Primary one' },
			{ id: 'child-1', linkedPrimaryTicketId: 'primary-1', subject: 'Child one' },
			{ id: 'primary-2', subject: 'Primary two' },
		];

		expect(groupTicketsForDisplay(tickets)).toEqual([
			{
				primaryTicket: tickets[0],
				tickets: [tickets[0], tickets[1]],
			},
			{
				primaryTicket: tickets[2],
				tickets: [tickets[2]],
			},
		]);
	});
});
