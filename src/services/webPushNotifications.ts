import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging';
import app from '../config/firebase';

export type BrowserPushPermission = NotificationPermission | 'unsupported';

export interface BrowserPushStatus {
	supported: boolean;
	permission: BrowserPushPermission;
	hasVapidKey: boolean;
}

export interface BrowserPushTokenRecord {
	token: string;
	provider: 'fcm';
	platform: 'web';
	deviceLabel: string;
	userAgent: string;
	createdAt: string;
	updatedAt: string;
	lastSeenAt: string;
}

const SERVICE_WORKER_URL = '/service-worker.js';

const getVapidKey = () =>
	String(process.env.REACT_APP_FIREBASE_WEB_PUSH_VAPID_KEY || '').trim();

const getDeviceLabel = () => {
	const userAgent = window.navigator.userAgent;
	if (/iphone|ipad|ipod/i.test(userAgent)) {
		return 'Safari on iOS';
	}
	if (/edg\//i.test(userAgent)) {
		return 'Microsoft Edge';
	}
	if (/chrome|crios/i.test(userAgent)) {
		return 'Chrome';
	}
	if (/firefox|fxios/i.test(userAgent)) {
		return 'Firefox';
	}
	if (/safari/i.test(userAgent)) {
		return 'Safari';
	}
	return 'This browser';
};

export const getBrowserPushStatus = async (): Promise<BrowserPushStatus> => {
	const hasVapidKey = Boolean(getVapidKey());
	if (
		typeof window === 'undefined' ||
		!('Notification' in window) ||
		!('serviceWorker' in navigator) ||
		!('PushManager' in window) ||
		!(await isSupported())
	) {
		return {
			supported: false,
			permission: 'unsupported',
			hasVapidKey,
		};
	}

	return {
		supported: true,
		permission: Notification.permission,
		hasVapidKey,
	};
};

const getMaintleyServiceWorkerRegistration = async () => {
	const existingRegistration =
		(await navigator.serviceWorker.getRegistration('/')) ||
		(await navigator.serviceWorker.register(SERVICE_WORKER_URL));

	await navigator.serviceWorker.ready;
	return existingRegistration;
};

export const enableBrowserPushNotifications =
	async (): Promise<BrowserPushTokenRecord> => {
		const status = await getBrowserPushStatus();
		if (!status.supported) {
			throw new Error('Browser notifications are not supported here.');
		}
		if (!status.hasVapidKey) {
			throw new Error('Browser notifications are not configured for this build.');
		}

		const permission =
			Notification.permission === 'granted'
				? 'granted'
				: await Notification.requestPermission();
		if (permission !== 'granted') {
			throw new Error('Browser notifications were not enabled.');
		}

		const registration = await getMaintleyServiceWorkerRegistration();
		const messaging = getMessaging(app);
		const token = await getToken(messaging, {
			vapidKey: getVapidKey(),
			serviceWorkerRegistration: registration,
		});

		if (!token) {
			throw new Error('Maintley could not register this browser for notifications.');
		}

		const now = new Date().toISOString();
		return {
			token,
			provider: 'fcm',
			platform: 'web',
			deviceLabel: getDeviceLabel(),
			userAgent: window.navigator.userAgent,
			createdAt: now,
			updatedAt: now,
			lastSeenAt: now,
		};
	};

export const getCurrentBrowserPushToken = async (): Promise<string | null> => {
	const status = await getBrowserPushStatus();
	if (!status.supported || !status.hasVapidKey || Notification.permission !== 'granted') {
		return null;
	}

	const registration = await getMaintleyServiceWorkerRegistration();
	const messaging = getMessaging(app);
	return getToken(messaging, {
		vapidKey: getVapidKey(),
		serviceWorkerRegistration: registration,
	});
};

export const disableBrowserPushNotifications = async () => {
	const supported = await getBrowserPushStatus();
	if (!supported.supported) {
		return;
	}

	const messaging = getMessaging(app);
	await deleteToken(messaging);
};

export const mergeBrowserPushTokenRecord = (
	existingTokens: unknown,
	nextTokenRecord: BrowserPushTokenRecord,
): BrowserPushTokenRecord[] => {
	const tokens = Array.isArray(existingTokens)
		? (existingTokens as BrowserPushTokenRecord[])
		: [];
	const previous = tokens.find((token) => token.token === nextTokenRecord.token);

	return [
		...tokens.filter((token) => token.token !== nextTokenRecord.token),
		{
			...nextTokenRecord,
			createdAt: previous?.createdAt || nextTokenRecord.createdAt,
		},
	];
};

export const removeBrowserPushTokenRecord = (
	existingTokens: unknown,
	tokenToRemove: string,
): BrowserPushTokenRecord[] => {
	const tokens = Array.isArray(existingTokens)
		? (existingTokens as BrowserPushTokenRecord[])
		: [];

	return tokens.filter((token) => token.token !== tokenToRemove);
};

export const countEnabledBrowserPushTokens = (existingTokens: unknown) => {
	if (!Array.isArray(existingTokens)) {
		return 0;
	}

	return existingTokens.filter(
		(token) =>
			token &&
			typeof token === 'object' &&
			(token as BrowserPushTokenRecord).platform === 'web' &&
			(token as BrowserPushTokenRecord).provider === 'fcm' &&
			(token as { disabled?: boolean }).disabled !== true,
	).length;
};
