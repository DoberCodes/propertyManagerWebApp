import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
	writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import type {
	PropertyAuditAssetReview,
	PropertyAuditCategory,
} from '../../intelligence/consumers/propertyAudit';
import {
	getPropertyScanLatestSnapshotId,
	getPropertyScanPersistenceTargets,
} from '../../utils/propertyIntelligencePersistence';
import type { PropertyIntelligenceScanType } from '../../utils/propertyIntelligencePersistence';
import {
	PropertyScanPremiumPreview,
	PropertyScanRecommendation,
} from '../../utils/propertyIntelligenceScan';
import { apiSlice, docToData } from './apiSlice';
import { publishMaintleyEvent } from '../../services/maintleyEventService';
import { trackAnalyticsEvent } from '../../analytics/analytics';

export interface PropertyScanSnapshot {
	id?: string;
	accountId: string;
	propertyId: string;
	scanType: PropertyIntelligenceScanType;
	schemaVersion: 1 | 2;
	planId?: string;
	createdAt: string;
	updatedAt: string;
	createdBy?: string;
	recommendations: PropertyScanRecommendation[];
	auditCategories?: PropertyAuditCategory[];
	auditAssetReviews?: PropertyAuditAssetReview[];
	premiumPreview?: PropertyScanPremiumPreview;
	systemsReviewed: number;
	tasksReviewed?: number;
	baselineVersion?: string;
	summary: {
		recommendations: number;
		overdue: number;
		high: number;
		medium: number;
		low: number;
	};
}

type SavePropertyScanSnapshotInput = Omit<
	PropertyScanSnapshot,
	'id' | 'updatedAt' | 'createdBy'
>;

interface GetLatestPropertyScanSnapshotInput {
	propertyId: string;
	scanType?: PropertyIntelligenceScanType;
}

interface GetPropertyScanSnapshotsInput {
	propertyId: string;
	accountId?: string;
}

const removeUndefinedFieldsDeep = <T>(value: T): T => {
	if (Array.isArray(value)) {
		return value
			.map((item) => removeUndefinedFieldsDeep(item))
			.filter((item) => item !== undefined) as T;
	}

	if (value && typeof value === 'object') {
		const cleanedEntries = Object.entries(value as Record<string, unknown>)
			.filter(([, fieldValue]) => fieldValue !== undefined)
			.map(([key, fieldValue]) => [
				key,
				removeUndefinedFieldsDeep(fieldValue),
			]);

		return Object.fromEntries(cleanedEntries) as T;
	}

	return value;
};

const publishScanCompletedEvent = async (
	payload: PropertyScanSnapshot,
	relatedScanId: string,
) => {
	const isAudit = payload.scanType === 'property_audit_v1';
	await publishMaintleyEvent({
		accountId: payload.accountId,
		propertyId: payload.propertyId,
		relatedScanId,
		type: isAudit ? 'property_audit_completed' : 'quick_scan_completed',
		workflowKey: 'maintley-intelligence',
		entityKey: isAudit
			? `property-audit:${payload.propertyId}`
			: `quick-scan:${relatedScanId}`,
		title: isAudit ? 'Property Audit complete' : 'Quick Scan complete',
		message: `Maintley found ${payload.summary.recommendations} ${isAudit ? 'audit ' : ''}item${payload.summary.recommendations === 1 ? '' : 's'} to review.`,
		status: 'completed',
		priority: payload.summary.high > 0 ? 'high' : 'normal',
		actionLabel: isAudit ? 'Review audit' : 'Review scan',
		actionUrl: `/properties/${payload.propertyId}`,
		push: !isAudit,
		metadata: {
			scanType: payload.scanType,
			recommendationCount: payload.summary.recommendations,
			highCount: payload.summary.high,
			overdueCount: payload.summary.overdue,
		},
	});
};

const propertyIntelligenceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getLatestPropertyScanSnapshot: builder.query<
			PropertyScanSnapshot | null,
			string
		>({
			async queryFn(propertyId: string) {
				try {
					if (!propertyId) {
						return { data: null };
					}

					const latestSnapshot = await getDoc(
						doc(
							db,
							'propertyScanLatest',
							getPropertyScanLatestSnapshotId(propertyId),
						),
					);

					return {
						data: latestSnapshot.exists()
							? (docToData(latestSnapshot) as PropertyScanSnapshot)
							: null,
					};
				} catch (error: any) {
					return {
						error:
							error?.message ||
							'Failed to load the latest property scan snapshot',
					};
				}
			},
			providesTags: (_result, _error, propertyId) => [
				{ type: 'PropertyScanSnapshots', id: propertyId },
			],
		}),

		getLatestPropertyIntelligenceSnapshot: builder.query<
			PropertyScanSnapshot | null,
			GetLatestPropertyScanSnapshotInput
		>({
			async queryFn({
				propertyId,
				scanType = 'quick_property_scan_v1',
			}: GetLatestPropertyScanSnapshotInput) {
				try {
					if (!propertyId) {
						return { data: null };
					}

					const latestSnapshot = await getDoc(
						doc(
							db,
							'propertyScanLatest',
							getPropertyScanLatestSnapshotId(propertyId, scanType),
						),
					);

					return {
						data: latestSnapshot.exists()
							? (docToData(latestSnapshot) as PropertyScanSnapshot)
							: null,
					};
				} catch (error: any) {
					return {
						error:
							error?.message ||
							'Failed to load the latest property intelligence snapshot',
					};
				}
			},
			providesTags: (_result, _error, { propertyId, scanType }) => [
				{
					type: 'PropertyScanSnapshots',
					id: getPropertyScanLatestSnapshotId(propertyId, scanType),
				},
			],
		}),

		getPropertyScanSnapshots: builder.query<
			PropertyScanSnapshot[],
			GetPropertyScanSnapshotsInput
		>({
			async queryFn({ propertyId, accountId }) {
				try {
					if (!propertyId || !accountId) {
						return { data: [] };
					}

					const snapshotQuery = query(
						collection(db, 'propertyScanSnapshots'),
						where('accountId', '==', accountId),
						where('propertyId', '==', propertyId),
					);
					const snapshotDocs = await getDocs(snapshotQuery);
					const snapshots = snapshotDocs.docs
						.map((snapshotDoc) => docToData(snapshotDoc) as PropertyScanSnapshot)
						.sort(
							(first, second) =>
								new Date(second.createdAt || 0).getTime() -
								new Date(first.createdAt || 0).getTime(),
						);

					return { data: snapshots };
				} catch (error: any) {
					return {
						error:
							error?.message ||
							'Failed to load property scan history snapshots',
					};
				}
			},
			providesTags: (_result, _error, { propertyId }) => [
				{ type: 'PropertyScanSnapshots', id: propertyId },
			],
		}),

		savePropertyScanSnapshot: builder.mutation<
			PropertyScanSnapshot,
			SavePropertyScanSnapshotInput
		>({
			async queryFn(snapshot) {
				try {
					const now = new Date().toISOString();
					const payload: PropertyScanSnapshot = removeUndefinedFieldsDeep({
						...snapshot,
						updatedAt: now,
						createdBy: auth.currentUser?.uid,
					});

					const persistenceTargets = getPropertyScanPersistenceTargets(
						snapshot.propertyId,
						snapshot.scanType,
					);
					const latestRef = doc(
						db,
						'propertyScanLatest',
						persistenceTargets.latestSnapshotId,
					);
					const historyRef = doc(collection(db, 'propertyScanSnapshots'));
					const batch = writeBatch(db);
					batch.set(latestRef, payload);
					if (persistenceTargets.writeHistorySnapshot) {
						batch.set(historyRef, payload);
					}
					await batch.commit();
					const relatedScanId = persistenceTargets.writeHistorySnapshot
						? historyRef.id
						: latestRef.id;
					try {
						await publishScanCompletedEvent(payload, relatedScanId);
					} catch (eventError) {
						console.warn('Could not publish Quick Scan event:', eventError);
					}
					void trackAnalyticsEvent('property_scan_completed', {
						scan_type: payload.scanType,
						recommendation_count: payload.summary.recommendations,
						overdue_count: payload.summary.overdue,
						systems_reviewed: payload.systemsReviewed,
						tasks_reviewed: payload.tasksReviewed || 0,
					});

					return {
						data: {
							...payload,
							id: relatedScanId,
						},
					};
				} catch (error: any) {
					return {
						error:
							error?.message || 'Failed to save property scan snapshot',
					};
				}
			},
			invalidatesTags: (_result, _error, snapshot) => [
				{ type: 'PropertyScanSnapshots', id: snapshot.propertyId },
				{
					type: 'PropertyScanSnapshots',
					id: getPropertyScanLatestSnapshotId(
						snapshot.propertyId,
						snapshot.scanType,
					),
				},
			],
		}),

		savePropertyAuditSnapshot: builder.mutation<
			PropertyScanSnapshot,
			SavePropertyScanSnapshotInput
		>({
			async queryFn(snapshot) {
				try {
					const now = new Date().toISOString();
					const payload: PropertyScanSnapshot = removeUndefinedFieldsDeep({
						...snapshot,
						scanType: 'property_audit_v1',
						updatedAt: now,
						createdBy: auth.currentUser?.uid,
					});

					const latestRef = doc(
						db,
						'propertyScanLatest',
						getPropertyScanLatestSnapshotId(
							snapshot.propertyId,
							'property_audit_v1',
						),
					);
					const batch = writeBatch(db);
					batch.set(latestRef, payload);
					await batch.commit();
					try {
						await publishScanCompletedEvent(payload, latestRef.id);
					} catch (eventError) {
						console.warn('Could not publish Property Audit event:', eventError);
					}
					void trackAnalyticsEvent('property_scan_completed', {
						scan_type: payload.scanType,
						recommendation_count: payload.summary.recommendations,
						overdue_count: payload.summary.overdue,
						systems_reviewed: payload.systemsReviewed,
						tasks_reviewed: payload.tasksReviewed || 0,
					});

					return {
						data: {
							...payload,
							id: latestRef.id,
						},
					};
				} catch (error: any) {
					return {
						error:
							error?.message || 'Failed to save property audit snapshot',
					};
				}
			},
			invalidatesTags: (_result, _error, snapshot) => [
				{
					type: 'PropertyScanSnapshots',
					id: getPropertyScanLatestSnapshotId(
						snapshot.propertyId,
						'property_audit_v1',
					),
				},
			],
		}),
	}),
});

export const {
	useGetLatestPropertyIntelligenceSnapshotQuery,
	useGetLatestPropertyScanSnapshotQuery,
	useGetPropertyScanSnapshotsQuery,
	useSavePropertyAuditSnapshotMutation,
	useSavePropertyScanSnapshotMutation,
} = propertyIntelligenceSlice;
