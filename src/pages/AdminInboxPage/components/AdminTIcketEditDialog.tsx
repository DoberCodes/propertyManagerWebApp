import { DialogHeader, SecondaryButton } from "Components/Library";
import React from "react";
import { AdminFeedbackTicket } from "services/adminPortalService";
import { DialogBackdrop, DialogCard, SecurityTitle, DialogCloseButton, Label, Select, LinkRow, LinkInputWrap, LinkInput, LinkSuggestionList, LinkSuggestionItem, LinkSuggestionPrimary, CaseSummaryGroup, ButtonRow, CaseConnectionHint, NotesTabList, NotesTabButton, CaseGroupSummaryRow, SaveNotesButton } from "../AdminInboxPage.styles";
import { STATUS_OPTIONS, STATUS_LABELS, TYPE_LABELS } from "../constants";
import { getDisplayTicketNumber } from "../utils/ticketUtils";



export const AdminTicketEditDialog: React.FC<{
    ticket: AdminFeedbackTicket;
    isSaving: boolean;
    isLinking: boolean;
    isUnlinking: boolean;
    isDeletingParent: boolean;
    normalizedTicketType: string;
    editableTypeOptions: string[];
    connectedTickets: AdminFeedbackTicket[];
    showLinkSuggestions: boolean;
    linkSuggestions: { reference: string }[];
    selectedUnlinkTicketIds: string[];
    setIsLinkInputFocused: (focused: boolean) => void;
    isLinkActionBusy: boolean;
    toggleUnlinkTicketSelection: (ticketId: string) => void;
    canDeleteParentTicket: boolean;
    onLinkTargetChange: (value: string) => void;
    handleLinkClick: () => void;
    handleUnlinkSelectedClick: () => void;
    handleDeleteParentClick: () => void;

    handleStatusChange: (status: string) => void;
    handleTypeChange: (type: string) => void;
	linkTargetValue?: string;
    onClose: () => void;
}> = ({ 
    ticket, 
    isSaving, 
    isLinking, 
    isUnlinking, 
    isDeletingParent, 
    normalizedTicketType, 
	editableTypeOptions, connectedTickets, showLinkSuggestions, linkSuggestions, selectedUnlinkTicketIds, toggleUnlinkTicketSelection, canDeleteParentTicket, setIsLinkInputFocused, isLinkActionBusy, onLinkTargetChange, handleLinkClick, handleUnlinkSelectedClick, handleDeleteParentClick, handleStatusChange, handleTypeChange, linkTargetValue, onClose }) => {
	const safeLinkTargetValue = String(linkTargetValue || '');
	const safeStatus = STATUS_OPTIONS.includes(String(ticket.status || '') as any)
		? String(ticket.status || '')
		: 'received';

    const [activeLinkTab, setActiveLinkTab] = React.useState('linking'); // For future implementation of notes tabs
    

    return       (
        <DialogBackdrop onClick={onClose}>
					<DialogCard onClick={(e) => e.stopPropagation()}>
						<DialogHeader>
							<SecurityTitle>Edit Ticket</SecurityTitle>
							<DialogCloseButton type='button' onClick={onClose}>
								x
							</DialogCloseButton>
						</DialogHeader>

						<Label htmlFor={`status-select-${ticket.id}`}>Status</Label>
						<Select
							id={`status-select-${ticket.id}`}
							value={safeStatus}
							onChange={(e) => handleStatusChange(e.target.value)}
							disabled={isSaving}
							aria-label='Update ticket status'>
							{STATUS_OPTIONS.map((nextStatus) => (
								<option key={nextStatus} value={nextStatus}>
									{STATUS_LABELS[nextStatus]}
								</option>
							))}
						</Select>

						<Label htmlFor={`type-select-${ticket.id}`}>Type</Label>
						<Select
							id={`type-select-${ticket.id}`}
							value={normalizedTicketType}
							onChange={(e) => handleTypeChange(e.target.value)}
							disabled={isSaving}
							aria-label='Update ticket type'>
							{editableTypeOptions.map((typeOption) => (
								<option key={typeOption} value={typeOption}>
									{TYPE_LABELS[typeOption]}
								</option>
							))}
						</Select>
                        <CaseGroupSummaryRow>   
                        <NotesTabList role='tablist' aria-label='Ticket notes tabs'>
                                                <NotesTabButton
                                                    type='button'
                                                    role='tab'
                                                    aria-selected={activeLinkTab === 'linking'}
                                                    $active={activeLinkTab === 'linking'}
                                                    onClick={() => setActiveLinkTab('linking')}>
                                                    Linking
                                                </NotesTabButton>
                                                <NotesTabButton
                                                    type='button'
                                                    role='tab'
                                                    aria-selected={activeLinkTab === 'unlinking'}
                                                    $active={activeLinkTab === 'unlinking'}
                                                    onClick={() => setActiveLinkTab('unlinking')}>
                                                   Unlinking
                                                </NotesTabButton>
                                                    
                                            </NotesTabList>
                                                {activeLinkTab === 'linking' && (

                                            <SaveNotesButton
									type='button'
									disabled={isLinkActionBusy || !safeLinkTargetValue.trim()}
									onClick={handleLinkClick}>
									{isLinking ? 'Linking...' : 'Link'}
								</SaveNotesButton>
                                                )}
                                                {activeLinkTab === 'unlinking' && (
                                                    <SaveNotesButton
										type='button'
										disabled={isLinkActionBusy || selectedUnlinkTicketIds.length === 0}
										onClick={handleUnlinkSelectedClick}>
										{isUnlinking
											? 'Unlinking...'
											: `Unlink Selected (${selectedUnlinkTicketIds.length})`}
									</SaveNotesButton>
                                    )}
                                            </CaseGroupSummaryRow>
                        {activeLinkTab === 'linking' && (
                            <>
						<Label>Linking</Label>
						<LinkRow>
								<LinkInputWrap>
									<LinkInput
										type='text'
										placeholder='Search by ticket number'
										name={`link-search-${ticket.id}`}
										autoComplete='new-password'
										autoCorrect='off'
										autoCapitalize='none'
										spellCheck={false}
										value={safeLinkTargetValue}
										onChange={(e) => onLinkTargetChange(e.target.value)}
										onFocus={() => setIsLinkInputFocused(true)}
										onBlur={() => {
											window.setTimeout(() => setIsLinkInputFocused(false), 120);
										}}
										disabled={isLinkActionBusy}
									/>
									{showLinkSuggestions ? (
										<LinkSuggestionList role='listbox' aria-label='Ticket suggestions'>
											{linkSuggestions.map((suggestion) => (
												<LinkSuggestionItem
													key={suggestion.reference}
													type='button'
													onMouseDown={(e) => {
														e.preventDefault();
														onLinkTargetChange(suggestion.reference);
														setIsLinkInputFocused(false);
													}}>
													<LinkSuggestionPrimary>{suggestion.reference}</LinkSuggestionPrimary>
												</LinkSuggestionItem>
											))}
										</LinkSuggestionList>
									) : null}
								</LinkInputWrap>
								
						</LinkRow>
                        </>)}

                        {activeLinkTab === 'unlinking' && (
                            <>
                        
						<Label>Unlink Child Tickets</Label>
						{connectedTickets.length > 0 ? (
							<CaseSummaryGroup>
								{connectedTickets.map((groupTicket) => {
									const childTicketId = String(groupTicket.id || '');
									const childTicketNumber = getDisplayTicketNumber(groupTicket.ticketNumber, childTicketId);
									const checked = selectedUnlinkTicketIds.includes(childTicketId);
									return (
										<label key={childTicketId} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
											<input
												type='checkbox'
												checked={checked}
												onChange={() => toggleUnlinkTicketSelection(childTicketId)}
												disabled={isLinkActionBusy}
											/>
											<span>{childTicketNumber}</span>
										</label>
									);
								})}
								<ButtonRow>
									
								</ButtonRow>
							</CaseSummaryGroup>
						) : (
							<CaseConnectionHint>No child tickets available to unlink.</CaseConnectionHint>
						)}
                        </>)}

						
                    {canDeleteParentTicket ? (
							<ButtonRow>
								<SecondaryButton
									type='button'
									disabled={isLinkActionBusy}
									onClick={handleDeleteParentClick}>
									{isDeletingParent ? 'Deleting...' : 'Delete Parent Ticket'}
								</SecondaryButton>
							</ButtonRow>
						) : null}
					</DialogCard>
				</DialogBackdrop>
    );
}