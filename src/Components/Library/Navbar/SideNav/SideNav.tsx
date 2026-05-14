import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../Redux/store/store';
import { setActiveRoute } from '../../../../Redux/Slices/navigationSlice';
import { useRecentlyViewed } from '../../../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../../../Hooks/useFavorites';
import {
	DesktopWrapper,
	MenuSection,
	SectionTitle,
	MenuNav,
	MenuItem,
	MenuItemContent,
	MenuItemIcon,
	Section,
	SectionContent,
	SimpleList,
	SimpleListItem,
	ItemText,
	RemoveItemButton,
	PortfolioCard,
	PortfolioTop,
	PortfolioPlan,
	PortfolioPlanSub,
	PortfolioUsage,
	PortfolioUsageBadge,
	ProgressTrack,
	ProgressFill,
	ManagePlanButton,
	BottomSections,
} from './SideNav.styles';
import {
	selectIsTenant,
	selectCanAccessTeam,
	selectCanAccessProperties,
	selectIsHomeowner,
	selectIsContractor,
} from '../../../../Redux/selectors/permissionSelectors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBookOpen,
	faChartBar,
	faCog,
	faHome,
	faIdCard,
	faMicrochip,
	faTachometerAlt,
	faTasks,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
	getRemainingPropertySlots,
	getSubscriptionPlanDetails,
} from '../../../../utils/subscriptionUtils';

