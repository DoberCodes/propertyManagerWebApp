import React from 'react';
import {
	Route,
	Routes,
	BrowserRouter as Router,
	Navigate,
} from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ErrorPage } from './pages/ErrorPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import { HomePage } from './pages/HomePage';
import { Layout } from './Components/Layout';
import { DashboardTab } from './Components/DashboardTab';
import { Properties } from './Components/PropertiesTab';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { UnitDetailPage } from './pages/UnitDetailPage';
import { SuiteDetailPage } from './pages/SuiteDetailPage/SuiteDetailPage';
import TeamPage from './pages/TeamPage';
import { ReportPage } from './pages/ReportPage';
import {
	PROPERTY_MANAGEMENT_ROLES,
	TEAM_MANAGEMENT_ROLES,
	TEAM_VIEW_ROLES,
	FULL_ACCESS_ROLES,
} from './constants/roles';

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
				<Route path='unauthorized' element={<UnauthorizedPage />} />

				{/* Protected Routes with Layout - Dashboard accessible to all authenticated users */}
				<Route
					element={
						<ProtectedRoutes>
							<Layout />
						</ProtectedRoutes>
					}>
					<Route path='/dashboard' element={<DashboardTab />} />

					{/* Properties management - accessible to admin, PM, AM, ML */}
					<Route
						path='/manage'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<Properties />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='/property/:slug'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<PropertyDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='/property/:slug/unit/:unitName'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<UnitDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='/property/:slug/suite/:suiteName'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<SuiteDetailPage />
							</ProtectedRoutes>
						}
					/>

					{/* Team management - viewable by managers and maintenance; editable by admin/PM only */}
					<Route
						path='/team'
						element={
							<ProtectedRoutes requiredRoles={TEAM_VIEW_ROLES}>
								<TeamPage />
							</ProtectedRoutes>
						}
					/>

					{/* Reports - accessible to admin, PM, AM, ML */}
					<Route
						path='/report'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<ReportPage />
							</ProtectedRoutes>
						}
					/>

					{/* Settings - accessible to all authenticated users */}
					<Route path='/settings' element={<HomePage />} />
				</Route>

				{/* Fallback redirect */}
				<Route path='*' element={<Navigate to='/dashboard' replace />} />
			</Routes>
		</Router>
	);
};
