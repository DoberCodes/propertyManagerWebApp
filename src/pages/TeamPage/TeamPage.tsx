import React, { useState, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import {
	selectCanInviteTeamMembers,
	selectIsTeamMemberAccount,
} from '../../Redux/selectors/permissionSelectors';
import { TeamMember } from '../../Redux/Slices/teamSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../../Components/Library/PageHeaders';
import {
	DialogOverlay,
	DialogHeader as LibraryDialogHeader,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	FormRow,
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
	TeamMemberProperties,
	TeamMemberPropertiesLabel,
	TeamMemberPropertyList,
	TeamMemberPropertyChip,
	TeamMemberInviteToken,
	TeamMemberInviteCode,
	TeamMemberInviteCopyButton,
	AccessControlToggle,
	AccessControlPanel,
	AccessStatusRow,
	AccessStatusBadge,
	AccessStatusMeta,
	AccessActionRow,
	AccessActionButton,
	AddTeamMemberCard,
	AddIcon,
	AddText,
	TeamDialogContent,
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
	EmptyState,
	SaveButton,
} from './TeamPage.styles';
import { WarningDialog } from '../../Components/Library/WarningDialog';
import { LockedFeatureCallout } from '../../Components/Library/LockedFeatureCallout';
import {
	useCreateTeamGroupMutation,
	useCreateTeamMemberInvitationCodeMutation,
	useCreateTeamMemberMutation,
	useDeleteTeamGroupMutation,
	useDeleteTeamMemberMutation,
	useGetTeamGroupsQuery,
	useGetTeamMembersQuery,
	useLazyGetTeamMemberInvitationCodesByEmailQuery,
	useRevokeTeamMemberInvitationCodeMutation,
	useUpdateTeamGroupMutation,
	useUpdateTeamMemberMutation,
} from '../../Redux/API/teamSlice';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { USER_ROLES } from '../../constants/roles';

const ROLE_OPTIONS = [
	{ value: USER_ROLES.PROPERTY_MANAGER, label: 'Property Manager' },
	{ value: USER_ROLES.ASSISTANT_MANAGER, label: 'Assistant Manager' },
	{ value: USER_ROLES.MAINTENANCE, label: 'Maintenance' },
	{ value: USER_ROLES.ACCOUNTING, label: 'Accounting' },
	{ value: USER_ROLES.LEASING, label: 'Leasing Agent' },
	{ value: USER_ROLES.ADMIN, label: 'Administrator' },
];

const generateTeamInvitationCode = (firstName: string, lastName: string) => {
	const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
	const namePart = initials || 'TM';
	const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `TEAM-${namePart}${randomPart}`;
};

const getTeamMemberAccessState = (
	member?: TeamMember | null,
): 'pending' | 'accepted' | 'revoked' | 'none' => {
	if (!member) return 'none';
	const status = String((member as any).invitationCodeStatus || '').toLowerCase();
	if (status === 'revoked') return 'revoked';
	if (
		status === 'redeemed' ||
		(member as any).redeemedByUserId ||
		(member as any).userAccountId
	) {
		return 'accepted';
	}
	if (status === 'active') return 'pending';
	return 'none';
};

const hasRevocableTeamAccess = (member?: TeamMember | null) => {
	const accessState = getTeamMemberAccessState(member);
	return accessState === 'pending' || accessState === 'accepted';
};

const canShowInvitationToken = (member?: TeamMember | null) =>
	getTeamMemberAccessState(member) === 'pending';

const parseMailingAddress = (address?: string) => {
	const empty = {
		street: '',
		city: '',
		state: '',
		zip: '',
	};
	const value = String(address || '').trim();
	if (!value) return empty;

	const parts = value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);

	if (parts.length < 3) {
		return { ...empty, street: value };
	}

	const region = parts[parts.length - 1] || '';
	const regionMatch = region.match(/^([A-Za-z]{2})(?:\s+(.+))?$/);

	return {
		street: parts.slice(0, -2).join(', '),
		city: parts[parts.length - 2] || '',
		state: regionMatch?.[1]?.toUpperCase() || '',
		zip: regionMatch?.[2] || '',
	};
};

