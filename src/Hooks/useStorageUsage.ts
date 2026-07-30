import { useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { getEffectiveAccessPlanId } from '../utils/subscriptionUtils';
import { useGetStorageUsageQuery } from '../Redux/API/storageUsageSlice';
import { STORAGE_USAGE_REFRESH_EVENT } from '../utils/storageUsageEvents';

export const useStorageUsage = (currentUser: any, enabled = true) => {
	const accountId = String(currentUser?.accountId || currentUser?.id || '').trim();
	const planId = getEffectiveAccessPlanId(currentUser?.subscription);

	const queryArgs = enabled && accountId ? { accountId, planId } : skipToken;
	const {
		data: usage = null,
		isLoading,
		error,
		refetch,
	} = useGetStorageUsageQuery(queryArgs, {
		refetchOnFocus: true,
		refetchOnReconnect: true,
	});

	useEffect(() => {
		if (!enabled || !accountId || typeof window === 'undefined') {
			return;
		}

		const handleRefresh = () => {
			void refetch();
		};

		window.addEventListener(STORAGE_USAGE_REFRESH_EVENT, handleRefresh);
		return () => {
			window.removeEventListener(STORAGE_USAGE_REFRESH_EVENT, handleRefresh);
		};
	}, [enabled, accountId, refetch]);

	const errorMessage =
		error && typeof error === 'object' && 'message' in error
			? String((error as { message?: string }).message || 'Unable to load storage usage.')
			: error
				? 'Unable to load storage usage.'
				: null;

	return { usage, isLoading, error: errorMessage, refetch };
};
