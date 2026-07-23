import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.form<{ $wide?: boolean }>`
	display: grid;
	justify-content: center;
	align-items: center;
	padding: ${(props) => (props.$wide ? '14px 36px' : '32px 24px')};
	border: none;
	border-radius: 16px;
	background: linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.canvas} 100%);
	box-sizing: border-box;
	width: ${(props) =>
		props.$wide
			? 'min(1120px, calc(100vw - 48px))'
			: 'min(420px, calc(100vw - 40px))'};
	max-width: none;
	box-shadow: 0 20px 42px rgba(4, 120, 87, 0.16);
	border: 1px solid ${COLORS.border};
	position: relative;
	z-index: 10;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 8px;
		background: ${COLORS.gradientPrimary};
	}

	@media (max-width: 1024px) {
		padding: ${(props) => (props.$wide ? '20px 28px' : '32px 24px')};
		width: ${(props) =>
			props.$wide
				? 'min(920px, calc(100vw - 40px))'
				: 'min(420px, calc(100vw - 40px))'};
		border-radius: 14px;
	}

	@media (max-width: 768px) {
		width: 100%;
		max-width: 540px;
		padding: ${(props) => (props.$wide ? '18px 16px 16px' : '20px 16px 16px')};
		margin: 10px auto;
		border-radius: 14px;
		box-shadow: 0 10px 24px rgba(4, 120, 87, 0.14);
	}

	@media (max-width: 480px) {
		max-width: 420px;
		padding: ${(props) => (props.$wide ? '18px 14px 14px' : '18px 14px 14px')};
		border-radius: 12px;
		margin: 8px auto;
	}
`;

export const BackButton = styled.button`
	padding: 10px 0;
	border: none;
	background: none;
	color: ${COLORS.primary};
	font-size: 18px;
	width: fit-content;
	cursor: pointer;
	transition: color 0.2s ease;

	&:hover {
		color: ${COLORS.primaryHover};
	}

	@media (max-width: 480px) {
		padding: 8px 0;
		font-size: 14px;
	}
`;

export const Title = styled.h2`
	font-size: 32px;
	font-weight: 800;
	margin: 0 auto 28px auto;
	text-decoration: none;
	text-align: center;
	color: ${COLORS.primary};
	letter-spacing: 0.5px;
	line-height: 1.2;

	@media (max-width: 1024px) {
		font-size: 28px;
		margin: 0 auto 24px auto;
	}

	@media (max-width: 480px) {
		font-size: 22px;
		margin: 0 auto 16px auto;
	}
`;

export const TrialNotice = styled.p`
	margin: -10px 0 18px 0;
	font-size: 14px;
	font-weight: 600;
	color: ${COLORS.primaryDark};
	text-align: center;
	background: ${COLORS.primaryLight};
	border: 1px solid ${COLORS.border};
	border-radius: 999px;
	padding: 8px 12px;

	@media (max-width: 1024px) {
		margin: -12px 0 16px 0;
	}

	@media (max-width: 480px) {
		font-size: 13px;
		margin: -10px 0 14px 0;
	}
`;

export const Input = styled.input`
	padding: 12px 14px;
	font-size: 16px;
	margin: 10px 0;
	border: 1.5px solid ${COLORS.border};
	border-radius: 10px;
	width: 100%;
	box-sizing: border-box;
	transition: all 0.2s ease;
	background-color: ${COLORS.bgWhite};

	&:focus {
		outline: none;
		border-color: ${COLORS.primaryHover};
		box-shadow: 0 0 0 3px ${COLORS.successLight};
		background-color: ${COLORS.bgWhite};
	}

	&:hover {
		border-color: ${COLORS.primaryHover};
		background-color: ${COLORS.bgWhite};
	}

	@media (max-width: 1024px) {
		padding: 11px 13px;
		font-size: 15px;
		margin: 9px 0;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 14px;
		margin: 8px 0;
	}
`;

