import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const NavWrapper = styled.div`
	--landing-nav-height: 88px;
	display: flex;
	height: var(--landing-nav-height);
	width: 100%;
	background: ${COLORS.gradientPrimary};
	align-items: center;
	justify-content: space-between;
	padding: 0 max(20px, env(safe-area-inset-right)) 0
		max(20px, env(safe-area-inset-left));
	margin: 0 auto;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	box-sizing: border-box;
	flex-wrap: nowrap;
	gap: 10px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 100;

	@media (max-width: 1024px) {
		--landing-nav-height: 84px;
		height: var(--landing-nav-height);
		padding: 10px max(12px, env(safe-area-inset-right)) 10px
			max(12px, env(safe-area-inset-left));
		gap: 8px;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	@media (max-width: 900px) {
		--landing-nav-height: 76px;
		height: var(--landing-nav-height);
		padding: max(8px, env(safe-area-inset-top))
			max(16px, env(safe-area-inset-right)) 8px
			max(16px, env(safe-area-inset-left));
	}

	@media (max-width: 480px) {
		--landing-nav-height: 72px;
		height: var(--landing-nav-height);
		min-height: 72px;
	}
`;

export const NavTitle = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 1 260px;
	min-width: 0;
	height: 100%;
	margin: 0;
	padding-top: 6px;

	img {
		display: block;
		width: min(240px, 100%);
		height: auto;
		max-height: 86px;
		object-fit: contain;
	}

	@media (max-width: 1024px) {
		flex: 0 1 160px;
		max-height: 60px;
		padding-top: 0;

		img {
			width: min(160px, 100%);
			height: auto;
			max-height: 60px;
		}
	}

	@media (max-width: 900px) {
		flex-basis: 142px;

		img {
			width: min(142px, 100%);
		}
	}

	@media (max-width: 480px) {
		flex: 0 1 150px;
		padding: 0;
		max-height: 48px;

		img {
			width: min(150px, 70vw);
			height: auto;
			max-height: 48px;
		}
	}
`;

export const ButtonWrapper = styled.div<{ $isOpen: boolean }>`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
	gap: 4px;
	flex: 1 1 auto;
	min-width: 0;
	max-width: 100%;
	flex-wrap: nowrap;

	@media (max-width: 1024px) {
		display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		flex-direction: column;
		align-items: stretch;
		gap: 2px;
		justify-content: flex-start;
		max-height: calc(100dvh - var(--landing-nav-height));
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 10px max(16px, env(safe-area-inset-right))
			max(16px, env(safe-area-inset-bottom))
			max(16px, env(safe-area-inset-left));
		background: ${COLORS.gradientPrimary};
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
		box-sizing: border-box;

		> a {
			min-height: 44px;
			width: 100%;
			margin: 0;
			box-sizing: border-box;
		}
	}
`;

export const MobileMenuButton = styled.button`
	display: none;
	width: 44px;
	height: 44px;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(255, 255, 255, 0.55);
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.12);
	color: ${COLORS.white};
	font-size: 22px;
	cursor: pointer;

	&:hover,
	&:focus-visible {
		background: rgba(255, 255, 255, 0.22);
		outline: 2px solid ${COLORS.white};
		outline-offset: 2px;
	}

	@media (max-width: 1024px) {
		display: flex;
		flex: 0 0 44px;
	}
`;

export const NavAnchor = styled(HashLink)`
	font-size: 15px;
	font-weight: 600;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 4px;
	padding: 8px 10px;
	text-decoration: none;
	color: ${COLORS.white};
	white-space: nowrap;
	border-radius: 4px;
	transition:
		background-color 0.2s,
		transform 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 15px;
		margin: 0;
		padding: 11px 12px;
		width: 100%;
		text-align: center;
	}
`;

export const NavRouteLink = styled(Link)`
	font-size: 15px;
	font-weight: 600;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 4px;
	padding: 8px 10px;
	text-decoration: none;
	color: ${COLORS.white};
	white-space: nowrap;
	border-radius: 4px;
	transition:
		background-color 0.2s,
		transform 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 15px;
		margin: 0;
		padding: 11px 12px;
		width: 100%;
		text-align: center;
	}
