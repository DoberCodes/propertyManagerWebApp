import React from 'react';
import { Navigate } from 'react-router-dom';

import { LoadingState } from './Components/LoadingState';
// import { Flexbox } from './global.styles';
// import GlobalStyles from './global.styles';
// import { ThemeProvider } from 'styled-components';
// import { lightTheme, darkTheme } from './themes';

// export const ThemeContext = React.createContext(null);

export const ProtectedRoutes = ({ children }) => {
	// const [theme, setTheme] = useState('light');
	// const themeStyle = theme === 'light' ? lightTheme : darkTheme;
	const Authenticated = true;
	const isLoading = false;

	if (Authenticated) {
		// Authenticated: render children only. Layout and navigation are handled
		// by parent routes (e.g., Layout component using Outlet).
		return <>{children}</>;
	}
	if (isLoading) {
		return <LoadingState />;
	} else {
		return <Navigate to={'/login'} />;
	}
};
