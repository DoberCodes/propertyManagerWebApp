import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: ${COLORS.bgLight};
`;

export const Container = styled.div`
	background: ${COLORS.bgWhite};
	margin: 0;
	padding: 2rem;
	width: 100%;
	max-width: 100%;
	position: relative;
	z-index: 1;
	box-shadow: none;
	border-radius: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;

	@media (max-width: 768px) {
		padding: 1.5rem;
	}

	@media (max-width: 480px) {
		padding: 1rem;
	}
`;

export const FormContentWrapper = styled.div`
	width: 100%;
	max-width: 800px;
`;

export const PageHeader = styled.div`
	margin-bottom: 2rem;
	border-bottom: 2px solid ${COLORS.gray100};
	padding-bottom: 1rem;
`;

export const PageTitle = styled.h1`
	font-size: 1.75rem;
	color: ${COLORS.textPrimary};
	margin: 0;
	font-weight: 600;
`;

export const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

export const FormLabel = styled.label`
	font-weight: 600;
	color: ${COLORS.textPrimary};
	font-size: 0.95rem;
`;

export const FormInput = styled.input`
	padding: 0.75rem;
	border: 1px solid ${COLORS.border};
	border-radius: 6px;
	font-size: 1rem;
	font-family: inherit;
	background-color: ${COLORS.gray50};
	transition:
		border-color 0.2s,
		box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
		background-color: ${COLORS.bgWhite};
	}

	&:disabled {
		background-color: ${COLORS.gray100};
		cursor: not-allowed;
		color: ${COLORS.textMuted};
	}
`;

export const FormTextarea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid ${COLORS.border};
	border-radius: 6px;
	font-size: 1rem;
	font-family: inherit;
	background-color: ${COLORS.gray50};
	resize: vertical;
	min-height: 100px;
	transition:
		border-color 0.2s,
		box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
		background-color: ${COLORS.bgWhite};
	}

	&:disabled {
		background-color: ${COLORS.gray100};
		cursor: not-allowed;
		color: ${COLORS.textMuted};
	}
`;

export const ImageUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	align-items: center;
	padding: 2rem 0;
`;

export const ImagePreview = styled.img`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	border: 3px solid ${COLORS.primary};
	box-shadow: 0 0 0 4px ${COLORS.primaryLight};
`;

export const ImageUploadInput = styled.input`
	display: none;
`;

export const ImageUploadButton = styled.button`
	padding: 0.75rem 1.25rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	width: fit-content;
	box-shadow: ${COLORS.shadowMd};

	&:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: ${COLORS.shadowLg};
	}

	&:disabled {
		background: ${COLORS.gray300};
		cursor: not-allowed;
	}
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	align-items: center;

	@media (max-width: 480px) {
		flex-direction: row;
		justify-content: flex-end;
	}
`;

export const CancelButton = styled.button`
	padding: 0.625rem 1.25rem;
	background-color: ${COLORS.bgWhite};
	color: ${COLORS.textPrimary};
	border: 1px solid ${COLORS.border};
	border-radius: 6px;
	font-weight: 600;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: ${COLORS.gray100};
		border-color: ${COLORS.gray300};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 0.5rem 1rem;
		font-size: 13px;
	}
`;

export const SaveButton = styled.button`
	padding: 0.625rem 1.5rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-weight: 600;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${COLORS.shadowMd};

	&:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: ${COLORS.shadowLg};
	}

	&:disabled {
		background: ${COLORS.gray300};
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 0.5rem 1.25rem;
		font-size: 13px;
	}
`;

export const ErrorMessage = styled.div`
	background-color: #fef2f2;
	color: ${COLORS.error};
	padding: 1rem;
	border-radius: 6px;
	border-left: 4px solid ${COLORS.error};
	font-size: 0.95rem;
`;

export const SuccessMessage = styled.div`
	background-color: #f0fdf4;
	color: ${COLORS.success};
	padding: 1rem;
	border-radius: 6px;
	border-left: 4px solid ${COLORS.success};
	font-size: 0.95rem;
`;

export const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;

	&::after {
		content: '';
		width: 40px;
		height: 40px;
		border: 4px solid ${COLORS.primaryLight};
		border-top-color: ${COLORS.primary};
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;
