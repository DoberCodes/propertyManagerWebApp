import styled from 'styled-components';
import { font_main, nav_height } from '../../../../global.styles';
import { Link } from 'react-router-dom';
import { COLORS } from '../../../../constants/colors';

export const Wrapper = styled.div`
	border: none;
	border-bottom: 2px solid #047857;
	display: flex;
	flex-flow: row;
	align-items: center;
	justify-content: space-between;
	height: ${nav_height};
	min-height: ${nav_height};
	flex-shrink: 0;
	background: linear-gradient(90deg, #065f46 0%, #047857 100%);
	padding: 40px 20px;
	padding-top: max(40px, env(safe-area-inset-top));
	padding-left: max(20px, env(safe-area-inset-left));
	padding-right: max(20px, env(safe-area-inset-right));
	overflow: visible;
	position: relative;
	z-index: 100;
	box-shadow: ${COLORS.shadow};

	/* Extend background into top safe area */
	&::before {
		content: '';
		position: absolute;
		top: calc(-1 * env(safe-area-inset-top));
		left: 0;
		right: 0;
		height: env(safe-area-inset-top);
		background: linear-gradient(90deg, #065f46 0%, #047857 100%);
		z-index: -1;
	}

	.mobile-title {
		display: none;
	}

	@media (max-width: 1024px) {
		padding: 40px 15px;
		padding-left: max(15px, env(safe-area-inset-left));
		padding-right: max(15px, env(safe-area-inset-right));

		.mobile-title {
			display: flex;
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			height: 80%;
			align-items: center;
			max-width: 50vw;

			img {
				max-height: 100%;
			}
		}
	}

	@media (max-width: 480px) {
		padding: 40px 10px;
		padding-left: max(10px, env(safe-area-inset-left));
		padding-right: max(10px, env(safe-area-inset-right));

		.mobile-title {
			max-width: 45vw;
			height: 70%;
		}
	}
`;

export const LeftSection = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	flex-shrink: 0;
	width: auto;

	.desktop-title {
		display: block;
	}

	@media (max-width: 1024px) {
		gap: 12px;
		max-width: 130px;
	}

	@media (max-width: 1024px) {
		gap: 15px;
		width: auto;

		.desktop-title {
			display: none;
		}
	}
`;

export const RightSection = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex: 0 0 auto;
	overflow: visible;
	z-index: 10;
	gap: 20px;
	padding-right: 6px;

	.mobile-profile {
		display: none; /* Hide profile picture on desktop */
	}

	.desktop-profile {
		display: flex;
	}

	.desktop-title {
		display: none;
	}

	.desktop-notification {
		display: flex;
	}

	@media (max-width: 1024px) {
		flex-wrap: nowrap;
		justify-content: flex-end;
		gap: 16px;

		.mobile-profile {
			display: flex; /* Show profile picture on mobile */
		}

		.desktop-profile {
			display: none;
		}

		.desktop-title {
			display: none;
		}

		.desktop-notification {
			display: none;
		}
	}

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const Title = styled.div`
	display: block;
	justify-content: center;
	align-items: center;
	margin: 0;
	height: 100%;

	img {
		max-height: 100%;
		width: 80%;
		max-width: 100px;
		object-fit: contain;
	}

	@media (max-width: 1024px) {
		img {
			height: 100%;
			max-width: 100%;
			object-fit: contain;
		}
	}

	@media (max-width: 480px) {
		img {
			height: 100%;
		}
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

	@media (max-width: 1024px) {
		gap: 10px;
	}

	@media (max-width: 480px) {
		gap: 5px;
	}
`;

export const NavItem = styled(Link)`
	text-align: center;
	color: ${COLORS.bgWhite};
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
	color: ${COLORS.bgWhite};
	padding: 8px;
	margin-right: 10px;
	transition: all 0.2s ease;

	&:hover {
		transform: scale(1.1);
		color: ${COLORS.primaryLight};
	}

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		display: block;
	}
`;

export const MobileSidebar = styled.div<{ $isOpen: boolean }>`
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
		props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
	transition: transform 0.3s ease;

	@media (max-width: 1024px) {
		display: block;
	}
`;

export const NotificationIcon = styled.div<{
	$hasUnread?: boolean;
	$unreadCount?: number;
}>`
	position: relative;
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.05);
	}

	svg {
		width: 20px;
		height: 20px;
		color: white;
	}

	${(props) =>
		props.$hasUnread &&
		props.$unreadCount &&
		props.$unreadCount > 0 &&
		`
		&::after {
			content: '${props.$unreadCount > 99 ? '99+' : props.$unreadCount}';
			position: absolute;
			top: 4px;
			right: 4px;
			min-width: 16px;
			height: 16px;
			background: #ef4444;
			color: white;
			border-radius: 8px;
			border: 2px solid ${COLORS.primary};
			font-size: 10px;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 4px;
			box-sizing: border-box;
		}
	`}

	@media (max-width: 1024px) {
		width: 36px;
		height: 36px;

		svg {
			width: 18px;
			height: 18px;
		}
	}
`;
