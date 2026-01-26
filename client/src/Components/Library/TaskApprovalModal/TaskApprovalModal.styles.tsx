import styled from 'styled-components';

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
	max-width: 700px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

export const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem;
	border-bottom: 1px solid #e0e0e0;
	background-color: #f8f9fa;
`;

export const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	color: #333;
`;

export const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 2rem;
	color: #666;
	cursor: pointer;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: all 0.2s ease;

	&:hover {
		background-color: #e0e0e0;
		color: #333;
	}
`;

export const ModalBody = styled.div`
	padding: 1.5rem;
`;

export const InfoSection = styled.div`
	background-color: #f8f9fa;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

export const InfoRow = styled.div`
	display: flex;
	margin-bottom: 1rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

export const InfoLabel = styled.div`
	font-weight: 600;
	color: #555;
	min-width: 150px;
	flex-shrink: 0;
`;

export const InfoValue = styled.div`
	color: #333;
	flex: 1;
`;

export const FilePreview = styled.div`
	display: flex;
	flex-direction: column;
`;

export const FileLink = styled.a`
	color: #3498db;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	transition: color 0.2s ease;

	&:hover {
		color: #2980b9;
		text-decoration: underline;
	}
`;

export const RejectionSection = styled.div`
	border: 2px solid #e74c3c;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 1rem;
	background-color: #fff5f5;
`;

export const TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 1rem;
	font-family: inherit;
	resize: vertical;
	margin-top: 0.5rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #e74c3c;
		box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
	}
`;

export const ErrorMessage = styled.p`
	color: #e74c3c;
	font-size: 0.875rem;
	margin-top: 0.5rem;
	margin-bottom: 1rem;
	padding: 0.75rem;
	background-color: #fff5f5;
	border-left: 4px solid #e74c3c;
	border-radius: 4px;
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 1.5rem;
	justify-content: flex-end;
`;

export const RejectButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: none;
	background-color: #e74c3c;
	color: white;
	border-radius: 4px;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #c0392b;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const ApproveButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: none;
	background-color: #27ae60;
	color: white;
	border-radius: 4px;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #229954;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;
