import styled, { css } from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const AppZeroStateShell = styled.section<{ $fullPage?: boolean }>`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 14% 18%, rgba(16, 185, 129, 0.14) 0, rgba(16, 185, 129, 0) 42%),
			radial-gradient(circle at 86% 84%, rgba(59, 130, 246, 0.12) 0, rgba(59, 130, 246, 0) 45%);
		pointer-events: none;
	}

	${({ $fullPage }) =>
		$fullPage &&
		css`
			min-height: calc(100vh - 64px);
			padding: 20px;
		`}

	@media (max-width: 480px) {
		padding: 20px 12px;
	}
`;

export const AppZeroStateCard = styled.div`
	width: min(100%, 520px);
	background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
	border: 1px solid ${COLORS.gray200};
	border-radius: 18px;
	box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
	padding: 34px;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	position: relative;
	z-index: 1;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 6px;
		border-top-left-radius: 18px;
		border-top-right-radius: 18px;
		background: linear-gradient(90deg, #16a34a 0%, #10b981 52%, #38bdf8 100%);
	}

	@media (max-width: 480px) {
		padding: 28px 18px;
		border-radius: 16px;
	}
`;

export const AppZeroStateIcon = styled.div`
	width: 54px;
	height: 54px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #16a34a 0%, #10b981 68%, #34d399 100%);
	color: #ffffff;
	font-size: 1.15rem;
	font-weight: 800;
	box-shadow: 0 8px 18px rgba(16, 185, 129, 0.34);
	margin-top: 4px;
`;

export const AppZeroStateBadge = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.36rem 0.7rem;
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	border: 1px solid rgba(16, 185, 129, 0.24);
	color: ${COLORS.primaryDark};
	font-size: 0.73rem;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	font-weight: 700;
`;

export const AppZeroStateTitle = styled.h2`
	margin: 0;
	font-size: clamp(1.28rem, 2.2vw, 1.56rem);
	font-weight: 800;
	color: ${COLORS.textPrimary};
	line-height: 1.2;
	max-width: 26ch;
`;

export const AppZeroStateDescription = styled.p`
	margin: 0;
	max-width: 420px;
	color: ${COLORS.gray600};
	font-size: 0.98rem;
	line-height: 1.58;
`;

export const AppZeroStateActions = styled.div`
	margin-top: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		width: 100%;
		flex-direction: column;
	}
`;

export const AppZeroStateButton = styled.button<{
	$variant?: 'primary' | 'secondary';
	$hideOnCompact?: boolean;
}>`
	border: ${({ $variant }) =>
		$variant === 'secondary' ? `1px solid ${COLORS.gray300}` : 'none'};
	border-radius: 10px;
	background: ${({ $variant }) =>
		$variant === 'secondary' ? COLORS.bgWhite : COLORS.gradientPrimary};
	color: ${({ $variant }) =>
		$variant === 'secondary' ? COLORS.textPrimary : '#ffffff'};
	font-size: 0.92rem;
	font-weight: 800;
	padding: 0.72rem 1.04rem;
	min-height: 44px;
	cursor: pointer;
	transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
	box-shadow: ${({ $variant }) =>
		$variant === 'secondary' ? 'none' : '0 8px 18px rgba(16, 185, 129, 0.22)'};

	&:hover:not(:disabled) {
		background: ${({ $variant }) =>
			$variant === 'secondary' ? COLORS.gray50 : '#15803d'};
		transform: translateY(-1px);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	@media (max-width: 480px) {
		width: 100%;
	}

	@media (max-width: 1024px) {
		${({ $hideOnCompact }) =>
			$hideOnCompact &&
			css`
				display: none;
			`}
	}
`;
