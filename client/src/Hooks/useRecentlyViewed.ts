import { useState, useEffect } from 'react';

interface RecentlyViewedProperty {
	id: number;
	title: string;
	slug: string;
	timestamp: number;
}

const STORAGE_KEY = 'recentlyViewedProperties';
const RECENTS_UPDATED_EVENT = 'recently-viewed-updated';
const MAX_ITEMS = 5;

export const useRecentlyViewed = () => {
	const [recentProperties, setRecentProperties] = useState<
		RecentlyViewedProperty[]
	>([]);

	// Load from localStorage on mount and when notified
	useEffect(() => {
		const load = () => {
			const stored = localStorage.getItem(STORAGE_KEY);
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
	}, []);

	const addRecentlyViewed = (property: {
		id: number;
		title: string;
		slug: string;
	}) => {
		setRecentProperties((prev) => {
			// Remove if already exists
			const filtered = prev.filter((p) => p.id !== property.id);

			// Add new one at the beginning
			const updated = [{ ...property, timestamp: Date.now() }, ...filtered];

			// Keep only the most recent MAX_ITEMS
			const limited = updated.slice(0, MAX_ITEMS);

			// Save to localStorage and notify listeners
			localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
			window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));

			return limited;
		});
	};

	const clearRecentlyViewed = () => {
		setRecentProperties([]);
		localStorage.removeItem(STORAGE_KEY);
		window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));
	};

	return {
		recentProperties,
		addRecentlyViewed,
		clearRecentlyViewed,
	};
};
