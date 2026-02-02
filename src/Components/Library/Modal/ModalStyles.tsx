import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

/**
 * Shared modal/dialog overlay styles used across the app
 * Provides consistent positioning, backdrop, and container styles
 */

export const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
	animation: fadeIn 0.2s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const ModalContainer = styled.div`
	background: white;
	border-radius: 12px;
	width: 100%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	animation: slideUp 0.3s ease-in-out;
	display: flex;
	flex-direction: column;

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		max-width: 90%;
		max-height: 85vh;
	}

	@media (max-width: 480px) {
		max-width: 95%;
		max-height: 90vh;
		border-radius: 10px;
	}
`;

export const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-bottom: 2px solid ${COLORS.primaryLight};
	background: linear-gradient(
		135deg,
		${COLORS.primaryLight} 0%,
		rgba(16, 185, 129, 0.05) 100%
	);
	flex-shrink: 0;
`;

export const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: ${COLORS.primaryDark};

	@media (max-width: 480px) {
		font-size: 1.25rem;
	}
`;

export const ModalCloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: ${COLORS.gray400};
	cursor: pointer;
	padding: 0;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${COLORS.primaryLight};
		color: ${COLORS.primary};
	}
`;

export const ModalBody = styled.div`
	padding: 2rem;
	flex: 1;
	overflow-y: auto;
`;

export const ModalFooter = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1.5rem;
	border-top: 1px solid ${COLORS.gray200};
	background-color: ${COLORS.gray50};
	justify-content: flex-end;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
	}
`;

export const ModalButton = styled.button`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 14px;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

// Dialog styles (alias for Modal, commonly used in forms)
export const DialogOverlay = ModalOverlay;
export const DialogContent = ModalContainer;
export const DialogHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 1.5rem 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: ${COLORS.primaryDark};
	padding: 2rem;
	border-bottom: 2px solid ${COLORS.primaryLight};

	h3 {
		margin: 0;
		font-size: 1.5rem;
	}
`;

export const CloseModalButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: ${COLORS.gray400};
	cursor: pointer;
	padding: 0;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	transition: all 0.2s ease;
	&:hover {
		background-color: ${COLORS.primaryLight};
		color: ${COLORS.primary};
	}
`;

export const DialogForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 0;
`;

export const DialogButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
	justify-content: flex-end;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
	}
`;

export const DialogCancelButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: 1.5px solid ${COLORS.gray300};
	background-color: white;
	color: ${COLORS.gray600};
	border-radius: 6px;
	font-weight: 600;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${COLORS.gray50};
		border-color: ${COLORS.gray400};
		color: ${COLORS.gray700};
	}

	&:active {
		background-color: ${COLORS.gray100};
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

export const DialogSubmitButton = styled.button`
	padding: 0.75rem 1.5rem;
	background: linear-gradient(
		135deg,
		${COLORS.primary} 0%,
		${COLORS.primaryDark} 100%
	);
	color: white;
	border: none;
	border-radius: 6px;
	font-weight: 600;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		background: ${COLORS.gray300};
		cursor: not-allowed;
		box-shadow: none;
		transform: none;
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

export const ModalPrimaryButton = styled(ModalButton)`
	background: linear-gradient(
		135deg,
		${COLORS.primary} 0%,
		${COLORS.primaryDark} 100%
	);
	color: white;
	box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	&:disabled {
		background: ${COLORS.gray300};
		cursor: not-allowed;
		box-shadow: none;
		transform: none;
	}
`;

export const ModalSecondaryButton = styled(ModalButton)`
	background: #e5e7eb;
	color: #1f2937;

	&:hover {
		background: #d1d5db;
	}

	&:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}
`;

// Form Components for Modals
export const FormGroup = styled.div`
	margin-bottom: 1.5rem;

	&:last-of-type {
		margin-bottom: 0;
	}
`;

export const FormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: ${COLORS.textPrimary};
	font-size: 14px;
`;

export const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 6px;
	font-size: 14px;
	font-family: inherit;
	transition: all 0.2s ease;
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:hover:not(:focus) {
		border-color: ${COLORS.gray400};
	}
`;

export const FormSelect = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 6px;
	font-size: 14px;
	font-family: inherit;
	background-color: white;
	cursor: pointer;
	transition: all 0.2s ease;
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:hover:not(:focus) {
		border-color: ${COLORS.gray400};
	}
`;

export const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 6px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
	min-height: 100px;
	transition: all 0.2s ease;
	box-sizing: border-box;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:hover:not(:focus) {
		border-color: ${COLORS.gray400};
	}
`;

export const ModalFormContent = styled.div`
	padding: 2rem;
	flex: 1;
	overflow-y: auto;
`;

export const WarningMessage = styled.div`
	padding: 1.5rem;
	background-color: #fff3cd;
	border-left: 4px solid #ffc107;
	border-radius: 4px;
	color: #856404;

	p {
		margin: 0.5rem 0;
		font-size: 0.95rem;
		line-height: 1.5;

		&:first-child {
			margin-top: 0;
		}
	}
`;

export const FormCheckboxGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

export const FormCheckbox = styled.input`
	width: 1.25rem;
	height: 1.25rem;
	cursor: pointer;
	accent-color: ${COLORS.primary};
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 4px;
	transition: all 0.2s ease;

	&:checked {
		background-color: ${COLORS.primary};
		border-color: ${COLORS.primary};
	}

	&:hover {
		border-color: ${COLORS.primary};
	}

	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}
`;
