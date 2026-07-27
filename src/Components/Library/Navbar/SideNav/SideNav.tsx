import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store/store';
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
	BottomSections,
	AppVersionFooter,
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
	faHeadset,
	faIdCard,
	faMicrochip,
	faTachometerAlt,
	faTasks,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
	getEffectiveSubscriptionPlanId,
	getSubscriptionPlanDetails,
} from '../../../../utils/subscriptionUtils';
import { TODAY_PAGE_LABEL } from '../../../../constants/navigation';
import { COLORS } from '../../../../constants/colors';
import { CURRENT_APP_VERSION } from '../../../../config/appVersion';

export const SideNav = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);
	const { favorites, removeFavorite } = useFavorites(currentUser!.id);

	// Permission flags (use selectors so logic is centralized)
	const isUserTenant = useSelector(selectIsTenant);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	const isContractor = useSelector(selectIsContractor);
	const canViewPages = useSelector(selectCanAccessProperties); // Restored variable

	const isActive = (path: string) => activeRoute === path;

	const effectivePlanId = getEffectiveSubscriptionPlanId(
		currentUser?.subscription,
		'homeowner',
	);
	const planDetails = getSubscriptionPlanDetails(effectivePlanId);
	const maxProperties = planDetails?.maxProperties ?? 1;
	const isSingleHomePlan = isHomeowner && maxProperties <= 1;
	const propertyNavLabel = isSingleHomePlan
		? 'Home'
		: isHomeowner
			? 'Homes'
			: 'Property Records';
	const emptyFavoritesLabel = isHomeowner
		? `No favorite ${isSingleHomePlan ? 'home' : 'homes'}`
		: 'No favorite property records';

	// Desktop nav items
	const desktopMenuItems = [
		{
			label: TODAY_PAGE_LABEL,
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
			label: 'Equipment',
			path: '/devices',
			icon: faMicrochip,
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: propertyNavLabel,
			path: '/properties',
			icon: faHome,
			visible: isUserTenant || canAccessProperties || canViewPages,
		},
		{
			label: 'Team',
			path: '/team',
			icon: faUsers,
			visible: !isUserTenant && canAccessTeam,
		},
		{
			label: 'Reports',
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
									<div style={{ fontSize: '12px', color: COLORS.textMuted }}>
										{emptyFavoritesLabel}
									</div>
								)}
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
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '8px 0',
								fontSize: '13px',
								color: activeRoute.startsWith('/support') ? COLORS.primary : COLORS.textSecondary,
								fontWeight: activeRoute.startsWith('/support') ? 700 : 400,
								cursor: 'pointer',
								transition: 'color 0.2s ease',
							}}
							onClick={() => navigate('/support')}
							onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
							onMouseLeave={(e) =>
							(e.currentTarget.style.color =
								activeRoute.startsWith('/support') ? COLORS.primary : COLORS.textSecondary)
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
									color: COLORS.textSecondary,
									cursor: 'pointer',
									transition: 'color 0.2s ease',
								}}
								onClick={() => navigate('/features')}
								onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
								onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textSecondary)}>
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
								color: COLORS.textSecondary,
								cursor: 'pointer',
								transition: 'color 0.2s ease',
							}}
							onClick={() => navigate('/settings')}
							onMouseEnter={(e) =>
								(e.currentTarget.style.color = COLORS.textMuted)
							} /* Lighter gray on hover */
							onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textSecondary)}>
							<FontAwesomeIcon icon={faCog} size='lg' />
							<div style={{ marginLeft: '4px' }}>Settings</div>
						</div>
					</SectionContent>
				</Section>
			</BottomSections>
			<AppVersionFooter>Maintley v{CURRENT_APP_VERSION}</AppVersionFooter>
		</DesktopWrapper>
	);
};
