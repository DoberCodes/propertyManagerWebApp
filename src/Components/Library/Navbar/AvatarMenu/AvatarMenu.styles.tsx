import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { COLORS } from '../../../../constants/colors';

export const AvatarMenuWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	margin-right: 12px;
	margin-bottom: 4px;
	gap: 8px;

`;

export const UserImage = styled.img`
	width: 50px;
	height: 50px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid ${COLORS.primary};

	&:hover {
		border-color: ${COLORS.secondaryHover};
		opacity: 0.7;
	}

`;

export const NotificationBadge = styled.div`
	position: absolute;
	top: -5px;
	right: -5px;
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	border-radius: 999px;
	background: #ef4444;
	color: #ffffff;
	font-size: 10px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;

`;
export const UserInfo = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	margin-left: 8px;

	@media (max-width: 1024px) {
		margin-left: 6px;
	}

	@media (max-width: 480px) {
		margin-left: 6px;
		display: none;
	}
`;

export const UserName = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: #f9fafb;
	white-space: nowrap;
	margin: 0;
	line-height: 1.2;

	@media (max-width: 1024px) {
		font-size: 13px;
	}
`;

export const UserTitle = styled.span`
	font-size: 12px;
	color: #e5e7eb;
	white-space: nowrap;
	margin: 0;
	line-height: 1.2;

	@media (max-width: 1024px) {
		font-size: 11px;
	}
`;

export const DropdownMenu = styled.div`
	display: flex;
	flex-direction: column;
	position: absolute;
	top: calc(100% + 5px);
	right: 0;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	min-width: 150px;
	pointer-events: auto;

	@media (max-width: 480px) {
		min-width: 140px;
		top: calc(100% + 2px);
	}
`;

export const DropdownItem = styled(Link)`
	display: block;
	padding: 10px 15px;
	color: #22c55e;
	text-decoration: none;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s ease;
	min-height: 44px; /* Better touch target */
	display: flex;
	align-items: center;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:hover {
		background-color: #f0fdf4;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		min-height: 48px; /* Larger touch target on mobile */
	}
`;

export const DropdownButton = styled.button<{ variant?: 'default' | 'danger' }>`
	display: block;
	width: 100%;
	padding: 10px 15px;
	color: ${(props) => (props.variant === 'danger' ? '#ef4444' : '#22c55e')};
	background: none;
	border: none;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	&:hover {
		background-color: ${(props) =>
		props.variant === 'danger'
			? 'rgba(239, 68, 68, 0.1)'
			: 'rgba(34, 197, 94, 0.1)'};
		color: ${(props) => (props.variant === 'danger' ? '#dc2626' : '#22c55e')};
	}

	@media (max-width: 480px) {
		padding: 8px 12px;
	}
`;
