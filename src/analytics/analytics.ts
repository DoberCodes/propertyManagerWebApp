import type { Analytics } from 'firebase/analytics';
import app from '../config/firebase';

export type AnalyticsParamValue = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

export type AnalyticsEventName =
	| 'route_viewed'
	| 'property_created'
	| 'equipment_created'
	| 'task_created'
	| 'task_completed'
	| 'maintenance_history_added'
	| 'property_setup_proposal_viewed'
	| 'property_setup_proposal_dismissed'
	| 'property_setup_plan_confirmed'
	| 'property_setup_plan_activated'
	| 'property_scan_completed'
	| 'report_downloaded';

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

export const trackAnalyticsEvent = async (
	eventName: AnalyticsEventName,
	params?: AnalyticsParams,
) => {
	const cleanedParams = sanitizeAnalyticsParams({
		app_area: 'maintley',
		...params,
	});

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
