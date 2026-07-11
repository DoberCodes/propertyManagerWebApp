import {
	query,
	collection,
	where,
	getDocs,
	getDoc,
	doc,
	deleteDoc,
	updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { callFirebaseFunction } from '../../config/firebaseFunctions';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';
import { TaskFinancials } from '../../types/Task.types';
import { MaintenanceEvent } from '../../types/MaintenanceEvent.types';
import { normalizeFinancialsWithTotals } from '../../utils/financialUtils';

const maintenanceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Maintenance endpoints
		getMaintenanceHistoryByProperty: builder.query<MaintenanceEvent[], string>({
			async queryFn(propertyId: string, { signal }) {
				try {
					if (!propertyId) {
						return { data: [] };
					}
					const queryAuthUid = auth.currentUser?.uid || '';
					const authContextChanged = () =>
						queryAuthUid && auth.currentUser?.uid !== queryAuthUid;
					let accessibleAccountIds: string[] = [];
					try {
						accessibleAccountIds = await resolveAccessibleAccountIds();
					} catch (accountContextError) {
						if (signal.aborted || authContextChanged()) {
							return { data: [] };
						}
						console.warn(
							'Could not resolve accessible account IDs for maintenance history query. Falling back to property-scoped reads.',
							accountContextError,
						);
					}
					const seenIds = new Set<string>();
					const records: any[] = [];
					const debugCounts = {
						accountScoped: { maintenanceEvents: 0, maintenanceHistory: 0 },
						propertyScoped: { maintenanceEvents: 0, maintenanceHistory: 0 },
						titleFallback: { maintenanceEvents: 0, maintenanceHistory: 0 },
					};

					// Read from both collections; maintenanceEvents is canonical, maintenanceHistory is legacy.
					for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
						for (const accountId of accessibleAccountIds) {
							if (signal.aborted || authContextChanged()) {
								return { data: [] };
							}
							try {
								const q = query(
									collection(db, collectionName),
									where('accountId', '==', accountId),
									where('propertyId', '==', propertyId),
								);
								const snapshot = await getDocs(q);
								if (signal.aborted || authContextChanged()) {
									return { data: [] };
								}
								snapshot.docs.forEach((d) => {
									const data = docToData(d);
									if (data && !seenIds.has(data.id)) {
										if (collectionName === 'maintenanceEvents') {
											debugCounts.accountScoped.maintenanceEvents += 1;
										} else {
											debugCounts.accountScoped.maintenanceHistory += 1;
										}
										seenIds.add(data.id);
										records.push(data);
									}
								});
							} catch (error) {
								if (signal.aborted || authContextChanged()) {
									return { data: [] };
								}
								console.warn(
									`Maintenance history query failed for ${collectionName} (${accountId}).`,
									error,
								);
							}
						}
					}

					// Secondary pass: query by propertyId without account filter.
					// This fills gaps when account context changed but rules still allow the property read.
					for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
						if (signal.aborted || authContextChanged()) {
							return { data: [] };
						}
						try {
							const propertyQuery = query(
								collection(db, collectionName),
								where('propertyId', '==', propertyId),
							);
							const propertySnapshot = await getDocs(propertyQuery);
							if (signal.aborted || authContextChanged()) {
								return { data: [] };
							}
							propertySnapshot.docs.forEach((d) => {
								const data = docToData(d);
								if (data && !seenIds.has(data.id)) {
									if (collectionName === 'maintenanceEvents') {
										debugCounts.propertyScoped.maintenanceEvents += 1;
									} else {
										debugCounts.propertyScoped.maintenanceHistory += 1;
									}
									seenIds.add(data.id);
									records.push(data);
								}
							});
						} catch {
							// Continue to next fallback path if this query isn't allowed by rules.
						}
					}

					// Fallback by propertyTitle for old records that lack a propertyId field
					if (signal.aborted || authContextChanged()) {
						return { data: [] };
					}
					const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
					if (signal.aborted || authContextChanged()) {
						return { data: [] };
					}
					const propertyTitle = docToData(propertyDoc)?.title;
					if (propertyTitle) {
						for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
							for (const accountId of accessibleAccountIds) {
								if (signal.aborted || authContextChanged()) {
									return { data: [] };
								}
								try {
									const titleQuery = query(
										collection(db, collectionName),
										where('accountId', '==', accountId),
										where('propertyTitle', '==', propertyTitle),
									);
									const titleSnapshot = await getDocs(titleQuery);
									if (signal.aborted || authContextChanged()) {
										return { data: [] };
									}
									titleSnapshot.docs.forEach((d) => {
										const data = docToData(d);
										if (data && !seenIds.has(data.id)) {
											if (collectionName === 'maintenanceEvents') {
												debugCounts.titleFallback.maintenanceEvents += 1;
											} else {
												debugCounts.titleFallback.maintenanceHistory += 1;
											}
											seenIds.add(data.id);
											records.push(data);
										}
									});
								} catch (error) {
									if (signal.aborted || authContextChanged()) {
										return { data: [] };
									}
									console.warn(
										`Maintenance title fallback query failed for ${collectionName} (${accountId}).`,
										error,
									);
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
				completionFileData?: {
					url: string;
					name: string;
					size: number;
					type: string;
					usage?: 'appliance_photo' | 'document';
					uploadedAt?: string;
				};
				recurringTaskId?: string; // ID of the recurring task this belongs to
				linkedTaskIds?: string[]; // Additional task IDs linked to this history record
				financials?: TaskFinancials;
				eventType?:
					| MaintenanceEvent['eventType']
					| 'warranty_added'
					| 'contractor_visit_logged'
					| 'recurring_maintenance_completed';
				eventSource?:
					| MaintenanceEvent['eventSource']
					| 'note_entry'
					| 'document_upload'
					| 'contractor_entry';
				description?: string;
				tags?: string[];
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
				completionFileData,
				recurringTaskId,
				linkedTaskIds,
				financials,
				eventType,
				eventSource,
				description,
				tags,
			}) {
				try {
					const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
					const propertyData = docToData(propertyDoc) || {};
					const accountId =
						String(propertyData.accountId || '').trim() ||
						(await resolveTargetUserId());

					let resolvedCompletionFileData:
						| { url: string; name: string; size: number; type: string }
						| undefined = completionFileData;

					// Upload file if provided
					if (!resolvedCompletionFileData && completionFile) {
						const { uploadMaintenanceFile } = await import(
							'../../utils/maintenanceFileUpload'
						);
						resolvedCompletionFileData = await uploadMaintenanceFile(
							completionFile,
							propertyId,
						);
					}

					const historyData = {
						accountId,
						propertyId,
						propertyTitle,
						eventType: eventType || ('maintenance_recorded' as const),
						eventSource: eventSource || ('manual_entry' as const),
						title,
						description,
						completionDate,
						completedBy,
						completedByName,
						completionNotes,
						unitId,
						deviceIds,
						tags,
						maintenanceCycleId: recurringTaskId,
						attachments: resolvedCompletionFileData
							? [
									{
										id: `file_${Date.now()}`,
										fileName: resolvedCompletionFileData.name,
										fileSize: resolvedCompletionFileData.size,
										mimeType: resolvedCompletionFileData.type,
										url: resolvedCompletionFileData.url,
										uploadedAt: new Date().toISOString(),
										description: 'Completion file',
									},
							  ]
							: undefined,
						recurringTaskId,
						linkedTaskIds,
						financials: normalizeFinancialsWithTotals(financials),
					};

					const result = await callFirebaseFunction<
						{ event: Record<string, unknown> },
						{ success: boolean; id: string }
					>('createMaintenanceEvent', { event: historyData });
					return { data: { id: result.data.id, ...(historyData as any) } };
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
