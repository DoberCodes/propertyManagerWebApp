import styled from 'styled-components';

export const Wrapper = styled.form`
	display: grid;
	justify-content: center;
	align-items: center;
	padding: 10px;
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
	font-size: 18px;
	margin: 10px;
	border: none;
	border-bottom: 1px solid gray;
	&:hover {
		border-color: black;
		cursor: pointer;
	}
`;
export const BackButton = styled.a`
	padding: 10px 0;
`;

export const Submit = styled.button`
	margin: 20px auto 0 auto;
	font-size: 18px;
	padding: 5px 20px;
	border-radius: 5px;
	border: 1px solid gray;
	&:hover {
		border-color: black;
		cursor: pointer;
	}
`;

export const RegisterWrapper = styled.div`
	margin: 30px 0 25px 0;

	a {
		color: blue;
		text-decoration: none;
		&:hover {
			color: lightblue;
			cursor: pointer;
		}
	}
`;
