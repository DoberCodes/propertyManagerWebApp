import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './pages/Unrestricted/LandingPage';
import { ErrorPage } from './pages/Unrestricted/ErrorPage';
import { LoginPage } from './pages/Unrestricted/LoginPage';
import { RegistrationPage } from './pages/Unrestricted/RegistrationPage';
import { HomePage } from './pages/Restricted/HomePage';
// import { ProtectedRoutes } from './ProtectedRoutes';

export const routes = [
	{
		path: '/',
		element: <LandingPage />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/Login',
		element: <LoginPage />,
	},
	{
		path: '/Registration',
		element: <RegistrationPage />,
	},
	{
		path: '/Home',
		element: <HomePage />,
	},
];

export const router = createBrowserRouter(routes);
