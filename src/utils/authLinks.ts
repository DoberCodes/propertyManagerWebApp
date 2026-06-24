import { Browser } from '@capacitor/browser';
import { isNativeApp } from './platform';

const sanitizeBaseUrl = (raw: string): string => raw.replace(/\/+$/, '');

const isLocalOrInvalidPublicOrigin = (origin: string): boolean => {
	const normalized = origin.trim().toLowerCase();
	if (!normalized) return true;
	if (!/^https?:\/\//i.test(normalized)) return true;

	try {
		const { hostname } = new URL(normalized);
		return (
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname === '0.0.0.0' ||
			hostname === '[::1]'
		);
	} catch {
		return true;
	}
};

export const getPublicWebBaseUrl = (): string => {
	const configured = String(process.env.REACT_APP_PUBLIC_WEB_URL || '').trim();
	if (configured && !isLocalOrInvalidPublicOrigin(configured)) {
		return sanitizeBaseUrl(configured);
	}

	if (typeof window !== 'undefined') {
		const origin = String(window.location.origin || '').trim();
		if (!isLocalOrInvalidPublicOrigin(origin)) {
			return sanitizeBaseUrl(origin);
		}
	}

	const authDomain = String(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '').trim();
	if (authDomain) {
		const authDomainUrl = `https://${authDomain}`;
		if (!isLocalOrInvalidPublicOrigin(authDomainUrl)) {
			return authDomainUrl;
		}
	}

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
