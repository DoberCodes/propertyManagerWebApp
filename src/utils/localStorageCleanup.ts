const BASE_KEYS_TO_CLEAR = [
	'loggedUser',
	'savedEmail',
	'weatherData',
	'recentlyViewedProperties',
	'recentlyViewedTasks',
	'favoriteProperties',
	'app_version_check',
	'app_update_dismissed_version',
];

export const clearUserLocalStorage = (userId?: string | number) => {
	try {
		BASE_KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));

		if (userId !== undefined && userId !== null) {
			const userPrefix = `user_${userId}_`;
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i += 1) {
				const key = localStorage.key(i);
				if (key && key.startsWith(userPrefix)) {
					keysToRemove.push(key);
				}
			}
			keysToRemove.forEach((key) => localStorage.removeItem(key));
		}
	} catch (error) {
		console.error('Failed to clear local storage:', error);
	}
};
