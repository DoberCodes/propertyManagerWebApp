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
import { callFirebaseFunction } from '../../config/firebaseFunctions';
import {
	TeamGroup,
	TeamMember,
	TeamMemberInvitationCode,
} from '../../types/Team.types';
import { resolveTargetUserId } from './accountContext';
import {
	assertCanManageAdvancedTeamSettings,
	assertCanManageTeamMembers,
	canManageAdvancedTeamSettings,
} from './inviteCapabilities';
import { USER_ROLES } from '../../constants/roles';

const normalizeTeamMemberForPlan = async <T extends Partial<TeamMember>>(
	accountId: string,
	member: T,
): Promise<T> => {
	if (await canManageAdvancedTeamSettings(accountId)) {
		return member;
	}

	const rest = { ...(member as any) };
	delete rest.groupId;
	delete rest.linkedProperties;
	delete rest.role;
	return {
		...rest,
		role: USER_ROLES.ADMIN,
		linkedProperties: [],
	} as T;
};

export const teamSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Team endpoints
		getTeamMemberInvitationCodesByEmail: builder.query<
			TeamMemberInvitationCode[],
			string
		>({
			async queryFn(teamMemberEmail) {
				try {
					const targetUserId = await resolveTargetUserId();
					const q = query(
						collection(db, 'teamMemberInvitationCodes'),
						where('accountId', '==', targetUserId),
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
					const result = await callFirebaseFunction<
						{ teamMemberId: string; teamMemberEmail: string; code: string },
						TeamMemberInvitationCode
					>('createTeamMemberInvitationCode', {
						teamMemberId,
						teamMemberEmail,
						code,
					});
					return {
						data: result.data,
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
					await callFirebaseFunction<
						{ teamMemberId: string },
						{ success: boolean; revokedCount: number }
					>('revokeTeamMemberInvitationCode', { teamMemberId });
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
					await callFirebaseFunction<
						{ promoCode: string; teamMemberEmail: string },
						{
							success: boolean;
							accountId?: string | null;
							teamMemberId?: string | null;
						}
					>('redeemTeamMemberInvitationCode', { promoCode, teamMemberEmail });
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
					await assertCanManageAdvancedTeamSettings(targetUserId);
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
					const targetUserId = await resolveTargetUserId();
					await assertCanManageAdvancedTeamSettings(targetUserId);
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
					const targetUserId = await resolveTargetUserId();
					await assertCanManageAdvancedTeamSettings(targetUserId);
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
					await assertCanManageTeamMembers(targetUserId);
					const memberForPlan = await normalizeTeamMemberForPlan(
						targetUserId,
						newMember,
					);
					const docRef = await addDoc(collection(db, 'teamMembers'), {
						...memberForPlan,
						userId: targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...memberForPlan,
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
					const targetUserId = await resolveTargetUserId();
					await assertCanManageTeamMembers(targetUserId);
					const docRef = doc(db, 'teamMembers', id);
					const updatesForPlan = await normalizeTeamMemberForPlan(
						targetUserId,
						updates,
					);
					let existingMember: Partial<TeamMember> = {};
					try {
						const existingSnapshot = await getDoc(docRef);
						existingMember = existingSnapshot.exists()
							? (existingSnapshot.data() as Partial<TeamMember>)
							: {};
					} catch (existingMemberError) {
						console.warn(
							'Could not read existing team member before update:',
							existingMemberError,
						);
					}

					await updateDoc(docRef, {
						...updatesForPlan,
						updatedAt: new Date().toISOString(),
					});

					const linkedUserId =
						String(
							(updatesForPlan as any).userAccountId ||
								(updatesForPlan as any).redeemedByUserId ||
								(existingMember as any).userAccountId ||
								(existingMember as any).redeemedByUserId ||
								'',
						).trim();
					if (linkedUserId) {
						const linkedUserUpdates: Record<string, any> = {};
						(['firstName', 'lastName', 'title', 'phone', 'address', 'image', 'role'] as const).forEach(
							(field) => {
								const value = (updatesForPlan as any)[field];
								if (value !== undefined) {
									linkedUserUpdates[field] = value;
								}
							},
						);

						if (Object.keys(linkedUserUpdates).length > 0) {
							try {
								await updateDoc(doc(db, 'users', linkedUserId), {
									...linkedUserUpdates,
									updatedAt: new Date().toISOString(),
								});
							} catch (linkedUserError) {
								console.warn(
									'Team member saved, but linked user profile sync failed:',
									linkedUserError,
								);
							}
						}
					}

					return { data: { id, ...updatesForPlan } as TeamMember };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['TeamMembers'],
		}),

		deleteTeamMember: builder.mutation<void, string>({
			async queryFn(memberId: string) {
				try {
					const targetUserId = await resolveTargetUserId();
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
						where('ownerId', '==', targetUserId),
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
