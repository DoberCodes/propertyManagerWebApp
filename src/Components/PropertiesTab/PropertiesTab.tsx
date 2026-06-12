import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { PropertyDialog, PropertyFormData } from './PropertyDialog';
import {
	getPropertyImageSrc,
	isPropertyImageFallback,
} from '../../utils/propertyImagePlaceholder';
import {
	PageHeaderSection,
	PageTitle as StandardPageTitle,
} from '../Library/PageHeaders';
import { DeleteConfirmationModal } from '../Library/Modal/DeleteConfirmationModal';
import { ZeroState } from '../Library/ZeroState';
import { useRecentlyViewed } from '../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../Hooks/useFavorites';
import { RootState } from '../../Redux/store/store';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import {
	selectCanAccessProperties,
	selectIsHomeowner,
} from '../../Redux/selectors/permissionSelectors';
import {
	useCreatePropertyMutation,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
} from '../../Redux/API/propertySlice';
import { useCreateTaskMutation, useGetTasksQuery } from '../../Redux/API/taskSlice';
import {
	useCreateDeviceMutation,
	useGetAllDevicesQuery,
} from '../../Redux/API/deviceSlice';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import {
	canAddProperty,
	canPropertyGroups,
	getRemainingPropertySlots,
	getSubscriptionPlanDetails,
	isTrialExpired,
} from '../../utils/subscriptionUtils';
import { LockedFeatureCallout } from '../Library/LockedFeatureCallout';
import {
	filterPropertyGroupsByRole,
	getTenantAssignmentForProperty,
	isTeamMemberScopedAccount,
} from '../../utils/dataFilters';
import { canDeleteProperty, getRoleCapabilities } from '../../utils/permissions';
import { TeamMember } from '../../Redux/Slices/teamSlice';
import { USER_ROLES } from '../../constants/roles';
import {
	Wrapper,
	TopActions,
	SummaryStatsGrid,
	SummaryCard,
	SummaryIcon,
	SummaryValue,
	SummaryLabel,
	GroupsContainer,
	GroupSection,
	GroupHeader,
	GroupName,
	GroupCountBadge,
	GroupNameInput,
	HeaderRight,
	AddPropertyButton,
	PropertiesGrid,
	AddPropertyTile,
	AddPropertyTileIcon,
	AddPropertyTileTitle,
	AddPropertyTileHint,
	PropertyTile,
	PropertyImageWrap,
	PropertyImage,
	PropertyTopBadge,
	PropertyTopMenu,
	PropertyBody,
	PropertyTitle,
	PropertyAddress,
	PropertyLabelBadge,
	PropertyMetaRow,
	PropertyMetaItem,
	PropertyMetaText,
	DropdownMenu,
	DropdownItem,
	DropdownToggle,
	GroupActions,
	GroupActionMenu,
	PageSubtitle,
	SearchBar,
	FilterSortContainer,
	FilterButton,
	SortButton,
	CollapseToggle,
	SummarySubtitle,
	HeaderMenuWrap,
	HeaderMenuButton,
	HeaderDropdownMenu,
	HeaderDropdownItem,
	HeaderDropdownIcon,
	HeaderDropdownTitle,
	HeaderDropdownHint,
} from './PropertiesTab.styles';
import { Property } from '../../types/Property.types';
import {
	SUGGESTED_MAINTENANCE_DISCLAIMER,
	SUGGESTED_SYSTEMS,
	SuggestedSystemId,
	getSuggestedTaskDueDate,
	getSuggestedTasksForSystems,
} from '../../utils/suggestedMaintenance';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faHouse,
	faWrench,
	faCalendarDays,
	faFileLines,
	faChevronUp,
	faChevronDown,
	faEllipsis,
	faEllipsisVertical,
	faFolderPlus,
	faUsers,
	faMinimize,
	faGear,
	faLocationDot,
	faMicrochip,
	faClock,
} from '@fortawesome/free-solid-svg-icons';

const ACTIVE_TASK_STATUSES = new Set([
	'Initiated',
	'Pending',
	'In Progress',
	'Awaiting Approval',
	'Overdue',
	'Hold',
]);

const stripUndefinedValues = (value: any): any => {
	if (Array.isArray(value)) {
		return value.map(stripUndefinedValues);
	}

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, entryValue]) => entryValue !== undefined)
				.map(([key, entryValue]) => [key, stripUndefinedValues(entryValue)]),
		);
	}

	return value;
};