export const Submit = styled.button`
	margin: 24px auto 0 auto;
	font-size: 16px;
	padding: 12px 32px;
	border-radius: 10px;
	border: none;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.white};
	font-weight: 700;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 8px 18px rgba(4, 120, 87, 0.24);

	&:hover {
		background: ${COLORS.gradientPrimary};
		box-shadow: 0 12px 24px rgba(4, 120, 87, 0.28);
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 1024px) {
		font-size: 15px;
		padding: 10px 28px;
		margin: 20px auto 0 auto;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 12px 16px;
		margin: 16px auto 0 auto;
		width: 100%;
	}
`;

export const SectionLabel = styled.p`
	margin: 16px 0 8px 0;
	font-size: 14px;
	font-weight: 600;
	color: ${COLORS.textPrimary};
	text-align: left;

	@media (max-width: 480px) {
		font-size: 13px;
		margin: 14px 0 6px 0;
	}
`;

export const InviteModeBanner = styled.div`
	margin: 10px 0 14px 0;
	padding: 10px 12px;
	border-radius: 6px;
	border: 1px solid ${COLORS.primary};
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 600;
	text-align: left;
`;

export const InviteModeToggle = styled.button`
	margin: 6px 0 0 0;
	padding: 0;
	border: none;
	background: none;
	color: ${COLORS.primary};
	font-size: 13px;
	font-weight: 600;
	text-align: left;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
		color: ${COLORS.primaryDark};
	}
`;

export const InviteModePanel = styled.div<{ $active?: boolean }>`
	margin: 14px 0 10px 0;
	padding: 14px;
	border-radius: 12px;
	border: 1px solid
		${(props) => (props.$active ? COLORS.primaryHover : COLORS.border)};
	background: ${(props) => (props.$active ? COLORS.primaryLight : COLORS.bgLight)};
`;

export const InviteModeTitle = styled.p`
	margin: 0 0 4px 0;
	font-size: 14px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const InviteModeDescription = styled.p`
	margin: 0 0 10px 0;
	font-size: 12px;
	line-height: 1.4;
	color: ${COLORS.textSecondary};
`;

export const InviteModeActionButton = styled.button<{ $secondary?: boolean }>`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid
		${(props) => (props.$secondary ? COLORS.border : COLORS.primaryHover)};
	background: ${(props) => (props.$secondary ? COLORS.bgWhite : COLORS.primaryHover)};
	color: ${(props) => (props.$secondary ? COLORS.primary : COLORS.bgWhite)};
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		opacity: 0.92;
	}
`;

export const TenantPlanCard = styled.div`
	border: 1.5px solid ${COLORS.border};
	border-radius: 12px;
	background-color: ${COLORS.bgLight};
	padding: 16px;
	margin: 8px 0 16px 0;
`;

export const TenantPlanTitle = styled.h3`
	margin: 0 0 6px 0;
	font-size: 18px;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const TenantPlanPrice = styled.div`
	font-size: 22px;
	font-weight: 800;
	color: ${COLORS.primaryDark};
`;

export const TenantPlanNote = styled.p`
	margin: 8px 0 0 0;
	font-size: 13px;
	color: ${COLORS.textSecondary};
`;

export const QuestionLabel = styled.label`
	font-weight: 500;
	font-size: 15px;
	color: ${COLORS.textPrimary};
	margin: 20px 0 12px 0;
	display: block;
	text-align: left;

	@media (max-width: 480px) {
		font-size: 14px;
		margin: 16px 0 10px 0;
	}
`;

export const RadioGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-top: 12px;

	@media (max-width: 1024px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 8px;
	}
`;

export const RadioOption = styled.label`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 14px;
	border: 1.5px solid ${COLORS.border};
	border-radius: 10px;
	background-color: ${COLORS.bgWhite};
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 14px;
	color: ${COLORS.textPrimary};

	&:hover {
		border-color: ${COLORS.primaryHover};
		background-color: ${COLORS.bgWhite};
	}

	&:has(input:checked) {
		border-color: ${COLORS.primaryHover};
		background-color: ${COLORS.primaryLight};
		color: ${COLORS.primary};
		font-weight: 500;
	}

	input {
		accent-color: ${COLORS.primaryHover};
		width: 18px;
		height: 18px;
		margin: 0;
		cursor: pointer;
	}

	@media (max-width: 1024px) {
		padding: 11px 13px;
		font-size: 13px;

		input {
			width: 17px;
			height: 17px;
		}
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 13px;

		input {
			width: 16px;
			height: 16px;
		}
	}
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: center;
	margin-top: 20px;

	button {
		min-width: 140px;
	}

	@media (max-width: 768px) {
		width: 100%;
		justify-content: stretch;

		button {
			flex: 1;
			min-width: 0;
		}
	}

	@media (max-width: 480px) {
		gap: 8px;
		margin-top: 16px;
		flex-direction: column;

		button {
			width: 100%;
		}
	}
