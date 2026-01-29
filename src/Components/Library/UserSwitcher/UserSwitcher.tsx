import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../Redux/Store/store';
import { switchMockUser, MOCK_USERS } from '../../../Redux/Slices/userSlice';
import { getRoleDisplayName, getRoleColor } from '../../../utils/permissions';
import {
	Container,
	Header,
	Title,
	CurrentUserInfo,
	UserAvatar,
	UserDetails,
	UserName,
	UserRole,
	RoleBadge,
	Divider,
	UserList,
	UserCard,
	UserCardAvatar,
	UserCardInfo,
	UserCardName,
	UserCardRole,
	SwitchButton,
} from './UserSwitcher.styles';

export const UserSwitcher: React.FC = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const handleSwitchUser = (userId: string) => {
		dispatch(switchMockUser(userId));
	};

	if (!currentUser) {
		return null;
	}

	return (
		<Container>
			<Header>
				<Title>🔄 Test User Switcher</Title>
			</Header>

			<CurrentUserInfo>
				<UserAvatar src={currentUser.image} alt={currentUser.firstName} />
				<UserDetails>
					<UserName>
						{currentUser.firstName} {currentUser.lastName}
					</UserName>
					<UserRole>{currentUser.title}</UserRole>
					<RoleBadge color={getRoleColor(currentUser.role)}>
						{getRoleDisplayName(currentUser.role)}
					</RoleBadge>
				</UserDetails>
			</CurrentUserInfo>

			<Divider />

			<p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
				Switch to a different user to test role-based permissions:
			</p>

			<UserList>
				{MOCK_USERS.map((user) => (
					<UserCard key={user.id} isActive={currentUser.id === user.id}>
						<UserCardAvatar src={user.image} alt={user.firstName} />
						<UserCardInfo>
							<UserCardName>
								{user.firstName} {user.lastName}
							</UserCardName>
							<UserCardRole color={getRoleColor(user.role)}>
								{getRoleDisplayName(user.role)}
							</UserCardRole>
						</UserCardInfo>
						{currentUser.id !== user.id && (
							<SwitchButton onClick={() => handleSwitchUser(user.id)}>
								Switch
							</SwitchButton>
						)}
						{currentUser.id === user.id && (
							<span style={{ color: '#27ae60', fontWeight: 600 }}>Active</span>
						)}
					</UserCard>
				))}
			</UserList>

			<p
				style={{
					fontSize: '0.85rem',
					color: '#999',
					marginTop: '1.5rem',
					fontStyle: 'italic',
				}}>
				Note: This is a development tool for testing. It will be removed in
				production.
			</p>
		</Container>
	);
};
