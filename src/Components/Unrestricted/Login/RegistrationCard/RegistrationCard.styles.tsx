import styled from 'styled-components';

export const Wrapper = styled.div`
	display: grid;
	justify-content: center;
	align-items: center;
	padding: 20px 40px;
	border: 1px solid black;
	border-radius: 10px;
	background-color: white;
`;

export const Title = styled.h2`
	font-size: 26px;
	font-weight: 600;
	margin-left: 20px;
	text-decoration: underline;
`;

export const Input = styled.input`
	padding: 20px;
	margin: 20px;
	font-size: 18px;
	border: none;
	border-bottom: 1px solid gray;
	&:hover {
		border-color: black;
		cursor: pointer;
	}
`;

export const Submit = styled.button`
	margin: 10px auto;
	font-size: 18px;
	padding: 10px 20px;
	border-radius: 5px;
	border: 1px solid gray;
	&:hover {
		border-color: black;
		cursor: pointer;
	}
`;

export const RegisterWrapper = styled.div`
	margin: 50px 0 25px 0;

	span {
		color: blue;
		&:hover {
			color: lightblue;
			cursor: pointer;
		}
	}
`;
