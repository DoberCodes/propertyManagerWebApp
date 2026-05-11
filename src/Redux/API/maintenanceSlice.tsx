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
import { TaskFinancials } from '../../types/Task.types';
import { MaintenanceEvent } from '../../types/MaintenanceEvent.types';

const maintenanceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Maintenance endpoints
		getMaintenanceHistoryByProperty: builder.query<MaintenanceEvent[], string>({
			async queryFn(propertyId: string) {
				try {
					if (!propertyId) {
						return { data: [] };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const seenIds = new Set<string>();
					const records: any[] = [];

					// Read from both collections; maintenanceEvents is canonical, maintenanceHistory is legacy.
					for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
						for (const accountId of accessibleAccountIds) {
							const q = query(
								collection(db, collectionName),
								where('accountId', '==', accountId),
								where('propertyId', '==', propertyId),
							);
							const snapshot = await getDocs(q);
							snapshot.docs.forEach((d) => {
								const data = docToData(d);
								if (data && !seenIds.has(data.id)) {
									seenIds.add(data.id);
									records.push(data);
								}
							});
						}
					}

					// Fallback by propertyTitle for old records that lack a propertyId field
					if (records.length === 0) {
						const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
						const propertyTitle = docToData(propertyDoc)?.title;
						if (propertyTitle) {
							for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
								for (const accountId of accessibleAccountIds) {
									const titleQuery = query(
										collection(db, collectionName),
										where('accountId', '==', accountId),
										where('propertyTitle', '==', propertyTitle),
									);
									const titleSnapshot = await getDocs(titleQuery);
									titleSnapshot.docs.forEach((d) => {
										const data = docToData(d);
										if (data && !seenIds.has(data.id)) {
											seenIds.add(data.id);
											records.push(data);
										}
									});
								}
							}
						}
					}

					return { data: records };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['MaintenanceHistory', 'MaintenanceEvents'],
		}),

		addMaintenanceHistory: builder.mutation<
			MaintenanceEvent,
			{
				propertyId: string;
				propertyTitle?: string;
				title: string;
				completionDate: string;
				completedBy?: string;
				completedByName?: string;
				completionNotes?: string;
				unitId?: string;
				deviceIds?: string[];
				completionFile?: File;
				recurringTaskId?: string; // ID of the recurring task this belongs to
				linkedTaskIds?: string[]; // Additional task IDs linked to this history record
				financials?: TaskFinancials;
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
				deviceIds,
				completionFile,
				recurringTaskId,
				linkedTaskIds,
				financials,
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
						eventType: 'maintenance_recorded' as const,
						eventSource: 'manual_entry' as const,
						title,
						completionDate,
						completedBy,
						completedByName,
						completionNotes,
						unitId,
						deviceIds,
						maintenanceCycleId: recurringTaskId,
						completionFile: completionFileData,
						recurringTaskId,
						linkedTaskIds,
						financials,
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
						collection(db, 'maintenanceEvents'),
						historyData,
					);
					return { data: { id: docRef.id, ...historyData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory', 'MaintenanceEvents'],
		}),

		deleteMaintenanceHistory: builder.mutation<void, string>({
			async queryFn(historyId) {
				try {
					// Try new collection first, then fall back to legacy
					const newDocRef = doc(db, 'maintenanceEvents', historyId);
					const newSnap = await getDoc(newDocRef);
					if (newSnap.exists()) {
						await deleteDoc(newDocRef);
					} else {
						await deleteDoc(doc(db, 'maintenanceHistory', historyId));
					}
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory', 'MaintenanceEvents'],
		}),

		updateMaintenanceHistory: builder.mutation<
			any,
			{ id: string; updates: Partial<any> }
		>({
			async queryFn({ id, updates }) {
				try {
					// Try new collection first, then fall back to legacy
					const newDocRef = doc(db, 'maintenanceEvents', id);
					const newSnap = await getDoc(newDocRef);
					if (newSnap.exists()) {
						await updateDoc(newDocRef, { ...updates, updatedAt: new Date().toISOString() });
					} else {
						await updateDoc(doc(db, 'maintenanceHistory', id), {
							...updates,
							updatedAt: new Date().toISOString(),
						});
					}
					return { data: { id, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory', 'MaintenanceEvents'],
		}),
	}),
});

export const {
	useGetMaintenanceHistoryByPropertyQuery,
	useLazyGetMaintenanceHistoryByPropertyQuery,
	useAddMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
	useUpdateMaintenanceHistoryMutation,
} = maintenanceSlice;
