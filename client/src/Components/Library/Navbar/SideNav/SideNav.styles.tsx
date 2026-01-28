import styled from 'styled-components';
import { font_main } from '../../../../global.styles';
import { Link } from 'react-router-dom';

export const HamburgerButton = styled.button<{ isOpen: boolean }>`
	display: none;
	background: none;
	border: none;
	cursor: pointer;
	padding: 8px;
	flex-direction: column;
	gap: 5px;
	position: absolute;
	left: 20px;
	top: 20px;
	z-index: 1001;

	span {
		width: 24px;
		height: 3px;
		background-color: #22c55e;
		border-radius: 2px;
		transition: all 0.3s ease;
		display: block;
	}

	${(props) =>
		props.isOpen &&
		`
		span:nth-child(1) {
			transform: rotate(45deg) translate(10px, 10px);
		}
		span:nth-child(2) {
			opacity: 0;
		}
		span:nth-child(3) {
			transform: rotate(-45deg) translate(7px, -7px);
		}
	`}

	@media (max-width: 768px) {
		display: flex;
	}
`;

export const NavOverlay = styled.div`
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

export const MobileMenuWrapper = styled.div<{ isOpen: boolean }>`
	@media (max-width: 768px) {
		display: ${(props) => (props.isOpen ? 'flex' : 'none')};
		flex-direction: column;
	}
`;

export const Wrapper = styled.div<{ isOpen?: boolean }>`
	background-color: #fefefe;
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-height: 100%;
	overflow: visible;

	@media (max-width: 768px) {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: #fefefe;
		overflow-y: auto;
		z-index: 1000;
		flex-direction: column;
		gap: 0;
	}
`;

export const MenuSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1); /* Divider added back above Favorites */
	flex: 0 0 auto;

	@media (max-width: 768px) {
		padding: 20px;
		border-right: none;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		min-width: auto;
		flex: 0 0 auto;
		margin-top: 50px;
	}

	@media (max-width: 480px) {
		padding: 15px;
		margin-top: 45px;
	}
`;

export const MenuNav = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (max-width: 768px) {
		gap: 8px;
	}
`;

export const MenuItem = styled(Link)`
	color: #22c55e;
	text-decoration: none;
	font-size: ${font_main};
	font-weight: 500;
	padding: 8px 12px;
	border-radius: 4px;
	transition: all 0.2s ease;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background-color: rgba(34, 197, 94, 0.1);
	}

	&.active {
		background-color: #22c55e;
		color: white;
	}

	@media (max-width: 768px) {
		font-size: 12px;
		padding: 6px 10px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		padding: 4px 8px;
	}
`;

export const Section = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1); /* Divider moved here */
	flex: 0 0 auto;

	&:last-of-type {
		border-bottom: none;
	}

	@media (max-width: 768px) {
		padding: 20px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		border-right: none;
		min-width: auto;
		flex: 0 0 auto;
	}

	@media (max-width: 480px) {
		padding: 15px;
		min-width: auto;
	}
`;

export const SectionTitle = styled.h3`
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	color: #999999;
	margin: 0 0 4px 0;
	letter-spacing: 0.5px;

	@media (max-width: 480px) {
		font-size: 10px;
		margin: 0 0 6px 0;
	}
`;

export const SectionContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	font-size: ${font_main};
	color: black;
	height: 150px; /* Set fixed height for Favorites and Recently Viewed sections */
	overflow-y: auto; /* Enable scrolling if content exceeds height */

	@media (max-width: 768px) {
		gap: 10px;
		font-size: 13px;
		height: auto;
		max-height: 200px;
	}

	@media (max-width: 480px) {
		gap: 8px;
		font-size: 12px;
		height: auto;
		max-height: 150px;
	}
`;

export const BottomSections = styled.div`
	margin-top: auto; /* Push to the bottom */
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;

	@media (max-width: 768px) {
		padding: 20px;
		gap: 0;
		margin-top: 0;
	}

	@media (max-width: 480px) {
		padding: 15px;
		gap: 0;
	}
`;
