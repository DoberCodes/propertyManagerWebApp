import React from 'react';
import { NavItem, NavItemWrapper, Title, Wrapper } from './SideNav.styles';

export const SideNav = () => {
	return (
		<Wrapper>
			<Title>My Property Manager</Title>
			<NavItemWrapper>
				<NavItem to='/Settings'>Profile Settings</NavItem>
				<NavItem to='/Manage'>Manage Household</NavItem>
				<NavItem to='/'>Log Out</NavItem>
			</NavItemWrapper>
		</Wrapper>
	);
};
