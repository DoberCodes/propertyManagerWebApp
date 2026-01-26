import { useState, useEffect } from 'react';
import { getUserStorageKey } from './utils/storageList';

interface FavoriteProperty {
	id: number;
	title: string;
	slug: string;
	timestamp: number;
}

const STORAGE_KEY = 'favoriteProperties';
const FAVORITES_UPDATED_EVENT = 'favorites-updated';

export const useFavorites = (userId?: string | number) => {
	const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);

	// Load from localStorage on mount
	useEffect(() => {
		const loadFromStorage = () => {
			const storageKey = userId
				? getUserStorageKey(userId, STORAGE_KEY)
				: STORAGE_KEY;
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				try {
					setFavorites(JSON.parse(stored));
				} catch (error) {
					console.error('Error parsing favorite properties:', error);
				}
			} else {
				setFavorites([]);
			}
		};

		// Initial load
		loadFromStorage();

		// Listen for cross-component updates
		const handler = () => loadFromStorage();
		window.addEventListener(FAVORITES_UPDATED_EVENT, handler);
		return () => {
			window.removeEventListener(FAVORITES_UPDATED_EVENT, handler);
		};
	}, [userId]);

	const addFavorite = (property: {
		id: number;
		title: string;
		slug: string;
	}) => {
		setFavorites((prev) => {
			// Check if already exists
			if (prev.some((p) => p.id === property.id)) {
				return prev;
			}

			// Add new favorite
			const updated = [{ ...property, timestamp: Date.now() }, ...prev];

			// Save to localStorage
			const storageKey = userId
				? getUserStorageKey(userId, STORAGE_KEY)
				: STORAGE_KEY;
			localStorage.setItem(storageKey, JSON.stringify(updated));
			window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));

			return updated;
		});
	};

	const removeFavorite = (propertyId: number) => {
		setFavorites((prev) => {
			const updated = prev.filter((p) => p.id !== propertyId);
			const storageKey = userId
				? getUserStorageKey(userId, STORAGE_KEY)
				: STORAGE_KEY;
			localStorage.setItem(storageKey, JSON.stringify(updated));
			window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
			return updated;
		});
	};

	const toggleFavorite = (property: {
		id: number;
		title: string;
		slug: string;
	}) => {
		if (isFavorite(property.id)) {
			removeFavorite(property.id);
		} else {
			addFavorite(property);
		}
	};

	const isFavorite = (propertyId: number): boolean => {
		return favorites.some((p) => p.id === propertyId);
	};

	const clearFavorites = () => {
		setFavorites([]);
		const storageKey = userId
			? getUserStorageKey(userId, STORAGE_KEY)
			: STORAGE_KEY;
		localStorage.removeItem(storageKey);
		window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
	};

	return {
		favorites,
		addFavorite,
		removeFavorite,
		toggleFavorite,
		isFavorite,
		clearFavorites,
	};
};
