import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a native mobile app (via Capacitor)
 * @returns true if running on iOS or Android via Capacitor
 */
export const isNativeApp = (): boolean => {
	return Capacitor.isNativePlatform();
};

/**
 * Check if running in a web browser
 * @returns true if running in a web browser
 */
export const isWebPlatform = (): boolean => {
	return !Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 * @returns 'ios' | 'android' | 'web'
 */
export const getPlatform = (): string => {
	return Capacitor.getPlatform();
};
