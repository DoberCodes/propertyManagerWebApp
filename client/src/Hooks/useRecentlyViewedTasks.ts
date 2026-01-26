import { useState, useEffect } from 'react';

interface RecentlyViewedTask {
	id: number;
	title: string;
	dueDate: string;
	status: string;
	propertyId: number;
	timestamp: number;
}

const STORAGE_KEY = 'recentlyViewedTasks';
const RECENTS_UPDATED_EVENT = 'recently-viewed-tasks-updated';
const MAX_ITEMS = 5;

export const useRecentlyViewedTasks = () => {
	const [recentTasks, setRecentTasks] = useState<RecentlyViewedTask[]>([]);

	// Load from localStorage on mount and when notified
	useEffect(() => {
		const load = () => {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				try {
					setRecentTasks(JSON.parse(stored));
				} catch (error) {
					console.error('Error parsing recently viewed tasks:', error);
				}
			} else {
				setRecentTasks([]);
			}
		};

		load();
		const handler = () => load();
		window.addEventListener(RECENTS_UPDATED_EVENT, handler);
		return () => window.removeEventListener(RECENTS_UPDATED_EVENT, handler);
	}, []);

	const addRecentlyViewedTask = (task: {
		id: number;
		title: string;
		dueDate: string;
		status: string;
		propertyId: number;
	}) => {
		setRecentTasks((prev) => {
			// Remove if already exists
			const filtered = prev.filter((t) => t.id !== task.id);

			// Add new one at the beginning
			const updated = [{ ...task, timestamp: Date.now() }, ...filtered];

			// Keep only the most recent MAX_ITEMS
			const limited = updated.slice(0, MAX_ITEMS);

			// Save to localStorage and notify listeners
			localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
			window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));

			return limited;
		});
	};

	const clearRecentlyViewedTasks = () => {
		setRecentTasks([]);
		localStorage.removeItem(STORAGE_KEY);
		window.dispatchEvent(new Event(RECENTS_UPDATED_EVENT));
	};

	return {
		recentTasks,
		addRecentlyViewedTask,
		clearRecentlyViewedTasks,
	};
};
