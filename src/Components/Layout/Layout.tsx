import React from 'react';
import { SideNav, MobileNav, TopNav } from '../Library/Navbar';
import { DataLoader } from '../DataLoader';
import { Wrapper, Main, Sidebar, Content } from './Layout.styles';
import { Outlet } from 'react-router-dom';

export const Layout = () => {
	return (
		<Wrapper>
			<DataLoader />
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