`;

export const PasswordMatchText = styled.p<{ matched: boolean }>`
	margin: 8px 0;
	font-size: 13px;
	color: ${(props) => (props.matched ? COLORS.success : COLORS.error)};
	text-align: left;
	font-weight: 500;

	@media (max-width: 480px) {
		font-size: 12px;
		margin: 6px 0;
	}
`;

export const EmailStatusText = styled.p<{ error?: boolean }>`
	margin: 8px 0;
	font-size: 13px;
	color: ${(props) => (props.error ? COLORS.error : COLORS.textSecondary)};
	text-align: left;
	font-weight: 500;

	@media (max-width: 480px) {
		font-size: 12px;
		margin: 6px 0;
	}
`;

export const RegisterWrapper = styled.div`
	margin: 28px 0 0 0;
	text-align: center;
	font-size: 15px;
	color: ${COLORS.textSecondary};

	a {
		color: ${COLORS.primary};
		font-weight: 600;
		cursor: pointer;
		transition: color 0.2s ease;
		text-decoration: none;

		&:hover {
			color: ${COLORS.primaryHover};
			text-decoration: underline;
		}
	}

	@media (max-width: 1024px) {
		margin: 24px 0 0 0;
		font-size: 14px;
	}

	@media (max-width: 480px) {
		margin: 20px 0 0 0;
		font-size: 13px;
	}
`;

export const ErrorMessage = styled.div`
	background-color: ${COLORS.errorLight};
	border: 1px solid ${COLORS.error};
	color: ${COLORS.errorDark};
	padding: 12px;
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
	width: 100%;
	font-weight: 500;

	@media (max-width: 1024px) {
		padding: 10px;
		margin-bottom: 14px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px;
		margin-bottom: 12px;
		font-size: 12px;
	}
`;

export const LoadingSpinner = styled.div`
	border: 3px solid ${COLORS.gray100};
	border-top: 3px solid ${COLORS.primary};
	border-radius: 50%;
	width: 20px;
	height: 20px;
	animation: spin 1s linear infinite;
	display: inline-block;
	margin-right: 8px;
	vertical-align: middle;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`;

export const PasswordInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	margin: 10px 0;
	width: 100%;

	input[type='password'],
	input[type='text'] {
		padding-right: 45px;
	}

	@media (max-width: 1024px) {
		margin: 8px 0;
	}

	@media (max-width: 480px) {
		margin: 6px 0;
	}
`;

export const PasswordToggleButton = styled.button`
	position: absolute;
	right: 12px;
	background: none;
	border: none;
	cursor: pointer;
	color: ${COLORS.gray500};
	font-size: 18px;
	padding: 8px 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;

	&:hover {
		color: ${COLORS.gray700};
	}

	&:focus {
		outline: none;
	}

	@media (max-width: 1024px) {
		font-size: 16px;
		right: 10px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		right: 10px;
		padding: 6px 10px;
	}
`;

export const LegalAgreementSection = styled.div`
	margin-top: 16px;
	margin-bottom: 16px;
	padding: 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.bgLight};
`;

export const LegalAgreementLabel = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 8px;
	font-size: 14px;
	line-height: 1.5;
	color: ${COLORS.textPrimary};

	input {
		margin-top: 2px;
		flex-shrink: 0;
		accent-color: ${COLORS.primaryHover};
	}
`;

export const LegalDocumentButton = styled.button`
	color: ${COLORS.primary};
	text-decoration: none;
	cursor: pointer;
	background: none;
	border: none;
	padding: 0;
	font: inherit;
	font-weight: 600;

	&:hover {
		color: ${COLORS.primaryHover};
		text-decoration: underline;
	}
`;
