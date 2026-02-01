import styled from 'styled-components';

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
