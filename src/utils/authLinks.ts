import { Browser } from '@capacitor/browser';
import { auth } from '../config/firebase';
import { STRIPE_CUSTOMER_PORTAL_URL } from '../constants/stripe';
import { isNativeApp } from './platform';

const sanitizeBaseUrl = (raw: string): string => raw.replace(/\/+$/, '');
const CANONICAL_PUBLIC_WEB_URL = 'https://maintleyapp.com';

const isFirebaseHostedDomain = (origin: string): boolean => {
	try {
		const { hostname } = new URL(origin.trim());
		return hostname.endsWith('.firebaseapp.com') || hostname.endsWith('.web.app');
	} catch {
		return false;
	}
};

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
	if (
		configured &&
		!isLocalOrInvalidPublicOrigin(configured) &&
		!isFirebaseHostedDomain(configured)
	) {
		return sanitizeBaseUrl(configured);
	}

	if (typeof window !== 'undefined') {
		const origin = String(window.location.origin || '').trim();
		if (!isLocalOrInvalidPublicOrigin(origin) && !isFirebaseHostedDomain(origin)) {
			return sanitizeBaseUrl(origin);
		}
	}

	// Final fallback for native app handoff if env vars are missing or stale.
	return CANONICAL_PUBLIC_WEB_URL;
};

export const getRegistrationUrl = (): string => `${getPublicWebBaseUrl()}/registration`;

export const getAccountManagementUrl = (): string =>
	`${getPublicWebBaseUrl()}/settings?category=account`;

export const getSubscriptionManagementUrl = (): string =>
	`${getPublicWebBaseUrl()}/${auth.currentUser ? 'paywall' : 'login'}`;

export const getCustomerBillingPortalUrl = (): string =>
	STRIPE_CUSTOMER_PORTAL_URL;

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

export const openCustomerBillingPortal = async (): Promise<void> => {
	const url = getCustomerBillingPortalUrl();
	if (isNativeApp()) {
		await Browser.open({ url });
		return;
	}

	if (typeof window !== 'undefined') {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
};
