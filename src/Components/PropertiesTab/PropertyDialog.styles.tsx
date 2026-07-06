import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

// Dialog container styles
export const DialogOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
`;

export const DialogContainer = styled.div`
	position: relative;
	background-color: ${COLORS.white};
	border-radius: 8px;
	width: 90%;
	max-width: 900px;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	overflow: hidden;

	@media (max-width: 1024px) {
		max-width: 800px;
	}

	@media (max-width: 1024px) {
		max-width: 95%;
		max-height: 85vh;
	}

	@media (max-width: 480px) {
		width: 100%;
		max-width: 100%;
		max-height: 95vh;
		border-radius: 0;
	}
`;

export const DialogHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid ${COLORS.border};
	background-color: ${COLORS.canvas};

	@media (max-width: 1024px) {
		padding: 16px 20px;
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
	}
`;

export const DialogTitle = styled.h2`
	font-size: 20px;
	font-weight: 600;
	color: black;
	margin: 0;

	@media (max-width: 1024px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 28px;
	color: ${COLORS.textMuted};
	cursor: pointer;
	padding: 4px 8px;
	transition: color 0.2s ease;

	&:hover {
		color: ${COLORS.gray700};
	}

	@media (max-width: 480px) {
		font-size: 24px;
		padding: 2px 4px;
	}
`;

export const DialogContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 24px;

	/* Scrollbar styling */
	&::-webkit-scrollbar {
		width: 8px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: ${COLORS.gray300};
		border-radius: 4px;

		&:hover {
			background: ${COLORS.gray400};
		}
	}

	@media (max-width: 1024px) {
		padding: 16px 20px;
		gap: 16px;
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		gap: 12px;
	}
`;

export const OnboardingTipBanner = styled.div`
	position: sticky;
	top: 0;
	z-index: 3;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 14px;
	padding: 14px 16px;
	border: 1px solid ${COLORS.successLight};
	border-radius: 14px;
	background: ${COLORS.primaryLight};
	box-shadow: 0 14px 30px rgba(21, 128, 61, 0.12);

	@media (max-width: 480px) {
		padding: 12px 14px;
		border-radius: 12px;
	}
`;

export const OnboardingTipText = styled.div`
	flex: 1;
	min-width: 0;
	color: ${COLORS.successDark};
	font-size: 13px;
	line-height: 1.5;

	.strong {
		font-weight: 700;
	}
`;

export const OnboardingTipLabel = styled.div`
	display: block;
	align-items: center;
	margin-bottom: 4px;
	font-size: 12px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${COLORS.primaryDark};
`;

export const OnboardingTipDismissButton = styled.button`
	flex: 0 0 auto;
	width: 28px;
	height: 28px;
	border: none;
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	cursor: pointer;
	font-size: 20px;
	line-height: 1;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	transition:
		background-color 0.2s ease,
		color 0.2s ease,
		transform 0.2s ease;

	&:hover {
		background: ${COLORS.primaryLight};
		transform: translateY(-1px);
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primaryHover};
		outline-offset: 2px;
	}
`;

export const OnboardingNextStepBanner = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px 14px;
	border: 1px solid ${COLORS.successLight};
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.successDark};
	font-size: 13px;
	line-height: 1.45;

	svg {
		flex: 0 0 auto;
		margin-top: 2px;
		color: ${COLORS.primary};
	}

	strong {
		font-weight: 800;
	}

	@media (max-width: 480px) {
		padding: 11px 12px;
		font-size: 12px;
	}
`;

export const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const SectionTitle = styled.h3`
	font-size: 14px;
	font-weight: 600;
	color: ${COLORS.gray700};
	margin: 0;
	text-transform: uppercase;
	letter-spacing: 0.5px;

	@media (max-width: 480px) {
		font-size: 12px;
		letter-spacing: 0.3px;
	}
`;

export const FormRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

export const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

