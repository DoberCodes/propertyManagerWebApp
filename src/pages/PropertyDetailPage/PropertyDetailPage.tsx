import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faCamera } from '@fortawesome/free-solid-svg-icons';
import { PropertyDetailPageProps } from '../../types/PropertyDetailPage.types';
import { RootState } from '../../Redux/store/store';
import { User } from '../../Redux/Slices/userSlice';
import {
	resetActiveTab,
	setActiveTab as setAppActiveTab,
} from '../../Redux/Slices/appSlice';

import { useTaskHandlers } from 'pages/PropertyDetailPage/useTaskHandlers';
import { usePropertyEditHandlers } from 'pages/PropertyDetailPage/usePropertyEditHandlers';
import { useMaintenanceRequestHandlers } from './useMaintenanceRequestHandlers';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useCreatePropertyGroupMutation,
} from 'Redux/API/propertySlice';
import { useGetContractorsByPropertyQuery } from '../../Redux/API/contractorSlice';
import {
	useGetMaintenanceHistoryByPropertyQuery,
	useAddMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
	useUpdateMaintenanceHistoryMutation,
} from '../../Redux/API/maintenanceSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import {
	useRemoveTenantMutation,
	useLazyGetTenantInvitationCodeQuery,
	useLazyGetTenantInvitationCodesByEmailQuery,
} from '../../Redux/API/tenantSlice';
import {
	canApproveMaintenanceRequest,
	getRoleCapabilities,
} from '../../utils/permissions';
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
import {
	getPropertyImageSrc,
	isPropertyImageFallback,
} from '../../utils/propertyImagePlaceholder';
import { ZeroState } from '../../Components/Library/ZeroState/ZeroState';
import { TaskCompletionModal } from 'Components/TaskCompletionModal';
import { FileUploader } from 'Components/Library/FileUploader';
import { ConvertRequestToTaskModal } from 'Components/ConvertRequestToTaskModal';
import { AddTenantModal } from 'Components/AddTenantModal';
import { MaintenanceRequestModal } from 'Components/MaintenanceRequestModal';
import { DeleteConfirmationModal } from 'Components/Library/Modal/DeleteConfirmationModal';
import {
	PageHero,
	HeroActionButton,
	HeroTitle,
} from '../../Components/Library/PageHero/PageHero';
import {
	Wrapper,
	EditableTitleInput,
	ContentWrapper,
	DesktopHeroActions,
} from './PropertyDetailPage.styles';
import { DeviceModal } from '../../Components/Library/Modal';
import {
	useDeleteTaskMutation,
	useGetTasksQuery,
} from '../../Redux/API/taskSlice';
import { useGetDevicesQuery } from '../../Redux/API/deviceSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import { TabSystem } from './TabSystem';
import { TaskFinancials } from '../../types/Task.types';
import { PropertyDialog } from '../../Components/PropertiesTab/PropertyDialog';
import { PropertySetupAssistant } from '../../Components/PropertySetupAssistant/PropertySetupAssistant';

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = (
	props,
) => {
	const feedback = useAppFeedback();
	const navigate = useNavigate();
	const { slug } = useParams<{ slug: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const dispatch = useDispatch();

	useEffect(() => {
		return () => {
			dispatch(resetActiveTab());
		};
	}, [dispatch]);

	const isUserTenant = useSelector(selectIsTenant);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const canManageProperties =
		canAccessProperties &&
		!!currentUser?.subscription &&
		!isTrialExpired(currentUser.subscription) &&
		!isUserTenant &&
		roleCapabilities.canManageProperties;
	const shouldOpenPropertySetup = searchParams.get('setup') === '1';
	const handlePropertySetupOpened = useMemo(
		() => () => {
			if (!shouldOpenPropertySetup) {
				return;
			}

			const nextParams = new URLSearchParams(searchParams);
			nextParams.delete('setup');
			setSearchParams(nextParams, { replace: true });
		},
		[searchParams, setSearchParams, shouldOpenPropertySetup],
	);

	const { isFavorite, toggleFavorite } = useFavorites(currentUser!.id);

	const { data: firebaseProperties = [], isLoading: isLoadingProperties } =
		useGetPropertiesQuery();

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

	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery();

	const reduxTeamMembers = useSelector(
		(state: RootState) => {
			const members = state.team.groups.flatMap((group) => group.members);
			return members;
		},
		(a, b) => JSON.stringify(a) === JSON.stringify(b),
	);

	const teamMembers =
		firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers;

	const [familyMembers, setFamilyMembers] = useState<User[]>([]);
	const { data: allTasks = [] } = useGetTasksQuery();

	const [deleteTaskMutation] = useDeleteTaskMutation();
	const [updatePropertyMutation] = useUpdatePropertyMutation();
	const [deletePropertyMutation] = useDeletePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();
	const [addMaintenanceHistory] = useAddMaintenanceHistoryMutation();
	const [deleteMaintenanceHistory] = useDeleteMaintenanceHistoryMutation();
	const [updateMaintenanceHistory] = useUpdateMaintenanceHistoryMutation();
	const [createNotification] = useCreateNotificationMutation();
	const [removeTenant] = useRemoveTenantMutation();
	const [getTenantInvitationCode] = useLazyGetTenantInvitationCodeQuery();
	const [getTenantInvitationCodesByEmail] =
		useLazyGetTenantInvitationCodesByEmailQuery();

	const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
	const [showAddTenantModal, setShowAddTenantModal] = useState(false);
	const [showEditTenantModal, setShowEditTenantModal] = useState(false);
	const [editingTenant, setEditingTenant] = useState<any | null>(null);
	const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
	const [tenantToDelete, setTenantToDelete] = useState<any | null>(null);
	const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
	const [openCreateTaskToken, setOpenCreateTaskToken] = useState(0);
	const [openCreateDeviceToken, setOpenCreateDeviceToken] = useState(0);
	const [openDocumentsUploadToken, setOpenDocumentsUploadToken] = useState(0);
	const [openCreateContractorToken, setOpenCreateContractorToken] = useState(0);
	const handledPropertyActionRef = useRef('');
	const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const propertyOverride = props.property;

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

		// Units are temporarily hidden from the app flow; keep tenant users on
		// the property surface instead of redirecting into a unit detail page.
	}, [property, currentUser?.email, isUserTenant, tenantAssignment, navigate]);

	const handleEditTenant = (tenant: any) => {
		if (!roleCapabilities.canManageTenants) {
			feedback.notify('Your role can view tenants but cannot edit tenant records.');
			return;
		}
		setEditingTenant(tenant);
		setShowEditTenantModal(true);
	};

	const handleDeleteTenant = (tenant: any) => {
		if (!roleCapabilities.canManageTenants) {
			feedback.notify('Your role can view tenants but cannot delete tenant records.');
			return;
		}
		setTenantToDelete(tenant);
		setShowDeleteTenantModal(true);
	};

	const handleOpenPropertyDialog = () => {
		if (!canManageProperties) {
			feedback.notify('Your role can view this property but cannot edit property details.');
			return;
		}
		setIsPropertyDialogOpen(true);
		setIsActionMenuOpen(false);
	};

	const selectPropertyTab = (tab: string) => {
		dispatch(setAppActiveTab(tab));
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set('tab', tab);
		nextParams.delete('action');
		setSearchParams(nextParams);
	};

	const handleOpenCreateTaskDialog = () => {
		if (!roleCapabilities.canCreateTasks) {
			feedback.notify('Your role can request maintenance but cannot create tasks directly.');
			return;
		}
		selectPropertyTab('tasks');
		setOpenCreateTaskToken((currentToken) => currentToken + 1);
	};

	const handleSetupAddMoreAppliances = () => {
		selectPropertyTab('devices');
		setOpenCreateDeviceToken((currentToken) => currentToken + 1);
	};

	const handleSetupUploadDocuments = () => {
		selectPropertyTab('documents');
		setOpenDocumentsUploadToken((currentToken) => currentToken + 1);
	};

	useEffect(() => {
		const action = searchParams.get('action');
		if (!action) {
			handledPropertyActionRef.current = '';
			return;
		}
		if (!property) return;

		const actionKey = `${property.id}:${action}`;
		if (handledPropertyActionRef.current === actionKey) return;
		handledPropertyActionRef.current = actionKey;

		let targetTab = '';
		let allowed = true;

		switch (action) {
			case 'create-task':
				targetTab = 'tasks';
				allowed = roleCapabilities.canCreateTasks;
				if (allowed) {
					setOpenCreateTaskToken((currentToken) => currentToken + 1);
				}
				break;
			case 'create-system':
				targetTab = 'devices';
				allowed = roleCapabilities.canManageAppliances;
				if (allowed) {
					setOpenCreateDeviceToken((currentToken) => currentToken + 1);
				}
				break;
			case 'upload-document':
				targetTab = 'documents';
				allowed = roleCapabilities.canManageProperties;
				if (allowed) {
					setOpenDocumentsUploadToken((currentToken) => currentToken + 1);
				}
				break;
			case 'add-contractor':
				targetTab = 'contractors';
				allowed = roleCapabilities.canManageContractors;
				if (allowed) {
					setOpenCreateContractorToken((currentToken) => currentToken + 1);
				}
				break;
			default:
				handledPropertyActionRef.current = '';
				return;
		}

		if (targetTab) {
			dispatch(setAppActiveTab(targetTab));
		}

		if (!allowed) {
			feedback.notify('Your role does not allow that action for this property.');
		}

		const nextParams = new URLSearchParams(searchParams);
		if (targetTab) {
			nextParams.set('tab', targetTab);
		}
		nextParams.delete('action');
		setSearchParams(nextParams, { replace: true });
	}, [
		dispatch,
		feedback,
		property,
		roleCapabilities.canCreateTasks,
		roleCapabilities.canManageAppliances,
		roleCapabilities.canManageContractors,
		roleCapabilities.canManageProperties,
		searchParams,
		setSearchParams,
	]);

	const handleSaveProperty = async (formData: any) => {
		if (!property?.id) {
			return;
		}
		if (!canManageProperties) {
			feedback.notify('Your role can view this property but cannot edit property details.');
			return;
		}

		const effectivePropertyType = isHomeowner
			? 'Single Family'
			: formData.propertyType;
		const normalizedGroupId =
			typeof formData.groupId === 'string' && formData.groupId.trim().length > 0
				? formData.groupId.trim()
				: null;

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
			hasSuites:
				effectivePropertyType === 'Commercial'
					? false
					: undefined,
			suites:
				effectivePropertyType === 'Commercial'
					? []
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
		if (!canManageProperties) {
			feedback.notify('Your role can view this property but cannot delete it.');
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

		if (tenant.tenantInvitationCodeId) {
			try {
				promoCode = await getTenantInvitationCode(
					tenant.tenantInvitationCodeId,
				).unwrap();
			} catch (error) {
				console.error('Failed to fetch promo code by ID:', error);
			}
		}

		if (!promoCode) {
			try {
				const promoCodes = await getTenantInvitationCodesByEmail(
					tenant.email,
				).unwrap();
				if (promoCodes && promoCodes.length > 0) {
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

	const handleTaskDeleteClick = (taskIds: string[]) => {
		if (taskIds.length === 0) return;
		const task = allTasks.find((t) => t.id === taskIds[0]);
		if (task) {
			setTaskToDelete({ id: taskIds[0], title: task.title });
			setDeleteTaskModalOpen(true);
		}
	};

	const taskHandlers = useTaskHandlers({
		onDeleteClick: handleTaskDeleteClick,
		deleteTaskMutation,
	});
	const propertyHandlers = usePropertyEditHandlers();
	const maintenanceHandlers = useMaintenanceRequestHandlers(
		property,
		currentUser,
	);

	const { data: propertyContractors = [] } = useGetContractorsByPropertyQuery(
		property?.id || '',
		{ skip: !property?.id },
	);

	const propertyUnits = useMemo<any[]>(() => [], []);

	const {
		showTaskCompletionModal,
		setShowTaskCompletionModal,
		completingTaskId,
		handleEditTask,
		handleTaskCompletionSuccess,
		confirmDeleteTask,
	} = taskHandlers;

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
		if (!roleCapabilities.canManageMaintenanceHistory) {
			feedback.notify('Your role can view maintenance history but cannot add records.');
			return;
		}

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
		if (!roleCapabilities.canManageMaintenanceHistory) {
			feedback.notify('Your role can view maintenance history but cannot delete records.');
			return;
		}

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

	const handleUpdateMaintenanceHistory = async (
		historyId: string,
		updates: Partial<any>,
	) => {
		if (!roleCapabilities.canManageMaintenanceHistory) {
			feedback.notify('Your role can view maintenance history but cannot edit records.');
			return;
		}

		try {
			await updateMaintenanceHistory({
				id: historyId,
				updates,
			}).unwrap();
		} catch (error) {
			console.error('Failed to update maintenance history:', error);
			feedback.notify('Failed to update maintenance history. Please try again.');
		}
	};

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

	const allMaintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
		(a, b) => a.length === b.length && a.every((item, idx) => item === b[idx]),
	);
	const propertyMaintenanceRequests = useMemo(() => {
		if (!property) return [];
		return allMaintenanceRequests.filter((req) => req.propertyId === property.id);
	}, [property, allMaintenanceRequests]);

	const unitOptions = useMemo<{ label: string; value: string }[]>(() => [], []);

	const propertyTasks = useMemo(() => {
		if (!property) return [];
		const allPropertyTasks = allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
		return allPropertyTasks.filter((task) => task.status !== 'Completed');
	}, [property, allTasks]);

	const { data: maintenanceHistoryRecords = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
			refetchOnMountOrArgChange: true,
		});
	const { data: propertyDevices = [] } = useGetDevicesQuery(property?.id || '', {
		skip: !property?.id,
	});

	useEffect(() => {
		const loadFamilyMembers = async () => {
			if (isTeamMemberAccount) {
				setFamilyMembers([]);
				return;
			}

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
	}, [currentUser?.accountId, isTeamMemberAccount]);

	const assigneeOptions = useMemo(() => {
		const assignees: Array<{ label: string; value: string; email?: string }> =
			[];

		teamMembers
			.filter((member): member is TeamMember => member !== undefined)
			.forEach((member) => {
				assignees.push({
					label: `${member.firstName || ''} ${member.lastName || ''} (${member.title || ''})`.trim(),
					value: member.id,
					email: member.email,
				});
			});

		propertyContractors.forEach((contractor) => {
			assignees.push({
				label: `${contractor.name} (${contractor.category})`,
				value: contractor.id,
				email: contractor.email,
			});
		});

		familyMembers.forEach((member) => {
			assignees.push({
				label: `${member.firstName} ${member.lastName}`,
				value: member.id,
				email: member.email,
			});
		});

		const uniqueAssignees = assignees.filter(
			(assignee, index, self) =>
				index === self.findIndex((a) => a.value === assignee.value),
		);

		return uniqueAssignees;
	}, [teamMembers, propertyContractors, familyMembers]);

	const handlePhotoUpload = async (file: File | null) => {
		if (!canManageProperties) {
			setImageError('Your role can view this property but cannot change property photos.');
			return;
		}
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

	if (!property) {
		if (isLoadingProperties) {
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
	const headerImageSrc = getPropertyImageSrc(property.image);
	const isHeaderFallbackImage = isPropertyImageFallback(property.image);
	const handleGuardedMaintenanceRequestSubmit = (request: any) => {
		if (!(roleCapabilities.canCreateMaintenanceRequests || isUserTenant)) {
			feedback.notify('Your role can view requests but cannot submit new maintenance requests.');
			return;
		}
		handleMaintenanceRequestSubmit(request);
	};
	const handleGuardedConvertRequestToTask = (requestId: string) => {
		if (!roleCapabilities.canApproveMaintenanceRequests) {
			feedback.notify('Your role can review requests but cannot convert them into tasks.');
			return;
		}
		handleConvertRequestToTask(requestId);
	};

	return (
		<Wrapper>
			<PageHero
				headerImageUrl={headerImageSrc}
				backgroundSize={isHeaderFallbackImage ? '360px auto' : 'cover'}
				backLabel='← Back to Properties'
				onBack={() => navigate('/properties')}
				topRight={currentUser ? (
					<div style={{ display: 'none' }} className='mobile-action-menu'>
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
									boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
											background: 'none',
											border: 'none',
											padding: '12px 16px',
											textAlign: 'left',
											fontSize: '16px',
											color: '#222',
											cursor: 'pointer',
											borderBottom: '1px solid #f3f4f6',
										}}>
										{isFav ? '★ Favorited' : '☆ Add to Favorites'}
									</button>
								)}
								{canManageProperties && (
									<button
										onClick={handleOpenPropertyDialog}
										style={{
											width: '100%',
											background: 'none',
											border: 'none',
											padding: '12px 16px',
											textAlign: 'left',
											fontSize: '16px',
											color: '#222',
											cursor: 'pointer',
											borderBottom: '1px solid #f3f4f6',
										}}>
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
											background: 'none',
											border: 'none',
											padding: '12px 16px',
											textAlign: 'left',
											fontSize: '16px',
											color: '#222',
											cursor: 'pointer',
											borderBottom: '1px solid #f3f4f6',
										}}>
										🔧 Request Maintenance
									</button>
								)}
								{canManageProperties && !isUploadingImage && (
									<label
										htmlFor='header-photo-upload'
										style={{
											width: '100%',
											display: 'flex',
											alignItems: 'center',
											background: 'none',
											border: 'none',
											padding: '12px 16px',
											fontSize: '16px',
											color: '#222',
											cursor: 'pointer',
										}}
										title='Click to upload property image'>
										<FontAwesomeIcon icon={faCamera} style={{ marginRight: '8px' }} />
										Change Photo
									</label>
								)}
							</div>
						)}
					</div>
				) : undefined}
				title={
					isEditingTitle ? (
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
						<HeroTitle>{property.title}</HeroTitle>
					)
				}
				actions={
					<DesktopHeroActions>
						{canManageProperties && (
							<HeroActionButton onClick={handleOpenPropertyDialog}>
								✎ Edit Property
							</HeroActionButton>
						)}
						{currentUser && !isUserTenant && (
							<HeroActionButton
								onClick={() =>
									toggleFavorite({
										id: property.id,
										title: property.title,
										slug: property.slug,
									})
								}>
								{isFav ? '★ Favorited' : '☆ Add to Favorites'}
							</HeroActionButton>
						)}
						{currentUser && isUserTenant && property?.isRental && (
							<HeroActionButton onClick={() => setShowMaintenanceRequestModal(true)}>
								🔧 Request Maintenance
							</HeroActionButton>
						)}
					</DesktopHeroActions>
				}>
				{imageError && (
					<div
						style={{
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
				{isUploadingImage && (
					<div
						style={{
							textAlign: 'center',
							color: 'white',
							fontSize: '14px',
							padding: '0 20px',
						}}>
						Uploading image...
					</div>
				)}
				{canManageProperties && (
					<FileUploader
						id='header-photo-upload'
						accept='image/*'
						allowedTypes={['image/*']}
						maxSizeBytes={8 * 1024 * 1024}
						setFile={handlePhotoUpload}
						variant='hidden'
						onError={(message) => setImageError(message)}
					/>
				)}
			</PageHero>
			<ContentWrapper>
				<PropertySetupAssistant
					property={property}
					currentUser={currentUser}
					devices={propertyDevices}
					tasks={propertyTasks}
					canUseAssistant={
						canManageProperties &&
						roleCapabilities.canManageAppliances &&
						roleCapabilities.canCreateTasks &&
						!isUserTenant
					}
					initiallyOpen={shouldOpenPropertySetup}
					onInitialOpenHandled={handlePropertySetupOpened}
					onAddMoreAppliances={handleSetupAddMoreAppliances}
					onUploadDocuments={handleSetupUploadDocuments}
				/>
				<TabSystem
					property={property}
					currentUser={currentUser}
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					propertyTasks={propertyTasks}
					propertyDevices={propertyDevices}
					unitOptions={unitOptions}
					maintenanceHistoryRecords={maintenanceHistoryRecords}
					propertyUnits={propertyUnits}
					propertyContractors={propertyContractors}
					familyMembers={familyMembers}
					teamMembers={teamMembers}
					assigneeOptions={assigneeOptions}
					allTasks={[]}
					handleAddMaintenanceHistory={handleAddMaintenanceHistory}
					handleUpdateMaintenanceHistory={handleUpdateMaintenanceHistory}
					handleDeleteMaintenanceHistory={handleDeleteMaintenanceHistory}
					setShowAddTenantModal={setShowAddTenantModal}
					handleEditTenant={handleEditTenant}
					handleDeleteTenant={handleDeleteTenant}
					handleViewTenantPromo={handleViewTenantPromo}
					handleCreateTask={handleOpenCreateTaskDialog}
					handleEditTask={handleEditTask}
					handleCreateDevice={
						roleCapabilities.canManageAppliances
							? () => setShowDeviceDialog(true)
							: undefined
					}
					handleCreateRequest={
						roleCapabilities.canCreateMaintenanceRequests || isUserTenant
							? () => setShowMaintenanceRequestModal(true)
							: undefined
					}
					handleConvertRequestToTask={handleGuardedConvertRequestToTask}
					openCreateTaskToken={openCreateTaskToken}
					openCreateDeviceToken={openCreateDeviceToken}
					openDocumentsUploadToken={openDocumentsUploadToken}
					openCreateContractorToken={openCreateContractorToken}
					permissions={roleCapabilities}
				/>

				{roleCapabilities.canManageAppliances && (
					<DeviceModal
						isOpen={showDeviceDialog}
						property={property}
						onClose={() => setShowDeviceDialog(false)}
						onSubmit={handleDeviceFormSubmit}
						onFormChange={handleDeviceFormChange}
						deviceFormData={deviceFormData}
						units={propertyUnits}
					/>
				)}

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

				{property && (
					<MaintenanceRequestModal
						isOpen={showMaintenanceRequestModal}
						onClose={() => setShowMaintenanceRequestModal(false)}
						onSubmit={handleGuardedMaintenanceRequestSubmit}
						propertyTitle={property.title}
					/>
				)}

				{property && (
					<AddTenantModal
						open={showAddTenantModal}
						onClose={() => setShowAddTenantModal(false)}
						propertyId={property.id}
					/>
				)}

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
