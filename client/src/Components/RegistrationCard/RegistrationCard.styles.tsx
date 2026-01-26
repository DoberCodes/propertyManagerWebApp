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
	font-weight: 600;
	margin-left: 20px;
	text-decoration: underline;

	@media (max-width: 768px) {
		font-size: 22px;
		margin-left: 15px;
	}

	@media (max-width: 480px) {
		font-size: 18px;
		margin-left: 10px;
	}
`;

export const Input = styled.input`
	padding: 20px;
	font-size: 18px;
	margin: 10px;
	border: none;
	border-bottom: 1px solid gray;

	&:hover {
		border-color: black;
		cursor: pointer;
	}

	@media (max-width: 768px) {
		padding: 15px;
		font-size: 16px;
		margin: 8px;
	}

	@media (max-width: 480px) {
		padding: 12px;
		font-size: 14px;
		margin: 6px;
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
		color: blue;
		&:hover {
			color: lightblue;
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
