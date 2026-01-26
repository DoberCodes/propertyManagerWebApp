import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecentlyViewed } from '../../../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../../../Hooks/useFavorites';
import {
	Wrapper,
	MenuSection,
	SectionTitle,
	MenuNav,
	MenuItem,
	Section,
	SectionContent,
} from './SideNav.styles';

export const SideNav = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { recentProperties } = useRecentlyViewed();
	const { favorites } = useFavorites();

	const menuItems = [
		{ label: 'Dashboard', path: '/dashboard' },
		{ label: 'Properties', path: '/manage' },
		{ label: 'Team', path: '/team' },
		{ label: 'Report', path: '/report' },
	];

	const isActive = (path: string) => location.pathname === path;

	return (
		<Wrapper>
			{/* Menu Navigation Section */}
			<MenuSection>
				<SectionTitle>Navigation</SectionTitle>
				<MenuNav>
					{menuItems.map((item) => (
						<MenuItem
							key={item.label}
							to={item.path}
							className={isActive(item.path) ? 'active' : ''}>
							{item.label}
						</MenuItem>
					))}
				</MenuNav>
			</MenuSection>

			{/* Favorites Section */}
			<Section>
				<SectionTitle>Favorites</SectionTitle>
				<SectionContent>
					{favorites.length > 0 ? (
						<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
							{favorites.map((property) => (
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
									{'★ ' + property.title}
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

			{/* Recently Viewed Tasks Section - REMOVED */}

			{/* Recently Viewed Properties Section */}
			<Section>
				<SectionTitle>Recently Viewed Properties</SectionTitle>
				<SectionContent>
					{recentProperties.length > 0 ? (
						<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
							{recentProperties.map((property) => (
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
		</Wrapper>
	);
};
