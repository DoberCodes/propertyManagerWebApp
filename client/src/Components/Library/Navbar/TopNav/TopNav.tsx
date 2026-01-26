import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../Redux/Store/store';
import { logout } from '../../../../Redux/Slices/userSlice';
import {
	NavItem,
	Title,
	Wrapper,
	LeftSection,
	RightSection,
} from './TopNav.styles';
import { UserProfile } from './UserProfile';
import { useNavigate } from 'react-router-dom';

export const TopNav = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	console.log('TopNav: currentUser from Redux:', currentUser);

	const handleLogout = () => {
		localStorage.removeItem('loggedUser');
		dispatch(logout());
		navigate('/');
	};

	return (
		<Wrapper>
			<LeftSection>
				{currentUser && (
					<UserProfile
						userName={`${currentUser.firstName} ${currentUser.lastName}`}
						userTitle={currentUser.title}
						userImage={currentUser.image}
					/>
				)}
			</LeftSection>
			<RightSection>
				<Title>My Property Manager</Title>
				<NavItem to='/' onClick={handleLogout}>
					Log Out
				</NavItem>
			</RightSection>
		</Wrapper>
	);
};
