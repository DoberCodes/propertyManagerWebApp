import styled from 'styled-components';
import { font_main } from '../../../../global.styles';
import { Link } from 'react-router-dom';

const TOP_NAV_HEIGHT = '64px'; // Dynamic TopNav height

export const DesktopWrapper = styled.div`
	background-color: #fefefe;
	display: flex;
	flex-direction: column;
	height: calc(100vh - ${TOP_NAV_HEIGHT}); /* Subtract dynamic TopNav height */
	max-height: calc(
		100vh - ${TOP_NAV_HEIGHT}
	); /* Prevent overflow beyond viewport minus TopNav */
	flex: 1; /* Fill available space */
	overflow-y: auto; /* Enable scrolling if content exceeds height */
	overflow-x: hidden; /* Prevent horizontal scrolling */

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const ProfileSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	gap: 12px;
	background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
`;

export const ProfileImage = styled.img`
	width: 60px;
	height: 60px;
	border-radius: 50%;
	border: 3px solid #22c55e;
	object-fit: cover;
`;

export const ProfileInfo = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
`;

export const ProfileName = styled.div`
	font-size: 16px;
	font-weight: 600;
	color: #1a1a1a;
	text-align: center;
`;

export const ProfileRole = styled.div`
	font-size: 12px;
	color: #666666;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

export const ProfileActions = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	gap: 8px;
	margin-top: 8px;
`;

export const ProfileButton = styled.button<{ variant?: 'primary' | 'danger' }>`
	width: 100%;
	padding: 10px 16px;
	border: none;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	background: ${(props) =>
		props.variant === 'danger' ? '#ef4444' : '#22c55e'};
	color: white;

	&:hover {
		background: ${(props) =>
			props.variant === 'danger' ? '#dc2626' : '#16a34a'};
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: translateY(0);
	}
`;

export const MobileBottomNav = styled.div`
	display: flex;
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: linear-gradient(90deg, #065f46 0%, #047857 100%);
	border-top: 2px solid rgba(255, 255, 255, 0.25);
	flex-direction: row;
	justify-content: stretch;
	align-items: stretch;
	padding: 0;
	padding-bottom: max(40px, env(safe-area-inset-bottom));
	padding-left: env(safe-area-inset-left);
	padding-right: env(safe-area-inset-right);
	z-index: 100;
	box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
	height: auto;
	min-height: 64px;
	position: relative;

	/* Extend background into bottom safe area */
	&::after {
		content: '';
		position: absolute;
		bottom: calc(-1 * env(safe-area-inset-bottom));
		left: 0;
		right: 0;
		height: env(safe-area-inset-bottom);
		background: linear-gradient(90deg, #065f46 0%, #047857 100%);
		z-index: -1;
	}

	@media (max-width: 1024px) {
		display: flex;
	}

	@media (min-width: 1025px) {
		display: none;
	}
`;

export const MobileNavItem = styled(Link)`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	padding: 14px 0;
	padding-bottom: max(14px, calc(0px + env(safe-area-inset-bottom)));
	text-decoration: none;
	color: rgba(255, 255, 255, 0.85);
	font-size: 11px;
	font-weight: 700;
	text-align: center;
	flex: 1 1 0%;
	transition: all 0.3s ease;
	cursor: pointer;
	white-space: nowrap;
	word-break: break-word;
	position: relative;
	border-right: 1px solid rgba(255, 255, 255, 0.1);

	&:last-child {
		border-right: none;
	}

	&:hover {
		color: white;
		background-color: rgba(255, 255, 255, 0.08);
	}

	&.active {
		color: white;
		background-color: rgba(255, 255, 255, 0.15);
		font-weight: 700;

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 3px;
			background-color: white;
		}
	}
`;

export const MenuSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px; /* Reduced gap to minimize spacing */
	padding: 20px;
	flex-shrink: 0; /* Prevent shrinking */

	@media (max-width: 1024px) {
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

	@media (max-width: 1024px) {
		gap: 8px;
	}
`;

export const MenuItem = styled(Link)`
	color: #22c55e;
	text-decoration: none;
	font-size: ${font_main};
	font-weight: 500;
	padding: 10px 12px;
	border-radius: 4px;
	transition: all 0.2s ease;
	cursor: pointer;
	white-space: nowrap;
	position: relative;
	border-left: 3px solid transparent;

	&:hover {
		background-color: rgba(34, 197, 94, 0.1);
	}

	&.active {
		background-color: rgba(34, 197, 94, 0.15);
		color: #16a34a;
		font-weight: 600;
		border-left-color: #22c55e;
	}

	@media (max-width: 1024px) {
		font-size: 12px;
		padding: 8px 10px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		padding: 6px 8px;
	}
`;

export const MenuItemContent = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`;

export const MenuItemIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	font-size: 13px;
	color: inherit;
`;

export const SimpleList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
`;

export const SimpleListItem = styled.li`
	padding: 8px 0;
	font-size: 13px;
	color: #666666;
	cursor: pointer;
	transition: color 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	border-bottom: 1px solid #f0f0f0;

	&:hover {
		color: #22c55e;
	}
`;

export const ItemText = styled.span`
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
`;

export const RemoveItemButton = styled.button`
	border: none;
	background: transparent;
	color: #9ca3af;
	cursor: pointer;
	font-size: 14px;
	padding: 2px 4px;
	line-height: 1;
	border-radius: 4px;
`;

export const PortfolioCard = styled.div`
	border: 1px solid #dbe4ea;
	border-radius: 10px;
	padding: 12px;
	background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const PortfolioTop = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
`;

export const PortfolioPlan = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: #111827;
`;

export const PortfolioUsage = styled.div`
	font-size: 12px;
	color: #4b5563;
`;

export const ProgressTrack = styled.div`
	height: 6px;
	border-radius: 999px;
	background: #e5e7eb;
	overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => `${$percent}%`};
	background: linear-gradient(90deg, #10b981 0%, #22c55e 100%);
	transition: width 0.2s ease;
`;

export const ManagePlanButton = styled.button`
	border: 1px solid #d1d5db;
	background: white;
	color: #0f172a;
	font-size: 12px;
	font-weight: 600;
	border-radius: 8px;
	padding: 8px 10px;
	cursor: pointer;
	text-align: center;

	&:hover {
		background: #f8fafc;
	}
`;

export const Section = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 20px;
	flex-shrink: 0; /* Prevent shrinking */
	border-bottom: 1px solid rgba(0, 0, 0, 0.1);

	&:last-of-type {
		border-bottom: none;
	}

	@media (max-width: 1024px) {
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
	max-height: 200px; /* Allow more height on larger screens */
	overflow-y: auto; /* Enable scrolling if content exceeds height */
	flex-shrink: 0; /* Prevent shrinking */

	@media (max-width: 1024px) {
		gap: 10px;
		font-size: 13px;
		max-height: 150px;
	}

	@media (max-width: 480px) {
		gap: 8px;
		font-size: 12px;
		max-height: 120px;
	}
`;

export const BottomSections = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin-top: auto; /* Push to bottom */
	padding: 20px;
	flex-shrink: 0; /* Prevent shrinking */

	@media (max-width: 1024px) {
		padding: 20px;
		gap: 0;
		margin-top: 0;
	}

	@media (max-width: 480px) {
		padding: 15px;
		gap: 0;
	}
`;
