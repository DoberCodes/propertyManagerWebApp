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
	gap: 0.55rem;
	min-width: 0;
	padding: 0.9rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 9px;
	background: ${COLORS.gray50};
`;

export const SpaceCardHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;

	strong {
		min-width: 0;
		color: ${COLORS.textPrimary};
		font-size: 0.98rem;
		word-break: break-word;
	}
`;

export const SpaceTypeBadge = styled.span`
	flex: 0 0 auto;
	padding: 0.25rem 0.5rem;
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 0.72rem;
	font-weight: 700;
`;

export const SpaceNotes = styled.p`
	margin: 0;
	color: ${COLORS.textSecondary};
	font-size: 0.84rem;
	line-height: 1.45;
	white-space: pre-wrap;
`;

export const SpaceActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: auto;
	padding-top: 0.25rem;

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

	button:last-child:hover:not(:disabled) {
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
