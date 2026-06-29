import styled from 'styled-components';
import { COLORS } from '../../../../constants/colors';




export const MobileSidebar = styled.div<{ $isOpen: boolean }>`
	display: none;
	position: fixed;
	left: 0;
	top: 60px;
	width: 100%;
	max-width: 300px;
	height: calc(100vh - 60px - 70px);
	background-color: ${COLORS.white};
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

export const MobileSidebarBrand = styled.div`
	display: flex;
	justify-content: flex-start;
	align-items: center;
	background: ${COLORS.primary};
	margin-bottom: 20px;
	padding: 8px 12px;
	min-height: 54px;
`;

export const MobileSidebarLogo = styled.img`
	display: block;
	width: 128px;
	height: auto;
	max-height: 44px;
	object-fit: contain;
	object-position: left center;
`;


export const MobileBottomNavBar = styled.nav`
	display: none;

	@media (max-width: 1024px) {
		display: flex;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		justify-content: stretch;
		align-items: flex-end;
		padding-bottom: env(safe-area-inset-bottom);
		background: ${COLORS.white};
		border-top: 1px solid ${COLORS.border};
		box-shadow: 0 -8px 20px rgba(15, 23, 42, 0.1);
		z-index: 900;
		pointer-events: none;
	}
`;

export const MobileBottomNavInner = styled.div`
	width: 100%;
	height: 74px;
	border-radius: 0;
	background: ${COLORS.white};
	border: none;
	box-shadow: none;
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 88px minmax(0, 1fr) minmax(0, 1fr);
	align-items: center;
	padding: 0 12px;
	pointer-events: auto;
`;

export const MobileBottomNavItem = styled.button<{ $active?: boolean }>`
	border: none;
	background: transparent;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: ${({ $active }) => ($active ? COLORS.primary : COLORS.textSecondary)};
	gap: 4px;
	height: 100%;
	width: 100%;
	cursor: pointer;
	border-radius: 12px;
	transition: color 120ms ease, background-color 120ms ease;
	text-decoration: ${({ $active }) => ($active ? 'underline' : 'none')};
	text-underline-offset: 10px;
	text-decoration-thickness: 2px;
	text-decoration-color: ${({ $active }) => ($active ? COLORS.primary : 'transparent')};
	
	/* Add breathing room around the raised center action */
	&:nth-child(2) {
		margin-right: 4px;
	}

	&:nth-child(4) {
		margin-left: 4px;
	}
`;

export const MobileBottomNavIcon = styled.span`
	font-size: 36px;
	`;



export const MobileBottomNavLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

export const MobileBottomCenterWrap = styled.div`
	position: relative;
	align-self: stretch;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	overflow: visible;
`;

export const MobileBottomCenterButton = styled.button<{ $open?: boolean }>`
	position: absolute;
	border: none;
	height: 64px;
	width: 64px;
	border-radius: 100%;
	background: ${COLORS.gradientPrimary};
	font-size: 32px;
	color: ${COLORS.white};
	font-weight: 1000;
	box-shadow: 0 14px 24px rgba(4, 120, 87, 0.32);
	cursor: pointer;
	justify-content: center;
	align-items: center;
	text-align: center;
	padding: 10px;
	display: flex;
	transition: transform 140ms ease, filter 140ms ease;

	&:hover {
		filter: brightness(0.96);
	}

	${({ $open }) =>
		$open
			? `
				transform: rotate(45deg) scale(1.02);
			`
			: ''}
`;

export const MobileBottomCenterLabel = styled.span`
	position: absolute;
	bottom: 8px;
	font-size: 9px;
	font-weight: 800;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: ${COLORS.textSecondary};
`;

export const MobileBottomActionMenu = styled.div<{ $open?: boolean }>`
	position: absolute;
	left: 50%;
	top: -136px;
	width: 330px;
	height: 138px;
	transform: translateX(-50%) scale(${({ $open }) => ($open ? 1 : 0.94)});
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
	transition: opacity 160ms ease, transform 180ms ease;
`;

export const MobileBottomActionBackdrop = styled.div<{ $open?: boolean }>`
	position: absolute;
	left: 50%;
	top: -116px;
	transform: translateX(-50%);
	width: min(320px, calc(100vw - 30px));
	height: 122px;
	border-radius: 999px 999px 18px 18px;
	background: ${COLORS.white};
	border: 1px solid ${COLORS.border};
	box-shadow: 0 7px 14px rgba(15, 23, 42, 0.1);
	backdrop-filter: blur(6px);
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	pointer-events: none;
	transition: opacity 160ms ease;

	&::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -15px;
		transform: translateX(-50%);
		width: 94px;
		height: 24px;
		background: transparent;
		border: none;
		border-radius: 0 0 14px 14px;
	}
`;

export const MobileBottomActionItem = styled.button<{ $x: number; $y: number }>`
	position: absolute;
	left: 50%;
	top: 96%;
	transform: translate(calc(-50% + ${({ $x }) => $x}px), calc(-100% + ${({ $y }) => $y}px));
	color: ${COLORS.textPrimary};
	background: transparent;
	border: none;
	border-radius: 999px;
	padding: 8px 10px;
	font-size: 11px;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	height: auto;
	width: 50px;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	text-align: center;
	line-height: 1.1;

	&:hover {
		color: ${COLORS.primary};
	}

`;
