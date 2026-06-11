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

	@media (max-width: 480px) {
		padding: 0.75rem;
		align-items: center;
		padding-top: max(0.75rem, env(safe-area-inset-top));
		padding-right: max(0.75rem, env(safe-area-inset-right));
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
		padding-left: max(0.75rem, env(safe-area-inset-left));
	}
`;

export const ModalContainer = styled.div`
	background: white;
	border-radius: 12px;
	width: 100%;
	max-width: 860px;
	height: 78vh;
	max-height: 92vh;
	min-height: 500px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
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

	@media (max-width: 1024px) {
		max-width: 90%;
		height: 82vh;
		max-height: 90vh;
		min-height: 400px;
	}

	@media (max-width: 480px) {
		max-width: calc(100vw - 1.5rem);
		height: auto;
		max-height: calc(100dvh - 1.5rem);
		min-height: 0;
		border-radius: 12px;
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

	@media (max-width: 480px) {
		padding: 1rem 1.25rem;
	}
`;

export const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: ${COLORS.primaryDark};

	@media (max-width: 480px) {
		font-size: 1.375rem;
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

	@media (max-width: 480px) {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.75rem;
	}
`;

export const ModalBody = styled.div`
	flex: 1;
	overflow-y: auto;

	@media (max-width: 480px) {
		padding: 1.25rem;
	}
`;

export const ModalFooter = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1.5rem;
	border-top: 1px solid ${COLORS.gray200};
	background-color: ${COLORS.gray50};
	justify-content: flex-end;

	@media (max-width: 480px) {
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		padding: 1rem 1.25rem;
		gap: 0.65rem;

		> button:last-child {
			flex: 1 1 auto;
		}
	}
`;

export const ModalButton = styled.button`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	font-size: 14px;
	min-height: 44px; /* Better touch target */

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 0.875rem 1.25rem;
		font-size: 16px;
		min-height: 44px; /* Larger touch target on mobile */
	}
`;

// Dialog styles (alias for Modal, commonly used in forms)
export const DialogOverlay = ModalOverlay;
export const DialogContent = ModalContainer;
export const DialogHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 1rem 0;
	font-size: 1.5rem;
	font-weight: 700;
	color: ${COLORS.primaryDark};
	padding: 1.5rem 1.5rem 1.25rem;
	border-bottom: 2px solid ${COLORS.primaryLight};

	h3 {
		margin: 0;
		font-size: 1.5rem;
	}

	@media (max-width: 480px) {
		padding: 1.1rem 0.875rem 0.95rem;
		margin-bottom: 0.75rem;

		h3 {
			font-size: 1.2rem;
		}
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

	@media (max-width: 480px) {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.75rem;
	}
`;

export const DialogForm = styled.form`
	display: flex;
	flex-direction: column;
	gap: 0;
	flex: 1;
	min-height: 0;
	position: relative;
	height: 100%;
`;

