import {
	query,
	collection,
	where,
	getDocs,
	getDoc,
	doc,
	addDoc,
	deleteDoc,
	updateDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';

const maintenanceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Maintenance endpoints
		getMaintenanceHistoryByProperty: builder.query<any[], string>({
			async queryFn(propertyId: string) {
				try {
					if (!propertyId) {
						return { data: [] };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const records: any[] = [];
					for (const accountId of accessibleAccountIds) {
						const primaryQuery = query(
							collection(db, 'maintenanceHistory'),
							where('accountId', '==', accountId),
							where('propertyId', '==', propertyId),
						);
						const primarySnapshot = await getDocs(primaryQuery);
						primarySnapshot.docs.forEach((doc) => {
							const data = docToData(doc);
							if (data) records.push(data);
						});
					}

					if (records.length === 0) {
						// Fallback for legacy records missing propertyId
						const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
						const propertyTitle = docToData(propertyDoc)?.title;
						if (propertyTitle) {
							for (const accountId of accessibleAccountIds) {
								const titleQuery = query(
									collection(db, 'maintenanceHistory'),
									where('accountId', '==', accountId),
									where('propertyTitle', '==', propertyTitle),
								);
								const titleSnapshot = await getDocs(titleQuery);
								titleSnapshot.docs.forEach((doc) => {
									const data = docToData(doc);
									if (data) records.push(data);
								});
							}
						}
					}

					const uniqueRecords = Array.from(
						new Map(records.map((record) => [record.id, record])).values(),
					);

					return { data: uniqueRecords };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['MaintenanceHistory'],
		}),

		addMaintenanceHistory: builder.mutation<
			any,
			{
				propertyId: string;
				propertyTitle?: string;
				title: string;
				completionDate: string;
				completedBy?: string;
				completedByName?: string;
				completionNotes?: string;
				unitId?: string;
				completionFile?: File;
				recurringTaskId?: string; // ID of the recurring task this belongs to
				linkedTaskIds?: string[]; // Additional task IDs linked to this history record
			}
		>({
			async queryFn({
				propertyId,
				propertyTitle,
				title,
				completionDate,
				completedBy,
				completedByName,
				completionNotes,
				unitId,
				completionFile,
				recurringTaskId,
				linkedTaskIds,
			}) {
				try {
					const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
					const propertyData = docToData(propertyDoc) || {};
					const accountId =
						String(propertyData.accountId || '').trim() ||
						(await resolveTargetUserId());

					let completionFileData:
						| { url: string; name: string; size: number; type: string }
						| undefined = undefined;

					// Upload file if provided
					if (completionFile) {
						const { uploadMaintenanceFile } = await import(
							'../../utils/maintenanceFileUpload'
						);
						completionFileData = await uploadMaintenanceFile(
							completionFile,
							propertyId,
						);
					}

					const historyData = {
						accountId,
						propertyId,
						propertyTitle,
						title,
						completionDate,
						completedBy,
						completedByName,
						completionNotes,
						unitId,
						completionFile: completionFileData,
						recurringTaskId,
						linkedTaskIds,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};

					// Remove any undefined fields (Firebase doesn't allow them)
					Object.keys(historyData).forEach((key) => {
						if (historyData[key] === undefined) {
							delete historyData[key];
						}
					});

					const docRef = await addDoc(
						collection(db, 'maintenanceHistory'),
						historyData,
					);
					return { data: { id: docRef.id, ...historyData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory'],
		}),

		deleteMaintenanceHistory: builder.mutation<void, string>({
			async queryFn(historyId) {
				try {
					await deleteDoc(doc(db, 'maintenanceHistory', historyId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory'],
		}),

		updateMaintenanceHistory: builder.mutation<
			any,
			{ id: string; updates: Partial<any> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'maintenanceHistory', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory'],
		}),
	}),
});

export const {
	useGetMaintenanceHistoryByPropertyQuery,
	useAddMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
	useUpdateMaintenanceHistoryMutation,
} = maintenanceSlice;
