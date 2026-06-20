import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from 'Redux/store';
import { setCurrentUser } from 'Redux/Slices/userSlice';
import {
	useGetAllMaintenanceHistoryForUserQuery,
	useUpdateUserMutation,
} from 'Redux/API/userSlice';
import { useGetPropertiesQuery } from 'Redux/API/propertySlice';
import { useGetAllDevicesQuery } from 'Redux/API/deviceSlice';
import { useGetTasksQuery } from 'Redux/API/taskSlice';
import { useGetTeamMembersQuery } from 'Redux/API/teamSlice';
import { FileUploader } from 'Components/Library/FileUploader';
import { uploadUserProfileImage } from 'utils/userProfileImageUpload';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../../Components/Library/PageHeaders';
import {
	FormGroup,
	FormLabel,
	FormInput,
	ButtonGroup,
	Section,
} from '../../Components/Library';
import {
	Wrapper,
	Container,
	FormContentWrapper,
	FormSection,
	ImageUploadSection,
	ImagePreview,
	CancelButton,
	SaveButton,
	ErrorMessage,
	SuccessMessage,
	LoadingOverlay,
	UserProfileHeader,
	PageHeader,
	ImageView,
	StatusPill,
	AccountSummaryCard,
	AccountSummaryMetric,
	AccountSummaryIcon,
	AccountSummaryValue,
	AccountSummaryLabel,
	ProfileSectionHeader,
	ProfileSectionTitle,
	ProfileSectionLink,
	ProfileListCard,
	ActivityRow,
	ActivityIcon,
	ActivityTitle,
	ActivityDetail,
	ActivityTime,
	TeamGrid,
	TeamMemberRow,
	TeamMemberAvatar,
	EmptyProfileSection,
} from './UserProfile.styles';
import { Button } from 'pages/PropertyDetailPage/TabSystem/index.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faCircleCheck,
	faClipboardList,
	faGear,
	faHouse,
	faPencil,
	faScrewdriverWrench,
	faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import { formatDate } from 'utils/detailPageUtils';
import COLORS from 'constants/colors';
import { ManagePlanButton, PortfolioPlanSub, PortfolioTop, PortfolioUsage, PortfolioUsageBadge, ProgressFill, ProgressTrack } from 'Components/Library/Navbar/SideNav/SideNav.styles';
import {
	canManageTeam,
	getRemainingPropertySlots,
	getSubscriptionPlanDetails,
} from 'utils/subscriptionUtils';
import { filterPropertyGroupsByRole } from 'utils/dataFilters';
import { TeamMember } from 'Redux/Slices/teamSlice';
import { useStorageUsage } from 'Hooks/useStorageUsage';
import {
	selectIsTeamMemberAccount,
	selectIsTenant,
} from 'Redux/selectors/permissionSelectors';
import { formatStorageBytes } from 'utils/storageQuota';
import { isContinuityEvent } from 'utils/maintenanceEventUtils';

