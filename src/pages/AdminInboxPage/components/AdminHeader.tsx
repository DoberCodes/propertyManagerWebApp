/**
 * AdminHeader Component
 * Header with admin user info, refresh, and settings menu
 */

import React, { useRef } from 'react';
import {
	HeaderRow,
	Title,
	SubTitle,
	ButtonRow,
	Button,
	SettingsWrap,
	SecondaryButton,
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
	onLogout: () => Promise<void>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
	adminUser,
	showSettingsMenu,
	isRefreshing,
	onRefresh,
	onSettingsToggle,
	onLogout,
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
			<div>
				<Title>Maintley Admin Inbox</Title>
				<SubTitle>Signed in as {adminUser?.displayName}</SubTitle>
			</div>
			<ButtonRow>
				<Button type='button' onClick={handleRefresh} disabled={isRefreshing}>
					{isRefreshing ? 'Refreshing...' : 'Refresh'}
				</Button>
				<SettingsWrap ref={settingsMenuRef}>
					<SecondaryButton type='button' onClick={onSettingsToggle}>
						Settings
					</SecondaryButton>
					{showSettingsMenu ? (
						<SettingsMenu>
							<SettingsItem type='button' onClick={handleLogout}>
								Sign Out
							</SettingsItem>
						</SettingsMenu>
					) : null}
				</SettingsWrap>
			</ButtonRow>
		</HeaderRow>
	);
};
