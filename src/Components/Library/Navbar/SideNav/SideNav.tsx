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
	Section,
	SectionContent,
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
import { faCog } from '@fortawesome/free-solid-svg-icons';

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

	// Desktop nav items
	const desktopMenuItems = [
		{ label: 'Dashboard', path: '/dashboard', visible: !isUserTenant },
		{
			label: 'Tasks',
			path: '/tasks',
			visible: !isUserTenant && !isContractor,
		},
		{
			label: 'Properties',
			path: '/properties',
			visible: isUserTenant || canAccessProperties || canViewPages,
		},
		{
			label: 'Team',
			path: '/team',
			visible: !isUserTenant && !isHomeowner && (canAccessTeam || canViewPages),
		},
		{
			label: 'Report',
			path: '/report',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Tenant Profile',
			path: '/tenant-profile',
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
									{item.label}
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
									<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
										{favorites.slice(0, 5).map((property) => (
											<li
												key={property.id}
												style={{
													padding: '8px 0',
													fontSize: '13px',
													color: '#666666',
													cursor: 'pointer',
													transition: 'color 0.2s ease',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: '8px',
													borderBottom: '1px solid #f0f0f0',
												}}
												onClick={() => navigate(`/property/${property.slug}`)}
												onMouseEnter={(e) =>
													(e.currentTarget.style.color = '#22c55e')
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.color = '#666666')
												}>
												<span
													style={{
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														flex: 1,
													}}
													title={property.title}>
													{'★ ' + property.title}
												</span>
												<button
													type='button'
													onClick={(e) => {
														e.stopPropagation();
														void removeFavorite(property.id);
													}}
													title={`Remove ${property.title} from favorites`}
													aria-label={`Remove ${property.title} from favorites`}
													style={{
														border: 'none',
														background: 'transparent',
														color: '#9ca3af',
														cursor: 'pointer',
														fontSize: '14px',
														padding: '2px 4px',
														lineHeight: 1,
														borderRadius: '4px',
													}}>
													×
												</button>
											</li>
										))}
									</ul>
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
									<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
										{recentProperties.slice(0, 5).map((property) => (
											<li
												key={property.id}
												style={{
													padding: '8px 0',
													fontSize: '13px',
													color: '#666666',
													cursor: 'pointer',
													transition: 'color 0.2s ease',
													borderBottom: '1px solid #f0f0f0',
												}}
												onClick={() => navigate(`/property/${property.slug}`)}
												onMouseEnter={(e) =>
													(e.currentTarget.style.color = '#22c55e')
												}
												onMouseLeave={(e) =>
													(e.currentTarget.style.color = '#666666')
												}>
												{property.title}
											</li>
										))}
									</ul>
								) : (
									<div style={{ fontSize: '12px', color: '#999999' }}>
										No recently viewed properties
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
						{!isUserTenant && (
							<div
								style={{
									padding: '8px 0',
									fontSize: '13px',
									color: '#666666',
									cursor: 'pointer',
									transition: 'color 0.2s ease',
								}}
								onClick={() => navigate('/features')}
								onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
								onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}>
								📋 View All Features
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
