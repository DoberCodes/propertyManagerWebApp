import React from 'react';
import { RootState } from 'Redux/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserNotificationsQuery } from 'Redux/API/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from 'services/authService';
import { logout } from 'Redux/Slices/userSlice';
import { apiSlice } from 'Redux/API/apiSlice';
import { AvatarMenuWrapper, DropdownButton, DropdownItem, DropdownMenu, NotificationBadge, UserImage } from './AvatarMenu.styles';

interface AvatarMenuProps {
	setIsNotificationModalOpen: (open: boolean) => void;
	activeRoute?: string;
	isSidebarOpen: boolean;
	setIsSidebarOpen: (open: boolean) => void;
	isProfileDropdownOpen: boolean;
	setIsProfileDropdownOpen: (open: boolean) => void;
}

export const AvatarMenu: React.FC<AvatarMenuProps> = ({ setIsNotificationModalOpen, activeRoute, isSidebarOpen, setIsSidebarOpen, isProfileDropdownOpen, setIsProfileDropdownOpen }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);


	const handleLogout = () => {
		void (async () => {
			try {
				await signOutUser();
				dispatch(logout());
				// Reset RTK Query cache to prevent stale data for next user
				dispatch(apiSlice.util.resetApiState());
				navigate('/');
			} catch (error) {
				console.error('Logout failed:', error);
			}
		})();
	};


	// Get notifications to check for unread ones
	const { data: notifications = [] } = useGetUserNotificationsQuery(
		currentUser?.id,
		{
			skip: !currentUser?.id,
		},
	);

	// Check if there are any unread notifications
	const hasUnreadNotifications = notifications.some(
		(notification) => notification.status === 'unread',
	);

	// Count unread notifications
	const unreadCount = notifications.filter(
		(notification) => notification.status === 'unread',
	).length;


	return (
		<AvatarMenuWrapper onClick={() => {
			setIsProfileDropdownOpen(!isProfileDropdownOpen)
			if (isSidebarOpen) {
				setIsSidebarOpen(false);
			}
		}}>

			<UserImage
				src={currentUser?.image || 'https://via.placeholder.com/40'}
				alt={`${currentUser?.firstName} ${currentUser?.lastName}`}
			/>
			{hasUnreadNotifications && unreadCount > 0 && (
				<NotificationBadge>
					{unreadCount > 99 ? '99+' : unreadCount}
				</NotificationBadge>
			)}
			{
				isProfileDropdownOpen && (
					<DropdownMenu>
						<DropdownItem to='/profile'
							style={{
								textDecoration: activeRoute === '/profile' ? 'underline' : 'none',
								textUnderlineOffset: '4px',
								textDecorationThickness: '2px',
								textDecorationColor: activeRoute === '/profile' ? '#22c55e' : 'transparent',
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = '#f3f4f6')
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor = 'transparent')
							}>
							View Profile
						</DropdownItem>
						<DropdownItem to='/settings'
							style={{
								textDecoration: activeRoute === '/settings' ? 'underline' : 'none',
								textUnderlineOffset: '4px',
								textDecorationThickness: '2px',
								textDecorationColor: activeRoute === '/settings' ? '#22c55e' : 'transparent',
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = '#f3f4f6')
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor = 'transparent')
							}>
							Settings
						</DropdownItem>
						<DropdownButton
							onClick={() => {
								if (setIsNotificationModalOpen) {
									setIsNotificationModalOpen(true);
								}
								setIsProfileDropdownOpen(false);
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = '#f3f4f6')
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.backgroundColor = 'transparent')
							}>
							<span>Notifications</span>
							{unreadCount > 0 && (
								<span
									style={{
										minWidth: '24px',
										height: '20px',
										padding: '0 8px',
										borderRadius: '999px',
										background: '#fee2e2',
										color: '#b91c1c',
										fontSize: '12px',
										fontWeight: 700,
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										marginLeft: '8px',
										whiteSpace: 'nowrap',
									}}>
									{unreadCount > 99 ? '99+' : unreadCount}
								</span>
							)}
						</DropdownButton>
						<DropdownButton
							onClick={() => {
								handleLogout();
								setIsProfileDropdownOpen(false);
							}}
						>
							Log Out
						</DropdownButton>
					</DropdownMenu>
				)
			}
		</AvatarMenuWrapper >
	);
};
