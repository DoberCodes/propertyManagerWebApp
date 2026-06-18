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
	MessageBox,
	AttachmentSection,
	AttachmentLabel,
	AttachmentList,
	AttachmentItem,
	AttachmentLink,
	LinkRow,
	SecondaryButton,
	LinkInput,
	ActionGroup,
	NotesStack,
	NoteField,
	Label,
	TextArea,
	HiddenTicketAnchor,
	TicketHeaderMain,
	GroupCasePanel,
	GroupCaseHeader,
	GroupCaseHeading,
	GroupCaseTitle,
	GroupCaseSubTitle,
	CaseConnectionGrid,
	CaseConnectionRow,
	CaseConnectionLabel,
	CaseConnectionHint,
	GroupCaseBadge,
	GroupTicketChips,
	GroupTicketChip,
} from '../AdminInboxPage.styles';
import { AdminFeedbackTicket } from '../../../services/adminPortalService';
import { STATUS_OPTIONS } from '../constants';
import { normalizeAttachment } from '../utils/attachmentUtils';
import { getDisplayTicketNumber } from '../utils/ticketUtils';

interface TicketCardProps {
	ticket: AdminFeedbackTicket;
	ticketNumber: string;
	ticketAnchorId: string;
	groupTickets: AdminFeedbackTicket[];
	isSaving: boolean;
	isLinking: boolean;
	noteValue: string;
	resolutionValue: string;
	linkTargetValue: string;
	onSelectTicket: (ticketId: string) => void;
	onStatusUpdate: (status: string) => Promise<void>;
	onNoteChange: (value: string) => void;
	onResolutionChange: (value: string) => void;
	onLinkTargetChange: (value: string) => void;
	onLinkTicket: () => Promise<void>;
}

export const TicketCard: React.FC<TicketCardProps> = ({
	ticket,
	ticketNumber,
	ticketAnchorId,
	groupTickets,
	isSaving,
	isLinking,
	noteValue,
	resolutionValue,
	linkTargetValue,
	onSelectTicket,
	onStatusUpdate,
	onNoteChange,
	onResolutionChange,
	onLinkTargetChange,
	onLinkTicket,
}) => {
	const ticketId = String(ticket.id || '');
	const status = String(ticket.status || 'received');
	const attachments = Array.isArray(ticket.attachments) ? (ticket.attachments as unknown[]) : [];
	const primaryTicketId = String(groupTickets[0]?.id || ticketId);
	const caseTicketCount = groupTickets.length;
	const primaryTicket =
		groupTickets.find((groupTicket) => String(groupTicket.id || '') === primaryTicketId) || ticket;
	const connectedTickets = groupTickets.filter(
		(groupTicket) => String(groupTicket.id || '') !== primaryTicketId,
	);

	const handleStatusClick = (nextStatus: string) => {
		void onStatusUpdate(nextStatus);
	};

	const handleLinkClick = () => {
		void onLinkTicket();
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
						Type: {String(ticket.type || 'feedback')} | Status: {status}
					</TicketMeta>
					<TicketMeta>
						From: {String(ticket.userName || 'Unknown')} ({String(ticket.userEmail || 'no-email')})
					</TicketMeta>

					{groupTickets.length > 1 ? (
						<GroupCasePanel>
							<GroupCaseHeader>
								<GroupCaseHeading>
									<GroupCaseTitle>Case Group</GroupCaseTitle>
									<GroupCaseSubTitle>
										All linked tickets sync status and notes
									</GroupCaseSubTitle>
								</GroupCaseHeading>
								<GroupCaseBadge>{caseTicketCount} linked</GroupCaseBadge>
							</GroupCaseHeader>

							<CaseConnectionGrid>
								<CaseConnectionRow>
									<CaseConnectionLabel>Primary</CaseConnectionLabel>
									<GroupTicketChips>
										<GroupTicketChip
											type='button'
											$active={primaryTicketId === ticketId}
											onClick={() => onSelectTicket(primaryTicketId)}>
											{getDisplayTicketNumber(primaryTicket.ticketNumber, primaryTicketId)}
										</GroupTicketChip>
									</GroupTicketChips>
								</CaseConnectionRow>

								{connectedTickets.length > 0 ? (
									<CaseConnectionRow>
										<CaseConnectionLabel>Connected</CaseConnectionLabel>
										<GroupTicketChips>
											{connectedTickets.map((groupTicket) => {
												const groupTicketId = String(groupTicket.id || '');
												const isSelected = groupTicketId === ticketId;
												const groupTicketNumber = getDisplayTicketNumber(
													groupTicket.ticketNumber,
													groupTicketId,
												);

												return (
													<GroupTicketChip
														key={groupTicketId}
														type='button'
														$active={isSelected}
														onClick={() => onSelectTicket(groupTicketId)}>
														{groupTicketNumber}
													</GroupTicketChip>
												);
											})}
										</GroupTicketChips>
									</CaseConnectionRow>
								) : null}

								<CaseConnectionHint>
									All tickets in this list are connected to the same case.
								</CaseConnectionHint>
							</CaseConnectionGrid>
						</GroupCasePanel>
					) : null}
				</TicketHeaderMain>

				<ActionGroup>
					{STATUS_OPTIONS.map((nextStatus) => (
						<SecondaryButton
							key={nextStatus}
							type='button'
							disabled={isSaving || nextStatus === status}
							onClick={() => handleStatusClick(nextStatus)}>
							{nextStatus}
						</SecondaryButton>
					))}
				</ActionGroup>
			</TicketHeader>

			<MessageBox>{String(ticket.message || '')}</MessageBox>

			{attachments.length > 0 ? (
				<AttachmentSection>
					<AttachmentLabel>Attachments</AttachmentLabel>
					<AttachmentList>
						{attachments.map((attachment, idx) => {
							const normalized = normalizeAttachment(attachment, idx);
							const name = normalized.name;
							const url = normalized.url;

							if (!url) {
								return <AttachmentItem key={`${ticket.id}-${idx}`}>{name}</AttachmentItem>;
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

			<LinkRow>
				<LinkInput
					type='text'
					placeholder='Enter the exact ticket number or document ID'
					value={linkTargetValue}
					onChange={(e) => onLinkTargetChange(e.target.value)}
					disabled={isLinking}
				/>
				<SecondaryButton
					type='button'
					disabled={isLinking || !linkTargetValue.trim()}
					onClick={handleLinkClick}>
					{isLinking ? 'Linking...' : 'Link'}
				</SecondaryButton>
			</LinkRow>

			<NotesStack>
				<NoteField>
					<Label htmlFor={`note-${ticket.id}`}>Internal Note</Label>
					<TextArea
						id={`note-${ticket.id}`}
						value={noteValue}
						onChange={(e) => onNoteChange(e.target.value)}
						disabled={isSaving}
						placeholder='Add an internal note...'
					/>
				</NoteField>
				<NoteField>
					<Label htmlFor={`resolution-${ticket.id}`}>Resolution Notes</Label>
					<TextArea
						id={`resolution-${ticket.id}`}
						value={resolutionValue}
						onChange={(e) => onResolutionChange(e.target.value)}
						disabled={isSaving}
						placeholder='Add resolution notes...'
					/>
				</NoteField>
			</NotesStack>
		</TicketCardContainer>
	);
};
