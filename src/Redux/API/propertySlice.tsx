import {
	doc,
	getDoc,
	query,
	collection,
	where,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import {
	PropertyShare,
	Suite,
	Unit,
	PropertyGroupMembership,
} from '../../types/Property.types';
import { PropertyGroup, Property } from '../Slices/propertyDataSlice';
import { apiSlice, docToData } from './apiSlice';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';

const PROPERTY_GROUP_MEMBERSHIPS_COLLECTION = 'propertyGroupMemberships';

const fetchPropertiesByIds = async (propertyIds: string[]): Promise<Property[]> => {
	if (propertyIds.length === 0) {
		return [];
	}

	const properties: Property[] = [];
	for (let i = 0; i < propertyIds.length; i += 10) {
		const batch = propertyIds.slice(i, i + 10);
		try {
			const propertiesQuery = query(
				collection(db, 'properties'),
				where('__name__', 'in', batch),
			);
			const propertiesSnapshot = await getDocs(propertiesQuery);
			const batchProperties = propertiesSnapshot.docs
				.map((propertyDoc) => docToData(propertyDoc) as Property)
				.filter(Boolean) as Property[];
			properties.push(...batchProperties);
		} catch (error) {
			console.warn('Could not fetch property batch by ids:', {
				batchSize: batch.length,
				error,
			});
		}
	}

	return properties;
};

const upsertPropertyGroupMembership = async (params: {
	accountId: string;
	groupId: string;
	propertyId: string;
	sortOrder?: number;
}) => {
	const { accountId, groupId, propertyId, sortOrder = Date.now() } = params;
	const now = new Date().toISOString();

	const membershipQuery = query(
		collection(db, PROPERTY_GROUP_MEMBERSHIPS_COLLECTION),
		where('propertyId', '==', propertyId),
	);
	const membershipSnapshot = await getDocs(membershipQuery);
	const existingMembershipDoc = membershipSnapshot.docs.find(
		(docSnapshot) => (docSnapshot.data()?.accountId || '') === accountId,
	);

	if (existingMembershipDoc) {
		await updateDoc(existingMembershipDoc.ref, {
			groupId,
			sortOrder,
			updatedAt: now,
		});
		return;
	}

	await addDoc(collection(db, PROPERTY_GROUP_MEMBERSHIPS_COLLECTION), {
		accountId,
		groupId,
		propertyId,
		sortOrder,
		createdAt: now,
		updatedAt: now,
	});
};

const deletePropertyGroupMemberships = async (
	propertyId: string,
	accountId?: string,
) => {
	const membershipQuery = query(
		collection(db, PROPERTY_GROUP_MEMBERSHIPS_COLLECTION),
		where('propertyId', '==', propertyId),
	);
	const membershipSnapshot = await getDocs(membershipQuery);
	for (const membershipDoc of membershipSnapshot.docs) {
		const membershipData = membershipDoc.data() || {};
		if (!accountId || membershipData.accountId === accountId) {
			await deleteDoc(membershipDoc.ref);
		}
	}
};

const propertySlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Property endpoints
		// Property Group endpoints
		getPropertyGroups: builder.query<PropertyGroup[], void>({
			async queryFn() {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
					// Get user's email for shared properties lookup
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const targetUserId = await resolveTargetUserId();

					// Get property groups
					const groupDocs = [] as any[];
					for (const accountId of accessibleAccountIds) {
						const groupsQuery = query(
							collection(db, 'propertyGroups'),
							where('accountId', '==', accountId),
						);
						const querySnapshot = await getDocs(groupsQuery);
						groupDocs.push(...querySnapshot.docs);
					}

					const uniqueGroupDocs = Array.from(
						new Map(
							groupDocs.map((groupDoc) => [groupDoc.id, groupDoc]),
						).values(),
					);

					const groups = uniqueGroupDocs
						.map((doc) => docToData(doc) as PropertyGroup)
						.filter(Boolean) as PropertyGroup[];

					const memberships: PropertyGroupMembership[] = [];
					for (const accountId of accessibleAccountIds) {
						try {
							const membershipsQuery = query(
								collection(db, PROPERTY_GROUP_MEMBERSHIPS_COLLECTION),
								where('accountId', '==', accountId),
							);
							const membershipsSnapshot = await getDocs(membershipsQuery);
							const membershipBatch = membershipsSnapshot.docs
								.map(
									(doc) => docToData(doc) as PropertyGroupMembership,
								)
								.filter(Boolean) as PropertyGroupMembership[];
							memberships.push(...membershipBatch);
						} catch (_membershipError) {
							// Graceful fallback for environments where propertyGroupMemberships
							// rules have not been deployed yet.
						}
					}

					const membershipsByGroupId = new Map<string, PropertyGroupMembership[]>();
					for (const membership of memberships) {
						if (!membership.groupId || !membership.propertyId) {
							continue;
						}

						const current = membershipsByGroupId.get(membership.groupId) || [];
						current.push(membership);
						membershipsByGroupId.set(membership.groupId, current);
					}

					for (const [groupId, groupMemberships] of membershipsByGroupId.entries()) {
						groupMemberships.sort((a, b) => {
							const aOrder = Number.isFinite(a.sortOrder)
								? a.sortOrder
								: Number.MAX_SAFE_INTEGER;
							const bOrder = Number.isFinite(b.sortOrder)
								? b.sortOrder
								: Number.MAX_SAFE_INTEGER;
							return aOrder - bOrder;
						});
						membershipsByGroupId.set(groupId, groupMemberships);
					}

					const membershipPropertyIds = Array.from(
						new Set(memberships.map((membership) => membership.propertyId).filter(Boolean)),
					);
					const membershipProperties = await fetchPropertiesByIds(membershipPropertyIds);
					const propertyById = new Map(
						membershipProperties.map((property) => [property.id, property]),
					);

					let shares: PropertyShare[] = [];
					let coOwnerSharedProperties: Property[] = [];
					let regularSharedProperties: Property[] = [];
					if (userEmail) {
						try {
							const sharesQuery = query(
								collection(db, 'propertyShares'),
								where('sharedWithEmail', '==', userEmail),
							);
							const sharesSnapshot = await getDocs(sharesQuery);
							shares = sharesSnapshot.docs
								.map((doc) => docToData(doc) as PropertyShare)
								.filter(Boolean) as PropertyShare[];

							const coOwnerShares = shares.filter(
								(share) => share.permission === 'co-owner',
							);
							const regularShares = shares.filter(
								(share) => share.permission !== 'co-owner',
							);

							coOwnerSharedProperties = await fetchPropertiesByIds(
								coOwnerShares.map((share) => share.propertyId),
							);
							regularSharedProperties = await fetchPropertiesByIds(
								regularShares.map((share) => share.propertyId),
							);
						} catch (sharesError) {
							console.warn('Could not fetch shared property links:', sharesError);
						}
					}

					// Fetch properties for each group
					const groupsWithProperties: PropertyGroup[] = await Promise.all(
						groups.map(async (group) => {
							const isSharedGroup =
								group.name?.toLowerCase() === 'shared properties';
							const isMyPropertiesGroup =
								group.name?.toLowerCase() === 'my properties';

							const groupMemberships = membershipsByGroupId.get(group.id) || [];
							let ownedProperties = groupMemberships
								.map((membership) => propertyById.get(membership.propertyId))
								.filter(Boolean) as Property[];

							// Legacy fallback for records that still only rely on property.groupId
							if (ownedProperties.length === 0) {
								const legacyQueryClauses = [where('groupId', '==', group.id)];
								if (group.accountId) {
									legacyQueryClauses.push(where('accountId', '==', group.accountId));
								}
								const propertiesQuery = query(
									collection(db, 'properties'),
									...legacyQueryClauses,
								);
								const propertiesSnapshot = await getDocs(propertiesQuery);
								ownedProperties = propertiesSnapshot.docs
									.map((doc) => docToData(doc) as Property)
									.filter(Boolean) as Property[];
							}

							let sharedProperties: Property[] = [];
							if (shares.length > 0) {
								if (isMyPropertiesGroup) {
									sharedProperties = [...coOwnerSharedProperties];
								} else if (isSharedGroup) {
									sharedProperties = [...regularSharedProperties];
								}
							}

							const allProperties = [...ownedProperties, ...sharedProperties];
							const uniqueProperties = Array.from(
								new Map(allProperties.map((p) => [p.id, p])).values(),
							);

							return {
								...group,
								properties: uniqueProperties,
							};
						}),
					);

					// Check if we need to create a "Shared Properties" group
					const hasSharedPropertiesGroup = groupsWithProperties.some(
						(group) => group.name?.toLowerCase() === 'shared properties',
					);

					let finalGroups: PropertyGroup[] = [...groupsWithProperties];

					// If no Shared Properties group exists, check if user has shared properties
					if (!hasSharedPropertiesGroup && userEmail) {
						const sharesQuery = query(
							collection(db, 'propertyShares'),
							where('sharedWithEmail', '==', userEmail),
						);
						const sharesSnapshot = await getDocs(sharesQuery);
						if (!sharesSnapshot.empty) {
							// User has shared properties, create the group
							try {
								const sharedGroupData = {
									name: 'Shared Properties',
									userId: targetUserId,
									accountId: targetUserId,
									properties: [],
									createdAt: new Date().toISOString(),
									updatedAt: new Date().toISOString(),
								};
								const sharedGroupRef = await addDoc(
									collection(db, 'propertyGroups'),
									sharedGroupData,
								);
								finalGroups.push({
									id: sharedGroupRef.id,
									...sharedGroupData,
								});
								// Note: Properties will be loaded on next query refresh
							} catch (error) {
								console.error('Error creating Shared Properties group:', error);
							}
						}
					}

					// Final fallback: if groups are missing but properties exist, expose a virtual group
					if (finalGroups.length === 0) {
						const fallbackProperties: Property[] = [];
						for (const accountId of accessibleAccountIds) {
							const accountPropertiesQuery = query(
								collection(db, 'properties'),
								where('accountId', '==', accountId),
							);
							const accountPropertiesSnapshot = await getDocs(
								accountPropertiesQuery,
							);
							const batch = accountPropertiesSnapshot.docs
								.map((doc) => docToData(doc) as Property)
								.filter(Boolean) as Property[];
							fallbackProperties.push(...batch);
						}

						const uniqueFallbackProperties = Array.from(
							new Map(
								fallbackProperties.map((property) => [property.id, property]),
							).values(),
						) as Property[];

						if (uniqueFallbackProperties.length > 0) {
							finalGroups.push({
								id: `virtual-${targetUserId}-my-properties`,
								name: 'My Properties',
								userId: targetUserId,
								accountId: targetUserId,
								properties: uniqueFallbackProperties,
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							});
						}
					}

					return { data: finalGroups };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyGroups', 'Properties', 'PropertyShares'],
		}),

		getPropertyGroup: builder.query<PropertyGroup, string>({
			async queryFn(groupId: string) {
				try {
					const docRef = doc(db, 'propertyGroups', groupId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as PropertyGroup;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyGroups'],
		}),

		createPropertyGroup: builder.mutation<
			PropertyGroup,
			Omit<PropertyGroup, 'id'>
		>({
			async queryFn(newGroup) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();

					const docRef = await addDoc(collection(db, 'propertyGroups'), {
						...newGroup,
						userId: targetUserId, // Ensure property group is owned by account owner
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...newGroup,
							userId: targetUserId,
							accountId: targetUserId,
						} as PropertyGroup,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyGroups'],
		}),

		updatePropertyGroup: builder.mutation<
			PropertyGroup,
			{ id: string; updates: Partial<PropertyGroup> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'propertyGroups', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as PropertyGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyGroups'],
		}),

		deletePropertyGroup: builder.mutation<void, string>({
			async queryFn(groupId: string) {
				try {
					await deleteDoc(doc(db, 'propertyGroups', groupId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyGroups'],
		}),

		// Property endpoints
		getProperties: builder.query<Property[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user's email for shared properties lookup
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;
					const accessibleAccountIds = await resolveAccessibleAccountIds();

					const accountGroupIds = new Map<string, string[]>();
					for (const accountId of accessibleAccountIds) {
						const groupsQuery = query(
							collection(db, 'propertyGroups'),
							where('accountId', '==', accountId),
						);
						const groupsSnapshot = await getDocs(groupsQuery);
						accountGroupIds.set(
							accountId,
							groupsSnapshot.docs.map((groupDoc) => groupDoc.id),
						);
					}

					const ownedProperties: Property[] = [];
					for (const [accountId, groupIds] of accountGroupIds.entries()) {
						if (groupIds.length === 0) {
							continue;
						}

						// Process in batches of 10 (Firestore limitation)
						for (let i = 0; i < groupIds.length; i += 10) {
							const batch = groupIds.slice(i, i + 10);
							try {
								const propertiesQuery = query(
									collection(db, 'properties'),
									where('accountId', '==', accountId),
									where('groupId', 'in', batch),
								);
								const propertiesSnapshot = await getDocs(propertiesQuery);
								const properties = propertiesSnapshot.docs
									.map((doc) => docToData(doc) as Property)
									.filter(Boolean) as Property[];
								ownedProperties.push(...properties);
							} catch (groupQueryError) {
								console.warn(
									'Could not fetch group-linked properties batch:',
									groupQueryError,
								);
							}
						}
					}

					const accountProperties: Property[] = [];
					for (const accountId of accessibleAccountIds) {
						const accountPropertiesQuery = query(
							collection(db, 'properties'),
							where('accountId', '==', accountId),
						);
						const accountPropertiesSnapshot = await getDocs(
							accountPropertiesQuery,
						);
						const accountPropertiesBatch = accountPropertiesSnapshot.docs
							.map((doc) => docToData(doc) as Property)
							.filter(Boolean) as Property[];
						accountProperties.push(...accountPropertiesBatch);
					}

					// Also fetch properties where user is a co-owner
					let coOwnerProperties: Property[] = [];
					for (const accountId of accessibleAccountIds) {
						try {
							const coOwnerPropertiesQuery = query(
								collection(db, 'properties'),
								where('accountId', '==', accountId),
								where('coOwners', 'array-contains', userId),
							);
							const coOwnerPropertiesSnapshot = await getDocs(
								coOwnerPropertiesQuery,
							);
							const coOwnerPropertiesBatch = coOwnerPropertiesSnapshot.docs
								.map((doc) => docToData(doc) as Property)
								.filter(Boolean) as Property[];
							coOwnerProperties.push(...coOwnerPropertiesBatch);
						} catch (coOwnerError) {
							console.warn('Could not fetch co-owner properties:', coOwnerError);
						}
					}

					// Also fetch properties where user is an administrator
					let adminProperties: Property[] = [];
					for (const accountId of accessibleAccountIds) {
						try {
							const adminPropertiesQuery = query(
								collection(db, 'properties'),
								where('accountId', '==', accountId),
								where('administrators', 'array-contains', userId),
							);
							const adminPropertiesSnapshot = await getDocs(adminPropertiesQuery);
							const adminPropertiesBatch = adminPropertiesSnapshot.docs
								.map((doc) => docToData(doc) as Property)
								.filter(Boolean) as Property[];
							adminProperties.push(...adminPropertiesBatch);
						} catch (adminError) {
							console.warn('Could not fetch admin properties:', adminError);
						}
					}

					// Get shared properties - separate co-owners from regular shares
					const coOwnerSharedProperties: Property[] = [];
					const regularSharedProperties: Property[] = [];
					if (userEmail) {
						try {
							const sharesQuery = query(
								collection(db, 'propertyShares'),
								where('sharedWithEmail', '==', userEmail),
							);
							const sharesSnapshot = await getDocs(sharesQuery);
							const shares = sharesSnapshot.docs
								.map((doc) => docToData(doc) as PropertyShare)
								.filter(Boolean) as PropertyShare[];

							const coOwnerShares = shares.filter(
								(share) => share.permission === 'co-owner',
							);
							const regularShares = shares.filter(
								(share) => share.permission !== 'co-owner',
							);

							// Process co-owner shares (treated as ownership)
							const coOwnerPropertyIds = coOwnerShares.map(
								(share) => share.propertyId,
							);
							if (coOwnerPropertyIds.length > 0) {
								// Process in batches of 10
								for (let i = 0; i < coOwnerPropertyIds.length; i += 10) {
									const batch = coOwnerPropertyIds.slice(i, i + 10);
									const propertiesQuery = query(
										collection(db, 'properties'),
										where('__name__', 'in', batch),
									);
									const propertiesSnapshot = await getDocs(propertiesQuery);
									const properties = propertiesSnapshot.docs
										.map((doc) => docToData(doc) as Property)
										.filter(Boolean) as Property[];
									coOwnerSharedProperties.push(...properties);
								}
							}

							// Process regular shares
							const regularPropertyIds = regularShares.map(
								(share) => share.propertyId,
							);
							if (regularPropertyIds.length > 0) {
								// Process in batches of 10
								for (let i = 0; i < regularPropertyIds.length; i += 10) {
									const batch = regularPropertyIds.slice(i, i + 10);
									const propertiesQuery = query(
										collection(db, 'properties'),
										where('__name__', 'in', batch),
									);
									const propertiesSnapshot = await getDocs(propertiesQuery);
									const properties = propertiesSnapshot.docs
										.map((doc) => docToData(doc) as Property)
										.filter(Boolean) as Property[];
									regularSharedProperties.push(...properties);
								}
							}
						} catch (shareLookupError) {
							console.warn(
								'Could not fetch shared/co-owner properties:',
								shareLookupError,
							);
						}
					}

					// Combine and deduplicate
					const allProperties = [
						...accountProperties,
						...ownedProperties,
						...coOwnerProperties,
						...coOwnerSharedProperties,
						...adminProperties,
						...regularSharedProperties,
					];
					console.log('DEBUG getProperties: allProperties breakdown:', {
						accountProperties: accountProperties.length,
						ownedProperties: ownedProperties.length,
						coOwnerProperties: coOwnerProperties.length,
						coOwnerSharedProperties: coOwnerSharedProperties.length,
						adminProperties: adminProperties.length,
						regularSharedProperties: regularSharedProperties.length,
						total: allProperties.length,
					});
					const uniqueProperties = Array.from(
						new Map(allProperties.map((p) => [p.id, p])).values(),
					);
					console.log(
						'DEBUG getProperties: uniqueProperties:',
						uniqueProperties.length,
					);
					console.log(
						'DEBUG getProperties: returning properties:',
						uniqueProperties.map((p: any) => ({ id: p.id, slug: p.slug })),
					);

					return { data: uniqueProperties };
				} catch (error: any) {
					console.error('DEBUG getProperties: ERROR:', error.message, error);
					return { error: error.message };
				}
			},
			providesTags: ['Properties', 'PropertyShares'],
		}),

		getProperty: builder.query<Property, string>({
			async queryFn(propertyId: string) {
				try {
					const docRef = doc(db, 'properties', propertyId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Property;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Properties'],
		}),

		createProperty: builder.mutation<Property, Omit<Property, 'id'>>({
			async queryFn(newProperty) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();

					const docRef = await addDoc(collection(db, 'properties'), {
						...newProperty,
						userId: targetUserId, // Ensure property is owned by account owner
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});

					if (newProperty.groupId) {
						await upsertPropertyGroupMembership({
							accountId: targetUserId,
							groupId: newProperty.groupId,
							propertyId: docRef.id,
							sortOrder: Date.now(),
						});
					}

					const savedSnapshot = await getDoc(doc(db, 'properties', docRef.id));
					const savedData = docToData(savedSnapshot) as Property;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups'],
		}),

		updateProperty: builder.mutation<
			Property,
			{ id: string; updates: Partial<Property> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'properties', id);
					const existingSnapshot = await getDoc(docRef);
					const existingData = existingSnapshot.data() || {};
					const accountId =
						String(existingData.accountId || '').trim() ||
						(await resolveTargetUserId());

					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});

					if ('groupId' in updates) {
						if (updates.groupId) {
							await upsertPropertyGroupMembership({
								accountId,
								groupId: updates.groupId,
								propertyId: id,
							});
						} else {
							await deletePropertyGroupMemberships(id, accountId);
						}
					}

					const savedSnapshot = await getDoc(docRef);
					const savedData = docToData(savedSnapshot) as Property;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups'],
		}),

		deleteProperty: builder.mutation<void, string>({
			async queryFn(propertyId: string) {
				try {
					const propertyRef = doc(db, 'properties', propertyId);
					const propertySnapshot = await getDoc(propertyRef);
					const propertyData = propertySnapshot.data() || {};
					const accountId = String(propertyData.accountId || '').trim() || undefined;

					await deletePropertyGroupMemberships(propertyId, accountId);

					// Delete the property
					await deleteDoc(propertyRef);

					// Delete all favorites for this property
					const favoritesQuery = query(
						collection(db, 'favorites'),
						where('propertyId', '==', propertyId),
					);
					const favoritesSnapshot = await getDocs(favoritesQuery);
					for (const favDoc of favoritesSnapshot.docs) {
						await deleteDoc(favDoc.ref);
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups', 'Favorites'],
		}),

		// Suites endpoints
		getSuites: builder.query<Suite[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'suites'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const suites = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as Suite[];
					return { data: suites };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Suites'],
		}),

		getSuite: builder.query<Suite, string>({
			async queryFn(suiteId: string) {
				try {
					const docRef = doc(db, 'suites', suiteId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Suite;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Suites'],
		}),

		createSuite: builder.mutation<Suite, Omit<Suite, 'id'>>({
			async queryFn(newSuite) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					const docRef = await addDoc(collection(db, 'suites'), {
						...newSuite,
						userId: targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...newSuite,
							userId: targetUserId,
							accountId: targetUserId,
						} as Suite,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		updateSuite: builder.mutation<
			Suite,
			{ id: string; updates: Partial<Suite> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'suites', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					const savedSnapshot = await getDoc(docRef);
					const savedData = docToData(savedSnapshot) as Suite;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		deleteSuite: builder.mutation<void, string>({
			async queryFn(suiteId: string) {
				try {
					await deleteDoc(doc(db, 'suites', suiteId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		// Units endpoints
		getUnits: builder.query<Unit[], string>({
			async queryFn(propertyId: string) {
				try {
					if (!propertyId) {
						return { data: [] };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const units: Unit[] = [];
					for (const accountId of accessibleAccountIds) {
						const q = query(
							collection(db, 'units'),
							where('accountId', '==', accountId),
							where('propertyId', '==', propertyId),
						);
						const querySnapshot = await getDocs(q);
						const batch = querySnapshot.docs.map(
							(doc) => docToData(doc) as Unit,
						);
						units.push(...batch);
					}
					const uniqueUnits = Array.from(
						new Map(units.map((unit) => [unit.id, unit])).values(),
					) as Unit[];
					return { data: uniqueUnits };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Units'],
		}),

		getUnit: builder.query<Unit, string>({
			async queryFn(unitId: string) {
				try {
					const docRef = doc(db, 'units', unitId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot) as Unit;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Units'],
		}),

		createUnit: builder.mutation<Unit, Omit<Unit, 'id'>>({
			async queryFn(newUnit) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					const docRef = await addDoc(collection(db, 'units'), {
						...newUnit,
						userId: targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...newUnit,
							userId: targetUserId,
							accountId: targetUserId,
						} as Unit,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		updateUnit: builder.mutation<Unit, { id: string; updates: Partial<Unit> }>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'units', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					const savedSnapshot = await getDoc(docRef);
					const savedData = docToData(savedSnapshot) as Unit;
					return { data: savedData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		deleteUnit: builder.mutation<void, string>({
			async queryFn(unitId: string) {
				try {
					await deleteDoc(doc(db, 'units', unitId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		// Get all units across all properties (for reports)
		getAllUnits: builder.query<Unit[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const units: Unit[] = [];
					for (const accountId of accessibleAccountIds) {
						const q = query(
							collection(db, 'units'),
							where('accountId', '==', accountId),
						);
						const querySnapshot = await getDocs(q);
						const batch = querySnapshot.docs.map(
							(doc) => docToData(doc) as Unit,
						);
						units.push(...batch);
					}
					const uniqueUnits = Array.from(
						new Map(units.map((unit) => [unit.id, unit])).values(),
					) as Unit[];
					return { data: uniqueUnits };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Units'],
		}),
	}),
});

export const {
	useGetPropertyGroupsQuery,
	useGetPropertyGroupQuery,
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
	useGetPropertiesQuery,
	useGetPropertyQuery,
	useCreatePropertyMutation,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useGetSuitesQuery,
	useGetSuiteQuery,
	useCreateSuiteMutation,
	useUpdateSuiteMutation,
	useDeleteSuiteMutation,
	useGetUnitsQuery,
	useGetUnitQuery,
	useCreateUnitMutation,
	useUpdateUnitMutation,
	useDeleteUnitMutation,
	useGetAllUnitsQuery,
} = propertySlice;
