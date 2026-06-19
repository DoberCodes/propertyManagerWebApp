/**
 * Admin Inbox Page Styled Components
 * Centralized styling for AdminInboxPage component
 */

import styled from 'styled-components';

// ============================================================================
// Layout & Containers
// ============================================================================

/** Outer shell — flex row so sidebar sits beside the main content area */
export const Shell = styled.div`
	display: flex;
	min-height: 100vh;
	background: linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%);

	@media (max-width: 768px) {
		flex-direction: column;
		padding-bottom: 64px; /* reserve space for mobile bottom bar */
	}
`;

/** Scrollable main content area beside the sidebar */
export const MainContent = styled.div`
	flex: 1;
	min-width: 0;
	padding: 24px;
	overflow-x: hidden;

	@media (max-width: 768px) {
		padding: 12px 8px;
	}
`;

// ============================================================================
// Admin Navbar — Desktop Sidebar
// ============================================================================

export const AdminSidebar = styled.nav`
	width: 220px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 24px 12px;
	background: #7c2d12;
	min-height: 100vh;
	position: sticky;
	top: 0;
	align-self: flex-start;

	@media (max-width: 768px) {
		display: none;
	}
`;

export const SidebarBrand = styled.div`
	padding: 0 8px 20px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.15);
	margin-bottom: 8px;
`;

export const SidebarBrandName = styled.p`
	margin: 0;
	font-size: 15px;
	font-weight: 800;
	color: #fff7ed;
	letter-spacing: 0.03em;
`;

export const SidebarBrandSub = styled.p`
	margin: 2px 0 0;
	font-size: 11px;
	color: #fca96d;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

export const SidebarNavItem = styled.button<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px 12px;
	border-radius: 8px;
	border: 1px solid ${({ $active }) => ($active ? 'rgba(255,255,255,0.25)' : 'transparent')};
	background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.12)' : 'transparent')};
	color: ${({ $active }) => ($active ? '#fff7ed' : '#fca96d')};
	font-size: 13px;
	font-weight: ${({ $active }) => ($active ? '700' : '600')};
	cursor: pointer;
	text-align: left;
	transition: background 120ms ease, color 120ms ease;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff7ed;
	}
`;

export const SidebarNavIcon = styled.span`
	font-size: 16px;
	line-height: 1;
	width: 20px;
	text-align: center;
	flex-shrink: 0;
`;

export const SidebarDivider = styled.hr`
	border: none;
	border-top: 1px solid rgba(255, 255, 255, 0.12);
	margin: 8px 0;
`;

export const SidebarFooter = styled.div`
	margin-top: auto;
	padding-top: 16px;
	border-top: 1px solid rgba(255, 255, 255, 0.12);
`;

export const SidebarUserLabel = styled.p`
	margin: 0 0 8px;
	font-size: 11px;
	color: #fca96d;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	padding: 0 8px;
`;

export const SidebarSignOutButton = styled.button`
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px 12px;
	border-radius: 8px;
	border: 1px solid transparent;
	background: transparent;
	color: #fca96d;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	text-align: left;
	transition: background 120ms ease, color 120ms ease;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff7ed;
	}
`;

// ============================================================================
// Admin Navbar — Mobile Bottom Bar
// ============================================================================

export const MobileNavBar = styled.nav`
	display: none;

	@media (max-width: 768px) {
		display: flex;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #7c2d12;
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		z-index: 100;
		padding: 0;
		height: 64px;
		align-items: stretch;
	}
`;

export const MobileNavItem = styled.button<{ $active?: boolean }>`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 3px;
	padding: 8px 4px;
	border: none;
	background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.1)' : 'transparent')};
	color: ${({ $active }) => ($active ? '#fff7ed' : '#fca96d')};
	cursor: pointer;
	border-top: 2px solid ${({ $active }) => ($active ? '#fdba74' : 'transparent')};
	transition: background 120ms ease, color 120ms ease;

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #fff7ed;
	}
`;

export const MobileNavIcon = styled.span`
	font-size: 18px;
	line-height: 1;
`;

export const MobileNavLabel = styled.span`
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

export const Card = styled.div`
	max-width: 1100px;
	margin: 0 auto;
	background: #ffffff;
	border: 1px solid #fed7aa;
	border-radius: 14px;
	padding: 24px;
	box-shadow: 0 14px 30px rgba(154, 52, 18, 0.08);

	@media (max-width: 640px) {
		padding: 12px;
		border-radius: 10px;
	}
`;

export const HeaderRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	flex-wrap: wrap;
	padding-bottom: 14px;
	border-bottom: 1px solid #ffedd5;

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

export const FilterRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
	margin: 16px 0 18px;
	padding: 14px;
	border: 1px solid #ffedd5;
	border-radius: 10px;
	background: #fffdfa;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		padding: 10px;
		gap: 10px;
	}
`;

