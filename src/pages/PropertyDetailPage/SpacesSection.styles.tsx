import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const SpacesContainer = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1.5rem;
	padding: 1.25rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	background: ${COLORS.white};

	@media (max-width: 480px) {
		padding: 1rem;
		margin-top: 1rem;
	}
`;

export const SpacesHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;

	@media (max-width: 480px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

export const SpacesHeading = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.3rem;

	h3 {
		margin: 0;
		font-size: 1.1rem;
		color: ${COLORS.textPrimary};
	}

	p {
		margin: 0;
		color: ${COLORS.textSecondary};
		font-size: 0.9rem;
		line-height: 1.45;
	}
`;

export const AddSpaceButton = styled.button`
	flex: 0 0 auto;
	min-height: 40px;
	padding: 0.65rem 1rem;
	border: none;
	border-radius: 7px;
	background: ${COLORS.primary};
	color: white;
	font-weight: 700;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: ${COLORS.primaryHover};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		min-height: 46px;
	}
`;

export const SpacesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(
		auto-fit,
		minmax(min(100%, max(220px, calc((100% - 2.25rem) / 4))), 1fr)
	);
	gap: 0.75rem;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`;

export const SpaceCard = styled.article`
	display: flex;
	flex-direction: column;
	min-width: 0;
	border: 1px solid ${COLORS.gray200};
	border-radius: 9px;
	background: ${COLORS.gray50};
	overflow: hidden;
`;

export const SpaceCardOpenArea = styled.button`
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: stretch;
	gap: 0.7rem;
	width: 100%;
	padding: 0.9rem;
	border: 0;
	background: transparent;
	color: inherit;
	text-align: left;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background: ${COLORS.white};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: -2px;
	}
`;

export const SpaceCardHeader = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 0.6rem;

	strong {
		min-width: 0;
		color: ${COLORS.textPrimary};
		font-size: 0.98rem;
		line-height: 1.35;
		overflow-wrap: break-word;
		word-break: normal;
	}
`;

export const SpaceCardTypeRow = styled.div`
	display: flex;
	justify-content: flex-end;
	min-height: 1.65rem;
	min-width: 0;
`;

export const SpaceCardIdentityRow = styled.div`
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: center;
	gap: 0.75rem;
	min-width: 0;

	strong {
		min-width: 0;
	}
`;

export const SpaceCardIcon = styled.span`
	display: inline-flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	width: 2.35rem;
	height: 2.35rem;
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 1rem;
`;

export const SpaceTypeBadge = styled.span`
	flex: 0 0 auto;
	max-width: 100%;
	margin-left: auto;
	padding: 0.25rem 0.5rem;
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 0.72rem;
	font-weight: 700;
	line-height: 1.2;
	text-align: center;
`;

export const SpaceNotes = styled.p`
	margin: 0;
	color: ${COLORS.textSecondary};
	font-size: 0.84rem;
	line-height: 1.45;
	white-space: pre-wrap;
`;

export const ArchivedSpacesToggle = styled.button`
	align-self: flex-start;
	min-height: 38px;
	padding: 0.5rem 0.75rem;
	border: 1px solid ${COLORS.gray300};
	border-radius: 7px;
	background: ${COLORS.white};
	color: ${COLORS.textSecondary};
	font-weight: 700;
	cursor: pointer;

	&:hover {
		border-color: ${COLORS.primary};
		color: ${COLORS.primary};
	}
`;

export const ArchivedSpacesPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding-top: 1rem;
	border-top: 1px solid ${COLORS.gray200};

	h4 {
		margin: 0;
		color: ${COLORS.textPrimary};
		font-size: 0.95rem;
	}
`;

export const SpaceLinkedCount = styled.span`
	color: ${COLORS.textMuted};
	font-size: 0.78rem;
	font-weight: 600;
`;

export const SpaceActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: auto;
	padding: 0.7rem 0.9rem 0.85rem;
	border-top: 1px solid ${COLORS.gray200};
	background: ${COLORS.white};

	button {
		min-height: 36px;
		padding: 0.4rem 0.65rem;
		border-radius: 6px;
		border: 1px solid ${COLORS.gray300};
		background: white;
		color: ${COLORS.textSecondary};
		font-weight: 600;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		border-color: ${COLORS.primary};
		color: ${COLORS.primary};
	}

	button[data-tone='danger']:hover:not(:disabled) {
		border-color: #dc2626;
		color: #dc2626;
	}
`;

export const SpacesEmptyState = styled.div`
	padding: 1.25rem;
	border: 1px dashed ${COLORS.gray300};
	border-radius: 9px;
	background: ${COLORS.gray50};
	text-align: center;

	strong {
		display: block;
		margin-bottom: 0.35rem;
		color: ${COLORS.textPrimary};
	}

	p {
		margin: 0;
		color: ${COLORS.textSecondary};
		font-size: 0.88rem;
		line-height: 1.45;
	}
`;

