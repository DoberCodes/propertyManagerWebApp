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

interface GetPropertyKnowledgeLinksArgs {
	accountId: string;
	propertyId: string;
}

interface RemovePropertySpaceResult {
	success: boolean;
	archived: boolean;
}

const propertyKnowledgeLinkSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPropertyKnowledgeLinks: builder.query<
			PropertyKnowledgeLink[],
			GetPropertyKnowledgeLinksArgs
		>({
			async queryFn({ accountId, propertyId }) {
				try {
					if (!accountId || !propertyId) return { data: [] };
					const snapshot = await getDocs(
						query(
							collection(db, 'propertyKnowledgeLinks'),
							where('accountId', '==', accountId),
							where('propertyId', '==', propertyId),
						),
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
				{ type: 'PropertyKnowledgeLinks', id: args.propertyId },
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
			invalidatesTags: (_result, _error, args) => [
				{ type: 'PropertyKnowledgeLinks', id: args.propertyId },
			],
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
			invalidatesTags: (_result, _error, args) => [
				{ type: 'PropertyKnowledgeLinks', id: args.propertyId },
			],
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
			invalidatesTags: (_result, _error, args) => [
				{ type: 'Spaces', id: args.propertyId },
				{ type: 'PropertyKnowledgeLinks', id: args.propertyId },
			],
		}),
	}),
});

export const {
	useGetPropertyKnowledgeLinksQuery,
	useRemovePropertySpaceMutation,
	useSetEquipmentSpaceLinksMutation,
	useSetTaskSpaceLinksMutation,
} = propertyKnowledgeLinkSlice;
