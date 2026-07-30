import React, { Suspense } from 'react';
import {
	Route,
	Routes,
	HashRouter as Router,
	Navigate,
} from 'react-router-dom';
import { ErrorPage } from './pages/ErrorPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoutes } from './ProtectedRoutes';
import { isNativeApp } from './utils/platform';
import { useSelector } from 'react-redux';
import { selectCanAccessTeam } from './Redux/selectors/permissionSelectors';
import type { RootState } from './Redux/store/store';
import { hasMaintleyAdminAccess } from './utils/maintleyRole';
import { SplashScreen } from './Components/Library/SplashScreen';
import { AnalyticsRouteTracker } from './analytics/routeAnalytics';
import { getFallbackRoute } from './routing/fallbackRoute';

const lazyNamed = <TModule, TKey extends keyof TModule>(
	importer: () => Promise<TModule>,
	exportName: TKey,
) =>
	React.lazy(async () => {
		const module = await importer();
		return {
			default: module[exportName] as React.ComponentType,
		};
	});

const LandingPage = lazyNamed(
	() => import('./pages/LandingPage'),
	'LandingPage',
);
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage');
const ForgotPasswordPage = lazyNamed(
	() => import('./pages/ForgotPasswordPage/ForgotPasswordPage'),
	'ForgotPasswordPage',
);
const RegistrationPage = lazyNamed(
	() => import('./pages/RegistrationPage'),
	'RegistrationPage',
);
const FeatureDocsPage = lazyNamed(
	() => import('./pages/FeatureDocs/FeatureDocsPage'),
	'FeatureDocsPage',
);
const HelpPage = lazyNamed(() => import('./pages/HelpPage'), 'HelpPage');
const LegalPage = React.lazy(() => import('./pages/LegalPage/LegalPage'));
const LegalDocumentPage = React.lazy(
	() => import('./pages/LegalPage/LegalDocumentPage'),
);
const Layout = lazyNamed(() => import('./pages/Layout'), 'Layout');
const DashboardTab = lazyNamed(
	() => import('./pages/DashboardTab'),
	'DashboardTab',
);
const TasksPage = lazyNamed(
	() => import('./pages/TasksPage/TasksPage'),
	'TasksPage',
);
const MaintenanceProfilePage = lazyNamed(
	() => import('./pages/MaintenanceProfilePage'),
	'MaintenanceProfilePage',
);
const Properties = lazyNamed(
	() => import('./Components/PropertiesTab/PropertiesTab'),
	'Properties',
);
const PropertyDetailPage = lazyNamed(
	() => import('./pages/PropertyDetailPage/PropertyDetailPage'),
	'PropertyDetailPage',
);
const DeviceDetailPage = lazyNamed(
	() => import('./pages/DeviceDetailPage/DeviceDetailPage'),
	'DeviceDetailPage',
);
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const ReportPage = lazyNamed(() => import('./pages/ReportPage'), 'ReportPage');
const DevicesHubPage = lazyNamed(
	() => import('./pages/DevicesHubPage/DevicesHubPage'),
	'DevicesHubPage',
);
const UserProfile = lazyNamed(() => import('./pages/UserProfile'), 'UserProfile');
const TenantProfilePage = lazyNamed(
	() => import('./pages/TenantProfilePage'),
	'TenantProfilePage',
);
const AdminInboxPage = lazyNamed(
	() => import('./pages/AdminInboxPage/AdminInboxPage'),
	'AdminInboxPage',
);
const PaywallPageIndex = React.lazy(() => import('./pages/PaywallPage'));
const CheckoutCompletionPage = lazyNamed(
	() => import('./pages/CheckoutCompletionPage/CheckoutCompletionPage'),
	'CheckoutCompletionPage',
);
const CheckoutStartPage = lazyNamed(
	() => import('./pages/CheckoutStartPage/CheckoutStartPage'),
	'CheckoutStartPage',
);
const MaintenanceHistoryGroupPage = lazyNamed(
	() => import('pages/MaintenanceHistoryGroup'),
	'MaintenanceHistoryGroupPage',
);
const SettingsPage = lazyNamed(
	() => import('pages/SettingsPage'),
	'SettingsPage',
);
const SupportPage = lazyNamed(() => import('pages/SupportPage'), 'SupportPage');
const SupportArticlesPage = lazyNamed(
	() => import('pages/SupportPage'),
	'SupportArticlesPage',
);
const SupportArticlePage = lazyNamed(
	() => import('pages/SupportPage'),
	'SupportArticlePage',
);

const RouteLoadingState = () => {
	return (
		<SplashScreen
			title='Opening Maintley'
			message='Preparing this workspace.'
			steps={[
				'Preparing your dashboard...',
				'Loading your properties...',
				'Checking upcoming maintenance...',
				'Organizing your home information...',
				'Almost ready...',
			]}
		/>
	);
};

// Component to handle root route - redirects to login in mobile app
const RootRoute = () => {
	if (isNativeApp()) {
		return <Navigate to='/login' replace />;
	}
	return <LandingPage />;
};

const MaintleyAdminRoute = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const authLoading = useSelector((state: RootState) => state.user.authLoading);

	if (authLoading) return null;
	if (!currentUser) return <Navigate to='/login' replace />;
	if (!hasMaintleyAdminAccess(currentUser.maintley_role)) {
		return <Navigate to='/unauthorized' replace />;
	}

	return <AdminInboxPage />;
};

const LegacySubscriptionRoute = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const authLoading = useSelector((state: RootState) => state.user.authLoading);

	if (authLoading) return null;
	return (
		<Navigate
			to={currentUser ? '/settings?category=account' : '/login'}
			replace
		/>
	);
};

export const RouterComponent = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const canAccessTeam = useSelector(selectCanAccessTeam);
	const shouldShowTeamRoute = !!currentUser && canAccessTeam;
	const fallbackPath = getFallbackRoute(currentUser?.role);
	return (
		<Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
			<AnalyticsRouteTracker />
			<Suspense fallback={<RouteLoadingState />}>
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
					<Route path='admin/*' element={<MaintleyAdminRoute />} />
					<Route path='unauthorized' element={<UnauthorizedPage />} />
					<Route path='subscription/*' element={<LegacySubscriptionRoute />} />
					{/* Paywall - accessible to authenticated users */}
					<Route
						path='paywall'
						element={
							<ProtectedRoutes>
								<PaywallPageIndex />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='checkout/start'
						element={
							<ProtectedRoutes>
								<CheckoutStartPage />
							</ProtectedRoutes>
						}
					/>
					<Route
						path='checkout/complete'
						element={
							<ProtectedRoutes>
								<CheckoutCompletionPage />
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
						<Route path='tasks/:taskId' element={<MaintenanceProfilePage />} />
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
			</Suspense>
		</Router>
	);
};
