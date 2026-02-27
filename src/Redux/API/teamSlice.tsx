import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	updateDoc,
	where,
} from '@firebase/firestore';
import { apiSlice, docToData } from './apiSlice';
import { auth, db } from '../../config/firebase';
import {
	TeamGroup,
	TeamMember,
	TeamMemberInvitationCode,
} from '../../types/Team.types';
import { resolveTargetUserId } from './accountContext';

export const teamSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Team endpoints
		getTeamMemberInvitationCodesByEmail: builder.query<
			TeamMemberInvitationCode[],
			string
		>({
			async queryFn(teamMemberEmail) {
				try {
					const q = query(
						collection(db, 'teamMemberInvitationCodes'),
						where('teamMemberEmail', '==', teamMemberEmail.toLowerCase()),
						orderBy('createdAt', 'desc'),
					);
					const snapshot = await getDocs(q);
					const invitationCodes = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as TeamMemberInvitationCode[];
					return { data: invitationCodes };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TeamMemberInvitationCodes'],
		}),

		createTeamMemberInvitationCode: builder.mutation<
			TeamMemberInvitationCode,
			{ teamMemberId: string; teamMemberEmail: string; code: string }
		>({
			async queryFn({ teamMemberId, teamMemberEmail, code }) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}

					const now = new Date().toISOString();
					const expiresAt = new Date(
						Date.now() + 7 * 24 * 60 * 60 * 1000,
					).toISOString(); // 7 days from now
					const promoData = {
						code,
						codeLower: code.toLowerCase(),
						status: 'active' as const,
						createdByUserId: currentUser.uid,
						createdByEmail: currentUser.email || undefined,
						teamMemberEmail: teamMemberEmail.toLowerCase(),
						teamMemberId, // Associate with specific team member
						createdAt: now,
						updatedAt: now,
						expiresAt,
					};

					const docRef = await addDoc(
						collection(db, 'teamMemberInvitationCodes'),
						promoData,
					);
					return {
						data: { id: docRef.id, ...promoData } as TeamMemberInvitationCode,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMemberInvitationCodes'],
		}),

		revokeTeamMemberInvitationCode: builder.mutation<
			void,
			{ teamMemberId: string }
		>({
			async queryFn({ teamMemberId }) {
				try {
					const clauses = [
						where('teamMemberId', '==', teamMemberId),
						where('status', '==', 'active'),
					];

					const q = query(
						collection(db, 'teamMemberInvitationCodes'),
						...clauses,
					);
					const snapshot = await getDocs(q);
					const now = new Date().toISOString();
					for (const docSnap of snapshot.docs) {
						await updateDoc(docSnap.ref, {
							status: 'revoked',
							revokedAt: now,
							updatedAt: now,
						});
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMemberInvitationCodes'],
		}),

		redeemTeamMemberInvitationCode: builder.mutation<
			void,
			{ promoCode: string; teamMemberEmail: string }
		>({
			async queryFn({ promoCode, teamMemberEmail }) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}

					const normalizedCode = promoCode.trim().toLowerCase();
					const q = query(
						collection(db, 'teamMemberInvitationCodes'),
						where('codeLower', '==', normalizedCode),
						where('status', '==', 'active'),
					);
					const snapshot = await getDocs(q);

					if (snapshot.empty) {
						return { error: 'Invalid or expired promo code' };
					}

					const promoDoc = snapshot.docs[0];

					// If a teamMemberEmail was provided, ensure the promo code is intended for that email.
					const promoData: any = promoDoc.data();
					if (
						teamMemberEmail &&
						promoData?.teamMemberEmail &&
						promoData.teamMemberEmail.toLowerCase() !==
							teamMemberEmail.toLowerCase()
					) {
						return { error: 'Promo code is not valid for this email' };
					}

					const now = new Date().toISOString();

					await updateDoc(promoDoc.ref, {
						status: 'redeemed',
						redeemedByUserId: currentUser.uid,
						redeemedByEmail: currentUser.email || undefined,
						redeemedAt: now,
						expiresAt: null, // Remove expiration for redeemed codes - team member keeps permanent access
						updatedAt: now,
					});

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMemberInvitationCodes'],
		}),

		// Team Group endpoints
		getTeamGroups: builder.query<TeamGroup[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					const q = query(
						collection(db, 'teamGroups'),
						where('accountId', '==', targetUserId),
					);
					const querySnapshot = await getDocs(q);
					const groups = querySnapshot.docs
						.map((groupDoc) => docToData(groupDoc) as TeamGroup)
						.filter(Boolean) as TeamGroup[];
					return { data: groups };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TeamGroups'],
		}),

		createTeamGroup: builder.mutation<TeamGroup, Omit<TeamGroup, 'id'>>({
			async queryFn(newGroup) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					const docRef = await addDoc(collection(db, 'teamGroups'), {
						...newGroup,
						userId: targetUserId,
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
						} as TeamGroup,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamGroups'],
		}),

		updateTeamGroup: builder.mutation<
			TeamGroup,
			{ id: string; updates: Partial<TeamGroup> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'teamGroups', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as TeamGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamGroups'],
		}),

		deleteTeamGroup: builder.mutation<void, string>({
			async queryFn(groupId: string) {
				try {
					await deleteDoc(doc(db, 'teamGroups', groupId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamGroups'],
		}),

		// Team Member endpoints
		getTeamMembers: builder.query<TeamMember[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					// Fetch all team members where userId matches current user
					const membersQuery = query(
						collection(db, 'teamMembers'),
						where('accountId', '==', targetUserId),
					);
					const membersSnapshot = await getDocs(membersQuery);
					const members = membersSnapshot.docs
						.map((memberDoc) => docToData(memberDoc) as TeamMember)
						.filter(Boolean) as TeamMember[];
					return { data: members };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TeamMembers'],
		}),

		createTeamMember: builder.mutation<TeamMember, Omit<TeamMember, 'id'>>({
			async queryFn(newMember) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					const docRef = await addDoc(collection(db, 'teamMembers'), {
						...newMember,
						userId: targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...newMember,
							userId: targetUserId,
							accountId: targetUserId,
						} as TeamMember,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMembers'],
		}),

		updateTeamMember: builder.mutation<
			TeamMember,
			{ id: string; updates: Partial<TeamMember> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'teamMembers', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as TeamMember };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMembers'],
		}),

		deleteTeamMember: builder.mutation<void, string>({
			async queryFn(memberId: string) {
				try {
					// Get the team member's email
					const memberDoc = await getDoc(doc(db, 'teamMembers', memberId));
					if (!memberDoc.exists()) {
						return { error: 'Team member not found' };
					}
					const memberData = memberDoc.data();
					const memberEmail = memberData.email;

					// Check for shared properties with this email
					const sharesQuery = query(
						collection(db, 'propertyShares'),
						where('sharedWithEmail', '==', memberEmail),
					);
					const sharesSnapshot = await getDocs(sharesQuery);
					if (!sharesSnapshot.empty) {
						return {
							error: 'Cannot remove team member: they have shared properties.',
						};
					}

					await deleteDoc(doc(db, 'teamMembers', memberId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMembers'],
		}),
	}),
});

export const {
	useGetTeamMemberInvitationCodesByEmailQuery,
	useRevokeTeamMemberInvitationCodeMutation,
	useRedeemTeamMemberInvitationCodeMutation,
	useLazyGetTeamMemberInvitationCodesByEmailQuery,
	useCreateTeamMemberInvitationCodeMutation,
	useGetTeamGroupsQuery,
	useCreateTeamGroupMutation,
	useUpdateTeamGroupMutation,
	useDeleteTeamGroupMutation,
	useGetTeamMembersQuery,
	useCreateTeamMemberMutation,
	useUpdateTeamMemberMutation,
	useDeleteTeamMemberMutation,
} = teamSlice;
