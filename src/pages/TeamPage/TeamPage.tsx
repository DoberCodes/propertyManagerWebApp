import React, { useState, useMemo } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faChevronUp,
	faFolderOpen,
	faPen,
	faPlus,
	faShieldHalved,
	faTrash,
	faUserPlus,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
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
	AppPageHeader as StandardAppPageHeader,
	AppPageTitle as StandardPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../../Components/Library/AppPageLayout/AppPageLayout.styles';
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
	HeaderActions,
	MobileTeamGroupActions,
	FloatingTeamGroupButton,
	TeamHero,
	TeamHeroContent,
	TeamHeroEyebrow,
	TeamHeroTitle,
	TeamHeroText,
	TeamStatsGrid,
	TeamStatCard,
	TeamStatValue,
	TeamStatLabel,
	AddTeamGroupButton,
	TeamGroupSection,
	TeamGroupHeader,
	TeamGroupTitleBlock,
	TeamGroupMeta,
	TeamGroupTitle,
	TeamGroupNameInput,
	TeamGroupActions,
	TeamGroupActionButton,
	TeamMembersGrid,
	TeamMemberCard,
	TeamMemberIdentity,
	TeamMemberAvatarWrap,
	TeamMemberImage,
	TeamMemberImagePlaceholder,
	TeamMemberDetails,
	TeamMemberName,
	TeamMemberTitle,
	TeamMemberProperties,
	TeamMemberPropertiesLabel,
	TeamMemberPropertyList,
	TeamMemberPropertyChip,
	TeamMemberInviteToken,
	TeamMemberInviteCode,
	AccessPill,
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
	TeamGroupDialogContent,
	TeamGroupManagementIntro,
	TeamGroupManagementList,
	TeamGroupManagementToolbar,
	TeamGroupManagementTitle,
	TeamGroupManagementAddButton,
	TeamGroupManagementRow,
	TeamGroupManagementInfo,
	TeamGroupManagementNameInput,
	TeamGroupManagementMeta,
	TeamGroupManagementActions,
	TeamGroupManagementButton,
	DialogTitle,
	DialogCloseButton,
	DialogIntro,
	DialogBody,
	CollapsibleDialogSection,
	CollapsibleDialogSummary,
	CollapsibleDialogBody,
	DialogSectionBadge,
	DialogSectionChevron,
	DialogSectionHeader,
	DialogSectionSummaryActions,
	DialogSectionTitle,
	DialogSectionText,
	InlineHelpText,
	LeftColumn,
	RightColumn,
	ImageUploadSection,
	ImagePreview,
	PropertyMultiSelect,
	PropertyCheckbox,
	QuickTaskHistory,
	TaskHistoryItem,
	FileUploadSection,
	FileList,
	FileItem,
	RemoveFileButton,
	DialogFooter,
	CancelButton,
	DeleteMemberButton,
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
import { canUseAdvancedTeamManagement } from '../../utils/subscriptionUtils';

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

type TeamMemberDialogSectionKey =
	| 'profile'
	| 'contact'
	| 'role'
	| 'access'
	| 'properties'
	| 'notes'
	| 'history';

const DEFAULT_TEAM_MEMBER_DIALOG_SECTIONS: Record<
	TeamMemberDialogSectionKey,
	boolean
