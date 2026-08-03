"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppRouteUrl = exports.getCanonicalAppOrigin = void 0;
const DEFAULT_APP_ORIGIN = 'https://maintleyapp.com';
const normalizeOrigin = (value) => {
    const raw = String(value || DEFAULT_APP_ORIGIN).trim() || DEFAULT_APP_ORIGIN;
    return raw.replace(/\/+$/, '');
};
const getCanonicalAppOrigin = () => normalizeOrigin(process.env.APP_URL);
exports.getCanonicalAppOrigin = getCanonicalAppOrigin;
const buildAppRouteUrl = (route, origin = (0, exports.getCanonicalAppOrigin)()) => {
    const normalizedOrigin = normalizeOrigin(origin);
    const normalizedRoute = `/${String(route || '').trim().replace(/^\/?#?\/?/, '')}`;
    return `${normalizedOrigin}${normalizedRoute}`;
};
exports.buildAppRouteUrl = buildAppRouteUrl;
