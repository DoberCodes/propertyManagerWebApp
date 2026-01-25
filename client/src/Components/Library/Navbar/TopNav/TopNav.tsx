import React from 'react';
import {
	NavItem,
	NavItemWrapper,
	Title,
	Navbar,
	Wrapper,
} from './TopNav.styles';
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
			<Title>My Property Manager</Title>
			<NavItemWrapper>
				<Navbar>
					<NavItem to='/Settings'>Profile Settings</NavItem>
					<NavItem to='/Manage'>Manage Household</NavItem>
					<NavItem to='/' onClick={handleLogout}>
						Log Out
					</NavItem>
				</Navbar>
			</NavItemWrapper>
		</Wrapper>
	);
};
