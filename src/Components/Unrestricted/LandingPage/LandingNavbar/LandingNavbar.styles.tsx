import styled from 'styled-components';

export const NavWrapper = styled.div<{ position?: string }>`
	display: flex;
	height: ${(props) => (props.position ? '25px' : '100px')};
	width: 1440px;
	background-color: blue;
	align-items: center;
	padding: ${(props) => (props.position ? '20px 0 20px 0' : '')};
	margin: 0 auto;
	overflow: hidden;
	position: ${(props) => props.position || ''};
	top: ${(props) => (props.position ? '0' : '')};
	left: 0;
	right: 0;
	transition: all 1s ease-in-out;
`;

export const IconWrapper = styled.div``;

export const NavTitle = styled.h2`
	font-size: 36px;
	font-weight: 700;
	width: 35%;
	text-align: center;
`;

export const ButtonWrapper = styled.div`
	width: 65%;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
`;
export const NavButton = styled.a`
	font-size: 20px;
	font-weight: 700;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 20px 0px 20px;
	padding: 10px;
	text-decoration: none;
	color: black;
	:hover {
		color: white;
	}
`;
