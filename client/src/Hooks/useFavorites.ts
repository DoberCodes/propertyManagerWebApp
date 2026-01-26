import { useState, useEffect } from 'react';

interface FavoriteProperty {
	id: number;
	title: string;
	slug: string;
	timestamp: number;
}

const STORAGE_KEY = 'favoriteProperties';
const FAVORITES_UPDATED_EVENT = 'favorites-updated';

export const useFavorites = () => {
	const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);

	// Load from localStorage on mount
	useEffect(() => {
		const loadFromStorage = () => {
			const stored = localStorage.getItem(STORAGE_KEY);
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
	}, []);

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
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));

			return updated;
		});
	};

	const removeFavorite = (propertyId: number) => {
		setFavorites((prev) => {
			const updated = prev.filter((p) => p.id !== propertyId);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
		localStorage.removeItem(STORAGE_KEY);
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