export const TicketList = styled.div`
	display: grid;
	gap: 12px;
`;

export const DialogBackdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(17, 24, 39, 0.35);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	z-index: 50;

	@media (max-width: 480px) {
		align-items: flex-end;
		padding: 0;

		& > * {
			width: 100%;
			max-width: 100%;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}
	}
`;

export const DialogCard = styled.div`
	width: min(560px, 100%);
	max-height: 90vh;
	overflow-y: auto;
	background: #ffffff;
	border-radius: 12px;
	border: 1px solid #fed7aa;
	padding: 18px;
	display: grid;
	gap: 10px;
	box-shadow: 0 18px 38px rgba(124, 45, 18, 0.18);

	@media (max-width: 480px) {
		max-height: 95vh;
		padding: 14px;
		border-radius: 10px;
	}
`;

// ============================================================================
// Typography & Text
// ============================================================================

export const Title = styled.h1`
	margin: 0;
	font-size: 24px;
	color: #9a3412;
`;

export const SubTitle = styled.p`
	margin: 4px 0 0;
	font-size: 14px;
	color: #7c2d12;
	line-height: 1.4;
`;

export const SecurityTitle = styled.h2`
	margin: 0;
	font-size: 16px;
	color: #9a3412;
`;

export const TicketTitle = styled.h3`
	margin: 0;
	font-size: 16px;
	color: #9a3412;
	word-break: break-word;
`;

export const TicketMeta = styled.p`
	margin: 6px 0;
	font-size: 12px;
	color: #7c2d12;
	word-break: break-all;
`;

export const ErrorText = styled.p`
	margin: 0;
	color: #b91c1c;
	font-size: 13px;
`;

export const SuccessText = styled.p`
	margin: 0;
	color: #166534;
	font-size: 13px;
`;

// ============================================================================
// Buttons
// ============================================================================

export const Button = styled.button`
	padding: 10px 14px;
	border-radius: 8px;
	border: 1px solid #ea580c;
	background: #ea580c;
	color: #ffffff;
	font-weight: 600;
	cursor: pointer;
	transition: filter 0.15s ease;

	:hover {
		filter: brightness(0.95);
	}

	:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

export const SecondaryButton = styled.button`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid #fdba74;
	background: #fff7ed;
	color: #9a3412;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.15s ease;

	:hover:not(:disabled) {
		background: #ffedd5;
	}

	:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

export const InlineToggle = styled.button`
	padding: 10px 12px;
	border-radius: 8px;
	border: 1px solid #fdba74;
	background: #fff7ed;
	color: #9a3412;
	font-weight: 600;
	cursor: pointer;

	:hover {
		background: #ffedd5;
	}
`;

export const DialogCloseButton = styled.button`
	font-weight: 600;
    background: transparent;
	cursor: pointer;

    &:hover {
        color: #b91c1c;
    }
`;

export const ActionGroup = styled.div`
	display: grid;
	gap: 6px;
	justify-content: flex-end;

	@media (max-width: 480px) {
		justify-content: stretch;
		width: 100%;

		& > button {
			width: 100%;
		}
	}
`;

export const ButtonRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	align-items: center;

	@media (max-width: 480px) {
		width: 100%;

		& > button {
			flex: 1;
		}
	}
`;

// ============================================================================
// Form Elements
// ============================================================================

export const Label = styled.label`
	font-size: 12px;
	font-weight: 600;
	color: #9a3412;
`;

export const Input = styled.input`
	padding: 10px;
	border: 1px solid #fdba74;
	border-radius: 8px;
	font-size: 14px;

	:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

export const LinkInput = styled(Input)`
	flex: 1;
	min-width: 0;
	width: 100%;
	background: #fffdfa;
`;

export const Select = styled.select`
	padding: 5px;
	border: 1px solid #fdba74;
	border-radius: 8px;
	font-size: 14px;
	background: #ffffff;

	@media (max-width: 480px) {
		width: 100%;
		padding: 8px;
	}
`;

export const TextArea = styled.textarea`
	padding: 10px;
	border: 1px solid #fdba74;
	border-radius: 8px;
	font-size: 14px;
	min-height: 80px;
	resize: vertical;
`;

export const PasswordRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 8px;
	align-items: center;
`;

export const LoginForm = styled.form`
	display: grid;
	gap: 8px;
	margin-top: 16px;
	max-width: 420px;
`;

// ============================================================================
// Auth/Modal
// ============================================================================

export const SettingsWrap = styled.div`
	position: relative;
`;

