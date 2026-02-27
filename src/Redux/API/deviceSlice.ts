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
} from 'firebase/firestore';
import { auth } from '../../config/firebase';
import { db } from '../../config/firebase';
import { Device } from '../../types/Property.types';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';

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
					const docRef = await addDoc(collection(db, 'devices'), {
						...newDevice,
						userId: targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
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
					await deleteDoc(doc(db, 'devices', deviceId));
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
