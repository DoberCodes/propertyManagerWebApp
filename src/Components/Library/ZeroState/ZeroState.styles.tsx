import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const ZeroStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 4rem 2rem;
	text-align: center;
	background: linear-gradient(160deg, ${COLORS.gray50} 0%, #ffffff 100%);
	border-radius: 16px;
	border: 2px dashed ${COLORS.gray200};
	min-height: 320px;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: -40px;
		right: -40px;
		width: 180px;
		height: 180px;
		background: radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, transparent 70%);
		pointer-events: none;
	}

	@media (max-width: 1024px) {
		padding: 3.5rem 1.5rem;
		min-height: 280px;
	}

	@media (max-width: 480px) {
		padding: 3rem 1.5rem;
		min-height: 300px;
	}
`;

export const ZeroStateIcon = styled.div`
	width: 72px;
	height: 72px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 20px;
	background: ${COLORS.primaryLight};
	border: 2px solid rgba(16, 185, 129, 0.18);
	font-size: 36px;
	margin-bottom: 1.5rem;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);

	@media (max-width: 1024px) {
		width: 64px;
		height: 64px;
		font-size: 32px;
		margin-bottom: 1.25rem;
	}

	@media (max-width: 480px) {
		width: 60px;
		height: 60px;
		font-size: 30px;
		margin-bottom: 1.25rem;
	}
`;

export const ZeroStateTitle = styled.h3`
	font-size: 22px;
	font-weight: 800;
	color: #0f172a;
	margin: 0 0 0.6rem 0;
	letter-spacing: -0.01em;

	@media (max-width: 1024px) {
		font-size: 20px;
	}

	@media (max-width: 480px) {
		font-size: 19px;
	}
`;

export const ZeroStateDescription = styled.p`
	font-size: 15px;
	color: #64748b;
	margin: 0 0 2rem 0;
	max-width: 440px;
	line-height: 1.65;

	@media (max-width: 1024px) {
		font-size: 14px;
		margin-bottom: 1.75rem;
	}

	@media (max-width: 480px) {
		font-size: 15px;
		margin-bottom: 1.75rem;
		line-height: 1.6;
	}
`;

export const ZeroStateActions = styled.div`
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	justify-content: center;

	@media (max-width: 480px) {
		flex-direction: column;
		width: 100%;
		max-width: 320px;
		gap: 0.75rem;
	}
`;

export const ZeroStatePrimaryButton = styled.button`
	padding: 0.875rem 1.75rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 8px;
	font-weight: 600;
	font-size: 16px;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${COLORS.shadowMd};
	min-height: 44px; /* Better touch target */

	&:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: ${COLORS.shadowLg};
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 1rem 1.75rem;
		font-size: 16px;
		min-height: 48px; /* Larger touch target on mobile */
	}
`;

export const ZeroStateSecondaryButton = styled.button`
	padding: 0.875rem 1.75rem;
	background-color: ${COLORS.bgWhite};
	color: ${COLORS.primary};
	border: 2px solid ${COLORS.primary};
	border-radius: 8px;
	font-weight: 600;
	font-size: 16px;
	cursor: pointer;
	transition: all 0.2s;
	min-height: 44px; /* Better touch target */

	&:hover:not(:disabled) {
		background-color: ${COLORS.primaryLight};
		border-color: ${COLORS.primaryDark};
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 1rem 1.75rem;
		font-size: 16px;
		min-height: 48px; /* Larger touch target on mobile */
	}
`;
