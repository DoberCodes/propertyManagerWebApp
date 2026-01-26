import React from 'react';
import {
	NavItem,
	Title,
	Wrapper,
	LeftSection,
	RightSection,
} from './TopNav.styles';
import { UserProfile } from './UserProfile';
import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
// import { setTabSelection } from '../../../../Redux/Slices/Nav/navigationSlice';

export const TopNav = () => {
	const navigate = useNavigate();
	// const dispatch = useDispatch();
	const handleLogout = () => {
		localStorage.removeItem('loggedUser');
		navigate('/');
	};
	// const handleTabSelection = (tab: number) => {
	// 	dispatch(setTabSelection(tab));
	// };
	return (
		<Wrapper>
			<LeftSection>
				<UserProfile userName='John Doe' userTitle='Administrator' />
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
