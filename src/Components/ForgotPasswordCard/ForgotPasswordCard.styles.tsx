import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: grid;
	justify-content: center;
	align-items: center;
	padding: 32px 24px;
	border: none;
	border-radius: 12px;
	background-color: ${COLORS.bgWhite};
	width: 100%;
	max-width: 420px;
	box-shadow: ${COLORS.shadowLg};
	position: relative;
	z-index: 10;

	@media (max-width: 1024px) {
		max-width: 380px;
		padding: 28px 20px;
		border-radius: 10px;
	}

	@media (max-width: 480px) {
		max-width: 100%;
		padding: 20px 16px;
		border-radius: 8px;
		margin: 10px;
	}
`;

export const Title = styled.h2`
	font-size: 32px;
	font-weight: 800;
	margin: 0 auto 28px auto;
	text-decoration: none;
	text-align: center;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	letter-spacing: 0.5px;

	@media (max-width: 1024px) {
		font-size: 28px;
		margin: 0 auto 24px auto;
	}

	@media (max-width: 480px) {
		font-size: 24px;
		margin: 0 auto 20px auto;
	}
`;

export const Input = styled.input`
	width: 100%;
	padding: 14px 16px;
	border: 2px solid ${COLORS.borderLight};
	border-radius: 8px;
	font-size: 16px;
	margin: 8px 0;
	transition: border-color 0.2s ease;
	background-color: ${COLORS.bgWhite};

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	@media (max-width: 1024px) {
		padding: 12px 14px;
		font-size: 15px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		font-size: 16px; /* Prevent zoom on iOS */
	}
`;

export const Submit = styled.button`
	margin: 24px auto 0 auto;
	font-size: 16px;
	padding: 12px 32px;
	border-radius: 6px;
	border: none;
	background: ${COLORS.gradientPrimary};
	color: white;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);

	&:hover {
		background: ${COLORS.gradientPrimary};
		box-shadow: 0 6px 12px rgba(16, 185, 129, 0.35);
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
		padding: 10px 24px;
		margin: 16px auto 0 auto;
	}
`;

export const BackButton = styled.button`
	position: absolute;
	top: 16px;
	left: 16px;
	background: none;
	border: none;
	font-size: 20px;
	color: ${COLORS.textSecondary};
	cursor: pointer;
	padding: 8px;
	border-radius: 50%;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${COLORS.bgLight};
		color: ${COLORS.primary};
	}

	@media (max-width: 480px) {
		top: 12px;
		left: 12px;
		font-size: 18px;
	}
`;

export const ErrorMessage = styled.div`
	background-color: #fef2f2;
	border: 1px solid #fecaca;
	color: ${COLORS.error};
	padding: 12px;
	margin: 10px;
	border-radius: 5px;
	font-size: 14px;
	text-align: center;

	@media (max-width: 1024px) {
		padding: 10px;
		margin: 8px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px;
		margin: 6px;
		font-size: 12px;
	}
`;

export const SuccessMessage = styled.div`
	background-color: #f0fdf4;
	border: 1px solid #bbf7d0;
	color: ${COLORS.success};
	padding: 12px;
	margin: 10px;
	border-radius: 5px;
	font-size: 14px;
	text-align: center;

	@media (max-width: 1024px) {
		padding: 10px;
		margin: 8px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px;
		margin: 6px;
		font-size: 12px;
	}
`;

export const RegisterWrapper = styled.div`
	margin: 28px 0 0 0;
	text-align: center;
	font-size: 15px;
	color: ${COLORS.textSecondary};

	a {
		color: ${COLORS.primary};
		text-decoration: none;
		font-weight: 600;

		&:hover {
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

export const LoadingSpinner = styled.div`
	display: inline-block;
	width: 16px;
	height: 16px;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top-color: white;
	animation: spin 1s ease-in-out infinite;
	margin-right: 8px;

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;