> = {
	profile: true,
	contact: false,
	role: true,
	access: false,
	properties: true,
	notes: false,
	history: false,
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
		() => () => { },
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
	const isAdvancedTeamManagement =
		!!currentUser?.subscription &&
		canUseAdvancedTeamManagement(currentUser.subscription);

	const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
	const [showTeamGroupManagementDialog, setShowTeamGroupManagementDialog] =
		useState(false);
	const [teamGroupDraftNames, setTeamGroupDraftNames] = useState<
		Record<string, string>
	>({});
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
	const [teamMemberDialogOpenSections, setTeamMemberDialogOpenSections] =
		useState(DEFAULT_TEAM_MEMBER_DIALOG_SECTIONS);
	const [generatedInvitationCode, setGeneratedInvitationCode] =
		useState<string>('');
	const [invitationCodeByMemberId, setInvitationCodeByMemberId] = useState<Record<string, string>>({});
	const editingMemberAccessState = getTeamMemberAccessState(editingMember);
	const isEditingAcceptedMember = editingMemberAccessState === 'accepted';

	const handleTeamMemberDialogSectionToggle =
		(section: TeamMemberDialogSectionKey) =>
		(event: React.SyntheticEvent<HTMLDetailsElement>) => {
			const isOpen = event.currentTarget.open;
			setTeamMemberDialogOpenSections((prev) => ({
				...prev,
				[section]: isOpen,
			}));
		};

	const renderTeamMemberDialogSummaryActions = (
		section: TeamMemberDialogSectionKey,
		badge: React.ReactNode,
	) => (
		<DialogSectionSummaryActions>
			<DialogSectionBadge>{badge}</DialogSectionBadge>
			<DialogSectionChevron aria-hidden='true'>
				<FontAwesomeIcon
					icon={
						teamMemberDialogOpenSections[section]
							? faChevronUp
							: faChevronDown
					}
				/>
			</DialogSectionChevron>
		</DialogSectionSummaryActions>
	);

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
	const simpleTeamMembers = teamMembers.filter((member) => member.role !== 'tenant');
	const visibleTeamGroups = isAdvancedTeamManagement
		? filteredTeamGroups
		: simpleTeamMembers.length > 0
			? [
				{
					id: 'simple-team',
					userId: '',
					name: 'Team Members',
					linkedProperties: [],
					members: simpleTeamMembers,
				},
			]
			: [];
	const visibleTeamMembers = visibleTeamGroups.flatMap(
		(group) => group.members || [],
	);
	const activeAccessCount = visibleTeamMembers.filter(
		(member) => getTeamMemberAccessState(member) === 'accepted',
	).length;
	const pendingAccessCount = visibleTeamMembers.filter(
		(member) => getTeamMemberAccessState(member) === 'pending',
	).length;
	const assignedPropertyCount = new Set(
		visibleTeamMembers.flatMap((member) => member.linkedProperties || []),
	).size;

	const handleAddTeamMember = (groupId?: string | null) => {
		setCurrentGroupId(isAdvancedTeamManagement ? groupId || null : null);
		setEditingMember(null);
		setFormData({
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			role: isAdvancedTeamManagement
				? USER_ROLES.PROPERTY_MANAGER
				: USER_ROLES.ADMIN,
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
		setTeamMemberDialogOpenSections({
			...DEFAULT_TEAM_MEMBER_DIALOG_SECTIONS,
			access: canManage,
		});
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
		if (!isAdvancedTeamManagement) return;
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
			...(isAdvancedTeamManagement && currentGroupId && { groupId: currentGroupId }),
			userId: currentUser!.id,
			firstName: formData.firstName,
			lastName: formData.lastName,
			title: formData.title.trim(),
			email: isEditingAcceptedMember ? editingMember!.email : formData.email,
			phone: formData.phone,
			role: isAdvancedTeamManagement ? formData.role : USER_ROLES.ADMIN,
			address: buildMailingAddress({
				street: formData.address,
				city: formData.mailingCity,
				state: formData.mailingState,
				zip: formData.mailingZip,
			}),
			image: imagePreview || editingMember?.image || '',
			notes: formData.notes,
			linkedProperties: isAdvancedTeamManagement ? formData.linkedProperties : [],
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
			isAdvancedTeamManagement
				? (typeof member.groupId === 'string' && member.groupId.trim()) ||
				(groupId && groupId !== 'orphan' ? groupId : null)
				: null;
		setCurrentGroupId(resolvedGroupId || null);
		setEditingMember(member);
		const mailingAddress = parseMailingAddress(member.address);
		setFormData({
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			phone: member.phone,
			role: isAdvancedTeamManagement ? member.role : USER_ROLES.ADMIN,
			title: member.title || '',
			address: mailingAddress.street,
			mailingCity: mailingAddress.city,
			mailingState: mailingAddress.state,
			mailingZip: mailingAddress.zip,
			notes: member.notes,
			linkedProperties: isAdvancedTeamManagement ? member.linkedProperties : [],
			enableInvitationCode: !!(member as any).invitationCodeId, // Enable if they already have an invitation code
		});
		setImagePreview(member.image || null);
		setUploadedFiles(member.files || []);
		setTeamMemberDialogOpenSections({
			...DEFAULT_TEAM_MEMBER_DIALOG_SECTIONS,
			access: getTeamMemberAccessState(member) !== 'none',
			notes: Boolean(member.notes || member.files?.length),
			history: Boolean(member.taskHistory?.length),
		});
		setGeneratedInvitationCode(''); // Reset - will be generated if needed
		setShowTeamMemberDialog(true);
	};

	const handleDeleteTeamMember = async (memberId: string): Promise<boolean> => {
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

			return true;
		} catch (error) {
			console.error('Error deleting team member:', error);
			feedback.notify('Failed to delete team member. Please try again.');
			return false;
		}
	};
	const handleRequestDeleteTeamMember = (member: TeamMember) => {
		setWarningDialogTitle('Delete Team Member');
		setWarningDialogMessage(
			`Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`,
		);
		setWarningDialogConfirmText('Delete');
		setWarningDialogCancelText('Cancel');
		setWarningDialogOnConfirm(() => async () => {
			setWarningDialogOpen(false);
			const deleted = await handleDeleteTeamMember(member.id);
			if (deleted) {
				setShowTeamMemberDialog(false);
			}
		});
		setWarningDialogOpen(true);
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

	const handleOpenTeamGroupManagement = () => {
		setTeamGroupDraftNames(
			teamGroups.reduce<Record<string, string>>((drafts, group) => {
				drafts[String(group.id)] = String(group.name || '');
				return drafts;
			}, {}),
		);
		setShowTeamGroupManagementDialog(true);
	};

	const handleCreateTeamGroupFromManagement = async () => {
		await handleAddTeamGroup();
	};

	const handleSaveTeamGroupManagement = async () => {
		for (const group of teamGroups) {
			const groupId = String(group.id);
			const nextName = String(teamGroupDraftNames[groupId] || '').trim();
			const currentName = String(group.name || '').trim();

			if (!nextName) {
				feedback.notify('Enter a name for each team group.');
				return;
			}

			if (nextName === currentName) {
				continue;
			}

			try {
				await updateTeamGroup({
					id: groupId,
					updates: { name: nextName },
				}).unwrap();

				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'team_group_updated',
						title: 'Team Group Updated',
						message: `Team group "${nextName}" has been updated`,
						data: {
							groupId,
							groupName: nextName,
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
				feedback.notify('Unable to save team group changes. Please try again.');
				return;
			}
		}

		feedback.notify('Team groups updated.');
		setShowTeamGroupManagementDialog(false);
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
		const groupToDelete = groupsWithMembers.find((g) => g.id === groupId);
		setWarningDialogTitle('Delete Team Group');
		setWarningDialogMessage(
			`Are you sure you want to delete "${groupToDelete?.name || 'this team group'}"? This action cannot be undone.`,
		);
		setWarningDialogConfirmText('Delete');
		setWarningDialogCancelText('Cancel');
		setWarningDialogOnConfirm(() => async () => {
			setWarningDialogOpen(false);
			try {
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
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardPageTitle>Team</StandardPageTitle>
				</StandardAppPageTitleBlock>
				<HeaderActions>
					{canManage && isAdvancedTeamManagement && (
						<AddTeamGroupButton onClick={handleAddTeamGroup}>
							<FontAwesomeIcon icon={faPlus} />
							Add Group
						</AddTeamGroupButton>
					)}
				</HeaderActions>
			</StandardAppPageHeader>

			<TeamHero>
				<TeamHeroContent>
					<TeamHeroEyebrow>
						<FontAwesomeIcon icon={faUsers} />
						Team access
					</TeamHeroEyebrow>
					<TeamHeroTitle>Keep the right people connected to the right properties.</TeamHeroTitle>
					<TeamHeroText>
						Invite your team, assign property access, and keep contact details,
						notes, and documents in one place.
					</TeamHeroText>
				</TeamHeroContent>
				<TeamStatsGrid aria-label='Team summary'>
					<TeamStatCard>
						<TeamStatValue>{visibleTeamMembers.length}</TeamStatValue>
						<TeamStatLabel>Team members</TeamStatLabel>
					</TeamStatCard>
					<TeamStatCard>
						<TeamStatValue>{activeAccessCount}</TeamStatValue>
						<TeamStatLabel>Active access</TeamStatLabel>
					</TeamStatCard>
					<TeamStatCard>
						<TeamStatValue>{pendingAccessCount}</TeamStatValue>
						<TeamStatLabel>Pending invites</TeamStatLabel>
					</TeamStatCard>
					<TeamStatCard>
						<TeamStatValue>
							{isAdvancedTeamManagement ? assignedPropertyCount : properties.length}
						</TeamStatValue>
						<TeamStatLabel>Properties covered</TeamStatLabel>
					</TeamStatCard>
				</TeamStatsGrid>
			</TeamHero>

			{canManage && isAdvancedTeamManagement && (
				<MobileTeamGroupActions aria-label='Team group actions'>
					<FloatingTeamGroupButton
						type='button'
						onClick={handleOpenTeamGroupManagement}
						aria-label='Manage team groups'
						title='Manage team groups'>
						<FontAwesomeIcon icon={faFolderOpen} size='sm' />
					</FloatingTeamGroupButton>
				</MobileTeamGroupActions>
			)}

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
							: 'You can review current team assignments in read-only mode. Upgrade to Property to invite team members.'
					}
					upgradeLabel='Upgrade for Team Access'
					showUpgradeAction={!isTeamMemberAccount}
				/>
			)}

			<TeamGroupSection>
				{visibleTeamGroups.length === 0 ? (
					<EmptyState>
						<p>No team members yet.</p>
						<p>Add your first team member to start sharing maintenance work.</p>
						{canManage && (
							<AddTeamGroupButton onClick={() => handleAddTeamMember(null)}>
								Add Team Member
							</AddTeamGroupButton>
						)}
					</EmptyState>
				) : visibleTeamGroups.map((group) => (
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
								<TeamGroupTitleBlock>
									<TeamGroupTitle>{group.name}</TeamGroupTitle>
									<TeamGroupMeta>
										{(group.members || []).length}{' '}
										{(group.members || []).length === 1 ? 'person' : 'people'}
									</TeamGroupMeta>
								</TeamGroupTitleBlock>
							)}
							{canManage && isAdvancedTeamManagement && group.id !== 'simple-team' && (
								<TeamGroupActions>
									<TeamGroupActionButton
										aria-label='Edit'
										title='Edit group'
										onClick={() => handleEditTeamGroup(group.id)}>
										<FontAwesomeIcon icon={faPen} />
										✎
									</TeamGroupActionButton>
									<TeamGroupActionButton
										aria-label='Delete'
										title='Delete group'
										onClick={() => handleDeleteTeamGroup(group.id)}>
										<FontAwesomeIcon icon={faTrash} />
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
								const simpleTeamAssignedProperties =
									!isAdvancedTeamManagement && member.role !== 'tenant';
								const visibleAssignedProperties = assignedPropertyTitles.slice(0, 3);
								const hiddenAssignedPropertyCount =
									assignedPropertyTitles.length - visibleAssignedProperties.length;
								const accessState = getTeamMemberAccessState(member);

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
										<TeamMemberIdentity>
											<TeamMemberAvatarWrap>
												{member.image ? (
													<TeamMemberImage
														src={member.image}
														alt={`${member.firstName} ${member.lastName}`}
													/>
												) : (
													<TeamMemberImagePlaceholder>
														{member.firstName.charAt(0)}
														{member.lastName.charAt(0) || '?'}
													</TeamMemberImagePlaceholder>
												)}
											</TeamMemberAvatarWrap>
											<TeamMemberDetails>
												<TeamMemberName>
													{member.firstName} {member.lastName}
												</TeamMemberName>
												<TeamMemberTitle>
													{member.title ||
														ROLE_OPTIONS.find((role) => role.value === member.role)
															?.label ||
														'Team member'}
												</TeamMemberTitle>
												{accessState !== 'none' && (
													<AccessPill $status={accessState}>
														<FontAwesomeIcon icon={faShieldHalved} />
														{accessState === 'accepted'
															? 'Active'
															: accessState === 'pending'
																? `Invite pending - ${formatExpirationDate(
																	(member as any).invitationCodeExpiresAt,
																)}`
																: 'Revoked'}
													</AccessPill>
												)}
											</TeamMemberDetails>
										</TeamMemberIdentity>
										<TeamMemberProperties>
											<TeamMemberPropertiesLabel>
												Assigned Properties
											</TeamMemberPropertiesLabel>
											<TeamMemberPropertyList>
												{simpleTeamAssignedProperties ? (
													<TeamMemberPropertyChip>All properties</TeamMemberPropertyChip>
												) : visibleAssignedProperties.length > 0 ? (
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
									</TeamMemberCard>
								);
							})}

							{canManage && (
								<AddTeamMemberCard
									onClick={() =>
										handleAddTeamMember(
											isAdvancedTeamManagement && group.id !== 'orphan'
												? group.id
												: null,
										)
									}>
									<AddIcon>
										<FontAwesomeIcon icon={faUserPlus} />
									</AddIcon>
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
								<span aria-hidden='true'>×</span>
								✕
							</DialogCloseButton>
						</LibraryDialogHeader>

						<DialogIntro>
							Keep team records simple: add contact details, choose what they can
							access, and store helpful notes or files for future reference.
						</DialogIntro>

						<DialogBody>
							<LeftColumn>
								<CollapsibleDialogSection
									open={teamMemberDialogOpenSections.profile}
									onToggle={handleTeamMemberDialogSectionToggle('profile')}>
									<CollapsibleDialogSummary>
										<DialogSectionHeader>
											<DialogSectionTitle>Profile</DialogSectionTitle>
											<DialogSectionText>
												Start with the details everyone needs to recognize this
												person.
											</DialogSectionText>
										</DialogSectionHeader>
										{renderTeamMemberDialogSummaryActions('profile', 'Required')}
									</CollapsibleDialogSummary>
									<CollapsibleDialogBody>
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
									</CollapsibleDialogBody>
								</CollapsibleDialogSection>

								<CollapsibleDialogSection
									open={teamMemberDialogOpenSections.contact}
									onToggle={handleTeamMemberDialogSectionToggle('contact')}>
									<CollapsibleDialogSummary>
										<DialogSectionHeader>
											<DialogSectionTitle>Contact details</DialogSectionTitle>
											<DialogSectionText>
												Optional phone and mailing details for quick reference.
											</DialogSectionText>
										</DialogSectionHeader>
										{renderTeamMemberDialogSummaryActions('contact', 'Optional')}
									</CollapsibleDialogSummary>
									<CollapsibleDialogBody>

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
									</CollapsibleDialogBody>
								</CollapsibleDialogSection>

							</LeftColumn>

							<RightColumn>
								<CollapsibleDialogSection
									open={teamMemberDialogOpenSections.role}
									onToggle={handleTeamMemberDialogSectionToggle('role')}>
									<CollapsibleDialogSummary>
										<DialogSectionHeader>
											<DialogSectionTitle>Role & group</DialogSectionTitle>
											<DialogSectionText>
												Choose how this person fits into your team.
											</DialogSectionText>
										</DialogSectionHeader>
										{renderTeamMemberDialogSummaryActions(
											'role',
											ROLE_OPTIONS.find((role) => role.value === formData.role)
												?.label || 'Team member',
										)}
									</CollapsibleDialogSummary>
									<CollapsibleDialogBody>

									{isAdvancedTeamManagement ? (
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
									) : (
										<FormGroup>
											<FormLabel>Role</FormLabel>
											<FormInput value='Administrator' disabled />
										</FormGroup>
									)}

									<FormGroup>
										<FormLabel>Job Title</FormLabel>
										<FormInput
											type='text'
											placeholder='e.g., Leasing Coordinator, Maintenance Lead'
											value={formData.title}
											onChange={(e) => handleFormChange('title', e.target.value)}
										/>
									</FormGroup>

									{isAdvancedTeamManagement && (
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
									)}
									</CollapsibleDialogBody>
								</CollapsibleDialogSection>

								{canManage && (
									<CollapsibleDialogSection
										open={teamMemberDialogOpenSections.access}
										onToggle={handleTeamMemberDialogSectionToggle('access')}>
										<CollapsibleDialogSummary>
											<DialogSectionHeader>
												<DialogSectionTitle>Login access</DialogSectionTitle>
												<DialogSectionText>
													Invite this person only if they should sign in to
													Maintley.
												</DialogSectionText>
											</DialogSectionHeader>
											{renderTeamMemberDialogSummaryActions(
												'access',
												editingMember
													? getTeamMemberAccessState(editingMember) === 'accepted'
														? 'Active'
														: getTeamMemberAccessState(editingMember) === 'pending'
															? 'Pending'
															: getTeamMemberAccessState(editingMember) === 'revoked'
																? 'Revoked'
																: 'No login'
													: formData.enableInvitationCode === false
														? 'Off'
														: 'Invite',
											)}
										</CollapsibleDialogSummary>
										<CollapsibleDialogBody>
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
										</CollapsibleDialogBody>
									</CollapsibleDialogSection>
								)}

								<CollapsibleDialogSection
									open={teamMemberDialogOpenSections.properties}
									onToggle={handleTeamMemberDialogSectionToggle('properties')}>
									<CollapsibleDialogSummary>
										<DialogSectionHeader>
											<DialogSectionTitle>Property access</DialogSectionTitle>
											<DialogSectionText>
												Choose the properties this person should help manage.
											</DialogSectionText>
										</DialogSectionHeader>
										{renderTeamMemberDialogSummaryActions(
											'properties',
											isAdvancedTeamManagement
												? `${formData.linkedProperties.length} selected`
												: 'All properties',
										)}
									</CollapsibleDialogSummary>
									<CollapsibleDialogBody>
									{isAdvancedTeamManagement ? (
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
									) : (
										<TeamMemberPropertyList>
											<TeamMemberPropertyChip>All properties</TeamMemberPropertyChip>
										</TeamMemberPropertyList>
									)}
									</CollapsibleDialogBody>
								</CollapsibleDialogSection>

								<CollapsibleDialogSection
									open={teamMemberDialogOpenSections.notes}
									onToggle={handleTeamMemberDialogSectionToggle('notes')}>
									<CollapsibleDialogSummary>
										<DialogSectionHeader>
											<DialogSectionTitle>Notes & files</DialogSectionTitle>
											<DialogSectionText>
												Store helpful context, certifications, or contact notes.
											</DialogSectionText>
										</DialogSectionHeader>
										{renderTeamMemberDialogSummaryActions(
											'notes',
											uploadedFiles.length
												? `${uploadedFiles.length} file${
														uploadedFiles.length === 1 ? '' : 's'
													}`
												: 'Optional',
										)}
									</CollapsibleDialogSummary>
									<CollapsibleDialogBody>
									<FormGroup>
										<FormLabel>Notes</FormLabel>
										<FormTextarea
											placeholder='Add helpful notes about this team member...'
											value={formData.notes}
											onChange={(e) => handleFormChange('notes', e.target.value)}
										/>
									</FormGroup>

									<FileUploadSection>
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
															<RemoveFileButton
																type='button'
																onClick={() => handleRemoveFile(fileId)}>
																<FontAwesomeIcon icon={faTrash} />
																✕
															</RemoveFileButton>
														</FileItem>
													);
												})}
											</FileList>
										)}
									</FileUploadSection>
									</CollapsibleDialogBody>
								</CollapsibleDialogSection>

								{/* Task History */}
								{editingMember && (
									<CollapsibleDialogSection
										open={teamMemberDialogOpenSections.history}
										onToggle={handleTeamMemberDialogSectionToggle('history')}>
										<CollapsibleDialogSummary>
											<DialogSectionHeader>
												<DialogSectionTitle>Recent task history</DialogSectionTitle>
												<DialogSectionText>
													Recently completed or assigned work tied to this person.
												</DialogSectionText>
											</DialogSectionHeader>
											{renderTeamMemberDialogSummaryActions(
												'history',
												`${editingMember.taskHistory?.length || 0} items`,
											)}
										</CollapsibleDialogSummary>
										<CollapsibleDialogBody>
										<QuickTaskHistory>
											{editingMember.taskHistory?.length ? (
												editingMember.taskHistory.map((task, idx) => (
													<TaskHistoryItem key={idx}>
														<div>
															<span>{task.task}</span>
														</div>
														<span>{task.date}</span>
													</TaskHistoryItem>
												))
											) : (
												<InlineHelpText>No recent task history yet.</InlineHelpText>
											)}
										</QuickTaskHistory>
										</CollapsibleDialogBody>
									</CollapsibleDialogSection>
								)}
							</RightColumn>
						</DialogBody>

						<DialogFooter>
							{editingMember &&
								canManage &&
								currentUser?.email !== editingMember.email && (
									<DeleteMemberButton
										type='button'
										onClick={() =>
											handleRequestDeleteTeamMember(editingMember)
										}>
										Delete Member
									</DeleteMemberButton>
								)}
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

			{showTeamGroupManagementDialog && (
				<DialogOverlay onClick={() => setShowTeamGroupManagementDialog(false)}>
					<TeamGroupDialogContent onClick={(e) => e.stopPropagation()}>
						<LibraryDialogHeader>
							<DialogTitle>Manage Team Groups</DialogTitle>
							<DialogCloseButton
								onClick={() => setShowTeamGroupManagementDialog(false)}>
								<span aria-hidden='true'>×</span>
							</DialogCloseButton>
						</LibraryDialogHeader>

						<TeamGroupManagementIntro>
							Organize your team into groups so it is easier to assign work and
							understand who helps with each part of the portfolio.
						</TeamGroupManagementIntro>

						<TeamGroupManagementList>
							<TeamGroupManagementToolbar>
								<TeamGroupManagementTitle>Team groups</TeamGroupManagementTitle>
								<TeamGroupManagementAddButton
									type='button'
									onClick={handleCreateTeamGroupFromManagement}>
									<FontAwesomeIcon icon={faPlus} />
									New Group
								</TeamGroupManagementAddButton>
							</TeamGroupManagementToolbar>
							{teamGroups.length === 0 ? (
								<EmptyState>
									<p>No team groups yet.</p>
									<p>Create a group to start organizing team members.</p>
								</EmptyState>
							) : (
								teamGroups.map((group) => {
									const groupId = String(group.id);
									const memberCount =
										groupsWithMembers.find((item) => String(item.id) === groupId)
											?.members?.length || 0;
									const canDeleteGroup = memberCount === 0;

									return (
										<TeamGroupManagementRow key={groupId}>
											<TeamGroupManagementInfo>
												<TeamGroupManagementNameInput
													type='text'
													value={
														teamGroupDraftNames[groupId] ??
														String(group.name || '')
													}
													onChange={(event) =>
														setTeamGroupDraftNames((current) => ({
															...current,
															[groupId]: event.target.value,
														}))
													}
													aria-label={`Team group name for ${group.name}`}
												/>
												<TeamGroupManagementMeta>
													{memberCount} {memberCount === 1 ? 'member' : 'members'}
													{!canDeleteGroup &&
														' · Move members before deleting'}
												</TeamGroupManagementMeta>
											</TeamGroupManagementInfo>
											<TeamGroupManagementActions>
												<TeamGroupManagementButton
													type='button'
													$variant='danger'
													disabled={!canDeleteGroup}
													title={
														canDeleteGroup
															? 'Delete team group'
															: 'Move members before deleting this group'
													}
													onClick={() => handleDeleteTeamGroup(groupId)}>
													<FontAwesomeIcon icon={faTrash} />
													Delete
												</TeamGroupManagementButton>
											</TeamGroupManagementActions>
										</TeamGroupManagementRow>
									);
								})
							)}
						</TeamGroupManagementList>

						<DialogFooter>
							<CancelButton
								type='button'
								onClick={() => setShowTeamGroupManagementDialog(false)}>
								Cancel
							</CancelButton>
							<SaveButton type='button' onClick={handleSaveTeamGroupManagement}>
								Save Changes
							</SaveButton>
						</DialogFooter>
					</TeamGroupDialogContent>
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
