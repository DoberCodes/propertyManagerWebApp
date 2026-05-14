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
import { Favorite, UserInvitation } from '../../types/User.types';
import { User } from '../Slices/userSlice';
import {
	resolveAccessibleAccountIds,
} from './accountContext';

const MAX_FAVORITES = 5;

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
					const favoriteEntries = querySnapshot.docs
						.map((docSnapshot) => {
							const data = docSnapshot.data() as Favorite;
							return {
								...data,
								id: docSnapshot.id,
							};
						})
						.filter(Boolean) as Favorite[];

					favoriteEntries.sort((a, b) => b.timestamp - a.timestamp);

					if (favoriteEntries.length > MAX_FAVORITES) {
						const overflow = favoriteEntries.slice(MAX_FAVORITES);
						await Promise.all(
							overflow.map((favorite) =>
								deleteDoc(doc(db, 'favorites', favorite.id)),
							),
						);
					}

					return { data: favoriteEntries.slice(0, MAX_FAVORITES) };
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

					const userFavoritesSnapshot = await getDocs(
						query(collection(db, 'favorites'), where('userId', '==', userId)),
					);
					const userFavorites = userFavoritesSnapshot.docs
						.map((docSnapshot) => ({
							...(docSnapshot.data() as Favorite),
							id: docSnapshot.id,
						}))
						.sort((a, b) => a.timestamp - b.timestamp);

					if (userFavorites.length >= MAX_FAVORITES) {
						const deleteCount = userFavorites.length - MAX_FAVORITES + 1;
						const overflow = userFavorites.slice(0, deleteCount);
						await Promise.all(
							overflow.map((favorite) =>
								deleteDoc(doc(db, 'favorites', favorite.id)),
							),
						);
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

		getAllMaintenanceHistoryForUser: builder.query<any[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const accessibleAccountIds = await resolveAccessibleAccountIds();

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
					const ownedPropertyTitles = new Set<string>();
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
								const propertyData = docToData(doc) as
									| Record<string, unknown>
									| null;
								ownedPropertyIds.push(doc.id);
								const title = String(propertyData?.title || '').trim();
								if (title) {
									ownedPropertyTitles.add(title);
								}
							});
						}
					}

					const allPropertyIds = [...ownedPropertyIds];

				// Dual-read: maintenanceEvents (canonical) + maintenanceHistory (legacy)
				const collectionsToQuery = ['maintenanceEvents', 'maintenanceHistory'];
				const seenIds = new Set<string>();
				const allRecords: Record<string, unknown>[] = [];

				const addUnique = (docs: any[]) => {
					docs.forEach((d) => {
						const data = docToData(d) as Record<string, unknown> | null;
						if (data && !seenIds.has(data.id as string)) {
							seenIds.add(data.id as string);
							allRecords.push(data);
						}
					});
				};

				// Query by accountId across both collections
				for (const col of collectionsToQuery) {
					for (const accountId of accessibleAccountIds) {
						const q = query(collection(db, col), where('accountId', '==', accountId));
						const snap = await getDocs(q);
						addUnique(snap.docs);
					}
				}

				// Query by propertyId across both collections
				for (const col of collectionsToQuery) {
					for (let i = 0; i < allPropertyIds.length; i += 10) {
						const batch = allPropertyIds.slice(i, i + 10);
						try {
							const q = query(collection(db, col), where('propertyId', 'in', batch));
							const snap = await getDocs(q);
							addUnique(snap.docs);
						} catch (e) {
							console.warn('Could not fetch property-linked maintenance batch:', e);
						}
					}
				}

				// Fallback for legacy records that only stored propertyTitle
				const propertyTitleList = Array.from(ownedPropertyTitles);
				for (const col of collectionsToQuery) {
					for (const accountId of accessibleAccountIds) {
						for (let i = 0; i < propertyTitleList.length; i += 10) {
							const titleBatch = propertyTitleList.slice(i, i + 10);
							try {
								const q = query(
									collection(db, col),
									where('accountId', '==', accountId),
									where('propertyTitle', 'in', titleBatch),
								);
								const snap = await getDocs(q);
								addUnique(snap.docs);
							} catch (e) {
								console.warn('Could not fetch legacy title-linked maintenance batch:', e);
							}
						}
					}
				}

				return { data: allRecords };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['MaintenanceHistory', 'MaintenanceEvents'],
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
			void,
			{ invitationId: string; userId: string }
		>({
			async queryFn({ invitationId, userId }) {
				try {
					void invitationId;
					void userId;
					return { error: 'Shared properties feature has been removed.' };

					/*
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
					*/
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: [
				'UserInvitations',
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
	useGetAllMaintenanceHistoryForUserQuery,
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
