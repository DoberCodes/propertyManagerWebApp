import { Browser } from '@capacitor/browser';
import { isNativeApp } from './platform';

const sanitizeBaseUrl = (raw: string): string => raw.replace(/\/+$/, '');

export const getPublicWebBaseUrl = (): string => {
	const configured = String(process.env.REACT_APP_PUBLIC_WEB_URL || '').trim();
	if (configured) return sanitizeBaseUrl(configured);

	if (typeof window !== 'undefined') {
		const origin = String(window.location.origin || '').trim();
		if (/^https?:\/\//i.test(origin)) {
			return sanitizeBaseUrl(origin);
		}
	}

	const authDomain = String(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '').trim();
	if (authDomain) return `https://${authDomain}`;

	// Final fallback for native app handoff if env vars are missing.
	return 'https://maintley.com';
};

export const getRegistrationUrl = (): string => `${getPublicWebBaseUrl()}/#/registration`;

export const getAccountManagementUrl = (): string =>
	`${getPublicWebBaseUrl()}/#/settings?category=account`;

export const getSubscriptionManagementUrl = (): string =>
	getAccountManagementUrl();

export const openRegistrationInBrowser = async (): Promise<void> => {
	const url = getRegistrationUrl();
	if (isNativeApp()) {
		await Browser.open({ url });
		return;
	}

	if (typeof window !== 'undefined') {
		window.location.href = url;
	}
};

export const openSubscriptionManagementInBrowser = async (): Promise<void> => {
	const url = getSubscriptionManagementUrl();
	if (isNativeApp()) {
		await Browser.open({ url });
		return;
	}

	if (typeof window !== 'undefined') {
		window.location.href = url;
	}
};
