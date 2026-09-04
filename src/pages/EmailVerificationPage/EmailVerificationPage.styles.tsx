import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const VerificationCard = styled.main`
	box-sizing: border-box;
	width: min(520px, calc(100vw - 32px));
	padding: 2rem;
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.gray200};
	border-radius: 16px;
	box-shadow: ${COLORS.shadowLg};
	text-align: center;

	@media (max-width: 480px) {
		padding: 1.5rem;
	}
`;

export const VerificationMark = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	margin-bottom: 1rem;
	border-radius: 50%;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 1.35rem;
`;

export const VerificationTitle = styled.h1`
	margin: 0;
	color: ${COLORS.gray900};
	font-size: 1.6rem;
`;

export const VerificationText = styled.p`
	margin: 0.85rem 0 0;
	color: ${COLORS.gray600};
	font-size: 0.95rem;
	line-height: 1.6;
	word-break: break-word;
`;

export const VerificationActions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-top: 1.5rem;
`;

export const PrimaryAction = styled.button`
	min-height: 44px;
	padding: 0.75rem 1rem;
	border: 0;
	border-radius: 8px;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	font: inherit;
	font-weight: 700;
	cursor: pointer;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

export const SecondaryAction = styled(PrimaryAction)`
	border: 1px solid ${COLORS.gray300};
	background: ${COLORS.bgWhite};
	color: ${COLORS.primaryDark};
`;

export const TextAction = styled.button`
	padding: 0.5rem;
	border: 0;
	background: transparent;
	color: ${COLORS.gray600};
	font: inherit;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
`;

export const VerificationMessage = styled.p<{ $error?: boolean }>`
	margin: 1rem 0 0;
	padding: 0.75rem;
	border-radius: 8px;
	background: ${({ $error }) => ($error ? COLORS.errorLight : COLORS.primaryLight)};
	color: ${({ $error }) => ($error ? COLORS.errorDark : COLORS.primaryDark)};
	font-size: 0.875rem;
	line-height: 1.45;
`;
