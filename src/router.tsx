import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ErrorPage } from './pages/ErrorPage';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <LandingPage />,
		errorElement: <ErrorPage />,
	},
]);
