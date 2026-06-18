/**
 * Admin Inbox Page
 * Feedback ticket management and admin controls
 * 
 * Refactored to use extracted components, hooks, utilities, and styles
 */

import React, { useState } from 'react';
import { Shell, Card, SubTitle, ErrorText, TicketList } from './AdminInboxPage.styles';
import {
	AdminHeader,
	AdminStatsRow,
	AdminFilterControls,
	TicketCard,
} from './components';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminTickets } from './hooks/useAdminTickets';
import { useAdminTicketLinking } from './hooks/useAdminTicketLinking';
import { useAdminNotes } from './hooks/useAdminNotes';
import {
	calculateTicketCounts,
	getDisplayTicketNumber,
	groupTicketsForDisplay,
} from './utils/ticketUtils';
import { MESSAGES } from './constants';
import type { TypeOption } from './constants';

export const AdminInboxPage: React.FC = () => {
	const auth = useAdminAuth();
	const tickets = useAdminTickets();
	const ticketLinking = useAdminTicketLinking();
	const notes = useAdminNotes();
	const [showSettingsMenu, setShowSettingsMenu] = useState(false);
	const [selectedTicketByGroup, setSelectedTicketByGroup] = useState<Record<string, string>>({});
	const ticketGroups = React.useMemo(() => groupTicketsForDisplay(tickets.tickets), [tickets.tickets]);
	const visibleTicketCounts = React.useMemo(
		() => calculateTicketCounts(ticketGroups.map((group) => group.primaryTicket)),
		[ticketGroups],
	);

	// Ensure tickets load after auth (must come before early returns per rules of hooks)
	React.useEffect(() => {
		if (auth.sessionToken && !tickets.tickets.length && !tickets.loadingTickets) {
			void tickets.loadTickets(auth.sessionToken, tickets.statusFilter, tickets.typeFilter);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth.sessionToken]);

	React.useEffect(() => {
		const syncSelectedTicketFromHash = () => {
			const marker = '#ticket-';
			const hash = window.location.hash || '';
			const markerIndex = hash.indexOf(marker);
			if (markerIndex === -1) return;

			const ticketId = hash.slice(markerIndex + marker.length).split(/[?&]/)[0];
			if (!ticketId) return;

			const matchingGroup = ticketGroups.find((group) =>
				group.tickets.some((ticket) => String(ticket.id || '') === ticketId),
			);
			if (!matchingGroup) return;

			const groupId = String(matchingGroup.primaryTicket.id || '');
			setSelectedTicketByGroup((prev) =>
				prev[groupId] === ticketId ? prev : { ...prev, [groupId]: ticketId },
			);
		};

		syncSelectedTicketFromHash();
		window.addEventListener('hashchange', syncSelectedTicketFromHash);
		return () => window.removeEventListener('hashchange', syncSelectedTicketFromHash);
	}, [ticketGroups]);

	// Session check loading state
	if (auth.checkingSession) {
		return (
			<Shell>
				<Card>{MESSAGES.CHECKING_SESSION}</Card>
			</Shell>
		);
	}

	// Not authenticated/authorized
	if (!auth.sessionToken || !auth.adminUser) {
		return (
			<Shell>
				<Card>
					<h1 style={{ margin: '0 0 4px', fontSize: '24px', color: '#9a3412' }}>
						Maintley Admin Inbox
					</h1>
					<SubTitle>You do not have permission to access this page.</SubTitle>
				</Card>
			</Shell>
		);
	}

	// Authenticated - show admin inbox
	const handleLinkTicket = async (sourceTicketId: string) => {
		const targetRef = ticketLinking.linkTargetByTicket[sourceTicketId] || '';
		console.log(`[Admin] Initiating link for ticket ${sourceTicketId} to ${targetRef}`);
		
		// Clear any previous errors first
		tickets.setActionError('');
		
		await ticketLinking.handleLinkTicket(
			auth.sessionToken!,
			sourceTicketId,
			targetRef,
			async () => {
				console.log(`[Admin] Refreshing tickets after link...`);
				await tickets.loadTickets(auth.sessionToken!, tickets.statusFilter, tickets.typeFilter);
			},
			(error) => {
				console.error(`[Admin] Link error:`, error);
				tickets.setActionError(error);
			},
		);
	};

	const handleUnlinkTickets = async (ticketIds: string[]) => {
		await ticketLinking.handleUnlinkTickets(
			auth.sessionToken!,
			ticketIds,
			async () => {
				await tickets.loadTickets(auth.sessionToken!, tickets.statusFilter, tickets.typeFilter);
			},
			(error) => {
				tickets.setActionError(error);
			},
		);
	};

	const handleDeleteParentTicket = async (ticketId: string) => {
		await ticketLinking.handleDeleteParentTicket(
			auth.sessionToken!,
			ticketId,
			async () => {
				await tickets.loadTickets(auth.sessionToken!, tickets.statusFilter, tickets.typeFilter);
			},
			(error) => {
				tickets.setActionError(error);
			},
		);
	};

	const handleStatusUpdate = async (
		ticketId: string,
		nextStatus: string,
	) => {
		const ticket = tickets.tickets.find((t) => String(t.id || '') === ticketId);
		const group = ticketGroups.find((g) =>
			g.tickets.some((t) => String(t.id || '') === ticketId),
		);
		const groupId = group?.primaryTicket.id;
		const groupKey = String(groupId || ticketId);
		const resolutionForUpdate = notes.getResolution(groupKey) || undefined;
		await tickets.handleStatusUpdate(
			auth.sessionToken!,
			ticketId,
			nextStatus,
			notes.getNote(groupKey) || undefined,
			resolutionForUpdate,
			String(ticket?.type || 'feedback'),
		);
		notes.updateNote(groupKey, '');
		notes.updateResolution(groupKey, '');
	};

	const handleTypeUpdate = async (ticketId: string, nextType: string) => {
		const ticket = tickets.tickets.find((t) => String(t.id || '') === ticketId);
		const group = ticketGroups.find((g) =>
			g.tickets.some((t) => String(t.id || '') === ticketId),
		);
		const groupId = group?.primaryTicket.id;
		const groupKey = String(groupId || ticketId);
		const resolutionForUpdate = notes.getResolution(groupKey) || undefined;

		await tickets.handleStatusUpdate(
			auth.sessionToken!,
			ticketId,
			String(ticket?.status || 'received'),
			undefined,
			resolutionForUpdate,
			nextType,
		);
	};

	const handleSaveNotes = async (ticketId: string, groupKey: string) => {
		const ticket = tickets.tickets.find((t) => String(t.id || '') === ticketId);
		const currentStatus = String(ticket?.status || 'received');
		await tickets.handleStatusUpdate(
			auth.sessionToken!,
			ticketId,
			currentStatus,
			notes.getNote(groupKey) || undefined,
			undefined,
			String(ticket?.type || 'feedback'),
		);
		notes.updateNote(groupKey, '');
	};

	const handleSendMaintleyUpdate = async (ticketId: string, groupKey: string) => {
		const ticket = tickets.tickets.find((t) => String(t.id || '') === ticketId);
		const currentStatus = String(ticket?.status || 'received');
		const resolutionForUpdate = notes.getResolution(groupKey) || undefined;
		await tickets.handleStatusUpdate(
			auth.sessionToken!,
			ticketId,
			currentStatus,
			undefined,
			resolutionForUpdate,
			String(ticket?.type || 'feedback'),
		);
		notes.updateResolution(groupKey, '');
	};

	const handleStatusFilterChange = async (status: string) => {
		tickets.setStatusFilter(status);
		await tickets.loadTickets(auth.sessionToken!, status, tickets.typeFilter);
		setSelectedTicketByGroup({});
	};

	const handleTypeFilterChange = async (type: TypeOption) => {
		tickets.setTypeFilter(type);
		await tickets.loadTickets(auth.sessionToken!, tickets.statusFilter, type);
		setSelectedTicketByGroup({});
	};

	return (
		<Shell>
			<Card>
				<AdminHeader
					adminUser={auth.adminUser}
					showSettingsMenu={showSettingsMenu}
					isRefreshing={tickets.loadingTickets}
					onRefresh={() =>
						tickets.handleRefresh(auth.sessionToken!)
					}
					onSettingsToggle={() => setShowSettingsMenu(!showSettingsMenu)}
					onLogout={auth.handleLogout}
				/>

				<AdminStatsRow ticketCounts={visibleTicketCounts} />

				<AdminFilterControls
					statusFilter={tickets.statusFilter}
					typeFilter={tickets.typeFilter}
					isLoading={tickets.loadingTickets}
					onStatusChange={handleStatusFilterChange}
					onTypeChange={handleTypeFilterChange}
					// onApplyFilters={() =>
						
					// }
				/>

				{tickets.actionError ? <ErrorText>{tickets.actionError}</ErrorText> : null}
				{tickets.loadingTickets ? <SubTitle>{MESSAGES.LOADING_TICKETS}</SubTitle> : null}

				<TicketList>
					{ticketGroups.map((group) => {
						const groupTicketId = String(group.primaryTicket.id || '');
						const groupTicketIds = new Set(
							group.tickets.map((groupTicket) => String(groupTicket.id || '')),
						);
						const linkableTickets = tickets.tickets.filter(
							(ticket) => !groupTicketIds.has(String(ticket.id || '')),
						);
						const selectedTicketId = selectedTicketByGroup[groupTicketId];
						const displayedTicket =
							group.tickets.find((ticket) => String(ticket.id || '') === selectedTicketId) ||
							group.primaryTicket;
						const displayedTicketId = String(displayedTicket.id || '');
						const ticketAnchorId = `ticket-${groupTicketId}`;
						const isSaving = Boolean(
							tickets.activeTicketId &&
								group.tickets.some(
									(ticket) => String(ticket.id || '') === tickets.activeTicketId,
								),
						);

						return (
							<TicketCard
								key={groupTicketId}
								ticket={displayedTicket}
								ticketNumber={getDisplayTicketNumber(displayedTicket.ticketNumber, displayedTicketId)}
								ticketAnchorId={ticketAnchorId}
								groupTickets={group.tickets}
								linkableTickets={linkableTickets}
								isSaving={isSaving}
								isLinking={ticketLinking.linkingTicketId === groupTicketId}
								isUnlinking={Boolean(ticketLinking.unlinkingTicketId)}
								isDeletingParent={ticketLinking.deletingParentTicketId === groupTicketId}
								noteValue={notes.getNote(groupTicketId)}
								resolutionValue={notes.getResolution(groupTicketId)}
								linkTargetValue={ticketLinking.linkTargetByTicket[groupTicketId] || ''}
								onStatusUpdate={(status) => handleStatusUpdate(displayedTicketId, status)}
									onTypeUpdate={(type) => handleTypeUpdate(displayedTicketId, type)}
								onNoteChange={(value) => notes.updateNote(groupTicketId, value)}
								onResolutionChange={(value) =>
									notes.updateResolution(groupTicketId, value)
								}
								onLinkTargetChange={(value) =>
									ticketLinking.setLinkTargetByTicket((prev) => ({
										...prev,
										[groupTicketId]: value,
									}))
								}
								onLinkTicket={() => handleLinkTicket(groupTicketId)}
								onUnlinkTickets={(ticketIds) => handleUnlinkTickets(ticketIds)}
								onDeleteParentTicket={() => handleDeleteParentTicket(groupTicketId)}
								onSaveInternalNote={() => handleSaveNotes(displayedTicketId, groupTicketId)}
								onSendMaintleyUpdate={() => handleSendMaintleyUpdate(displayedTicketId, groupTicketId)}
							/>
						);
					})}
				</TicketList>
			</Card>
		</Shell>
	);
};
