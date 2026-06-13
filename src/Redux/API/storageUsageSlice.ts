import { apiSlice } from './apiSlice';
import { getStorageUsageForAccount, StorageUsage } from '../../utils/storageQuota';

export interface StorageUsageQueryArgs {
	accountId: string;
	planId?: string;
}

export const storageUsageSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getStorageUsage: builder.query<StorageUsage, StorageUsageQueryArgs>({
			async queryFn({ accountId, planId }) {
				try {
					const data = await getStorageUsageForAccount(accountId, planId);
					return { data };
				} catch (error: any) {
					return {
						error: error?.message || 'Unable to load storage usage.',
					};
				}
			},
			providesTags: (_result, _error, arg) => [
				{ type: 'StorageUsage' as const, id: arg.accountId },
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetStorageUsageQuery } = storageUsageSlice;
