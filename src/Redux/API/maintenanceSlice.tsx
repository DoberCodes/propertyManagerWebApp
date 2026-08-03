import {
	query,
	collection,
	where,
	getDocs,
	getDoc,
	doc,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { callFirebaseFunction } from '../../config/firebaseFunctions';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccountAccessContext,
	resolveTargetUserId,
} from './accountContext';
import { TaskFinancials } from '../../types/Task.types';
import {
	MaintenanceEvent,
	MaintenanceEventRevision,
} from '../../types/MaintenanceEvent.types';
import { normalizeFinancialsWithTotals } from '../../utils/financialUtils';
import { trackAnalyticsEvent } from '../../analytics/analytics';
import {
	AdaptedMaintenanceHistoryRecord,
	MaintenanceHistorySourceRecord,
	mergeMaintenanceHistorySources,
	propertyEmbeddedHistorySources,
} from '../../maintenanceHistory/maintenanceHistoryAdapter';

const maintenanceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getMaintenanceEventRevisionsByProperty: builder.query<
			MaintenanceEventRevision[],
			string
		>({
			async queryFn(propertyId) {
				try {
					if (!propertyId) return { data: [] };
					const snapshot = await getDocs(
						query(
							collection(db, 'maintenanceEventRevisions'),
							where('propertyId', '==', propertyId),
						),
					);
					const revisions = snapshot.docs
						.map((revisionDoc) => docToData(revisionDoc) as MaintenanceEventRevision)
						.sort(
							(a, b) =>
								new Date(b.createdAt || 0).getTime() -
								new Date(a.createdAt || 0).getTime(),
						);
					return { data: revisions };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['MaintenanceEvents'],
		}),
		// Maintenance endpoints
		getMaintenanceHistoryByProperty: builder.query<
			AdaptedMaintenanceHistoryRecord[],
			string
		>({
			async queryFn(propertyId: string, { signal }) {
				try {
					if (!propertyId) return { data: [] };
					const queryAuthUid = auth.currentUser?.uid || '';
					const authContextChanged = () =>
						queryAuthUid && auth.currentUser?.uid !== queryAuthUid;
					const readCancelled = () => signal.aborted || Boolean(authContextChanged());
					let accessibleAccountIds: string[] = [];
					try {
						const accessContext = await resolveAccountAccessContext();
						if (
							accessContext.isScopedTeamMember &&
							!accessContext.allowedPropertyIds.includes(propertyId)
						) {
							return { data: [] };
						}
						accessibleAccountIds = accessContext.accountIds;
					} catch (accountContextError) {
						if (readCancelled()) return { data: [] };
						console.warn(
							'Could not resolve accessible account IDs for maintenance history query. Falling back to property-scoped reads.',
							accountContextError,
						);
					}
					const sourceRecords: MaintenanceHistorySourceRecord[] = [];
					const addDocuments = (
						collectionName: 'maintenanceEvents' | 'maintenanceHistory',
						documents: any[],
					) => {
						documents.forEach((recordDoc) => {
							const record = docToData(recordDoc);
							if (record) {
								sourceRecords.push({
									source: collectionName,
									sourceId: recordDoc.id,
									record,
								});
							}
						});
					};

					for (const collectionName of [
						'maintenanceEvents',
						'maintenanceHistory',
					] as const) {
						for (const accountId of accessibleAccountIds) {
							if (readCancelled()) return { data: [] };
							try {
								const snapshot = await getDocs(query(
									collection(db, collectionName),
									where('accountId', '==', accountId),
									where('propertyId', '==', propertyId),
								));
								if (readCancelled()) return { data: [] };
								addDocuments(collectionName, snapshot.docs);
							} catch (error) {
								if (readCancelled()) return { data: [] };
								console.warn(
									`Maintenance history query failed for ${collectionName} (${accountId}).`,
									error,
								);
							}
						}
					}

					for (const collectionName of [
						'maintenanceEvents',
						'maintenanceHistory',
					] as const) {
						if (readCancelled()) return { data: [] };
						try {
							const propertySnapshot = await getDocs(query(
								collection(db, collectionName),
								where('propertyId', '==', propertyId),
							));
							if (readCancelled()) return { data: [] };
							addDocuments(collectionName, propertySnapshot.docs);
						} catch {
							// Continue when compatibility reads are not allowed for this account.
						}
					}

					if (readCancelled()) return { data: [] };
					const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
					if (readCancelled()) return { data: [] };
					const propertyData = docToData(propertyDoc);
					const propertyTitle = propertyData?.title;
					if (propertyTitle) {
						for (const collectionName of [
							'maintenanceEvents',
							'maintenanceHistory',
						] as const) {
							for (const accountId of accessibleAccountIds) {
								if (readCancelled()) return { data: [] };
								try {
									const titleSnapshot = await getDocs(query(
										collection(db, collectionName),
										where('accountId', '==', accountId),
										where('propertyTitle', '==', propertyTitle),
									));
									if (readCancelled()) return { data: [] };
									addDocuments(collectionName, titleSnapshot.docs);
								} catch (error) {
									if (readCancelled()) return { data: [] };
									console.warn(
										`Maintenance title fallback query failed for ${collectionName} (${accountId}).`,
										error,
									);
								}
							}
						}
					}

					return {
						data: mergeMaintenanceHistorySources([
							...sourceRecords,
							...propertyEmbeddedHistorySources(propertyData),
						]),
					};
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
				performedBy?: MaintenanceEvent['performedBy'];
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
				performedBy,
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
						serviceDate: completionDate,
						performedBy:
							performedBy ||
							(completedByName
								? { type: 'external_provider' as const, displayName: completedByName }
								: completedBy
									? { type: 'user' as const, id: completedBy }
									: undefined),
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
					void trackAnalyticsEvent('maintenance_history_added', {
						action_source: 'user',
						event_type: String(historyData.eventType || 'maintenance_recorded'),
						event_source: String(historyData.eventSource || 'manual_entry'),
						has_attachment: Boolean(resolvedCompletionFileData),
						has_financials: Boolean(financials),
						equipment_count: Array.isArray(deviceIds) ? deviceIds.length : 0,
						has_notes: Boolean(String(completionNotes || description || '').trim()),
					});
					return { data: { id: result.data.id, ...(historyData as any) } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['MaintenanceHistory', 'MaintenanceEvents'],
		}),

		deleteMaintenanceHistory: builder.mutation<
			void,
			string | { id: string; correctionReason: string }
		>({
			async queryFn(input) {
				try {
					const historyId = typeof input === 'string' ? input : input.id;
					const correctionReason =
						typeof input === 'string'
							? 'Removed through the maintenance history interface.'
							: input.correctionReason;
					const canonicalSnapshot = await getDoc(
						doc(db, 'maintenanceEvents', historyId),
					);
					if (canonicalSnapshot.exists()) {
						await callFirebaseFunction('deleteMaintenanceEvent', {
							eventId: historyId,
							correctionReason,
						});
					} else {
						await callFirebaseFunction('correctMaintenanceHistoryRecord', {
							recordId: historyId,
							action: 'delete',
							correctionReason,
						});
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
					const canonicalSnapshot = await getDoc(doc(db, 'maintenanceEvents', id));
					if (canonicalSnapshot.exists()) {
						await callFirebaseFunction('updateMaintenanceEvent', {
							eventId: id,
							updates,
							correctionReason: 'Corrected through the maintenance history interface.',
						});
					} else {
						await callFirebaseFunction('correctMaintenanceHistoryRecord', {
							recordId: id,
							action: 'update',
							updates,
							correctionReason: 'Corrected through the maintenance history interface.',
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
	useGetMaintenanceEventRevisionsByPropertyQuery,
	useGetMaintenanceHistoryByPropertyQuery,
	useLazyGetMaintenanceHistoryByPropertyQuery,
	useAddMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
	useUpdateMaintenanceHistoryMutation,
} = maintenanceSlice;