export const Label = styled.label`
	font-size: 13px;
	font-weight: 600;
	color: ${COLORS.gray700};

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;

export const DialogSavingOverlay = styled.div`
	position: absolute;
	inset: 0;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(2px);
`;

export const DialogSavingCard = styled.div`
	width: min(100%, 420px);
	border: 1px solid ${COLORS.successLight};
	border-radius: 14px;
	background: ${COLORS.successLight};
	padding: 24px;
	text-align: center;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);

	@media (max-width: 480px) {
		padding: 20px;
	}
`;

export const DialogSavingSpinner = styled.div`
	width: 34px;
	height: 34px;
	margin: 0 auto 16px;
	border-radius: 999px;
	border: 3px solid ${COLORS.successLight};
	border-top-color: ${COLORS.primaryHover};
	animation: property-dialog-spin 800ms linear infinite;

	@keyframes property-dialog-spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

export const DialogSavingTitle = styled.h3`
	margin: 0 0 8px;
	font-size: 18px;
	font-weight: 800;
	color: ${COLORS.successDark};
`;

export const DialogSavingText = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.5;
	color: ${COLORS.primaryDark};
`;

export const ValidationMessage = styled.div`
	font-size: 12px;
	line-height: 1.4;
	color: ${COLORS.errorDark};
`;

export const Input = styled.input`
	padding: 10px 12px;
	border: 1px solid ${COLORS.gray300};
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	&::placeholder {
		color: ${COLORS.gray400};
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 13px;
	}
`;

export const TextArea = styled.textarea`
	padding: 10px 12px;
	border: 1px solid ${COLORS.gray300};
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
	min-height: 120px;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	&::placeholder {
		color: ${COLORS.gray400};
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 13px;
		min-height: 100px;
	}
`;

export const PhotoInput = styled.input`
	display: none;
`;

export const PhotoPreview = styled.div`
	position: relative;
	width: 100%;
	max-width: 300px;
	border-radius: 4px;
	overflow: hidden;
`;

export const PhotoPreviewImage = styled.img`
	width: 100%;
	height: 200px;
	object-fit: cover;
	display: block;

	@media (max-width: 1024px) {
		height: 180px;
	}

	@media (max-width: 480px) {
		height: 150px;
	}
`;

export const RemovePhotoButton = styled.button`
	position: absolute;
	bottom: 8px;
	right: 8px;
	background-color: ${COLORS.error};
	color: ${COLORS.white};
	border: none;
	padding: 6px 12px;
	border-radius: 4px;
	font-size: 12px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${COLORS.errorDark};
	}

	@media (max-width: 480px) {
		padding: 4px 8px;
		font-size: 10px;
	}
`;

export const FileInput = styled.input`
	display: none;
`;

export const FileLabel = styled.label`
	display: inline-block;
	padding: 10px 16px;
	background-color: ${COLORS.borderLight};
	border: 2px solid ${COLORS.gray300};
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	color: ${COLORS.gray700};
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${COLORS.border};
		border-color: ${COLORS.primary};
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
	}
`;

export const DevicesSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const DeviceRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) auto auto;
	gap: 12px;
	align-items: flex-end;
	padding: 16px;
	background-color: ${COLORS.canvas};
	border: 1px solid ${COLORS.border};
	border-radius: 4px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr auto auto;
		gap: 10px;
		padding: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr auto;
		gap: 8px;
		padding: 10px;
		flex-wrap: wrap;
	}
`;

export const RemoveDeviceButton = styled.button`
	background-color: ${COLORS.error};
	color: ${COLORS.white};
	border: none;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 12px;
	cursor: pointer;
	white-space: nowrap;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${COLORS.errorDark};
	}

	@media (max-width: 480px) {
		padding: 6px 8px;
		font-size: 10px;
	}
`;

