import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../Redux/Store/store';
import { logout } from '../../../../Redux/Slices/userSlice';
import {
	NavItem,
	Title,
	Wrapper,
	LeftSection,
	RightSection,
	HamburgerButton,
	SidebarOverlay,
	MobileSidebar,
} from './TopNav.styles';
import { UserProfile } from './UserProfile';
import { useNavigate } from 'react-router-dom';
import { useRecentlyViewed } from '../../../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../../../Hooks/useFavorites';
import {
	canManageTeamMembers,
	canManageProperties,
	canViewAllPages,
	isTenant,
} from '../../../../utils/permissions';

export const TopNav = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const { recentProperties } = useRecentlyViewed(currentUser?.id);
	const { favorites } = useFavorites(currentUser?.id);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Check permissions for menu visibility
	const canAccessTeam = currentUser
		? canManageTeamMembers(currentUser.role)
		: false;
	const canAccessProperties = currentUser
		? canManageProperties(currentUser.role)
		: false;
	const canViewPages = currentUser ? canViewAllPages(currentUser.role) : false;
	const isUserTenant = currentUser ? isTenant(currentUser.role) : false;

	const navigationItems = [
		{ label: 'Dashboard', path: 'dashboard', visible: !isUserTenant },
		{
			label: 'Properties',
			path: 'properties',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
		{
			label: 'Team',
			path: 'team',
			visible: !isUserTenant && (canAccessTeam || canViewPages),
		},
		{
			label: 'Report',
			path: 'report',
			visible: !isUserTenant && (canAccessProperties || canViewPages),
		},
	];

	const handleLogout = () => {
		localStorage.removeItem('loggedUser');
		dispatch(logout());
		navigate('/');
	};

	return (
		<>
			<Wrapper>
				<LeftSection>
					<HamburgerButton
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						title='Open menu'>
						☰
					</HamburgerButton>
					<Title className='mobile-title'>My Property Manager</Title>
					{currentUser && (
						<div className='desktop-profile'>
							<UserProfile
								userName={`${currentUser.firstName} ${currentUser.lastName}`}
								userTitle={currentUser.title}
								userImage={currentUser.image}
							/>
						</div>
					)}
				</LeftSection>
				<RightSection>
					<Title className='desktop-title'>My Property Manager</Title>
					{currentUser && (
						<div className='mobile-profile'>
							<UserProfile
								userName={`${currentUser.firstName} ${currentUser.lastName}`}
								userTitle={currentUser.title}
								userImage={currentUser.image}
							/>
						</div>
					)}
					<NavItem to='/' onClick={handleLogout} className='desktop-logout'>
						Log Out
					</NavItem>
				</RightSection>
			</Wrapper>

			{/* Mobile Sidebar */}
			{isSidebarOpen && (
				<SidebarOverlay onClick={() => setIsSidebarOpen(false)} />
			)}
			<MobileSidebar isOpen={isSidebarOpen}>
				{' '}
				{/* Navigation Menu */}
				<div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
					<h3
						style={{
							margin: '0 0 12px 0',
							fontSize: '12px',
							fontWeight: '600',
							color: '#999999',
							textTransform: 'uppercase',
						}}>
						Navigation
					</h3>
					<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
						{navigationItems
							.filter((item) => item.visible)
							.map((item) => (
								<li
									key={item.label}
									style={{
										padding: '10px 0',
										fontSize: '14px',
										color: '#666666',
										cursor: 'pointer',
										transition: 'color 0.2s ease',
										borderBottom: '1px solid #f0f0f0',
									}}
									onClick={() => {
										navigate(`/${item.path}`);
										setIsSidebarOpen(false);
									}}
									onMouseEnter={(e) =>
										(e.currentTarget.style.color = '#22c55e')
									}
									onMouseLeave={(e) =>
										(e.currentTarget.style.color = '#666666')
									}>
									{item.label}
								</li>
							))}
					</ul>
				</div>
				{/* Favorites Section */}
				<div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
					<h3
						style={{
							margin: '0 0 12px 0',
							fontSize: '12px',
							fontWeight: '600',
							color: '#999999',
							textTransform: 'uppercase',
						}}>
						Favorites
					</h3>
					{favorites.length > 0 ? (
						<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
							{favorites.slice(0, 10).map((property) => (
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
									onClick={() => {
										navigate(`/property/${property.slug}`);
										setIsSidebarOpen(false);
									}}
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
				</div>
				{/* Recently Viewed Section */}
				<div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
					<h3
						style={{
							margin: '0 0 12px 0',
							fontSize: '12px',
							fontWeight: '600',
							color: '#999999',
							textTransform: 'uppercase',
						}}>
						Recently Viewed
					</h3>
					{recentProperties.length > 0 ? (
						<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
							{recentProperties.slice(0, 10).map((property) => (
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
									onClick={() => {
										navigate(`/property/${property.slug}`);
										setIsSidebarOpen(false);
									}}
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
				</div>
				{/* Logout Button - at the bottom */}
				<div style={{ padding: '20px' }}>
					<button
						onClick={() => {
							handleLogout();
							setIsSidebarOpen(false);
						}}
						style={{
							width: '100%',
							padding: '12px',
							backgroundColor: '#ef4444',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.backgroundColor = '#dc2626')
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.backgroundColor = '#ef4444')
						}>
						Log Out
					</button>
				</div>
			</MobileSidebar>
		</>
	);
};
