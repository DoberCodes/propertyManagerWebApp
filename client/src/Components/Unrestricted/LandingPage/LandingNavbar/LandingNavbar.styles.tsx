import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import styled from 'styled-components';

export const NavWrapper = styled.div`
	display: flex;
	height: 100px;
	width: 100%;
	background-color: blue;
	align-items: center;
	padding: '20px 0 20px 0';
	margin: 0 auto;
	position: fixed;
	top: 0;
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

export const NavAnchor = styled(HashLink)`
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

export const NavButton = styled(Link)`
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
