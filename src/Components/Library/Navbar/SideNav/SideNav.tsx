import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store/store';
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
	selectIsTeamMemberAccount,
} from '../../../../Redux/selectors/permissionSelectors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBookOpen,
	faChartBar,
	faCog,
	faHome,
	faHeadset,
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
import { useStorageUsage } from '../../../../Hooks/useStorageUsage';
import { formatStorageBytes } from '../../../../utils/storageQuota';
import { filterPropertyGroupsByRole } from '../../../../utils/dataFilters';
import { TeamMember } from '../../../../Redux/Slices/teamSlice';

export const SideNav = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);
	const { recentProperties } = useRecentlyViewed(currentUser!.id);
	const { favorites, removeFavorite } = useFavorites(currentUser!.id);
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const teamMembers = React.useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);

	// Permission flags (use selectors so logic is centralized)
	const isUserTenant = useSelector(selectIsTenant);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	const isContractor = useSelector(selectIsContractor);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);
	const canViewPages = useSelector(selectCanAccessProperties); // Restored variable
	const { usage: storageUsage, isLoading: isStorageUsageLoading } =
		useStorageUsage(currentUser, !isUserTenant && !isTeamMemberAccount);

	const isActive = (path: string) => activeRoute === path;
	const filteredPropertyGroups = React.useMemo(
		() =>
			filterPropertyGroupsByRole(
				propertyGroups.map((group) => ({
					...group,
					properties: group.properties || [],
				})) as any[],
				currentUser,
				teamMembers.filter((member): member is TeamMember => member !== undefined),
			),
		[propertyGroups, currentUser, teamMembers],
	);
	const totalProperties = React.useMemo(
		() =>
			Array.from(
				new Set(
					filteredPropertyGroups
						.flatMap((group) => group.properties || [])
						.map((property) => property.id),
				),
			).length,
		[filteredPropertyGroups],
	);

	const effectivePlanId =
		currentUser?.subscription?.hasScheduledSubscription &&
			currentUser.subscription.scheduledPlan
			? currentUser.subscription.scheduledPlan
			: currentUser?.subscription?.plan || 'home';
	const planDetails = getSubscriptionPlanDetails(effectivePlanId);
	const maxProperties = planDetails?.maxProperties ?? 1;
	const effectiveSubscription = currentUser?.subscription
		? { ...currentUser.subscription, plan: effectivePlanId }
		: undefined;
	const remainingSlots = effectiveSubscription
		? getRemainingPropertySlots(effectiveSubscription, totalProperties)
		: 0;
	const usagePercent = maxProperties > 0 ? (totalProperties / maxProperties) * 100 : 0;
	const hasPropertyCapacity = maxProperties > 0;
	const planUsageLabel = hasPropertyCapacity
		? `${totalProperties} of ${maxProperties}`
		: `${totalProperties}`;
	const planSlotLabel = !hasPropertyCapacity
		? 'Property creation is not included'
		: remainingSlots === 0 && totalProperties > maxProperties
			? `${totalProperties - maxProperties} over plan limit`
			: `${remainingSlots} property slot${remainingSlots === 1 ? '' : 's'} available`;
	const planSubtitle =
		currentUser?.subscription?.hasScheduledSubscription &&
			currentUser.subscription.scheduledPlan
			? `Scheduled plan: ${planDetails?.name || 'Home'}`
			: `Current plan: ${planDetails?.name || 'Home'}`;
	const storageUsagePercent = Math.min(100, storageUsage?.usagePercent || 0);
	const storageUsageLabel = isStorageUsageLoading
		? 'Loading storage...'
		: storageUsage && storageUsage.maxBytes > 0
			? `${formatStorageBytes(storageUsage.usedBytes)} of ${formatStorageBytes(
				storageUsage.maxBytes,
			)}`
			: 'Storage not included';
	const storageFileLabel = storageUsage
		? `${storageUsage.fileCount} of ${storageUsage.maxFiles} files`
		: '';

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
			label: 'Appliances',
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
			visible: !isUserTenant && !isHomeowner && canAccessTeam,
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

						{!isTeamMemberAccount && (
							<Section>
								<SectionContent $scrollable={false}>
									<PortfolioCard>
										<PortfolioTop>
											<PortfolioPlan>
												Property Plan
											</PortfolioPlan>
											<PortfolioUsageBadge>
												{planUsageLabel}
											</PortfolioUsageBadge>
										</PortfolioTop>
										<PortfolioPlanSub>
											{planSubtitle}
										</PortfolioPlanSub>
										<ProgressTrack>
											<ProgressFill $percent={Math.min(100, usagePercent)} />
										</ProgressTrack>
										<PortfolioUsage>
											{planSlotLabel}
										</PortfolioUsage>
										<PortfolioTop>
											<PortfolioPlanSub>
												Storage
											</PortfolioPlanSub>
											<PortfolioUsageBadge>
												{storageFileLabel || 'Files'}
											</PortfolioUsageBadge>
										</PortfolioTop>
										<ProgressTrack>
											<ProgressFill $percent={storageUsagePercent} />
										</ProgressTrack>
										<PortfolioUsage>
											{storageUsageLabel}
										</PortfolioUsage>
										<ManagePlanButton
											type='button'
											onClick={() => navigate('/paywall')}>
											Manage Plan
										</ManagePlanButton>
									</PortfolioCard>
								</SectionContent>
							</Section>
						)}
					</>
				)}
			</MenuSection>

			<BottomSections>
				{/* Features Section */}
				<Section>
					<SectionTitle>Help & Resources</SectionTitle>
					<SectionContent>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '8px 0',
								fontSize: '13px',
								color: activeRoute.startsWith('/support') ? '#16a34a' : '#666666',
								fontWeight: activeRoute.startsWith('/support') ? 700 : 400,
								cursor: 'pointer',
								transition: 'color 0.2s ease',
							}}
							onClick={() => navigate('/support')}
							onMouseEnter={(e) => (e.currentTarget.style.color = '#16a34a')}
							onMouseLeave={(e) =>
								(e.currentTarget.style.color =
									activeRoute.startsWith('/support') ? '#16a34a' : '#666666')
							}>
							<FontAwesomeIcon icon={faHeadset} size='sm' />
							<span>Support Center</span>
						</div>
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
