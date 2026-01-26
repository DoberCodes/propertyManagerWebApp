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
	max-width: 600px;
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
		background-color: #f0f0f0;
		color: #333;
	}
`;

export const ModalBody = styled.div`
	padding: 1.5rem;
`;

export const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

export const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #333;
	font-size: 0.95rem;
`;

export const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 1rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
	}
`;

export const FileUploadArea = styled.div`
	position: relative;
	width: 100%;
`;

export const FileInput = styled.input`
	position: absolute;
	width: 0.1px;
	height: 0.1px;
	opacity: 0;
	overflow: hidden;
	z-index: -1;
`;

export const FileUploadLabel = styled.label`
	display: block;
	width: 100%;
	padding: 2rem;
	border: 2px dashed #ddd;
	border-radius: 8px;
	text-align: center;
	cursor: pointer;
	transition: all 0.2s ease;
	background-color: #fafafa;

	&:hover {
		border-color: #3498db;
		background-color: #f0f8ff;
	}
`;

export const FileInfo = styled.div`
	color: #333;
	word-break: break-word;
`;

export const ErrorMessage = styled.p`
	color: #e74c3c;
	font-size: 0.875rem;
	margin-top: 0.5rem;
	margin-bottom: 0;
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
	justify-content: flex-end;
`;

export const CancelButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: 1px solid #ddd;
	background-color: white;
	color: #666;
	border-radius: 4px;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #f5f5f5;
		border-color: #999;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const SubmitButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: none;
	background-color: #3498db;
	color: white;
	border-radius: 4px;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		background-color: #2980b9;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;
