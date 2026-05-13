import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faEllipsisV,
	faCamera,
} from '@fortawesome/free-solid-svg-icons';
import { PropertyDetailPageProps } from '../../types/PropertyDetailPage.types';
import { RootState } from '../../Redux/store/store';
import { User } from '../../Redux/Slices/userSlice';
import {
	resetActiveTab,
	setActiveTab as setAppActiveTab,
} from '../../Redux/Slices/appSlice';

import { useTaskHandlers } from 'pages/PropertyDetailPage/useTaskHandlers';
import { useUnitHandlers } from 'pages/PropertyDetailPage/useUnitHandlers';
import { usePropertyEditHandlers } from 'pages/PropertyDetailPage/usePropertyEditHandlers';
import { useMaintenanceRequestHandlers } from './useMaintenanceRequestHandlers';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useCreatePropertyGroupMutation,
	useGetUnitsQuery,
} from 'Redux/API/propertySlice';
import { useGetContractorsByPropertyQuery } from '../../Redux/API/contractorSlice';
import {
	useGetMaintenanceHistoryByPropertyQuery,
	useAddMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
} from '../../Redux/API/maintenanceSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';

// Tenant APIs moved to tenantSlice
import {
	useRemoveTenantMutation,
	useLazyGetTenantInvitationCodeQuery,
	useLazyGetTenantInvitationCodesByEmailQuery,
} from '../../Redux/API/tenantSlice';
import { canApproveMaintenanceRequest } from '../../utils/permissions';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	selectCanAccessProperties,
	selectIsHomeowner,
	selectIsTenant,
} from '../../Redux/selectors/permissionSelectors';
import { isTrialExpired } from '../../utils/subscriptionUtils';
import { TeamMember } from '../../types/Team.types';
import { useFavorites } from '../../Hooks/useFavorites';
import {
	uploadPropertyImage,
	isValidPropertyImageFile,
} from '../../utils/propertyImageUpload';
import { getFamilyMembers } from '../../services/authService';
import { ZeroState } from '../../Components/Library/ZeroState/ZeroState';
import { TaskCompletionModal } from 'Components/TaskCompletionModal';
import { FileUploader } from 'Components/Library/FileUploader';

import { ConvertRequestToTaskModal } from 'Components/ConvertRequestToTaskModal';
import { AddTenantModal } from 'Components/AddTenantModal';
import { MaintenanceRequestModal } from 'Components/MaintenanceRequestModal';
import { DeleteConfirmationModal } from 'Components/Library/Modal/DeleteConfirmationModal';
import {
	Wrapper,
	Header,
	HeaderContent,
	PropertyTitle,
	FavoriteButton,
	BackButton,
	EmptyState,
	TitleContainer,
	EditableTitleInput,
	ContentWrapper,
} from './PropertyDetailPage.styles';

