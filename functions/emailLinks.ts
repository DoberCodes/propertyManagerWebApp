const DEFAULT_APP_ORIGIN = 'https://maintleyapp.com';

const normalizeOrigin = (value: unknown): string => {
	const raw = String(value || DEFAULT_APP_ORIGIN).trim() || DEFAULT_APP_ORIGIN;
	return raw.replace(/\/+$/, '');
};

export const getCanonicalAppOrigin = (): string =>
	normalizeOrigin(process.env.APP_URL);

export const buildAppRouteUrl = (
	route: string,
	origin = getCanonicalAppOrigin(),
): string => {
	const normalizedOrigin = normalizeOrigin(origin);
	const normalizedRoute = `/${String(route || '').trim().replace(/^\/?#?\/?/, '')}`;
	return process.env.APP_ROUTER_MODE === 'browser'
		? `${normalizedOrigin}${normalizedRoute}`
		: `${normalizedOrigin}/#${normalizedRoute}`;
};