const buildMailingAddress = ({
	street,
	city,
	state,
	zip,
}: {
	street: string;
	city: string;
	state: string;
	zip: string;
}) => {
	const stateZip = [state.trim().toUpperCase(), zip.trim()]
		.filter(Boolean)
		.join(' ');
	return [street.trim(), city.trim(), stateZip].filter(Boolean).join(', ');
};

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
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	// Use RTK Query hooks directly instead of Redux cache to avoid synchronization issues
	const { data: teamGroups = [] } = useGetTeamGroupsQuery();
	const { data: teamMembers = [] } = useGetTeamMembersQuery();
	const { data: queriedProperties = [] } = useGetPropertiesQuery();
	// Select property groups and derive properties with memoization
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const properties = useMemo(() => {
		const groupProperties = propertyGroups.flatMap((g) => g.properties || []);
		return Array.from(
			new Map(
				[...groupProperties, ...queriedProperties]
					.filter((property) => property?.id)
					.map((property) => [property.id, property]),
			).values(),
		);
	}, [propertyGroups, queriedProperties]);
	const propertyTitleById = useMemo(
		() =>
			new Map(
				properties.map((property) => [
					property.id,
					String(property.title || 'Untitled property'),
				]),
			),
		[properties],
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
	const [getTeamMemberInvitationCodesByEmail] =
		useLazyGetTeamMemberInvitationCodesByEmailQuery();
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
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);

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
		title: '',
		address: '',
		mailingCity: '',
		mailingState: '',
		mailingZip: '',
		notes: '',
		linkedProperties: [] as string[],
		enableInvitationCode: true,
	});
	const [uploadedFiles, setUploadedFiles] = useState<TeamMember['files']>([]);
	const [generatedInvitationCode, setGeneratedInvitationCode] =
		useState<string>('');
	const [invitationCodeByMemberId, setInvitationCodeByMemberId] = useState<Record<string, string>>({});
	const editingMemberAccessState = getTeamMemberAccessState(editingMember);
	const isEditingAcceptedMember = editingMemberAccessState === 'accepted';

	const getVisibleInvitationCode = (member: TeamMember) =>
		(member as any).invitationCode || invitationCodeByMemberId[member.id] || '';

	const handleCopyInvitationCode = async (code: string) => {
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code);
			feedback.notify('Invitation code copied');
		} catch (error) {
			console.error('Failed to copy invitation code:', error);
			feedback.notify('Unable to copy invitation code. You can select it manually.');
		}
	};

	React.useEffect(() => {
		const membersNeedingCode = teamMembers.filter(
			(member) =>
				canShowInvitationToken(member) &&
				!(member as any).invitationCode &&
				!invitationCodeByMemberId[member.id] &&
				member.email,
		);

		if (membersNeedingCode.length === 0) return;

		let isCancelled = false;
		const loadInvitationCodes = async () => {
			const nextCodes: Record<string, string> = {};

			for (const member of membersNeedingCode) {
				try {
					const codes = await getTeamMemberInvitationCodesByEmail(member.email).unwrap();
					const match = codes.find(
						(code) =>
							code.status === 'active' &&
							(code.teamMemberId === member.id || !code.teamMemberId),
					);
					if (match?.code) {
						nextCodes[member.id] = match.code;
					}
				} catch (error) {
					console.error('Failed to load invitation code:', error);
				}
			}

			if (!isCancelled && Object.keys(nextCodes).length > 0) {
				setInvitationCodeByMemberId((prev) => ({ ...prev, ...nextCodes }));
			}
		};

		void loadInvitationCodes();

		return () => {
			isCancelled = true;
		};
	}, [teamMembers, invitationCodeByMemberId, getTeamMemberInvitationCodesByEmail]);

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
			setGeneratedInvitationCode(
				generateTeamInvitationCode(formData.firstName, formData.lastName),
			);
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
			title: '',
			address: '',
			mailingCity: '',
			mailingState: '',
			mailingZip: '',
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
		let invitationCode: string | undefined;

		if (editingMember) {
			// When editing, preserve existing invitation code data if not changing the setting
			invitationCodeId = (editingMember as any).invitationCodeId;
			invitationCodeStatus = (editingMember as any).invitationCodeStatus;
			invitationCodeExpiresAt = (editingMember as any).invitationCodeExpiresAt;
			invitationCode = (editingMember as any).invitationCode;
		}

		const invitationFields =
			invitationCodeId && invitationCodeStatus
				? {
						invitationCodeId,
						invitationCodeStatus,
						...(invitationCode && { invitationCode }),
						...(invitationCodeExpiresAt && { invitationCodeExpiresAt }),
				  }
				: {};

		const memberData = {
			...(currentGroupId && { groupId: currentGroupId }),
			userId: currentUser!.id,
			firstName: formData.firstName,
			lastName: formData.lastName,
			title: formData.title.trim(),
			email: isEditingAcceptedMember ? editingMember!.email : formData.email,
			phone: formData.phone,
			role: formData.role,
			address: buildMailingAddress({
				street: formData.address,
				city: formData.mailingCity,
				state: formData.mailingState,
				zip: formData.mailingZip,
			}),
			image: imagePreview || editingMember?.image || '',
			notes: formData.notes,
			linkedProperties: formData.linkedProperties,
			taskHistory: editingMember?.taskHistory || [],
			files: uploadedFiles,
			...invitationFields,
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

				// Create invitation code after the team member exists so the Cloud Function gets a real teamMemberId.
				if (canManage && formData.enableInvitationCode) {
					try {
						const invite = await createTeamMemberInvitationCode({
							teamMemberId: result.id,
							teamMemberEmail: formData.email,
							code:
								generatedInvitationCode ||
								generateTeamInvitationCode(formData.firstName, formData.lastName),
						}).unwrap();

						await updateTeamMemberApi({
							id: result.id,
							updates: {
								invitationCodeId: invite.id,
								invitationCode: invite.code,
								invitationCodeStatus: 'active',
								invitationCodeExpiresAt: invite.expiresAt,
							} as any,
						}).unwrap();
					} catch (inviteError) {
						console.error(
							'Failed to create invitation code for new team member:',
							inviteError,
						);
						feedback.notify(
							'Team member saved, but the invitation code could not be created. You can regenerate it from their profile.',
							'info',
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
		const mailingAddress = parseMailingAddress(member.address);
		setFormData({
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			phone: member.phone,
			role: member.role,
			title: member.title || '',
			address: mailingAddress.street,
			mailingCity: mailingAddress.city,
			mailingState: mailingAddress.state,
			mailingZip: mailingAddress.zip,
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
						invitationCodeId: null,
						invitationCode: null,
						invitationCodeExpiresAt: null,
						userAccountId: null,
						redeemedByUserId: null,
						redeemedAt: null,
					} as any,
				}).unwrap();

				setEditingMember((current) =>
					current?.id === member.id
						? ({
								...current,
								invitationCodeStatus: 'revoked',
								invitationCodeId: null,
								invitationCode: null,
								invitationCodeExpiresAt: null,
								userAccountId: null,
								redeemedByUserId: null,
								redeemedAt: null,
						  } as any)
						: current,
				);
				setInvitationCodeByMemberId((prev) => {
					if (!prev[member.id]) {
						return prev;
					}
					const next = { ...prev };
					delete next[member.id];
					return next;
				});

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

			{!canManage && (
				<LockedFeatureCallout
					title={
						isTeamMemberAccount
							? 'Team management is managed by the account holder'
							: 'Team collaboration is locked on your current plan'
					}
					description={
						isTeamMemberAccount
							? 'Your account access is controlled by your assigned role and property access.'
							: 'You can review current team assignments in read-only mode. Upgrade to Portfolio to invite, manage, and group team members.'
					}
					upgradeLabel='Upgrade for Team Access'
					showUpgradeAction={!isTeamMemberAccount}
				/>
			)}

			<TeamGroupSection>
				{filteredTeamGroups.length === 0 ? (
					<EmptyState>
						<p>No team members yet.</p>
						<p>Add your first team member or group to start assigning maintenance work.</p>
						{canManage && (
							<AddTeamGroupButton onClick={() => handleAddTeamMember(null)}>
								Add Team Member
							</AddTeamGroupButton>
						)}
					</EmptyState>
				) : filteredTeamGroups.map((group) => (
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
							{(group.members || []).map((member) => {
								const assignedPropertyTitles = (member.linkedProperties || [])
									.map((propertyId) => propertyTitleById.get(propertyId))
									.filter((title): title is string => Boolean(title));
								const visibleAssignedProperties = assignedPropertyTitles.slice(0, 3);
								const hiddenAssignedPropertyCount =
									assignedPropertyTitles.length - visibleAssignedProperties.length;

								return (
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
											{hasRevocableTeamAccess(member) && (
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
									<TeamMemberProperties>
										<TeamMemberPropertiesLabel>
											Assigned Properties
										</TeamMemberPropertiesLabel>
										<TeamMemberPropertyList>
											{visibleAssignedProperties.length > 0 ? (
												<>
													{visibleAssignedProperties.map((propertyTitle) => (
														<TeamMemberPropertyChip key={propertyTitle} title={propertyTitle}>
															{propertyTitle}
														</TeamMemberPropertyChip>
													))}
													{hiddenAssignedPropertyCount > 0 && (
														<TeamMemberPropertyChip $muted>
															+{hiddenAssignedPropertyCount} more
														</TeamMemberPropertyChip>
													)}
												</>
											) : (
												<TeamMemberPropertyChip $muted>
													No properties assigned
												</TeamMemberPropertyChip>
											)}
										</TeamMemberPropertyList>
									</TeamMemberProperties>
									{getTeamMemberAccessState(member) !== 'none' && (
										<div
											style={{
												fontSize: '0.75em',
												color:
													getTeamMemberAccessState(member) === 'revoked'
														? '#ef4444'
														: '#10b981',
												marginTop: '4px',
											}}>
											{getTeamMemberAccessState(member) === 'accepted'
												? 'Active'
												: getTeamMemberAccessState(member) === 'pending'
													? `Invite Pending - ${formatExpirationDate(
															(member as any).invitationCodeExpiresAt,
													  )}`
													: 'Revoked'}
										</div>
									)}
									{canShowInvitationToken(member) &&
										getVisibleInvitationCode(member) && (
											<TeamMemberInviteToken>
												<span>Invitation token</span>
												<TeamMemberInviteCode>
													{getVisibleInvitationCode(member)}
												</TeamMemberInviteCode>
												<TeamMemberInviteCopyButton
													type='button'
													onClick={(event) => {
														event.stopPropagation();
														void handleCopyInvitationCode(
															getVisibleInvitationCode(member),
														);
													}}>
													Copy token
												</TeamMemberInviteCopyButton>
											</TeamMemberInviteToken>
										)}
									</TeamMemberCard>
								);
							})}

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
					<TeamDialogContent onClick={(e) => e.stopPropagation()}>
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
										disabled={isEditingAcceptedMember}
									/>
									{isEditingAcceptedMember && (
										<div
											style={{
												fontSize: '0.75em',
												color: '#6c757d',
												marginTop: 4,
											}}>
											Email is tied to this team member's login and cannot be
											changed after the invite is accepted.
										</div>
									)}
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
									<FormLabel>Mailing Address</FormLabel>
									<FormInput
										type='text'
										placeholder='Street address'
										value={formData.address}
										onChange={(e) =>
											handleFormChange('address', e.target.value)
										}
									/>
								</FormGroup>

								<FormRow>
									<FormGroup>
										<FormLabel>City</FormLabel>
										<FormInput
											type='text'
											placeholder='City'
											value={formData.mailingCity}
											onChange={(e) =>
												handleFormChange('mailingCity', e.target.value)
											}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>State</FormLabel>
										<FormInput
											type='text'
											placeholder='State'
											value={formData.mailingState}
											onChange={(e) =>
												handleFormChange('mailingState', e.target.value)
											}
										/>
									</FormGroup>
									<FormGroup>
										<FormLabel>ZIP</FormLabel>
										<FormInput
											type='text'
											placeholder='ZIP'
											value={formData.mailingZip}
											onChange={(e) =>
												handleFormChange('mailingZip', e.target.value)
											}
										/>
									</FormGroup>
								</FormRow>

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
									<FormLabel>Job Title</FormLabel>
									<FormInput
										type='text'
										placeholder='e.g., Leasing Coordinator, Maintenance Lead'
										value={formData.title}
										onChange={(e) => handleFormChange('title', e.target.value)}
									/>
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
										{!editingMember && (
											<AccessControlToggle>
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
												<span>Generate invitation code for team member access</span>
											</AccessControlToggle>
										)}

										{formData.enableInvitationCode !== false &&
											formData.firstName &&
											formData.lastName &&
											!editingMember && (
												<AccessControlPanel>
													<FormLabel
														style={{ fontSize: '0.85em', marginBottom: '4px' }}>
														Generated Invitation Code:
													</FormLabel>
													<TeamMemberInviteToken>
														<span>Invitation token</span>
														<TeamMemberInviteCode>
															{generatedInvitationCode ||
																'Code will be generated...'}
														</TeamMemberInviteCode>
													</TeamMemberInviteToken>
													{generatedInvitationCode && (
														<AccessActionRow>
															<AccessActionButton
																type='button'
																$variant='ghost'
																onClick={() =>
																	handleCopyInvitationCode(
																		generatedInvitationCode,
																	)
																}>
																Copy token
															</AccessActionButton>
														</AccessActionRow>
													)}
													<div
														style={{
															fontSize: '0.75em',
															color: '#6c757d',
															marginTop: '4px',
														}}>
														This invitation code will expire in 7 days and can
														be used by the team member to access the system.
													</div>
												</AccessControlPanel>
											)}

										{editingMember &&
											(editingMember as any).invitationCodeStatus && (
												<AccessControlPanel>
													<FormLabel
														style={{ fontSize: '0.85em', marginBottom: '4px' }}>
														Current Status:
													</FormLabel>
													<AccessStatusRow>
														<AccessStatusBadge
															$status={
																getTeamMemberAccessState(editingMember) ===
																'revoked'
																	? 'revoked'
																	: 'active'
															}>
															{getTeamMemberAccessState(editingMember) ===
															'accepted'
																? 'Active'
																: getTeamMemberAccessState(editingMember) ===
																	  'pending'
																	? 'Invite Pending'
																	: 'Revoked'}
														</AccessStatusBadge>
														{getTeamMemberAccessState(editingMember) ===
															'pending' && (
															<AccessStatusMeta>
																{formatExpirationDate(
																	(editingMember as any)
																		.invitationCodeExpiresAt,
																)}
															</AccessStatusMeta>
														)}
													</AccessStatusRow>
													<AccessActionRow>
														{canShowInvitationToken(editingMember) &&
															getVisibleInvitationCode(editingMember) && (
																<AccessActionButton
																	type='button'
																	$variant='ghost'
																	onClick={() =>
																		handleCopyInvitationCode(
																			getVisibleInvitationCode(editingMember),
																		)
																	}>
																	Copy token
																</AccessActionButton>
															)}
														{hasRevocableTeamAccess(editingMember) && (
															<AccessActionButton
																type='button'
																$variant='danger'
																onClick={() =>
																	handleRevokeAccess(editingMember)
																}>
																Revoke Access
															</AccessActionButton>
														)}
														{getTeamMemberAccessState(editingMember) ===
															'revoked' && (
															<AccessActionButton
																type='button'
																onClick={async () => {
																	try {
																		const promoCode =
																			generateTeamInvitationCode(
																				formData.firstName,
																				formData.lastName,
																			);

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
																			invitationCode: result.code,
																			invitationCodeStatus: 'active',
																			invitationCodeExpiresAt: result.expiresAt,
																			userAccountId: null,
																			redeemedByUserId: null,
																			redeemedAt: null,
																		} as any);

																		// Update the team member record in the database
																		await updateTeamMemberApi({
																			id: editingMember!.id,
																			updates: {
																				invitationCodeId: result.id,
																				invitationCode: result.code,
																				invitationCodeStatus: 'active',
																				invitationCodeExpiresAt:
																					result.expiresAt,
																				userAccountId: null,
																				redeemedByUserId: null,
																				redeemedAt: null,
																			} as any,
																		}).unwrap();

																		feedback.notify(
																			'Invitation code regenerated successfully! New code expires in 7 days.',
																		);
																	} catch (error) {
																		console.error(
																			'Failed to regenerate invitation code:',
																			error,
																		);
																		feedback.notify(
																			'Failed to regenerate invitation code. Please try again.',
																		);
																	}
																}}>
																Regenerate Invitation Code
															</AccessActionButton>
														)}
													</AccessActionRow>
													{canShowInvitationToken(editingMember) &&
														getVisibleInvitationCode(editingMember) && (
															<TeamMemberInviteToken style={{ marginTop: 8 }}>
																<span>Invitation token</span>
																<TeamMemberInviteCode>
																	{getVisibleInvitationCode(editingMember)}
																</TeamMemberInviteCode>
															</TeamMemberInviteToken>
														)}
												</AccessControlPanel>
											)}
									</FormGroup>
								)}

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
					</TeamDialogContent>
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
