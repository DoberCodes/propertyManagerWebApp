export const STORAGE_USAGE_REFRESH_EVENT = 'maintley:storage-usage-refresh';

export const signalStorageUsageUpdated = () => {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new Event(STORAGE_USAGE_REFRESH_EVENT));
};
