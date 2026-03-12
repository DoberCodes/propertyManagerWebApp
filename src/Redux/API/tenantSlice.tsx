import {
	collection,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	setDoc,
	updateDoc,
	where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { apiSlice } from './apiSlice';
import { db, functions } from '../../config/firebase';
import { resolveTargetUserId } from './accountContext';
import {
	TenantInvitationCode,
	TenantProfile,
} from '../../types/TenantProfile.types';

const tenantSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Tenant endpoints
		addTenant: builder.mutation<
			void,
			{
				propertyId: string;
				firstName: string;
				lastName: string;
				email: string;
				phone?: string;
				unit?: string;
				leaseStart?: string;
				leaseEnd?: string;
				tenantInvitationCodeId?: string;
			}
		>({
			async queryFn(tenantData) {
				try {
					const propertyRef = doc(db, 'properties', tenantData.propertyId);
					const propertySnap = await getDoc(propertyRef);

					if (!propertySnap.exists()) {
						return { error: 'Property not found' };
					}

					const property = propertySnap.data();
					const tenants = property.tenants || [];

					const newTenant = {
						id: `tenant_${Date.now()}`,
						firstName: tenantData.firstName,
						lastName: tenantData.lastName,
						email: tenantData.email,
						phone: tenantData.phone || '',
						unit: tenantData.unit || '',
						leaseStart: tenantData.leaseStart || '',
						leaseEnd: tenantData.leaseEnd || '',
						...(tenantData.tenantInvitationCodeId && {
							tenantInvitationCodeId: tenantData.tenantInvitationCodeId,
						}),
						createdAt: new Date().toISOString(),
					};

					tenants.push(newTenant);
					await updateDoc(propertyRef, { tenants });

					// If tenant is assigned to a unit, also add them to the unit's occupants
					if (tenantData.unit) {
						const unitsQuery = query(
							collection(db, 'units'),
							where('propertyId', '==', tenantData.propertyId),
							where('name', '==', tenantData.unit),
						);
						const unitsSnapshot = await getDocs(unitsQuery);

						if (!unitsSnapshot.empty) {
							const unitDoc = unitsSnapshot.docs[0];
							const unitData = unitDoc.data();
							const occupants = unitData.occupants || [];

							// Add tenant to unit's occupants array
							const tenantOccupant = {
								id: newTenant.id,
								firstName: newTenant.firstName,
								lastName: newTenant.lastName,
								email: newTenant.email,
								phone: newTenant.phone,
								leaseStart: newTenant.leaseStart,
								leaseEnd: newTenant.leaseEnd,
							};

							occupants.push(tenantOccupant);
							await updateDoc(unitDoc.ref, { occupants });
						} else {
							console.log('No unit found with name:', tenantData.unit);
						}
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'Units'],
		}),

		updateTenant: builder.mutation<
			void,
			{
				propertyId: string;
				tenantId: string;
				updates: Partial<{
					firstName: string;
					lastName: string;
					email: string;
					phone: string;
					unit: string;
					leaseStart: string;
					leaseEnd: string;
					tenantInvitationCodeId: string;
				}>;
			}
		>({
			async queryFn({ propertyId, tenantId, updates }) {
				try {
					const propertyRef = doc(db, 'properties', propertyId);
					const propertySnap = await getDoc(propertyRef);

					if (!propertySnap.exists()) {
						return { error: 'Property not found' };
					}

					const property = propertySnap.data();
					const tenants = property.tenants || [];
					const existingTenant = tenants.find((t: any) => t.id === tenantId);

					// Update tenant in property
					const updatedTenants = tenants.map((tenant: any) =>
						tenant.id === tenantId
							? {
									...tenant,
									...updates,
									updatedAt: new Date().toISOString(),
							  }
							: tenant,
					);

					await updateDoc(propertyRef, { tenants: updatedTenants });

					// Handle unit occupant updates
					const oldUnit = existingTenant?.unit;
					const newUnit = updates.unit;

					// Remove from old unit if unit changed
					if (oldUnit && oldUnit !== newUnit) {
						const oldUnitQuery = query(
							collection(db, 'units'),
							where('propertyId', '==', propertyId),
							where('name', '==', oldUnit),
						);
						const oldUnitSnapshot = await getDocs(oldUnitQuery);
						if (!oldUnitSnapshot.empty) {
							const oldUnitDoc = oldUnitSnapshot.docs[0];
							const oldUnitData = oldUnitDoc.data();
							const occupants = (oldUnitData.occupants || []).filter(
								(occupant: any) => occupant.id !== tenantId,
							);
							await updateDoc(oldUnitDoc.ref, { occupants });
						}
					}

					// Add to new unit if assigned
					if (newUnit && (!oldUnit || oldUnit !== newUnit)) {
						const newUnitQuery = query(
							collection(db, 'units'),
							where('propertyId', '==', propertyId),
							where('name', '==', newUnit),
						);
						const newUnitSnapshot = await getDocs(newUnitQuery);
						if (!newUnitSnapshot.empty) {
							const newUnitDoc = newUnitSnapshot.docs[0];
							const newUnitData = newUnitDoc.data();
							const occupants = newUnitData.occupants || [];

							// Find updated tenant data
							const updatedTenant = updatedTenants.find(
								(t: any) => t.id === tenantId,
							);
							const tenantOccupant = {
								id: updatedTenant.id,
								firstName: updatedTenant.firstName,
								lastName: updatedTenant.lastName,
								email: updatedTenant.email,
								phone: updatedTenant.phone,
								leaseStart: updatedTenant.leaseStart,
								leaseEnd: updatedTenant.leaseEnd,
							};

							occupants.push(tenantOccupant);
							await updateDoc(newUnitDoc.ref, { occupants });
						} else {
							console.log('New unit not found:', newUnit);
						}
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'Units'],
		}),

		createTenantInvitationCode: builder.mutation<
			TenantInvitationCode,
			{ propertyId?: string; tenantEmail?: string; code: string }
		>({
			async queryFn({ propertyId, tenantEmail, code }) {
				try {
					const createInvite = httpsCallable<
						{ propertyId?: string; tenantEmail?: string; code: string },
						TenantInvitationCode
					>(functions, 'createTenantInvitationCode');
					const result = await createInvite({
						propertyId,
						tenantEmail,
						code,
					});
					return {
						data: result.data,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TenantInvitationCodes'],
		}),

		revokeTenantInvitationCode: builder.mutation<
			void,
			{ propertyId?: string; tenantEmail: string }
		>({
			async queryFn({ propertyId, tenantEmail }) {
				try {
					const revokeInvite = httpsCallable<
						{ propertyId?: string; tenantEmail: string },
						{ success: boolean; revokedCount: number }
					>(functions, 'revokeTenantInvitationCode');
					await revokeInvite({ propertyId, tenantEmail });
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TenantInvitationCodes'],
		}),

		getTenantInvitationCode: builder.query<TenantInvitationCode | null, string>(
			{
				async queryFn(promoCodeId) {
					try {
						const docRef = doc(db, 'tenantInvitationCodes', promoCodeId);
						const docSnap = await getDoc(docRef);
						if (docSnap.exists()) {
							return {
								data: {
									id: docSnap.id,
									...docSnap.data(),
								} as TenantInvitationCode,
							};
						} else {
							return { data: null };
						}
					} catch (error: any) {
						return { error: error.message };
					}
				},
				providesTags: ['TenantInvitationCodes'],
			},
		),

		getTenantInvitationCodesByEmail: builder.query<
			TenantInvitationCode[],
			string
		>({
			async queryFn(tenantEmail) {
				try {
					const targetUserId = await resolveTargetUserId();
					const q = query(
						collection(db, 'tenantInvitationCodes'),
						where('accountId', '==', targetUserId),
						where('tenantEmail', '==', tenantEmail.toLowerCase()),
						orderBy('createdAt', 'desc'),
					);
					const snapshot = await getDocs(q);
					const promoCodes = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as TenantInvitationCode[];
					return { data: promoCodes };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TenantInvitationCodes'],
		}),

		removeTenant: builder.mutation<
			void,
			{ propertyId: string; tenantId: string }
		>({
			async queryFn({ propertyId, tenantId }) {
				try {
					const propertyRef = doc(db, 'properties', propertyId);
					const propertySnap = await getDoc(propertyRef);

					if (!propertySnap.exists()) {
						return { error: 'Property not found' };
					}

					const property = propertySnap.data();
					const tenants = property.tenants || [];
					const tenantToRemove = tenants.find((t: any) => t.id === tenantId);

					// Remove tenant from property
					const updatedTenants = tenants.filter((t: any) => t.id !== tenantId);
					await updateDoc(propertyRef, { tenants: updatedTenants });

					// Remove tenant from unit's occupants if they were assigned to a unit
					if (tenantToRemove?.unit) {
						const unitQuery = query(
							collection(db, 'units'),
							where('propertyId', '==', propertyId),
							where('name', '==', tenantToRemove.unit),
						);
						const unitSnapshot = await getDocs(unitQuery);
						if (!unitSnapshot.empty) {
							const unitDoc = unitSnapshot.docs[0];
							const unitData = unitDoc.data();
							const occupants = (unitData.occupants || []).filter(
								(occupant: any) => occupant.id !== tenantId,
							);
							await updateDoc(unitDoc.ref, { occupants });
						}
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties'],
		}),

		// Tenant Profiles
		getTenantProfile: builder.query<TenantProfile, string>({
			async queryFn(userId) {
				try {
					const profileDoc = await getDoc(doc(db, 'tenantProfiles', userId));

					if (!profileDoc.exists()) {
						return { error: 'Tenant profile not found' };
					}

					const data = profileDoc.data() as TenantProfile;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TenantProfiles'],
		}),

		createTenantProfile: builder.mutation<
			TenantProfile,
			Partial<TenantProfile>
		>({
			async queryFn(profileData) {
				try {
					if (!profileData.userId) {
						return { error: 'User ID is required' };
					}
					const targetUserId = await resolveTargetUserId();

					const now = new Date().toISOString();
					const newProfile: Partial<TenantProfile> = {
						...profileData,
						accountId: (profileData as any).accountId || targetUserId,
						createdAt: now,
						updatedAt: now,
						profileCompleteness: 0,
					};

					// Use userId as document ID for easy lookup
					await setDoc(
						doc(db, 'tenantProfiles', profileData.userId),
						newProfile,
					);

					return {
						data: { id: profileData.userId, ...newProfile } as TenantProfile,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TenantProfiles'],
		}),

		updateTenantProfile: builder.mutation<
			TenantProfile,
			{ userId: string; updates: Partial<TenantProfile> }
		>({
			async queryFn({ userId, updates }) {
				try {
					const profileRef = doc(db, 'tenantProfiles', userId);
					const profileSnap = await getDoc(profileRef);

					if (!profileSnap.exists()) {
						return { error: 'Tenant profile not found' };
					}

					const existingProfile = profileSnap.data() as TenantProfile;
					const targetUserId = await resolveTargetUserId();
					const updatedData = {
						...updates,
						accountId:
							(updates as any).accountId ||
							(existingProfile as any).accountId ||
							targetUserId,
						updatedAt: new Date().toISOString(),
					};

					await updateDoc(profileRef, updatedData);

					const updatedProfile = {
						id: userId,
						...profileSnap.data(),
						...updatedData,
					} as TenantProfile;

					return { data: updatedProfile };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TenantProfiles'],
		}),

		getPublicTenantProfiles: builder.query<TenantProfile[], void>({
			async queryFn() {
				try {
					const profilesRef = collection(db, 'tenantProfiles');
					const q = query(profilesRef, where('isPublic', '==', true));
					const snapshot = await getDocs(q);

					const profiles = snapshot.docs
						.map((doc) => doc.data() as TenantProfile)
						.filter(Boolean) as TenantProfile[];

					return { data: profiles };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TenantProfiles'],
		}),
	}),
});

export const {
	useAddTenantMutation,
	useUpdateTenantMutation,
	useCreateTenantInvitationCodeMutation,
	useRevokeTenantInvitationCodeMutation,
	useGetTenantInvitationCodeQuery,
	useGetTenantInvitationCodesByEmailQuery,
	useLazyGetTenantInvitationCodeQuery,
	useLazyGetTenantInvitationCodesByEmailQuery,

	useRemoveTenantMutation,
	useGetTenantProfileQuery,
	useCreateTenantProfileMutation,
	useUpdateTenantProfileMutation,
	useGetPublicTenantProfilesQuery,
} = tenantSlice;
