/**
 * Version Check Utility
 *
 * This utility helps manage app version checking and update notifications.
 * The current app version should match the version in package.json.
 *
 * Usage:
 * - Check if an update is available: shouldShowUpdateNotification()
 * - Dismiss notification: dismissUpdateNotification()
 * - Trigger download: downloadAPK()
 */

import { store } from '../Redux/Store/store';
import { apiSlice } from '../Redux/API/apiSlice';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const CURRENT_APP_VERSION = '1.0.2'; // Should match package.json version
const STORAGE_KEY = 'app_version_check';
const DISMISS_KEY = 'app_update_dismissed';

interface VersionCheckData {
	lastChecked: number;
	availableVersion: string;
}

/**
 * Check if update notification should be displayed
 * Returns true if there's a newer version available and hasn't been dismissed
 */
export const shouldShowUpdateNotification = (): boolean => {
	try {
		const versionCheck = localStorage.getItem(STORAGE_KEY);
		const dismissed = localStorage.getItem(DISMISS_KEY);

		if (dismissed === 'true') {
			return false;
		}

		if (versionCheck) {
			const data: VersionCheckData = JSON.parse(versionCheck);
			// Check if version is newer
			if (
				data.availableVersion &&
				compareVersions(data.availableVersion, CURRENT_APP_VERSION) > 0
			) {
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
	try {
		const versionCheck = localStorage.getItem(STORAGE_KEY);
		if (versionCheck) {
			const data: VersionCheckData = JSON.parse(versionCheck);
			return data.availableVersion || null;
		}
		return null;
	} catch (error) {
		console.error('Error getting available version:', error);
		return null;
	}
};

/**
 * Set the available version (typically called from a backend API check)
 */
export const setAvailableVersion = (version: string): void => {
	try {
		const data: VersionCheckData = {
			lastChecked: Date.now(),
			availableVersion: version,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error setting available version:', error);
	}
};

/**
 * Dismiss the update notification for this session
 */
export const dismissUpdateNotification = (): void => {
	localStorage.setItem(DISMISS_KEY, 'true');
};

/**
 * Reset dismissal so notification shows again
 */
export const resetUpdateNotification = (): void => {
	localStorage.removeItem(DISMISS_KEY);
};

/**
 * Get the download URL for the APK
 */
export const getAPKDownloadURL = (): string => {
	return `${window.location.origin}/PropertyManager.apk`;
};

/**
 * Trigger APK download
 */
export const downloadAPK = async (): Promise<void> => {
	const url = getAPKDownloadURL();

	// On mobile, open in external browser for better download support
	if (Capacitor.isNativePlatform()) {
		await Browser.open({ url });
	} else {
		// On web, trigger direct download
		const link = document.createElement('a');
		link.href = url;
		link.download = 'PropertyManager.apk';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
};

/**
 * Open APK download in new tab
 */
export const openAPKDownload = (): void => {
	window.open(getAPKDownloadURL(), '_blank');
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
				setAvailableVersion(latestVersion);
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