export const WizardShell = styled.div`
	display: grid;
	grid-template-columns: 220px minmax(0, 1fr);
	gap: 0;
	flex: 1;
	height: 100%;
	min-height: 0;
	align-self: stretch;
	overflow: hidden;
	background: transparent;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		grid-template-rows: auto minmax(0, 1fr);
	}
`;

export const WizardSidebar = styled.div`
	height: 100%;
	padding: 20px 18px;
	background: transparent;
	display: flex;
	flex-direction: column;
	gap: 18px;

	@media (max-width: 900px) {
		height: auto;
		align-self: start;
		padding: 10px 12px;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid ${COLORS.border};
		overflow: hidden;
	}

	@media (max-width: 640px) {
		padding: 8px;
		gap: 5px;
	}
`;

export const WizardStep = styled.button<{ $active?: boolean; $complete?: boolean }>`
	display: grid;
	grid-template-columns: 28px minmax(0, 1fr);
	gap: 12px;
	align-items: flex-start;
	padding: 0;
	border: none;
	background: transparent;
	text-align: left;
	cursor: pointer;
	color: ${({ $active }) => ($active ? COLORS.primaryDark : COLORS.gray700)};

	&:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	@media (max-width: 900px) {
		grid-template-columns: ${({ $active }) =>
		$active ? '22px minmax(0, 1fr)' : '22px'};
		justify-items: center;
		align-items: center;
		gap: ${({ $active }) => ($active ? '7px' : '0')};
		padding: ${({ $active }) => ($active ? '6px 10px' : '6px')};
		border: 1px solid ${({ $active }) => ($active ? COLORS.primary : COLORS.border)};
		border-radius: 999px;
		background: ${({ $active }) => ($active ? COLORS.primaryLight : COLORS.white)};
		text-align: center;
		min-width: 0;
		height: 36px;
		flex: ${({ $active }) => ($active ? '1 1 auto' : '0 0 36px')};
		max-width: ${({ $active }) => ($active ? '190px' : '36px')};
	}

	@media (max-width: 640px) {
		height: 34px;
		flex-basis: ${({ $active }) => ($active ? 'auto' : '34px')};
		max-width: ${({ $active }) => ($active ? '128px' : '34px')};
		padding: ${({ $active }) => ($active ? '6px 8px' : '6px')};
	}
`;

export const WizardStepDot = styled.span<{ $active?: boolean; $complete?: boolean }>`
	width: 28px;
	height: 28px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 700;
	border: 1px solid
		${({ $active, $complete }) =>
		$complete || $active ? COLORS.primary : COLORS.gray300};
	background: ${({ $active, $complete }) =>
		$complete || $active ? COLORS.primary : COLORS.bgLight};
	color: ${({ $active, $complete }) =>
		$complete || $active ? COLORS.white : COLORS.textSecondary};

	@media (max-width: 900px) {
		width: 22px;
		height: 22px;
		font-size: 11px;
	}
`;