export const SettingsMenu = styled.div`
	position: absolute;
	top: calc(100% + 6px);
	right: 0;
	min-width: 180px;
	padding: 6px;
	background: #ffffff;
	border: 1px solid #fed7aa;
	border-radius: 10px;
	box-shadow: 0 12px 26px rgba(124, 45, 18, 0.14);
	z-index: 20;
	display: grid;
	gap: 4px;
`;

export const SettingsItem = styled.button`
	text-align: left;
	border: none;
	background: transparent;
	padding: 9px 10px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 600;
	color: #7c2d12;
	cursor: pointer;

	:hover {
		background: #fff7ed;
	}
`;

export const DialogHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
`;

// ============================================================================
// Ticket Display
// ============================================================================

export const TicketCard = styled.div`
	border: 1px solid #fed7aa;
	border-radius: 10px;
	padding: 14px;
	background: #fffbeb;
	box-shadow: 0 6px 14px rgba(124, 45, 18, 0.08);

	@media (max-width: 480px) {
		padding: 10px;
	}
`;

export const TicketHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		flex-direction: column;
	}
`;

export const MessageBox = styled.pre`
	margin: 8px 0;
	padding: 10px;
	border-radius: 8px;
	background: #ffffff;
	border: 1px solid #fed7aa;
	font-size: 13px;
	white-space: pre-wrap;
	word-break: break-word;
	font-family: inherit;
`;

export const AttachmentSection = styled.div`
	margin: 8px 0;
	display: grid;
	gap: 6px;
`;

export const AttachmentLabel = styled.p`
	margin: 0;
	font-size: 12px;
	font-weight: 700;
	color: #7c2d12;
`;

export const AttachmentList = styled.ul`
	margin: 0;
	padding-left: 18px;
	display: grid;
	gap: 4px;
`;

export const AttachmentItem = styled.li`
	font-size: 13px;
	color: #9a3412;
`;

export const AttachmentLink = styled.a`
	color: #9a3412;
	text-decoration: underline;
	text-underline-offset: 2px;

	:hover {
		filter: brightness(0.8);
	}
`;

// ============================================================================
// Linking UI
// ============================================================================

export const LinkSection = styled.div`
	margin: 8px 0;
	display: grid;
	gap: 6px;
`;

export const LinkRow = styled.div`
	display: flex;
	gap: 8px;
	align-items: flex-start;
	flex-wrap: wrap;
`;

export const LinkInputWrap = styled.div`
	position: relative;
	flex: 1;
	min-width: 0;
	width: 100%;
`;

export const LinkSuggestionList = styled.div`
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	right: 0;
	z-index: 25;
	max-height: 260px;
	overflow-y: auto;
	border: 1px solid #fdba74;
	border-radius: 10px;
	background: #ffffff;
	box-shadow: 0 10px 26px rgba(124, 45, 18, 0.16);
	padding: 6px;
	display: grid;
	gap: 4px;
`;

export const LinkSuggestionItem = styled.button`
	width: 100%;
	text-align: left;
	border: 1px solid transparent;
	background: #fffdfa;
	border-radius: 8px;
	padding: 7px 8px;
	cursor: pointer;
	display: grid;
	gap: 2px;

	:hover {
		background: #ffedd5;
		border-color: #fed7aa;
	}
`;

export const LinkSuggestionPrimary = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: #9a3412;
`;

export const LinkSuggestionSecondary = styled.span`
	font-size: 11px;
	color: #7c2d12;
	opacity: 0.9;
`;

export const NotesStack = styled.div`
margin-top: 12px;
	display: grid;
	gap: 10px;
`;

export const NoteField = styled.div`
	display: grid;
	gap: 6px;
`;

export const NoteComposerRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 10px;
	align-items: start;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const NotesTabList = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	width: fit-content;
	max-width: 100%;
	padding: 4px;
	border: 1px solid #fdba74;
	border-radius: 10px;
	background: #fff7ed;

	@media (max-width: 480px) {
		width: 100%;

		& > button {
			flex: 1;
		}
	}
`;

export const NotesTabButton = styled.button<{ $active?: boolean }>`
	padding: 7px 12px;
	border-radius: 8px;
	border: 1px solid ${({ $active }) => ($active ? '#ea580c' : 'transparent')};
	background: ${({ $active }) => ($active ? '#ea580c' : 'transparent')};
	color: ${({ $active }) => ($active ? '#ffffff' : '#9a3412')};
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 120ms ease, color 120ms ease;

	:hover {
		background: ${({ $active }) => ($active ? '#c2410c' : '#ffedd5')};
	}
`;

export const NoteTabPanel = styled.div`
	margin-top: 8px;
	padding: 10px;
	border: 1px solid #fed7aa;
	border-radius: 10px;
	background: #fffdfa;
	display: grid;
	gap: 8px;
`;

