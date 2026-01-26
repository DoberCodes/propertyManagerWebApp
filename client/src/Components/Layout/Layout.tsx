import React from 'react';
import { SideNav, TopNav } from '../Library/Navbar';
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
		</Wrapper>
	);
};
