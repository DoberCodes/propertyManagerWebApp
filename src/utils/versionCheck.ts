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
import { apiSlice } from '../Redux/API/apiSlice';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { store } from '../Redux/store';
import { CURRENT_APP_VERSION } from '../config/appVersion';

const STORAGE_KEY = 'app_version_check';
const DISMISS_KEY = 'app_update_dismissed_version';

export const GITHUB_RELEASE_REPOSITORY =
	'DoberFamilyVentures/propertyManagerWebApp';
export const getAPKReleaseAssetName = (version: string): string =>
	`maintley-${version}-release.apk`;
export const APK_RELEASE_ASSET_NAME = getAPKReleaseAssetName(CURRENT_APP_VERSION);

export const getGitHubReleaseApiUrl = (release: string): string =>
	`https://api.github.com/repos/${GITHUB_RELEASE_REPOSITORY}/releases/${release}`;

export const getVersionedAPKDownloadURL = (
	version: string,
	assetName = getAPKReleaseAssetName(version),
): string =>
	`https://github.com/${GITHUB_RELEASE_REPOSITORY}/releases/download/v${version}/${assetName}`;

export const getVersionedReleasePageURL = (version: string): string =>
	`https://github.com/${GITHUB_RELEASE_REPOSITORY}/releases/tag/v${version}`;

export const getLatestAPKDownloadURL = (): string => {
	const version = getAvailableVersion() || CURRENT_APP_VERSION;
	return getVersionedAPKDownloadURL(version);
};

interface VersionCheckData {
	lastChecked: number;
	availableVersion: string;
	apkUrl?: string;
	releaseUrl?: string;
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

const formatBytes = (bytes) => {
	var marker = 1024; // Change to 1000 if required
	var decimal = 3; // Change as required
	var kiloBytes = marker; // One Kilobyte is 1024 bytes
	var megaBytes = marker * marker; // One MB is 1024 KB
	var gigaBytes = marker * marker * marker; // One GB is 1024 MB

	// return bytes if less than a KB
	if (bytes < kiloBytes) return bytes + ' Bytes';
	// return KB if less than a MB
	else if (bytes < megaBytes)
		return (bytes / kiloBytes).toFixed(decimal) + ' KB';
	// return MB if less than a GB
	else if (bytes < gigaBytes)
		return (bytes / megaBytes).toFixed(decimal) + ' MB';
	// return GB if less than a TB
	else return (bytes / gigaBytes).toFixed(decimal) + ' GB';
};

export const getAPKFileSize = async () => {
	try {
		// Prefer GitHub Releases API to avoid CORS issues on asset URLs
		const releaseResponse = await fetch(getGitHubReleaseApiUrl('latest'), {
			cache: 'no-store',
		});
		if (releaseResponse.ok) {
			const release = await releaseResponse.json();
			const assets = release?.assets || [];
			const releaseVersion = String(release?.tag_name || '')
				.replace(/^v/, '') || CURRENT_APP_VERSION;
			const releaseAssetName = getAPKReleaseAssetName(releaseVersion);
			const apkAsset = assets.find(
				(asset) =>
					asset?.name === releaseAssetName ||
					asset?.label === releaseAssetName ||
					asset?.name === APK_RELEASE_ASSET_NAME ||
					asset?.label === APK_RELEASE_ASSET_NAME ||
					/^maintley-.+-release\.apk$/i.test(asset?.name || '') ||
					asset?.label === 'PropertyManager.apk',
			);
			if (apkAsset?.size) {
				return formatBytes(Number(apkAsset.size));
			}
		}
	} catch (error) {
		console.warn(
			'Release API request failed, falling back to download size:',
			error,
		);
	}

	try {
		const fallbackUrl = getLatestAPKDownloadURL();
		const fallbackResponse = await fetch(`${fallbackUrl}?t=${Date.now()}`, {
			method: 'HEAD',
			cache: 'no-store',
		});
		const fallbackLength = fallbackResponse.headers.get('content-length');
		if (fallbackLength) {
			return formatBytes(Number(fallbackLength));
		}
	} catch (error) {
		console.warn('Fallback HEAD request failed:', error);
	}

	return 'Unknown';
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

export const getPublishedAPKDownloadURL = (): string | null => {
	const url = String(getVersionCheckData()?.apkUrl || '').trim();
	return url || null;
};

export const getPublishedReleasePageURL = (): string | null => {
	const url = String(getVersionCheckData()?.releaseUrl || '').trim();
	return url || null;
};

/**
 * Set the available version (typically called from a backend API check)
 */
export const setAvailableVersion = (
	version: string,
	metadata: { apkUrl?: string; releaseUrl?: string } = {},
): void => {
	try {
		const data: VersionCheckData = {
			lastChecked: Date.now(),
			availableVersion: version,
			...(metadata.apkUrl ? { apkUrl: metadata.apkUrl } : {}),
			...(metadata.releaseUrl ? { releaseUrl: metadata.releaseUrl } : {}),
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

/**
 * Get the download URL for the APK
 */
export const getAPKDownloadURL = (): string => {
	const publishedUrl = getPublishedAPKDownloadURL();
	if (publishedUrl) {
		return publishedUrl;
	}

	const configuredUrl = process.env.REACT_APP_APK_URL;
	if (configuredUrl) {
		// Ignore legacy GitHub Pages URL to ensure we always check the release asset
		if (configuredUrl.includes('github.io')) {
			return getLatestAPKDownloadURL();
		}
		return configuredUrl;
	}
	return getLatestAPKDownloadURL();
};

export const getUpdateReleasePageURL = (): string => {
	const publishedUrl = getPublishedReleasePageURL();
	if (publishedUrl) {
		return publishedUrl;
	}

	const version = getAvailableVersion() || CURRENT_APP_VERSION;
	return getVersionedReleasePageURL(version);
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
		link.download = getAPKReleaseAssetName(
			getAvailableVersion() || CURRENT_APP_VERSION,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
};

export const openUpdateReleasePage = async (): Promise<void> => {
	const url = getUpdateReleasePageURL();

	if (Capacitor.isNativePlatform()) {
		await Browser.open({ url });
		return;
	}

	window.open(url, '_blank', 'noopener,noreferrer');
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
				setAvailableVersion(latestVersion, {
					apkUrl: result.data.apkUrl,
					releaseUrl: result.data.releaseUrl,
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
