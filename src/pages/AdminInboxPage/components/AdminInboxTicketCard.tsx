/**
 * TicketCard Component
 * Displays a feedback ticket with status controls, notes, and linking UI
 */

import React from 'react';
import {
	TicketCard as TicketCardContainer,
	TicketHeader,
	TicketTitle,
	TicketMeta,
	AttachmentSection,
	AttachmentLabel,
	AttachmentList,
	AttachmentItem,
	AttachmentLink,
	SecondaryButton,
	ActionGroup,
	NotesStack,
	NoteField,
	NoteComposerRow,
	NotesTabList,
	NotesTabButton,
	NoteTabPanel,
	SaveNotesButton,
	NoteHistory,
	NoteHistoryLabel,
	NoteHistoryItem,
	NoteHistoryText,
	NoteHistoryMeta,
	Label,
	TextArea,
	HiddenTicketAnchor,
	TicketHeaderMain,
	CaseGroupSummaryRow,
	CaseGroupSummaryText,
} from '../AdminInboxPage.styles';
import { AdminFeedbackTicket } from '../../../services/adminPortalService';
import {
	STATUS_LABELS,
	normalizeStatusForAdmin,
	TYPE_OPTIONS,
	TYPE_LABELS,
} from '../constants';
import { normalizeAttachment } from '../utils/attachmentUtils';
import { getDisplayTicketNumber } from '../utils/ticketUtils';
import { AdminTicketEditDialog } from './AdminTIcketEditDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';

interface TicketCardProps {
	ticket: AdminFeedbackTicket;
	ticketNumber: string;
	ticketAnchorId: string;
	groupTickets: AdminFeedbackTicket[];
	linkableTickets: AdminFeedbackTicket[];
	isSaving: boolean;
	isLinking: boolean;
	isUnlinking: boolean;
	isDeletingParent: boolean;
	noteValue: string;
	resolutionValue: string;
	linkTargetValue: string;
	onStatusUpdate: (status: string) => Promise<void>;
	onTypeUpdate: (type: string) => Promise<void>;
	onNoteChange: (value: string) => void;
	onResolutionChange: (value: string) => void;
	onLinkTargetChange: (value: string) => void;
	onLinkTicket: () => Promise<void>;
	onUnlinkTickets: (ticketIds: string[]) => Promise<void>;
	onDeleteParentTicket: () => Promise<void>;
	onSaveInternalNote: () => Promise<void>;
	onSendMaintleyUpdate: () => Promise<void>;
}