export const SpaceFormHint = styled.p`
	margin: -0.2rem 0 1rem;
	color: ${COLORS.textSecondary};
	font-size: 0.85rem;
	line-height: 1.45;
`;

export const SpaceFormError = styled.div`
	margin-bottom: 1rem;
	padding: 0.7rem 0.8rem;
	border-radius: 7px;
	background: #fef2f2;
	color: #b91c1c;
	font-size: 0.85rem;
`;

export const SpacesStatus = styled.p`
	margin: 0;
	color: ${COLORS.textSecondary};
	font-size: 0.88rem;
`;

export const SpaceCardSummary = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.55rem 0.75rem;
`;

export const SpaceCardMetric = styled.span`
	display: flex;
	flex-direction: column;
	gap: 0.15rem;
	min-width: 0;

	strong {
		color: ${COLORS.textPrimary};
		font-size: 0.9rem;
	}

	span {
		color: ${COLORS.textMuted};
		font-size: 0.66rem;
		line-height: 1.2;
		overflow-wrap: break-word;
	}
`;

export const SpaceNextAction = styled.span`
	display: block;
	min-height: 2.35rem;
	padding: 0.55rem 0.65rem;
	border-radius: 7px;
	background: ${COLORS.white};
	color: ${COLORS.textSecondary};
	font-size: 0.76rem;
	font-weight: 600;
	line-height: 1.35;

	&[data-tone='attention'] {
		background: #fff7ed;
		color: #c2410c;
	}
`;

export const SpaceDetailList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
`;

export const SpaceDetailIntro = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-bottom: 0.9rem;

	> div:first-child {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	> div:first-child > div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	strong {
		color: ${COLORS.textPrimary};
	}

	span {
		color: ${COLORS.textSecondary};
		font-size: 0.84rem;
		line-height: 1.4;
	}
`;

export const SpaceDetailMetrics = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0.65rem;
	margin-bottom: 0.9rem;

	@media (max-width: 600px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
`;

export const SpaceDetailMetric = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	padding: 0.8rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 8px;
	background: ${COLORS.gray50};

	strong {
		color: ${COLORS.textPrimary};
		font-size: 1.15rem;
	}

	span {
		color: ${COLORS.textSecondary};
		font-size: 0.75rem;
	}

	&[data-tone='attention'] {
		border-color: #fed7aa;
		background: #fff7ed;

		strong,
		span {
			color: #c2410c;
		}
	}
`;

export const SpaceDetailGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.9rem;
	margin-bottom: 0.9rem;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

export const SpaceDetailSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 0.7rem;
	min-width: 0;
	padding: 0.9rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 10px;
	background: ${COLORS.white};
`;

export const SpaceDetailSectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;

	> div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	h4 {
		margin: 0;
		color: ${COLORS.textPrimary};
		font-size: 0.96rem;
	}

	span {
		color: ${COLORS.textMuted};
		font-size: 0.74rem;
	}

	button {
		flex: 0 0 auto;
		min-height: 34px;
		padding: 0.4rem 0.6rem;
		border: 1px solid ${COLORS.gray300};
		border-radius: 6px;
		background: ${COLORS.white};
		color: ${COLORS.primary};
		font-weight: 700;
		cursor: pointer;
	}
`;

export const SpaceDetailActions = styled.div`
	display: flex;
	justify-content: flex-end;
	padding-top: 0.25rem;

	button {
		min-height: 40px;
		padding: 0.6rem 0.85rem;
		border: 1px solid ${COLORS.gray300};
		border-radius: 7px;
		background: ${COLORS.white};
		color: ${COLORS.textSecondary};
		font-weight: 700;
		cursor: pointer;
	}
`;

export const SpaceMaintenanceDate = styled.span`
	color: ${COLORS.textSecondary};
`;

export const SpaceDetailItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.8rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 8px;
	background: ${COLORS.gray50};

	div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	strong,
	span {
		word-break: break-word;
	}

	span {
		color: ${COLORS.textSecondary};
		font-size: 0.82rem;
	}

	button {
		flex: 0 0 auto;
		min-height: 38px;
		padding: 0.5rem 0.75rem;
		border: 1px solid ${COLORS.primary};
		border-radius: 7px;
		background: ${COLORS.white};
		color: ${COLORS.primary};
		font-weight: 700;
		cursor: pointer;
	}

	@media (max-width: 480px) {
		align-items: stretch;
		flex-direction: column;

		button {
			width: 100%;
		}
	}
`;

export const SpaceDetailEmpty = styled.p`
	margin: 0;
	padding: 1rem;
	border: 1px dashed ${COLORS.gray300};
	border-radius: 8px;
	color: ${COLORS.textSecondary};
	font-size: 0.88rem;
	line-height: 1.5;
`;
