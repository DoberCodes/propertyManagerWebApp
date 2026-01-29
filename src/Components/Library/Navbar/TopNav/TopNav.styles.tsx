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

	.desktop-profile {
		display: flex;
	}

	.mobile-title {
		display: none;
	}

	@media (max-width: 1024px) {
		gap: 20px;
		width: 200px;
	}

	@media (max-width: 768px) {
		gap: 15px;
		width: auto;

		.desktop-profile {
			display: none;
		}

		.mobile-title {
			display: block;
		}
	}
`;

export const RightSection = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex: 1;
	overflow: visible;
	z-index: 10;
	gap: 20px;

	.mobile-profile {
		display: none;
	}

	.desktop-title {
		display: block;
	}

	.desktop-logout {
		display: block;
	}

	@media (max-width: 768px) {
		flex-wrap: nowrap;
		justify-content: flex-end;

		.mobile-profile {
			display: flex;
		}

		.desktop-title {
			display: none;
		}

		.desktop-logout {
			display: none;
		}
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
export const HamburgerButton = styled.button`
	display: none;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 24px;
	color: #22c55e;
	padding: 8px;
	margin-right: 10px;
	transition: all 0.2s ease;

	&:hover {
		transform: scale(1.1);
	}

	@media (max-width: 768px) {
		display: block;
	}
`;

export const SidebarOverlay = styled.div`
	display: none;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 999;

	@media (max-width: 768px) {
		display: block;
	}
`;

export const MobileSidebar = styled.div<{ isOpen: boolean }>`
	display: none;
	position: fixed;
	left: 0;
	top: 60px;
	width: 100%;
	max-width: 300px;
	height: calc(100vh - 60px - 70px);
	background-color: #fefefe;
	overflow-y: auto;
	z-index: 1000;
	box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
	transform: ${(props) =>
		props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
	transition: transform 0.3s ease;

	@media (max-width: 768px) {
		display: block;
	}
`;
