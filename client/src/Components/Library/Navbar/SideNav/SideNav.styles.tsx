import styled from 'styled-components';
import { font_main } from '../../../../global.styles';
import { Link } from 'react-router-dom';

export const Wrapper = styled.div`
	background-color: #fefefe;
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-height: 100%;
	overflow: visible;

	@media (max-width: 768px) {
		overflow-x: auto;
		flex-direction: row;
		gap: 10px;
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
		padding: 15px;
		border-right: 1px solid rgba(0, 0, 0, 0.1);
		min-width: 180px;
		flex: 0 0 auto;
	}

	@media (max-width: 480px) {
		padding: 10px;
		min-width: 140px;
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
		padding: 15px;
		border-bottom: none;
		border-right: 1px solid rgba(0, 0, 0, 0.1);
		min-width: 180px;
		flex: 0 0 auto;
	}

	@media (max-width: 480px) {
		padding: 10px;
		min-width: 140px;
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
		font-size: 12px;
		height: 120px; /* Adjust height for smaller screens */
	}

	@media (max-width: 480px) {
		gap: 8px;
		font-size: 11px;
		height: 100px; /* Adjust height for very small screens */
	}
`;

export const BottomSections = styled.div`
	margin-top: auto; /* Push to the bottom */
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;

	@media (max-width: 768px) {
		padding: 15px;
		gap: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		gap: 10px;
	}
`;
