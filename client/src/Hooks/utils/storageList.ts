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
