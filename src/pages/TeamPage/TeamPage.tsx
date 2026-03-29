import React, { useState, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { selectCanInviteTeamMembers } from '../../Redux/selectors/permissionSelectors';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { TeamMember } from '../../Redux/Slices/teamSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../../Components/Library/PageHeaders';
import {
	DialogOverlay,
	DialogContent,
	DialogHeader as LibraryDialogHeader,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
} from '../../Components/Library';
import { FileUploader } from '../../Components/Library/FileUploader';
import {
	uploadTeamMemberFile,
	uploadTeamMemberImage,
} from '../../utils/teamMemberFileUpload';
import {
	Wrapper,
	AddTeamGroupButton,
	TeamGroupSection,
	TeamGroupHeader,
	TeamGroupTitle,
	TeamGroupNameInput,
	TeamGroupActions,
	TeamGroupActionButton,
	TeamMembersGrid,
	TeamMemberCard,
	TeamMemberActions,
	TeamMemberActionButton,
	TeamMemberImagePlaceholder,
	TeamMemberName,
	TeamMemberTitle,
	AddTeamMemberCard,
	AddIcon,
	AddText,
	DialogTitle,
	DialogCloseButton,
	DialogBody,
	LeftColumn,
	RightColumn,
	ImageUploadSection,
	ImagePreview,
	SectionTitle,
	PropertyMultiSelect,
	PropertyCheckbox,
	QuickTaskHistory,
	TaskHistoryItem,
	FileUploadSection,
	FileList,
	FileItem,
	DialogFooter,
	CancelButton,
	SaveButton,
} from './TeamPage.styles';
import { WarningDialog } from '../../Components/Library/WarningDialog';
import {
	useCreateTeamGroupMutation,
	useCreateTeamMemberInvitationCodeMutation,
	useCreateTeamMemberMutation,
	useDeleteTeamGroupMutation,
	useDeleteTeamMemberMutation,
	useGetTeamGroupsQuery,
	useGetTeamMembersQuery,
	useRevokeTeamMemberInvitationCodeMutation,
	useUpdateTeamGroupMutation,
	useUpdateTeamMemberMutation,
} from '../../Redux/API/teamSlice';

const ROLE_OPTIONS = [
	{ value: 'property_manager', label: 'Property Manager' },
	{ value: 'assistant_manager', label: 'Assistant Manager' },
	{ value: 'maintenance', label: 'Maintenance' },
	{ value: 'accounting', label: 'Accounting' },
	{ value: 'leasing', label: 'Leasing Agent' },
	{ value: 'admin', label: 'Administrator' },
];

// Helper function to format expiration date
const formatExpirationDate = (expiresAt: string) => {
	if (!expiresAt) {
		return 'No expiration';
	}

	const date = new Date(expiresAt);

	// Check if date is valid
	if (isNaN(date.getTime())) {
		return 'Invalid date';
	}

	const now = new Date();
	const diffTime = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays < 0) {
		return 'Expired';
	} else if (diffDays === 0) {
		return 'Expires today';
	} else if (diffDays === 1) {
		return 'Expires in 1 day';
	} else {
		return `Expires in ${diffDays} days`;
	}
};