export const WizardStepText = styled.div<{ $active?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding-top: 3px;

	@media (max-width: 900px) {
		display: ${({ $active }) => ($active ? 'flex' : 'none')};
		padding-top: 0;
		align-items: center;
		min-width: 0;
	}
`;

export const WizardStepTitle = styled.span`
	font-size: 13px;
	font-weight: 700;

	@media (max-width: 640px) {
		font-size: 11px;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
`;

export const WizardStepHint = styled.span`
	font-size: 11px;
	line-height: 1.45;
	color: ${COLORS.textSecondary};

	@media (max-width: 900px) {
		display: none;
	}
`;

export const WizardContent = styled.div`
	min-height: 0;
	height: 100%;
	box-sizing: border-box;
	padding: 22px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	overflow-y: auto;

	@media (max-width: 480px) {
		padding: 14px 12px;
	}
`;

export const WizardPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
`;

export const WizardPanelHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const WizardPanelTitle = styled.h3`
	font-size: 20px;
	font-weight: 700;
	margin: 0;
	color: ${COLORS.textPrimary};
`;

export const WizardPanelHint = styled.p`
	font-size: 13px;
	line-height: 1.5;
	margin: 0;
	color: ${COLORS.textSecondary};
`;

export const SelectField = styled.select`
	padding: 10px 12px;
	border: 1px solid ${COLORS.gray300};
	border-radius: 8px;
	font-size: 14px;
	font-family: inherit;
	background: ${COLORS.white};
	width: 100%;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}
`;

export const UploadDropzone = styled.div`
	border: 1px dashed ${COLORS.gray300};
	border-radius: 12px;
	padding: 18px;
	background: ${COLORS.bgLight};

	@media (max-width: 640px) {
		padding: 12px;
	}
`;

export const CompactActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	align-items: center;

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

export const InlineDisclosureButton = styled.button`
	align-self: flex-start;
	border: none;
	background: transparent;
	color: ${COLORS.primary};
	font-size: 13px;
	font-weight: 800;
	padding: 0;
	cursor: pointer;
	text-align: left;

	&:hover {
		text-decoration: underline;
	}
`;

export const CompactCreateRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 10px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const SharingSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
`;

export const SharingHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;

	@media (max-width: 640px) {
		flex-direction: column;
	}
`;

export const SharingTitleWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

export const SharingTitle = styled.h4`
	font-size: 14px;
	font-weight: 700;
	margin: 0;
	color: ${COLORS.textPrimary};
`;

export const SharingHint = styled.p`
	font-size: 12px;
	line-height: 1.45;
	color: ${COLORS.textSecondary};
	margin: 0;
`;

export const ShareControls = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 10px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const MemberList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const MemberCard = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.white};

	@media (max-width: 640px) {
		align-items: flex-start;
	}
`;

export const MemberCardInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

export const MemberName = styled.span`
	font-size: 13px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const MemberMeta = styled.span`
	font-size: 12px;
	color: ${COLORS.textSecondary};
`;

export const EmptySharingState = styled.div`
	padding: 12px;
	border: 1px dashed ${COLORS.gray300};
	border-radius: 10px;
	font-size: 12px;
	color: ${COLORS.textSecondary};
	background: ${COLORS.bgLight};
`;

export const SuggestionNotice = styled.div`
	padding: 12px 14px;
	border: 1px solid ${COLORS.infoLight};
	border-radius: 12px;
	background: ${COLORS.infoLight};
	color: ${COLORS.infoDark};
	font-size: 13px;
	line-height: 1.5;

	@media (max-width: 640px) {
		padding: 10px 12px;
		font-size: 12px;
	}
`;

export const SuggestionToggle = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
	color: ${COLORS.gray700};
	line-height: 1.45;
	cursor: pointer;

	input {
		margin-top: 2px;
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
	}

	@media (max-width: 640px) {
		padding: 10px;
	}
`;

export const SuggestionToggleText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`;

export const SuggestionToggleHint = styled.span`
	color: ${COLORS.textSecondary};
	font-size: 13px;

	@media (max-width: 640px) {
		font-size: 12px;
	}
`;

export const SuggestionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 10px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 8px;
	}
`;

export const SuggestionCard = styled.label<{ $selected?: boolean }>`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px;
	border: 1px solid ${({ $selected }) => ($selected ? COLORS.primary : COLORS.border)};
	border-radius: 12px;
	background: ${({ $selected }) => ($selected ? COLORS.primaryLight : COLORS.white)};
	color: ${COLORS.textPrimary};
	cursor: pointer;
	min-width: 0;

	input {
		margin-top: 1px;
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
	}

	@media (max-width: 640px) {
		align-items: center;
		padding: 10px 12px;
		border-radius: 10px;
	}
`;

export const SuggestionCardTitle = styled.span`
	display: block;
	font-size: 14px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const SuggestionCardMeta = styled.span`
	display: block;
	font-size: 12px;
	color: ${COLORS.textSecondary};
	margin-top: 2px;
`;

