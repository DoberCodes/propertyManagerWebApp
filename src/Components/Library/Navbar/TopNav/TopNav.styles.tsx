import styled from 'styled-components';
import { font_main, nav_height } from '../../../../global.styles';
import { Link } from 'react-router-dom';
import { COLORS } from '../../../../constants/colors';

export const Wrapper = styled.div`
	border: none;
	border-bottom: 2px solid ${COLORS.gray200};
	display: flex;
	flex-flow: row;
	align-items: center;
	justify-content: space-between;
	height: ${nav_height};
	background: linear-gradient(
		90deg,
		${COLORS.bgWhite} 0%,
		${COLORS.gray50} 100%
	);
	padding: 0 20px;
	padding-left: max(20px, env(safe-area-inset-left));
	padding-right: max(20px, env(safe-area-inset-right));
	overflow: visible;
	position: relative;
	z-index: 100;
	box-shadow: ${COLORS.shadow};

	@media (max-width: 768px) {
		padding: 0 15px;
		padding-left: max(15px, env(safe-area-inset-left));
		padding-right: max(15px, env(safe-area-inset-right));
	}

	@media (max-width: 480px) {
		padding: 0 10px;
		padding-left: max(10px, env(safe-area-inset-left));
		padding-right: max(10px, env(safe-area-inset-right));
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
		display: none; /* Hide profile picture on desktop */
	}

	.desktop-title {
		display: block;
	}

	@media (max-width: 768px) {
		flex-wrap: nowrap;
		justify-content: flex-end;

		.mobile-profile {
			display: flex; /* Show profile picture on mobile */
		}

		.desktop-title {
			display: none;
		}
	}
`;

export const Title = styled.h1`
	font-size: 20px;
	margin: 0;
	flex-shrink: 0;
	background: ${COLORS.gradientPrimary};
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	font-weight: 700;

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
	color: ${COLORS.primary};
	text-decoration: none;
	cursor: pointer;
	white-space: nowrap;
	padding: 8px 12px;
	font-size: ${font_main};
	font-weight: 500;
	border-radius: 4px;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${COLORS.primaryLight};
		color: ${COLORS.primaryDark};
	}

	&.active {
		background: ${COLORS.gradientPrimary};
		color: ${COLORS.bgWhite};
		box-shadow: ${COLORS.shadowMd};
	}
`;

export const HamburgerButton = styled.button`
	display: none;
	background: none;
	border: none;
	cursor: pointer;
	font-size: 24px;
	color: ${COLORS.primary};
	padding: 8px;
	margin-right: 10px;
	transition: all 0.2s ease;

	&:hover {
		transform: scale(1.1);
		color: ${COLORS.primaryDark};
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
	background-color: ${COLORS.overlay};
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
	overflow-x: hidden;
	z-index: 1000;
	box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
	transform: ${(props) =>
		props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
	transition: transform 0.3s ease;

	@media (max-width: 768px) {
		display: block;
	}
`;
