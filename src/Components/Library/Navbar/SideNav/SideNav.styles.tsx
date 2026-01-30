import styled from 'styled-components';
import { font_main } from '../../../../global.styles';
import { Link } from 'react-router-dom';

export const DesktopWrapper = styled.div`
	background-color: #fefefe;
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-height: 100%;
	overflow: visible;

	@media (max-width: 768px) {
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
	background-color: #fefefe;
	border-top: 1px solid #e5e7eb;
	flex-direction: row;
	justify-content: space-around;
	padding: 8px 0;
	padding-bottom: max(8px, env(safe-area-inset-bottom));
	padding-left: env(safe-area-inset-left);
	padding-right: env(safe-area-inset-right);
	z-index: 100;
	box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);

	@media (max-width: 768px) {
		display: flex;
	}

	@media (min-width: 769px) {
		display: none;
	}
`;

export const MobileNavItem = styled(Link)`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	padding: 8px 12px;
	text-decoration: none;
	color: #666666;
	font-size: 11px;
	font-weight: 600;
	text-align: center;
	flex: 1;
	transition: all 0.2s ease;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		color: #22c55e;
		background-color: rgba(34, 197, 94, 0.05);
	}

	&.active {
		color: #22c55e;
		background-color: rgba(34, 197, 94, 0.1);
		border-top: 3px solid #22c55e;
		padding-top: 5px;
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
