/**
 * Determines the default temperature unit based on user's location
 * Uses Fahrenheit for US, Fahrenheit for Cayman Islands, Bahamas, Palau, and British Virgin Islands
 * Uses Celsius for all other locations
 */
export const getDefaultTempUnit = (
	latitude: number,
	longitude: number,
): 'C' | 'F' => {
	// US bounds (approximate): lat 24-50, lon -125--66
	// Includes US mainland and territories
	const isUS =
		latitude >= 24 && latitude <= 50 && longitude >= -125 && longitude <= -66;

	if (isUS) {
		return 'F';
	}

	// Cayman Islands (19.3, -81.2)
	const isCaymanIslands =
		latitude >= 19 && latitude <= 20 && longitude >= -82 && longitude <= -80;
	if (isCaymanIslands) {
		return 'F';
	}

	// Bahamas (25, -76)
	const isBahamas =
		latitude >= 20 && latitude <= 28 && longitude >= -85 && longitude <= -74;
	if (isBahamas) {
		return 'F';
	}

	// Palau (7.3, 134.5)
	const isPalau =
		latitude >= 6 && latitude <= 8 && longitude >= 133 && longitude <= 136;
	if (isPalau) {
		return 'F';
	}

	// British Virgin Islands (18.4, -64.5)
	const isBVI =
		latitude >= 18 && latitude <= 19 && longitude >= -65 && longitude <= -63;
	if (isBVI) {
		return 'F';
	}

	// Default to Celsius for everywhere else
	return 'C';
};