export const NotesFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	padding-top: 4px;
`;

export const NoteHistory = styled.div`
	display: grid;
	gap: 6px;
	max-height: 200px;
	overflow-y: auto;
	padding-right: 4px;

	@media (max-width: 480px) {
		max-height: 160px;
	}
`;

export const NoteHistoryLabel = styled.p`
	margin: 0;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #7c2d12;
`;

export const NoteHistoryItem = styled.div`
	padding: 8px 10px;
	border-radius: 6px;
	border: 1px solid #fed7aa;
	background: #ffffff;
	display: grid;
	gap: 4px;
`;

export const NoteHistoryText = styled.p`
	margin: 0;
	font-size: 13px;
	color: #1c1917;
	white-space: pre-wrap;
	word-break: break-word;

	@media (max-width: 480px) {
		font-size: 12px;
		padding: 6px 8px;
	}
`;

export const NoteHistoryMeta = styled.p`
	margin: 0;
	font-size: 11px;
	color: #7c2d12;
	opacity: 0.8;

	@media (max-width: 480px) {
		font-size: 11px;
		padding: 6px 8px;
	}
`;

export const SaveNotesButton = styled.button`
	padding: 8px 16px;
	border-radius: 8px;
	border: 1px solid #ea580c;
	background: #ea580c;
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: filter 0.15s ease;

	:hover:not(:disabled) {
		filter: brightness(0.95);
	}

	:disabled {
        background: #d29b7e;
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;

export const HiddenTicketAnchor = styled.div`
	position: relative;
	top: -8px;
	height: 0;
`;

export const TicketHeaderMain = styled.div`
	flex: 1;
	min-width: 0;
`;

export const GroupCasePanel = styled.div`
	margin-top: 10px;
	padding: 12px;
	border: 1px solid #fb923c;
	border-radius: 10px;
	background: linear-gradient(180deg, #fff7ed 0%, #fed7aa 100%);
	display: grid;
	gap: 10px;
`;

export const CaseSummaryGroup = styled.div`
    margin-top: 10px;
    background: #fff7ed;
	border: 1px solid #fdba74;
    padding: 10px;
    border-radius: 8px;


`;

export const CaseGroupSummaryRow = styled.div`
	margin-top: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-radius: 10px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 8px;
	}
`;

export const CaseGroupSummaryText = styled.p`
	margin: 0;
	font-size: 13px;
	font-weight: 600;
	color: #7c2d12;
`;

export const CaseGroupToggleButton = styled.button`
	padding: 6px 12px;
	border-radius: 8px;
	border: 1px solid #fdba74;
	background: #ffffff;
	color: #9a3412;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;

	:hover {
		background: #ffedd5;
	}
`;

export const GroupCaseHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	flex-wrap: wrap;
`;

export const GroupCaseHeading = styled.div`
	display: grid;
	gap: 2px;
`;

export const GroupCaseTitle = styled.p`
	margin: 0;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: #7c2d12;
`;

export const GroupCaseSubTitle = styled.p`
	margin: 0;
	font-size: 12px;
	color: #7c2d12;
`;

export const CaseConnectionGrid = styled.div`
	display: grid;
	gap: 8px;
`;

export const CaseConnectionRow = styled.div`
	display: grid;
	grid-template-columns: 90px minmax(0, 1fr);
	align-items: center;
	gap: 8px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 6px;
	}
`;

export const CaseConnectionLabel = styled.span`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #7c2d12;
`;

export const CaseConnectionHint = styled.p`
	margin: 0;
	font-size: 11px;
	color: #7c2d12;
	opacity: 0.9;
`;

export const GroupCaseBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	background: #9a3412;
	color: #fff7ed;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
`;

export const GroupTicketChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`;

export const GroupTicketChip = styled.button<{ $active?: boolean }>`
	border: 1px solid ${({ $active }) => ($active ? '#7c2d12' : '#fdba74')};
	background: ${({ $active }) => ($active ? '#9a3412' : '#ffffff')};
	color: ${({ $active }) => ($active ? '#fff7ed' : '#7c2d12')};
	padding: 6px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: transform 120ms ease, filter 120ms ease;

	:hover {
		filter: brightness(0.96);
		transform: translateY(-1px);
	}
`;

// ============================================================================
// Stats & Cards
// ============================================================================

export const StatsRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	margin: 18px 0;

	@media (max-width: 480px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 4px;
	}
`;

export const StatCard = styled.div`
	padding: 10px;
	font-weight: 600;
	color: #9a3412;
	text-align: center;
	font-size: 13px;

	@media (max-width: 480px) {
		font-size: 12px;
		padding: 8px 6px;
	}
`;
