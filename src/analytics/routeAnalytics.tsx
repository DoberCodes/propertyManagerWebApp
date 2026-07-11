import { useEffect, useMemo } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../Redux/store/store';
import { trackAnalyticsEvent } from './analytics';

type RouteDefinition = {
	pattern: string;
	routeName: string;
	area: string;
};

const routeDefinitions: RouteDefinition[] = [
	{ pattern: '/', routeName: 'landing', area: 'public' },
	{ pattern: '/login', routeName: 'login', area: 'auth' },
	{ pattern: '/forgot-password', routeName: 'forgot_password', area: 'auth' },
	{ pattern: '/registration', routeName: 'registration', area: 'auth' },
	{ pattern: '/register', routeName: 'registration', area: 'auth' },
	{ pattern: '/admin', routeName: 'admin', area: 'admin' },
	{ pattern: '/unauthorized', routeName: 'unauthorized', area: 'auth' },
	{ pattern: '/subscription/*', routeName: 'subscription_legacy', area: 'billing' },
	{ pattern: '/paywall', routeName: 'paywall', area: 'billing' },
	{ pattern: '/docs', routeName: 'feature_docs', area: 'public' },
	{ pattern: '/features', routeName: 'features', area: 'public' },
	{ pattern: '/help', routeName: 'help', area: 'support' },
	{ pattern: '/legal', routeName: 'legal', area: 'legal' },
	{ pattern: '/legal/:documentName', routeName: 'legal_document', area: 'legal' },
	{ pattern: '/dashboard', routeName: 'dashboard', area: 'dashboard' },
	{ pattern: '/tasks', routeName: 'tasks', area: 'tasks' },
	{ pattern: '/devices', routeName: 'equipment', area: 'equipment' },
	{ pattern: '/properties', routeName: 'properties', area: 'properties' },
	{ pattern: '/property/:slug', routeName: 'property_detail', area: 'properties' },
	{
		pattern: '/property/:slug/device/:deviceSlug',
		routeName: 'equipment_detail',
		area: 'equipment',
	},
	{
		pattern: '/property/:slug/maintenance-history/:groupId',
		routeName: 'maintenance_history_group',
		area: 'maintenance_history',
	},
	{ pattern: '/team', routeName: 'team', area: 'team' },
	{ pattern: '/report', routeName: 'reports', area: 'reports' },
	{ pattern: '/settings', routeName: 'settings', area: 'settings' },
	{ pattern: '/support', routeName: 'support', area: 'support' },
	{ pattern: '/support/articles', routeName: 'support_articles', area: 'support' },
	{
		pattern: '/support/articles/:articleSlug',
		routeName: 'support_article',
		area: 'support',
	},
	{ pattern: '/profile', routeName: 'profile', area: 'account' },
	{ pattern: '/tenant-profile', routeName: 'tenant_profile', area: 'tenant' },
];

export const getRouteAnalyticsDefinition = (pathname: string): RouteDefinition => {
	const normalizedPathname = pathname === '' ? '/' : pathname;
	const matchedRoute = routeDefinitions.find((route) =>
		matchPath({ path: route.pattern, end: true }, normalizedPathname),
	);

	return (
		matchedRoute || {
			pattern: 'unknown',
			routeName: 'unknown',
			area: 'unknown',
		}
	);
};

export const AnalyticsRouteTracker = () => {
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const routeDefinition = useMemo(
		() => getRouteAnalyticsDefinition(location.pathname),
		[location.pathname],
	);
	const authState = currentUser ? 'signed_in' : 'signed_out';
	const userRole = currentUser?.role || 'anonymous';
	const isTeamMember = currentUser?.isTeamMemberAccount === true;

	useEffect(() => {
		void trackAnalyticsEvent('route_viewed', {
			route_name: routeDefinition.routeName,
			route_pattern: routeDefinition.pattern,
			route_area: routeDefinition.area,
			auth_state: authState,
			user_role: userRole,
			is_team_member: isTeamMember,
		});
	}, [authState, isTeamMember, routeDefinition, userRole]);

	return null;
};
