import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoordinates {
	latitude: number;
	longitude: number;
}

/**
 * Request location permissions if on a native platform
 * Returns true if permissions granted or not needed (web)
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
	// On web, permissions are handled by the browser
	if (!Capacitor.isNativePlatform()) {
		return true;
	}

	try {
		// Check current permission status
		const status = await Geolocation.checkPermissions();

		if (status.location === 'granted' || status.location === 'denied') {
			return status.location === 'granted';
		}

		// Request permissions if not yet determined
		const requested = await Geolocation.requestPermissions();
		return requested.location === 'granted';
	} catch (error) {
		console.warn('Failed to request location permissions:', error);
		return false;
	}
};

/**
 * Get the user's current location
 * Requests permissions if needed on native platforms
 */
export const getCurrentLocation =
	async (): Promise<LocationCoordinates | null> => {
		try {
			// Request permissions first if on native platform
			if (Capacitor.isNativePlatform()) {
				const hasPermission = await requestLocationPermissions();
				if (!hasPermission) {
					console.warn('Location permissions not granted');
					return null;
				}
			}

			// Get current position
			const position = await Geolocation.getCurrentPosition({
				enableHighAccuracy: false,
				timeout: 10000,
			});

			return {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			};
		} catch (error) {
			console.warn('Failed to get current location:', error);
			return null;
		}
	};

/**
 * Watch the user's location for changes
 * Requests permissions if needed on native platforms
 * Returns a watch ID that can be used to clear the watch
 */
export const watchLocation = async (
	callback: (location: LocationCoordinates) => void,
	errorCallback?: (error: any) => void,
): Promise<string | null> => {
	try {
		// Request permissions first if on native platform
		if (Capacitor.isNativePlatform()) {
			const hasPermission = await requestLocationPermissions();
			if (!hasPermission) {
				console.warn('Location permissions not granted');
				return null;
			}
		}

		// Watch position
		const watchId = await Geolocation.watchPosition(
			{
				enableHighAccuracy: false,
				timeout: 10000,
			},
			(position, err) => {
				if (err) {
					errorCallback?.(err);
					return;
				}
				if (position) {
					callback({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					});
				}
			},
		);

		return watchId;
	} catch (error) {
		console.warn('Failed to watch location:', error);
		errorCallback?.(error);
		return null;
	}
};

/**
 * Clear a location watch
 */
export const clearLocationWatch = async (watchId: string): Promise<void> => {
	try {
		await Geolocation.clearWatch({ id: watchId });
	} catch (error) {
		console.warn('Failed to clear location watch:', error);
	}
};
