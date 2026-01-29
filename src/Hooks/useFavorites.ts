import { useState, useEffect } from 'react';
import { getUserStorageKey } from './utils/storageList';
import {
	useGetFavoritesQuery,
	useAddFavoriteMutation,
	useRemoveFavoriteMutation,
} from '../Redux/API/apiSlice';

interface FavoriteProperty {
	id: string;
	title: string;
	slug: string;
	timestamp: number;
}

const STORAGE_KEY = 'favoriteProperties';
const FAVORITES_UPDATED_EVENT = 'favorites-updated';

export const useFavorites = (userId?: string | number) => {
	const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);

	// Fetch favorites from Firebase
	const { data: firebaseFavorites = [], isLoading } = useGetFavoritesQuery(
		String(userId || ''),
		{ skip: !userId },
	);

	// Firebase mutations
	const [addFavoriteMutation] = useAddFavoriteMutation();
	const [removeFavoriteMutation] = useRemoveFavoriteMutation();

	// Sync Firebase data to local state and localStorage
	useEffect(() => {
		if (firebaseFavorites.length > 0) {
			const formattedFavorites = firebaseFavorites.map((fav) => ({
				id: fav.propertyId,
				title: fav.title,
				slug: fav.slug,
				timestamp: fav.timestamp,
			}));
			setFavorites(formattedFavorites);

			// Update localStorage cache
			const storageKey = userId
				? getUserStorageKey(userId, STORAGE_KEY)
				: STORAGE_KEY;
			localStorage.setItem(storageKey, JSON.stringify(formattedFavorites));
		} else if (!isLoading && userId) {
			// If Firebase returns empty and we're not loading, clear favorites
			setFavorites([]);
		}
	}, [firebaseFavorites, userId, isLoading]);

	// Load from localStorage on mount (before Firebase loads)
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

		// Initial load from cache
		loadFromStorage();

		// Listen for cross-component updates
		const handler = () => loadFromStorage();
		window.addEventListener(FAVORITES_UPDATED_EVENT, handler);
		return () => {
			window.removeEventListener(FAVORITES_UPDATED_EVENT, handler);
		};
	}, [userId]);

	const addFavorite = async (property: {
		id: string;
		title: string;
		slug: string;
	}) => {
		// Optimistic update
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

		// Sync to Firebase
		if (userId) {
			try {
				await addFavoriteMutation({
					userId: String(userId),
					propertyId: property.id,
					title: property.title,
					slug: property.slug,
				}).unwrap();
			} catch (error) {
				console.error('Failed to add favorite to Firebase:', error);
			}
		}
	};

	const removeFavorite = async (propertyId: string) => {
		// Optimistic update
		setFavorites((prev) => {
			const updated = prev.filter((p) => p.id !== propertyId);
			const storageKey = userId
				? getUserStorageKey(userId, STORAGE_KEY)
				: STORAGE_KEY;
			localStorage.setItem(storageKey, JSON.stringify(updated));
			window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
			return updated;
		});

		// Sync to Firebase
		if (userId) {
			try {
				await removeFavoriteMutation({
					userId: String(userId),
					propertyId,
				}).unwrap();
			} catch (error) {
				console.error('Failed to remove favorite from Firebase:', error);
			}
		}
	};

	const toggleFavorite = (property: {
		id: string;
		title: string;
		slug: string;
	}) => {
		if (isFavorite(property.id)) {
			removeFavorite(property.id);
		} else {
			addFavorite(property);
		}
	};

	const isFavorite = (propertyId: string): boolean => {
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
		isLoading,
	};
};
