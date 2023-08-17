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

export const Input = styled.input`
	height: 40px;
	width: 440px;
	padding: 20px;
	margin: 20px;
	font-size: 24px;
	border: none;
	border-bottom: 1px solid gray;
	&:hover {
		border-color: black;
		cursor: pointer;
	}
`;

export const Submit = styled.button`
	margin: 10px auto;
	width: 200px;
	font-size: 24px;
	padding: 10px 0;
	border-radius: 5px;
	border: 1px solid gray;
	&:hover {
		border-color: black;
		cursor: pointer;
	}
`;

export const RegisterWrapper = styled.div`
	margin: 50px 0 25px 0;

	a {
		color: blue;
		text-decoration: none;
		&:hover {
			color: lightblue;
			cursor: pointer;
		}
	}
`;
