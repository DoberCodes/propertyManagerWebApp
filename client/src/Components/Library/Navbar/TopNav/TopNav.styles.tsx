import styled from 'styled-components';
import { font_main, nav_height } from '../../../../global.styles';
import { Link } from 'react-router-dom';

export const Wrapper = styled.div`
	border: 1px solid black;
	display: flex;
	flex-flow: row;
	align-items: center;
	justify-content: space-between;
	height: ${nav_height};
	background-color: #fefefe;
	padding: 0 20px;
	overflow: visible;
	position: relative;
	z-index: 100;

	@media (max-width: 768px) {
		padding: 0 15px;
	}

	@media (max-width: 480px) {
		padding: 0 10px;
	}
`;

export const LeftSection = styled.div`
	display: flex;
	align-items: center;
	gap: 30px;
	flex-shrink: 0;
	width: 250px;

	@media (max-width: 1024px) {
		gap: 20px;
		width: 200px;
	}

	@media (max-width: 768px) {
		gap: 15px;
		width: auto;
	}
`;

export const RightSection = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex: 1;
	overflow: visible;
	z-index: 10;

	@media (max-width: 768px) {
		flex-wrap: wrap;
	}
`;

export const Title = styled.h1`
	font-size: 20px;
	margin: 0;
	flex-shrink: 0;
	color: #22c55e;

	@media (max-width: 768px) {
		font-size: 16px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const NavItems = styled.div`
	display: flex;
	gap: 20px;
	align-items: center;
	flex-shrink: 0;

	@media (max-width: 1024px) {
		gap: 15px;
	}

	@media (max-width: 768px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 5px;
	}
`;

export const NavItem = styled(Link)`
	text-align: center;
	color: #22c55e;
	text-decoration: none;
	cursor: pointer;
	white-space: nowrap;
	padding: 8px 12px;
	font-size: ${font_main};
	font-weight: 500;
	border-radius: 4px;
	transition: all 0.2s ease;

	&:hover {
		background-color: rgba(34, 197, 94, 0.1);
	}

	&.active {
		background-color: #22c55e;
		color: white;
	}
`;