export const TicketCard: React.FC<TicketCardProps> = ({
	ticket,
	ticketNumber,
	ticketAnchorId,
	groupTickets,
	linkableTickets,
	isSaving,
	isLinking,
	isUnlinking,
	isDeletingParent,
	noteValue,
	resolutionValue,
	linkTargetValue,
	onStatusUpdate,
	onTypeUpdate,
	onNoteChange,
	onResolutionChange,
	onLinkTargetChange,
	onLinkTicket,
	onUnlinkTickets,
	onDeleteParentTicket,
	onSaveInternalNote,
	onSendMaintleyUpdate,
}) => {
	type HistoryFilter = 'all' | 'internal' | 'maintley';
	type HistoryEntry = {
		id: string;
		note: string;
		createdAt: string;
		adminUsername?: string;
		noteType: 'internal' | 'maintley_update';
		sourceTicketNumbers: string[];
	};

	const ticketId = String(ticket.id || '');
	const status = normalizeStatusForAdmin(ticket.status);
	const ticketType = String(ticket.type || 'feedback').trim().toLowerCase();
	const editableTypeOptions = TYPE_OPTIONS.filter((typeOption) => typeOption !== 'all');
	const normalizedTicketType = editableTypeOptions.includes(ticketType as any)
		? ticketType
		: 'feedback';
	const attachments = Array.isArray(ticket.attachments) ? (ticket.attachments as unknown[]) : [];
	const submissionContext =
		ticket.submissionContext && typeof ticket.submissionContext === 'object'
			? (ticket.submissionContext as Record<string, unknown>)
			: null;
	const primaryTicketId = String(groupTickets[0]?.id || ticketId);
	const caseTicketCount = groupTickets.length - 1; // Exclude the parent ticket from the count
	const primaryTicket =
		groupTickets.find((groupTicket) => String(groupTicket.id || '') === primaryTicketId) || ticket;
	const connectedTickets = groupTickets.filter(
		(groupTicket) => String(groupTicket.id || '') !== primaryTicketId,
	);
	const [activeNotesTab, setActiveNotesTab] = React.useState<'internal' | 'maintly'>('internal');
	const [historyFilter, setHistoryFilter] = React.useState<HistoryFilter>('all');
	const [isLinkInputFocused, setIsLinkInputFocused] = React.useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [selectedUnlinkTicketIds, setSelectedUnlinkTicketIds] = React.useState<string[]>([]);
	const isPrimaryGroupTicket = Boolean(primaryTicket.isGroupTicket) || Boolean(primaryTicket.isLinkedPrimary);
	const linkedChildIds = React.useMemo(
		() => connectedTickets.map((groupTicket) => String(groupTicket.id || '')).filter(Boolean),
		[connectedTickets],
	);
	const canDeleteParentTicket = isPrimaryGroupTicket && linkedChildIds.length === 0;
	const existingGroupResolutionValue = groupTickets
		.map((groupTicket) => String(groupTicket.resolutionNotes || '').trim())
		.find(Boolean) || '';
	const effectiveResolutionValue =
		resolutionValue.trim() || String(ticket.resolutionNotes || '').trim() || existingGroupResolutionValue;
	const linkSearchQuery = String(linkTargetValue || '').trim().toLowerCase();

	const historyEntries = React.useMemo<HistoryEntry[]>(() => {
		const sourceTickets = isPrimaryGroupTicket ? groupTickets : [ticket];
		const primaryTicketNumber = getDisplayTicketNumber(primaryTicket.ticketNumber, primaryTicketId);
		const groupedEntries = new Map<
			string,
			{
				note: string;
				createdAt: string;
				adminUsername?: string;
				noteType: HistoryEntry['noteType'];
				sourceTicketNumbers: Set<string>;
				hasPrimarySource: boolean;
			}
		>();

		for (const sourceTicket of sourceTickets) {
			const sourceTicketId = String(sourceTicket.id || '').trim();
			if (!sourceTicketId) continue;

			const sourceTicketNumber = getDisplayTicketNumber(sourceTicket.ticketNumber, sourceTicketId);
			const sourceEntries = Array.isArray(sourceTicket.adminNotes) ? sourceTicket.adminNotes : [];

			for (const [index, entry] of sourceEntries.entries()) {
				const note = String(entry.note || '').trim();
				if (!note) continue;

				const createdAt = String(entry.createdAt || '');
				const adminUserId = String(entry.adminUserId || '').trim();
				const adminUsername = String(entry.adminUsername || '').trim() || undefined;
				const rawType = String(entry.noteType || entry.visibility || '').trim().toLowerCase();
				const noteType: HistoryEntry['noteType'] =
					rawType === 'maintley_update' || rawType === 'customer'
						? 'maintley_update'
						: 'internal';

				const dedupeKey = createdAt
					? [noteType, createdAt, adminUserId, adminUsername || '', note].join('|')
					: [noteType, adminUserId, adminUsername || '', note, sourceTicketId, String(index)].join('|');

				const existing = groupedEntries.get(dedupeKey);
				if (existing) {
					existing.sourceTicketNumbers.add(sourceTicketNumber);
					existing.hasPrimarySource = existing.hasPrimarySource || sourceTicketId === primaryTicketId;
					continue;
				}

				groupedEntries.set(dedupeKey, {
					note,
					createdAt,
					adminUsername,
					noteType,
					sourceTicketNumbers: new Set([sourceTicketNumber]),
					hasPrimarySource: sourceTicketId === primaryTicketId,
				});
			}
		}

		return [...groupedEntries.values()]
			.map((entry, index) => {
				const sourceTicketNumbers =
					isPrimaryGroupTicket && (entry.hasPrimarySource || entry.sourceTicketNumbers.size > 1)
						? [primaryTicketNumber]
						: [...entry.sourceTicketNumbers];

				return {
					id: `${entry.noteType}-${entry.createdAt || 'no-date'}-${index}`,
					note: entry.note,
					createdAt: entry.createdAt,
					adminUsername: entry.adminUsername,
					noteType: entry.noteType,
					sourceTicketNumbers,
				};
			})
			.sort((left, right) => {
				const leftTime = Date.parse(left.createdAt || '') || 0;
				const rightTime = Date.parse(right.createdAt || '') || 0;
				return rightTime - leftTime;
			});
	}, [groupTickets, isPrimaryGroupTicket, primaryTicket, primaryTicketId, ticket]);

	const filteredHistoryEntries = React.useMemo(() => {
		if (historyFilter === 'all') return historyEntries;
		if (historyFilter === 'maintley') {
			return historyEntries.filter((entry) => entry.noteType === 'maintley_update');
		}
		return historyEntries.filter((entry) => entry.noteType === 'internal');
	}, [historyEntries, historyFilter]);

	const linkSuggestions = React.useMemo(() => {
		const dedupedBySuggestionKey = new Map<
			string,
			{ reference: string; rank: number }
		>();

		for (const candidate of linkableTickets) {
			const candidateId = String(candidate.id || '').trim();
			if (!candidateId) continue;

			const canonicalTicketId =
				String((candidate as Record<string, unknown>).linkedPrimaryTicketId || '').trim() ||
				candidateId;
			const rawTicketNumber = String(candidate.ticketNumber || '').trim();
			const suggestionKey = rawTicketNumber
				? `ticket-number:${rawTicketNumber.toLowerCase()}`
				: `ticket-id:${canonicalTicketId.toLowerCase()}`;
			const reference = getDisplayTicketNumber(candidate.ticketNumber, candidateId);

			const searchableText = reference.toLowerCase();

			if (linkSearchQuery && !searchableText.includes(linkSearchQuery)) {
				continue;
			}

			// Prefer entries with official ticket numbers over plain document-id fallbacks.
			const rank = rawTicketNumber ? 2 : 1;
			const existing = dedupedBySuggestionKey.get(suggestionKey);
			if (!existing || rank > existing.rank) {
				dedupedBySuggestionKey.set(suggestionKey, {
					reference,
					rank,
				});
			}
		}

		return [...dedupedBySuggestionKey.values()]
			.map(({ reference }) => ({ reference }))
			.slice(0, 12);
	}, [linkableTickets, linkSearchQuery]);

	const showLinkSuggestions = isLinkInputFocused && linkSuggestions.length > 0;

	React.useEffect(() => {
		setSelectedUnlinkTicketIds((prev) => {
			const next = prev.filter((id) => linkedChildIds.includes(id));
			if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
				return prev;
			}
			return next;
		});
	}, [linkedChildIds]);

	const handleStatusChange = (nextStatus: string) => {
		if (nextStatus === status) return;
		if ((nextStatus === 'resolved' || nextStatus === 'closed') && !effectiveResolutionValue) {
			window.alert('Maintley Update is required before setting status to Resolved or Closed.');
			return;
		}
		void onStatusUpdate(nextStatus);
	};

	const handleLinkClick = () => {
		void onLinkTicket();
	};

	const handleUnlinkSelectedClick = () => {
		if (selectedUnlinkTicketIds.length === 0) return;
		void onUnlinkTickets(selectedUnlinkTicketIds);
		setSelectedUnlinkTicketIds([]);
	};

	const handleDeleteParentClick = () => {
		const confirmed = window.confirm(
			'Delete this parent ticket? This cannot be undone.',
		);
		if (!confirmed) return;
		void onDeleteParentTicket();
	};

	const handleTypeChange = (nextType: string) => {
		if (nextType === normalizedTicketType) return;
		void onTypeUpdate(nextType);
	};

	const handleSaveInternalNote = () => {
		void onSaveInternalNote();
	};

	const handleSendMaintleyUpdate = () => {
		void onSendMaintleyUpdate();
	};

	const hasInternalNoteDraft = noteValue.trim().length > 0;
	const hasMaintleyDraft = resolutionValue.trim().length > 0;
	const isLinkActionBusy = isLinking || isUnlinking || isDeletingParent;

	const openEditDialog = () => setIsEditDialogOpen(true);
	const closeEditDialog = () => {
		setIsEditDialogOpen(false);
		setIsLinkInputFocused(false);
	};

	const toggleUnlinkTicketSelection = (childTicketId: string) => {
		setSelectedUnlinkTicketIds((prev) =>
			prev.includes(childTicketId)
				? prev.filter((id) => id !== childTicketId)
				: [...prev, childTicketId],
		);
	};

	return (
		<TicketCardContainer id={ticketAnchorId}>
			{groupTickets
				.filter((groupTicket) => String(groupTicket.id || '') !== primaryTicketId)
				.map((groupTicket) => (
					<HiddenTicketAnchor
						key={String(groupTicket.id || '')}
						id={`ticket-${String(groupTicket.id || '')}`}
					/>
				))}

			<TicketHeader>
				<TicketHeaderMain>
					<TicketTitle>{String(ticket.subject || '(No subject)')}</TicketTitle>
					<TicketMeta>Ticket: {ticketNumber}</TicketMeta>
					<TicketMeta>
						Type: {TYPE_LABELS[normalizedTicketType as 'feedback' | 'feature_request' | 'bug_report']} | Status: {STATUS_LABELS[status]}
					</TicketMeta>
					<TicketMeta>
						From: {String(ticket.userName || 'Unknown')} ({String(ticket.userEmail || 'no-email')})
					</TicketMeta>

				</TicketHeaderMain>

				<ActionGroup>
					<SecondaryButton type='button' onClick={openEditDialog}>
						Edit Ticket
					</SecondaryButton>
					<CaseGroupSummaryText>{caseTicketCount} tickets linked</CaseGroupSummaryText>
				</ActionGroup>
			</TicketHeader>

			{isEditDialogOpen ? (
				<AdminTicketEditDialog
					ticket={ticket}
					isSaving={isSaving}
					isLinking={isLinking}
					isUnlinking={isUnlinking}
					isDeletingParent={isDeletingParent}
					normalizedTicketType={normalizedTicketType}
					editableTypeOptions={editableTypeOptions}
					connectedTickets={connectedTickets}
					showLinkSuggestions={showLinkSuggestions}
					linkSuggestions={linkSuggestions}
					selectedUnlinkTicketIds={selectedUnlinkTicketIds}
					setIsLinkInputFocused={setIsLinkInputFocused}
					isLinkActionBusy={isLinkActionBusy}
					onLinkTargetChange={onLinkTargetChange}
					handleLinkClick={handleLinkClick}
					handleUnlinkSelectedClick={handleUnlinkSelectedClick}
					handleDeleteParentClick={handleDeleteParentClick}
					handleStatusChange={handleStatusChange}
					handleTypeChange={handleTypeChange}
					onClose={closeEditDialog}
					toggleUnlinkTicketSelection={toggleUnlinkTicketSelection}
					canDeleteParentTicket={canDeleteParentTicket}
					linkTargetValue={linkTargetValue}
				/>
			) : null}

			{attachments.length > 0 ? (
				<AttachmentSection>
					<AttachmentLabel>Attachments</AttachmentLabel>
					<AttachmentList>
						{attachments.map((attachment, idx) => {
							const normalized = normalizeAttachment(attachment, idx);
							const name = normalized.name;
							const url = normalized.url;

							if (!url) {
								return <AttachmentItem key={`${ticket.id}-${idx}`}>{name} - attachment unavailable</AttachmentItem>;
							}

							return (
								<AttachmentItem key={`${ticket.id}-${idx}`}>
									<AttachmentLink href={url} target='_blank' rel='noreferrer noopener'>
										{name}
									</AttachmentLink>
								</AttachmentItem>
							);
						})}
					</AttachmentList>
				</AttachmentSection>
			) : null}

			{submissionContext ? (
				<AttachmentSection>
					<AttachmentLabel>Submission Context</AttachmentLabel>
					<TicketMeta>
						Route: {String(submissionContext.pageUrl || 'n/a')}
					</TicketMeta>
					<TicketMeta>
						Property: {String(submissionContext.propertyId || 'n/a')} | Device:{' '}
						{String(submissionContext.deviceType || 'desktop')}
					</TicketMeta>
					<TicketMeta>
						Browser: {String(submissionContext.browser || 'n/a')}
					</TicketMeta>
					<TicketMeta>
						Version: {String(submissionContext.appVersion || 'n/a')} | Captured:{' '}
						{submissionContext.timestamp
							? new Date(String(submissionContext.timestamp)).toLocaleString()
							: 'n/a'}
					</TicketMeta>
				</AttachmentSection>
			) : null}



			<NotesStack>
				<NoteField>
					<CaseGroupSummaryRow>
						<NotesTabList role='tablist' aria-label='Ticket notes tabs'>
							<NotesTabButton
								type='button'
								role='tab'
								aria-selected={activeNotesTab === 'internal'}
								$active={activeNotesTab === 'internal'}
								onClick={() => setActiveNotesTab('internal')}>
								Internal Note
							</NotesTabButton>
							<NotesTabButton
								type='button'
								role='tab'
								aria-selected={activeNotesTab === 'maintly'}
								$active={activeNotesTab === 'maintly'}
								onClick={() => setActiveNotesTab('maintly')}>
								Maintly Update
							</NotesTabButton>
						</NotesTabList>
					</CaseGroupSummaryRow>

					<NoteTabPanel>
						{historyEntries.length > 0 ? (
							<>
								<CaseGroupSummaryRow>
									<NoteHistoryLabel>Ticket Activity</NoteHistoryLabel>
									<NotesTabList role='tablist' aria-label='Ticket activity filters'>
										<NotesTabButton
											type='button'
											role='tab'
											aria-selected={historyFilter === 'all'}
											$active={historyFilter === 'all'}
											onClick={() => setHistoryFilter('all')}>
											All
										</NotesTabButton>
										<NotesTabButton
											type='button'
											role='tab'
											aria-selected={historyFilter === 'maintley'}
											$active={historyFilter === 'maintley'}
											onClick={() => setHistoryFilter('maintley')}>
											Maintley Updates
										</NotesTabButton>
										<NotesTabButton
											type='button'
											role='tab'
											aria-selected={historyFilter === 'internal'}
											$active={historyFilter === 'internal'}
											onClick={() => setHistoryFilter('internal')}>
											Internal Notes
										</NotesTabButton>
									</NotesTabList>
								</CaseGroupSummaryRow>
								<NoteHistory>
									{filteredHistoryEntries.map((entry) => (
										<NoteHistoryItem key={entry.id}>
											<NoteHistoryText>{entry.note}</NoteHistoryText>
											<NoteHistoryMeta>
												{entry.noteType === 'maintley_update' ? 'Maintley Update' : 'Internal Note'}
												{entry.adminUsername ? ` · ${entry.adminUsername}` : ''}
												{entry.createdAt ? ` · ${new Date(entry.createdAt).toLocaleString()}` : ''}
												{entry.sourceTicketNumbers.length === 1
													? ` · Ticket ${entry.sourceTicketNumbers[0]}`
													: ` · Tickets ${entry.sourceTicketNumbers.join(', ')}`}
											</NoteHistoryMeta>
										</NoteHistoryItem>
									))}
								</NoteHistory>
							</>
						) : null}
						{activeNotesTab === 'internal' ? (
							<>
								<Label htmlFor={`note-${ticket.id}`}>Internal Note</Label>
								<NoteComposerRow>
									<TextArea
										id={`note-${ticket.id}`}
										value={noteValue}
										onChange={(e) => onNoteChange(e.target.value)}
										disabled={isSaving}
										placeholder='Add an internal note...'
									/>
									<SaveNotesButton
										type='button'
										disabled={isSaving || !hasInternalNoteDraft}
										onClick={handleSaveInternalNote}>
										{isSaving ? '...' : 'Save Note'}
									</SaveNotesButton>
								</NoteComposerRow>
							</>
						) : (
							<>
								<Label htmlFor={`resolution-${ticket.id}`}>New Maintley Update</Label>
								<NoteComposerRow>
									<TextArea
										id={`resolution-${ticket.id}`}
										value={resolutionValue}
										onChange={(e) => onResolutionChange(e.target.value)}
										disabled={isSaving}
										placeholder='Write a customer-facing Maintley update to add to message history...'
									/>
									<SaveNotesButton
										type='button'
										disabled={isSaving || !hasMaintleyDraft}
										onClick={handleSendMaintleyUpdate}>
										{isSaving ? '...' : <FontAwesomeIcon icon={faPaperPlane} />}
									</SaveNotesButton>
								</NoteComposerRow>
							</>
						)}
					</NoteTabPanel>
				</NoteField>
			</NotesStack>
		</TicketCardContainer>
	);
};
