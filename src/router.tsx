import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './pages/Unrestricted/LandingPage';
import { ErrorPage } from './pages/Unrestricted/ErrorPage';
import { LoginPage } from './pages/Unrestricted/LoginPage';
import { RegistrationPage } from './pages/Unrestricted/RegistrationPage';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <LandingPage />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/Login',
		element: <LoginPage />,
		errorElement: <ErrorPage />,
	},
	{
		path: '/Registration',
		element: <RegistrationPage />,
		errorElement: <ErrorPage />,
	},
]);
