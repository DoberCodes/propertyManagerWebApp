import React from 'react';
import {
	BottomNav,
	NavItem,
	NavItemWrapper,
	Title,
	TopNav,
	Wrapper,
} from './Navbar.styles';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
	const navigate = useNavigate();
	const handleLogout = () => {
		localStorage.removeItem('loggedUser');
		navigate('/');
	};
	return (
		<Wrapper>
			<Title>My Property Manager</Title>
			<NavItemWrapper>
				<TopNav>
					<NavItem to='/Settings'>Profile Settings</NavItem>
					<NavItem to='/Manage'>Manage Household</NavItem>
					<NavItem to='/' onClick={handleLogout}>
						Log Out
					</NavItem>
				</TopNav>
				<BottomNav>
					<NavItem to='/dashboard'>Dashboard</NavItem>
					<NavItem to='/Properties'>Properties</NavItem>
					<NavItem to='/Facts'>FAQs</NavItem>
				</BottomNav>
			</NavItemWrapper>
		</Wrapper>
	);
};
