import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store/store';
import {
	Title,
	Wrapper,
	HamburgerButton,
	NavbarOverlay,
	InnerWrapper,
	MobileRouteLabel,
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
import TitleName from '../../../../Assets/TitleName.png';
import { GenericModal } from '../../Modal/GenericModal';
import { NotificationPanel } from '../../NotificationPanel/NotificationPanel';
import { useGetPropertiesQuery } from '../../../../Redux/API/propertySlice';

import { MobileBottomNav, MobileHamburgerNav } from '../MobileNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { COLORS } from '../../../../constants/colors';

export const TopNav = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const { favorites } = useFavorites(currentUser!.id);
	const { data: navProperties = [] } = useGetPropertiesQuery();
	const activeRoute = useSelector((state: RootState) => state.navigation.activeRoute);

	const [navLocation, setNavLocation] = useState('Dashboard');

	const pathname = location.pathname || '';
	const isPropertyContext = /^\/property\//i.test(pathname);



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
		// Logic to determine nav title based on active route
		// This can be expanded with more complex logic or a mapping of routes to titles

		if (activeRoute.startsWith('/properties')) {
			setNavLocation(isHomeowner ? 'Homes' : 'Properties');
		} else if (activeRoute.startsWith('/tasks')) {
			setNavLocation('Tasks');
		} else if (activeRoute.startsWith('/devices')) {
			setNavLocation('Equipment');
		} else if (activeRoute.startsWith('/team')) {
			setNavLocation('Team');
		} else if (activeRoute.startsWith('/settings')) {
			setNavLocation('Settings');
		} else if (activeRoute.startsWith('/support')) {
			setNavLocation('Support Center');
		} else if (activeRoute.startsWith('/report')) {
			setNavLocation('Reports');
		} else if (activeRoute.startsWith('/property/')) {
			const rawPropertyKey = pathname.split('/')[2] || '';
			const propertyKey = decodeURIComponent(rawPropertyKey);
			const matchedProperty = navProperties.find(
				(property: any) =>
					String(property?.slug || '') === propertyKey ||
					String(property?.id || '') === propertyKey,
			);
			const matchedFavorite = favorites.find(
				(favorite) => String(favorite.slug || '') === propertyKey,
			);
			setNavLocation(
				matchedProperty?.title ||
				matchedFavorite?.title ||
				(isHomeowner ? 'Home' : 'Property'),
			);
		} else {
			setNavLocation('Dashboard');
		}
		// Set document title for better UX



	}, [activeRoute, favorites, isHomeowner, navProperties, pathname]);

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


	return (
		<>
			<NavbarOverlay isOpen={isSidebarOpen} onClick={() => {
				setIsSidebarOpen(false);
			}} />
			<Wrapper>
				<InnerWrapper>
					<MobileRouteLabel>
						<HamburgerButton
							onClick={() => {
								setIsSidebarOpen(!isSidebarOpen)
								if (isProfileDropdownOpen) {
									setIsProfileDropdownOpen(false);
								}
							}}
							title='Open menu'>
							<FontAwesomeIcon icon={faBars} size='lg' color={COLORS.white} />
						</HamburgerButton>
						{navLocation}
					</MobileRouteLabel>
					<Title>
						<img src={TitleName} alt='Maintley' />{' '}
						<span>
							Beta
						</span>
					</Title>
					<NavbarOverlay isDropdown={isProfileDropdownOpen} onClick={() => setIsProfileDropdownOpen(false)} />
					<AvatarMenu activeRoute={activeRoute} isProfileDropdownOpen={isProfileDropdownOpen} setIsProfileDropdownOpen={setIsProfileDropdownOpen} setIsNotificationModalOpen={setIsNotificationModalOpen} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
				</InnerWrapper>
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