import { DeviceModal } from '../../Components/Library/Modal';
import {
	useDeleteTaskMutation,
	useGetTasksQuery,
} from '../../Redux/API/taskSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import { TabSystem } from './TabSystem';
import { UnitModal } from '../../Components/Library';
import { TaskFinancials } from '../../types/Task.types';
import { PropertyDialog } from '../../Components/PropertiesTab/PropertyDialog';

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = (
	props,
) => {
	const feedback = useAppFeedback();
	const navigate = useNavigate();
	const { slug } = useParams<{ slug: string }>();
	// Get current user
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch();

	// Reset active tab when leaving PropertyDetailPage
	useEffect(() => {
		return () => {
			dispatch(resetActiveTab());
		};
	}, [dispatch]);
	const isUserTenant = useSelector(selectIsTenant);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	const canManageProperties =
		canAccessProperties &&
		!!currentUser?.subscription &&
		!isTrialExpired(currentUser.subscription) &&
		!isUserTenant;

	const { isFavorite, toggleFavorite } = useFavorites(currentUser!.id);

	// Fetch properties from Firebase
	const { data: firebaseProperties = [], isLoading: isLoadingProperties } =
		useGetPropertiesQuery();

	// DEBUG: Log properties immediately after query
	if (firebaseProperties && firebaseProperties.length > 0) {
		console.log(
			'DEBUG: useGetPropertiesQuery returned properties:',
			firebaseProperties.length,
		);
		console.log(
			'DEBUG: Property slugs:',
			firebaseProperties.map((p: any) => p.slug),
		);
	} else {
		console.log(
			'DEBUG: useGetPropertiesQuery returned empty or no data. isLoading:',
			isLoadingProperties,
		);
	}

	// Get property groups from Redux (populated by DataLoader)
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	// Fetch team members from Firebase
	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery();

	// For backwards compatibility, also get from Redux - memoize to prevent rerenders
	const reduxTeamMembers = useSelector(
		(state: RootState) => {
			const members = state.team.groups.flatMap((group) => group.members);
			return members;
		},
		(a, b) => JSON.stringify(a) === JSON.stringify(b),
	);

	// Use Firebase team members if available, otherwise fallback to Redux
	const teamMembers =
		firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers;

	// Family members state
	const [familyMembers, setFamilyMembers] = useState<User[]>([]);

	// Fetch tasks from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();

	// Firebase mutations for updating tasks and properties

	const [deleteTaskMutation] = useDeleteTaskMutation();
	const [updatePropertyMutation] = useUpdatePropertyMutation();
	const [deletePropertyMutation] = useDeletePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();
	const [addMaintenanceHistory] = useAddMaintenanceHistoryMutation();
	const [deleteMaintenanceHistory] = useDeleteMaintenanceHistoryMutation();
	const [createNotification] = useCreateNotificationMutation();
	const [removeTenant] = useRemoveTenantMutation();
	const [getTenantInvitationCode] = useLazyGetTenantInvitationCodeQuery();
	const [getTenantInvitationCodesByEmail] =
		useLazyGetTenantInvitationCodesByEmailQuery();

	const [activeTab, setActiveTab] = useState<
		| 'details'
		| 'devices'
		| 'tasks'
		| 'maintenance'
		| 'tenants'
		| 'requests'
		| 'units'
		| 'suites'
		| 'contractors'
	>('details');
	const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
	const [showAddTenantModal, setShowAddTenantModal] = useState(false);
	const [showEditTenantModal, setShowEditTenantModal] = useState(false);
	const [editingTenant, setEditingTenant] = useState<any | null>(null);
	const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
	const [tenantToDelete, setTenantToDelete] = useState<any | null>(null);
	const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
	const [openCreateWorkflowToken, setOpenCreateWorkflowToken] = useState(0);
	const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const propertyOverride = props.property;

	// Find the property based on slug from Firebase data - move up to use in hooks
	const property = useMemo(() => {
		const propertiesFromGroups = propertyGroups.flatMap(
			(group) => group.properties || [],
		);
		const normalizedSlug = (slug || '').trim();

		const resolvedProperty = propertyOverride
			? propertyOverride
			: firebaseProperties.find((p: any) => p.slug === normalizedSlug) ||
			  propertiesFromGroups.find((p: any) => p.slug === normalizedSlug) ||
			  firebaseProperties.find((p: any) => p.id === normalizedSlug) ||
			  propertiesFromGroups.find((p: any) => p.id === normalizedSlug);

		// DEBUG: Log what's happening
		if (!resolvedProperty && firebaseProperties.length > 0) {
			console.log('DEBUG: Property not found! slug:', slug);
			console.log(
				'DEBUG: Available slugs:',
				firebaseProperties.map((p: any) => p.slug),
			);
		}
		if (firebaseProperties.length > 0) {
			console.log('DEBUG: Loaded properties count:', firebaseProperties.length);
		}

		return resolvedProperty;
	}, [slug, firebaseProperties, propertyGroups, propertyOverride]);

	const tenantAssignment = useMemo(() => {
		if (!property || !currentUser?.email || !isUserTenant) {
			return null;
		}

		const normalizedEmail = currentUser.email.trim().toLowerCase();
		const tenants = ((property as any).tenants || []) as Array<any>;
		return (
			tenants.find(
				(tenant) =>
					typeof tenant?.email === 'string' &&
					tenant.email.trim().toLowerCase() === normalizedEmail,
			) || null
		);
	}, [property, currentUser?.email, isUserTenant]);

	useEffect(() => {
		if (!property || !currentUser?.email || !isUserTenant) {
			return;
		}

		if (!tenantAssignment) {
			navigate('/properties', { replace: true });
			return;
		}

		const assignedUnit =
			typeof tenantAssignment.unit === 'string'
				? tenantAssignment.unit.trim()
				: '';

		if (!assignedUnit) {
			return;
		}

		navigate(
			`/property/${property.slug}/unit/${encodeURIComponent(assignedUnit)}`,
			{ replace: true },
		);
	}, [
		property,
		currentUser?.email,
		isUserTenant,
		tenantAssignment,
		navigate,
	]);

	const handleEditTenant = (tenant: any) => {
		setEditingTenant(tenant);
		setShowEditTenantModal(true);
	};

	const handleDeleteTenant = (tenant: any) => {
		setTenantToDelete(tenant);
		setShowDeleteTenantModal(true);
	};

	const handleOpenPropertyDialog = () => {
		setIsPropertyDialogOpen(true);
		setIsActionMenuOpen(false);
	};

	const handleOpenCreateWorkflowDialog = () => {
		dispatch(setAppActiveTab('tasks'));
		setOpenCreateWorkflowToken((currentToken) => currentToken + 1);
	};

	const handleSaveProperty = async (formData: any) => {
		if (!property?.id) {
			return;
		}

		const effectivePropertyType = isHomeowner
			? 'Single Family'
			: formData.propertyType;
		const normalizedGroupId =
			typeof formData.groupId === 'string' && formData.groupId.trim().length > 0
				? formData.groupId.trim()
				: null;

		const unitsData =
			effectivePropertyType === 'Multi-Family'
				? (formData.units || []).map((unitName: string) => ({
						name: unitName,
						occupants: [],
				  }))
				: undefined;

		const suitesData =
			effectivePropertyType === 'Commercial' && formData.hasSuites
				? (formData.suites || []).map((suiteName: string) => ({
						name: suiteName,
						occupants: [],
				  }))
				: undefined;
		const sharingData = {
			coOwners: formData.coOwners || [],
			administrators: formData.administrators || [],
			viewers: formData.viewers || [],
		};

		const updates = {
			title: formData.name,
			image: formData.photo || property.image,
			groupId: normalizedGroupId,
			owner: formData.owner,
			address: formData.address,
			propertyType: effectivePropertyType,
			units: effectivePropertyType === 'Multi-Family' ? unitsData : undefined,
			hasSuites:
				effectivePropertyType === 'Commercial'
					? !!formData.hasSuites
					: undefined,
			suites:
				effectivePropertyType === 'Commercial' && formData.hasSuites
					? suitesData
					: undefined,
			bedrooms: formData.bedrooms,
			bathrooms: formData.bathrooms,
			notes: formData.notes,
			isRental: !!formData.isRental,
			taskHistory: formData.maintenanceHistory || [],
			...sharingData,
		};

		const sanitizedUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined),
		);

		await updatePropertyMutation({
			id: property.id,
			updates: sanitizedUpdates,
		}).unwrap();

		try {
			await createNotification({
				userId: currentUser!.id,
				type: 'property_updated',
				title: 'Property Updated',
				message: `Property "${formData.name}" has been updated`,
				data: {
					propertyId: property.id,
					propertyTitle: formData.name,
				},
				status: 'unread',
				actionUrl: `/property/${property.slug}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).unwrap();
		} catch (notifError) {
			console.error('Notification failed:', notifError);
		}
	};

	const handleDeletePropertyFromDialog = async () => {
		if (!property?.id) {
			return;
		}

		await deletePropertyMutation(property.id).unwrap();

		try {
			await createNotification({
				userId: currentUser!.id,
				type: 'property_deleted',
				title: 'Property Deleted',
				message: `Property "${property.title}" has been deleted`,
				data: {
					propertyId: property.id,
					propertyTitle: property.title,
				},
				status: 'unread',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).unwrap();
		} catch (notifError) {
			console.error('Notification failed:', notifError);
		}

		setIsPropertyDialogOpen(false);
		navigate('/properties', { replace: true });
	};

	const handleConfirmDeleteTenant = async () => {
		if (!tenantToDelete || !property?.id) return;
		try {
			await removeTenant({
				propertyId: property.id,
				tenantId: tenantToDelete.id,
			}).unwrap();
		} catch (error) {
			console.error('Failed to delete tenant:', error);
		} finally {
			setShowDeleteTenantModal(false);
			setTenantToDelete(null);
		}
	};

	const handleViewTenantPromo = async (tenant: any) => {
		if (!tenant?.email) {
			feedback.notify('Tenant email is required to find promo code.');
			return;
		}

		let promoCode: any = null;

		// First try to get promo code by direct ID if available
		if (tenant.tenantInvitationCodeId) {
			try {
				promoCode = await getTenantInvitationCode(
					tenant.tenantInvitationCodeId,
				).unwrap();
			} catch (error) {
				console.error('Failed to fetch promo code by ID:', error);
			}
		}

		// If no promo code found by ID, search by email
		if (!promoCode) {
			try {
				const promoCodes = await getTenantInvitationCodesByEmail(
					tenant.email,
				).unwrap();
				if (promoCodes && promoCodes.length > 0) {
					// Get the most recent promo code
					promoCode = promoCodes[0];
				}
			} catch (error) {
				console.error('Failed to fetch promo codes by email:', error);
			}
		}

		if (promoCode) {
			let statusMessage = `Status: ${promoCode.status}`;
			if (promoCode.status === 'redeemed' && promoCode.redeemedAt) {
				statusMessage += ` (Redeemed on ${new Date(
					promoCode.redeemedAt,
				).toLocaleDateString()})`;
			} else if (promoCode.status === 'revoked' && promoCode.revokedAt) {
				statusMessage += ` (Revoked on ${new Date(
					promoCode.revokedAt,
				).toLocaleDateString()})`;
			}
			feedback.notify(`Promo Code: ${promoCode.code}\n${statusMessage}`);
		} else {
			feedback.notify('No promo code found for this tenant.');
		}
	};

	// Handle task deletion with confirmation
	const handleTaskDeleteClick = (taskIds: string[]) => {
		if (taskIds.length === 0) return;
		const task = allTasks.find((t) => t.id === taskIds[0]);
		if (task) {
			setTaskToDelete({ id: taskIds[0], title: task.title });
			setDeleteTaskModalOpen(true);
		}
	};

	// Import handlers from custom hooks
	const taskHandlers = useTaskHandlers({
		onDeleteClick: handleTaskDeleteClick,
		deleteTaskMutation,
	});
	const unitHandlers = useUnitHandlers(property?.id || '');
	const propertyHandlers = usePropertyEditHandlers();
	const maintenanceHandlers = useMaintenanceRequestHandlers(
		property,
		currentUser,
	);

	// Fetch contractors for this property
	const { data: propertyContractors = [] } = useGetContractorsByPropertyQuery(
		property?.id || '',
		{ skip: !property?.id },
	);

	// Fetch units for this property
	const { data: propertyUnits = [] } = useGetUnitsQuery(property?.id || '', {
		skip: !property?.id,
	});

	// Destructure task handlers
	const {
		showTaskCompletionModal,
		setShowTaskCompletionModal,
		completingTaskId,
		handleCreateTask,
		handleEditTask,
		handleTaskCompletionSuccess,
		confirmDeleteTask,
	} = taskHandlers;

	// Destructure unit handlers
	const {
		showUnitDialog,
		setShowUnitDialog,
		unitFormData,
		handleCreateUnit,
		handleUnitFormChange,
		handleUnitFormSubmit,
		handleDeleteUnit,
	} = unitHandlers;

	// Maintenance history handlers
	const handleAddMaintenanceHistory = async (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		deviceIds?: string[];
		completionFile?: File;
		recurringTaskId?: string;
		linkedTaskIds?: string[];
		financials?: TaskFinancials;
	}) => {
		if (!property?.id) return;

		try {
			await addMaintenanceHistory({
				propertyId: property.id,
				propertyTitle: property.title,
				...data,
			}).unwrap();
		} catch (error) {
			console.error('Failed to add maintenance history:', error);
			feedback.notify('Failed to add maintenance history. Please try again.');
		}
	};

	const handleDeleteMaintenanceHistory = async (historyId: string) => {
		if (
			!window.confirm(
				'Are you sure you want to delete this maintenance history record?',
			)
		) {
			return;
		}

		try {
			await deleteMaintenanceHistory(historyId).unwrap();
		} catch (error) {
			console.error('Failed to delete maintenance history:', error);
			feedback.notify('Failed to delete maintenance history. Please try again.');
		}
	};

	// Destructure property edit handlers
	const {
		isEditingTitle,
		setIsEditingTitle,
		editedTitle,
		setEditedTitle,
		isUploadingImage,
		setIsUploadingImage,
		imageError,
		setImageError,
		deviceFormData,
		showDeviceDialog,
		setShowDeviceDialog,
		handleDeviceFormChange,
		handleDeviceFormSubmit,
		handleTitleSave,
	} = propertyHandlers;

	// Destructure maintenance request handlers
	const {
		showMaintenanceRequestModal,
		setShowMaintenanceRequestModal,
		showConvertModal,
		setShowConvertModal,
		convertingRequest,
		setConvertingRequest,
		handleMaintenanceRequestSubmit,
		handleConvertRequestToTask,
		handleConvertToTask,
	} = maintenanceHandlers;

	const hasCommercialSuites =
		property?.propertyType === 'Commercial' &&
		(((property as any)?.hasSuites ?? false) ||
			(Array.isArray((property as any)?.suites) &&
				(property as any).suites.length > 0));

	// Get maintenance requests for this property - memoize selector
	const allMaintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
		(a, b) => a.length === b.length && a.every((item, idx) => item === b[idx]),
	);
	const propertyMaintenanceRequests = useMemo(() => {
		if (!property) return [];
		return allMaintenanceRequests.filter(
			(req) => req.propertyId === property.id,
		);
	}, [property, allMaintenanceRequests]);

	useEffect(() => {
		if (hasCommercialSuites && activeTab === 'tenants') {
			dispatch(setAppActiveTab('suites'));
		}
	}, [hasCommercialSuites, activeTab, dispatch]);

	// --- UNIT FILTER SUPPORT ------------------------------------------------
	// compute options from property units (multifamily)
	const unitOptions = useMemo(() => {
		if (!property?.units) return [];
		return property.units.map((u: any) => ({ label: u.name, value: u.id }));
	}, [property]);

	// track currently selected unit for filtering tasks
	const [selectedUnitId, setSelectedUnitId] = useState<string>('');

	// Filter tasks for this property (and optionally unit)
	const propertyTasks = useMemo(() => {
		if (!property) return [];
		// Match by property ID if it exists, otherwise try matching by title
		let allPropertyTasks = allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
		if (selectedUnitId) {
			allPropertyTasks = allPropertyTasks.filter(
				(task) => task.unitId === selectedUnitId,
			);
		}
		// Filter out completed tasks - they should show in Maintenance History instead
		return allPropertyTasks.filter((task) => task.status !== 'Completed');
	}, [property, allTasks, selectedUnitId]);

	const { data: maintenanceHistoryRecords = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
			refetchOnMountOrArgChange: true,
		});

	// Load family members if user has an account
	useEffect(() => {
		const loadFamilyMembers = async () => {
			if (currentUser?.accountId) {
				try {
					const members = await getFamilyMembers(currentUser.accountId);
					setFamilyMembers(members);
				} catch (error) {
					console.error('Failed to load family members:', error);
				}
			}
		};
		loadFamilyMembers();
	}, [currentUser?.accountId]);

	// Generate assignee options for task editing
	const assigneeOptions = useMemo(() => {
		const assignees: Array<{ label: string; value: string; email?: string }> =
			[];

		// Add team members
		teamMembers
			.filter((member): member is TeamMember => member !== undefined)
			.forEach((member) => {
				assignees.push({
					label: `${member.firstName || ''} ${member.lastName || ''} (${
						member.title || ''
					})`.trim(),
					value: member.id,
					email: member.email,
				});
			});

		// Add contractors
		propertyContractors.forEach((contractor) => {
			assignees.push({
				label: `${contractor.name} (${contractor.category})`,
				value: contractor.id,
				email: contractor.email,
			});
		});

		// Add family members
		familyMembers.forEach((member) => {
			assignees.push({
				label: `${member.firstName} ${member.lastName}`,
				value: member.id,
				email: member.email,
			});
		});

		// Remove duplicates based on value
		const uniqueAssignees = assignees.filter(
			(assignee, index, self) =>
				index === self.findIndex((a) => a.value === assignee.value),
		);

		return uniqueAssignees;
	}, [teamMembers, propertyContractors, familyMembers]);

	// Photo upload handler
	const handlePhotoUpload = async (file: File | null) => {
		if (file && property) {
			if (!isValidPropertyImageFile(file)) {
				setImageError('Invalid file. Please upload an image under 8MB.');
				return;
			}

			setImageError(null);
			setIsUploadingImage(true);

			try {
				const imageUrl = await uploadPropertyImage(file, property.id);
				await updatePropertyMutation({
					id: property.id,
					updates: {
						image: imageUrl,
					},
				}).unwrap();

				// Create notification for property image update
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_updated',
						title: 'Property Updated',
						message: `Property image for "${property.title}" has been updated`,
						data: {
							propertyId: property.id,
							propertyTitle: property.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}

				setIsUploadingImage(false);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to upload image';
				setImageError(errorMessage);
				setIsUploadingImage(false);
			}
		}
	};

	// Task handling is now managed by EditTaskModal component

	if (!property) {
		console.log(
			'DEBUG: No property found. isLoadingProperties:',
			isLoadingProperties,
		);
		console.log('DEBUG: firebaseProperties array:', firebaseProperties);
		console.log('DEBUG: slug:', slug);
		if (isLoadingProperties) {
			console.log('DEBUG: Showing loading state');
			return (
				<Wrapper>
					<ZeroState
						icon='🏠'
						title='Loading property...'
						description='Please wait while we fetch your property details.'
					/>
				</Wrapper>
			);
		}
		console.log('DEBUG: Showing property not found');
		return (
			<Wrapper>
				<ZeroState
					icon='🔍'
					title='Property not found'
					description="The property you're looking for doesn't exist or may have been deleted."
					actions={[
						{
							label: 'Back to Properties',
							onClick: () => navigate('/properties'),
						},
					]}
				/>
			</Wrapper>
		);
	}

	const isFav = isFavorite(property.id);

	return (
		<Wrapper>
			<Header style={{ backgroundImage: `url(${property.image})` }}>
				<BackButton onClick={() => navigate('/properties')}></BackButton>
				{/* 3-dot menu for mobile */}
				{currentUser && (
					<div
						style={{
							position: 'absolute',
							top: '20px',
							right: '20px',
							display: 'none',
							zIndex: 100,
						}}
						className='mobile-action-menu'>
						<button
							onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
							style={{
								background: 'none',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '20px',
								color: 'white',
								zIndex: 3,
							}}
							title='More options'>
							<FontAwesomeIcon icon={faEllipsisV} />
						</button>
						{isActionMenuOpen && (
							<div
								style={{
									position: 'absolute',
									top: '40px',
									right: '0',
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
									minWidth: '220px',
									zIndex: 1002,
									overflow: 'hidden',
								}}>
								{!isUserTenant && (
									<button
										onClick={() => {
											toggleFavorite({
												id: property.id,
												title: property.title,
												slug: property.slug,
											});
											setIsActionMenuOpen(false);
										}}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										{isFav ? '★ Favorited' : '☆ Add to Favorites'}
									</button>
								)}
								{canManageProperties && (
									<button
										onClick={handleOpenPropertyDialog}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										Edit Property
									</button>
								)}
								{isUserTenant && property?.isRental && (
									<button
										onClick={() => {
											setShowMaintenanceRequestModal(true);
											setIsActionMenuOpen(false);
										}}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										🔧 Request Maintenance
									</button>
								)}
								{!isUploadingImage && (
									<label
										htmlFor='header-photo-upload'
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											display: 'block',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}
										title='Click to upload property image'>
										<FontAwesomeIcon
											icon={faCamera}
											style={{ marginRight: '8px' }}
										/>
										Change Photo
									</label>
								)}
							</div>
						)}
					</div>
				)}
				{imageError && (
					<div
						style={{
							position: 'relative',
							zIndex: 10,
							color: '#dc2626',
							fontSize: '14px',
							padding: '8px 12px',
							backgroundColor: '#fee2e2',
							borderRadius: '4px',
							margin: '0 20px',
						}}>
						{imageError}
					</div>
				)}
				{isUploadingImage ? (
					<div
						style={{
							position: 'relative',
							zIndex: 10,
							textAlign: 'center',
							color: 'white',
							fontSize: '14px',
						}}>
						Uploading image...
					</div>
				) : null}
				<FileUploader
					id='header-photo-upload'
					accept='image/*'
					allowedTypes={['image/*']}
					maxSizeBytes={8 * 1024 * 1024}
					setFile={handlePhotoUpload}
					variant='hidden'
					onError={(message) => setImageError(message)}
				/>
				<HeaderContent>
					<TitleContainer>
						{isEditingTitle ? (
							<EditableTitleInput
								value={editedTitle}
								onChange={(e) => setEditedTitle(e.target.value)}
								onBlur={handleTitleSave}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleTitleSave();
									if (e.key === 'Escape') setIsEditingTitle(false);
								}}
								autoFocus
							/>
						) : (
							<PropertyTitle>{property.title}</PropertyTitle>
						)}
					</TitleContainer>

					<div style={{ display: 'contents' }} className='desktop-actions'>
						{canManageProperties && (
							<FavoriteButton onClick={handleOpenPropertyDialog}>
								✎ Edit Property
							</FavoriteButton>
						)}
						<FavoriteButton
							onClick={() =>
								toggleFavorite({
									id: property.id,
									title: property.title,
									slug: property.slug,
								})
							}
							style={{
								display: currentUser && !isUserTenant ? 'block' : 'none',
							}}>
							{isFav ? '★ Favorited' : '☆ Add to Favorites'}
						</FavoriteButton>
						{currentUser && isUserTenant && property?.isRental && (
							<FavoriteButton
								onClick={() => setShowMaintenanceRequestModal(true)}>
								🔧 Request Maintenance
							</FavoriteButton>
						)}
					</div>
				</HeaderContent>
			</Header>
			<ContentWrapper>
				{/* Tab Navigation */}
				<TabSystem
					property={property}
					currentUser={currentUser}
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					propertyTasks={propertyTasks}
					unitOptions={unitOptions}
					selectedUnitId={selectedUnitId}
					onSelectUnit={setSelectedUnitId}
					maintenanceHistoryRecords={maintenanceHistoryRecords}
					propertyUnits={propertyUnits}
					propertyContractors={propertyContractors}
					familyMembers={familyMembers}
					teamMembers={teamMembers}
					assigneeOptions={assigneeOptions}
					allTasks={[]}
					handleAddMaintenanceHistory={handleAddMaintenanceHistory}
					handleDeleteMaintenanceHistory={handleDeleteMaintenanceHistory}
					setShowAddTenantModal={setShowAddTenantModal}
					handleEditTenant={handleEditTenant}
					handleDeleteTenant={handleDeleteTenant}
					handleViewTenantPromo={handleViewTenantPromo}
					handleCreateTask={handleOpenCreateWorkflowDialog}
					handleEditTask={handleEditTask}
					handleCreateDevice={() => setShowDeviceDialog(true)}
					handleCreateRequest={() => setShowMaintenanceRequestModal(true)}
					hasCommercialSuites={hasCommercialSuites}
					handleCreateUnit={handleCreateUnit}
					handleDeleteUnit={handleDeleteUnit}
					handleConvertRequestToTask={handleConvertRequestToTask}
					openCreateWorkflowToken={openCreateWorkflowToken}
				/>

				{/* Add Device Dialog */}
				<DeviceModal
					isOpen={showDeviceDialog}
					property={property}
					onClose={() => setShowDeviceDialog(false)}
					onSubmit={handleDeviceFormSubmit}
					onFormChange={handleDeviceFormChange}
					deviceFormData={deviceFormData}
					units={propertyUnits}
				/>

				{/* Unit Create Dialog */}
				<UnitModal
					isOpen={showUnitDialog}
					formData={unitFormData}
					onClose={() => setShowUnitDialog(false)}
					onSubmit={handleUnitFormSubmit}
					onChange={handleUnitFormChange}
				/>

				{/* Convert Request to Task Modal */}
				{convertingRequest && (
					<ConvertRequestToTaskModal
						isOpen={showConvertModal}
						onClose={() => {
							setShowConvertModal(false);
							setConvertingRequest(null);
						}}
						onConvert={handleConvertToTask}
						request={convertingRequest}
						teamMembers={teamMembers.filter(
							(m): m is TeamMember => m !== undefined,
						)}
					/>
				)}

				{/* Maintenance Request Modal */}
				{property && (
					<MaintenanceRequestModal
						isOpen={showMaintenanceRequestModal}
						onClose={() => setShowMaintenanceRequestModal(false)}
						onSubmit={handleMaintenanceRequestSubmit}
						propertyTitle={property.title}
					/>
				)}


				{/* Add Tenant Modal */}
				{property && (
					<AddTenantModal
						open={showAddTenantModal}
						onClose={() => setShowAddTenantModal(false)}
						propertyId={property.id}
					/>
				)}

				{/* Edit Tenant Modal */}
				{property && editingTenant && (
					<AddTenantModal
						open={showEditTenantModal}
						onClose={() => {
							setShowEditTenantModal(false);
							setEditingTenant(null);
						}}
						propertyId={property.id}
						mode='edit'
						tenant={editingTenant}
					/>
				)}

				{/* Delete Task Confirmation Modal */}
				<DeleteConfirmationModal
					isOpen={deleteTaskModalOpen}
					itemName={taskToDelete?.title || ''}
					itemType='task'
					onConfirm={() => {
						confirmDeleteTask();
						setDeleteTaskModalOpen(false);
						setTaskToDelete(null);
					}}
					onCancel={() => {
						setDeleteTaskModalOpen(false);
						setTaskToDelete(null);
					}}
				/>

				{/* Delete Tenant Confirmation Modal */}
				<DeleteConfirmationModal
					isOpen={showDeleteTenantModal}
					itemName={tenantToDelete?.email || ''}
					itemType='tenant'
					onConfirm={handleConfirmDeleteTenant}
					onCancel={() => {
						setShowDeleteTenantModal(false);
						setTenantToDelete(null);
					}}
				/>

				{/* Task Completion Modal */}
				{showTaskCompletionModal && completingTaskId && (
					<TaskCompletionModal
						taskId={completingTaskId}
						taskTitle={
							allTasks.find((t) => t.id === completingTaskId)?.title || ''
						}
						task={allTasks.find((t) => t.id === completingTaskId)}
						onClose={() => setShowTaskCompletionModal(false)}
						onSuccess={handleTaskCompletionSuccess}
					/>
				)}

				{property && (
					<PropertyDialog
						isOpen={isPropertyDialogOpen}
						onClose={() => setIsPropertyDialogOpen(false)}
						onSave={handleSaveProperty}
						onDeleteProperty={
							canManageProperties ? handleDeletePropertyFromDialog : undefined
						}
						forceSingleFamily={isHomeowner}
						groups={propertyGroups.map((group) => ({
							id: group.id,
							name: group.name,
						}))}
						selectedGroupId={(property as any).groupId || null}
						propertyId={property.id}
						onCreateGroup={
							canManageProperties
								? async (name: string) => {
									const result = await createPropertyGroup({
										name,
										properties: [],
										userId: currentUser!.id,
									});
									if ('data' in result && result.data) {
										return (result.data as any).id as string;
									}
									return '';
								}
								: undefined
						}
						initialData={{
							name: property.title,
							photo: property.image,
							owner: (property as any).owner || '',
							address: (property as any).address || '',
							propertyType:
								((property as any).propertyType as
									| 'Single Family'
									| 'Multi-Family'
									| 'Commercial') || 'Single Family',
							units: (((property as any).units || []) as any[]).map((unit) =>
								typeof unit === 'string' ? unit : unit?.name,
							),
							hasSuites: (property as any).hasSuites ?? false,
							suites: (((property as any).suites || []) as any[]).map((suite) =>
								typeof suite === 'string' ? suite : suite?.name,
							),
							bedrooms: (property as any).bedrooms || 0,
							bathrooms: (property as any).bathrooms || 0,
							notes: (property as any).notes || '',
							isRental: (property as any).isRental ?? false,
							maintenanceHistory: (property as any).maintenanceHistory || [],
							coOwners: (property as any).coOwners || [],
							administrators: (property as any).administrators || [],
							viewers: (property as any).viewers || [],
						}}
					/>
				)}
			</ContentWrapper>

			<style>{`
				.desktop-actions {
					display: flex;
					gap: 12px;
				}

				.mobile-action-menu {
					display: none !important;
				}

				@media (max-width: 480px) {
					.desktop-actions {
						display: none !important;
					}

					.mobile-action-menu {
						display: block !important;
					}
				}
			`}</style>
		</Wrapper>
	);
};