`;

export const NavExternalLink = styled.a`
	font-size: 15px;
	font-weight: 600;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 4px;
	padding: 8px 10px;
	text-decoration: none;
	color: ${COLORS.white};
	white-space: nowrap;
	border-radius: 4px;
	transition:
		background-color 0.2s,
		transform 0.2s;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 15px;
		margin: 0;
		padding: 11px 12px;
		width: 100%;
		text-align: center;
	}
`;

export const NavDropdown = styled.details`
	position: relative;
	color: ${COLORS.white};

	summary {
		list-style: none;
		padding: 8px 10px;
		border-radius: 4px;
		font-size: 15px;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}
	summary::after {
		content: ' ▾';
		font-size: 12px;
	}
	&[open] summary,
	summary:hover,
	summary:focus-visible {
		background: rgba(255, 255, 255, 0.2);
		outline: none;
	}

	> div {
		position: absolute;
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		min-width: 280px;
		flex-direction: column;
		gap: 2px;
		padding: 8px;
		border-radius: 10px;
		background: ${COLORS.white};
		box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
	}

	@media (max-width: 1024px) {
		width: 100%;
		summary {
			display: flex;
			min-height: 44px;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
			padding: 11px 12px;
			font-size: 15px;
			text-align: center;
		}
		> div {
			position: static;
			transform: none;
			min-width: 0;
			margin: 2px 0 6px;
			padding: 4px;
			background: rgba(255, 255, 255, 0.1);
			box-shadow: none;
		}
	}
`;

export const NavDropdownLink = styled.a`
	display: flex;
	align-items: center;
	min-height: 44px;
	padding: 8px 12px;
	border-radius: 6px;
	color: ${COLORS.slate};
	font-size: 14px;
	font-weight: 600;
	text-decoration: none;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		background: rgba(4, 120, 87, 0.1);
		color: ${COLORS.primary};
		outline: none;
	}

	@media (max-width: 1024px) {
		justify-content: center;
		color: ${COLORS.white};
		&:hover,
		&:focus-visible {
			background: rgba(255, 255, 255, 0.18);
			color: ${COLORS.white};
		}
	}
`;

export const NavDropdownAnchor = styled(HashLink)`
	display: flex;
	align-items: center;
	min-height: 40px;
	padding: 8px 12px;
	border-radius: 6px;
	color: ${COLORS.slate};
	font-size: 14px;
	font-weight: 600;
	text-decoration: none;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		background: rgba(4, 120, 87, 0.1);
		color: ${COLORS.primary};
		outline: none;
	}

	@media (max-width: 1024px) {
		justify-content: center;
		color: ${COLORS.white};

		&:hover,
		&:focus-visible {
			background: rgba(255, 255, 255, 0.18);
			color: ${COLORS.white};
		}
	}
`;

export const NavLoginLink = styled(Link)`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px 10px;
	border-radius: 4px;
	color: ${COLORS.white};
	font-size: 15px;
	font-weight: 600;
	text-decoration: none;
	white-space: nowrap;

	&:hover,
	&:focus-visible {
		background: rgba(255, 255, 255, 0.2);
		outline: none;
	}

	@media (max-width: 1024px) {
		width: 100%;
		padding: 11px 12px;
		box-sizing: border-box;
	}
`;

export const NavButton = styled(Link)`
	font-size: 17px;
	font-weight: 700;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0px 8px;
	padding: 8px 10px;
	text-decoration: none;
	color: ${COLORS.primary};
	background-color: ${COLORS.white};
	border-radius: 6px;
	white-space: nowrap;

	&:hover {
		color: ${COLORS.primaryDark};
		transform: translateY(-1px);
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		margin: 0px 8px;
		padding: 6px 12px;
		background-color: white;
		border-radius: 4px;
	}

	@media (max-width: 480px) {
		font-size: 15px;
		margin: 0;
		padding: 11px 12px;
		width: 100%;
		background-color: white;
		border-radius: 4px;
	}
`;