export const DialogButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 2rem;
	justify-content: flex-end;
	position: relative;
	background: white;
	padding: 1rem 1.5rem;
	width: 100%;
	border-top: 1px solid ${COLORS.gray200};

	@media (max-width: 480px) {
		flex-direction: row;
		align-items: center;
		flex-wrap: nowrap;
		padding: 0.85rem 1rem;
		gap: 0.625rem;
		margin-top: 1rem;
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
	min-height: 44px; /* Better touch target */

	&:hover {
		background-color: ${COLORS.gray50};
		border-color: ${COLORS.gray400};
		color: ${COLORS.gray700};
	}

	&:active {
		background-color: ${COLORS.gray100};
	}

	@media (max-width: 480px) {
		width: auto;
		flex: 0 0 auto;
		min-width: 72px;
		padding: 0.75rem 0.35rem;
		border-color: transparent;
		background: transparent;
		color: ${COLORS.gray600};
		font-size: 15px;
		text-decoration: underline;
		text-underline-offset: 3px;
		min-height: 44px;
	}

	@media (max-width: 480px) {
		&:hover {
			background-color: transparent;
			border-color: transparent;
			color: ${COLORS.gray700};
		}
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
	min-height: 44px; /* Better touch target */

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
		width: auto;
		flex: 1 1 auto;
		padding: 0.8rem 1.1rem;
		font-size: 15px;
		min-height: 44px;
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

	@media (max-width: 480px) {
		flex: 1 1 auto;
		width: auto;
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

	@media (max-width: 480px) {
		flex: 0 0 auto;
		width: auto;
		min-width: 72px;
		padding: 0.75rem 0.35rem;
		border: none;
		background: transparent;
		color: ${COLORS.gray600};
		text-decoration: underline;
		text-underline-offset: 3px;

		&:hover {
			background: transparent;
			color: ${COLORS.gray800};
		}
	}
`;

// Form Components for Modals
export const FormGroup = styled.div`
	width: 100%;
	margin-bottom: 1.5rem;

	&:last-of-type {
		margin-bottom: 0;
	}

	@media (max-width: 480px) {
		margin-bottom: 1rem;
	}
`;

export const FormGrid = styled.div`
	width: 100%; /* ensure grid takes full container width */
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1.25rem 1.5rem;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

export const FormGroupFull = styled(FormGroup)`
	grid-column: 1 / -1;
`;

export const FormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: ${COLORS.textPrimary};
	font-size: 14px;

	@media (max-width: 480px) {
		font-size: 15px;
		margin-bottom: 0.625rem;
	}
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
	min-height: 44px; /* Better touch target */

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:hover:not(:focus) {
		border-color: ${COLORS.gray400};
	}

	/* compact controls on tablet/mobile after breakpoint change */
	@media (max-width: 1024px) {
		padding: 0.5rem;
		font-size: 13px;
		min-height: 40px;
	}

	@media (max-width: 480px) {
		padding: 0.875rem;
		font-size: 16px; /* Prevent zoom on iOS */
		min-height: 48px; /* Larger touch target on mobile */
	}
`;

export const FormSelect = styled.select`
	width: 100%;
	max-width: 100%;
	border: 1.5px solid ${COLORS.gray300};
	border-radius: 6px;
	font-size: 14px;
	font-family: inherit;
	background-color: white;
	cursor: pointer;
	transition: all 0.2s ease;
	box-sizing: border-box;
	min-height: 44px; /* Better touch target */
	overflow: hidden; /* Clip any overflow */

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	&:hover:not(:focus) {
		border-color: ${COLORS.gray400};
	}

	/* slightly smaller on tablet/mobile so native pickers don't feel oversized */
	@media (max-width: 1024px) {
		font-size: 13px;
	}

	@media (max-width: 480px) {
		font-size: 14px; /* Prevent zoom on iOS */
	}
`;

export const FormOptions = styled.option`
	max-width: fit-content;
	width: 50%;
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

	@media (max-width: 480px) {
		font-size: 16px; /* Prevent zoom on iOS */
		min-height: 120px;
		padding: 0.875rem;
	}
`;

export const ModalFormContent = styled.div`
	padding: 0 1.5rem 1rem;
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	min-height: 0;
	display: flex;
	flex-direction: column;

	@media (max-width: 480px) {
		padding: 0 1rem 1rem;
	}
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

/**
 * Tab Navigation Components
 */
export const ModalTabContainer = styled.div`
	display: flex;
	border-bottom: 2px solid ${COLORS.gray200};
	margin-bottom: 1.25rem;
	gap: 0.5rem;
	flex-wrap: wrap;
	overflow-x: auto;
	padding-bottom: 0.25rem;
	background: white;

	@media (max-width: 768px) {
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 480px) {
		flex-wrap: nowrap;
		gap: 0.35rem;
		margin-bottom: 1rem;
		padding-top: 0.15rem;
		padding-bottom: 0.35rem;
	}
`;

export const ModalTab = styled.button<{ $active: boolean }>`
	padding: 0.7rem 1rem;
	white-space: nowrap;
	background: ${(props) =>
		props.$active ? COLORS.primaryLight : 'transparent'};
	color: ${(props) => (props.$active ? COLORS.primary : COLORS.gray600)};
	border: none;
	border-bottom: 2px solid
		${(props) => (props.$active ? COLORS.primary : 'transparent')};
	font-weight: ${(props) => (props.$active ? '600' : '500')};
	font-size: 0.95rem;
	cursor: pointer;
	transition: all 0.2s;
	border-radius: 0.375rem 0.375rem 0 0;

	&:hover {
		background: ${(props) =>
			props.$active ? COLORS.primaryLight : COLORS.gray100};
		color: ${(props) => (props.$active ? COLORS.primary : COLORS.gray800)};
	}

	&:focus {
		outline: none;
		box-shadow: 0 0 0 2px ${COLORS.primaryLight};
	}

	@media (max-width: 768px) {
		padding: 0.625rem 0.75rem;
		font-size: 0.85rem;
	}

	@media (max-width: 480px) {
		flex: 0 0 auto;
		padding: 0.58rem 0.62rem;
		font-size: 0.78rem;
	}
`;

export const ModalTabContent = styled.div<{ $active: boolean }>`
	display: ${(props) => (props.$active ? 'block' : 'none')};
`;
