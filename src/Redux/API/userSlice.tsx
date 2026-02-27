import {
	doc,
	updateDoc,
	query,
	collection,
	where,
	getDocs,
	addDoc,
	deleteDoc,
	getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { apiSlice, docToData } from './apiSlice';
import { SharePermission } from '../../constants/roles';
import { Property, PropertyShare } from '../../types/Property.types';
import { Favorite, UserInvitation } from '../../types/User.types';
import { User } from '../Slices/userSlice';
import {
	resolveAccessibleAccountIds,
} from './accountContext';

const userSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// User endpoints
		updateUser: builder.mutation<
			User,
			{ id: string; updates: Partial<Omit<User, 'id' | 'role'>> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'users', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as User };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: [],
		}),

		// Favorites endpoints
		getFavorites: builder.query<Favorite[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					const q = query(
						collection(db, 'favorites'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const favorites = querySnapshot.docs
						.map((doc) => doc.data() as Favorite)
						.filter(Boolean) as Favorite[];
					// Sort by timestamp descending (most recent first)
					favorites.sort((a, b) => b.timestamp - a.timestamp);
					return { data: favorites };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Favorites'],
		}),

		addFavorite: builder.mutation<
			Favorite,
			{ propertyId: string; title: string; slug: string }
		>({
			async queryFn({ propertyId, title, slug }) {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Check if already exists
					const q = query(
						collection(db, 'favorites'),
						where('userId', '==', userId),
						where('propertyId', '==', propertyId),
					);
					const existingSnapshot = await getDocs(q);

					if (!existingSnapshot.empty) {
						// Already favorited, return existing
						const existing = existingSnapshot.docs[0];
						return {
							data: {
								id: existing.id,
								...existing.data(),
							} as Favorite,
						};
					}

					// Create new favorite
					const favoriteData = {
						userId,
						propertyId,
						title,
						slug,
						timestamp: Date.now(),
						createdAt: new Date().toISOString(),
					};
					const docRef = await addDoc(
						collection(db, 'favorites'),
						favoriteData,
					);
					return { data: { id: docRef.id, ...favoriteData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Favorites'],
		}),

		removeFavorite: builder.mutation<void, { propertyId: string }>({
			async queryFn({ propertyId }) {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					const q = query(
						collection(db, 'favorites'),
						where('userId', '==', userId),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);

					// Delete all matching favorites (should only be one)
					const deletePromises = querySnapshot.docs.map((docSnapshot) =>
						deleteDoc(doc(db, 'favorites', docSnapshot.id)),
					);
					await Promise.all(deletePromises);

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Favorites'],
		}),

		// Property Sharing endpoints
		getPropertyShares: builder.query<PropertyShare[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'propertyShares'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const shares = querySnapshot.docs
						.map((doc) => docToData(doc) as PropertyShare)
						.filter(Boolean) as PropertyShare[];
					return { data: shares };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyShares'],
		}),

		getAllPropertySharesForUser: builder.query<PropertyShare[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user's email first
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userEmail = userDoc.data()?.email;

					if (!userEmail) {
						return { data: [] };
					}

					const accessibleAccountIds = await resolveAccessibleAccountIds();

					// Get all property groups for accessible accounts to find owned properties
					const groupIds: string[] = [];
					for (const accountId of accessibleAccountIds) {
						const groupsByAccountQuery = query(
							collection(db, 'propertyGroups'),
							where('accountId', '==', accountId),
						);
						const groupsByAccountSnapshot = await getDocs(groupsByAccountQuery);
						groupIds.push(...groupsByAccountSnapshot.docs.map((groupDoc) => groupDoc.id));

						// Legacy fallback: some groups may still use userId and no accountId
						const groupsByUserQuery = query(
							collection(db, 'propertyGroups'),
							where('userId', '==', accountId),
						);
						const groupsByUserSnapshot = await getDocs(groupsByUserQuery);
						groupIds.push(...groupsByUserSnapshot.docs.map((groupDoc) => groupDoc.id));
					}

					const uniqueGroupIds = Array.from(new Set(groupIds));

					let ownedPropertyIds: string[] = [];
					if (uniqueGroupIds.length > 0) {
						// Get all property IDs for these groups
						for (let i = 0; i < uniqueGroupIds.length; i += 10) {
							const batch = uniqueGroupIds.slice(i, i + 10);
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', 'in', batch),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							ownedPropertyIds.push(
								...propertiesSnapshot.docs.map((propertyDoc) => propertyDoc.id),
							);
						}
					}

					ownedPropertyIds = Array.from(new Set(ownedPropertyIds));

					// Get all shares for owned properties (shares created by this user)
					let allShares: PropertyShare[] = [];
					for (let i = 0; i < ownedPropertyIds.length; i += 10) {
						const batch = ownedPropertyIds.slice(i, i + 10);
						const sharesQuery = query(
							collection(db, 'propertyShares'),
							where('propertyId', 'in', batch),
						);
						const sharesSnapshot = await getDocs(sharesQuery);
						const shares = sharesSnapshot.docs
							.map((doc) => docToData(doc) as PropertyShare)
							.filter(Boolean) as PropertyShare[];
						allShares.push(...shares);
					}

					// Get all shares where this user is the recipient
					const receivedSharesQuery = query(
						collection(db, 'propertyShares'),
						where('sharedWithEmail', '==', userEmail),
					);
					const receivedSharesSnapshot = await getDocs(receivedSharesQuery);
					const receivedShares = receivedSharesSnapshot.docs
						.map((doc) => docToData(doc) as PropertyShare)
						.filter(Boolean) as PropertyShare[];
					allShares.push(...receivedShares);

					// Remove duplicates
					const uniqueShares = allShares.filter(
						(share, index, self) =>
							index === self.findIndex((s) => s.id === share.id),
					);

					return { data: uniqueShares };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyShares'],
		}),

		getAllMaintenanceHistoryForUser: builder.query<any[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user's email first
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;
					const accessibleAccountIds = await resolveAccessibleAccountIds();

					if (!userEmail) {
						return { data: [] };
					}

					// Get all property groups for accessible accounts to find owned properties
					const groupIds: string[] = [];
					for (const accountId of accessibleAccountIds) {
						const groupsQuery = query(
							collection(db, 'propertyGroups'),
							where('accountId', '==', accountId),
						);
						const groupsSnapshot = await getDocs(groupsQuery);
						groupIds.push(...groupsSnapshot.docs.map((doc) => doc.id));
					}

					let ownedPropertyIds: string[] = [];
					if (groupIds.length > 0) {
						// Get all property IDs for these groups
						for (let i = 0; i < groupIds.length; i += 10) {
							const batch = groupIds.slice(i, i + 10);
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', 'in', batch),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							propertiesSnapshot.docs.forEach((doc) => {
								ownedPropertyIds.push(doc.id);
							});
						}
					}

					// Get all shares where this user is the recipient
					const receivedSharesQuery = query(
						collection(db, 'propertyShares'),
						where('sharedWithEmail', '==', userEmail),
					);
					const receivedSharesSnapshot = await getDocs(receivedSharesQuery);
					const receivedShares = receivedSharesSnapshot.docs
						.map((doc) => docToData(doc) as PropertyShare)
						.filter(Boolean) as PropertyShare[];
					const sharedPropertyIds = receivedShares.map(
						(share) => share.propertyId,
					);

					// Combine all property IDs the user has access to
					const allPropertyIds = [...ownedPropertyIds, ...sharedPropertyIds];

					const accountMaintenanceHistory: Record<string, unknown>[] = [];
					for (const accountId of accessibleAccountIds) {
						const accountMaintenanceQuery = query(
							collection(db, 'maintenanceHistory'),
							where('accountId', '==', accountId),
						);
						const accountMaintenanceSnapshot = await getDocs(
							accountMaintenanceQuery,
						);
						const accountMaintenanceBatch = accountMaintenanceSnapshot.docs
							.map((doc) => docToData(doc) as Record<string, unknown>)
							.filter(Boolean) as Record<string, unknown>[];
						accountMaintenanceHistory.push(...accountMaintenanceBatch);
					}

					// Get all maintenance history for these properties
					let allMaintenanceHistory: any[] = [];
					for (let i = 0; i < allPropertyIds.length; i += 10) {
						const batch = allPropertyIds.slice(i, i + 10);
						try {
							const maintenanceQuery = query(
								collection(db, 'maintenanceHistory'),
								where('propertyId', 'in', batch),
							);
							const maintenanceSnapshot = await getDocs(maintenanceQuery);
							const maintenanceRecords = maintenanceSnapshot.docs
								.map((doc) => docToData(doc) as Record<string, unknown>)
								.filter(Boolean) as Record<string, unknown>[];
							allMaintenanceHistory.push(...maintenanceRecords);
						} catch (propertyHistoryError) {
							console.warn(
								'Could not fetch property-linked maintenance history batch:',
								propertyHistoryError,
							);
						}
					}

					allMaintenanceHistory = [
						...accountMaintenanceHistory,
						...allMaintenanceHistory,
					];

					// Remove duplicates
					const uniqueMaintenanceHistory = allMaintenanceHistory.filter(
						(record, index, self) =>
							index === self.findIndex((r) => r.id === record.id),
					);

					return { data: uniqueMaintenanceHistory };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['MaintenanceHistory'],
		}),

		getSharedPropertiesForUser: builder.query<Property[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user's email first
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userEmail = userDoc.data()?.email;

					if (!userEmail) {
						return { data: [] };
					}

					// Find all shares where this user has access
					const sharesQuery = query(
						collection(db, 'propertyShares'),
						where('sharedWithEmail', '==', userEmail),
					);
					const sharesSnapshot = await getDocs(sharesQuery);
					const shares = sharesSnapshot.docs
						.map((doc) => docToData(doc) as PropertyShare)
						.filter(Boolean) as PropertyShare[];

					// Get all shared properties
					const propertyIds = shares.map((share) => share.propertyId);
					if (propertyIds.length === 0) {
						return { data: [] };
					}

					const allProperties: Property[] = [];
					// Process in batches of 10 (Firestore limitation)
					for (let i = 0; i < propertyIds.length; i += 10) {
						const batch = propertyIds.slice(i, i + 10);
						const propertiesQuery = query(
							collection(db, 'properties'),
							where('__name__', 'in', batch),
						);
						const propertiesSnapshot = await getDocs(propertiesQuery);
						const properties = propertiesSnapshot.docs
							.map((doc) => docToData(doc) as Property)
							.filter(Boolean) as Property[];
						allProperties.push(...properties);
					}

					return { data: allProperties };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyShares', 'Properties'],
		}),

		createPropertyShare: builder.mutation<
			PropertyShare,
			Omit<PropertyShare, 'id' | 'createdAt' | 'updatedAt'>
		>({
			async queryFn(newShare) {
				try {
					const now = new Date().toISOString();
					const shareData = {
						...newShare,
						createdAt: now,
						updatedAt: now,
					};
					const docRef = await addDoc(
						collection(db, 'propertyShares'),
						shareData,
					);
					return { data: { id: docRef.id, ...shareData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyShares', 'Properties'],
		}),

		updatePropertyShare: builder.mutation<
			PropertyShare,
			{ id: string; permission: SharePermission }
		>({
			async queryFn({ id, permission }) {
				try {
					const docRef = doc(db, 'propertyShares', id);
					await updateDoc(docRef, {
						permission,
						updatedAt: new Date().toISOString(),
					});
					const updatedDoc = await getDoc(docRef);
					const data = updatedDoc.data() as PropertyShare;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyShares'],
		}),

		deletePropertyShare: builder.mutation<void, string>({
			async queryFn(shareId: string) {
				try {
					// Get the share document to find the associated invitation
					const shareDoc = await getDoc(doc(db, 'propertyShares', shareId));
					if (!shareDoc.exists()) {
						return { error: 'Property share not found' };
					}

					const shareData = shareDoc.data();
					const propertyId = shareData.propertyId;
					const sharedWithEmail = shareData.sharedWithEmail;

					// Delete the property share
					await deleteDoc(doc(db, 'propertyShares', shareId));

					// Find and delete the associated accepted invitation
					const invitationQuery = query(
						collection(db, 'userInvitations'),
						where('propertyId', '==', propertyId),
						where('toEmail', '==', sharedWithEmail),
						where('status', '==', 'accepted'),
					);
					const invitationSnapshot = await getDocs(invitationQuery);
					if (!invitationSnapshot.empty) {
						for (const invDoc of invitationSnapshot.docs) {
							await deleteDoc(invDoc.ref);
						}
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyShares', 'Properties', 'UserInvitations'],
		}),

		// User Invitations endpoints
		getUserInvitations: builder.query<UserInvitation[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser || !currentUser.email) {
						return { error: 'User not authenticated or email not available' };
					}
					const userEmail = currentUser.email;

					const q = query(
						collection(db, 'userInvitations'),
						where('toEmail', '==', userEmail),
						where('status', '==', 'pending'),
					);
					const querySnapshot = await getDocs(q);
					const invitations = querySnapshot.docs
						.map((doc) => doc.data() as UserInvitation)
						.filter(Boolean) as UserInvitation[];
					return { data: invitations };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['UserInvitations'],
		}),

		sendInvitation: builder.mutation<
			UserInvitation,
			Omit<UserInvitation, 'id' | 'createdAt' | 'expiresAt' | 'status'> & {
				isGuestInvitation?: boolean;
			}
		>({
			async queryFn(invitation) {
				try {
					const now = new Date();
					const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
					const invitationData = {
						...invitation,
						status: 'pending' as const,
						createdAt: now.toISOString(),
						expiresAt: expiresAt.toISOString(),
					};
					const docRef = await addDoc(
						collection(db, 'userInvitations'),
						invitationData,
					);

					// Create notification for recipient if user exists
					const normalizedEmail = invitation.toEmail.toLowerCase();
					const userQuery = query(
						collection(db, 'users'),
						where('email', '==', normalizedEmail),
					);
					const userSnapshot = await getDocs(userQuery);
					const recipientDoc = userSnapshot.docs[0];

					if (recipientDoc) {
						const notificationData = {
							userId: recipientDoc.id,
							type: 'share_invitation',
							title: 'Property Invitation',
							message: `${invitation.fromUserEmail} invited you to access "${invitation.propertyTitle}"`,
							data: {
								invitationId: docRef.id,
								propertyId: invitation.propertyId,
								propertyTitle: invitation.propertyTitle,
								fromUserId: invitation.fromUserId,
								fromUserEmail: invitation.fromUserEmail,
								permission: invitation.permission,
							},
							status: 'unread' as const,
							createdAt: now.toISOString(),
							updatedAt: now.toISOString(),
						};

						try {
							await addDoc(collection(db, 'notifications'), notificationData);
						} catch (notifError) {
							console.error(
								'Failed to create invitation notification:',
								notifError,
							);
						}
					}

					return { data: { id: docRef.id, ...invitationData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['UserInvitations'],
		}),

		acceptInvitation: builder.mutation<
			PropertyShare,
			{ invitationId: string; userId: string }
		>({
			async queryFn({ invitationId, userId }) {
				try {
					// Get the invitation
					const invitationRef = doc(db, 'userInvitations', invitationId);
					const invitationDoc = await getDoc(invitationRef);
					const invitation = invitationDoc.data() as UserInvitation;

					// Get user's email and name
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;
					const userFirstName = userData?.firstName;
					const userLastName = userData?.lastName;

					if (!userEmail) {
						return { error: 'User email not found' };
					}

					// Create property share
					const now = new Date().toISOString();
					const shareData = {
						propertyId: invitation.propertyId,
						ownerId: invitation.fromUserId,
						sharedWithUserId: userId,
						sharedWithEmail: userEmail,
						sharedWithFirstName: userFirstName,
						sharedWithLastName: userLastName,
						permission: invitation.permission,
						createdAt: now,
						updatedAt: now,
					};
					const shareRef = await addDoc(
						collection(db, 'propertyShares'),
						shareData,
					);

					// Update invitation status
					await updateDoc(invitationRef, { status: 'accepted' });

					// Ensure the recipient has a Shared Properties group
					const sharedGroupName = 'Shared Properties';
					const sharedGroupQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
						where('name', '==', sharedGroupName),
					);
					const sharedGroupSnapshot = await getDocs(sharedGroupQuery);
					if (sharedGroupSnapshot.empty) {
						const nowIso = new Date().toISOString();
						await addDoc(collection(db, 'propertyGroups'), {
							userId,
							accountId: userId,
							name: sharedGroupName,
							createdAt: nowIso,
							updatedAt: nowIso,
						});
					}

					// Create a notification for the recipient
					const recipientNotificationData = {
						userId,
						type: 'share_invitation',
						title: 'Property Shared',
						message: `${invitation.fromUserEmail} shared "${invitation.propertyTitle}" with you`,
						data: {
							propertyId: invitation.propertyId,
							propertyTitle: invitation.propertyTitle,
							fromUserId: invitation.fromUserId,
							fromUserEmail: invitation.fromUserEmail,
							permission: invitation.permission,
						},
						status: 'accepted',
						createdAt: now,
						updatedAt: now,
					};

					try {
						await addDoc(
							collection(db, 'notifications'),
							recipientNotificationData,
						);
					} catch (notifError) {
						console.error(
							'Failed to create recipient notification:',
							notifError,
						);
					}

					// Create a notification for the sender
					const senderNotificationData = {
						userId: invitation.fromUserId,
						type: 'share_invitation_accepted',
						title: 'Invitation Accepted',
						message: `${userEmail} accepted your invitation to share "${invitation.propertyTitle}"`,
						data: {
							propertyId: invitation.propertyId,
							propertyTitle: invitation.propertyTitle,
							userId: userId,
							userEmail: userEmail,
							permission: invitation.permission,
						},
						status: 'unread',
						createdAt: now,
						updatedAt: now,
					};

					try {
						await addDoc(
							collection(db, 'notifications'),
							senderNotificationData,
						);
					} catch (notifError) {
						console.error('Failed to create sender notification:', notifError);
					}

					return { data: { id: shareRef.id, ...shareData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: [
				'UserInvitations',
				'PropertyShares',
				'Properties',
				'TeamMembers',
				'TeamGroups',
			],
		}),

		rejectInvitation: builder.mutation<void, string>({
			async queryFn(invitationId: string) {
				try {
					const invitationRef = doc(db, 'userInvitations', invitationId);
					await updateDoc(invitationRef, { status: 'rejected' });
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['UserInvitations'],
		}),

		cancelInvitation: builder.mutation<void, string>({
			async queryFn(invitationId: string) {
				try {
					const invitationRef = doc(db, 'userInvitations', invitationId);
					await deleteDoc(invitationRef);
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['UserInvitations'],
		}),

		getPropertyInvitations: builder.query<UserInvitation[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'userInvitations'),
						where('propertyId', '==', propertyId),
						where('status', '==', 'pending'),
					);
					const querySnapshot = await getDocs(q);
					const invitations = querySnapshot.docs
						.map((doc) => doc.data() as UserInvitation)
						.filter(Boolean) as UserInvitation[];
					return { data: invitations };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['UserInvitations'],
		}),

		// Get all invitations for a property (pending and accepted) for the owner
		getAllPropertyInvitations: builder.query<UserInvitation[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'userInvitations'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const invitations = querySnapshot.docs
						.map((doc) => doc.data() as UserInvitation)
						.filter(Boolean)
						.sort(
							(a: any, b: any) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime(),
						) as UserInvitation[];
					return { data: invitations };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['UserInvitations'],
		}),

		getUserByEmail: builder.query<{ id: string; email: string } | null, string>(
			{
				async queryFn(email: string) {
					try {
						const q = query(
							collection(db, 'users'),
							where('email', '==', email.toLowerCase()),
						);
						const querySnapshot = await getDocs(q);

						if (querySnapshot.empty) {
							return { data: null };
						}

						const userDoc = querySnapshot.docs[0];
						return {
							data: {
								id: userDoc.id,
								email: userDoc.data().email,
							},
						};
					} catch (error: any) {
						return { error: error.message };
					}
				},
			},
		),

		getUserById: builder.query<User | null, string>({
			async queryFn(userId: string) {
				try {
					const docRef = doc(db, 'users', userId);
					const docSnapshot = await getDoc(docRef);

					if (!docSnapshot.exists()) {
						return { data: null };
					}

					const userData = docToData(docSnapshot) as User;
					return { data: userData };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),
	}),
});
export const {
	useUpdateUserMutation,
	useGetFavoritesQuery,
	useAddFavoriteMutation,
	useRemoveFavoriteMutation,
	// Property shares & invitations (moved into userSlice)
	useGetPropertySharesQuery,
	useGetAllPropertySharesForUserQuery,
	useGetAllMaintenanceHistoryForUserQuery,
	useGetSharedPropertiesForUserQuery,
	useCreatePropertyShareMutation,
	useUpdatePropertyShareMutation,
	useDeletePropertyShareMutation,
	useGetUserInvitationsQuery,
	useSendInvitationMutation,
	useAcceptInvitationMutation,
	useRejectInvitationMutation,
	useCancelInvitationMutation,
	useGetPropertyInvitationsQuery,
	useGetAllPropertyInvitationsQuery,
	useGetUserByEmailQuery,
	useGetUserByIdQuery,
} = userSlice;
