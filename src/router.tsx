import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './pages/Unrestricted/LandingPage';
import { ErrorPage } from './pages/Unrestricted/ErrorPage';
import { LoginPage } from './pages/Unrestricted/LoginPage';

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
]);
