import styled from 'styled-components';

export const Wrapper = styled.form`
	display: grid;
	justify-content: center;
	align-items: center;
	padding: 10px;
	border: 1px solid black;
	border-radius: 10px;
	background-color: white;
	width: 100%;
	max-width: 400px;

	@media (max-width: 768px) {
		max-width: 350px;
		padding: 8px;
	}

	@media (max-width: 480px) {
		max-width: 100%;
		padding: 8px;
		border-radius: 5px;
	}
`;

export const BackButton = styled.a`
	padding: 10px;

	@media (max-width: 480px) {
		padding: 8px;
		font-size: 14px;
	}
`;

export const Title = styled.h2`
	font-size: 26px;
	font-weight: 700;
	margin: 10px auto 20px auto;
	text-decoration: underline;
	text-align: center;
	color: #333;

	@media (max-width: 768px) {
		font-size: 20px;
		margin: 10px auto 18px auto;
	}

	@media (max-width: 480px) {
		font-size: 17px;
		margin: 8px auto 16px auto;
	}
`;

export const Input = styled.input`
	padding: 12px 12px;
	font-size: 16px;
	margin: 8px 0;
	border: 1px solid #ddd;
	border-radius: 4px;
	width: calc(100% - 24px);
	box-sizing: border-box;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #3498db;
		box-shadow: 0 0 4px rgba(52, 152, 219, 0.3);
	}

	&:hover {
		border-color: #999;
	}

	@media (max-width: 768px) {
		padding: 11px 11px;
		font-size: 15px;
		margin: 7px 0;
	}

	@media (max-width: 480px) {
		padding: 10px 10px;
		font-size: 14px;
		margin: 6px 0;
		width: calc(100% - 20px);
	}
`;

export const Submit = styled.button`
	margin: 20px auto;
	font-size: 18px;
	padding: 5px 20px;
	border-radius: 5px;
	border: 1px solid gray;

	&:hover {
		border-color: black;
		cursor: pointer;
	}

	@media (max-width: 768px) {
		font-size: 16px;
		padding: 4px 15px;
		margin: 15px auto;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		padding: 4px 12px;
		margin: 10px auto;
	}
`;

export const RegisterWrapper = styled.div`
	span {
		color: #10b981;
		&:hover {
			color: #059669;
			cursor: pointer;
		}
	}

	@media (max-width: 768px) {
		font-size: 14px;
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
	border-radius: 4px;
	margin-bottom: 16px;
	font-size: 14px;
	width: 100%;

	@media (max-width: 768px) {
		padding: 10px;
		margin-bottom: 14px;
		font-size: 13px;
	}

	@media (max-width: 480px) {
		padding: 8px;
		margin-bottom: 12px;
		font-size: 12px;
	}
`;

export const LoadingSpinner = styled.div`
	border: 3px solid #f3f3f3;
	border-top: 3px solid #3498db;
	border-radius: 50%;
	width: 20px;
	height: 20px;
	animation: spin 1s linear infinite;
	display: inline-block;
	margin-right: 8px;
	vertical-align: middle;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`;

export const PasswordInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	margin: 10px;

	@media (max-width: 768px) {
		margin: 8px;
	}

	@media (max-width: 480px) {
		margin: 6px;
	}
`;

export const PasswordToggleButton = styled.button`
	position: absolute;
	right: 15px;
	background: none;
	border: none;
	cursor: pointer;
	color: #666;
	font-size: 18px;
	padding: 5px 10px;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		color: #333;
	}

	&:focus {
		outline: none;
	}

	@media (max-width: 768px) {
		font-size: 16px;
		right: 12px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		right: 10px;
		padding: 4px 8px;
	}
`;
