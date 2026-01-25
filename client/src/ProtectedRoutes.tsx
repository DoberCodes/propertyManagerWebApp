import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { LoadingState } from './Components/LoadingState';
import { TopNav } from './Components/Library/Navbar/TopNav';
import { SideNav } from './Components/Library/Navbar/SideNav';
import { Flexbox } from './global.styles';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './themes';

export const ThemeContext = React.createContext(null);

export const ProtectedRoutes = ({ children }) => {
	const [theme, setTheme] = useState('light');
	const themeStyle = theme === 'light' ? lightTheme : darkTheme;
	const Authenticated = true;
	const isLoading = false;

	if (Authenticated) {
		return (
			<ThemeProvider theme={themeStyle}>
				<Flexbox span={'3'}>
					<TopNav />
				</Flexbox>
				<Flexbox span={'1'}>
					<SideNav />
					{children}
				</Flexbox>
			</ThemeProvider>
		);
	}
	if (isLoading) {
		return <LoadingState />;
	} else {
		return <Navigate to={'/login'} />;
	}
};
