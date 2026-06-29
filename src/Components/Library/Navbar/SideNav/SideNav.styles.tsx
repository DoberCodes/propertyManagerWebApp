import styled from 'styled-components';
import { font_main } from '../../../../global.styles';
import { Link } from 'react-router-dom';
import { COLORS } from '../../../../constants/colors';

const TOP_NAV_HEIGHT = '64px'; // Dynamic TopNav height

export const DesktopWrapper = styled.div`
	background-color: ${COLORS.white};
	display: flex;
	flex-direction: column;
	height: calc(100vh - ${TOP_NAV_HEIGHT}); /* Subtract dynamic TopNav height */
	max-height: calc(
		100vh - ${TOP_NAV_HEIGHT}
	); /* Prevent overflow beyond viewport minus TopNav */
	flex: 1; /* Fill available space */
	overflow-y: auto; /* Single natural sidebar scroll */
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
	border-bottom: 1px solid ${COLORS.border};
	gap: 12px;
	background: ${COLORS.canvas};
`;

export const ProfileImage = styled.img`
	width: 60px;
	height: 60px;
	border-radius: 50%;
	border: 3px solid ${COLORS.primary};
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
	color: ${COLORS.textPrimary};
	text-align: center;
`;

export const ProfileRole = styled.div`
	font-size: 12px;
	color: ${COLORS.textSecondary};
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
		props.variant === 'danger' ? COLORS.error : COLORS.primary};
	color: ${COLORS.white};

	&:hover {
	background: ${(props) =>
			props.variant === 'danger' ? COLORS.errorDark : COLORS.primaryHover};
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
	background: ${COLORS.primary};
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
		background: ${COLORS.primary};
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
		color: ${COLORS.white};
		background-color: rgba(255, 255, 255, 0.08);
	}

	&.active {
		color: ${COLORS.white};
		background-color: rgba(255, 255, 255, 0.15);
		font-weight: 700;

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 3px;
			background-color: ${COLORS.white};
		}
	}
`;

export const MenuSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 14px 16px;
	flex-shrink: 0;

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
	gap: 8px;

	@media (max-width: 1024px) {
		gap: 8px;
	}
`;

export const MenuItem = styled(Link)`
	color: ${COLORS.primary};
	text-decoration: none;
	font-size: ${font_main};
	font-weight: 500;
	padding: 8px 10px;
	border-radius: 4px;
	transition: all 0.2s ease;
	cursor: pointer;
	white-space: nowrap;
	position: relative;
	border-left: 3px solid transparent;

	&:hover {
		background-color: ${COLORS.primaryLight};
	}

	&.active {
		background-color: ${COLORS.primaryLight};
		color: ${COLORS.primaryDark};
		font-weight: 600;
		border-left-color: ${COLORS.primary};
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
	padding: 6px 0;
	font-size: 13px;
	color: ${COLORS.textSecondary};
	cursor: pointer;
	transition: color 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	border-bottom: 1px solid ${COLORS.borderLight};

	&:hover {
		color: ${COLORS.primary};
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
	color: ${COLORS.textMuted};
	cursor: pointer;
	font-size: 14px;
	padding: 2px 4px;
	line-height: 1;
	border-radius: 4px;
`;

export const PortfolioCard = styled.div`
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	padding: 12px;
	background: ${COLORS.white};
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const PortfolioTop = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px;
`;

export const PortfolioPlan = styled.div`
	font-size: 15px;
	font-weight: 800;
	line-height: 1.2;
	color: ${COLORS.textPrimary};
`;

export const PortfolioPlanSub = styled.div`
	font-size: 13px;
	font-weight: 600;
	line-height: 1.35;
	color: ${COLORS.gray600};
`;

export const PortfolioUsage = styled.div`
	font-size: 13px;
	font-weight: 500;
	color: ${COLORS.gray600};
	line-height: 1.4;
`;

export const PortfolioUsageBadge = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: ${COLORS.gray700};
	line-height: 1.2;
	background: ${COLORS.borderLight};
	border: 1px solid ${COLORS.border};
	border-radius: 999px;
	padding: 4px 10px;
	white-space: nowrap;
`;

export const ProgressTrack = styled.div`
	height: 7px;
	border-radius: 999px;
	background: ${COLORS.border};
	overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
	height: 100%;
	width: ${({ $percent }) => `${$percent}%`};
	background: ${COLORS.gradientPrimary};
	transition: width 0.2s ease;
`;

export const ManagePlanButton = styled.button`
	border: 1px solid ${COLORS.border};
	background: ${COLORS.white};
	color: ${COLORS.textPrimary};
	font-size: 13px;
	font-weight: 600;
	border-radius: 10px;
	padding: 8px 10px;
	cursor: pointer;
	text-align: center;
	width: 100%;
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease,
		transform 0.2s ease;

	&:hover {
		background: ${COLORS.canvas};
		border-color: ${COLORS.borderDark};
		transform: translateY(-1px);
	}
`;

export const Section = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 14px 16px;
	flex-shrink: 0; /* Prevent shrinking */
	border-bottom: 1px solid ${COLORS.border};

	&:last-of-type {
		border-bottom: none;
	}

	@media (max-width: 1024px) {
		padding: 20px;
		border-bottom: 1px solid ${COLORS.border};
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
	color: ${COLORS.textMuted};
	margin: 0 0 2px 0;
	letter-spacing: 0.5px;

	@media (max-width: 480px) {
		font-size: 10px;
		margin: 0 0 6px 0;
	}
`;

export const SectionContent = styled.div<{ $scrollable?: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 8px;
	font-size: ${font_main};
	color: ${COLORS.textPrimary};
	max-height: ${({ $scrollable = true }) => ($scrollable ? '200px' : 'none')};
	overflow-y: ${({ $scrollable = true }) => ($scrollable ? 'auto' : 'visible')};
	flex-shrink: 0; /* Prevent shrinking */

	@media (max-width: 1024px) {
		gap: 10px;
		font-size: 13px;
		max-height: ${({ $scrollable = true }) => ($scrollable ? '150px' : 'none')};
	}

	@media (max-width: 480px) {
		gap: 8px;
		font-size: 12px;
		max-height: ${({ $scrollable = true }) => ($scrollable ? '120px' : 'none')};
	}
`;

export const BottomSections = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 0;
	padding: 12px 16px 16px;
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