export default function TeamPage() {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	// Use RTK Query hooks directly instead of Redux cache to avoid synchronization issues
	const { data: teamGroups = [] } = useGetTeamGroupsQuery();
	const { data: teamMembers = [] } = useGetTeamMembersQuery();
	// Select property groups and derive properties with memoization
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const properties = useMemo(
		() => propertyGroups.flatMap((g) => g.properties || []),
		[propertyGroups],
	);

	// Firebase mutations
	const [createTeamGroup] = useCreateTeamGroupMutation();
	const [updateTeamGroup] = useUpdateTeamGroupMutation();
	const [deleteTeamGroupApi] = useDeleteTeamGroupMutation();
	const [createTeamMember] = useCreateTeamMemberMutation();
	const [updateTeamMemberApi] = useUpdateTeamMemberMutation();
	const [deleteTeamMemberApi] = useDeleteTeamMemberMutation();
	const [createTeamMemberInvitationCode] =
		useCreateTeamMemberInvitationCodeMutation();
	const [revokeTeamMemberInvitationCode] =
		useRevokeTeamMemberInvitationCodeMutation();
	const [createNotification] = useCreateNotificationMutation();

	// WarningDialog state
	const [warningDialogOpen, setWarningDialogOpen] = useState(false);
	const [warningDialogMessage, setWarningDialogMessage] = useState('');
	const [warningDialogTitle, setWarningDialogTitle] = useState('Warning');
	const [warningDialogConfirmText, setWarningDialogConfirmText] =
		useState('Confirm');
	const [warningDialogCancelText, setWarningDialogCancelText] =
		useState('Cancel');
	const [warningDialogOnConfirm, setWarningDialogOnConfirm] = useState(
		() => () => {},
	);

	// Combine groups with their members
	const groupsWithMembers = useMemo(() => {
		// Merge team members into their groups
		const normalized = teamGroups.map((group) => ({
			...group,
			members: teamMembers.filter((m) => m.groupId === group.id),
		}));

		// Find team members not associated with any group
		const orphanMembers = teamMembers.filter(
			(m) => !teamGroups.some((g) => g.id === m.groupId),
		);

		// If there are orphan members, add a fallback group
		let allGroups = [...normalized];
		if (orphanMembers.length > 0) {
			allGroups.push({
				id: 'orphan',
				userId: '',
				name: 'Ungrouped Team Members',
				linkedProperties: [],
				members: orphanMembers,
			});
		}

		return allGroups;
	}, [teamGroups, teamMembers]);

	// Check if user can manage team members based on subscription plan (selector)
	const canManage = useSelector(selectCanInviteTeamMembers);

	const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
	const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
	const [editingGroupName, setEditingGroupName] = useState<string>('');
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageUploadError, setImageUploadError] = useState<string | null>(null);
	const [isUploadingFiles, setIsUploadingFiles] = useState(false);
	const [fileUploadError, setFileUploadError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		role: 'property_manager',
		address: '',
		notes: '',
		linkedProperties: [] as string[],
		enableInvitationCode: true,
	});
	const [uploadedFiles, setUploadedFiles] = useState<TeamMember['files']>([]);
	const [generatedInvitationCode, setGeneratedInvitationCode] =
		useState<string>('');

	// Generate invitation code only once when modal opens for new team members
	React.useEffect(() => {
		if (
			showTeamMemberDialog &&
			!editingMember &&
			formData.enableInvitationCode !== false &&
			formData.firstName &&
			formData.lastName &&
			!generatedInvitationCode
		) {
			const namePart = `${formData.firstName.charAt(
				0,
			)}${formData.lastName.charAt(0)}`.toUpperCase();
			const randomPart = Math.random()
				.toString(36)
				.substring(2, 8)
				.toUpperCase();
			const promoCode = `TEAM-${namePart}${randomPart}`;
			setGeneratedInvitationCode(promoCode);
		}
	}, [
		showTeamMemberDialog,
		editingMember,
		formData.firstName,
		formData.lastName,
		formData.enableInvitationCode,
		generatedInvitationCode,
	]);

	// Filter out tenants from team management - tenants belong to properties, not teams
	const filteredTeamGroups = groupsWithMembers.map((group) => ({
		...group,
		members: (group.members || []).filter((member) => member.role !== 'tenant'),
	}));

	const handleAddTeamMember = (groupId?: string | null) => {
		setCurrentGroupId(groupId || null);
		setEditingMember(null);
		setFormData({
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			role: 'property_manager',
			address: '',
			notes: '',
			linkedProperties: [],
			enableInvitationCode: true,
		});
		setImagePreview(null);
		setUploadedFiles([]);
		setGeneratedInvitationCode(''); // Reset so it generates fresh for new member
		setShowTeamMemberDialog(true);
	};

	const handleImageUpload = async (file: File | null) => {
		if (!file || !currentUser) return;
		setImageUploadError(null);
		setIsUploadingImage(true);
		try {
			const imageUrl = await uploadTeamMemberImage(
				file,
				currentUser.id,
				editingMember?.id,
			);
			setImagePreview(imageUrl);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Failed to upload image. Please try again.';
			setImageUploadError(message);
			console.error('Team member image upload failed:', error);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleFileUpload = async (files: File[]) => {
		if (!files.length || !currentUser) return;
		setFileUploadError(null);
		setIsUploadingFiles(true);
		try {
			const uploaded = await Promise.all(
				files.map((file) =>
					uploadTeamMemberFile(file, currentUser.id, editingMember?.id),
				),
			);
			setUploadedFiles((prev) => [...prev, ...uploaded]);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Failed to upload files. Please try again.';
			setFileUploadError(message);
			console.error('Team member file upload failed:', error);
		} finally {
			setIsUploadingFiles(false);
		}
	};

	const handleRemoveFile = (fileId: string) => {
		setUploadedFiles((prev) =>
			prev.filter((file) => (file.url || file.id || file.name) !== fileId),
		);
	};

	const handleFormChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handlePropertyToggle = (propertyId: string) => {
		setFormData((prev) => ({
			...prev,
			linkedProperties: prev.linkedProperties.includes(propertyId)
				? prev.linkedProperties.filter((id) => id !== propertyId)
				: [...prev.linkedProperties, propertyId],
		}));
	};

	const handleSaveTeamMember = async () => {

		let invitationCodeId: string | undefined;
		let invitationCodeStatus: 'active' | 'revoked' | undefined;
		let invitationCodeExpiresAt: string | undefined;

		// Handle promo code logic only if enabled
		if (canManage && formData.enableInvitationCode) {
			// Property managers can always add team members
			// Generate or update promo code for the team member
			try {
				const promoCode = generatedInvitationCode;

				if ((editingMember as any)?.invitationCodeId) {
					// Update existing invitation code if it exists
					// For now, we'll create a new one since we don't have an update mutation
					const result = await createTeamMemberInvitationCode({
						teamMemberId: editingMember!.id,
						teamMemberEmail: formData.email,
						code: promoCode,
					}).unwrap();
					invitationCodeId = result.id;
					invitationCodeStatus = 'active';
					invitationCodeExpiresAt = result.expiresAt;
				} else {
					// Create new invitation code for new team member
					const result = await createTeamMemberInvitationCode({
						teamMemberId: '', // Will be set after team member is created
						teamMemberEmail: formData.email,
						code: promoCode,
					}).unwrap();
					invitationCodeId = result.id;
					invitationCodeStatus = 'active';
					invitationCodeExpiresAt = result.expiresAt;
				}
			} catch (error) {
				console.error('Failed to create invitation code:', error);
				// Continue without invitation code for now
			}
		} else if (editingMember) {
			// When editing, preserve existing invitation code data if not changing the setting
			invitationCodeId = (editingMember as any).invitationCodeId;
			invitationCodeStatus = (editingMember as any).invitationCodeStatus;
			invitationCodeExpiresAt = (editingMember as any).invitationCodeExpiresAt;
		}

		const memberData = {
			...(currentGroupId && { groupId: currentGroupId }),
			userId: currentUser!.id,
			firstName: formData.firstName,
			lastName: formData.lastName,
			title: `${
				ROLE_OPTIONS.find((r) => r.value === formData.role)?.label || ''
			}`,
			email: formData.email,
			phone: formData.phone,
			role: formData.role,
			address: formData.address,
			image: imagePreview || editingMember?.image || '',
			notes: formData.notes,
			linkedProperties: formData.linkedProperties,
			taskHistory: editingMember?.taskHistory || [],
			files: uploadedFiles,
			invitationCodeId,
			invitationCodeStatus,
			invitationCodeExpiresAt,
		};

		try {
			if (editingMember) {
				await updateTeamMemberApi({
					id: editingMember.id,
					updates: memberData,
				}).unwrap();

				// Create notification for team member update
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'team_member_updated',
						title: 'Team Member Updated',
						message: `Team member "${formData.firstName} ${formData.lastName}" has been updated`,
						data: {
							memberId: editingMember.id,
							memberName: `${formData.firstName} ${formData.lastName}`,
							...(currentGroupId && { groupId: currentGroupId }),
						},
						status: 'unread',
						actionUrl: `/team`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			} else {
				const result = await createTeamMember(memberData).unwrap();

				// Update invitation code with team member ID if we created one
				if (invitationCodeId && canManage) {
					try {
						// Update the invitation code document to include the team member ID
						const invitationRef = doc(
							db,
							'teamMemberInvitationCodes',
							invitationCodeId,
						);
						await updateDoc(invitationRef, {
							teamMemberId: result.id,
							updatedAt: new Date().toISOString(),
						});
					} catch (promoError) {
						console.error(
							'Failed to update promo code with team member ID:',
							promoError,
						);
					}
				}

				// Create notification for team member creation
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'team_member_added',
						title: 'Team Member Added',
						message: `Team member "${formData.firstName} ${formData.lastName}" has been added`,
						data: {
							memberId: result.id,
							memberName: `${formData.firstName} ${formData.lastName}`,
							...(currentGroupId && { groupId: currentGroupId }),
						},
						status: 'unread',
						actionUrl: `/team`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			}
		} catch (error) {
			console.error('Error saving team member:', error);
		}

		setShowTeamMemberDialog(false);
	};

	const handleEditTeamMember = (
		member: TeamMember,
		groupId?: string | null,
	) => {
		const resolvedGroupId =
			(typeof member.groupId === 'string' && member.groupId.trim()) ||
			(groupId && groupId !== 'orphan' ? groupId : null);
		setCurrentGroupId(resolvedGroupId || null);
		setEditingMember(member);
		setFormData({
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			phone: member.phone,
			role: member.role,
			address: member.address,
			notes: member.notes,
			linkedProperties: member.linkedProperties,
			enableInvitationCode: !!(member as any).invitationCodeId, // Enable if they already have an invitation code
		});
		setImagePreview(member.image || null);
		setUploadedFiles(member.files || []);
		setGeneratedInvitationCode(''); // Reset - will be generated if needed
		setShowTeamMemberDialog(true);
	};

	const handleDeleteTeamMember = async (memberId: string) => {
		try {
			const memberToDelete = groupsWithMembers
				.flatMap((g) => g.members || [])
				.find((m) => m?.id === memberId);
			await deleteTeamMemberApi(memberId).unwrap();

			// Revoke invitation code if it exists
			if ((memberToDelete as any)?.invitationCodeId) {
				try {
					await revokeTeamMemberInvitationCode({
						teamMemberId: memberId,
					}).unwrap();
				} catch (revokeError) {
					console.error('Failed to revoke invitation code:', revokeError);
				}
			}

			// Create notification for team member deletion
			try {
				if (memberToDelete) {
					await createNotification({
						userId: currentUser!.id,
						type: 'team_member_removed',
						title: 'Team Member Removed',
						message: `Team member "${memberToDelete.firstName} ${memberToDelete.lastName}" has been removed`,
						data: {
							memberId: memberId,
							memberName: `${memberToDelete.firstName} ${memberToDelete.lastName}`,
						},
						status: 'unread',
						actionUrl: `/team`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				}
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}
		} catch (error) {
			console.error('Error deleting team member:', error);
		}
	};

	const handleRevokeAccess = async (member: TeamMember) => {
		setWarningDialogTitle('Revoke Access');
		setWarningDialogMessage(
			`Are you sure you want to revoke access for ${member.firstName} ${member.lastName}? This will deactivate their invitation code and they will lose access to the system.`,
		);
		setWarningDialogConfirmText('Revoke Access');
		setWarningDialogCancelText('Cancel');
		setWarningDialogOnConfirm(() => async () => {
			setWarningDialogOpen(false);
			try {
				await revokeTeamMemberInvitationCode({
					teamMemberId: member.id,
				}).unwrap();

				// Update the team member record to reflect the revoked status
				await updateTeamMemberApi({
					id: member.id,
					updates: {
						invitationCodeStatus: 'revoked',
					} as any,
				}).unwrap();

				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'team_member_updated',
						title: 'Team Member Access Revoked',
						message: `Access has been revoked for team member "${member.firstName} ${member.lastName}"`,
						data: {
							memberId: member.id,
							memberName: `${member.firstName} ${member.lastName}`,
						},
						status: 'unread',
						actionUrl: `/team`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			} catch (error) {
				console.error('Failed to revoke access:', error);
				setWarningDialogTitle('Revoke Failed');
				setWarningDialogMessage('Failed to revoke access. Please try again.');
				setWarningDialogConfirmText('OK');
				setWarningDialogCancelText('');
				setWarningDialogOnConfirm(() => () => setWarningDialogOpen(false));
				setWarningDialogOpen(true);
			}
		});
		setWarningDialogOpen(true);
	};

	const handleAddTeamGroup = async () => {
		// currentUser guaranteed to exist in protected routes
		try {
			const result = await createTeamGroup({
				userId: currentUser!.id,
				name: 'New Team Group',
				linkedProperties: [],
			}).unwrap();

			// Create notification for team group creation
			try {
				await createNotification({
					userId: currentUser!.id,
					type: 'team_group_created',
					title: 'Team Group Created',
					message: 'New team group "New Team Group" has been created',
					data: {
						groupId: result.id,
						groupName: 'New Team Group',
					},
					status: 'unread',
					actionUrl: `/team`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}
		} catch (error) {
			console.error('Error creating team group:', error);
		}
	};

	const handleEditTeamGroup = async (groupId: string) => {
		if (editingGroupId === groupId) {
			// Save the name change
			if (
				editingGroupName.trim() &&
				editingGroupName !==
					groupsWithMembers.find((g) => g.id === groupId)?.name
			) {
				try {
					await updateTeamGroup({
						id: groupId,
						updates: { name: editingGroupName },
					}).unwrap();

					// Create notification for team group update
					try {
						await createNotification({
							userId: currentUser!.id,
							type: 'team_group_updated',
							title: 'Team Group Updated',
							message: `Team group "${editingGroupName}" has been updated`,
							data: {
								groupId: groupId,
								groupName: editingGroupName,
							},
							status: 'unread',
							actionUrl: `/team`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notifError) {
						console.error('Notification failed:', notifError);
					}
				} catch (error) {
					console.error('Failed to update team group name:', error);
					setWarningDialogTitle('Update Failed');
					setWarningDialogMessage(
						'Failed to update group name. Please try again.',
					);
					setWarningDialogConfirmText('OK');
					setWarningDialogCancelText('');
					setWarningDialogOnConfirm(() => () => setWarningDialogOpen(false));
					setWarningDialogOpen(true);
				}
			}
			setEditingGroupId(null);
			setEditingGroupName('');
		} else {
			// Start editing
			const group = groupsWithMembers.find((g) => g.id === groupId);
			if (group) {
				setEditingGroupId(groupId);
				setEditingGroupName(group.name);
			}
		}
	};

	const handleDeleteTeamGroup = async (groupId: string) => {
		setWarningDialogTitle('Delete Team Group');
		setWarningDialogMessage(
			'Are you sure you want to delete this team group? This action cannot be undone.',
		);
		setWarningDialogConfirmText('Delete');
		setWarningDialogCancelText('Cancel');
		setWarningDialogOnConfirm(() => async () => {
			setWarningDialogOpen(false);
			try {
				const groupToDelete = groupsWithMembers.find((g) => g.id === groupId);
				await deleteTeamGroupApi(groupId).unwrap();
				try {
					if (groupToDelete) {
						await createNotification({
							userId: currentUser!.id,
							type: 'team_group_deleted',
							title: 'Team Group Deleted',
							message: `Team group "${groupToDelete.name}" has been deleted`,
							data: {
								groupId: groupId,
								groupName: groupToDelete.name,
							},
							status: 'unread',
							actionUrl: `/team`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					}
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			} catch (error) {
				console.error('Failed to delete team group:', error);
				setWarningDialogTitle('Delete Failed');
				setWarningDialogMessage(
					'Failed to delete team group. Please try again.',
				);
				setWarningDialogConfirmText('OK');
				setWarningDialogCancelText('');
				setWarningDialogOnConfirm(() => () => setWarningDialogOpen(false));
				setWarningDialogOpen(true);
			}
		});
		setWarningDialogOpen(true);
	};

	return (
		<Wrapper>
			<WarningDialog
				open={warningDialogOpen}
				title={warningDialogTitle}
				message={warningDialogMessage}
				confirmText={warningDialogConfirmText}
				cancelText={warningDialogCancelText}
				onConfirm={warningDialogOnConfirm}
				onCancel={() => setWarningDialogOpen(false)}
			/>
			<PageHeaderSection>
				<StandardPageTitle>Team Management</StandardPageTitle>
				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
					{canManage && (
						<AddTeamGroupButton onClick={() => handleAddTeamMember(null)}>
							+ Add Team Member
						</AddTeamGroupButton>
					)}
					{canManage && (
						<AddTeamGroupButton onClick={handleAddTeamGroup}>
							+ Add Team Group
						</AddTeamGroupButton>
					)}
				</div>
			</PageHeaderSection>

			<TeamGroupSection>
				{filteredTeamGroups.map((group) => (
					<div key={group.id}>
						<TeamGroupHeader>
							{editingGroupId === group.id ? (
								<TeamGroupNameInput
									type='text'
									value={editingGroupName}
									onChange={(e) => setEditingGroupName(e.target.value)}
									onBlur={() => handleEditTeamGroup(group.id)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											handleEditTeamGroup(group.id);
										} else if (e.key === 'Escape') {
											setEditingGroupId(null);
											setEditingGroupName('');
										}
									}}
									autoFocus
								/>
							) : (
								<TeamGroupTitle>{group.name}</TeamGroupTitle>
							)}
							{canManage && (
								<TeamGroupActions>
									<TeamGroupActionButton
										title='Edit group'
										onClick={() => handleEditTeamGroup(group.id)}>
										✎
									</TeamGroupActionButton>
									<TeamGroupActionButton
										title='Delete group'
										onClick={() => handleDeleteTeamGroup(group.id)}>
										🗑
									</TeamGroupActionButton>
								</TeamGroupActions>
							)}
						</TeamGroupHeader>

						<TeamMembersGrid>
							{(group.members || []).map((member) => (
								<TeamMemberCard
									key={member.id}
									onClick={() =>
										canManage && handleEditTeamMember(member, group.id)
									}
									style={{
										cursor: canManage ? 'pointer' : 'default',
										opacity: canManage ? 1 : 0.7,
									}}>
									{canManage && currentUser?.email !== member.email && (
										<TeamMemberActions>
											{(member as any).invitationCodeStatus === 'active' && (
												<TeamMemberActionButton
													className='revoke'
													title='Revoke access'
													onClick={(e) => {
														e.stopPropagation();
														handleRevokeAccess(member);
													}}>
													🚫
												</TeamMemberActionButton>
											)}
											<TeamMemberActionButton
												className='delete'
												title='Delete team member'
												onClick={(e) => {
													e.stopPropagation();
													setWarningDialogTitle('Delete Team Member');
													setWarningDialogMessage(
														`Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`,
													);
													setWarningDialogConfirmText('Delete');
													setWarningDialogCancelText('Cancel');
													setWarningDialogOnConfirm(() => () => {
														setWarningDialogOpen(false);
														handleDeleteTeamMember(member.id);
													});
													setWarningDialogOpen(true);
												}}>
												🗑
											</TeamMemberActionButton>
										</TeamMemberActions>
									)}
									<TeamMemberName>
										{member.firstName} {member.lastName}
									</TeamMemberName>
									<TeamMemberTitle>{member.title}</TeamMemberTitle>
									{(member as any).invitationCodeStatus && (
										<div
											style={{
												fontSize: '0.75em',
												color:
													(member as any).invitationCodeStatus === 'active'
														? '#10b981'
														: '#ef4444',
												marginTop: '4px',
											}}>
											{(member as any).invitationCodeStatus === 'active'
												? `✓ Active - ${formatExpirationDate(
														(member as any).invitationCodeExpiresAt,
												  )}`
												: '✗ Revoked'}
										</div>
									)}
								</TeamMemberCard>
							))}

							{canManage && (
								<AddTeamMemberCard
									onClick={() =>
										handleAddTeamMember(
											group.id === 'orphan' ? null : group.id,
										)
									}>
									<AddIcon>+</AddIcon>
									<AddText>Add Team Member</AddText>
								</AddTeamMemberCard>
							)}
						</TeamMembersGrid>
					</div>
				))}
			</TeamGroupSection>

			{/* Add/Edit Team Member Dialog */}
			{showTeamMemberDialog && (
				<DialogOverlay onClick={() => setShowTeamMemberDialog(false)}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<LibraryDialogHeader>
							<DialogTitle>
								{editingMember ? 'Edit Team Member' : 'Add Team Member'}
							</DialogTitle>
							<DialogCloseButton onClick={() => setShowTeamMemberDialog(false)}>
								✕
							</DialogCloseButton>
						</LibraryDialogHeader>

						<DialogBody>
							<LeftColumn>
								{/* Image Upload */}
								<ImageUploadSection>
									{imagePreview ? (
										<ImagePreview src={imagePreview} alt='Preview' />
									) : (
										<TeamMemberImagePlaceholder>
											{formData.firstName.charAt(0)}
											{formData.lastName.charAt(0) || '?'}
										</TeamMemberImagePlaceholder>
									)}
									<FileUploader
										label='Upload Photo'
										helperText='JPG, PNG, GIF, WEBP (max 8MB)'
										accept='image/*'
										allowedTypes={['image/*']}
										maxSizeBytes={8 * 1024 * 1024}
										setFile={handleImageUpload}
										disabled={isUploadingImage}
										showSelectedFiles={false}
									/>
									{imageUploadError && (
										<div style={{ color: '#dc2626', fontSize: '12px' }}>
											{imageUploadError}
										</div>
									)}
								</ImageUploadSection>

								{/* Basic Info */}
								<FormGroup>
									<FormLabel>First Name *</FormLabel>
									<FormInput
										type='text'
										placeholder='First name'
										value={formData.firstName}
										onChange={(e) =>
											handleFormChange('firstName', e.target.value)
										}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Last Name *</FormLabel>
									<FormInput
										type='text'
										placeholder='Last name'
										value={formData.lastName}
										onChange={(e) =>
											handleFormChange('lastName', e.target.value)
										}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Email *</FormLabel>
									<FormInput
										type='email'
										placeholder='Email address'
										value={formData.email}
										onChange={(e) => handleFormChange('email', e.target.value)}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Phone Number</FormLabel>
									<FormInput
										type='tel'
										placeholder='Phone number'
										value={formData.phone}
										onChange={(e) => handleFormChange('phone', e.target.value)}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Role *</FormLabel>
									<FormSelect
										value={formData.role}
										onChange={(e) => handleFormChange('role', e.target.value)}>
										{ROLE_OPTIONS.map((role) => (
											<option key={role.value} value={role.value}>
												{role.label}
											</option>
										))}
									</FormSelect>
								</FormGroup>

								<FormGroup>
									<FormLabel>Team Group (Optional)</FormLabel>
									<FormSelect
										value={currentGroupId || ''}
										onChange={(e) => {
											const nextGroupId = e.target.value;
											setCurrentGroupId(nextGroupId || null);
										}}>
										<option value=''>No group</option>
										{teamGroups.map((group) => (
											<option key={group.id} value={group.id}>
												{group.name}
											</option>
										))}
									</FormSelect>
								</FormGroup>

								{/* Promo Code Section */}
								{canManage && (
									<FormGroup>
										<SectionTitle>Access Control</SectionTitle>
										<div style={{ marginBottom: '12px' }}>
											<label
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													fontSize: '0.9em',
												}}>
												<input
													type='checkbox'
													checked={formData.enableInvitationCode !== false}
													onChange={(e) =>
														handleFormChange(
															'enableInvitationCode',
															e.target.checked,
														)
													}
												/>
												Generate invitation code for team member access
											</label>
										</div>

										{formData.enableInvitationCode !== false &&
											formData.firstName &&
											formData.lastName &&
											!editingMember && (
												<div style={{ marginTop: '8px' }}>
													<FormLabel
														style={{ fontSize: '0.85em', marginBottom: '4px' }}>
														Generated Invitation Code:
													</FormLabel>
													<div
														style={{
															padding: '8px 12px',
															backgroundColor: '#f8f9fa',
															border: '1px solid #e9ecef',
															borderRadius: '4px',
															fontFamily: 'monospace',
															fontSize: '0.9em',
															color: '#495057',
															wordBreak: 'break-all',
														}}>
														{generatedInvitationCode ||
															'Code will be generated...'}
													</div>
													<div
														style={{
															fontSize: '0.75em',
															color: '#6c757d',
															marginTop: '4px',
														}}>
														This invitation code will expire in 7 days and can
														be used by the team member to access the system.
													</div>
												</div>
											)}

										{editingMember &&
											(editingMember as any).invitationCodeStatus && (
												<div style={{ marginTop: '8px' }}>
													<FormLabel
														style={{ fontSize: '0.85em', marginBottom: '4px' }}>
														Current Status:
													</FormLabel>
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
														}}>
														<div
															style={{
																padding: '4px 8px',
																borderRadius: '4px',
																fontSize: '0.8em',
																color:
																	(editingMember as any)
																		.invitationCodeStatus === 'active'
																		? '#10b981'
																		: '#ef4444',
																backgroundColor:
																	(editingMember as any)
																		.invitationCodeStatus === 'active'
																		? '#d1fae5'
																		: '#fee2e2',
															}}>
															{(editingMember as any).invitationCodeStatus ===
															'active'
																? '✓ Active'
																: '✗ Revoked'}
														</div>
														{(editingMember as any).invitationCodeStatus ===
															'active' && (
															<div
																style={{ fontSize: '0.7em', color: '#6c757d' }}>
																{formatExpirationDate(
																	(editingMember as any)
																		.invitationCodeExpiresAt,
																)}
															</div>
														)}
														{(editingMember as any).invitationCodeStatus ===
															'active' && (
															<button
																type='button'
																onClick={() =>
																	handleRevokeAccess(editingMember)
																}
																style={{
																	padding: '4px 8px',
																	fontSize: '0.75em',
																	backgroundColor: '#dc3545',
																	color: 'white',
																	border: 'none',
																	borderRadius: '4px',
																	cursor: 'pointer',
																}}>
																Revoke Access
															</button>
														)}
														{(editingMember as any).invitationCodeStatus ===
															'revoked' && (
															<button
																type='button'
																onClick={async () => {
																	try {
																		// Generate a new promo code
																		const namePart =
																			`${formData.firstName.charAt(
																				0,
																			)}${formData.lastName.charAt(
																				0,
																			)}`.toUpperCase();
																		const randomPart = Math.random()
																			.toString(36)
																			.substring(2, 8)
																			.toUpperCase();
																		const promoCode = `TEAM-${namePart}${randomPart}`;

																		const result =
																			await createTeamMemberInvitationCode({
																				teamMemberId: editingMember!.id,
																				teamMemberEmail: formData.email,
																				code: promoCode,
																			}).unwrap();

																		// Update the editing member with new promo code data
																		setEditingMember({
																			...editingMember,
																			invitationCodeId: result.id,
																			invitationCodeStatus: 'active',
																			invitationCodeExpiresAt: result.expiresAt,
																		} as any);

																		// Update the team member record in the database
																		await updateTeamMemberApi({
																			id: editingMember!.id,
																			updates: {
																				invitationCodeId: result.id,
																				invitationCodeStatus: 'active',
																				invitationCodeExpiresAt:
																					result.expiresAt,
																			} as any,
																		}).unwrap();

																		alert(
																			'Invitation code regenerated successfully! New code expires in 7 days.',
																		);
																	} catch (error) {
																		console.error(
																			'Failed to regenerate invitation code:',
																			error,
																		);
																		alert(
																			'Failed to regenerate invitation code. Please try again.',
																		);
																	}
																}}
																style={{
																	padding: '4px 8px',
																	fontSize: '0.75em',
																	backgroundColor: '#007bff',
																	color: 'white',
																	border: 'none',
																	borderRadius: '4px',
																	cursor: 'pointer',
																}}>
																Regenerate Invitation Code
															</button>
														)}
													</div>
												</div>
											)}
									</FormGroup>
								)}

								<FormGroup>
									<FormLabel>Address</FormLabel>
									<FormInput
										type='text'
										placeholder='Street address'
										value={formData.address}
										onChange={(e) =>
											handleFormChange('address', e.target.value)
										}
									/>
								</FormGroup>
							</LeftColumn>

							<RightColumn>
								{/* Notes */}
								<FormGroup>
									<FormLabel>Notes</FormLabel>
									<FormTextarea
										placeholder='Add any notes about this team member...'
										value={formData.notes}
										onChange={(e) => handleFormChange('notes', e.target.value)}
									/>
								</FormGroup>

								{/* Assigned Properties */}
								<FormGroup>
									<SectionTitle>Assigned Properties</SectionTitle>
									<PropertyMultiSelect>
										{properties.map((property) => {
											const isLinked = formData.linkedProperties.includes(
												property.id,
											);
											return (
												<PropertyCheckbox key={property.id}>
													<input
														type='checkbox'
														id={`property-${property.id}`}
														checked={isLinked}
														onChange={() => handlePropertyToggle(property.id)}
													/>
													<label htmlFor={`property-${property.id}`}>
														{property.title}
													</label>
												</PropertyCheckbox>
											);
										})}
									</PropertyMultiSelect>
								</FormGroup>

								{/* File Upload */}
								<FileUploadSection>
									<SectionTitle>Documents & Files</SectionTitle>
									<FileUploader
										label='Upload Documents'
										helperText='Images, PDF, Word, Excel, Text (max 10MB)'
										accept='image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx'
										allowedTypes={[
											'image/jpeg',
											'image/png',
											'image/jpg',
											'image/gif',
											'image/webp',
											'application/pdf',
											'application/msword',
											'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
											'text/plain',
											'application/vnd.ms-excel',
											'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
										]}
										maxSizeBytes={10 * 1024 * 1024}
										multiple={true}
										setFiles={handleFileUpload}
										disabled={isUploadingFiles}
										showSelectedFiles={false}
									/>
									{fileUploadError && (
										<div style={{ color: '#dc2626', fontSize: '12px' }}>
											{fileUploadError}
										</div>
									)}
									{uploadedFiles.length > 0 && (
										<FileList>
											{uploadedFiles.map((file) => {
												const fileId = file.url || file.id || file.name;
												return (
													<FileItem key={fileId}>
														{file.url ? (
															<a
																href={file.url}
																target='_blank'
																rel='noreferrer'>
																{file.name}
															</a>
														) : (
															<span>{file.name}</span>
														)}
														<button onClick={() => handleRemoveFile(fileId)}>
															✕
														</button>
													</FileItem>
												);
											})}
										</FileList>
									)}
								</FileUploadSection>

								{/* Task History */}
								{editingMember && (
									<FormGroup>
										<SectionTitle>Recent Task History</SectionTitle>
										<QuickTaskHistory>
											{editingMember.taskHistory.map((task, idx) => (
												<TaskHistoryItem key={idx}>
													<div>
														<span>{task.task}</span>
													</div>
													<span>{task.date}</span>
												</TaskHistoryItem>
											))}
										</QuickTaskHistory>
									</FormGroup>
								)}
							</RightColumn>
						</DialogBody>

						<DialogFooter>
							<CancelButton onClick={() => setShowTeamMemberDialog(false)}>
								Cancel
							</CancelButton>
							<SaveButton onClick={handleSaveTeamMember}>
								{editingMember ? 'Update Member' : 'Add Member'}
							</SaveButton>
						</DialogFooter>
					</DialogContent>
				</DialogOverlay>
			)}

			{/* Warning Dialog */}
			<WarningDialog
				open={warningDialogOpen}
				title={warningDialogTitle}
				message={warningDialogMessage}
				confirmText={warningDialogConfirmText}
				cancelText={warningDialogCancelText}
				onConfirm={warningDialogOnConfirm}
				onCancel={() => setWarningDialogOpen(false)}
			/>
		</Wrapper>
	);
}
