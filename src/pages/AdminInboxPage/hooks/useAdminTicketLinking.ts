/**
 * useAdminTicketLinking Hook
 * Manages ticket linking state and operations
 */

import { useState } from 'react';
import {
	linkAdminFeedbackTickets,
	unlinkAdminFeedbackTicket,
	deleteAdminFeedbackParentTicket,
} from '../../../services/adminPortalService';
import { ERROR_MESSAGES } from '../constants';

export interface UseAdminTicketLinkingReturn {
	linkingTicketId: string | null;
	unlinkingTicketId: string | null;
	deletingParentTicketId: string | null;
	linkTargetByTicket: Record<string, string>;
	setLinkTargetByTicket: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
	handleLinkTicket: (
		sessionToken: string,
		sourceTicketId: string,
		targetTicketRef: string,
		onRefresh: () => Promise<void>,
		onError: (error: string) => void,
	) => Promise<void>;
	handleUnlinkTickets: (
		sessionToken: string,
		ticketIds: string[],
		onRefresh: () => Promise<void>,
		onError: (error: string) => void,
	) => Promise<void>;
	handleDeleteParentTicket: (
		sessionToken: string,
		ticketId: string,
		onRefresh: () => Promise<void>,
		onError: (error: string) => void,
	) => Promise<void>;
}

export const useAdminTicketLinking = (): UseAdminTicketLinkingReturn => {
	const [linkingTicketId, setLinkingTicketId] = useState<string | null>(null);
	const [unlinkingTicketId, setUnlinkingTicketId] = useState<string | null>(null);
	const [deletingParentTicketId, setDeletingParentTicketId] = useState<string | null>(null);
	const [linkTargetByTicket, setLinkTargetByTicketState] = useState<Record<string, string>>({});

	// Wrapper to handle both function and value forms like React.useState
	const setLinkTargetByTicket = (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
		if (typeof value === 'function') {
			setLinkTargetByTicketState(value);
		} else {
			setLinkTargetByTicketState(value);
		}
	};

	const handleLinkTicket = async (
		sessionToken: string,
		sourceTicketId: string,
		targetTicketRef: string,
		onRefresh: () => Promise<void>,
		onError: (error: string) => void,
	) => {
		const trimmedRef = String(targetTicketRef).trim();
		if (!trimmedRef) {
			onError(ERROR_MESSAGES.LINK_TICKET_EMPTY);
			return;
		}

		setLinkingTicketId(sourceTicketId);
		try {
			await linkAdminFeedbackTickets({
				sessionToken,
				sourceTicketId,
				targetTicketRef: trimmedRef,
			});
			
			// Clear the input field for this ticket immediately
			setLinkTargetByTicketState((prev) => ({ ...prev, [sourceTicketId]: '' }));
			
			// Refresh ticket data to show linked tickets
			await onRefresh();
		} catch (error: any) {
			const errorMsg = error?.message || ERROR_MESSAGES.LINK_TICKET_FAILED;
			console.error(`[LinkTicket] Error:`, error);
			onError(errorMsg);
		} finally {
			setLinkingTicketId(null);
		}
	};

	const handleUnlinkTickets = async (
		sessionToken: string,
		ticketIds: string[],
		onRefresh: () => Promise<void>,
		onError: (error: string) => void,
	) => {
		const normalizedIds = [...new Set(ticketIds.map((id) => String(id || '').trim()).filter(Boolean))];
		if (normalizedIds.length === 0) {
			onError('Select at least one linked ticket to unlink.');
			return;
		}

		setUnlinkingTicketId(normalizedIds[0]);
		try {
			for (const ticketId of normalizedIds) {
				await unlinkAdminFeedbackTicket({
					sessionToken,
					ticketId,
				});
			}
			await onRefresh();
		} catch (error: any) {
			onError(error?.message || 'Failed to unlink ticket.');
		} finally {
			setUnlinkingTicketId(null);
		}
	};

	const handleDeleteParentTicket = async (
		sessionToken: string,
		ticketId: string,
		onRefresh: () => Promise<void>,
		onError: (error: string) => void,
	) => {
		setDeletingParentTicketId(ticketId);
		try {
			await deleteAdminFeedbackParentTicket({
				sessionToken,
				ticketId,
			});
			await onRefresh();
		} catch (error: any) {
			onError(error?.message || 'Failed to delete parent ticket.');
		} finally {
			setDeletingParentTicketId(null);
		}
	};

	return {
		linkingTicketId,
		unlinkingTicketId,
		deletingParentTicketId,
		linkTargetByTicket,
		setLinkTargetByTicket,
		handleLinkTicket,
		handleUnlinkTickets,
		handleDeleteParentTicket,
	};
};
