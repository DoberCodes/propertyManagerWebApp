import {
	query,
	collection,
	where,
	getDocs,
	doc,
	getDoc,
	updateDoc,
	deleteDoc,
	runTransaction,
} from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { db } from '../../config/firebase';
import { Device } from '../../types/Property.types';
import { apiSlice, docToData } from './apiSlice';
import {
	filterRecordsByAccessProperties,
	resolveAccountAccessContext,
	resolveTargetUserId,
} from './accountContext';
import {
	getEffectiveAccessPlanId,
	getMaxDevicesForPlan,
} from '../../utils/subscriptionUtils';
import {
	AnalyticsActionSource,
	trackAnalyticsEvent,
} from '../../analytics/analytics';

type CreateDeviceInput = Omit<Device, 'id'> & {
	analyticsSource?: AnalyticsActionSource;
};

const DEVICE_IDENTITY_FIELDS = new Set([
	'type',
	'assetType',
	'assetVariant',
	'assetCategory',
	'brand',
	'model',
	'serialNumber',
]);
const DEVICE_INSTALLATION_FIELDS = new Set([
	'installationDate',
	'installDate',
	'purchaseDate',
	'warrantyExpiration',
]);
const DEVICE_LOCATION_FIELDS = new Set(['location', 'spaceIds']);
const DEVICE_MAINTENANCE_FIELDS = new Set([
	'filterSize',
	'maintenanceFrequency',
	'lastServiceDate',
	'nextServiceDate',
	'status',
]);

const readDeviceQuery = async (...clauses: ReturnType<typeof where>[]) => {
	const snapshot = await getDocs(query(collection(db, 'devices'), ...clauses));
	return snapshot.docs
		.map((deviceDoc) => docToData(deviceDoc) as Device)
		.filter(Boolean) as Device[];
};

const getDevicesForAccount = async (
	accountId: string,
	extraClauses: ReturnType<typeof where>[] = [],
) => {
	return readDeviceQuery(where('accountId', '==', accountId), ...extraClauses);
};

const uniqueDevicesById = (devices: Device[]) =>
	Array.from(
		new Map(devices.map((device) => [device.id, device])).values(),
	) as Device[];

const normalizeDeviceDates = <T extends Partial<Device>>(device: T): T => {
	const installationDate = String(
		device.installationDate || device.installDate || '',
	).trim();
	if (!installationDate) {
		return device;
	}
	return {
		...device,
		installationDate,
		installDate: installationDate,
	} as T;
};

const deviceSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Device endpoints
		// Device endpoints
		getDevices: builder.query<Device[], string>({
			async queryFn(propertyId: string) {
				try {
					if (!propertyId) {
						return { data: [] };
					}
					const accessContext = await resolveAccountAccessContext();
					const accessibleAccountIds = accessContext.accountIds;
					if (
						accessContext.isScopedTeamMember &&
						!accessContext.allowedPropertyIds.includes(propertyId)
					) {
						return { data: [] };
					}

					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const batch = await getDevicesForAccount(
							accountId,
							[where('location.propertyId', '==', propertyId)],
						);
						devices.push(...batch);
					}
					const uniqueDevices = uniqueDevicesById(devices);
					return {
						data: filterRecordsByAccessProperties(
							uniqueDevices,
							accessContext,
							(device) => String(device.location?.propertyId || ''),
						),
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		getDevice: builder.query<Device, string>({
			async queryFn(deviceId: string) {
				try {
					const docRef = doc(db, 'devices', deviceId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Device;
					const accessContext = await resolveAccountAccessContext();
					if (
						accessContext.isScopedTeamMember &&
						!accessContext.allowedPropertyIds.includes(
							String(data.location?.propertyId || ''),
						)
					) {
						return { error: 'Not authorized to view this equipment' };
					}
					return { data: data as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		createDevice: builder.mutation<Device, CreateDeviceInput>({
			async queryFn(newDevice) {
				try {
					const { analyticsSource = 'user', ...deviceInput } = newDevice;
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();

					const accountRef = doc(db, 'familyAccounts', targetUserId);
					const deviceRef = doc(collection(db, 'devices'));

					await runTransaction(db, async (transaction) => {
						const userSnapshot = await transaction.get(
							doc(db, 'users', targetUserId),
						);
						const userData = userSnapshot.data() || {};
						const subscription = userData.subscription || {};
						const accountSnapshot = await transaction.get(accountRef);
						const accountData = accountSnapshot.data() || {};
						const projection = accountData.effectiveEntitlementProjection || {};
						const subscriptionWithGrants = {
							...subscription,
							entitlementAccountId: targetUserId,
							entitlementGrants: Array.isArray(projection.activeGrants)
								? projection.activeGrants
								: [],
						};
						const planId = getEffectiveAccessPlanId(subscriptionWithGrants);
						const maxDevices = getMaxDevicesForPlan(planId);
						const currentDeviceCount = Number(accountData.deviceCount || 0);

						if (currentDeviceCount >= maxDevices) {
							throw new Error(
								`Equipment limit reached for current plan (${maxDevices} max).`,
							);
						}

						const nowIso = new Date().toISOString();
						transaction.set(deviceRef, {
							...normalizeDeviceDates(deviceInput),
							userId: targetUserId,
							accountId: targetUserId,
							createdAt: nowIso,
							updatedAt: nowIso,
						});

						transaction.update(accountRef, {
							deviceCount: currentDeviceCount + 1,
							updatedAt: nowIso,
						});
					});
					const normalizedDevice = normalizeDeviceDates(deviceInput);
					void trackAnalyticsEvent('equipment_created', {
						action_source: analyticsSource,
						equipment_type: String(
							normalizedDevice.assetType || normalizedDevice.type || 'unspecified',
						),
						equipment_category: String(
							normalizedDevice.assetCategory || 'unspecified',
						),
						has_install_date: Boolean(
							normalizedDevice.installationDate || normalizedDevice.installDate,
						),
						has_filter_size: Boolean(String(normalizedDevice.filterSize || '').trim()),
					});
					return {
						data: {
							id: deviceRef.id,
							...normalizedDevice,
							userId: targetUserId,
							accountId: targetUserId,
						} as Device,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		updateDevice: builder.mutation<
			Device,
			{
				id: string;
				updates: Partial<Device>;
				analyticsSource?: AnalyticsActionSource;
			}
		>({
			async queryFn({ id, updates, analyticsSource = 'user' }) {
				try {
					const docRef = doc(db, 'devices', id);
					const changedFields = Object.keys(updates).filter(
						(key) => key !== 'updatedAt',
					);
					await updateDoc(docRef, {
						...normalizeDeviceDates(updates),
						updatedAt: new Date().toISOString(),
					});
					void trackAnalyticsEvent('equipment_updated', {
						action_source: analyticsSource,
						changed_field_count: changedFields.length,
						changed_identity: changedFields.some((field) =>
							DEVICE_IDENTITY_FIELDS.has(field),
						),
						changed_installation: changedFields.some((field) =>
							DEVICE_INSTALLATION_FIELDS.has(field),
						),
						changed_location: changedFields.some((field) =>
							DEVICE_LOCATION_FIELDS.has(field),
						),
						changed_maintenance_details: changedFields.some((field) =>
							DEVICE_MAINTENANCE_FIELDS.has(field),
						),
					});
					return { data: { id, ...normalizeDeviceDates(updates) } as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		deleteDevice: builder.mutation<void, string>({
			async queryFn(deviceId: string) {
				try {
					const deviceRef = doc(db, 'devices', deviceId);
					const deviceSnapshot = await getDoc(deviceRef);
					const deviceData = deviceSnapshot.data() || {};
					const accountId = String(deviceData.accountId || '').trim() || undefined;

					if (accountId) {
						const accountRef = doc(db, 'familyAccounts', accountId);
						await runTransaction(db, async (transaction) => {
							const accountSnapshot = await transaction.get(accountRef);
							const accountData = accountSnapshot.data() || {};
							const currentDeviceCount = Number(accountData.deviceCount || 0);
							const nowIso = new Date().toISOString();

							transaction.delete(deviceRef);
							transaction.update(accountRef, {
								deviceCount: Math.max(0, currentDeviceCount - 1),
								updatedAt: nowIso,
							});
						});
					} else {
						await deleteDoc(deviceRef);
					}
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		// Get all devices across all properties (for reports)
		getAllDevices: builder.query<Device[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const accessContext = await resolveAccountAccessContext();
					const accessibleAccountIds = accessContext.accountIds;
					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const batch = await getDevicesForAccount(accountId);
						devices.push(...batch);
					}
					const uniqueDevices = uniqueDevicesById(devices);
					return {
						data: filterRecordsByAccessProperties(
							uniqueDevices,
							accessContext,
							(device) => String(device.location?.propertyId || ''),
						),
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),
	}),
});

export const {
	useGetDevicesQuery,
	useGetDeviceQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
	useGetAllDevicesQuery,
	useLazyGetAllDevicesQuery,
} = deviceSlice;
