import { collection, getDocs, query, where } from 'firebase/firestore';
import { callFirebaseFunction } from '../../config/firebaseFunctions';
import { db } from '../../config/firebase';
import { PropertyKnowledgeLink } from '../../types/PropertyKnowledgeLink.types';
import { apiSlice, docToData } from './apiSlice';

interface SetEquipmentSpaceLinksArgs {
	propertyId: string;
	equipmentId: string;
	spaceIds: string[];
}

interface SetTaskSpaceLinksArgs {
	propertyId: string;
	taskId: string;
	spaceIds: string[];
}

interface SetSupplyLinksArgs {
	propertyId: string;
	supplyId: string;
	equipmentIds: string[];
	spaceIds: string[];
	taskIds: string[];
}

interface GetPropertyKnowledgeLinksArgs {
	accountId: string;
	propertyId?: string;
}

interface RemovePropertySpaceResult {
	success: boolean;
	archived: boolean;
}

interface RestorePropertySpaceResult {
	success: boolean;
	restored: boolean;
}

interface RemovePropertySupplyResult {
	success: boolean;
	archived: boolean;
}

interface RestorePropertySupplyResult {
	success: boolean;
	restored: boolean;
}

const propertyKnowledgeLinkSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPropertyKnowledgeLinks: builder.query<
			PropertyKnowledgeLink[],
			GetPropertyKnowledgeLinksArgs
		>({
			async queryFn({ accountId, propertyId }) {
				try {
					if (!accountId) return { data: [] };
					const constraints = [where('accountId', '==', accountId)];
					if (propertyId) {
						constraints.push(where('propertyId', '==', propertyId));
					}
					const snapshot = await getDocs(
						query(collection(db, 'propertyKnowledgeLinks'), ...constraints),
					);
					return {
						data: snapshot.docs
							.map((linkDoc) => docToData(linkDoc) as PropertyKnowledgeLink)
							.filter(Boolean),
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: (_result, _error, args) => [
				{
					type: 'PropertyKnowledgeLinks',
					id: args.propertyId || `account:${args.accountId}`,
				},
			],
		}),

		setEquipmentSpaceLinks: builder.mutation<
			{ success: boolean; linkCount: number },
			SetEquipmentSpaceLinksArgs
		>({
			async queryFn(args) {
				try {
					const result = await callFirebaseFunction<
						SetEquipmentSpaceLinksArgs,
						{ success: boolean; linkCount: number }
					>('setEquipmentSpaceLinks', args);
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyKnowledgeLinks'],
		}),

		setTaskSpaceLinks: builder.mutation<
			{ success: boolean; linkCount: number },
			SetTaskSpaceLinksArgs
		>({
			async queryFn(args) {
				try {
					const result = await callFirebaseFunction<
						SetTaskSpaceLinksArgs,
						{ success: boolean; linkCount: number }
					>('setTaskSpaceLinks', args);
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyKnowledgeLinks'],
		}),

		setSupplyLinks: builder.mutation<
			{ success: boolean; linkCount: number },
			SetSupplyLinksArgs
		>({
			async queryFn(args) {
				try {
					const result = await callFirebaseFunction<
						SetSupplyLinksArgs,
						{ success: boolean; linkCount: number }
					>('setSupplyLinks', args);
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Supplies', 'PropertyKnowledgeLinks'],
		}),

		removePropertySpace: builder.mutation<
			RemovePropertySpaceResult,
			{ spaceId: string; propertyId: string }
		>({
			async queryFn({ spaceId }) {
				try {
					const result = await callFirebaseFunction<
						{ spaceId: string },
						RemovePropertySpaceResult
					>('removePropertySpace', { spaceId });
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Spaces', 'PropertyKnowledgeLinks'],
		}),

		restorePropertySpace: builder.mutation<
			RestorePropertySpaceResult,
			{ spaceId: string; propertyId: string }
		>({
			async queryFn({ spaceId }) {
				try {
					const result = await callFirebaseFunction<
						{ spaceId: string },
						RestorePropertySpaceResult
					>('restorePropertySpace', { spaceId });
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Spaces', 'PropertyKnowledgeLinks'],
		}),

		removePropertySupply: builder.mutation<
			RemovePropertySupplyResult,
			{ supplyId: string; propertyId: string }
		>({
			async queryFn({ supplyId }) {
				try {
					const result = await callFirebaseFunction<
						{ supplyId: string },
						RemovePropertySupplyResult
					>('removePropertySupply', { supplyId });
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Supplies', 'PropertyKnowledgeLinks'],
		}),

		restorePropertySupply: builder.mutation<
			RestorePropertySupplyResult,
			{ supplyId: string; propertyId: string }
		>({
			async queryFn({ supplyId }) {
				try {
					const result = await callFirebaseFunction<
						{ supplyId: string },
						RestorePropertySupplyResult
					>('restorePropertySupply', { supplyId });
					return { data: result.data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Supplies', 'PropertyKnowledgeLinks'],
		}),
	}),
});

export const {
	useGetPropertyKnowledgeLinksQuery,
	useRemovePropertySpaceMutation,
	useRemovePropertySupplyMutation,
	useRestorePropertySpaceMutation,
	useRestorePropertySupplyMutation,
	useSetEquipmentSpaceLinksMutation,
	useSetSupplyLinksMutation,
	useSetTaskSpaceLinksMutation,
} = propertyKnowledgeLinkSlice;
