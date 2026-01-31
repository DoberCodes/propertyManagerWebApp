import React from 'react';
import {
	Route,
	Routes,
	HashRouter as Router,
	Navigate,
} from 'react-router-dom';
import { ErrorPage } from './pages/ErrorPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import SettingsPage from './pages/SettingsPage';
import { FeatureDocsPage } from './pages/FeatureDocsPage';
import { Layout } from './pages/Layout';
import { DashboardTab } from './pages/DashboardTab';
import { Properties } from './Components/PropertiesTab';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { UnitDetailPage } from './pages/UnitDetailPage';
import { SuiteDetailPage } from './pages/SuiteDetailPage/SuiteDetailPage';
import TeamPage from './pages/TeamPage';
import { ReportPage } from './pages/ReportPage';
import { UserProfile } from './pages/UserProfile';
import { TEAM_VIEW_ROLES, FULL_ACCESS_ROLES } from './constants/roles';
import { isNativeApp } from './utils/platform';
import HomeownerPropertyWrapper from './Components/PropertiesTab/HomeownerPropertyWrapper';
import { useSelector } from 'react-redux';

// Component to handle root route - redirects to login in mobile app
const RootRoute = () => {
	if (isNativeApp()) {
		return <Navigate to='/login' replace />;
	}
	return <LandingPage />;
};

export const RouterComponent = () => {
	const userType = useSelector(
		(state: any) =>
			state.user.currentUser?.userType || state.user.currentUser?.role,
	);
	return (
		<Router>
			<Routes>
				{/* Public Routes */}
				<Route path='/' element={<RootRoute />} errorElement={<ErrorPage />} />
				<Route
					path='login'
					element={
						<ProtectedRoutes>
							<LoginPage />
						</ProtectedRoutes>
					}
				/>
				<Route path='registration' element={<RegistrationPage />} />
				<Route path='unauthorized' element={<UnauthorizedPage />} />
				{/* Feature Docs - public */}
				<Route path='docs' element={<FeatureDocsPage />} />
				<Route path='features' element={<FeatureDocsPage />} />

				{/* Protected Routes with Layout - Dashboard accessible to all authenticated users */}
				<Route
					element={
						<ProtectedRoutes>
							<Layout />
						</ProtectedRoutes>
					}>
					<Route path='dashboard' element={<DashboardTab />} />

					{/* Properties management - accessible to admin, PM, AM, ML */}
					{userType === 'homeowner' ? (
						<Route path='properties' element={<HomeownerPropertyWrapper />} />
					) : (
						<Route
							path='properties'
							element={
								<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
									<Properties />
								</ProtectedRoutes>
							}
						/>
					)}
					<Route
						path='property/:slug'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<PropertyDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug/unit/:unitName'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<UnitDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug/suite/:suiteName'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<SuiteDetailPage />
							</ProtectedRoutes>
						}
					/>
					{userType !== 'homeowner' && (
						<Route
							path='team'
							element={
								<ProtectedRoutes requiredRoles={TEAM_VIEW_ROLES}>
									<TeamPage />
								</ProtectedRoutes>
							}
						/>
					)}

					{/* Reports - accessible to admin, PM, AM, ML */}
					<Route
						path='report'
						element={
							<ProtectedRoutes requiredRoles={FULL_ACCESS_ROLES}>
								<ReportPage />
							</ProtectedRoutes>
						}
					/>

					{/* Settings - accessible to all authenticated users */}
					<Route path='settings' element={<SettingsPage />} />
					<Route path='features' element={<FeatureDocsPage />} />

					{/* User Profile - accessible to all authenticated users */}
					<Route
						path='profile'
						element={
							<ProtectedRoutes>
								<UserProfile />
							</ProtectedRoutes>
						}
					/>
				</Route>

				{/* Fallback redirect */}
				<Route path='*' element={<Navigate to='dashboard' replace />} />
			</Routes>
		</Router>
	);
};
