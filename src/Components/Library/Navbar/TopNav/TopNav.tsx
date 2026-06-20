import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store/store';
import {
	Title,
	Wrapper,
	LeftSection,
	RightSection,
	HamburgerButton,
	NavbarOverlay,
} from './TopNav.styles';
import { AvatarMenu } from '../AvatarMenu/AvatarMenu';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../../../Hooks/useFavorites';
import {
	selectIsTenant,
	selectCanAccessTeam,
	selectCanAccessProperties,
	selectCanViewAllPages,
	selectIsTeamMemberAccount,
	selectIsHomeowner,
} from '../../../../Redux/selectors/permissionSelectors';
import TitleName from '../../../../Assets/images/TitleName.png';
import { GenericModal } from '../../Modal/GenericModal';
import { NotificationPanel } from '../../NotificationPanel/NotificationPanel';

import { MobileBottomNav, MobileHamburgerNav } from '../MobileNav';

export const TopNav = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const { favorites } = useFavorites(currentUser!.id);

	console.info(currentUser);


	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
	const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
	const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
	const quickCreateRef = React.useRef<HTMLDivElement | null>(null);

	// Permission flags (use selectors for single source of truth)
	const isUserTenant = useSelector(selectIsTenant);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const canViewPages = useSelector(selectCanViewAllPages);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);
	const isHomeowner = useSelector(selectIsHomeowner);


	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent) => {
			if (!quickCreateRef.current) return;
			if (quickCreateRef.current.contains(event.target as Node)) return;
			setIsQuickCreateOpen(false);
		};

		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	}, []);

	useEffect(() => {
		setIsQuickCreateOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		const applyMobileBottomPadding = () => {
			const root = document.documentElement;
			if (window.innerWidth <= 1024) {
				root.style.setProperty(
					'--mobile-bottom-nav-offset',
					'calc(126px + env(safe-area-inset-bottom))',
				);
			} else {
				root.style.setProperty('--mobile-bottom-nav-offset', '0px');
			}
		};

		applyMobileBottomPadding();
		window.addEventListener('resize', applyMobileBottomPadding);

		return () => {
			window.removeEventListener('resize', applyMobileBottomPadding);
			document.documentElement.style.setProperty(
				'--mobile-bottom-nav-offset',
				'0px',
			);
		};
	}, []);
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);
	const pathname = location.pathname || '';
	const isPropertyContext = /^\/property\//i.test(pathname);
	const isHomeActive = pathname === '/dashboard';
	const isTasksActive = pathname === '/tasks';
	const isSystemsActive = pathname === '/devices';
	const isPropertyNavActive = /^\/properties(\/|$)|^\/property\//i.test(pathname);

	return (
		<>
			<NavbarOverlay isOpen={isSidebarOpen} onClick={() => {
				setIsSidebarOpen(false);
			}} />
			<Wrapper>
				<LeftSection>
					<HamburgerButton
						onClick={() => {
							setIsSidebarOpen(!isSidebarOpen)
							if (isProfileDropdownOpen) {
								setIsProfileDropdownOpen(false);
							}
						}}
						title='Open menu'>
						☰
					</HamburgerButton>
					<Title className='desktop-title'>
						<img src={TitleName} alt='Maintley' />
						<span
							style={{
								color: '#22c55e',
								position: 'relative',
								top: '-10px',
							}}>
							Beta
						</span>
					</Title>
				</LeftSection>
				<Title className='mobile-title'>
					<img src={TitleName} alt='Maintley' />{' '}
					<div
						style={{
							color: '#22c55e',
						}}>
						Beta
					</div>
				</Title>
				<RightSection>
					<NavbarOverlay isDropdown={isProfileDropdownOpen} onClick={() => setIsProfileDropdownOpen(false)} />
					<AvatarMenu activeRoute={activeRoute} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} setIsNotificationModalOpen={setIsNotificationModalOpen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
				</RightSection>
			</Wrapper>

			{/* Mobile Sidebar */}
			<MobileHamburgerNav isQuickCreateOpen={isQuickCreateOpen} setIsQuickCreateOpen={setIsQuickCreateOpen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isUserTenant={isUserTenant} isHomeowner={isHomeowner} isTeamMemberAccount={isTeamMemberAccount} isPropertyContext={isPropertyContext} pathname={pathname} favorites={favorites} canAccessTeam={canAccessTeam} canAccessProperties={canAccessProperties} canViewPages={canViewPages} activeRoute={activeRoute} />

			<MobileBottomNav isQuickCreateOpen={isQuickCreateOpen} setIsQuickCreateOpen={setIsQuickCreateOpen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isUserTenant={isUserTenant} isHomeowner={isHomeowner} isTeamMemberAccount={isTeamMemberAccount} isPropertyContext={isPropertyContext} pathname={pathname} favorites={favorites} quickCreateRef={quickCreateRef} canAccessTeam={canAccessTeam} canAccessProperties={canAccessProperties} canViewPages={canViewPages} activeRoute={activeRoute} />

			{/* Notification Modal */}
			<GenericModal
				isOpen={isNotificationModalOpen}
				onClose={() => setIsNotificationModalOpen(false)}
				title='Notifications'
				showActions={false}>
				<NotificationPanel
					onOpenSettings={() => {
						setIsNotificationModalOpen(false);
						navigate('/settings?category=notifications');
					}}
				/>
			</GenericModal>
		</>
	);
};
