import styled from 'styled-components';
import {
	blue,
	font_main,
	font_title,
	nav_height,
} from '../../../../global.styles';
import { Link } from 'react-router-dom';

export const Wrapper = styled.div`
	border: 1px solid black;
	display: flex;
	flex-flow: row;
	align-items: center;
	height: ${nav_height};
	background-color: ${blue};
`;

export const Title = styled.h1`
	width: 40%;
	margin-left: 20px;
	font-size: ${font_title};
`;

export const NavItemWrapper = styled.div`
	width: 60%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: end;
	align-items: end;
	margin-right: 20px;
`;

export const Navbar = styled.div`
	height: 25%;
	display: grid;
	grid-auto-flow: column;
	justify-content: end;
	font-size: ${font_main};
`;

export const BottomNav = styled.div`
	display: grid;
	grid-auto-flow: column;
	align-items: end;
	font-size: ${font_title};
`;
export const NavItem = styled(Link)`
	text-align: center;
	color: black;
	text-decoration: none;
	cursor: pointer;
	margin: 0 10px;
	&:hover {
		color: lightgray;
	}
`;
