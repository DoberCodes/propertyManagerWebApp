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
import {
	PropertyScanPremiumPreview,
	PropertyScanRecommendation,
} from '../../utils/propertyIntelligenceScan';
import { apiSlice, docToData } from './apiSlice';

export interface PropertyScanSnapshot {
	id?: string;
	accountId: string;
	propertyId: string;
	scanType: 'quick_property_scan_v1';
	schemaVersion: 1 | 2;
	planId?: string;
	createdAt: string;
	updatedAt: string;
	createdBy?: string;
	recommendations: PropertyScanRecommendation[];
	premiumPreview?: PropertyScanPremiumPreview;
	systemsReviewed: number;
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
						doc(db, 'propertyScanLatest', propertyId),
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

					const latestRef = doc(db, 'propertyScanLatest', snapshot.propertyId);
					const historyRef = doc(collection(db, 'propertyScanSnapshots'));
					const batch = writeBatch(db);
					batch.set(latestRef, payload);
					batch.set(historyRef, payload);
					await batch.commit();

					return {
						data: {
							...payload,
							id: historyRef.id,
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
			],
		}),
	}),
});

export const {
	useGetLatestPropertyScanSnapshotQuery,
	useGetPropertyScanSnapshotsQuery,
	useSavePropertyScanSnapshotMutation,
} = propertyIntelligenceSlice;
