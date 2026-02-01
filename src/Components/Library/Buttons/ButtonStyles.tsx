import styled from 'styled-components';

/**
 * Shared button styles used across the application
 * These provide consistent button patterns for actions, forms, and navigation
 */

/**
 * Primary green action button - used for main/positive actions
 */
export const PrimaryButton = styled.button`
	padding: 12px 24px;
	background-color: #22c55e;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #16a34a;
		transform: translateY(-1px);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		padding: 10px 20px;
		font-size: 13px;
	}
`;

/**
 * Secondary button - used for cancel/back actions
 */
export const SecondaryButton = styled.button`
	padding: 12px 24px;
	border: 1px solid #d1d5db;
	background-color: white;
	color: #6b7280;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #f3f4f6;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		padding: 10px 20px;
		font-size: 13px;
	}
`;

/**
 * Danger button - used for delete/destructive actions
 */
export const DangerButton = styled.button`
	padding: 12px 24px;
	background-color: #ef4444;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #dc2626;
		transform: translateY(-1px);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		padding: 10px 20px;
		font-size: 13px;
	}
`;

/**
 * Small action button - used for inline actions, toolbar buttons
 */
export const SmallButton = styled.button`
	padding: 8px 16px;
	background-color: #22c55e;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #16a34a;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 6px 12px;
		font-size: 13px;
	}
`;

/**
 * Icon button - circular button for icon-only actions
 */
export const IconButton = styled.button`
	padding: 8px;
	background-color: transparent;
	color: #6b7280;
	border: none;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover:not(:disabled) {
		background-color: #f3f4f6;
		color: #374151;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

/**
 * Outline button - button with border, no fill
 */
export const OutlineButton = styled.button`
	padding: 12px 24px;
	background-color: transparent;
	color: #22c55e;
	border: 2px solid #22c55e;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #22c55e;
		color: white;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		padding: 10px 20px;
		font-size: 13px;
	}
`;

/**
 * Modal action button row - container for modal footer buttons
 */
export const ButtonRow = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;

	@media (max-width: 480px) {
		flex-direction: column-reverse;
		gap: 8px;

		button {
			width: 100%;
		}
	}
`;

// Aliases for common patterns (backwards compatibility)
export const AddButton = SmallButton;
export const CancelButton = SecondaryButton;
export const SubmitButton = PrimaryButton;
export const DeleteButton = DangerButton;