export const SideNav = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);
	const { recentProperties } = useRecentlyViewed(currentUser!.id);
	const { favorites, removeFavorite } = useFavorites(currentUser!.id);
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	// Update Redux when location changes
	React.useEffect(() => {
		const hash = location.hash.replace('#', '');
		// Extract the main route (e.g., '/dashboard' from '/dashboard' or '/property/:slug')
		const mainRoute = '/' + hash.split('/')[1];
		dispatch(setActiveRoute(mainRoute));
	}, [location.hash, dispatch]);

	// Permission flags (use selectors so logic is centralized)
	const isUserTenant = useSelector(selectIsTenant);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	const isContractor = useSelector(selectIsContractor);
	const canViewPages = useSelector(selectCanAccessProperties); // Restored variable

	const isActive = (path: string) => activeRoute === path;
	const totalProperties = React.useMemo(
		() =>
			Array.from(
				new Set(
					propertyGroups
						.flatMap((group) => group.properties || [])
						.map((property) => property.id),
				),
			).length,
		[propertyGroups],
	);

	const planDetails = getSubscriptionPlanDetails(
		currentUser?.subscription?.plan || 'home',
	);
	const maxProperties = planDetails?.maxProperties || 1;
	const remainingSlots = currentUser?.subscription
		? getRemainingPropertySlots(currentUser.subscription, totalProperties)
		: 0;
	const usedProperties = Math.max(0, maxProperties - remainingSlots);
	const usagePercent = maxProperties > 0 ? (usedProperties / maxProperties) * 100 : 0;

	// Desktop nav items
	const desktopMenuItems = [
		{
			label: 'Dashboard',
			path: '/dashboard',
			icon: faTachometerAlt,
			visible: !isUserTenant,
		},
		{
			label: 'Tasks',
			path: '/tasks',
			icon: faTasks,
			visible: !isUserTenant && !isContractor,
		},
		{
			label: 'Devices',
			path: '/devices',
			icon: faMicrochip,
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Properties',
			path: '/properties',
			icon: faHome,
			visible: isUserTenant || canAccessProperties || canViewPages,
		},
		{
			label: 'Team',
			path: '/team',
			icon: faUsers,
			visible: !isUserTenant && !isHomeowner && (canAccessTeam || canViewPages),
		},
		{
			label: 'Report',
			path: '/report',
			icon: faChartBar,
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Tenant Profile',
			path: '/tenant-profile',
			icon: faIdCard,
			visible: isUserTenant,
		},
	];

	return (
		<DesktopWrapper>
			<MenuSection>
				<Section>
					<SectionTitle>Navigation</SectionTitle>
					<MenuNav>
						{desktopMenuItems
							.filter((item) => item.visible)
							.map((item) => (
								<MenuItem
									key={item.label}
									to={item.path}
									className={isActive(item.path) ? 'active' : ''}>
									<MenuItemContent>
										<MenuItemIcon>
											<FontAwesomeIcon icon={item.icon} />
										</MenuItemIcon>
										<span>{item.label}</span>
									</MenuItemContent>
								</MenuItem>
							))}
					</MenuNav>
				</Section>
				{!isUserTenant && (
					<>
						{/* Favorites Section */}
						<Section>
							<SectionTitle>Favorites</SectionTitle>
							<SectionContent>
								{favorites.length > 0 ? (
										<SimpleList>
										{favorites.slice(0, 5).map((property) => (
												<SimpleListItem
												key={property.id}
													onClick={() => navigate(`/property/${property.slug}`)}>
													<ItemText title={property.title}>{property.title}</ItemText>
													<RemoveItemButton
													type='button'
													onClick={(e) => {
														e.stopPropagation();
														void removeFavorite(property.id);
													}}
													title={`Remove ${property.title} from favorites`}
														aria-label={`Remove ${property.title} from favorites`}>
													×
													</RemoveItemButton>
												</SimpleListItem>
										))}
										</SimpleList>
								) : (
									<div style={{ fontSize: '12px', color: '#999999' }}>
										No favorite properties
									</div>
								)}
							</SectionContent>
						</Section>

						{/* Recently Viewed Properties Section */}
						<Section>
							<SectionTitle>Recently Viewed Properties</SectionTitle>
							<SectionContent>
								{recentProperties.length > 0 ? (
									<SimpleList>
										{recentProperties.slice(0, 5).map((property) => (
											<SimpleListItem
												key={property.id}
												onClick={() => navigate(`/property/${property.slug}`)}>
												<ItemText title={property.title}>{property.title}</ItemText>
											</SimpleListItem>
										))}
									</SimpleList>
								) : (
									<div style={{ fontSize: '12px', color: '#999999' }}>
										No recently viewed properties
									</div>
								)}
							</SectionContent>
						</Section>

						<Section>
							<SectionContent $scrollable={false}>
								<PortfolioCard>
									<PortfolioTop>
										<PortfolioPlan>
											Property Plan
										</PortfolioPlan>
										<PortfolioUsageBadge>
											{usedProperties} of {maxProperties}
										</PortfolioUsageBadge>
									</PortfolioTop>
									<PortfolioPlanSub>
										Current plan: {planDetails?.name || 'Home'}
									</PortfolioPlanSub>
									<ProgressTrack>
										<ProgressFill $percent={Math.min(100, usagePercent)} />
									</ProgressTrack>
									<PortfolioUsage>
										{remainingSlots} property slots available
									</PortfolioUsage>
									<ManagePlanButton
										type='button'
										onClick={() => navigate('/paywall')}>
										Manage Plan
									</ManagePlanButton>
								</PortfolioCard>
							</SectionContent>
						</Section>
					</>
				)}
			</MenuSection>

			<BottomSections>
				{/* Features Section */}
				<Section>
					<SectionTitle>Help & Resources</SectionTitle>
					<SectionContent>
						{!isUserTenant && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									padding: '8px 0',
									fontSize: '13px',
									color: '#666666',
									cursor: 'pointer',
									transition: 'color 0.2s ease',
								}}
								onClick={() => navigate('/features')}
								onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
								onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}>
								<FontAwesomeIcon icon={faBookOpen} size='sm' />
								<span>View All Features</span>
							</div>
						)}
					</SectionContent>

					{/* Settings Navigation */}
					<SectionContent>
						<div
							style={{
								display: 'flex',
								padding: '8px 0',
								fontSize: '13px',
								color: '#666666',
								cursor: 'pointer',
								transition: 'color 0.2s ease',
							}}
							onClick={() => navigate('/settings')}
							onMouseEnter={(e) =>
								(e.currentTarget.style.color = '#999999')
							} /* Lighter gray on hover */
							onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}>
							<FontAwesomeIcon icon={faCog} size='lg' />
							<div style={{ marginLeft: '4px' }}>Settings</div>
						</div>
					</SectionContent>
				</Section>
			</BottomSections>
		</DesktopWrapper>
	);
};
