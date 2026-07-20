/**
 * Version Check Utility
 *
 * This utility helps manage app version checking and update notifications.
 * The current app version should match the version in package.json.
 *
 * Usage:
 * - Check if an update is available: shouldShowUpdateNotification()
 * - Dismiss notification: dismissUpdateNotification()
 * - Open Android update listing: openGooglePlayUpdate()
 */
import { apiSlice } from '../Redux/API/apiSlice';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { store } from '../Redux/store';
import { CURRENT_APP_VERSION } from '../config/appVersion';

const STORAGE_KEY = 'app_version_check';
const DISMISS_KEY = 'app_update_dismissed_version';
const DEFAULT_GOOGLE_PLAY_STORE_URL =
	'https://play.google.com/store/apps/details?id=com.maintleyapp';

interface VersionCheckData {
	lastChecked: number;
	availableVersion: string;
	playStoreUrl?: string;
}

const getVersionCheckData = (): VersionCheckData | null => {
	try {
		const versionCheck = localStorage.getItem(STORAGE_KEY);
		if (!versionCheck) return null;
		return JSON.parse(versionCheck) as VersionCheckData;
	} catch (error) {
		console.error('Error reading app version metadata:', error);
		return null;
	}
};

/**
 * Check if update notification should be displayed
 * Returns true if there's a newer version available and hasn't been dismissed
 * Dismissal is version-specific, so new versions will still show a notification
 */
export const shouldShowUpdateNotification = (): boolean => {
	try {
		const data = getVersionCheckData();
		const dismissedVersion = localStorage.getItem(DISMISS_KEY);

		if (data) {
			// Check if version is newer
			if (
				data.availableVersion &&
				compareVersions(data.availableVersion, CURRENT_APP_VERSION) > 0
			) {
				// If a version was dismissed, only show notification if available version is newer than dismissed version
				if (dismissedVersion) {
					return compareVersions(data.availableVersion, dismissedVersion) > 0;
				}
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('Error checking app version:', error);
		return false;
	}
};

/**
 * Get the available version from storage
 */
export const getAvailableVersion = (): string | null => {
	const data = getVersionCheckData();
	return data?.availableVersion || null;
};

export const getGooglePlayStoreURL = (): string => {
	const publishedUrl = String(getVersionCheckData()?.playStoreUrl || '').trim();
	if (publishedUrl) {
		return publishedUrl;
	}

	return (
		process.env.REACT_APP_PLAY_STORE_URL?.trim() || DEFAULT_GOOGLE_PLAY_STORE_URL
	);
};

/**
 * Set the available version (typically called from a backend API check)
 */
export const setAvailableVersion = (
	version: string,
	metadata: { playStoreUrl?: string } = {},
): void => {
	try {
		const data: VersionCheckData = {
			lastChecked: Date.now(),
			availableVersion: version,
			...(metadata.playStoreUrl ? { playStoreUrl: metadata.playStoreUrl } : {}),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error setting available version:', error);
	}
};

/**
 * Dismiss the update notification for the current available version
 * New versions will still show a notification
 */
export const dismissUpdateNotification = (): void => {
	try {
		const versionCheck = localStorage.getItem(STORAGE_KEY);
		if (versionCheck) {
			const data: VersionCheckData = JSON.parse(versionCheck);
			// Store the dismissed version, not just a boolean
			// This allows newer versions to still show notifications
			localStorage.setItem(DISMISS_KEY, data.availableVersion);
		}
	} catch (error) {
		console.error('Error dismissing update notification:', error);
		localStorage.setItem(DISMISS_KEY, getCurrentAppVersion());
	}
};

/**
 * Reset dismissal so notification shows again
 */
export const resetUpdateNotification = (): void => {
	localStorage.removeItem(DISMISS_KEY);
};

export const getUpdateDestinationURL = (): string => getGooglePlayStoreURL();

export const openGooglePlayUpdate = async (): Promise<void> => {
	const url = getUpdateDestinationURL();

	if (Capacitor.isNativePlatform()) {
		await Browser.open({ url });
		return;
	}

	window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Compare two semantic versions
 * Returns:
 *  1 if version1 > version2
 *  -1 if version1 < version2
 *  0 if they're equal
 */
export const compareVersions = (version1: string, version2: string): number => {
	const v1parts = version1.split('.').map(Number);
	const v2parts = version2.split('.').map(Number);

	for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
		const v1 = v1parts[i] || 0;
		const v2 = v2parts[i] || 0;

		if (v1 > v2) return 1;
		if (v1 < v2) return -1;
	}

	return 0;
};

/**
 * Get current app version
 */
export const getCurrentAppVersion = (): string => {
	return CURRENT_APP_VERSION;
};

/**
 * Check for updates from server (can be called periodically)
 * Fetches the latest version from Firebase and checks if update is available
 */
export const checkForUpdates = async (): Promise<boolean> => {
	try {
		// Dispatch the API call to check for latest version
		const result = await store.dispatch(
			apiSlice.endpoints.getAppVersion.initiate(),
		);

		if (result.data && result.data.version) {
			const latestVersion = result.data.version;
			const isNewer = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

			if (isNewer) {
				setAvailableVersion(latestVersion, {
					playStoreUrl: result.data.playStoreUrl,
				});
				resetUpdateNotification();
			}

			return shouldShowUpdateNotification();
		}

		return false;
	} catch (error) {
		console.error('Error checking for updates:', error);
		return false;
	}
};
