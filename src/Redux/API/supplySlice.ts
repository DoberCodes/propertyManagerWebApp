import {
	addDoc,
	collection,
	doc,
	getDocs,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { PropertySupply, PropertySupplyDraft } from '../../types/Supply.types';
import { sortPropertySupplies } from '../../utils/propertySupplies';
import { apiSlice, docToData } from './apiSlice';

interface CreatePropertySupplyArgs extends PropertySupplyDraft {
	accountId: string;
	propertyId: string;
	source?: PropertySupply['source'];
}

interface UpdatePropertySupplyArgs {
	id: string;
	updates: PropertySupplyDraft;
}

interface GetPropertySuppliesArgs {
	accountId: string;
	propertyId: string;
	includeArchived?: boolean;
}

const normalizeDraft = (draft: PropertySupplyDraft) => ({
	...draft,
	name: draft.name.trim(),
	manufacturer: draft.manufacturer?.trim() || '',
	modelOrSku: draft.modelOrSku?.trim() || '',
	barcodeValue: draft.barcodeValue?.trim() || '',
	partNumber: draft.partNumber?.trim() || '',
	size: draft.size?.trim() || '',
	details: draft.details?.trim() || '',
	material: draft.material?.trim() || '',
	voltage: draft.voltage?.trim() || '',
	mervRating: draft.mervRating?.trim() || '',
	compatibility: draft.compatibility?.trim() || '',
	replacementInterval: draft.replacementInterval?.trim() || '',
	notes: draft.notes?.trim() || '',
});

const supplySlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getPropertySupplies: builder.query<
			PropertySupply[],
			GetPropertySuppliesArgs
		>({
			async queryFn({ accountId, propertyId, includeArchived = false }) {
				try {
					if (!accountId || !propertyId) return { data: [] };
					const snapshot = await getDocs(
						query(
							collection(db, 'propertySupplies'),
							where('accountId', '==', accountId),
							where('propertyId', '==', propertyId),
						),
					);
					const supplies = snapshot.docs
						.map((supplyDoc) => docToData(supplyDoc) as PropertySupply)
						.filter(
							(supply) => supply && (includeArchived || !supply.isArchived),
						);
					return { data: sortPropertySupplies(supplies) };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: (_result, _error, args) => [
				{ type: 'Supplies', id: args.propertyId },
			],
		}),

		createPropertySupply: builder.mutation<
			PropertySupply,
			CreatePropertySupplyArgs
		>({
			async queryFn({ accountId, propertyId, source = 'manual', ...draft }) {
				try {
					const userId = auth.currentUser?.uid;
					if (!userId) return { error: 'User not authenticated' };
					const now = new Date().toISOString();
					const supplyData = {
						...normalizeDraft(draft),
						accountId,
						propertyId,
						isArchived: false,
						source,
						createdBy: userId,
						updatedBy: userId,
						createdAt: now,
						updatedAt: now,
					};
					const supplyRef = await addDoc(
						collection(db, 'propertySupplies'),
						supplyData,
					);
					return { data: { id: supplyRef.id, ...supplyData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Supplies'],
		}),

		updatePropertySupply: builder.mutation<
			PropertySupply,
			UpdatePropertySupplyArgs
		>({
			async queryFn({ id, updates }) {
				try {
					const userId = auth.currentUser?.uid;
					if (!userId) return { error: 'User not authenticated' };
					const normalizedUpdates = {
						...normalizeDraft(updates),
						updatedBy: userId,
						updatedAt: new Date().toISOString(),
					};
					await updateDoc(doc(db, 'propertySupplies', id), normalizedUpdates);
					return { data: { id, ...normalizedUpdates } as PropertySupply };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Supplies'],
		}),
	}),
});

export const {
	useCreatePropertySupplyMutation,
	useGetPropertySuppliesQuery,
	useUpdatePropertySupplyMutation,
} = supplySlice;
