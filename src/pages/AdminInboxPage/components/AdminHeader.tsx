/**
 * AdminHeader Component
 * Header with admin user info, refresh, and settings menu
 */

import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faRotate } from '@fortawesome/free-solid-svg-icons';
import {
	HeaderRow,
	HeaderTitleGroup,
	HeaderActions,
	Title,
	SubTitle,
	SettingsWrap,
	HeaderIconButton,
	SettingsMenu,
	SettingsItem,
} from '../AdminInboxPage.styles';
import { useClickOutside } from '../../../Hooks/useClickOutside';
import { AdminUser } from '../../../services/adminPortalService';

interface AdminHeaderProps {
	adminUser: AdminUser | null;
	showSettingsMenu: boolean;
	isRefreshing?: boolean;
	onRefresh: () => Promise<void>;
	onSettingsToggle: () => void;
	onBackToApp: () => void;
	onLogout: () => Promise<void>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
	adminUser,
	showSettingsMenu,
	isRefreshing,
	onRefresh,
	onSettingsToggle,
	onLogout,
	onBackToApp,
}) => {
	const settingsMenuRef = useRef<HTMLDivElement | null>(null);

	useClickOutside(
		settingsMenuRef,
		() => {
			if (showSettingsMenu) {
				onSettingsToggle();
			}
		},
		showSettingsMenu,
	);

	const handleRefresh = () => {
		void onRefresh();
	};

	const handleLogout = () => {
		void onLogout();
	};

	return (
		<HeaderRow>
			<HeaderTitleGroup>
				<Title>Maintley Admin Inbox</Title>
				<SubTitle>Signed in as {adminUser?.displayName}</SubTitle>
			</HeaderTitleGroup>
			<HeaderActions>
				<HeaderIconButton
					type='button'
					onClick={handleRefresh}
					disabled={isRefreshing}
					aria-label={isRefreshing ? 'Refreshing tickets' : 'Refresh tickets'}
					title={isRefreshing ? 'Refreshing tickets' : 'Refresh tickets'}>
					<FontAwesomeIcon icon={faRotate} spin={isRefreshing} />
				</HeaderIconButton>
				<SettingsWrap ref={settingsMenuRef}>
					<HeaderIconButton
						type='button'
						onClick={onSettingsToggle}
						aria-label='Open admin menu'
						aria-expanded={showSettingsMenu}
						title='Open admin menu'>
						<FontAwesomeIcon icon={faEllipsisVertical} />
					</HeaderIconButton>
					{showSettingsMenu ? (
						<SettingsMenu>
							<SettingsItem type='button' onClick={handleLogout}>
								Sign Out
							</SettingsItem>
							<SettingsItem type='button' onClick={onBackToApp}>
								Back to App
							</SettingsItem>
						</SettingsMenu>
					) : null}
				</SettingsWrap>
			</HeaderActions>
		</HeaderRow >
	);
};
