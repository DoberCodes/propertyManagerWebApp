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
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import { FeatureDocsPage } from './pages/FeatureDocs/FeatureDocsPage';
import { HelpPage } from './pages/HelpPage';
import LegalPage from './pages/LegalPage/LegalPage';
import LegalDocumentPage from './pages/LegalPage/LegalDocumentPage';
import { Layout } from './pages/Layout';
import { DashboardTab } from './pages/DashboardTab';
import { TasksPage } from './pages/TasksPage/TasksPage';
import { Properties } from './Components/PropertiesTab';
import { PropertyDetailPage } from './pages/PropertyDetailPage/PropertyDetailPage';
// Units are temporarily hidden from the app flow; keep the page code for the later relaunch.
// import { UnitDetailPage } from './pages/UnitDetailPage';
// Suites are temporarily hidden from the app flow; keep the page code for the later relaunch.
// import { SuiteDetailPage } from './pages/SuiteDetailPage/SuiteDetailPage';
import { DeviceDetailPage } from './pages/DeviceDetailPage/DeviceDetailPage';
import TeamPage from './pages/TeamPage';
import { ReportPage } from './pages/ReportPage';
import { DevicesHubPage } from './pages/DevicesHubPage/DevicesHubPage';
import { UserProfile } from './pages/UserProfile';
import { TenantProfilePage } from './pages/TenantProfilePage';
import { AdminInboxPage } from './pages/AdminInboxPage/AdminInboxPage';
import { isNativeApp } from './utils/platform';
import { useSelector } from 'react-redux';
import { selectCanAccessTeam } from './Redux/selectors/permissionSelectors';
import PaywallPageIndex from './pages/PaywallPage';
import { MaintenanceHistoryGroupPage } from 'pages/MaintenanceHistoryGroup';
import { SettingsPage } from 'pages/SettingsPage';
import {
	SupportArticlePage,
	SupportArticlesPage,
	SupportPage,
} from 'pages/SupportPage';
import { USER_ROLES } from './constants/roles';
import { hasMaintleyAdminAccess } from './utils/maintleyRole';

// Component to handle root route - redirects to login in mobile app
const RootRoute = () => {
	if (isNativeApp()) {
		return <Navigate to='/login' replace />;
	}
	return <LandingPage />;
};

const MaintleyAdminRoute = () => {
	const currentUser = useSelector((state: any) => state.user.currentUser);
	const authLoading = useSelector((state: any) => state.user.authLoading);

	if (authLoading) return null;
	if (!currentUser) return <Navigate to='/login' replace />;
	if (!hasMaintleyAdminAccess(currentUser.maintley_role)) {
		return <Navigate to='/unauthorized' replace />;
	}

	return <AdminInboxPage />;
};

export const RouterComponent = () => {
	const currentUser = useSelector((state: any) => state.user.currentUser);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const shouldShowTeamRoute = !!currentUser && canAccessTeam;
	const fallbackPath =
		currentUser?.role === USER_ROLES.TENANT ? 'tenant-profile' : 'dashboard';
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
				<Route
					path='forgot-password'
					element={
						<ProtectedRoutes>
							<ForgotPasswordPage />
						</ProtectedRoutes>
					}
				/>
				<Route path='registration' element={<RegistrationPage />} />
				<Route path='register' element={<RegistrationPage />} />
				<Route path='admin' element={<MaintleyAdminRoute />} />
				<Route path='unauthorized' element={<UnauthorizedPage />} />
				{/* Paywall - accessible to authenticated users */}
				<Route
					path='paywall'
					element={
						<ProtectedRoutes>
							<PaywallPageIndex />
						</ProtectedRoutes>
					}
				/>
				{/* Feature Docs - public */}
				<Route path='docs' element={<FeatureDocsPage />} />
				<Route path='features' element={<FeatureDocsPage />} />
				<Route path='help' element={<HelpPage />} />
				{/* Legal Documents - public */}
				<Route path='legal' element={<LegalPage />} />
				<Route path='legal/:documentName' element={<LegalDocumentPage />} />

				{/* Protected Routes with Layout - Dashboard accessible to all authenticated users */}
				<Route
					element={
						<ProtectedRoutes>
							<Layout />
						</ProtectedRoutes>
					}>
					<Route path='dashboard' element={<DashboardTab />} />
					<Route path='tasks' element={<TasksPage />} />
					<Route path='devices' element={<DevicesHubPage />} />

					{/* Properties management - accessible to all authenticated users */}
					<Route
						path='properties'
						element={
							<ProtectedRoutes>
								<Properties />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug'
						element={
							<ProtectedRoutes>
								<PropertyDetailPage />
							</ProtectedRoutes>
						}
					/>
					{/* Units are temporarily hidden from the app flow.
					<Route
						path='property/:slug/unit/:unitName'
						element={
							<ProtectedRoutes>
								<UnitDetailPage />
							</ProtectedRoutes>
						}
					/>
					*/}
					{/* Suites are temporarily hidden from the app flow.
					<Route
						path='property/:slug/suite/:suiteName'
						element={
							<ProtectedRoutes>
								<SuiteDetailPage />
							</ProtectedRoutes>
						}
					/>
					*/}
					<Route
						path='property/:slug/device/:deviceSlug'
						element={
							<ProtectedRoutes>
								<DeviceDetailPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='property/:slug/maintenance-history/:groupId'
						element={
							<ProtectedRoutes>
								<MaintenanceHistoryGroupPage />
							</ProtectedRoutes>
						}
					/>
					{shouldShowTeamRoute && (
						<Route
							path='team'
							element={
								<ProtectedRoutes>
									<TeamPage />
								</ProtectedRoutes>
							}
						/>
					)}

					{/* Reports - accessible to admin, PM, AM, ML with active subscription OR expired users */}
					<Route
						path='report'
						element={
							<ProtectedRoutes
								requireSubscription={true}
								allowExpiredUsers={true}>
								<ReportPage />
							</ProtectedRoutes>
						}
					/>

					{/* Settings - accessible to all authenticated users */}
					<Route path='settings' element={<SettingsPage />} />
					<Route path='support' element={<SupportPage />} />
					<Route path='support/articles' element={<SupportArticlesPage />} />
					<Route
						path='support/articles/:articleSlug'
						element={<SupportArticlePage />}
					/>
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

					{/* Tenant Profile - accessible to tenant users */}
					<Route
						path='tenant-profile'
						element={
							<ProtectedRoutes>
								<TenantProfilePage />
							</ProtectedRoutes>
						}
					/>
				</Route>

				{/* Fallback redirect */}
				<Route path='*' element={<Navigate to={fallbackPath} replace />} />
			</Routes>
		</Router>
	);
};
