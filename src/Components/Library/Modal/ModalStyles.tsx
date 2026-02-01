import styled from 'styled-components';

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
`;

export const ModalContainer = styled.div`
	background: white;
	border-radius: 8px;
	width: 100%;
	max-width: 600px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

	@media (max-width: 768px) {
		max-width: 90%;
		max-height: 85vh;
	}

	@media (max-width: 480px) {
		max-width: 95%;
		max-height: 90vh;
		border-radius: 6px;
	}
`;

export const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-bottom: 1px solid #e0e0e0;
`;

export const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;

	@media (max-width: 480px) {
		font-size: 1.25rem;
	}
`;

export const ModalCloseButton = styled.button`
	background: none;
	border: none;
	font-size: 1.5rem;
	color: #6b7280;
	cursor: pointer;
	padding: 0;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #1f2937;
	}
`;

export const ModalBody = styled.div`
	padding: 1.5rem;
`;

export const ModalFooter = styled.div`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	border-top: 1px solid #e0e0e0;
	justify-content: flex-end;

	@media (max-width: 480px) {
		flex-direction: column;
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
export const DialogHeader = styled.h2`
	margin: 0 0 1.5rem 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e0e0e0;
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
		flex-direction: column;
	}
`;

export const DialogCancelButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: 1px solid #ddd;
	background-color: white;
	color: #666;
	border-radius: 4px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #f5f5f5;
		border-color: #ccc;
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

export const DialogSubmitButton = styled.button`
	padding: 0.75rem 1.5rem;
	background-color: #667eea;
	color: white;
	border: none;
	border-radius: 4px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: #5568d3;
	}

	&:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

export const ModalPrimaryButton = styled(ModalButton)`
	background: #22c55e;
	color: white;

	&:hover {
		background: #16a34a;
	}

	&:disabled {
		background: #d1d5db;
		cursor: not-allowed;
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
