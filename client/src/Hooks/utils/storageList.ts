export function updateList<T>(
	prev: T[],
	item: T,
	getId: (t: T) => number,
	maxItems: number,
): T[] {
	const filtered = prev.filter((p) => getId(p) !== getId(item));
	return [item, ...filtered].slice(0, maxItems);
}

export function loadList<T>(storageKey: string): T[] {
	const stored = localStorage.getItem(storageKey);
	if (!stored) return [];
	try {
		return JSON.parse(stored) as T[];
	} catch {
		return [];
	}
}

export function saveList<T>(storageKey: string, list: T[], eventName?: string) {
	localStorage.setItem(storageKey, JSON.stringify(list));
	if (eventName) {
		window.dispatchEvent(new Event(eventName));
	}
}

/**
 * Generate a user-specific storage key by prefixing with userId
 * This ensures each user has isolated local storage data
 * @param userId - The unique identifier of the user
 * @param keyName - The base storage key name
 * @returns The user-specific storage key
 */
export function getUserStorageKey(
	userId: string | number,
	keyName: string,
): string {
	return `user_${userId}_${keyName}`;
}

/**
 * Load list from user-specific storage
 * @param userId - The unique identifier of the user
 * @param storageKey - The base storage key name
 * @returns The parsed list or empty array
 */
export function loadUserList<T>(
	userId: string | number,
	storageKey: string,
): T[] {
	const userKey = getUserStorageKey(userId, storageKey);
	return loadList<T>(userKey);
}

/**
 * Save list to user-specific storage
 * @param userId - The unique identifier of the user
 * @param storageKey - The base storage key name
 * @param list - The list to save
 * @param eventName - Optional event name to dispatch after saving
 */
export function saveUserList<T>(
	userId: string | number,
	storageKey: string,
	list: T[],
	eventName?: string,
) {
	const userKey = getUserStorageKey(userId, storageKey);
	saveList<T>(userKey, list, eventName);
}
