import { useEffect, useState } from 'react';
import { getStorageUsageForAccount, StorageUsage } from '../utils/storageQuota';
import { getEffectiveSubscriptionPlanId } from '../utils/subscriptionUtils';

export const useStorageUsage = (currentUser: any, enabled = true) => {
	const [usage, setUsage] = useState<StorageUsage | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const accountId = String(currentUser?.accountId || currentUser?.id || '').trim();
	const planId = getEffectiveSubscriptionPlanId(
		currentUser?.subscription,
		'homeowner',
	);

	useEffect(() => {
		let isMounted = true;

		if (!enabled || !accountId) {
			setUsage(null);
			setIsLoading(false);
			setError(null);
			return;
		}

		setIsLoading(true);
		setError(null);

		getStorageUsageForAccount(accountId, planId)
			.then((nextUsage) => {
				if (!isMounted) return;
				setUsage(nextUsage);
			})
			.catch((storageError) => {
				if (!isMounted) return;
				setError(
					storageError instanceof Error
						? storageError.message
						: 'Unable to load storage usage.',
				);
				setUsage(null);
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [accountId, enabled, planId]);

	return { usage, isLoading, error };
};