export const SuggestionMoreButton = styled.button`
	align-self: flex-start;
	border: 1px solid ${COLORS.gray300};
	background: ${COLORS.white};
	color: ${COLORS.textPrimary};
	border-radius: 10px;
	padding: 9px 12px;
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;

	&:hover {
		background: ${COLORS.bgLight};
	}

	@media (max-width: 640px) {
		width: 100%;
		padding: 11px 12px;
		text-align: center;
	}
`;

export const SuggestedTaskGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	padding: 0;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
	overflow: hidden;

	@media (max-width: 640px) {
		border-radius: 10px;
	}
`;

export const SuggestedTaskGroupHeader = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px;
	border: none;
	background: ${COLORS.white};
	color: ${COLORS.textPrimary};
	text-align: left;
	cursor: pointer;

	&:hover {
		background: ${COLORS.bgLight};
	}

	@media (max-width: 640px) {
		padding: 12px;
		align-items: flex-start;
	}
`;

export const SuggestedTaskGroupTitle = styled.span`
	margin: 0;
	font-size: 14px;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const SuggestedTaskGroupMeta = styled.span`
	display: block;
	margin-top: 3px;
	font-size: 12px;
	font-weight: 600;
	color: ${COLORS.textSecondary};
`;

export const SuggestedTaskGroupAction = styled.span`
	flex: 0 0 auto;
	font-size: 12px;
	font-weight: 800;
	color: ${COLORS.primaryDark};
`;

export const SuggestedTaskList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 0 14px 14px;

	@media (max-width: 640px) {
		gap: 0;
		padding: 0 12px 12px;
	}
`;

export const SuggestedTaskRow = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	font-size: 13px;
	line-height: 1.45;
	color: ${COLORS.gray700};
	cursor: pointer;

	input {
		margin-top: 1px;
		width: 18px;
		height: 18px;
		flex: 0 0 auto;
	}

	@media (max-width: 640px) {
		padding: 9px 0;
		border-top: 1px solid ${COLORS.borderLight};

		&:first-of-type {
			border-top: none;
		}
	}
`;

export const SuggestedTaskText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`;

export const SuggestedTaskInterval = styled.span`
	color: ${COLORS.textSecondary};
	font-size: 12px;

	@media (max-width: 640px) {
		display: block;
		margin-top: 2px;
	}
`;

export const SuggestedTaskNote = styled.span`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	line-height: 1.45;
`;

export const ReviewGrid = styled.div`
	display: grid;
	grid-template-columns: 180px minmax(0, 1fr);
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	overflow: hidden;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const ReviewLabel = styled.div`
	padding: 12px 14px;
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.textSecondary};
	background: ${COLORS.bgLight};
	border-bottom: 1px solid ${COLORS.border};
`;

export const ReviewValue = styled.div`
	padding: 12px 14px;
	font-size: 13px;
	color: ${COLORS.textPrimary};
	border-bottom: 1px solid ${COLORS.border};

	img {
		width: 88px;
		height: 52px;
		object-fit: cover;
		border-radius: 8px;
	}
`;

export const DashboardVisibilityCard = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
	cursor: pointer;

	input {
		flex: 0 0 auto;
		width: 18px;
		height: 18px;
		margin-top: 2px;
		accent-color: ${COLORS.primary};
	}
`;

export const DashboardVisibilityText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`;

export const DashboardVisibilityTitle = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const DashboardVisibilityHint = styled.span`
	font-size: 12px;
	line-height: 1.45;
	color: ${COLORS.textSecondary};
`;

export const AddDeviceButton = styled.button`
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.white};
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	align-self: flex-start;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	@media (max-width: 1024px) {
		padding: 8px 12px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
		font-size: 12px;
		width: 100%;
	}
`;

export const TagsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	min-height: 30px;
	align-items: center;
	padding: 8px 0;
`;

