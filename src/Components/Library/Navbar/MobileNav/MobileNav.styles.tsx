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
		background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
		border-top: 1px solid #d2dbe7;
		box-shadow: 0 -8px 20px rgba(15, 23, 42, 0.1);
		z-index: 900;
		pointer-events: none;
	}
`;

export const MobileBottomNavInner = styled.div`
	width: 100%;
	height: 74px;
	border-radius: 0;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
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
	color: ${({ $active }) => ($active ? COLORS.primary : '#475569')};
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
	background: #10b981;
	font-size: 32px;
	color: #ffffff;
	font-weight: 1000;
	box-shadow: 0 14px 24px rgba(16, 185, 129, 0.4);
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
	color: #334155;
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
	background: linear-gradient(180deg, rgba(251, 253, 255, 0.96) 0%, rgba(243, 248, 252, 0.96) 100%);
	border: 1px solid #dbe4ee;
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
	color: #1e293b;
	background: transparent;
	border: none;
	border-radius: 999px;
	padding: 8px 10px;
	font-size: 11px;
	font-weight: 700;
	white-space: nowrap;
	cursor: pointer;
	display: flex;
	height: 50px;
	width: 100px;
	justify-content: center;
	align-items: center;
	text-align: center;
	line-height: 1.1;

	&:hover {
		color: ${COLORS.primary};
	}

`;