export const Properties = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isUserTenant = currentUser?.role === USER_ROLES.TENANT;
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isHomeowner = useSelector(selectIsHomeowner);
	// Select team groups and derive members with memoization to avoid new references
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const teamMembers = useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);
	const isTeamMemberAccount = isTeamMemberScopedAccount(
		currentUser,
		teamMembers.filter((member): member is TeamMember => member !== undefined),
	);

	// Read property groups from Redux store (populated by DataLoader)
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	const { addRecentlyViewed } = useRecentlyViewed(currentUser!.id);
	const { toggleFavorite, isFavorite } = useFavorites(currentUser!.id);

	// Firebase mutations
	const [createProperty] = useCreatePropertyMutation();
	const [updateProperty] = useUpdatePropertyMutation();
	const [deleteProperty] = useDeletePropertyMutation();
	const [createPropertyGroup] = useCreatePropertyGroupMutation();
	const [updatePropertyGroup] = useUpdatePropertyGroupMutation();
	const [deletePropertyGroup] = useDeletePropertyGroupMutation();
	const [updateUser] = useUpdateUserMutation();
	const [createNotification] = useCreateNotificationMutation();
	const [createTask] = useCreateTaskMutation();
	const [createDevice] = useCreateDeviceMutation();
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: allDevices = [] } = useGetAllDevicesQuery();

	// Check if user can manage properties based on subscription plan
	// All paid plans allow property management, free plan has limited access
	// Expired users cannot add new properties
	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const canManage =
		roleCapabilities.canManageProperties &&
		canAccessProperties &&
		(currentUser?.subscription
			? !isTrialExpired(currentUser.subscription)
			: false);

	// Check if user can create/edit/delete groups (basic and above plans only, not homeowner)
	// Expired users cannot manage groups
	const canManageGroups = currentUser?.subscription
		? roleCapabilities.canManageProperties &&
		  canPropertyGroups(currentUser.subscription) &&
		  !isTrialExpired(currentUser.subscription)
		: false;

	// Combine groups with their properties
	const groupsWithProperties = useMemo(() => {
		return propertyGroups.map((group) => ({
			...group,
			properties: group.properties || [],
		}));
	}, [propertyGroups]);

	const totalProperties = groupsWithProperties.reduce(
		(acc, group) => acc + (group.properties?.length || 0),
		0,
	);

	// Filter groups based on user role and assignments
	// Note: Casting to any[] to handle type mismatch between Redux types (number IDs) and Firebase types (string IDs)
	const filteredGroups = useMemo(() => {
		const groups = filterPropertyGroupsByRole(
			groupsWithProperties as any[],
			currentUser,
			teamMembers?.filter((m): m is TeamMember => m !== undefined),
		);
		// Sort groups so "My Properties" appears first
		return groups.sort((a, b) => {
			const aName = a.name?.toLowerCase() || '';
			const bName = b.name?.toLowerCase() || '';
			if (aName === 'my properties') return -1;
			if (bName === 'my properties') return 1;
			return 0;
		});
	}, [groupsWithProperties, currentUser, teamMembers]);

	const propertyAggregates = useMemo(() => {
		const taskByProperty = new Map<
			string,
			{ overdue: number; next7: number; next30: number; documents: number }
		>();
		const deviceByProperty = new Map<string, { systems: number; documents: number }>();

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const sevenDaysFromNow = new Date(today);
		sevenDaysFromNow.setDate(today.getDate() + 7);
		const thirtyDaysFromNow = new Date(today);
		thirtyDaysFromNow.setDate(today.getDate() + 30);

		allTasks.forEach((task: any) => {
			if (!task?.propertyId) {
				return;
			}

			const status = String(task.status || '').toLowerCase();
			if (status === 'completed' || status === 'rejected') {
				return;
			}

			const propertyId = String(task.propertyId);
			const current = taskByProperty.get(propertyId) || {
				overdue: 0,
				next7: 0,
				next30: 0,
				documents: 0,
			};

			if (task.completionFile?.url) {
				current.documents += 1;
			}

			if (!task.dueDate) {
				taskByProperty.set(propertyId, current);
				return;
			}

			const dueDate = new Date(task.dueDate);
			if (Number.isNaN(dueDate.getTime())) {
				taskByProperty.set(propertyId, current);
				return;
			}

			dueDate.setHours(0, 0, 0, 0);
			if (dueDate < today) {
				current.overdue += 1;
			}
			if (dueDate >= today && dueDate <= sevenDaysFromNow) {
				current.next7 += 1;
			}
			if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
				current.next30 += 1;
			}

			taskByProperty.set(propertyId, current);
		});

		allDevices.forEach((device: any) => {
			const propertyId = String(device?.location?.propertyId || '');
			if (!propertyId) {
				return;
			}

			const current = deviceByProperty.get(propertyId) || {
				systems: 0,
				documents: 0,
			};
			current.systems += 1;
			current.documents += Array.isArray(device.files) ? device.files.length : 0;
			deviceByProperty.set(propertyId, current);
		});

		return { taskByProperty, deviceByProperty };
	}, [allTasks, allDevices]);

	const summaryCards = useMemo(() => {
		const uniqueProperties = Array.from(
			new Map(
				filteredGroups
					.flatMap((group) => group.properties || [])
					.map((property) => [property.id, property]),
			).values(),
		);

		const maintenanceDue = uniqueProperties.reduce((count, property: any) => {
			const propertyId = String(property.id);
			const taskSummary = propertyAggregates.taskByProperty.get(propertyId);
			return count + (taskSummary?.overdue || 0) + (taskSummary?.next30 || 0);
		}, 0);

		const scheduled = uniqueProperties.reduce((count, property: any) => {
			const propertyId = String(property.id);
			return count + (propertyAggregates.taskByProperty.get(propertyId)?.next7 || 0);
		}, 0);

		const documents = uniqueProperties.reduce((count, property: any) => {
			const propertyId = String(property.id);
			const taskDocuments =
				propertyAggregates.taskByProperty.get(propertyId)?.documents || 0;
			const deviceDocuments =
				propertyAggregates.deviceByProperty.get(propertyId)?.documents || 0;
			const propertyPhotoDocument = property.image ? 1 : 0;
			return count + taskDocuments + deviceDocuments + propertyPhotoDocument;
		}, 0);

		return [
			{
				value: uniqueProperties.length,
				label: 'Total Properties',
				icon: faHouse,
				bg: '#ecfdf3',
				color: '#0f9f6e',
			},
			{
				value: maintenanceDue,
				label: 'Maintenance Due',
				subtitle: 'In the next 30 days',
				icon: faWrench,
				bg: '#fff7ed',
				color: '#ea580c',
			},
			{
				value: scheduled,
				label: 'Scheduled',
				subtitle: 'In the next 7 days',
				icon: faCalendarDays,
				bg: '#eff6ff',
				color: '#2563eb',
			},
			{
				value: documents,
				label: 'Documents',
				subtitle: 'Across all properties',
				icon: faFileLines,
				bg: '#f5f3ff',
				color: '#7c3aed',
			},
		];
	}, [filteredGroups, propertyAggregates]);

	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedGroupForDialog, setSelectedGroupForDialog] = useState<
		string | null
	>(null);
	const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<
		any | null
	>(null);
	const [propertyToDuplicate, setPropertyToDuplicate] = useState<any | null>(null);
	const [copyTasksOnDuplicate, setCopyTasksOnDuplicate] = useState(false);
	const [copyAppliancesOnDuplicate, setCopyAppliancesOnDuplicate] = useState(true);
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
	const [editingGroupName, setEditingGroupName] = useState<string>('');
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [propertyToDelete, setPropertyToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [isDeletingProperty, setIsDeletingProperty] = useState(false);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
	const [sortBy, setSortBy] = useState<'name' | 'recent' | 'updated'>('name');
	const [filterBy, setFilterBy] = useState<'all' | 'rental' | 'residential'>('all');
	const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
	const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
	const headerMenuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				headerMenuRef.current &&
				!headerMenuRef.current.contains(event.target as Node)
			) {
				setIsHeaderMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const duplicateSourceTasks = useMemo(() => {
		if (!propertyToDuplicate?.id) {
			return [];
		}

		return allTasks.filter((task: any) => {
			const status = String(task?.status || 'Pending');
			return (
				String(task?.propertyId || '') === String(propertyToDuplicate.id) &&
				ACTIVE_TASK_STATUSES.has(status)
			);
		});
	}, [allTasks, propertyToDuplicate]);

	const duplicateSourceDevices = useMemo(() => {
		if (!propertyToDuplicate?.id) {
			return [];
		}

		return allDevices.filter(
			(device: any) =>
				String(device?.location?.propertyId || '') ===
				String(propertyToDuplicate.id),
		);
	}, [allDevices, propertyToDuplicate]);

	const duplicateInitialData = useMemo<PropertyFormData | undefined>(() => {
		if (!propertyToDuplicate) {
			return undefined;
		}

		return {
			name: propertyToDuplicate.title || '',
			photo: propertyToDuplicate.image,
			owner: propertyToDuplicate.owner || '',
			address: propertyToDuplicate.address || '',
			propertyType: propertyToDuplicate.propertyType || 'Single Family',
			units: [],
			hasSuites: false,
			suites: [],
			bedrooms: propertyToDuplicate.bedrooms ?? 0,
			bathrooms: propertyToDuplicate.bathrooms ?? 0,
			notes: propertyToDuplicate.notes || '',
			isRental: propertyToDuplicate.isRental ?? false,
			maintenanceHistory: [],
			groupId:
				selectedGroupForDialog ||
				propertyToDuplicate.groupId ||
				null,
			coOwners: [],
			administrators: [],
			viewers: [],
		};
	}, [propertyToDuplicate, selectedGroupForDialog]);

	const handleAddGroup = async () => {
		if (!currentUser) {
			console.error('No user logged in');
			return;
		}

		try {
			const result = await createPropertyGroup({
				userId: currentUser.id,
				name: 'New Group',
				properties: [],
			}).unwrap();

			// Create notification for property group creation
			try {
				await createNotification({
					userId: currentUser.id,
					type: 'property_group_created',
					title: 'Property Group Created',
					message: 'New property group "New Group" has been created',
					data: {
						groupId: result.id,
						groupName: 'New Group',
					},
					status: 'unread',
					actionUrl: `/properties`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}
		} catch (error) {
			console.error('Failed to create property group:', error);
		}
	};

	const handleToggleEditName = (groupId: string) => {
		if (editingGroupId === groupId) {
			// Save the name change
			if (
				editingGroupName.trim() &&
				editingGroupName !== propertyGroups.find((g) => g.id === groupId)?.name
			) {
				try {
					updatePropertyGroup({
						id: groupId,
						updates: { name: editingGroupName },
					}).unwrap();

					// Create notification for property group update
					try {
						createNotification({
							userId: currentUser!.id,
							type: 'property_group_updated',
							title: 'Property Group Updated',
							message: `Property group "${editingGroupName}" has been updated`,
							data: {
								groupId: groupId,
								groupName: editingGroupName,
							},
							status: 'unread',
							actionUrl: `/properties`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notifError) {
						console.error('Notification failed:', notifError);
					}
				} catch (error) {
					console.error('Error updating property group:', error);
				}
			}
			setEditingGroupId(null);
			setEditingGroupName('');
		} else {
			// Start editing
			const group = propertyGroups.find((g) => g.id === groupId);
			if (group) {
				setEditingGroupId(groupId);
				setEditingGroupName(group.name);
			}
		}
	};

	const handleDisabled = useCallback(() => {
		if (!currentUser) return true;
		if (currentUser.subscription) {
			const remainingSlots = getRemainingPropertySlots(
				currentUser.subscription,
				totalProperties,
			);
			return remainingSlots <= 0;
		}
		return false;
	}, [currentUser, totalProperties]);

	const handleAddPropertyGlobalClick = async () => {
		// Check subscription limits
		if (currentUser?.subscription) {
			const canAdd = canAddProperty(
				currentUser.subscription,
				totalProperties,
				currentUser.role,
			);
			if (!canAdd) {
				const planDetails = getSubscriptionPlanDetails(
					currentUser.subscription.plan,
				);
				const maxProperties = planDetails?.maxProperties || 1;

				feedback.notify(
					`Your ${
						planDetails?.name || 'current'
					} plan allows up to ${maxProperties} properties. ` +
						`You currently have ${totalProperties} properties. ` +
						`Please upgrade your plan to add more properties.`,
				);
				// TODO: Redirect to paywall/upgrade page
				return;
			}
		} else {
			// No subscription data - should not happen, but fallback
			feedback.notify('Unable to verify subscription. Please contact support.');
			return;
		}

		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
		setPropertyToDuplicate(null);
		setCopyTasksOnDuplicate(false);
		setCopyAppliancesOnDuplicate(true);
		setDialogOpen(true);
	};

	const handleEditPropertyClick = (groupId: string, property: any) => {
		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(property);
		setPropertyToDuplicate(null);
		setCopyTasksOnDuplicate(false);
		setCopyAppliancesOnDuplicate(true);
		addRecentlyViewed({
			id: property.id,
			title: property.title,
			slug: property.slug,
		});
		setDialogOpen(true);
	};

	const handleDuplicatePropertyClick = (groupId: string, property: any) => {
		if (!currentUser?.subscription) {
			feedback.notify('Unable to verify subscription. Please contact support.');
			return;
		}

		const canAdd = canAddProperty(
			currentUser.subscription,
			totalProperties,
			currentUser.role,
		);
		if (!canAdd) {
			const planDetails = getSubscriptionPlanDetails(currentUser.subscription.plan);
			const maxProperties = planDetails?.maxProperties || 1;
			feedback.notify(
				`Your ${planDetails?.name || 'current'} plan allows up to ${maxProperties} properties. ` +
					`You currently have ${totalProperties} properties. ` +
					`Please upgrade your plan to duplicate this property.`,
			);
			setOpenDropdown(null);
			return;
		}

		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(null);
		setPropertyToDuplicate(property);
		setCopyTasksOnDuplicate(false);
		setCopyAppliancesOnDuplicate(true);
		setOpenDropdown(null);
		setDialogOpen(true);
	};

	const handleAddPropertyToGroup = (groupId: string) => {
		setSelectedGroupForDialog(groupId);
		setSelectedPropertyForEdit(null);
		setPropertyToDuplicate(null);
		setCopyTasksOnDuplicate(false);
		setCopyAppliancesOnDuplicate(true);
		setDialogOpen(true);
	};

	const handleClosePropertyDialog = () => {
		setDialogOpen(false);
		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
		setPropertyToDuplicate(null);
		setCopyTasksOnDuplicate(false);
		setCopyAppliancesOnDuplicate(true);
	};

	const handleToggleCollapse = (groupId: string) => {
		const newCollapsed = new Set(collapsedGroups);
		if (newCollapsed.has(groupId)) {
			newCollapsed.delete(groupId);
		} else {
			newCollapsed.add(groupId);
		}
		setCollapsedGroups(newCollapsed);
	};

	const handleCollapseAllGroups = () => {
		setCollapsedGroups(new Set(filteredGroups.map((group) => group.id as string)));
		setIsHeaderMenuOpen(false);
	};

	const handleHeaderCreateGroup = async () => {
		setIsHeaderMenuOpen(false);
		await handleAddGroup();
	};

	const handleHeaderManageGroups = () => {
		setIsHeaderMenuOpen(false);
		feedback.notify('Use the edit and delete icons next to each group to manage groups.');
	};

	const handleHeaderGroupSettings = () => {
		setIsHeaderMenuOpen(false);
		feedback.notify('Group settings are coming soon.');
	};

	const handleGroupSettings = () => {
		setOpenGroupMenuId(null);
		feedback.notify('Group settings are coming soon.');
	};

	const handleDeleteProperty = async (propertyId: string) => {
		const propertyToDelete = filteredGroups
			.flatMap((g) => g.properties || [])
			.find((p) => p.id === propertyId);

		if (propertyToDelete) {
			setPropertyToDelete({
				id: propertyId,
				name: propertyToDelete.title,
			});
			setDeleteModalOpen(true);
		}
	};

	const handleDeletePropertyFromDialog = async () => {
		if (!selectedPropertyForEdit) {
			return;
		}

		const deletingProperty = selectedPropertyForEdit;

		await deleteProperty(deletingProperty.id).unwrap();

		try {
			await createNotification({
				userId: currentUser!.id,
				type: 'property_deleted',
				title: 'Property Deleted',
				message: `Property "${deletingProperty.title}" has been deleted`,
				data: {
					propertyId: deletingProperty.id,
					propertyTitle: deletingProperty.title,
				},
				status: 'unread',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).unwrap();
		} catch (notifError) {
			console.error('Notification failed:', notifError);
		}

		setDialogOpen(false);
		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
	};

	const getTenantUnitRoute = useCallback(
		(property: Property): string | null => {
			// Units are temporarily hidden from the app flow; tenant cards should open
			// the property page until unit-level surfaces return.
			return property.slug ? `/property/${property.slug}` : null;

			/*
			if (!isUserTenant) {
				return null;
			}

			const assignment = getTenantAssignmentForProperty(property, currentUser.email);
			if (!assignment?.unit && !assignment?.unitId) {
				return null;
			}

			const units = (((property as any).units as Array<any>) || []).filter(Boolean);
			const matchedUnit = units.find(
				(unit) =>
					(assignment.unitId && unit?.id === assignment.unitId) ||
					(assignment.unit && (unit?.id === assignment.unit || unit?.name === assignment.unit)),
			);

			const unitName =
				typeof matchedUnit?.name === 'string' && matchedUnit.name.trim().length > 0
					? matchedUnit.name
					: assignment.unit;

			if (!unitName) {
				return null;
			}

			return `/property/${property.slug}/unit/${encodeURIComponent(unitName)}`;
			*/
		},
		[],
	);

	const tenantAssignedProperties = useMemo(() => {
		if (!isUserTenant || !currentUser?.email) {
			return [] as Property[];
		}

		// Filter to only properties where the tenant has an actual assignment
		return filteredGroups
			.flatMap((group) => group.properties || [])
			.filter((property) => getTenantAssignmentForProperty(property, currentUser.email) !== null);
	}, [isUserTenant, filteredGroups, currentUser?.email]);

	const visibleProperties = useMemo(() => {
		const source = isUserTenant
			? tenantAssignedProperties
			: filteredGroups.flatMap((group) => group.properties || []);

		return Array.from(new Map(source.map((property) => [property.id, property])).values());
	}, [isUserTenant, tenantAssignedProperties, filteredGroups]);

	const singleVisibleProperty = visibleProperties.length === 1 ? visibleProperties[0] : null;
	
	// Only redirect to single property if user has NO remaining capacity on their plan
	// This allows property managers to see the "Add Property" button when they have plan capacity
	const hasRemainingCapacity = useMemo(() => {
		if (!currentUser?.subscription) return false;
		return getRemainingPropertySlots(currentUser.subscription, visibleProperties.length) > 0;
	}, [currentUser, visibleProperties.length]);
	
	const singlePropertyRoute = 
		singleVisibleProperty && !hasRemainingCapacity
			? getTenantUnitRoute(singleVisibleProperty) ||
			  `/property/${singleVisibleProperty.slug}`
			: null;

	const handleConfirmDeleteProperty = async () => {
		if (!propertyToDelete) return;

		try {
			setIsDeletingProperty(true);
			await deleteProperty(propertyToDelete.id).unwrap();

			// Create notification for property deletion
			try {
				await createNotification({
					userId: currentUser!.id,
					type: 'property_deleted',
					title: 'Property Deleted',
					message: `Property "${propertyToDelete.name}" has been deleted`,
					data: {
						propertyId: propertyToDelete.id,
						propertyTitle: propertyToDelete.name,
					},
					status: 'unread',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}

			setDeleteModalOpen(false);
			setPropertyToDelete(null);
		} catch (error) {
			console.error('Error deleting property:', error);
			feedback.notify(
				'Unable to delete this property with your current permissions. If this keeps happening, refresh and try again or contact the account owner/admin.',
			);
		} finally {
			setIsDeletingProperty(false);
			setOpenDropdown(null);
		}
	};

	const handleDeleteGroup = async (groupId: string) => {
		if (
			!window.confirm('Are you sure you want to delete this property group?')
		) {
			return;
		}
		try {
			const groupToDelete = propertyGroups.find((g) => g.id === groupId);
			await deletePropertyGroup(groupId).unwrap();

			// Create notification for property group deletion
			try {
				if (groupToDelete) {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_group_deleted',
						title: 'Property Group Deleted',
						message: `Property group "${groupToDelete.name}" has been deleted`,
						data: {
							groupId: groupId,
							groupName: groupToDelete.name,
						},
						status: 'unread',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				}
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}
		} catch (error) {
			console.error('Failed to delete property group:', error);
			feedback.notify('Failed to delete property group. Please try again.');
		}
	};

	const getPropertyAddress = useCallback((property: Property) => {
		const rawAddress = property.address?.trim();
		if (!rawAddress) {
			return {
				primary: property.title,
				secondary: 'Address not set',
			};
		}

		const parts = rawAddress.split(',').map((part) => part.trim()).filter(Boolean);
		return {
			primary: parts[0] || rawAddress,
			secondary: parts.slice(1).join(', '),
		};
	}, []);

	const getPropertyPillLabel = useCallback((property: Property) => {
		if (property.isRental) {
			return 'Rental';
		}

		if (property.propertyType === 'Commercial') {
			return 'Commercial';
		}

		if (property.propertyType === 'Multi-Family') {
			return 'Portfolio';
		}

		return 'Primary Home';
	}, []);

	const getPropertyMetrics = useCallback((property: Property) => {
		const propertyId = String(property.id);
		const overdueCount =
			propertyAggregates.taskByProperty.get(propertyId)?.overdue || 0;
		const dueSoonCount =
			propertyAggregates.taskByProperty.get(propertyId)?.next7 || 0;
		const systemsCount =
			propertyAggregates.deviceByProperty.get(propertyId)?.systems ||
			property.deviceIds?.length ||
			0;

		return [
			{
				icon: faWrench,
				value: overdueCount,
				label: overdueCount === 1 ? 'Overdue' : 'Overdue',
				color: overdueCount > 0 ? '#ef4444' : '#6b7280',
			},
			{
				icon: faClock,
				value: dueSoonCount,
				label: 'Due Soon',
				color: '#6b7280',
			},
			{
				icon: faMicrochip,
				value: systemsCount,
				label: systemsCount === 1 ? 'System' : 'Systems',
				color: '#6b7280',
			},
		];
	}, [propertyAggregates]);

	const applyDashboardVisibilityPreference = async (
		propertyId: string,
		showOnDashboard: boolean = true,
	) => {
		if (!currentUser) return;

		const hiddenIds = currentUser.hiddenPropertyIds || [];
		const isCurrentlyHidden = hiddenIds.includes(propertyId);

		if (showOnDashboard && !isCurrentlyHidden) return;
		if (!showOnDashboard && isCurrentlyHidden) return;

		const updatedHiddenIds = showOnDashboard
			? hiddenIds.filter((id) => id !== propertyId)
			: [...hiddenIds, propertyId];

		await updateUser({
			id: currentUser.id,
			updates: { hiddenPropertyIds: updatedHiddenIds },
		}).unwrap();

		dispatch(
			setCurrentUser({
				...currentUser,
				hiddenPropertyIds: updatedHiddenIds,
			}),
		);
	};

	const cloneDuplicateAppliances = async (newProperty: any) => {
		const deviceIdMap = new Map<string, string>();

		for (const sourceDevice of duplicateSourceDevices) {
			const {
				id,
				createdAt,
				updatedAt,
				accountId,
				location,
				maintenanceHistory,
				...deviceFields
			} = sourceDevice as any;
			void createdAt;
			void updatedAt;
			void accountId;
			void location;
			void maintenanceHistory;

			const clonedDevice = stripUndefinedValues({
				...deviceFields,
				userId: currentUser!.id,
				location: {
					propertyId: newProperty.id,
				},
				maintenanceHistory: [],
			});

			const createdDevice = await createDevice(clonedDevice).unwrap();
			if (id && createdDevice?.id) {
				deviceIdMap.set(String(id), String(createdDevice.id));
			}
		}

		return deviceIdMap;
	};

	const cloneDuplicateTasks = async (
		newProperty: any,
		deviceIdMap: Map<string, string>,
	) => {
		let copiedTaskCount = 0;

		for (const sourceTask of duplicateSourceTasks) {
			const {
				id,
				createdAt,
				updatedAt,
				accountId,
				propertyId,
				property,
				propertyTitle,
				unitId,
				suiteId,
				devices,
				completionDate,
				completionFile,
				completedBy,
				approvedBy,
				approvedAt,
				rejectionReason,
				completionNotes,
				parentTaskId,
				lastRecurrenceDate,
				linkedMaintenanceHistoryIds,
				maintenanceGroupId,
				...taskFields
			} = sourceTask as any;
			void id;
			void createdAt;
			void updatedAt;
			void accountId;
			void propertyId;
			void property;
			void propertyTitle;
			void unitId;
			void suiteId;
			void completionDate;
			void completionFile;
			void completedBy;
			void approvedBy;
			void approvedAt;
			void rejectionReason;
			void completionNotes;
			void parentTaskId;
			void lastRecurrenceDate;
			void linkedMaintenanceHistoryIds;
			void maintenanceGroupId;

			const mappedDeviceIds = Array.isArray(devices)
				? devices
						.map((deviceId: string) => deviceIdMap.get(String(deviceId)))
						.filter(Boolean)
				: [];

			const clonedTask = stripUndefinedValues({
				...taskFields,
				userId: currentUser!.id,
				propertyId: newProperty.id,
				property: newProperty.title,
				propertyTitle: newProperty.title,
				...(mappedDeviceIds.length > 0 ? { devices: mappedDeviceIds } : {}),
			});

			await createTask(clonedTask).unwrap();
			copiedTaskCount += 1;
		}

		return copiedTaskCount;
	};

	const createSuggestedMaintenanceForProperty = async (
		newProperty: Property,
		formData: PropertyFormData,
	) => {
		const selectedSystemIds = formData.selectedSuggestedSystemIds || [];
		if (selectedSystemIds.length === 0) {
			return { createdDeviceCount: 0, failedDeviceCount: 0, createdTaskCount: 0 };
		}

		const selectedTasks = getSuggestedTasksForSystems(
			selectedSystemIds,
			formData.selectedSuggestedTaskIds || [],
		);
		const selectedSystemIdSet = new Set(selectedSystemIds);
		const selectedSystems = SUGGESTED_SYSTEMS.filter((system) =>
			selectedSystemIdSet.has(system.id),
		);
		const deviceIdMap = new Map<SuggestedSystemId, string>();
		let createdDeviceCount = 0;
		let failedDeviceCount = 0;
		let createdTaskCount = 0;

		for (const system of selectedSystems) {
			try {
				const createdDevice = await createDevice(
						stripUndefinedValues({
							userId: currentUser!.id,
							type: system.deviceType,
							name: system.label,
							brand: '',
							model: '',
						serialNumber: '',
						installationDate: '',
						status: 'Active',
						location: {
							propertyId: newProperty.id,
						},
						notes: 'Created from suggested maintenance setup.',
						maintenanceHistory: [],
					}),
				).unwrap();

				if (createdDevice?.id) {
					deviceIdMap.set(system.id, createdDevice.id as string);
					createdDeviceCount += 1;
				}
			} catch (error) {
				failedDeviceCount += 1;
				console.warn('Failed to create suggested appliance/system:', {
					system,
					error,
				});
			}
		}

		if (!formData.addSuggestedMaintenance) {
			return { createdDeviceCount, failedDeviceCount, createdTaskCount };
		}

		for (const task of selectedTasks) {
			try {
				const linkedDeviceId = deviceIdMap.get(task.systemId);
				await createTask(
					stripUndefinedValues({
						userId: currentUser!.id,
						propertyId: newProperty.id,
						property: newProperty.title,
						propertyTitle: newProperty.title,
						title: task.title,
						dueDate: getSuggestedTaskDueDate(task),
						status: 'Initiated',
						priority: task.priority || 'Medium',
						category: 'Suggested Maintenance',
						notes: [
							`${task.title} was added from Suggested Maintenance Tasks.`,
							task.notes,
							SUGGESTED_MAINTENANCE_DISCLAIMER,
						].filter(Boolean).join(' '),
						isRecurring: true,
						recurrenceFrequency: task.recurrenceFrequency,
						recurrenceInterval: task.recurrenceInterval,
						recurrenceCustomUnit: task.recurrenceCustomUnit,
						enableNotifications: false,
						...(linkedDeviceId ? { devices: [linkedDeviceId] } : {}),
					}),
				).unwrap();
				createdTaskCount += 1;
			} catch (error) {
				console.warn('Failed to create suggested maintenance task:', {
					task,
					error,
				});
			}
		}

		return { createdDeviceCount, failedDeviceCount, createdTaskCount };
	};

	const handleSaveProperty = async (formData: any) => {
		const normalizedName = String(formData.name || '').trim();
		const normalizedAddress = String(formData.address || '').trim();
		const buildPropertySlug = (value: string) =>
			value
				.toLowerCase()
				.trim()
				.replace(/\s+/g, '-')
				.replace(/[^\w-]/g, '');

		if (
			propertyToDuplicate &&
			normalizedName.toLowerCase() ===
				String(propertyToDuplicate.title || '').trim().toLowerCase()
		) {
			feedback.notify('Please choose a new name for the duplicated property.');
			throw new Error('Duplicate property name must be changed');
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

		if (selectedPropertyForEdit) {
			// Edit existing property
			try {
				const updates = {
					title: formData.name,
					image: formData.photo || selectedPropertyForEdit.image,
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
				await updateProperty({
					id: selectedPropertyForEdit.id,
					updates: sanitizedUpdates,
				}).unwrap();

				try {
					await applyDashboardVisibilityPreference(
						selectedPropertyForEdit.id,
						formData.showOnDashboard ?? true,
					);
				} catch (visibilityError) {
					console.error('Failed to update dashboard visibility:', visibilityError);
					feedback.notify(
						'Property saved, but dashboard visibility could not be updated. Please try again.',
					);
				}

				// Create notification for property update
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_updated',
						title: 'Property Updated',
						message: `Property "${formData.name}" has been updated`,
						data: {
							propertyId: selectedPropertyForEdit.id,
							propertyTitle: formData.name,
						},
						status: 'unread',
						actionUrl: `/properties/${selectedPropertyForEdit.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			} catch (error) {
				console.error('Error updating property:', error);
				feedback.notify('Failed to update property. Please try again.');
				throw error; // Re-throw to let PropertyDialog know save failed
			}
		} else {
			// Add new property
			const slug = buildPropertySlug(normalizedName);
			if (!normalizedName || !slug) {
				feedback.notify('Please add a property name before saving.');
				throw new Error('Property name is required');
			}
			if (!normalizedAddress) {
				feedback.notify('Please add a property address before saving.');
				throw new Error('Property address is required');
			}

			if (!currentUser?.subscription) {
				feedback.notify('Unable to verify subscription. Please contact support.');
				throw new Error('Missing subscription data');
			}

			if (
				!canAddProperty(
					currentUser.subscription,
					totalProperties,
					currentUser.role,
				)
			) {
				const planDetails = getSubscriptionPlanDetails(currentUser.subscription.plan);
				const maxProperties = planDetails?.maxProperties || 1;
				feedback.notify(
					`Your ${planDetails?.name || 'current'} plan allows up to ${maxProperties} properties. ` +
						`You currently have ${totalProperties} properties. ` +
						`Please upgrade your plan to add more properties.`,
				);
				throw new Error('Property limit reached');
			}

			// Firebase doesn't accept undefined values
			const newPropertyData: any = {
				userId: currentUser!.id,
				...(normalizedGroupId && { groupId: normalizedGroupId }),
				title: normalizedName,
				slug,
				...(formData.photo && { image: formData.photo }),
				owner: formData.owner,
				address: normalizedAddress,
				propertyType: effectivePropertyType,
				bedrooms: formData.bedrooms,
				bathrooms: formData.bathrooms,
				isRental: !!formData.isRental,
				taskHistory: formData.maintenanceHistory || [],
				...sharingData,
			};

			if (effectivePropertyType === 'Commercial') {
				newPropertyData.hasSuites = false;
				newPropertyData.suites = [];
			}

			try {
				const result = await createProperty(newPropertyData);

				if ('data' in result) {
					try {
						await applyDashboardVisibilityPreference(
							result.data.id,
							formData.showOnDashboard ?? true,
						);
					} catch (visibilityError) {
						console.error('Failed to update dashboard visibility:', visibilityError);
						feedback.notify(
							'Property was created, but dashboard visibility could not be updated. Please try again.',
						);
					}

					addRecentlyViewed({
						id: result.data.id as any, // Firebase uses string IDs
						title: result.data.title,
						slug: result.data.slug,
					});

					if (
						!propertyToDuplicate &&
						(formData.selectedSuggestedSystemIds || []).length > 0
					) {
						try {
							const suggestedResult =
								await createSuggestedMaintenanceForProperty(
									result.data,
									formData,
								);
							if (
								suggestedResult.createdDeviceCount > 0 ||
								suggestedResult.createdTaskCount > 0
							) {
								const createdDetails = [
									suggestedResult.createdDeviceCount > 0
										? `${suggestedResult.createdDeviceCount} appliances/systems`
										: null,
									suggestedResult.createdTaskCount > 0
										? `${suggestedResult.createdTaskCount} suggested tasks`
										: null,
								].filter(Boolean);

								feedback.notify(
									`Created ${formData.name} with ${createdDetails.join(' and ')}.`,
								);
							}
							if (suggestedResult.failedDeviceCount > 0) {
								feedback.notify(
									'Some appliance records could not be created, but the suggested tasks were still added.',
								);
							}
						} catch (suggestedError) {
							console.error(
								'Failed to create suggested maintenance setup:',
								suggestedError,
							);
							feedback.notify(
								'Property was created, but suggested maintenance could not be fully added.',
							);
						}
					}

					if (propertyToDuplicate) {
						let copiedApplianceCount = 0;
						let copiedTaskCount = 0;
						let deviceIdMap = new Map<string, string>();

						if (copyAppliancesOnDuplicate && duplicateSourceDevices.length > 0) {
							try {
								deviceIdMap = await cloneDuplicateAppliances(result.data);
								copiedApplianceCount = deviceIdMap.size;
							} catch (applianceCopyError) {
								console.error('Failed to copy appliances:', applianceCopyError);
								feedback.notify(
									'Property was duplicated, but appliances could not all be copied.',
								);
							}
						}

						if (copyTasksOnDuplicate && duplicateSourceTasks.length > 0) {
							try {
								copiedTaskCount = await cloneDuplicateTasks(
									result.data,
									deviceIdMap,
								);
							} catch (taskCopyError) {
								console.error('Failed to copy tasks:', taskCopyError);
								feedback.notify(
									'Property was duplicated, but tasks could not all be copied.',
								);
							}
						}

						const copiedDetails = [
							copiedApplianceCount > 0
								? `${copiedApplianceCount} ${
										copiedApplianceCount === 1 ? 'appliance' : 'appliances'
								  }`
								: null,
							copiedTaskCount > 0
								? `${copiedTaskCount} ${
										copiedTaskCount === 1 ? 'task' : 'tasks'
								  }`
								: null,
						].filter(Boolean);

						feedback.notify(
							copiedDetails.length > 0
								? `Duplicated ${formData.name} with ${copiedDetails.join(' and ')}.`
								: `Duplicated ${formData.name}.`,
						);
					}

					// Create notification for property added
					try {
						await createNotification({
							userId: currentUser!.id,
							type: 'property_added',
							title: 'Property Added',
							message: `${formData.name} has been added to your properties`,
							data: {
								propertyId: result.data.id,
								propertyTitle: result.data.title,
								propertyType: effectivePropertyType,
							},
							status: 'unread',
							actionUrl: `/property/${result.data.slug}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notificationError) {
						console.error('Failed to create notification:', notificationError);
						// Don't fail the property creation if notification fails
					}
				} else if ('error' in result) {
					console.error('Failed to create property:', result.error);
					feedback.notify('Failed to create property. Please try again.');
					throw new Error('Failed to create property');
				}
			} catch (error) {
				console.error('Error creating property:', error);
				feedback.notify('An error occurred while creating the property.');
				throw error; // Re-throw to let PropertyDialog know save failed
			}
		}

		// Success - dialog will be closed by PropertyDialog after successful save
	};

	if (singlePropertyRoute) {
		return <Navigate to={singlePropertyRoute} replace />;
	}

	if (visibleProperties.length === 0) {
		const zeroStateTitle = isUserTenant || isTeamMemberAccount
			? 'No Assigned Properties'
			: 'No Properties Yet';
		const zeroStateDescription = isUserTenant || isTeamMemberAccount
			? 'No property assignments were found for your account. Please contact your account owner or manager.'
			: 'Add your first property to get started. You will use this screen to choose between properties once you have more than one.';
		const zeroStateActions = !isUserTenant && !isTeamMemberAccount && canManage
			? [
					{
						label: '+ Add Property',
						onClick: handleAddPropertyGlobalClick,
						variant: 'primary' as const,
					},
			  ]
			: [];

		return (
			<Wrapper>
				<PageHeaderSection>
					<StandardPageTitle>Properties</StandardPageTitle>
					{canManage && (
						<TopActions>
							<AddPropertyButton
								disabled={handleDisabled()}
								onClick={handleAddPropertyGlobalClick}>
								+ Add Property
							</AddPropertyButton>
							{canManageGroups && (
								<HeaderMenuWrap ref={headerMenuRef}>
									<HeaderMenuButton
										onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
										aria-label='Open group options'>
										...
									</HeaderMenuButton>
									{isHeaderMenuOpen && (
										<HeaderDropdownMenu>
											<HeaderDropdownItem onClick={handleHeaderCreateGroup}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faFolderPlus} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Create Group</HeaderDropdownTitle>
												</div>
											</HeaderDropdownItem>
											<HeaderDropdownItem onClick={handleHeaderManageGroups}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faUsers} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Manage Groups</HeaderDropdownTitle>
													<HeaderDropdownHint>Rename, reorder, or delete groups</HeaderDropdownHint>
												</div>
											</HeaderDropdownItem>
											<HeaderDropdownItem onClick={handleCollapseAllGroups}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faMinimize} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Collapse All Groups</HeaderDropdownTitle>
												</div>
											</HeaderDropdownItem>
											<HeaderDropdownItem onClick={handleHeaderGroupSettings}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faGear} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Group Settings</HeaderDropdownTitle>
													<HeaderDropdownHint>Default group for new properties</HeaderDropdownHint>
												</div>
											</HeaderDropdownItem>
										</HeaderDropdownMenu>
									)}
								</HeaderMenuWrap>
							)}
						</TopActions>
					)}
				</PageHeaderSection>
				{!isTeamMemberAccount && !canManageGroups && (
					<LockedFeatureCallout
						title='Property Groups are locked on your current plan'
						description='You can still manage individual properties. Upgrade to Portfolio to create, organize, and manage property groups.'
						upgradeLabel='Upgrade for Groups'
						compact
					/>
				)}
				<ZeroState
					icon={isUserTenant ? '🏠' : '📭'}
					title={zeroStateTitle}
					description={zeroStateDescription}
					actions={zeroStateActions}
				/>
				<PropertyDialog
					isOpen={dialogOpen}
					onClose={handleClosePropertyDialog}
					onSave={handleSaveProperty}
					onDeleteProperty={
						selectedPropertyForEdit ? handleDeletePropertyFromDialog : undefined
					}
					forceSingleFamily={isHomeowner}
					groups={filteredGroups.map((g) => ({ id: g.id, name: g.name }))}
					selectedGroupId={selectedGroupForDialog}
					propertyId={selectedPropertyForEdit?.id}
					onCreateGroup={async (name: string) => {
						const result = await createPropertyGroup({
							name,
							properties: [],
							userId: currentUser!.id,
						});
						if ('data' in result && result.data) {
							return (result.data as any).id as string;
						}
						return '';
					}}
				/>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			<PageHeaderSection>
				<div>
					<StandardPageTitle>Properties</StandardPageTitle>
					<PageSubtitle>Organize and manage all of your properties in one place.</PageSubtitle>
				</div>
				<TopActions>
					<SearchBar
						type='text'
						placeholder='Search properties...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<FilterSortContainer>
						<FilterButton $isActive={filterBy !== 'all'} onClick={() => setFilterBy(filterBy === 'all' ? 'rental' : 'all')}>
							Filters
						</FilterButton>
						<SortButton onClick={() => setSortBy(sortBy === 'name' ? 'updated' : 'name')}>
							Sort
						</SortButton>
					</FilterSortContainer>
					{canManage && (
						<>
							<AddPropertyButton
								disabled={handleDisabled()}
								onClick={handleAddPropertyGlobalClick}>
								+ Add Property
							</AddPropertyButton>
							{canManageGroups && (
								<HeaderMenuWrap ref={headerMenuRef}>
									<HeaderMenuButton
										onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
										aria-label='Open group options'>
										...
									</HeaderMenuButton>
									{isHeaderMenuOpen && (
										<HeaderDropdownMenu>
											<HeaderDropdownItem onClick={handleHeaderCreateGroup}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faFolderPlus} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Create Group</HeaderDropdownTitle>
												</div>
											</HeaderDropdownItem>
											<HeaderDropdownItem onClick={handleHeaderManageGroups}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faUsers} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Manage Groups</HeaderDropdownTitle>
													<HeaderDropdownHint>Rename, reorder, or delete groups</HeaderDropdownHint>
												</div>
											</HeaderDropdownItem>
											<HeaderDropdownItem onClick={handleCollapseAllGroups}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faMinimize} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Collapse All Groups</HeaderDropdownTitle>
												</div>
											</HeaderDropdownItem>
											<HeaderDropdownItem onClick={handleHeaderGroupSettings}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faGear} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Group Settings</HeaderDropdownTitle>
													<HeaderDropdownHint>Default group for new properties</HeaderDropdownHint>
												</div>
											</HeaderDropdownItem>
										</HeaderDropdownMenu>
									)}
								</HeaderMenuWrap>
							)}
						</>
					)}
				</TopActions>
			</PageHeaderSection>
			{!isTeamMemberAccount && !canManageGroups && (
				<LockedFeatureCallout
					title='Property Groups are locked on your current plan'
					description='Browse your properties normally. Upgrade to Portfolio to build grouped property workspaces.'
					upgradeLabel='Upgrade for Groups'
					compact
				/>
			)}
			<SummaryStatsGrid>
				{summaryCards.map((card) => (
					<SummaryCard key={card.label}>
						<SummaryIcon $bg={card.bg} $color={card.color}>
							<FontAwesomeIcon icon={card.icon} />
						</SummaryIcon>
						<div>
							<SummaryValue>{card.value}</SummaryValue>
							<SummaryLabel>{card.label}</SummaryLabel>
							{(card as any).subtitle && <SummarySubtitle>{(card as any).subtitle}</SummarySubtitle>}
						</div>
					</SummaryCard>
				))}
			</SummaryStatsGrid>
			<PropertyDialog
				isOpen={dialogOpen}
				onClose={handleClosePropertyDialog}
				onSave={handleSaveProperty}
				onDeleteProperty={
					selectedPropertyForEdit ? handleDeletePropertyFromDialog : undefined
				}
				forceSingleFamily={isHomeowner}
				groups={filteredGroups.map((g) => ({ id: g.id, name: g.name }))}
				selectedGroupId={selectedGroupForDialog}
				propertyId={selectedPropertyForEdit?.id}
				onCreateGroup={async (name: string) => {
					// currentUser guaranteed to exist
					const result = await createPropertyGroup({
						name,
						properties: [],
						userId: currentUser!.id,
					});
					if ('data' in result && result.data) {
						return (result.data as any).id as string;
					}
					return '';
				}}
				initialData={
					propertyToDuplicate
						? duplicateInitialData
						: selectedPropertyForEdit
						? {
								name: selectedPropertyForEdit.title,
								photo: selectedPropertyForEdit.image,
								owner: selectedPropertyForEdit.owner || '',
								address: selectedPropertyForEdit.address || '',
								propertyType:
									selectedPropertyForEdit.propertyType || 'Single Family',
								units: (selectedPropertyForEdit.units || []).map((u: any) =>
									typeof u === 'string' ? u : u.name,
								),
								hasSuites: selectedPropertyForEdit.hasSuites ?? false,
								suites: (selectedPropertyForEdit.suites || []).map((s: any) =>
									typeof s === 'string' ? s : s.name,
								),
								bedrooms: selectedPropertyForEdit.bedrooms || 0,
								bathrooms: selectedPropertyForEdit.bathrooms || 0,
								notes: selectedPropertyForEdit.notes || '',
								isRental: selectedPropertyForEdit.isRental ?? false,
								maintenanceHistory:
									selectedPropertyForEdit.maintenanceHistory || [],
								coOwners: selectedPropertyForEdit.coOwners || [],
								administrators: selectedPropertyForEdit.administrators || [],
								viewers: selectedPropertyForEdit.viewers || [],
						  }
						: undefined
				}
				isDuplicate={!!propertyToDuplicate}
				duplicateSourceName={propertyToDuplicate?.title}
				duplicateTaskCount={duplicateSourceTasks.length}
				duplicateApplianceCount={duplicateSourceDevices.length}
				copyTasksOnDuplicate={copyTasksOnDuplicate}
				copyAppliancesOnDuplicate={copyAppliancesOnDuplicate}
				onCopyTasksOnDuplicateChange={setCopyTasksOnDuplicate}
				onCopyAppliancesOnDuplicateChange={setCopyAppliancesOnDuplicate}
				isHiddenFromDashboard={
					selectedPropertyForEdit
						? currentUser?.hiddenPropertyIds?.includes(
								selectedPropertyForEdit.id,
						  )
						: false
				}
			/>
			<GroupsContainer>
				{filteredGroups.map((group) => (
					<GroupSection key={group.id}>
						<GroupHeader>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
								<CollapseToggle
									onClick={() => handleToggleCollapse(group.id as any)}
									title={collapsedGroups.has(group.id as any) ? 'Expand group' : 'Collapse group'}>
									<FontAwesomeIcon icon={collapsedGroups.has(group.id as any) ? faChevronDown : faChevronUp} />
								</CollapseToggle>
								{editingGroupId === group.id ? (
									<GroupNameInput
										type='text'
										value={editingGroupName}
										onChange={(e) => setEditingGroupName(e.target.value)}
										onBlur={() => handleToggleEditName(group.id as any)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												handleToggleEditName(group.id as any);
											}
										}}
										autoFocus
									/>
								) : (
									<GroupName>
										{group.name}
										<GroupCountBadge>
											{(group.properties || []).length}
										</GroupCountBadge>
									</GroupName>
								)}
							</div>
							<HeaderRight>
								{canManageGroups && (
									<GroupActions>
										<GroupActionMenu
											title='Group actions'
											onClick={() =>
												setOpenGroupMenuId(
													openGroupMenuId === group.id ? null : (group.id as string),
												)
											}>
											<FontAwesomeIcon icon={faEllipsisVertical} />
										</GroupActionMenu>
										{openGroupMenuId === group.id && (
											<DropdownMenu
												onClick={(e) => e.stopPropagation()}
												style={{ top: '36px', right: '0' }}>
												<DropdownItem
													onClick={() => {
														handleToggleEditName(group.id as any);
														setOpenGroupMenuId(null);
													}}>
													Edit Group
												</DropdownItem>
												<DropdownItem onClick={handleGroupSettings}>
													Group Settings
												</DropdownItem>
												<DropdownItem
													onClick={() => {
														handleDeleteGroup(group.id as any);
														setOpenGroupMenuId(null);
													}}
													style={{ color: '#ef4444' }}>
													Delete Group
												</DropdownItem>
											</DropdownMenu>
										)}
									</GroupActions>
								)}
							</HeaderRight>
						</GroupHeader>
							{!collapsedGroups.has(group.id as any) && (
								<PropertiesGrid
									$isHomeowner={isHomeowner}
									$singleProperty={(group.properties || []).length === 1}>
									{(group.properties || []).map((property: Property) => {
										const address = getPropertyAddress(property);
										const metrics = getPropertyMetrics(property);
										const propertyPillLabel = getPropertyPillLabel(property);
										const propertyImageSrc = getPropertyImageSrc(property.image);
										const isFallbackImage = isPropertyImageFallback(property.image);

										return (
								<PropertyTile
									key={property.id}
									onClick={() => {
										addRecentlyViewed({
											id: property.id,
											title: property.title,
											slug: property.slug,
										});
										const tenantUnitRoute = getTenantUnitRoute(property);
										navigate(tenantUnitRoute || `/property/${property.slug}`);
									}}>
										<PropertyImageWrap>
											<PropertyImage
												$isFallback={isFallbackImage}
												src={propertyImageSrc}
												alt={property.title}
											/>
											<PropertyTopBadge
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													toggleFavorite({
														id: property.id as any,
														title: property.title,
														slug: property.slug,
													});
												}}
												title={isFavorite(property.id as any) ? 'Remove from favorites' : 'Add to favorites'}>
												<FontAwesomeIcon icon={faHouse} />
											</PropertyTopBadge>
											<PropertyTopMenu>
												<DropdownToggle
													onClick={(e) => {
														e.stopPropagation();
														setOpenDropdown(
															openDropdown === `${group.id}-${property.id}`
																? null
																: `${group.id}-${property.id}`,
														);
													}}>
													<FontAwesomeIcon icon={faEllipsis} />
												</DropdownToggle>
											</PropertyTopMenu>
										</PropertyImageWrap>
										<PropertyBody>
											<div>
												<PropertyTitle
													onClick={(e) => {
														e.stopPropagation();
														addRecentlyViewed({
															id: property.id as any,
															title: property.title,
															slug: property.slug,
														});
													}}>
													{address.primary}
												</PropertyTitle>
												<PropertyAddress>
													<FontAwesomeIcon icon={faLocationDot} />
													<span>{address.secondary || property.title}</span>
												</PropertyAddress>
											</div>
											<PropertyLabelBadge>{propertyPillLabel}</PropertyLabelBadge>
										</PropertyBody>
										<PropertyMetaRow>
											{metrics.map((metric) => (
												<PropertyMetaItem key={`${property.id}-${metric.label}`} $color={metric.color}>
													<FontAwesomeIcon icon={metric.icon} />
													<PropertyMetaText>
														<strong>{metric.value}</strong> {metric.label}
													</PropertyMetaText>
												</PropertyMetaItem>
											))}
										</PropertyMetaRow>
										{openDropdown === `${group.id}-${property.id}` &&
											canManage && (
												<DropdownMenu onClick={(e) => e.stopPropagation()}>
													<DropdownItem
														onClick={() =>
															handleEditPropertyClick(group.id as any, property)
														}>
														Edit
													</DropdownItem>
													<DropdownItem
														onClick={() =>
															handleDuplicatePropertyClick(group.id as any, property)
														}>
														Duplicate
													</DropdownItem>
													{canDeleteProperty(currentUser!.id, property) && (
														<DropdownItem
															onClick={() =>
																handleDeleteProperty(property.id as any)
															}
															style={{ color: '#ef4444' }}>
															Delete
														</DropdownItem>
													)}
												</DropdownMenu>
											)}
								</PropertyTile>
										);
									})}
									{canManage && (
										<AddPropertyTile
											type='button'
											onClick={() => handleAddPropertyToGroup(group.id as any)}>
											<AddPropertyTileIcon>+</AddPropertyTileIcon>
											<AddPropertyTileTitle>Add Property</AddPropertyTileTitle>
											<AddPropertyTileHint>
												Add another property to this group
											</AddPropertyTileHint>
										</AddPropertyTile>
									)}
								</PropertiesGrid>
							)}
					</GroupSection>
				))}
			</GroupsContainer>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				itemName={propertyToDelete?.name || ''}
				itemType='property'
				onConfirm={handleConfirmDeleteProperty}
				onCancel={() => {
					setDeleteModalOpen(false);
					setPropertyToDelete(null);
				}}
				isLoading={isDeletingProperty}
			/>
		</Wrapper>
	);
};
