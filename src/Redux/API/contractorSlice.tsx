import {
	query,
	collection,
	where,
	getDocs,
	addDoc,
	doc,
	updateDoc,
	deleteDoc,
	getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Contractor } from '../../types/Contractor.types';
import { PropertyShare } from '../../types/Property.types';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';

const contractorSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Contractor endpoints
		getContractorsByProperty: builder.query<any[], string>({
			async queryFn(propertyId: string) {
				try {
					if (!propertyId) {
						return { data: [] };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const contractors: Contractor[] = [];

					for (const accountId of accessibleAccountIds) {
						const contractorQuery = query(
							collection(db, 'contractors'),
							where('accountId', '==', accountId),
							where('propertyId', '==', propertyId),
						);
						const snapshot = await getDocs(contractorQuery);
						const batch = snapshot.docs
							.map((doc) => docToData(doc) as Contractor)
							.filter(Boolean) as Contractor[];
						contractors.push(...batch);
					}

					const uniqueContractors = Array.from(
						new Map(contractors.map((contractor) => [contractor.id, contractor]))
							.values(),
					) as Contractor[];

					return { data: uniqueContractors };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Contractors'],
		}),

		createContractor: builder.mutation<
			any,
			{
				propertyId: string;
				name: string;
				company: string;
				category: string;
				phone: string;
				address?: string;
				email?: string;
				notes?: string;
			}
		>({
			async queryFn({
				propertyId,
				name,
				company,
				category,
				phone,
				address,
				email,
				notes,
			}) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();

					const contractorData = {
						propertyId,
						name,
						company,
						category,
						phone,
						address: address || '',
						email: email || '',
						notes: notes || '',
						userId: targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};

					const docRef = await addDoc(
						collection(db, 'contractors'),
						contractorData,
					);

					return {
						data: {
							id: docRef.id,
							...contractorData,
						},
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Contractors'],
		}),

		updateContractor: builder.mutation<
			any,
			{
				contractorId: string;
				name?: string;
				company?: string;
				category?: string;
				phone?: string;
				address?: string;
				email?: string;
				notes?: string;
			}
		>({
			async queryFn({
				contractorId,
				name,
				company,
				category,
				phone,
				address,
				email,
				notes,
			}) {
				try {
					const docRef = doc(db, 'contractors', contractorId);
					const updates: any = {
						updatedAt: new Date().toISOString(),
					};

					if (name !== undefined) updates.name = name;
					if (company !== undefined) updates.company = company;
					if (category !== undefined) updates.category = category;
					if (phone !== undefined) updates.phone = phone;
					if (address !== undefined) updates.address = address;
					if (email !== undefined) updates.email = email;
					if (notes !== undefined) updates.notes = notes;

					await updateDoc(docRef, updates);

					return { data: { id: contractorId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Contractors'],
		}),

		deleteContractor: builder.mutation<void, string>({
			async queryFn(contractorId: string) {
				try {
					await deleteDoc(doc(db, 'contractors', contractorId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Contractors'],
		}),

		getContractors: builder.query<any[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
					const targetAccountId = await resolveTargetUserId();

					const ownedPropertyIds: string[] = [];
					try {
						const propertiesQuery = query(
							collection(db, 'properties'),
							where('accountId', '==', targetAccountId),
						);
						const propertiesSnapshot = await getDocs(propertiesQuery);
						ownedPropertyIds.push(
							...propertiesSnapshot.docs.map((propertyDoc) => propertyDoc.id),
						);
					} catch (ownedPropertiesError) {
						console.warn(
							'Could not fetch account-linked properties for contractors:',
							ownedPropertiesError,
						);
					}

					// Also get shared properties for this user
					let sharedPropertyIds: string[] = [];
					try {
						// Get user's email first
						const userDocRef = doc(db, 'users', userId);
						const userDoc = await getDoc(userDocRef);
						const userEmail = userDoc.data()?.email;

						if (userEmail) {
							// Find all shares where this user has access
							const sharesQuery = query(
								collection(db, 'propertyShares'),
								where('sharedWithEmail', '==', userEmail),
							);
							const sharesSnapshot = await getDocs(sharesQuery);
							sharedPropertyIds = sharesSnapshot.docs
								.map((doc) => docToData(doc) as PropertyShare)
								.filter(Boolean)
								.map((share) => share.propertyId);
						}
					} catch (shareError) {
						// If getting shared properties fails, continue with owned properties only
						console.warn('Could not fetch shared properties:', shareError);
					}

					// Combine and deduplicate property IDs
					const allPropertyIds = Array.from(
						new Set([...ownedPropertyIds, ...sharedPropertyIds]),
					);

					const accountContractorsQuery = query(
						collection(db, 'contractors'),
						where('accountId', '==', targetAccountId),
					);
					const accountContractorsSnapshot = await getDocs(
						accountContractorsQuery,
					);
					const accountContractors = accountContractorsSnapshot.docs
						.map((doc) => docToData(doc) as Contractor)
						.filter(Boolean) as Contractor[];

					// Fetch all contractors for these properties
					const allContractors: any[] = [];
					if (allPropertyIds.length > 0) {
						for (let i = 0; i < allPropertyIds.length; i += 10) {
							const batch = allPropertyIds.slice(i, i + 10);
							try {
								const contractorsQuery = query(
									collection(db, 'contractors'),
									where('accountId', '==', targetAccountId),
									where('propertyId', 'in', batch),
								);
								const contractorsSnapshot = await getDocs(contractorsQuery);
								const contractors = contractorsSnapshot.docs
									.map((doc) => docToData(doc) as Contractor)
									.filter(Boolean) as Contractor[];
								allContractors.push(...contractors);
							} catch (propertyContractorError) {
								console.warn(
									'Could not fetch property-linked contractors batch:',
									propertyContractorError,
								);
							}
						}
					}

					const uniqueContractors = Array.from(
						new Map(
							[...accountContractors, ...allContractors].map((contractor) => [
								contractor.id,
								contractor,
							]),
						).values(),
					) as Contractor[];

					return { data: uniqueContractors };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Contractors'],
		}),
	}),
});

export const {
	useGetContractorsByPropertyQuery,
	useCreateContractorMutation,
	useUpdateContractorMutation,
	useDeleteContractorMutation,
	useGetContractorsQuery,
} = contractorSlice;
