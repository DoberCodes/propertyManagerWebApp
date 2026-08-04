import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faCamera, faPen } from '@fortawesome/free-solid-svg-icons';
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
	useGetPropertyQuery,
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
	useRemoveManualOccupancyMutation,
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
import { Device } from '../../types/Property.types';
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
import { LoadingState } from 'Components/LoadingState';
import { ConvertRequestToTaskModal } from 'Components/ConvertRequestToTaskModal';
import { AddTenantModal } from 'Components/AddTenantModal';
import { MaintenanceRequestModal } from 'Components/MaintenanceRequestModal';
import { RecommendationResolutionModal } from 'Components/PropertyIntelligence/RecommendationResolutionModal';
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
import { DeviceModal, TaskModal } from '../../Components/Library/Modal';
import { AddMaintenanceHistoryModal } from '../../Components/Library/Modal/AddMaintenanceHistoryModal';
import {
	useDeleteTaskMutation,
	useGetTasksQuery,
} from '../../Redux/API/taskSlice';
import {
	useGetDevicesQuery,
} from '../../Redux/API/deviceSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import {
	useCreatePropertySpaceMutation,
	useLazyGetPropertySpacesQuery,
} from '../../Redux/API/spaceSlice';
import { TabSystem } from './TabSystem';
import { TaskFinancials, TaskFormData } from '../../types/Task.types';
import { MaintenanceHistoryDraftData } from '../../types/PropertyDetailPage.types';
import { PropertyDialog } from '../../Components/PropertiesTab/PropertyDialog';
import {
	getDefaultPropertyClassification,
	normalizePropertyType,
} from '../../utils/propertyTaxonomy';
import { PropertySetupAssistant } from '../../Components/PropertySetupAssistant/PropertySetupAssistant';
import {
	PropertyScanActionType,
	PropertyScanRecommendation,
} from '../../utils/propertyIntelligenceScan';
import { buildDeviceSlug } from '../../utils/deviceSlug';
import { mergeMaintenanceHistoryWithDeviceSources } from '../../maintenanceHistory/maintenanceHistoryAdapter';
import {
	buildPropertyProfileSpaceTemplates,
	ensureGeneratedPropertySpaces,
} from '../../propertyKnowledge/propertySpaceGeneration';

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
	const roleCapabilities = useMemo(() => {
		const capabilities = getRoleCapabilities(currentUser?.role);
		if (currentUser?.isAccountOwner !== true) {
			return capabilities;
		}

		return {
			...capabilities,
			canManageProperties: true,
			canManageTasks: true,
			canCreateTasks: true,
			canCompleteTasks: true,
			canManageMaintenanceHistory: true,
			canCreateMaintenanceRequests: true,
			canApproveMaintenanceRequests: true,
			canManageAppliances: true,
			canManageContractors: true,
			canManageTenants: true,
			canManageFinancials: true,
			canManageTeam: true,
			canManageDocuments: true,
		};
	}, [currentUser?.isAccountOwner, currentUser?.role]);
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

	const {
		data: firebaseProperties = [],
		isLoading: isLoadingProperties,
		isFetching: isFetchingProperties,
	} =
		useGetPropertiesQuery();

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
	const [createPropertySpace] = useCreatePropertySpaceMutation();
	const [getPropertySpaces] = useLazyGetPropertySpacesQuery();
	const [removeTenant] = useRemoveManualOccupancyMutation();
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
	const [createTaskDraft, setCreateTaskDraft] = useState<
		(Partial<TaskFormData> & { propertyId?: string }) | null
	>(null);
	const [createTaskDraftRecommendationId, setCreateTaskDraftRecommendationId] =
		useState<string | null>(null);
	const [openCreateHistoryToken, setOpenCreateHistoryToken] = useState(0);
	const [createHistoryDraft, setCreateHistoryDraft] =
		useState<MaintenanceHistoryDraftData | null>(null);
	const [
		createHistoryDraftRecommendationId,
		setCreateHistoryDraftRecommendationId,
	] = useState<string | null>(null);
	const [openCreateDeviceToken, setOpenCreateDeviceToken] = useState(0);
	const [openDocumentsUploadToken, setOpenDocumentsUploadToken] = useState(0);
	const [openCreateContractorToken, setOpenCreateContractorToken] = useState(0);
	const [showPropertyScanPrompt, setShowPropertyScanPrompt] = useState(false);
	const [resolutionRecommendation, setResolutionRecommendation] =
		useState<PropertyScanRecommendation | null>(null);
	const [showResolutionTaskModal, setShowResolutionTaskModal] = useState(false);
	const [showResolutionHistoryModal, setShowResolutionHistoryModal] =
		useState(false);
	const [resolvedRecommendationIds, setResolvedRecommendationIds] = useState<
		string[]
	>([]);
	const capturedPropertyActionRef = useRef('');
	const pendingPropertyActionRef = useRef('');
	const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const propertyOverride = props.property;

	const propertyFromLists = useMemo(() => {
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

		return resolvedProperty;
	}, [slug, firebaseProperties, propertyGroups, propertyOverride]);
	const {
		data: liveProperty,
		isLoading: isLoadingLiveProperty,
		isFetching: isFetchingLiveProperty,
	} = useGetPropertyQuery(propertyFromLists?.id || '', {
		skip: !propertyFromLists?.id || Boolean(propertyOverride),
	});
	const property = propertyOverride || liveProperty || propertyFromLists;
	const propertyAccountId = String(
		property?.accountId || property?.userId || currentUser?.accountId || currentUser?.id || '',
	).trim();

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

		// Resident access remains property-scoped; Unit detail routes are retired.
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

	const getRecommendationSystem = (
		recommendation: PropertyScanRecommendation,
	): Device | undefined => {
		const systemId = String(
			recommendation.systemId ||
				recommendation.relatedSystemIds?.[0] ||
				recommendation.metadata?.systemId ||
				'',
		).trim();
		return propertyDevices.find((device) => device.id === systemId);
	};

	const getSystemDisplayName = (system?: Device): string =>
		system
			? [system.brand, system.type, system.model].filter(Boolean).join(' ').trim() ||
				system.type ||
				'System'
			: 'System';

	const getSuggestedCadenceOptions = (
		recommendation: PropertyScanRecommendation,
	): Array<{ label: string; intervalDays?: number }> => {
		const rawCadence = recommendation.metadata?.suggestedMaintenanceCadence;
		if (!Array.isArray(rawCadence)) return [];
		return rawCadence
			.map((cadence) => ({
				label: String((cadence as any)?.label || '').trim(),
				intervalDays: Number((cadence as any)?.intervalDays || 0) || undefined,
			}))
			.filter((cadence) => cadence.label);
	};

	const getRecurrenceFromInterval = (
		intervalDays?: number,
	): Pick<
		TaskFormData,
		'recurrenceFrequency' | 'recurrenceInterval' | 'recurrenceCustomUnit'
	> => {
		if (!intervalDays) {
			return { recurrenceFrequency: 'monthly' };
		}
		if (intervalDays <= 7) return { recurrenceFrequency: 'weekly' };
		if (intervalDays <= 14) return { recurrenceFrequency: 'biweekly' };
		if (intervalDays >= 80 && intervalDays <= 100) {
			return { recurrenceFrequency: 'quarterly' };
		}
		if (intervalDays >= 330 && intervalDays <= 400) {
			return { recurrenceFrequency: 'yearly' };
		}
		if (intervalDays >= 28 && intervalDays <= 31) {
			return { recurrenceFrequency: 'monthly' };
		}
		return {
			recurrenceFrequency: 'custom',
			recurrenceInterval: intervalDays,
			recurrenceCustomUnit: 'days',
		};
	};

	const buildRecurringTaskDraft = (
		recommendation: PropertyScanRecommendation,
	): (Partial<TaskFormData> & { propertyId?: string }) | null => {
		if (!property?.id) return null;
		const system = getRecommendationSystem(recommendation);
		const systemName =
			String(recommendation.metadata?.systemName || '').trim() ||
			getSystemDisplayName(system);
		const cadenceOptions = getSuggestedCadenceOptions(recommendation);
		const selectedCadenceRaw = recommendation.metadata?.selectedMaintenanceCadence;
		const selectedCadence =
			selectedCadenceRaw && typeof selectedCadenceRaw === 'object'
				? {
					label: String((selectedCadenceRaw as any)?.label || '').trim(),
					intervalDays:
						Number((selectedCadenceRaw as any)?.intervalDays || 0) ||
						undefined,
				}
				: undefined;
		const singleCadence =
			selectedCadence?.label
				? selectedCadence
				: cadenceOptions.length === 1
					? cadenceOptions[0]
					: undefined;
		const recurrence = getRecurrenceFromInterval(singleCadence?.intervalDays);
		const cadenceLines = cadenceOptions.map(
			(cadence) =>
				`- ${cadence.label}${
					cadence.intervalDays ? ` every ${cadence.intervalDays} days` : ''
				}`,
		);

		return {
			title: singleCadence?.label || '',
			dueDate: new Date().toISOString().split('T')[0],
			status: 'Initiated',
			category: 'Preventive Maintenance',
			location: system?.location?.unitId || system?.location?.suiteId || '',
			priority: recommendation.severity === 'high' ? 'High' : 'Medium',
			notes: [
				`Maintley found that ${systemName} does not have a linked recurring maintenance task yet.`,
				'Add the specific recurring work that should be tracked for this system.',
				cadenceLines.length ? '' : undefined,
				cadenceLines.length ? 'Suggested recurring care:' : undefined,
				...cadenceLines,
				'',
				recommendation.title,
				'',
				recommendation.description,
				'',
				`Why it matters: ${recommendation.reason}`,
			].filter(Boolean).join('\n'),
			devices: system?.id ? [system.id] : [],
			isRecurring: true,
			...recurrence,
			enableNotifications: true,
			propertyId: property.id,
		};
	};

	const handleOpenCreateTaskDialog = (
		recommendation?: PropertyScanRecommendation,
	) => {
		if (!roleCapabilities.canCreateTasks) {
			feedback.notify('Your role can request maintenance but cannot create tasks directly.');
			return;
		}
		if (recommendation?.resolution?.resolutionType === 'create_task') {
			setCreateTaskDraft(buildRecurringTaskDraft(recommendation));
			setCreateTaskDraftRecommendationId(recommendation.id);
			setShowResolutionTaskModal(true);
			return;
		}

		setCreateTaskDraft(null);
		setCreateTaskDraftRecommendationId(null);
		selectPropertyTab('tasks');
		setOpenCreateTaskToken((currentToken) => currentToken + 1);
	};

	const buildMaintenanceHistoryDraft = (
		recommendation: PropertyScanRecommendation,
	): MaintenanceHistoryDraftData | null => {
		const system = getRecommendationSystem(recommendation);
		const systemName =
			String(recommendation.metadata?.systemName || '').trim() ||
			getSystemDisplayName(system);

		return {
			title:
				recommendation.ruleId === 'baseline-maintenance-cadence-overdue'
					? String(recommendation.metadata?.baselineCadenceLabel || '').trim() ||
						`${systemName} maintenance`
					: `${systemName} maintenance note`,
			completionDate: new Date().toISOString().split('T')[0],
			unitId: system?.location?.unitId || system?.location?.suiteId || '',
			deviceIds: system?.id ? [system.id] : [],
			completionNotes: [
				'Created from a Maintley recommendation.',
				'',
				recommendation.title,
				'',
				recommendation.description,
				'',
				`Why it matters: ${recommendation.reason}`,
			].join('\n'),
		};
	};

	const handleOpenCreateMaintenanceHistoryDialog = (
		recommendation?: PropertyScanRecommendation,
	) => {
		if (!roleCapabilities.canManageMaintenanceHistory) {
			feedback.notify('Your role can view maintenance history but cannot add records.');
			return;
		}
		if (recommendation?.resolution?.resolutionType === 'create_history') {
			setCreateHistoryDraft(buildMaintenanceHistoryDraft(recommendation));
			setCreateHistoryDraftRecommendationId(recommendation.id);
			setShowResolutionHistoryModal(true);
			return;
		}

		setCreateHistoryDraft(null);
		setCreateHistoryDraftRecommendationId(null);
		selectPropertyTab('maintenance');
		setOpenCreateHistoryToken((currentToken) => currentToken + 1);
	};

	const handleSetupAddMoreAppliances = () => {
		selectPropertyTab('devices');
		setOpenCreateDeviceToken((currentToken) => currentToken + 1);
	};

	const handleSetupUploadDocuments = () => {
		selectPropertyTab('documents');
		setOpenDocumentsUploadToken((currentToken) => currentToken + 1);
	};

	const handleSetupAssistantExited = () => {
		setShowPropertyScanPrompt(true);
	};

	useEffect(() => {
		const action = searchParams.get('action');
		const actionTabMap: Record<string, string> = {
			'create-task': 'tasks',
			'create-system': 'devices',
			'upload-document': 'documents',
			'add-contractor': 'contractors',
		};

		if (action && actionTabMap[action]) {
			if (capturedPropertyActionRef.current !== action) {
				capturedPropertyActionRef.current = action;
				pendingPropertyActionRef.current = action;

				const nextParams = new URLSearchParams(searchParams);
				nextParams.set('tab', actionTabMap[action]);
				nextParams.delete('action');
				setSearchParams(nextParams, { replace: true });
			}
		} else if (!action) {
			capturedPropertyActionRef.current = '';
		}

		const pendingAction = pendingPropertyActionRef.current;
		if (!pendingAction || !property) return;
		pendingPropertyActionRef.current = '';

		let targetTab = '';
		let allowed = true;

		switch (pendingAction) {
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
				return;
		}

		if (targetTab) {
			dispatch(setAppActiveTab(targetTab));
		}

		if (!allowed) {
			feedback.notify('Your role does not allow that action for this property.');
		}

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

		const effectivePropertyType = formData.propertyType;
		const normalizedGroupId =
			typeof formData.groupId === 'string' && formData.groupId.trim().length > 0
				? formData.groupId.trim()
				: null;

		const sharingData = {
			coOwners: formData.coOwners || [],
			administrators: formData.administrators || [],
			viewers: formData.viewers || [],
			accessSnapshots: formData.accessSnapshots || {},
		};

		const updates = {
			title: formData.name,
			image: formData.photo || property.image,
			groupId: normalizedGroupId,
			owner: formData.owner,
			address: formData.address,
			propertyType: effectivePropertyType,
			propertyClassification: formData.propertyClassification,
			bedrooms: formData.bedrooms,
			bathrooms: formData.bathrooms,
			notes: formData.notes,
			isRental: !!formData.isRental,
			...sharingData,
		};

		const sanitizedUpdates = Object.fromEntries(
			Object.entries(updates).filter(([, value]) => value !== undefined),
		);

		await updatePropertyMutation({
			id: property.id,
			updates: sanitizedUpdates,
		}).unwrap();

		const generatedSpaceTemplates = buildPropertyProfileSpaceTemplates(formData);
		if (generatedSpaceTemplates.length > 0) {
			try {
				const existingSpaces = await getPropertySpaces({
					accountId: propertyAccountId,
					propertyId: property.id,
					includeArchived: true,
				}).unwrap();
				const spaceResult = await ensureGeneratedPropertySpaces({
					accountId: propertyAccountId,
					propertyId: property.id,
					templates: generatedSpaceTemplates,
					existingSpaces,
					source: 'property_profile',
					createSpace: (input) => createPropertySpace(input).unwrap(),
				});
				if (spaceResult.archivedConflicts.length > 0) {
					feedback.notify(
						'Property details were saved. Restore or rename the matching archived Spaces before Maintley can add every Bedroom and Bathroom.',
					);
				}
			} catch (spaceError) {
				console.error(
					'Property updated but profile Spaces were not all reconciled:',
					spaceError,
				);
				feedback.notify(
					'Property details were saved, but Maintley could not add every Bedroom and Bathroom Space. Please try saving again.',
				);
			}
		}

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
		const deletedPropertyId = property.id;
		const deletedPropertyTitle = property.title;
		const redirectPath = isHomeowner ? '/dashboard' : '/properties';

		setIsPropertyDialogOpen(false);
		setIsActionMenuOpen(false);
		navigate(redirectPath, { replace: true });

		try {
			await createNotification({
				userId: currentUser!.id,
				type: 'property_deleted',
				title: 'Property Deleted',
				message: `Property "${deletedPropertyTitle}" has been deleted`,
				data: {
					propertyId: deletedPropertyId,
					propertyTitle: deletedPropertyTitle,
				},
				status: 'unread',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).unwrap();
		} catch (notifError) {
			console.error('Notification failed:', notifError);
		}
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
		maintenanceGroupId?: string;
		completionFileData?: {
			url: string;
			name: string;
			size: number;
			type: string;
			usage?: 'appliance_photo' | 'document';
			uploadedAt?: string;
		};
		recurringTaskId?: string;
		linkedTaskIds?: string[];
		financials?: TaskFinancials;
		eventType?: any;
		eventSource?: any;
		tags?: string[];
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
			return true;
		} catch (error) {
			console.error('Failed to add maintenance history:', error);
			feedback.notify('Failed to add maintenance history. Please try again.');
			return false;
		}
	};

	const handleDeleteMaintenanceHistory = async (historyId: string) => {
		if (!roleCapabilities.canManageMaintenanceHistory) {
			feedback.notify('Your role can view maintenance history but cannot delete records.');
			return;
		}

		const recordToDelete = maintenanceHistoryRecords.find(
			(record: any) => String(record.id) === String(historyId),
		);
		const recordToDeleteDetails = recordToDelete as any;
		const recordName =
			recordToDeleteDetails?.title ||
			recordToDeleteDetails?.description ||
			recordToDeleteDetails?.completionNotes ||
			'this maintenance history record';
		if (
			!window.confirm(
				`Remove "${recordName}" from maintenance history? The correction will remain in the audit trail.`,
			)
		) {
			return;
		}
		const correctionReason = window.prompt(
			'Why is this maintenance record being removed?',
			'Duplicate or incorrect record',
		)?.trim();
		if (!correctionReason) return;

		try {
			await deleteMaintenanceHistory({ id: historyId, correctionReason }).unwrap();
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

	const propertyTasks = useMemo(() => {
		if (!property) return [];
		const allPropertyTasks = allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
		return allPropertyTasks.filter((task) => task.status !== 'Completed');
	}, [property, allTasks]);

	const propertyAllTasks = useMemo(() => {
		if (!property) return [];
		return allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
	}, [property, allTasks]);

	const { data: sourceMaintenanceHistoryRecords = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
			refetchOnMountOrArgChange: true,
		});
	const { data: propertyDevices = [] } = useGetDevicesQuery(property?.id || '', {
		skip: !property?.id,
	});
	const maintenanceHistoryRecords = useMemo(
		() =>
			mergeMaintenanceHistoryWithDeviceSources(
				sourceMaintenanceHistoryRecords,
				propertyDevices,
			),
		[sourceMaintenanceHistoryRecords, propertyDevices],
	);
	const canRunPropertyScan =
		canManageProperties &&
		roleCapabilities.canManageAppliances &&
		roleCapabilities.canCreateTasks &&
		!isUserTenant;

	const executePropertyScanAction = (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => {
		switch (actionType) {
			case 'edit_property':
				handleOpenPropertyDialog();
				break;
			case 'add_system':
				handleSetupAddMoreAppliances();
				break;
			case 'open_systems':
				selectPropertyTab('devices');
				break;
			case 'edit_system': {
				const system = propertyDevices.find(
					(device) => device.id === recommendation.systemId,
				);
				if (property?.slug && system) {
					const deviceSlug = buildDeviceSlug({
						id: system.id,
						type: system.type,
						brand: system.brand,
						model: system.model,
					});
					navigate(`/property/${property.slug}/device/${deviceSlug}`);
					break;
				}
				selectPropertyTab('devices');
				break;
			}
			case 'upload_document':
				handleSetupUploadDocuments();
				break;
			case 'create_task':
				handleOpenCreateTaskDialog(recommendation);
				break;
			case 'open_task':
				selectPropertyTab('tasks');
				break;
			case 'open_maintenance':
				if (recommendation.resolution?.resolutionType === 'create_history') {
					handleOpenCreateMaintenanceHistoryDialog(recommendation);
					break;
				}
				selectPropertyTab('maintenance');
				break;
			case 'review_setup': {
				const nextParams = new URLSearchParams(searchParams);
				nextParams.set('setup', '1');
				setSearchParams(nextParams);
				break;
			}
			case 'view_plan_options':
				navigate('/paywall');
				break;
			default:
				break;
		}
	};

	const handlePropertyScanAction = (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => {
		if (
			recommendation.resolution &&
			actionType === recommendation.resolution.primaryActionType
		) {
			setResolutionRecommendation(recommendation);
			return;
		}

		executePropertyScanAction(actionType, recommendation);
	};

	const handleResolutionAction = (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => {
		setResolutionRecommendation(null);
		executePropertyScanAction(actionType, recommendation);
	};

	const handleResolutionTaskSaved = (recommendationId: string) => {
		setResolvedRecommendationIds((currentIds) =>
			currentIds.includes(recommendationId)
				? currentIds
				: [...currentIds, recommendationId],
		);
		setCreateTaskDraft(null);
		setCreateTaskDraftRecommendationId(null);
	};

	const handleResolutionHistorySaved = (recommendationId: string) => {
		setResolvedRecommendationIds((currentIds) =>
			currentIds.includes(recommendationId)
				? currentIds
				: [...currentIds, recommendationId],
		);
		setCreateHistoryDraft(null);
		setCreateHistoryDraftRecommendationId(null);
	};

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
		if (
			isLoadingProperties ||
			isFetchingProperties ||
			isLoadingLiveProperty ||
			isFetchingLiveProperty
		) {
			return (
				<LoadingState
					loadingKey='property-detail'
					title={isHomeowner ? 'Loading home' : 'Loading property'}
					message={isHomeowner ? 'Preparing this home record.' : 'Preparing this property workspace.'}
					steps={[
						isHomeowner ? 'Loading your home...' : 'Loading your property...',
						isHomeowner ? 'Building your home timeline...' : 'Building your property timeline...',
						'Checking upcoming maintenance...',
						'Organizing your documents...',
						'Connecting maintenance history...',
						isHomeowner ? 'Reviewing your home...' : 'Reviewing your property...',
					]}
				/>
			);
		}
		return (
			<Wrapper>
				<ZeroState
					icon='🔍'
					title={isHomeowner ? 'Home not found' : 'Property record not found'}
					description={
						isHomeowner
							? "The home you're looking for doesn't exist or may have been deleted."
							: "The property record you're looking for doesn't exist or may have been deleted."
					}
					actions={[
						{
							label: isHomeowner ? 'Back to Home' : 'Back to Property Records',
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
				backLabel={isHomeowner ? '← Back to Home' : '← Back to Property Records'}
				onBack={() => navigate('/properties')}
				topRight={currentUser ? (
					<div style={{ display: 'none' }} className='mobile-action-menu'>
						{canManageProperties && (
							<button
								onClick={() => {
									setIsActionMenuOpen(false);
									handleOpenPropertyDialog();
								}}
								style={{
									background: 'rgba(255, 255, 255, 0.14)',
									border: '1px solid rgba(255, 255, 255, 0.45)',
									padding: '10px 12px',
									borderRadius: '999px',
									cursor: 'pointer',
									fontSize: '15px',
									color: 'white',
									zIndex: 3,
									minWidth: '44px',
									minHeight: '44px',
								}}
								aria-label={isHomeowner ? 'Edit home record' : 'Edit property record'}
								title={isHomeowner ? 'Edit home record' : 'Edit property record'}>
								<FontAwesomeIcon icon={faPen} />
							</button>
						)}
						<button
							onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
							style={{
								background: 'rgba(255, 255, 255, 0.14)',
								border: '1px solid rgba(255, 255, 255, 0.45)',
								padding: '10px 12px',
								borderRadius: '999px',
								cursor: 'pointer',
								fontSize: '15px',
								color: 'white',
								zIndex: 3,
								minWidth: '44px',
								minHeight: '44px',
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
										onClick={() => {
											setIsActionMenuOpen(false);
											handleOpenPropertyDialog();
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
										{isHomeowner ? 'Edit Home Record' : 'Edit Property Record'}
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
								✎ {isHomeowner ? 'Edit Home Record' : 'Edit Property Record'}
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
					canUseAssistant={canRunPropertyScan}
					initiallyOpen={shouldOpenPropertySetup}
					onInitialOpenHandled={handlePropertySetupOpened}
					onAssistantClosed={handleSetupAssistantExited}
					onAssistantCompleted={handleSetupAssistantExited}
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
					maintenanceHistoryRecords={maintenanceHistoryRecords}
					propertyUnits={propertyUnits}
					propertyContractors={propertyContractors}
					familyMembers={familyMembers}
					teamMembers={teamMembers}
					allTasks={propertyAllTasks}
					homeownerMode={isHomeowner}
					canRunPropertyScan={canRunPropertyScan}
					showPropertyScanPrompt={showPropertyScanPrompt}
					resolvedRecommendationIds={resolvedRecommendationIds}
					createTaskDraft={createTaskDraft}
					createTaskDraftRecommendationId={createTaskDraftRecommendationId}
					onCreateTaskDraftSaved={handleResolutionTaskSaved}
					openCreateHistoryToken={openCreateHistoryToken}
					createHistoryDraft={createHistoryDraft}
					createHistoryDraftRecommendationId={createHistoryDraftRecommendationId}
					onCreateHistoryDraftSaved={handleResolutionHistorySaved}
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
					handlePropertyScanAction={handlePropertyScanAction}
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

				{property && showResolutionTaskModal && (
					<TaskModal
						isOpen={showResolutionTaskModal}
						onClose={() => {
							setShowResolutionTaskModal(false);
							setCreateTaskDraft(null);
							setCreateTaskDraftRecommendationId(null);
						}}
						isEditing={false}
						initialTask={createTaskDraft}
						propertyId={property.id}
						unitId=''
						currentUser={currentUser}
						taskTitlePlaceholder={
							createTaskDraftRecommendationId
								? 'Recurring task name'
								: undefined
						}
						onSaved={() => {
							if (createTaskDraftRecommendationId) {
								handleResolutionTaskSaved(createTaskDraftRecommendationId);
							}
							setShowResolutionTaskModal(false);
						}}
					/>
				)}

				{property && showResolutionHistoryModal && (
					<AddMaintenanceHistoryModal
						isOpen={showResolutionHistoryModal}
						onClose={() => {
							setShowResolutionHistoryModal(false);
							setCreateHistoryDraft(null);
							setCreateHistoryDraftRecommendationId(null);
						}}
						title='Add Maintenance History'
						primaryButtonLabel='Add History'
						initialData={createHistoryDraft || undefined}
						onSubmit={async (data) => {
							const didSave = await handleAddMaintenanceHistory(data);
							if (!didSave) return;
							if (createHistoryDraftRecommendationId) {
								handleResolutionHistorySaved(createHistoryDraftRecommendationId);
							}
							setShowResolutionHistoryModal(false);
						}}
						property={property}
						devices={propertyDevices}
						units={propertyUnits}
						teamMembers={teamMembers}
						contractors={propertyContractors}
						familyMembers={familyMembers}
						groupOptions={[]}
						onCreateGroupId={() => ''}
					/>
				)}

				<RecommendationResolutionModal
					isOpen={Boolean(resolutionRecommendation)}
					recommendation={resolutionRecommendation}
					onClose={() => setResolutionRecommendation(null)}
					onStartAction={handleResolutionAction}
				/>

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
							propertyType: normalizePropertyType((property as any).propertyType),
							propertyClassification:
								(property as any).propertyClassification ||
								getDefaultPropertyClassification((property as any).propertyType),
							bedrooms: (property as any).bedrooms || 0,
							bathrooms: (property as any).bathrooms || 0,
							notes: (property as any).notes || '',
							isRental: (property as any).isRental ?? false,
							coOwners: (property as any).coOwners || [],
							administrators: (property as any).administrators || [],
							viewers: (property as any).viewers || [],
							accessSnapshots: (property as any).accessSnapshots || {},
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

				@media (max-width: 768px) {
					.desktop-actions {
						display: none !important;
					}

					.mobile-action-menu {
						display: flex !important;
						align-items: center;
						gap: 8px;
					}
				}
			`}</style>
		</Wrapper>
	);
};