export const Tag = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	background-color: ${COLORS.infoLight};
	color: ${COLORS.infoDark};
	padding: 6px 12px;
	border-radius: 20px;
	font-size: 13px;
	font-weight: 500;

	@media (max-width: 480px) {
		padding: 4px 10px;
		font-size: 11px;
	}
`;

export const RemoveTagButton = styled.button`
	background: none;
	border: none;
	color: inherit;
	cursor: pointer;
	font-size: 16px;
	padding: 0;
	line-height: 1;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.7;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const TagInput = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 8px;
`;

export const AddButton = styled.button`
	padding: 8px 16px;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.white};
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	white-space: nowrap;
	transition: background-color 0.2s ease;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	@media (max-width: 480px) {
		padding: 6px 12px;
		font-size: 12px;
	}
`;

export const MaintenanceHistoryBox = styled.div`
	border: 1px solid ${COLORS.border};
	border-radius: 4px;
	max-height: 200px;
	overflow-y: auto;
	background-color: ${COLORS.canvas};

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: ${COLORS.gray300};
		border-radius: 3px;
	}

	@media (max-width: 480px) {
		max-height: 180px;
	}
`;

export const HistoryItem = styled.div`
	padding: 12px 16px;
	border-bottom: 1px solid ${COLORS.border};

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: ${COLORS.borderLight};
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 13px;
	}
`;

export const FileUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (max-width: 480px) {
		gap: 10px;
	}
`;

export const DialogFooter = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	padding: 16px 24px;
	border-top: 1px solid ${COLORS.border};
	background-color: ${COLORS.canvas};
	flex-shrink: 0;

	@media (max-width: 1024px) {
		padding: 12px 20px;
		gap: 10px;
	}

	@media (max-width: 480px) {
		padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
		gap: 8px;
		flex-direction: column-reverse;
		align-items: stretch;
	}
`;

export const FooterActionGroup = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;
	flex-wrap: wrap;

	&:last-child {
		justify-content: flex-end;
	}

	@media (max-width: 480px) {
		width: 100%;
		align-items: stretch;
		gap: 8px;

		&:last-child {
			flex-direction: row;
			flex-wrap: nowrap;
			justify-content: flex-end;
		}

		&:last-child > button:first-child {
			flex: 0 0 auto;
			width: auto;
			min-width: 72px;
		}

		&:last-child > button:last-child {
			flex: 1 1 auto;
			width: auto;
		}
	}
`;

export const FooterTextAction = styled.button<{ $tone?: 'danger' | 'warning' }>`
	border: none;
	background: transparent;
	padding: 8px 4px;
	color: ${({ $tone }) =>
		$tone === 'danger'
			? COLORS.errorDark
			: $tone === 'warning'
				? COLORS.warningDark
				: COLORS.textSecondary};
	font-size: 13px;
	font-weight: 700;
	cursor: pointer;
	text-decoration: underline;
	text-underline-offset: 3px;

	&:hover:not(:disabled) {
		color: ${({ $tone }) =>
		$tone === 'danger'
			? COLORS.errorDark
			: $tone === 'warning'
				? COLORS.warningDark
				: COLORS.gray700};
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	@media (max-width: 480px) {
		width: 100%;
		min-height: 36px;
		text-align: center;
	}
`;

export const SaveButton = styled.button`
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.white};
	border: none;
	padding: 10px 24px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	&:active {
		background: ${COLORS.primaryDark};
	}

	@media (max-width: 1024px) {
		padding: 8px 16px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px 16px;
		font-size: 13px;
		width: 100%;
	}
`;

export const CancelButton = styled.button`
	background-color: ${COLORS.border};
	color: ${COLORS.gray700};
	border: none;
	padding: 10px 24px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${COLORS.gray300};
	}

	@media (max-width: 1024px) {
		padding: 8px 16px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px 16px;
		font-size: 13px;
		width: 100%;
	}
`;
