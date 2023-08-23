import styled from 'styled-components';

export const Wrapper = styled.div`
	width: 100%;
	border: 1px solid black;
	display: flex;
	align-items: center;
	height: 100px;
`;

export const Title = styled.h1`
	width: 40%;
	margin-left: 20px;
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

export const TopNav = styled.div`
	width: 100%;
	height: 25%;
	display: grid;
	grid-auto-flow: column;
	justify-content: end;
	font-size: 16px;
`;

export const BottomNav = styled.div`
	display: grid;
	grid-auto-flow: column;
	align-items: end;
	width: 100%;
	font-size: 24px;
	height: 75%;
`;
export const NavItem = styled.a`
	text-align: center;
	color: black;
	text-decoration: none;
	cursor: pointer;
	margin: 0 10px;
	&:hover {
		color: lightgray;
	}
`;
