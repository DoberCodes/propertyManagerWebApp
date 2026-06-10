import {
	query,
	collection,
	where,
	getDocs,
	doc,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	runTransaction,
} from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { db } from '../../config/firebase';
import { Device } from '../../types/Property.types';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';
import {
	getEffectiveSubscriptionPlanId,
	getMaxDevicesForPlan,
} from '../../utils/subscriptionUtils';

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
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const q = query(
							collection(db, 'devices'),
							where('accountId', '==', accountId),
							where('location.propertyId', '==', propertyId),
						);
						const querySnapshot = await getDocs(q);
						const batch = querySnapshot.docs
							.map((doc) => docToData(doc) as Device)
							.filter(Boolean) as Device[];
						devices.push(...batch);
					}
					const uniqueDevices = Array.from(
						new Map(devices.map((device) => [device.id, device])).values(),
					) as Device[];
					return { data: uniqueDevices };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		getUnitDevices: builder.query<Device[], string>({
			async queryFn(unitId: string) {
				try {
					if (!unitId) {
						return { data: [] };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const q = query(
							collection(db, 'devices'),
							where('accountId', '==', accountId),
							where('location.unitId', '==', unitId),
						);
						const querySnapshot = await getDocs(q);
						const batch = querySnapshot.docs
							.map((doc) => docToData(doc) as Device)
							.filter(Boolean) as Device[];
						devices.push(...batch);
					}
					const uniqueDevices = Array.from(
						new Map(devices.map((device) => [device.id, device])).values(),
					) as Device[];
					return { data: uniqueDevices };
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
					return { data: data as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		createDevice: builder.mutation<Device, Omit<Device, 'id'>>({
			async queryFn(newDevice) {
				try {
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
						const planId = getEffectiveSubscriptionPlanId(subscription);
						const maxDevices = getMaxDevicesForPlan(planId);

						const accountSnapshot = await transaction.get(accountRef);
						const accountData = accountSnapshot.data() || {};
						const currentDeviceCount = Number(accountData.deviceCount || 0);

						if (currentDeviceCount >= maxDevices) {
							throw new Error(
								`Appliance limit reached for current plan (${maxDevices} max).`,
							);
						}

						const nowIso = new Date().toISOString();
						transaction.set(deviceRef, {
							...newDevice,
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
					return {
						data: {
							id: deviceRef.id,
							...newDevice,
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
			{ id: string; updates: Partial<Device> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'devices', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Device };
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
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const q = query(
							collection(db, 'devices'),
							where('accountId', '==', accountId),
						);
						const querySnapshot = await getDocs(q);
						const batch = querySnapshot.docs
							.map((doc) => docToData(doc) as Device)
							.filter(Boolean) as Device[];
						devices.push(...batch);
					}
					const uniqueDevices = Array.from(
						new Map(devices.map((device) => [device.id, device])).values(),
					) as Device[];
					return { data: uniqueDevices };
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
	useGetUnitDevicesQuery,
	useGetDeviceQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
	useGetAllDevicesQuery,
} = deviceSlice;