export const UserProfile: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [updateUser] = useUpdateUserMutation();
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);
	const [isEditing, setIsEditing] = useState(false);

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		title: '',
		phone: '',
		address: '',
		image: '',
	});

	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const isUserTenant = useSelector(selectIsTenant);
	const {
		data: summaryProperties = [],
		isLoading: arePropertiesLoading,
	} = useGetPropertiesQuery();
	const {
		data: summarySystems = [],
		isLoading: areSystemsLoading,
	} = useGetAllDevicesQuery();
	const {
		data: summaryTasks = [],
		isLoading: areTasksLoading,
	} = useGetTasksQuery();
	const {
		data: maintenanceHistory = [],
		isLoading: isMaintenanceHistoryLoading,
	} = useGetAllMaintenanceHistoryForUserQuery();
	const showTeamSection =
		isTeamMemberAccount ||
		(!!currentUser?.subscription && canManageTeam(currentUser.subscription));
	const { data: profileTeamMembers = [], isLoading: areTeamMembersLoading } =
		useGetTeamMembersQuery(undefined, {
			skip: !showTeamSection,
		});

	const openTaskCount = React.useMemo(
		() =>
			summaryTasks.filter(
				(task) => task.status !== 'Completed' && task.status !== 'Rejected',
			).length,
		[summaryTasks],
	);

	const completedWorkCount = React.useMemo(() => {
		const visiblePropertyIds = new Set(
			summaryProperties.map((property) => String(property.id || '').trim()),
		);
		const visiblePropertyTitles = new Set(
			summaryProperties
				.map((property) => String(property.title || '').trim())
				.filter(Boolean),
		);
		const completedTaskKeys = new Set<string>();

		maintenanceHistory.forEach((record: any) => {
			const eventType = String(record.eventType || '')
				.trim()
				.toLowerCase();
			const eventSource = String(record.eventSource || '')
				.trim()
				.toLowerCase();
			const status = String(record.status || '')
				.trim()
				.toLowerCase();
			const isTaskCompletion =
				eventType === 'task_completed' ||
				eventType === 'task_approved' ||
				eventSource === 'task_completion' ||
				eventSource === 'task_approval' ||
				status === 'completed' ||
				status === 'approved';

			if (!isContinuityEvent(record)) {
				return;
			}

			const propertyId = String(record.propertyId || '').trim();
			const propertyTitle = String(
				record.propertyTitle || record.property || '',
			).trim();
			const isVisibleRecord =
				(propertyId && visiblePropertyIds.has(propertyId)) ||
				(propertyTitle && visiblePropertyTitles.has(propertyTitle));

			if (!isVisibleRecord) {
				return;
			}

			const linkedTaskId = [
				record.taskId,
				record.originalTaskId,
				record.data?.taskId,
				record.data?.originalTaskId,
				...(Array.isArray(record.linkedTaskIds)
					? record.linkedTaskIds
					: []),
			]
				.map((value) => String(value || '').trim())
				.find(Boolean);

			const recordId = String(record.id || '').trim();
			if (isTaskCompletion && linkedTaskId) {
				completedTaskKeys.add(`task:${linkedTaskId}`);
			} else if (recordId) {
				completedTaskKeys.add(`event:${recordId}`);
			}
		});

		summaryTasks.forEach((task) => {
			if (task.status === 'Completed') {
				completedTaskKeys.add(`task:${task.id}`);
			}
		});

		if (completedTaskKeys.size > 0) {
			return completedTaskKeys.size;
		}

		return summaryProperties.reduce((total, property: any) => {
			const taskHistoryCount = Array.isArray(property.taskHistory)
				? property.taskHistory.length
				: 0;
			return total + taskHistoryCount;
		}, 0);
	}, [maintenanceHistory, summaryProperties, summaryTasks]);

	const accountSummaryMetrics = [
		{
			label: 'Properties',
			value: arePropertiesLoading ? '—' : summaryProperties.length,
			icon: faHouse,
		},
		{
			label: 'Systems',
			value: areSystemsLoading ? '—' : summarySystems.length,
			icon: faGear,
		},
		{
			label: 'Open Tasks',
			value: areTasksLoading ? '—' : openTaskCount,
			icon: faClipboardList,
		},
		{
			label: 'Completed Work',
			value:
				isMaintenanceHistoryLoading || areTasksLoading
					? '—'
					: completedWorkCount,
			icon: faCircleCheck,
		},
	];

	const recentActivity = React.useMemo(() => {
		const activities: Array<{
			id: string;
			title: string;
			detail: string;
			date: string;
			icon: typeof faHouse;
		}> = [];

		summaryProperties.forEach((property) => {
			if (!property.createdAt) return;
			activities.push({
				id: `property-${property.id}`,
				title: 'Property added',
				detail: property.title || 'Property',
				date: property.createdAt,
				icon: faHouse,
			});
		});

		summarySystems.forEach((system) => {
			if (!system.createdAt) return;
			activities.push({
				id: `system-${system.id}`,
				title: 'System added',
				detail:
					[system.brand, system.type].filter(Boolean).join(' ') || 'System',
				date: system.createdAt,
				icon: faGear,
			});
		});

		summaryTasks.forEach((task) => {
			if (task.createdAt) {
				activities.push({
					id: `task-created-${task.id}`,
					title: 'Task added',
					detail: task.title,
					date: task.createdAt,
					icon: faClipboardList,
				});
			}

			if (task.assignee || task.assignedTo) {
				const assigneeId =
					String(task.assignedTo?.id || task.assignee || '').trim();
				const teamMember = profileTeamMembers.find(
					(member) => member.id === assigneeId,
				);
				const assigneeName =
					[
						task.assignedTo?.name,
						teamMember
							? `${teamMember.firstName || ''} ${teamMember.lastName || ''}`.trim()
							: '',
					].find(Boolean) || 'a team member';
				const assignmentDate = task.updatedAt || task.createdAt;

				if (assignmentDate) {
					activities.push({
						id: `task-assigned-${task.id}`,
						title: 'Task assigned',
						detail: `${task.title} to ${assigneeName}`,
						date: assignmentDate,
						icon: faUserCheck,
					});
				}
			}
		});

		maintenanceHistory.forEach((record: any) => {
			const date =
				record.completionDate ||
				record.approvedAt ||
				record.date ||
				record.createdAt;
			if (!date || !record.id) return;

			const eventType = String(record.eventType || '').toLowerCase();
			const activityTitle =
				eventType === 'task_completed'
					? 'Task completed'
					: eventType === 'task_approved'
						? 'Task approved'
						: eventType === 'service_note_added'
							? 'Service note added'
							: eventType === 'repair_logged'
								? 'Repair logged'
								: eventType === 'inspection_completed'
									? 'Inspection completed'
									: 'Maintenance recorded';

			activities.push({
				id: `maintenance-${record.id}`,
				title: activityTitle,
				detail:
					record.title ||
					record.taskTitle ||
					record.description ||
					'Maintenance activity',
				date,
				icon:
					eventType === 'task_completed' || eventType === 'task_approved'
						? faCircleCheck
						: faScrewdriverWrench,
			});
		});

		return activities
			.filter((activity) => !Number.isNaN(new Date(activity.date).getTime()))
			.sort(
				(a, b) =>
					new Date(b.date).getTime() - new Date(a.date).getTime(),
			)
			.slice(0, 3);
	}, [
		summaryProperties,
		summarySystems,
		summaryTasks,
		maintenanceHistory,
		profileTeamMembers,
	]);

	const formatActivityTime = (value: string): string => {
		const date = new Date(value);
		const diffMs = Date.now() - date.getTime();
		const diffDays = Math.floor(Math.abs(diffMs) / 86400000);

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return diffMs >= 0 ? 'Yesterday' : 'Tomorrow';
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
		});
	};

	const { usage: storageUsage, isLoading: isStorageUsageLoading } =
		useStorageUsage(currentUser, !isUserTenant && !isTeamMemberAccount);

	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const teamMembers = React.useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);

	const filteredPropertyGroups = React.useMemo(
		() =>
			filterPropertyGroupsByRole(
				propertyGroups.map((group) => ({
					...group,
					properties: group.properties || [],
				})) as any[],
				currentUser,
				teamMembers.filter((member): member is TeamMember => member !== undefined),
			),
		[propertyGroups, currentUser, teamMembers],
	);

	const totalProperties = React.useMemo(
		() =>
			Array.from(
				new Set(
					filteredPropertyGroups
						.flatMap((group) => group.properties || [])
						.map((property) => property.id),
				),
			).length,
		[filteredPropertyGroups],
	);
	const effectivePlanId =
		currentUser?.subscription?.hasScheduledSubscription &&
			currentUser.subscription.scheduledPlan
			? currentUser.subscription.scheduledPlan
			: currentUser?.subscription?.plan || 'home';
	const planDetails = getSubscriptionPlanDetails(effectivePlanId);

	const effectiveSubscription = currentUser?.subscription
		? { ...currentUser.subscription, plan: effectivePlanId }
		: undefined;
	const remainingSlots = effectiveSubscription
		? getRemainingPropertySlots(effectiveSubscription, totalProperties)
		: 0;
	const maxProperties = planDetails?.maxProperties ?? 1;
	const usagePercent = maxProperties > 0 ? (totalProperties / maxProperties) * 100 : 0;
	const hasPropertyCapacity = maxProperties > 0;
	const planSlotLabel = !hasPropertyCapacity
		? 'Property creation is not included'
		: remainingSlots === 0 && totalProperties > maxProperties
			? `${totalProperties - maxProperties} over plan limit`
			: `${remainingSlots} property slot${remainingSlots === 1 ? '' : 's'} available`;
	const planSubtitle =
		currentUser?.subscription?.hasScheduledSubscription &&
			currentUser.subscription.scheduledPlan
			? `Scheduled plan: ${planDetails?.name || 'Home'}`
			: `Current plan: ${planDetails?.name || 'Home'}`;
	const storageUsagePercent = Math.min(100, storageUsage?.usagePercent || 0);
	const storageUsageLabel = isStorageUsageLoading
		? 'Loading storage...'
		: storageUsage && storageUsage.maxBytes > 0
			? `${formatStorageBytes(storageUsage.usedBytes)} of ${formatStorageBytes(
				storageUsage.maxBytes,
			)}`
			: 'Storage not included';
	const storageFileLabel = storageUsage
		? `${storageUsage.fileCount} of ${storageUsage.maxFiles} files`
		: '';

	// Initialize form with current user data
	useEffect(() => {
		if (currentUser) {
			setFormData({
				firstName: currentUser.firstName || '',
				lastName: currentUser.lastName || '',
				title: currentUser.title || '',
				phone: currentUser.phone || '',
				address: currentUser.address || '',
				image: currentUser.image || '',
			});
		} else {
			navigate('/login');
		}
	}, [currentUser, navigate]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (isTeamMemberAccount) return;
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setError(null);
	};

	const handlePhotoUpload = async (file: File | null) => {
		if (!file || !currentUser) return;
		if (isTeamMemberAccount) {
			setImageError('Your profile is managed by the account owner.');
			return;
		}

		setImageError(null);
		setIsUploadingImage(true);
		try {
			const imageUrl = await uploadUserProfileImage(file, currentUser.id);
			setFormData((prev) => ({
				...prev,
				image: imageUrl,
			}));
		} catch (err) {
			setImageError('Failed to upload image. Please try again.');
			console.error('Image upload error:', err);
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleSave = async () => {
		if (isTeamMemberAccount) {
			setError('Your profile is managed by the account owner.');
			return;
		}
		// currentUser guaranteed to exist

		// Validation
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError('First name and last name are required.');
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Update user in Firebase
			const updatedUser = await updateUser({
				id: currentUser!.id,
				updates: {
					firstName: formData.firstName,
					lastName: formData.lastName,
					title: formData.title,
					phone: formData.phone,
					address: formData.address,
					image: formData.image,
				},
			}).unwrap();

			// Update local Redux state
			dispatch(
				setCurrentUser({
					...currentUser,
					...updatedUser,
				}),
			);

			setSuccess('Profile updated successfully!');
			setTimeout(() => setSuccess(null), 3000);
		} catch (err: any) {
			const errorMessage =
				err?.message || 'Failed to update profile. Please try again.';
			setError(errorMessage);
			console.error('Profile update error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		navigate(-1);
	};
	console.info('Current user in profile:', currentUser);
	// currentUser guaranteed to exist in protected routes

	return (
		<Wrapper>
			{isLoading && <LoadingOverlay />}
			{!isEditing && currentUser ? (
				<>
					<PageHeaderSection>
						<StandardPageTitle>
							My Profile
						</StandardPageTitle>
					</PageHeaderSection>
					<UserProfileHeader style={{ flexWrap: 'wrap', gap: '24px', border: '1px solid #E0E0E0', borderRadius: '8px', padding: '16px' }}>
						<Container style={{ width: '25%' }}>
							<ImageView src={formData.image} alt='Profile' />
							<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: isTeamMemberAccount ? 'not-allowed' : 'pointer', color: isTeamMemberAccount ? '#667085' : '#0f5132' }} onClick={() => !isTeamMemberAccount && setIsEditing(true)}>
								<FontAwesomeIcon icon={faPencil} /> Edit Profile
							</div>
						</Container>
						<div style={{
							width: '50%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '14px', gap: '8px',
						}}>
							<FormLabel style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>{formData.firstName} {formData.lastName}</FormLabel>
							<p>{currentUser?.title}</p>
							<p>{currentUser?.email}</p>
							<p>{`Member since: ${formatDate(currentUser?.createdAt)}`}</p>
						</div>
					</UserProfileHeader>

					<div style={{ marginTop: '24px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<FormLabel style={{ fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>Account Summary</FormLabel>
						<Link to='/properties' style={{ color: COLORS.primary, fontSize: '14px', marginRight: '16px', textDecoration: 'none' }}>View all</Link>
					</div>

					<AccountSummaryCard>
						{accountSummaryMetrics.map((metric) => (
							<AccountSummaryMetric key={metric.label}>
								<AccountSummaryIcon aria-hidden='true'>
									<FontAwesomeIcon icon={metric.icon} />
								</AccountSummaryIcon>
								<div>
									<AccountSummaryValue>{metric.value}</AccountSummaryValue>
									<AccountSummaryLabel>{metric.label}</AccountSummaryLabel>
								</div>
							</AccountSummaryMetric>
						))}
					</AccountSummaryCard>
					<Section style={{ padding: '16px', border: '1px solid #E0E0E0', borderRadius: '8px', display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '12px' }}>
						<PortfolioTop>
							<FormLabel style={{ fontSize: '14px', color: '#666' }}>Plan & Usage</FormLabel>
							<StatusPill style={{ backgroundColor: currentUser?.subscription?.status === 'active' ? COLORS.primary : COLORS.gray300, color: COLORS.bgWhite }}>
								{planDetails?.name || 'Home Plan'}
							</StatusPill>

						</PortfolioTop>
						<PortfolioPlanSub>
							{planSubtitle}
						</PortfolioPlanSub>
						<ProgressTrack>
							<ProgressFill $percent={Math.min(100, usagePercent)} />
						</ProgressTrack>
						<PortfolioUsage>
							{planSlotLabel}
						</PortfolioUsage>
						<PortfolioTop>
							<PortfolioPlanSub>
								Storage
							</PortfolioPlanSub>
							<PortfolioUsageBadge>
								{storageFileLabel || 'Files'}
							</PortfolioUsageBadge>
						</PortfolioTop>
						<ProgressTrack>
							<ProgressFill $percent={storageUsagePercent} />
						</ProgressTrack>
						<PortfolioUsage>
							{storageUsageLabel}
						</PortfolioUsage>
						{/* <ManagePlanButton
							type='button'
							onClick={() => navigate('/paywall')}>
							Manage Plan
						</ManagePlanButton> */}
					</Section>

					<ProfileSectionHeader>
						<ProfileSectionTitle>Recent Activity</ProfileSectionTitle>
					</ProfileSectionHeader>
					<ProfileListCard>
						{recentActivity.length > 0 ? (
							recentActivity.map((activity) => (
								<ActivityRow key={activity.id}>
									<ActivityIcon aria-hidden='true'>
										<FontAwesomeIcon icon={activity.icon} />
									</ActivityIcon>
									<div>
										<ActivityTitle>{activity.title}</ActivityTitle>
										<ActivityDetail>{activity.detail}</ActivityDetail>
									</div>
									<ActivityTime>
										{formatActivityTime(activity.date)}
									</ActivityTime>
								</ActivityRow>
							))
						) : (
							<EmptyProfileSection>
								Your latest property and maintenance activity will appear here.
							</EmptyProfileSection>
						)}
					</ProfileListCard>

					{showTeamSection && (
						<>
							<ProfileSectionHeader>
								<ProfileSectionTitle>Team</ProfileSectionTitle>
								<ProfileSectionLink as={Link} to='/team'>
									View team
								</ProfileSectionLink>
							</ProfileSectionHeader>
							<ProfileListCard>
								{areTeamMembersLoading ? (
									<EmptyProfileSection>Loading team...</EmptyProfileSection>
								) : profileTeamMembers.length > 0 ? (
									<TeamGrid>
										{profileTeamMembers.map((member) => {
											const name =
												`${member.firstName || ''} ${member.lastName || ''}`.trim() ||
												member.email;
											const initials =
												`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() ||
												'?';
											return (
												<TeamMemberRow key={member.id}>
													<TeamMemberAvatar>
														{member.image ? (
															<img src={member.image} alt='' />
														) : (
															initials
														)}
													</TeamMemberAvatar>
													<div>
														<ActivityTitle>{name}</ActivityTitle>
														<ActivityDetail>
															{member.title || member.role || 'Team member'}
														</ActivityDetail>
													</div>
												</TeamMemberRow>
											);
										})}
									</TeamGrid>
								) : (
									<EmptyProfileSection>
										No team members have been added yet.
									</EmptyProfileSection>
								)}
							</ProfileListCard>
						</>
					)}

				</>
			) : (
				<>
					<PageHeader>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>

							<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }} onClick={() => setIsEditing(false)}>
								<FontAwesomeIcon icon={faArrowLeft} />
								<FormLabel style={{ alignSelf: 'center', marginBottom: '5px', padding: 0, fontSize: '18px' }}>
									Edit Profile
								</FormLabel>
							</div>
						</div>
						<div>

							<Button onClick={() => handleSave()} disabled={isLoading || isTeamMemberAccount}>
								Save Changes
							</Button>
						</div>
					</PageHeader>
					<FormContentWrapper>
						{error && <ErrorMessage>{error}</ErrorMessage>}
						{success && <SuccessMessage>{success}</SuccessMessage>}
						{isTeamMemberAccount && (
							<SuccessMessage>
								This profile is managed by the account owner or administrator.
								Ask them to update your name, role, or access details.
							</SuccessMessage>
						)}

						<FormSection>
							{/* Profile Image */}
							<ImageUploadSection>
								<FormLabel>Profile Picture</FormLabel>
								{formData.image && (
									<ImagePreview src={formData.image} alt='Profile' />
								)}
								{!isTeamMemberAccount && (
									<FileUploader
										label='Choose Photo'
										helperText='JPG, PNG, GIF, WEBP (max 8MB)'
										accept='image/*'
										allowedTypes={['image/*']}
										maxSizeBytes={8 * 1024 * 1024}
										setFile={handlePhotoUpload}
										disabled={isUploadingImage || isLoading}
										showSelectedFiles={false}
									/>
								)}
								{imageError && <ErrorMessage>{imageError}</ErrorMessage>}
							</ImageUploadSection>

							{/* First Name */}
							<FormGroup>
								<FormLabel htmlFor='firstName'>First Name *</FormLabel>
								<FormInput
									id='firstName'
									name='firstName'
									type='text'
									value={formData.firstName}
									onChange={handleInputChange}
									placeholder='Enter first name'
									disabled={isLoading || isTeamMemberAccount}
								/>
							</FormGroup>

							{/* Last Name */}
							<FormGroup>
								<FormLabel htmlFor='lastName'>Last Name *</FormLabel>
								<FormInput
									id='lastName'
									name='lastName'
									type='text'
									value={formData.lastName}
									onChange={handleInputChange}
									placeholder='Enter last name'
									disabled={isLoading || isTeamMemberAccount}
								/>
							</FormGroup>

							{/* Title */}
							<FormGroup>
								<FormLabel htmlFor='title'>Job Title</FormLabel>
								<FormInput
									id='title'
									name='title'
									type='text'
									value={formData.title}
									onChange={handleInputChange}
									placeholder='e.g., Property Manager, Administrator'
									disabled={isLoading || isTeamMemberAccount}
								/>
							</FormGroup>

							{/* Phone */}
							<FormGroup>
								<FormLabel htmlFor='phone'>Phone Number</FormLabel>
								<FormInput
									id='phone'
									name='phone'
									type='tel'
									value={formData.phone}
									onChange={handleInputChange}
									placeholder='Enter phone number'
									disabled={isLoading || isTeamMemberAccount}
								/>
							</FormGroup>

							{/* Address */}
							<FormGroup>
								<FormLabel htmlFor='address'>Mailing Address</FormLabel>
								<FormInput
									id='address'
									name='address'
									type='text'
									value={formData.address}
									onChange={handleInputChange}
									placeholder='Enter mailing address'
									disabled={isLoading || isTeamMemberAccount}
								/>
							</FormGroup>

							{/* Email (Read-only) */}
							<FormGroup>
								<FormLabel htmlFor='email'>Email</FormLabel>
								<FormInput
									id='email'
									type='email'
									value={currentUser!.email}
									disabled
									placeholder='Your email address'
								/>
								<small style={{ color: '#666', marginTop: '0.25rem' }}>
									Email cannot be changed
								</small>
							</FormGroup>

							{/* Role (Read-only) */}
							<FormGroup>
								<FormLabel htmlFor='role'>Role</FormLabel>
								<FormInput
									id='role'
									type='text'
									value={currentUser!.role}
									disabled
									placeholder='Your role'
								/>
								<small style={{ color: '#666', marginTop: '0.25rem' }}>
									Role cannot be changed
								</small>
							</FormGroup>
						</FormSection>
					</FormContentWrapper>
					<FormSection
						style={{
							borderBottom: '1px solid #E0E0E0',
							marginBottom: '24px',
						}}
					>
						{isEditing && (
							<ButtonGroup>
								<CancelButton onClick={handleCancel} disabled={isLoading}>
									{isTeamMemberAccount ? 'Back' : 'Cancel'}
								</CancelButton>
								{!isTeamMemberAccount && (
									<SaveButton onClick={handleSave} disabled={isLoading}>
										{isLoading ? 'Saving...' : 'Save Changes'}
									</SaveButton>
								)}
							</ButtonGroup>
						)}
					</FormSection>
				</>
			)
			}
		</Wrapper >
	);
};
