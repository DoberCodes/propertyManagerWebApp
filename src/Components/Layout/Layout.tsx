import React from 'react';
import { SideNav, MobileNav, TopNav } from '../Library/Navbar';
import { Wrapper, Main, Sidebar, Content } from './Layout.styles';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
	return (
		<Wrapper>
			<TopNav />
			<Main>
				<Sidebar>
					<SideNav />
				</Sidebar>
				<Content>
					<Outlet />
				</Content>
			</Main>
			<MobileNav />
		</Wrapper>
	);
};
