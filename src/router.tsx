import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { LandingPage } from './pages/Unrestricted/LandingPage';
import { ErrorPage } from './pages/Unrestricted/ErrorPage';
import { LoginPage } from './pages/Unrestricted/LoginPage';
import { RegistrationPage } from './pages/Unrestricted/RegistrationPage';
import { HomePage } from './pages/Restricted/HomePage';
import { Properties } from './pages/Restricted/Properties';
import { ProtectedRoutes } from './ProtectedRoutes';

export const RouterComponent = () => {
	return (
		<Router>
			<Routes>
				<Route
					path='/'
					element={<LandingPage />}
					errorElement={<ErrorPage />}
				/>
				<Route path='login' element={<LoginPage />} />
				<Route path='registration' element={<RegistrationPage />} />
				<Route path='/property_manager' element={<ProtectedRoutes />}>
					<Route path='dashboard' element={<HomePage />} />
					<Route path='properties' element={<Properties />} />
				</Route>
			</Routes>
		</Router>
	);
};
