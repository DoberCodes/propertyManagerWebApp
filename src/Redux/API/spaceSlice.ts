import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { PropertySpace, PropertySpaceDraft } from '../../types/Space.types';
import { sortPropertySpaces } from '../../utils/propertySpaces';
import { apiSlice, docToData } from './apiSlice';

interface CreatePropertySpaceArgs extends PropertySpaceDraft {
	accountId: string;
	propertyId: string;
}

interface UpdatePropertySpaceArgs {
	id: string;
	updates: PropertySpaceDraft;
}

interface GetPropertySpacesArgs {
	accountId: string;
	propertyId: string;
}

const spaceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPropertySpaces: builder.query<PropertySpace[], GetPropertySpacesArgs>({
			async queryFn({ accountId, propertyId }) {
				try {
					if (!accountId || !propertyId) return { data: [] };
					const snapshot = await getDocs(
						query(
							collection(db, 'propertySpaces'),
							where('accountId', '==', accountId),
							where('propertyId', '==', propertyId),
						),
					);
					const spaces = snapshot.docs
						.map((spaceDoc) => docToData(spaceDoc) as PropertySpace)
						.filter((space) => space && !space.isArchived);
					return { data: sortPropertySpaces(spaces) };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: (_result, _error, args) => [
				{ type: 'Spaces', id: args.propertyId },
			],
		}),

		createPropertySpace: builder.mutation<
			PropertySpace,
			CreatePropertySpaceArgs
		>({
			async queryFn({ accountId, propertyId, ...draft }) {
				try {
					const userId = auth.currentUser?.uid;
					if (!userId) return { error: 'User not authenticated' };
					const now = new Date().toISOString();
					const spaceData = {
						...draft,
						name: draft.name.trim(),
						notes: draft.notes?.trim() || '',
						accountId,
						propertyId,
						isArchived: false,
						source: 'manual' as const,
						createdBy: userId,
						updatedBy: userId,
						createdAt: now,
						updatedAt: now,
					};
					const spaceRef = await addDoc(
						collection(db, 'propertySpaces'),
						spaceData,
					);
					return { data: { id: spaceRef.id, ...spaceData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: (_result, _error, args) => [
				{ type: 'Spaces', id: args.propertyId },
			],
		}),

		updatePropertySpace: builder.mutation<
			PropertySpace,
			UpdatePropertySpaceArgs
		>({
			async queryFn({ id, updates }) {
				try {
					const userId = auth.currentUser?.uid;
					if (!userId) return { error: 'User not authenticated' };
					const normalizedUpdates = {
						...updates,
						name: updates.name.trim(),
						notes: updates.notes?.trim() || '',
						updatedBy: userId,
						updatedAt: new Date().toISOString(),
					};
					await updateDoc(doc(db, 'propertySpaces', id), normalizedUpdates);
					return { data: { id, ...normalizedUpdates } as PropertySpace };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Spaces'],
		}),

		deletePropertySpace: builder.mutation<void, string>({
			async queryFn(spaceId) {
				try {
					await deleteDoc(doc(db, 'propertySpaces', spaceId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Spaces'],
		}),
	}),
});

export const {
	useCreatePropertySpaceMutation,
	useDeletePropertySpaceMutation,
	useGetPropertySpacesQuery,
	useUpdatePropertySpaceMutation,
} = spaceSlice;
