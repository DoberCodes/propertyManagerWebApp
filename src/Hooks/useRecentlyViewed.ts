import { useState, useEffect } from 'react';
import { getUserStorageKey } from './utils/storageList';

interface RecentlyViewedProperty {
	id: string;
	title: string;
	slug: string;
	timestamp: number;
}

const STORAGE_KEY = 'recentlyViewedProperties';
const RECENTS_UPDATED_EVENT = 'recently-viewed-updated';
const MAX_ITEMS = 5;

export const useRecentlyViewed = (userId?: string | number) => {
	const [recentProperties, setRecentProperties] = useState<
		RecentlyViewedProperty[]
	>([]);

	// Load from localStorage on mount and when notified
	useEffect(() => {
		const load = () => {
			const storageKey = userId
				? getUserStorageKey(userId, STORAGE_KEY)
				: STORAGE_KEY;
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				try {
					setRecentProperties(JSON.parse(stored));
				} catch (error) {
					console.error('Error parsing recently viewed properties:', error);
				}
			} else {
				setRecentProperties([]);
			}
		};

		load();
		const handler = () => load();
		window.addEventListener(RECENTS_UPDATED_EVENT, handler);
		return () => window.removeEventListener(RECENTS_UPDATED_EVENT, handler);
	}, [userId]);

	const addRecentlyViewed = (property: {
		id: string;
		title: string;
		slug: string;
	}) => {
		const storageKey = userId
			? getUserStorageKey(userId, STORAGE_KEY)
			: STORAGE_KEY;

		// Compute new state from localStorage directly (avoids side effects inside setter)
		const stored = localStorage.getItem(storageKey);
		const current: RecentlyViewedProperty[] = stored
			? (() => {
					try {
						return JSON.parse(stored);
					} catch {
						return [];
					}
			  })()
			: [];

		// Remove if already exists, add new one at the beginning
		const filtered = current.filter((p) => p.id !== property.id);
		const updated = [{ ...property, timestamp: Date.now() }, ...filtered];
		const limited = updated.slice(0, MAX_ITEMS);

		// Persist and notify — outside of the state setter to avoid render-phase side effects
		localStorage.setItem(storageKey, JSON.stringify(limited));
		setRecentProperties(limited);
		window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));
	};

	const clearRecentlyViewed = () => {
		setRecentProperties([]);
		const storageKey = userId
			? getUserStorageKey(userId, STORAGE_KEY)
			: STORAGE_KEY;
		localStorage.removeItem(storageKey);
		window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));
	};

	return {
		recentProperties,
		addRecentlyViewed,
		clearRecentlyViewed,
	};
};
