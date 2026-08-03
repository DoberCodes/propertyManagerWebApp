import type { Analytics } from 'firebase/analytics';
import app from '../config/firebase';
import {
	ANALYTICS_EVENT_PARAM_ALLOWLIST,
	isAnalyticsActionSource,
	type AnalyticsEventName,
} from './analyticsContract';

export type { AnalyticsActionSource, AnalyticsEventName } from './analyticsContract';
export { getAnalyticsErrorCode } from './analyticsContract';

export type AnalyticsParamValue = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

const isPlaceholderValue = (value: string) =>
	[/^YOUR_/i, /^REPLACE_/i, /^TODO$/i, /^changeme$/i].some((pattern) =>
		pattern.test(value.trim()),
	);

const analyticsEnabled =
	process.env.NODE_ENV !== 'test' &&
	process.env.REACT_APP_ENABLE_ANALYTICS === 'true' &&
	Boolean(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim()) &&
	!isPlaceholderValue(process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || '');

const analyticsDebug = process.env.REACT_APP_ANALYTICS_DEBUG === 'true';

let analyticsPromise: Promise<Analytics | null> | null = null;

export const isAnalyticsEnabled = () => analyticsEnabled;

const getAnalyticsInstance = async (): Promise<Analytics | null> => {
	if (!analyticsEnabled || typeof window === 'undefined') {
		return null;
	}

	if (!analyticsPromise) {
		analyticsPromise = import('firebase/analytics')
			.then(async ({
				initializeAnalytics,
				isSupported,
				setAnalyticsCollectionEnabled,
			}) => {
				const supported = await isSupported();
				if (!supported) return null;

				const analytics = initializeAnalytics(app, {
					config: { send_page_view: false },
				});
				setAnalyticsCollectionEnabled(analytics, true);
				return analytics;
			})
			.catch((error) => {
				if (analyticsDebug) {
					console.warn('Maintley analytics unavailable:', error);
				}
				return null;
			});
	}

	return analyticsPromise;
};

export const sanitizeAnalyticsParams = (
	params: AnalyticsParams = {},
): Record<string, string | number | boolean> => {
	return Object.entries(params).reduce<Record<string, string | number | boolean>>(
		(cleaned, [key, value]) => {
			if (value === undefined || value === null) return cleaned;

			if (typeof value === 'string') {
				const trimmed = value.trim();
				if (!trimmed) return cleaned;
				cleaned[key] = trimmed.slice(0, 100);
				return cleaned;
			}

			if (typeof value === 'number') {
				if (Number.isFinite(value)) cleaned[key] = value;
				return cleaned;
			}

			if (typeof value === 'boolean') {
				cleaned[key] = value;
			}

			return cleaned;
		},
		{},
	);
};

export const sanitizeAnalyticsEventParams = (
	eventName: AnalyticsEventName,
	params: AnalyticsParams = {},
): Record<string, string | number | boolean> => {
	const allowedKeys = new Set(ANALYTICS_EVENT_PARAM_ALLOWLIST[eventName]);
	const allowedParams = Object.fromEntries(
		Object.entries(params).filter(
			([key, value]) =>
				allowedKeys.has(key) &&
				(key !== 'action_source' || isAnalyticsActionSource(value)),
		),
	);
	return sanitizeAnalyticsParams({
		app_area: 'maintley',
		...allowedParams,
	});
};

export const trackAnalyticsEvent = async (
	eventName: AnalyticsEventName,
	params?: AnalyticsParams,
) => {
	const cleanedParams = sanitizeAnalyticsEventParams(eventName, params);

	if (analyticsDebug) {
		console.info('[analytics]', eventName, cleanedParams);
	}

	const analytics = await getAnalyticsInstance();
	if (!analytics) return;

	try {
		const { logEvent } = await import('firebase/analytics');
		logEvent(analytics, eventName, cleanedParams);
	} catch (error) {
		if (analyticsDebug) {
			console.warn('Maintley analytics event failed:', error);
		}
	}
};

export const configureAnalyticsIdentity = async ({
	userId,
	roleFamily,
	planFamily,
}: {
	userId: string | null;
	roleFamily: string;
	planFamily: string;
}) => {
	const analytics = await getAnalyticsInstance();
	if (!analytics) return;

	try {
		const { setUserId, setUserProperties } = await import('firebase/analytics');
		setUserId(analytics, userId);
		setUserProperties(analytics, {
			role_family: roleFamily,
			plan_family: planFamily,
		});
	} catch (error) {
		if (analyticsDebug) {
			console.warn('Maintley analytics identity unavailable:', error);
		}
	}
};
