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
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';
import {
	getEffectiveSubscriptionPlanId,
	getMaxDevicesForPlan,
} from '../../utils/subscriptionUtils';

type TeamMemberAccess = {
	id?: string;
	accountId?: string;
	email?: string;
	role?: string;
	userAccountId?: string;
	linkedProperties?: string[];
};

const getTeamMemberAccessForCurrentUser = async (
	accountIds: string[],
): Promise<{ isScoped: boolean; linkedPropertyIds: Set<string> }> => {
	const currentUser = auth.currentUser;
	if (!currentUser) {
		return { isScoped: false, linkedPropertyIds: new Set() };
	}

	const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
	const userData = userDoc.data() || {};
	if (String(userData?.role || '').trim().toLowerCase() === 'admin') {
		return { isScoped: false, linkedPropertyIds: new Set() };
	}
	const isScoped = userData?.isTeamMemberAccount === true;
	if (!isScoped) {
		return { isScoped: false, linkedPropertyIds: new Set() };
	}

	const normalizedEmail = String(userData?.email || currentUser.email || '')
		.trim()
		.toLowerCase();
	const teamMemberId = String(userData?.teamMemberId || '').trim();

	for (const accountId of accountIds) {
		if (teamMemberId) {
			const memberDoc = await getDoc(doc(db, 'teamMembers', teamMemberId));
			if (memberDoc.exists()) {
				const member = docToData(memberDoc) as TeamMemberAccess;
				if (!member.accountId || member.accountId === accountId) {
					if (String(member.role || '').trim().toLowerCase() === 'admin') {
						return { isScoped: false, linkedPropertyIds: new Set() };
					}
					return {
						isScoped: true,
						linkedPropertyIds: new Set(member.linkedProperties || []),
					};
				}
			}
		}

		const byUserQuery = query(
			collection(db, 'teamMembers'),
			where('accountId', '==', accountId),
			where('userAccountId', '==', currentUser.uid),
		);
		const byUserSnapshot = await getDocs(byUserQuery);
		if (!byUserSnapshot.empty) {
			const member = docToData(byUserSnapshot.docs[0]) as TeamMemberAccess;
			if (String(member.role || '').trim().toLowerCase() === 'admin') {
				return { isScoped: false, linkedPropertyIds: new Set() };
			}
			return {
				isScoped: true,
				linkedPropertyIds: new Set(member.linkedProperties || []),
			};
		}

		if (normalizedEmail) {
			const accountMembersQuery = query(
				collection(db, 'teamMembers'),
				where('accountId', '==', accountId),
			);
			const accountMembersSnapshot = await getDocs(accountMembersQuery);
			const emailMatch = accountMembersSnapshot.docs
				.map((memberDoc) => docToData(memberDoc) as TeamMemberAccess)
				.find(
					(member) =>
						String(member?.email || '').trim().toLowerCase() ===
						normalizedEmail,
			);
			if (emailMatch) {
				if (String(emailMatch.role || '').trim().toLowerCase() === 'admin') {
					return { isScoped: false, linkedPropertyIds: new Set() };
				}
				return {
					isScoped: true,
					linkedPropertyIds: new Set(emailMatch.linkedProperties || []),
				};
			}
		}
	}

	return { isScoped: true, linkedPropertyIds: new Set() };
};

const filterDevicesByAllowedProperties = (
	devices: Device[],
	isScoped: boolean,
	linkedPropertyIds: Set<string>,
) => {
	if (!isScoped) {
		return devices;
	}

	if (linkedPropertyIds.size === 0) {
		return [];
	}

	return devices.filter((device) =>
		linkedPropertyIds.has(String(device.location?.propertyId || '')),
	);
};

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
					const { isScoped, linkedPropertyIds } =
						await getTeamMemberAccessForCurrentUser(accessibleAccountIds);
					if (isScoped && !linkedPropertyIds.has(propertyId)) {
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
						data: filterDevicesByAllowedProperties(
							uniqueDevices,
							isScoped,
							linkedPropertyIds,
						),
					};
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
					const { isScoped, linkedPropertyIds } =
						await getTeamMemberAccessForCurrentUser(accessibleAccountIds);
					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const batch = await getDevicesForAccount(
							accountId,
							[where('location.unitId', '==', unitId)],
						);
						devices.push(...batch);
					}
					const uniqueDevices = uniqueDevicesById(devices);
					return {
						data: filterDevicesByAllowedProperties(
							uniqueDevices,
							isScoped,
							linkedPropertyIds,
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
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const { isScoped, linkedPropertyIds } =
						await getTeamMemberAccessForCurrentUser(accessibleAccountIds);
					if (
						isScoped &&
						!linkedPropertyIds.has(String(data.location?.propertyId || ''))
					) {
						return { error: 'Not authorized to view this appliance' };
					}
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
					const { isScoped, linkedPropertyIds } =
						await getTeamMemberAccessForCurrentUser(accessibleAccountIds);
					const devices: Device[] = [];
					for (const accountId of accessibleAccountIds) {
						const batch = await getDevicesForAccount(accountId);
						devices.push(...batch);
					}
					const uniqueDevices = uniqueDevicesById(devices);
					return {
						data: filterDevicesByAllowedProperties(
							uniqueDevices,
							isScoped,
							linkedPropertyIds,
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
	useGetUnitDevicesQuery,
	useGetDeviceQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
	useGetAllDevicesQuery,
	useLazyGetAllDevicesQuery,
} = deviceSlice;
