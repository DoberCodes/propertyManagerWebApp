/**
 * AdminNavbar Component
 * Desktop sidebar + mobile bottom bar navigation for the admin portal
 */

import React from 'react';
import {
	AdminSidebar,
	SidebarBrand,
	SidebarBrandName,
	SidebarBrandSub,
	SidebarNavItem,
	SidebarNavIcon,
	SidebarDivider,
	SidebarFooter,
	SidebarUserLabel,
	SidebarSignOutButton,
	MobileNavBar,
	MobileNavItem,
	MobileNavIcon,
	MobileNavLabel,
} from '../AdminInboxPage.styles';
import type { AdminUser } from '../../../services/adminPortalService';

export type AdminNavPage = 'inbox' | 'users' | 'billing' | 'audit';

interface NavItem {
	key: AdminNavPage;
	label: string;
	icon: string;
}

const NAV_ITEMS: NavItem[] = [
	{ key: 'inbox', label: 'Inbox', icon: 'I' },
	{ key: 'users', label: 'Users', icon: 'U' },
	{ key: 'billing', label: 'Billing', icon: '$' },
	{ key: 'audit', label: 'Audit', icon: 'L' },
];

interface AdminNavbarProps {
	activePage: AdminNavPage;
	adminUser: AdminUser | null;
	canViewAuditLogs: boolean;
	onNavigate: (page: AdminNavPage) => void;
	onBackToApp: () => void;
	onLogout: () => Promise<void>;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
	activePage,
	adminUser,
	canViewAuditLogs,
	onNavigate,
	onLogout,
	onBackToApp,
}) => {
	const handleLogout = () => void onLogout();
	const navItems = canViewAuditLogs
		? NAV_ITEMS
		: NAV_ITEMS.filter((item) => item.key !== 'audit');

	return (
		<>
			{/* Desktop sidebar */}
			<AdminSidebar aria-label='Admin navigation'>
				<SidebarBrand>
					<SidebarBrandName>Maintley</SidebarBrandName>
					<SidebarBrandSub>Admin Portal</SidebarBrandSub>
				</SidebarBrand>

				{navItems.map((item) => (
					<SidebarNavItem
						key={item.key}
						type='button'
						$active={activePage === item.key}
						onClick={() => onNavigate(item.key)}
						aria-current={activePage === item.key ? 'page' : undefined}>
						<SidebarNavIcon aria-hidden='true'>{item.icon}</SidebarNavIcon>
						{item.label}
					</SidebarNavItem>
				))}

				<SidebarDivider />

				<SidebarFooter>
					{adminUser ? (
						<SidebarUserLabel title={adminUser.displayName}>
							{adminUser.displayName}
						</SidebarUserLabel>
					) : null}
					<SidebarSignOutButton type='button' onClick={onBackToApp}>
						<SidebarNavIcon aria-hidden='true'>A</SidebarNavIcon>
						Back to App
					</SidebarSignOutButton>
					<SidebarSignOutButton type='button' onClick={handleLogout}>
						<SidebarNavIcon aria-hidden='true'>🚪</SidebarNavIcon>
						Sign Out
					</SidebarSignOutButton>
				</SidebarFooter>
			</AdminSidebar>

			{/* Mobile bottom bar */}
			<MobileNavBar aria-label='Admin navigation'>
				{navItems.map((item) => (
					<MobileNavItem
						key={item.key}
						type='button'
						$active={activePage === item.key}
						onClick={() => onNavigate(item.key)}
						aria-current={activePage === item.key ? 'page' : undefined}>
						<MobileNavIcon aria-hidden='true'>{item.icon}</MobileNavIcon>
						<MobileNavLabel>{item.label}</MobileNavLabel>
					</MobileNavItem>
				))}
			</MobileNavBar>
		</>
	);
};
