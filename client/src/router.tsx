import React from 'react';
import {
	Route,
	Routes,
	BrowserRouter as Router,
	Navigate,
} from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ErrorPage } from './pages/ErrorPage';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import { HomePage } from './pages/HomePage';
import { Layout } from './Components/Layout';
import { DashboardTab } from './Components/DashboardTab';
import { Properties } from './Components/PropertiesTab';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import TeamPage from './pages/TeamPage';
import { ReportPage } from './pages/ReportPage';

export const RouterComponent = () => {
	return (
		<Router>
			<Routes>
				{/* Public Routes */}
				<Route
					path='/'
					element={<LandingPage />}
					errorElement={<ErrorPage />}
				/>
				<Route path='login' element={<LoginPage />} />
				<Route path='registration' element={<RegistrationPage />} />

				{/* Protected Routes with Layout */}
				<Route
					element={
						<ProtectedRoutes>
							<Layout />
						</ProtectedRoutes>
					}>
					<Route path='/dashboard' element={<DashboardTab />} />
					<Route path='/manage' element={<Properties />} />
					<Route path='/property/:slug' element={<PropertyDetailPage />} />
					<Route path='/team' element={<TeamPage />} />
					<Route path='/report' element={<ReportPage />} />
					<Route path='/settings' element={<HomePage />} />
				</Route>

				{/* Fallback redirect */}
				<Route path='*' element={<Navigate to='/dashboard' replace />} />
			</Routes>
		</Router>
	);
};
