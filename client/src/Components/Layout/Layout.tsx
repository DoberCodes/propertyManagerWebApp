import React from 'react';
import { SideNav } from '../Library/Navbar/SideNav';
import { Wrapper } from './Layout.styles';
import { TopNav } from '../Library/Navbar';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
	return (
		<Wrapper>
			<TopNav />
			<SideNav />

			<Outlet />
		</Wrapper>
	);
};
