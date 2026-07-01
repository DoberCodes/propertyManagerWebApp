import React from 'react';
import { AppDispatch, RootState } from 'Redux/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserNotificationsQuery } from 'Redux/API/notificationSlice';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from 'services/authService';
import { logout } from 'Redux/Slices/userSlice';
import { clearAccountScopedClientState } from 'Redux/utils/clearAccountScopedClientState';
import { AvatarMenuWrapper, DropdownButton, DropdownItem, DropdownMenu, NotificationBadge, UserImage, UserInitials } from './AvatarMenu.styles';
import { COLORS } from '../../../../constants/colors';

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
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [imageFailed, setImageFailed] = React.useState(false);
	const profileImage = String(currentUser?.image || '').trim();
	const hasProfileImage = Boolean(profileImage) && !imageFailed;
	const displayName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'User';
	const initials =
		[
			currentUser?.firstName?.trim()?.[0],
			currentUser?.lastName?.trim()?.[0],
		]
			.filter(Boolean)
			.join('') ||
		String(currentUser?.email || 'U')
			.trim()
			[0] ||
		'U';

	React.useEffect(() => {
		setImageFailed(false);
	}, [profileImage]);


	const handleLogout = () => {
		void (async () => {
			try {
				await signOutUser();
				dispatch(logout());
				clearAccountScopedClientState(dispatch);
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
		<AvatarMenuWrapper
			role='button'
			tabIndex={0}
			aria-label='Open profile menu'
			onClick={() => {
				setIsProfileDropdownOpen(!isProfileDropdownOpen);
				if (isSidebarOpen) {
					setIsSidebarOpen(false);
				}
			}}
			onKeyDown={(event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return;
				event.preventDefault();
				setIsProfileDropdownOpen(!isProfileDropdownOpen);
				if (isSidebarOpen) {
					setIsSidebarOpen(false);
				}
			}}>
			{hasProfileImage ? (
				<UserImage
					src={profileImage}
					alt={displayName}
					onError={() => setImageFailed(true)}
				/>
			) : (
				<UserInitials aria-label={displayName}>{initials}</UserInitials>
			)}
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
								textDecorationColor: activeRoute === '/profile' ? COLORS.primary : 'transparent',
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = COLORS.bgLight)
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
								textDecorationColor: activeRoute === '/settings' ? COLORS.primary : 'transparent',
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.backgroundColor = COLORS.bgLight)
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
								(e.currentTarget.style.backgroundColor = COLORS.bgLight)
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
										background: COLORS.errorLight,
										color: COLORS.errorDark,
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
