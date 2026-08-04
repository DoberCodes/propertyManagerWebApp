import {
	collection,
	doc,
	getDocs,
	query,
	runTransaction,
	setDoc,
	updateDoc,
	where,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { PropertySpace, PropertySpaceDraft } from '../../types/Space.types';
import { sortPropertySpaces } from '../../utils/propertySpaces';
import { apiSlice, docToData } from './apiSlice';
import { trackAnalyticsEvent } from '../../analytics/analytics';

interface CreatePropertySpaceArgs extends PropertySpaceDraft {
	accountId: string;
	propertyId: string;
	generationKey?: string;
	source?: PropertySpace['source'];
}

interface UpdatePropertySpaceArgs {
	id: string;
	updates: PropertySpaceDraft;
}

interface GetPropertySpacesArgs {
	accountId: string;
	propertyId: string;
	includeArchived?: boolean;
}

interface GetAccountSpacesArgs {
	accountId: string;
	includeArchived?: boolean;
}

const spaceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPropertySpaces: builder.query<PropertySpace[], GetPropertySpacesArgs>({
			async queryFn({ accountId, propertyId, includeArchived = false }) {
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
						.filter((space) => space && (includeArchived || !space.isArchived));
					return { data: sortPropertySpaces(spaces) };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: (_result, _error, args) => [
				{ type: 'Spaces', id: args.propertyId },
			],
		}),

		getAccountSpaces: builder.query<PropertySpace[], GetAccountSpacesArgs>({
			async queryFn({ accountId, includeArchived = false }) {
				try {
					if (!accountId) return { data: [] };
					const snapshot = await getDocs(
						query(
							collection(db, 'propertySpaces'),
							where('accountId', '==', accountId),
						),
					);
					const spaces = snapshot.docs
						.map((spaceDoc) => docToData(spaceDoc) as PropertySpace)
						.filter((space) => space && (includeArchived || !space.isArchived));
					return { data: sortPropertySpaces(spaces) };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: (_result, _error, args) => [
				{ type: 'Spaces', id: `account:${args.accountId}` },
			],
		}),

		createPropertySpace: builder.mutation<
			PropertySpace,
			CreatePropertySpaceArgs
		>({
			async queryFn({
				accountId,
				propertyId,
				generationKey,
				source = 'manual',
				...draft
			}) {
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
						...(generationKey ? { generationKey } : {}),
						isArchived: false,
						source,
						createdBy: userId,
						updatedBy: userId,
						createdAt: now,
						updatedAt: now,
					};
					const generatedId = generationKey
						? `${propertyId}__${generationKey.replace(/[^a-z0-9]+/gi, '_')}`
						: '';
					const spaceRef = generatedId
						? doc(db, 'propertySpaces', generatedId)
						: doc(collection(db, 'propertySpaces'));
					const existingGeneratedSpace = generatedId
						? await runTransaction(db, async (transaction) => {
								const snapshot = await transaction.get(spaceRef);
								if (snapshot.exists()) {
									return docToData(snapshot) as PropertySpace;
								}
								transaction.set(spaceRef, spaceData);
								return null;
							})
						: null;
					if (!generatedId) {
						await setDoc(spaceRef, spaceData);
					}
					if (existingGeneratedSpace) {
						return { data: existingGeneratedSpace };
					}
					void trackAnalyticsEvent('space_created', {
						action_source:
							source === 'setup_assistant'
								? 'setup_assistant'
								: source === 'property_profile'
									? 'system'
									: source === 'document_review' ||
										  source === 'intelligence_review'
										? 'ai_suggestion'
										: source === 'migration'
											? 'import'
											: 'user',
						space_source: source,
						space_type: draft.type,
						is_generated: Boolean(generationKey),
					});
					return { data: { id: spaceRef.id, ...spaceData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Spaces'],
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

	}),
});

export const {
	useGetAccountSpacesQuery,
	useCreatePropertySpaceMutation,
	useGetPropertySpacesQuery,
	useUpdatePropertySpaceMutation,
} = spaceSlice;
