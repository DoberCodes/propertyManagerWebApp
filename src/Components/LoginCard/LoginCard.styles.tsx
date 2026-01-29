import styled from 'styled-components';

export const Wrapper = styled.form`
	display: grid;
	justify-content: center;
	align-items: center;
	padding: 32px 24px;
	border: none;
	border-radius: 12px;
	background-color: white;
	width: 100%;
	max-width: 420px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);

	@media (max-width: 768px) {
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
	color: #1f2937;
	letter-spacing: 0.5px;

	@media (max-width: 768px) {
		font-size: 28px;
		margin: 0 auto 24px auto;
	}

	@media (max-width: 480px) {
		font-size: 24px;
		margin: 0 auto 20px auto;
	}
`;

export const Input = styled.input`
	padding: 12px 14px;
	font-size: 16px;
	margin: 10px 0;
	border: 1.5px solid #e5e7eb;
	border-radius: 6px;
	width: 100%;
	box-sizing: border-box;
	transition: all 0.2s ease;
	background-color: #f9fafb;

	&:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
		background-color: white;
	}

	&:hover {
		border-color: #d1d5db;
		background-color: white;
	}

	@media (max-width: 768px) {
		padding: 11px 13px;
		font-size: 15px;
		margin: 9px 0;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 14px;
		margin: 8px 0;
	}
`;

export const BackButton = styled.a`
	padding: 10px 0;

	@media (max-width: 480px) {
		padding: 8px 0;
		font-size: 14px;
	}
`;

export const Submit = styled.button`
	margin: 24px auto 0 auto;
	font-size: 16px;
	padding: 12px 32px;
	border-radius: 6px;
	border: none;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

	&:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
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

export const RegisterWrapper = styled.div`
	margin: 28px 0 0 0;
	text-align: center;
	font-size: 15px;
	color: #6b7280;

	a {
		color: #10b981;
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s ease;
		&:hover {
			color: #059669;
			cursor: pointer;
			text-decoration: underline;
		}
	}

	@media (max-width: 768px) {
		margin: 24px 0 0 0;
		font-size: 14px;
	}

	@media (max-width: 480px) {
		margin: 20px 0 0 0;
		font-size: 13px;
	}
`;

export const PasswordInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	margin: 10px 0;
	width: 100%;

	input[type='password'],
	input[type='text'] {
		padding-right: 45px;
	}

	@media (max-width: 768px) {
		margin: 8px;
	}

	@media (max-width: 480px) {
		margin: 6px;
	}
`;

export const PasswordToggleButton = styled.button`
	position: absolute;
	right: 12px;
	background: none;
	border: none;
	cursor: pointer;
	color: #9ca3af;
	font-size: 18px;
	padding: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: color 0.2s ease;

	&:hover {
		color: #374151;
	}

	&:focus {
		outline: none;
	}

	@media (max-width: 768px) {
		font-size: 16px;
		right: 12px;
		padding: 4px 8px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		right: 10px;
		padding: 3px 6px;
	}
`;

export const CheckboxWrapper = styled.div`
	display: flex;
	align-items: center;
	margin: 16px 0 12px 0;
	gap: 8px;

	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: #10b981;
		border-radius: 3px;

		&:hover {
			cursor: pointer;
		}
	}

	@media (max-width: 768px) {
		margin: 14px 0 10px 0;
		gap: 7px;

		input[type='checkbox'] {
			width: 17px;
			height: 17px;
		}
	}

	@media (max-width: 480px) {
		margin: 12px 0 8px 0;
		gap: 6px;

		input[type='checkbox'] {
			width: 16px;
			height: 16px;
		}
	}
`;

export const CheckboxLabel = styled.label`
	font-size: 14px;
	color: #4b5563;
	cursor: pointer;
	user-select: none;
	margin: 0;
	transition: color 0.2s ease;

	&:hover {
		color: #1f2937;
	}

	@media (max-width: 768px) {
		font-size: 13px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
	}
`;
export const ErrorMessage = styled.div`
	background-color: #fee;
	border: 1px solid #fcc;
	color: #c33;
	padding: 12px;
	margin: 10px;
	border-radius: 5px;
	font-size: 14px;
	text-align: center;

	@media (max-width: 768px) {
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

export const LoadingSpinner = styled.div`
	display: inline-block;
	width: 20px;
	height: 20px;
	border: 3px solid #f3f3f3;
	border-top: 3px solid #3498db;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-right: 8px;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`;
