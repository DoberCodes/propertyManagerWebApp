import styled from 'styled-components';

/**
 * Shared form styled components used across the app
 * Provides consistent form field styling and layout
 */

export const FormGroup = styled.div`
	margin-bottom: 1.25rem;
	width: 100%;
`;

export const FormLabel = styled.label`
	display: block;
	font-weight: 500;
	color: #333;
	margin-bottom: 0.5rem;
	font-size: 14px;
`;

export const FormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	transition: all 0.2s ease;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}

	&::placeholder {
		color: #999;
	}
`;

export const FormTextarea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	min-height: 100px;
	resize: vertical;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}

	&::placeholder {
		color: #999;
	}
`;

export const FormSelect = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	background-color: white;
	cursor: pointer;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	&:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
		opacity: 0.6;
	}
`;

export const FormError = styled.div`
	color: #e74c3c;
	font-size: 13px;
	margin-top: 0.25rem;
`;

export const FormHelperText = styled.div`
	color: #666;
	font-size: 13px;
	margin-top: 0.25rem;
`;

export const FormRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1.25rem;
`;

export const FormSection = styled.div`
	margin-bottom: 2rem;
`;

export const FormSectionTitle = styled.h3`
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid #f0f0f0;
`;
