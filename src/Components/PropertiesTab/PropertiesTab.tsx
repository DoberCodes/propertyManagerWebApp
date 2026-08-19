import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
	PropertyDialog,
	PropertyFormData,
	PropertySaveProgress,
} from './PropertyDialog';
import {
	getPropertyImageSrc,
	isPropertyImageFallback,
} from '../../utils/propertyImagePlaceholder';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../Library/AppPageLayout/AppPageLayout.styles';
import { DeleteConfirmationModal } from '../Library/Modal/DeleteConfirmationModal';
import { AppZeroState } from '../Library/AppZeroState';
import { LoadingState } from '../LoadingState';
import {
	FloatingFilterPanel,
	GenericModal,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
	SecondaryButton,
	DangerButton,
} from '../Library';
import { useRecentlyViewed } from '../../Hooks/useRecentlyViewed';
import { useFavorites } from '../../Hooks/useFavorites';
import { RootState } from '../../Redux/store/store';
import {
	setCurrentUser,
	updateEntitlementProjection,
} from '../../Redux/Slices/userSlice';
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
	useGetPropertyGroupsQuery,
} from '../../Redux/API/propertySlice';
import { useCreateTaskMutation, useGetTasksQuery } from '../../Redux/API/taskSlice';
import {
	useCreateDeviceMutation,
	useGetAllDevicesQuery,
} from '../../Redux/API/deviceSlice';
import {
	useCreatePropertySpaceMutation,
	useLazyGetPropertySpacesQuery,
} from '../../Redux/API/spaceSlice';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { useCreateNotificationMutation } from '../../Redux/API/notificationSlice';
import {
	canAddProperty,
	canPropertyGroups,
	canUseBusinessPropertyTypes,
	canUseRentalManagement,
	getEffectiveAccessPlanId,
	getMaxPropertiesForPlan,
	getRemainingPropertySlots,
	getSubscriptionPlanDetails,
	isIntentionalFreeAccountSubscription,
	isTrialExpired,
} from '../../utils/subscriptionUtils';
import {
	WORKFLOW_SUPPORT_CODES,
	withWorkflowSupportCode,
} from '../../utils/workflowSupportCodes';
import {
	getDefaultPropertyClassification,
	isMultiUnitProperty,
	isResidentialProperty,
	normalizePropertyType,
	PropertyType,
} from '../../utils/propertyTaxonomy';
import { LockedFeatureCallout } from '../Library/LockedFeatureCallout';
import {
	filterPropertyGroupsByRole,
	getTenantAssignmentForProperty,
	isTeamMemberScopedAccount,
} from '../../utils/dataFilters';
import { canDeleteProperty, getRoleCapabilities } from '../../utils/permissions';
import { TeamMember } from '../../Redux/Slices/teamSlice';
import { USER_ROLES } from '../../constants/roles';
import { COLORS } from '../../constants/colors';
import { finalizeFirstPropertyTrial } from '../../services/entitlementGrantService';
import { isHomeownerPlusTrialEnabled } from '../../entitlements/planAvailability';
import { getEmbeddedPropertyDocuments } from '../../propertyKnowledge/propertyMemoryRecordService';
import {
	buildPropertyProfileSpaceTemplates,
	ensureGeneratedPropertySpaces,
} from '../../propertyKnowledge/propertySpaceGeneration';
import {
	Wrapper,
	TopActions,
	DesktopPropertyFilters,
	CompactResultCount,
	PropertyFilterFields,
	PropertyFilterField,
	PropertyFilterSelect,
	SummaryStatsGrid,
	SummaryCard,
	SummaryIcon,
	SummaryValue,
	SummaryLabel,
	GroupsContainer,
	GroupSection,
	GroupHeader,
	GroupName,
	GroupTitleBlock,
	GroupDescription,
	GroupIconBadge,
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
	SearchBar,
	FilterSortContainer,
	FilterButton,
	DesktopFilterPanel,
	DesktopFilterPanelHeader,
	DesktopFilterPanelTitle,
	DesktopFilterPanelActions,
	DesktopFilterClearButton,
	DesktopFilterApplyButton,
	DesktopFilterDismissButton,
	DesktopFilterPanelGrid,
	CollapseToggle,
	SummarySubtitle,
	HeaderMenuWrap,
	HeaderDropdownMenu,
	HeaderDropdownItem,
	HeaderDropdownIcon,
	HeaderDropdownTitle,
	HeaderDropdownHint,
	ManageGroupsStack,
	ManageGroupsToolbar,
	ManageGroupList,
	ManageGroupRow,
	ManageGroupDragHandle,
	ManageGroupPreview,
	ManageGroupRowActions,
	ManageGroupMenuWrap,
	ManageGroupMenuButton,
	ManageGroupMenu,
	ManageGroupMenuItem,
	ManageGroupPanel,
	ManageGroupPanelHeader,
	ManageGroupAppearancePreview,
	PropertyTransferList,
	PropertyTransferRow,
	PropertyTransferName,
	PropertyTransferToolbar,
	PropertyTransferSelectionBar,
	SelectedTransferActions,
	BulkTransferActions,
} from './PropertiesTab.styles';
import { Property, PropertyGroupIconKey } from '../../types/Property.types';
import { useAppFeedback } from '../Library/AppFeedback/AppFeedbackProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faHouse,
	faBuilding,
	faCity,
	faWarehouse,
	faStore,
	faHotel,
	faIndustry,
	faWrench,
	faCalendarDays,
	faFileLines,
	faChevronUp,
	faChevronDown,
	faEllipsis,
	faEllipsisVertical,
	faUsers,
	faMinimize,
	faLocationDot,
	faMicrochip,
	faClock,
	faGripVertical,
} from '@fortawesome/free-solid-svg-icons';

const ACTIVE_TASK_STATUSES = new Set([
	'Initiated',
	'Pending',
	'In Progress',
	'Awaiting Approval',
	'Overdue',
	'Hold',
]);

const GROUP_ICON_OPTIONS: Array<{ key: PropertyGroupIconKey; label: string; icon: any }> = [
	{ key: 'house', label: 'House', icon: faHouse },
	{ key: 'building', label: 'Building', icon: faBuilding },
	{ key: 'city', label: 'City', icon: faCity },
	{ key: 'warehouse', label: 'Warehouse', icon: faWarehouse },
	{ key: 'store', label: 'Store', icon: faStore },
	{ key: 'hotel', label: 'Hotel', icon: faHotel },
	{ key: 'industry', label: 'Industry', icon: faIndustry },
];

const GROUP_COLOR_PRESETS: Array<{ label: string; iconColor: string; iconBgColor: string }> = [
	{ label: 'Ocean', iconColor: '#ffffff', iconBgColor: '#2563eb' },
	{ label: 'Maintley', iconColor: COLORS.white, iconBgColor: COLORS.primary },
	{ label: 'Sunset', iconColor: '#ffffff', iconBgColor: '#ea580c' },
	{ label: 'Rose', iconColor: '#ffffff', iconBgColor: '#e11d48' },
	{ label: 'Slate', iconColor: '#ffffff', iconBgColor: '#475569' },
	{ label: 'Gold', iconColor: '#111827', iconBgColor: '#facc15' },
	{ label: 'Lavender', iconColor: '#312e81', iconBgColor: '#c4b5fd' },
	{ label: 'Mint', iconColor: '#064e3b', iconBgColor: '#a7f3d0' },
];

const GROUP_DEFAULT_ICON_KEY: PropertyGroupIconKey = 'house';
const GROUP_DEFAULT_ICON_COLOR = '#ffffff';
const GROUP_DEFAULT_ICON_BG_COLOR = '#2563eb';

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

const normalizeHexColor = (value: string, fallback: string): string => {
	const normalized = String(value || '').trim();
	if (!HEX_COLOR_PATTERN.test(normalized)) {
		return fallback;
	}
	return normalized.toLowerCase();
};

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
	const location = useLocation();
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

	// Render from the query lifecycle directly so an unresolved request cannot
	// be mistaken for an account with no properties.
	const {
		data: propertyGroups = [],
		isLoading: arePropertyGroupsLoading,
		isFetching: arePropertyGroupsFetching,
		isSuccess: arePropertyGroupsLoaded,
		isError: didPropertyGroupsFail,
		refetch: refetchPropertyGroups,
	} = useGetPropertyGroupsQuery();

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
	const [createPropertySpace] = useCreatePropertySpaceMutation();
	const [getPropertySpaces] = useLazyGetPropertySpacesQuery();
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
	const effectivePlanId = getEffectiveAccessPlanId(
		currentUser?.subscription,
	);
	const showPropertyGroupUpsell =
		!isTeamMemberAccount &&
		!canManageGroups &&
		getMaxPropertiesForPlan(effectivePlanId) > 1;

	const propertyLanguage = useMemo(
		() => ({
			pageTitle: isHomeowner ? 'Homes' : 'Property Records',
			pageSubtitle: isHomeowner
				? 'Keep your home record organized with maintenance, equipment, documents, people, and history.'
				: 'Keep each property record organized with maintenance, equipment, documents, people, and history.',
			addLabel: isHomeowner ? 'Add Home' : 'Add Property Record',
			searchPlaceholder: isHomeowner ? 'Search homes...' : 'Search property records...',
			filterTitle: isHomeowner ? 'Search and filter homes' : 'Search and filter property records',
			filterDescription: isHomeowner
				? 'Choose which home records you want to see, then apply your changes.'
				: 'Choose which property records you want to see, then apply your changes.',
			recordSingular: isHomeowner ? 'home' : 'property record',
			recordPlural: isHomeowner ? 'homes' : 'property records',
			totalSingularLabel: isHomeowner ? 'Home Record' : 'Property Record',
			totalPluralLabel: isHomeowner ? 'Home Records' : 'Property Records',
			documentSubtitle: isHomeowner ? 'Across your home record' : 'Across property records',
		}),
		[isHomeowner],
	);

	const getDisplayGroupName = useCallback((name?: string) => {
		const rawName = String(name || '').trim();
		const normalized = rawName.toLowerCase();

		if (normalized === 'main residence') return 'Primary Home';
		if (normalized === 'shared properties') return 'Shared With Me';

		return rawName || 'Property Records';
	}, []);

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
		const systemDefaultGroupNames = new Set(['my properties', 'shared properties']);
		const groups = filterPropertyGroupsByRole(
			groupsWithProperties as any[],
			currentUser,
			teamMembers?.filter((m): m is TeamMember => m !== undefined),
		).filter((group) => {
			const normalizedName = String(group.name || '').trim().toLowerCase();
			return !(
				systemDefaultGroupNames.has(normalizedName) &&
				(group.properties || []).length === 0
			);
		});

		return groups.sort((a, b) => {
			const aName = a.name?.toLowerCase() || '';
			const bName = b.name?.toLowerCase() || '';
			const aOrder = Number.isFinite(a.sortOrder)
				? Number(a.sortOrder)
				: Number.MAX_SAFE_INTEGER;
			const bOrder = Number.isFinite(b.sortOrder)
				? Number(b.sortOrder)
				: Number.MAX_SAFE_INTEGER;
			if (aOrder !== bOrder) return aOrder - bOrder;

			return aName.localeCompare(bName);
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
			const propertyDocuments = getEmbeddedPropertyDocuments(property).length;
			const propertyPhotoDocument = property.image ? 1 : 0;
			return (
				count +
				taskDocuments +
				deviceDocuments +
				propertyDocuments +
				propertyPhotoDocument
			);
		}, 0);

		return [
			{
				value: uniqueProperties.length,
				label:
					uniqueProperties.length === 1
						? propertyLanguage.totalSingularLabel
						: propertyLanguage.totalPluralLabel,
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
				subtitle: propertyLanguage.documentSubtitle,
				icon: faFileLines,
				bg: '#f5f3ff',
				color: '#7c3aed',
			},
		];
	}, [filteredGroups, propertyAggregates, propertyLanguage]);

	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [showOnboardingSetupTip, setShowOnboardingSetupTip] = useState(false);
	const [selectedGroupForDialog, setSelectedGroupForDialog] = useState<
		string | null
	>(null);
	const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<
		any | null
	>(null);
	const [propertyToDuplicate, setPropertyToDuplicate] = useState<any | null>(null);
	const selectedPropertyAccountId = String(
		selectedPropertyForEdit?.accountId ||
			selectedPropertyForEdit?.userId ||
			currentUser?.accountId ||
			currentUser?.id ||
			'',
	).trim();
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
	const [filterPropertyType, setFilterPropertyType] = useState<'all' | PropertyType>('all');
	const [filterMinBedrooms, setFilterMinBedrooms] = useState<number>(0);
	const [filterLocation, setFilterLocation] = useState<string>('');
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
	const [draftSearchQuery, setDraftSearchQuery] = useState('');
	const [draftSortBy, setDraftSortBy] =
		useState<'name' | 'recent' | 'updated'>('name');
	const [draftFilterBy, setDraftFilterBy] =
		useState<'all' | 'rental' | 'residential'>('all');
	const [draftPropertyType, setDraftPropertyType] =
		useState<'all' | PropertyType>('all');
	const [draftMinBedrooms, setDraftMinBedrooms] = useState<number>(0);
	const [draftLocation, setDraftLocation] = useState<string>('');
	const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
	const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
	const [isManageGroupsDialogOpen, setIsManageGroupsDialogOpen] =
		useState(false);
	const [manageGroupNames, setManageGroupNames] = useState<Record<string, string>>({});
	const [manageGroupDescriptions, setManageGroupDescriptions] = useState<
		Record<string, string>
	>({});
	const [manageGroupDefaultCollapsed, setManageGroupDefaultCollapsed] = useState<
		Record<string, boolean>
	>({});
	const [manageGroupOrder, setManageGroupOrder] = useState<string[]>([]);
	const [manageDialogGroups, setManageDialogGroups] = useState<any[]>([]);
	const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});
	const [selectedTransferPropertyIds, setSelectedTransferPropertyIds] = useState<
		string[]
	>([]);
	const [selectedTransferTargetId, setSelectedTransferTargetId] = useState('');
	const [transferPropertySearch, setTransferPropertySearch] = useState('');
	const [isSavingManageGroups, setIsSavingManageGroups] = useState(false);
	const [manageGroupsView, setManageGroupsView] =
		useState<'reorder' | 'create' | 'details' | 'transfer'>(
			'reorder',
		);
	const [activeManageGroupId, setActiveManageGroupId] = useState<string | null>(null);
	const [openManageGroupMenuId, setOpenManageGroupMenuId] = useState<string | null>(
		null,
	);
	const [draggingManageGroupId, setDraggingManageGroupId] = useState<string | null>(null);
	const [manageNewGroupName, setManageNewGroupName] = useState('');
	const [manageNewGroupDescription, setManageNewGroupDescription] = useState('');
	const [manageNewGroupDefaultCollapsed, setManageNewGroupDefaultCollapsed] =
		useState(false);
	const [manageNewGroupAppearance, setManageNewGroupAppearance] = useState({
		iconKey: GROUP_DEFAULT_ICON_KEY as PropertyGroupIconKey,
		iconColor: GROUP_DEFAULT_ICON_COLOR,
		iconBgColor: GROUP_DEFAULT_ICON_BG_COLOR,
	});
	const [isCreatingManageGroup, setIsCreatingManageGroup] = useState(false);
	const [manageGroupAppearanceDrafts, setManageGroupAppearanceDrafts] = useState<
		Record<
			string,
			{ iconKey: PropertyGroupIconKey; iconColor: string; iconBgColor: string }
		>
	>({});
	const headerMenuRef = useRef<HTMLDivElement | null>(null);
	const initializedCollapsedGroupsRef = useRef<Set<string>>(new Set());

	const getGroupIconByKey = useCallback((iconKey?: string) => {
		const match = GROUP_ICON_OPTIONS.find((option) => option.key === iconKey);
		return match?.icon || faHouse;
	}, []);

	const getGroupAppearanceFromGroup = useCallback((group: any) => {
		const iconKey =
			GROUP_ICON_OPTIONS.some((option) => option.key === group?.groupIconKey)
				? (group.groupIconKey as PropertyGroupIconKey)
				: GROUP_DEFAULT_ICON_KEY;
		const iconColor = normalizeHexColor(group?.groupIconColor, GROUP_DEFAULT_ICON_COLOR);
		const iconBgColor = normalizeHexColor(
			group?.groupIconBgColor,
			GROUP_DEFAULT_ICON_BG_COLOR,
		);

		return { iconKey, iconColor, iconBgColor };
	}, []);

	const getGroupAppearanceDraft = useCallback(
		(group: any) => {
			const groupId = String(group.id);
			const draft = manageGroupAppearanceDrafts[groupId];
			if (draft) {
				return {
					iconKey: draft.iconKey,
					iconColor: normalizeHexColor(draft.iconColor, GROUP_DEFAULT_ICON_COLOR),
					iconBgColor: normalizeHexColor(
						draft.iconBgColor,
						GROUP_DEFAULT_ICON_BG_COLOR,
					),
				};
			}

			return getGroupAppearanceFromGroup(group);
		},
		[getGroupAppearanceFromGroup, manageGroupAppearanceDrafts],
	);

	const orderedManageGroups = useMemo(() => {
		const groupsById = new Map(
			manageDialogGroups.map((group) => [String(group.id), group]),
		);
		const orderedFromState = manageGroupOrder
			.map((groupId) => groupsById.get(groupId))
			.filter(Boolean) as typeof manageDialogGroups;
		const unsortedGroups = manageDialogGroups.filter(
			(group) => !manageGroupOrder.includes(String(group.id)),
		);

		return [...orderedFromState, ...unsortedGroups];
	}, [manageDialogGroups, manageGroupOrder]);

	const displayedGroups = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		const getTimestamp = (value?: string) => {
			const timestamp = value ? new Date(value).getTime() : 0;
			return Number.isNaN(timestamp) ? 0 : timestamp;
		};

		return filteredGroups
			.map((group) => {
				const properties = [...(group.properties || [])]
					.filter((property: Property) => {
						if (filterBy === 'rental' && !property.isRental) return false;
						if (filterBy === 'residential' && property.isRental) return false;
						if (filterPropertyType !== 'all' && normalizePropertyType(property.propertyType) !== filterPropertyType) return false;
						if (filterMinBedrooms > 0 && (property.bedrooms ?? 0) < filterMinBedrooms) return false;
						const locationQuery = filterLocation.trim().toLowerCase();
						if (locationQuery) {
							const addressText = JSON.stringify(property.address || '').toLowerCase();
							if (!addressText.includes(locationQuery)) return false;
						}
						if (!query) return true;
						return [
							property.title,
							JSON.stringify(property.address || ''),
							property.owner,
							property.propertyType,
						]
							.filter(Boolean)
							.join(' ')
							.toLowerCase()
							.includes(query);
					})
					.sort((left: Property, right: Property) => {
						if (sortBy === 'recent') {
							return (
								getTimestamp(right.createdAt) - getTimestamp(left.createdAt)
							);
						}
						if (sortBy === 'updated') {
							return (
								getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt)
							);
						}
						return String(left.title || '').localeCompare(
							String(right.title || ''),
						);
					});

				return { ...group, properties };
			})
			.filter((group) => {
				if ((group.properties || []).length > 0) {
					return true;
				}

				if (!canManageGroups) {
					return false;
				}

				if (!query && filterBy === 'all') {
					return true;
				}

				return String(group.name || '').toLowerCase().includes(query);
			});
	}, [filteredGroups, filterBy, filterPropertyType, filterMinBedrooms, filterLocation, searchQuery, sortBy, canManageGroups]);

	const displayedPropertyCount = useMemo(
		() =>
			displayedGroups.reduce(
				(total, group) => total + (group.properties || []).length,
				0,
			),
		[displayedGroups],
	);

	const openFilterPanel = () => {
		setDraftSearchQuery(searchQuery);
		setDraftSortBy(sortBy);
		setDraftFilterBy(filterBy);
		setDraftPropertyType(filterPropertyType);
		setDraftMinBedrooms(filterMinBedrooms);
		setDraftLocation(filterLocation);
		setIsFilterPanelOpen(true);
	};

	const dismissFilterPanel = () => {
		setDraftSearchQuery(searchQuery);
		setDraftSortBy(sortBy);
		setDraftFilterBy(filterBy);
		setDraftPropertyType(filterPropertyType);
		setDraftMinBedrooms(filterMinBedrooms);
		setDraftLocation(filterLocation);
		setIsFilterPanelOpen(false);
	};

	const clearDraftFilters = () => {
		setDraftSearchQuery('');
		setDraftSortBy('name');
		setDraftFilterBy('all');
		setDraftPropertyType('all');
		setDraftMinBedrooms(0);
		setDraftLocation('');
	};

	const applyDraftFilters = () => {
		setSearchQuery(draftSearchQuery);
		setSortBy(draftSortBy);
		setFilterBy(draftFilterBy);
		setFilterPropertyType(draftPropertyType);
		setFilterMinBedrooms(draftMinBedrooms);
		setFilterLocation(draftLocation);
		setIsFilterPanelOpen(false);
	};

	const clearPropertyFilters = () => {
		setSearchQuery('');
		setSortBy('name');
		setFilterBy('all');
		setFilterPropertyType('all');
		setFilterMinBedrooms(0);
		setFilterLocation('');
	};

	const activeFilterCount =
		(searchQuery.trim() ? 1 : 0) +
		(filterBy !== 'all' ? 1 : 0) +
		(sortBy !== 'name' ? 1 : 0) +
		(filterPropertyType !== 'all' ? 1 : 0) +
		(filterMinBedrooms > 0 ? 1 : 0) +
		(filterLocation.trim() ? 1 : 0);

	useEffect(() => {
		const defaultCollapsedGroupIds = filteredGroups
			.filter(
				(group) =>
					group.defaultCollapsed &&
					!initializedCollapsedGroupsRef.current.has(String(group.id)),
			)
			.map((group) => String(group.id));

		if (defaultCollapsedGroupIds.length === 0) return;

		defaultCollapsedGroupIds.forEach((groupId) =>
			initializedCollapsedGroupsRef.current.add(groupId),
		);
		setCollapsedGroups((previous) => {
			const next = new Set(previous);
			defaultCollapsedGroupIds.forEach((groupId) => next.add(groupId));
			return next;
		});
	}, [filteredGroups]);

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
			propertyType: normalizePropertyType(propertyToDuplicate.propertyType),
			propertyClassification:
				propertyToDuplicate.propertyClassification ||
				getDefaultPropertyClassification(propertyToDuplicate.propertyType),
			bedrooms: propertyToDuplicate.bedrooms ?? 0,
			bathrooms: propertyToDuplicate.bathrooms ?? 0,
			notes: propertyToDuplicate.notes || '',
			isRental: propertyToDuplicate.isRental ?? false,
			groupId:
				selectedGroupForDialog ||
				propertyToDuplicate.groupId ||
				null,
			coOwners: [],
			administrators: [],
			viewers: [],
		};
	}, [propertyToDuplicate, selectedGroupForDialog]);

	const handleAddGroup = async (
		rawName = 'New Group',
		settings?: {
			description?: string;
			defaultCollapsed?: boolean;
			groupIconKey?: PropertyGroupIconKey;
			groupIconColor?: string;
			groupIconBgColor?: string;
		},
	) => {
		if (!currentUser) {
			feedback.notify('You must be signed in to create a group.');
			console.error('No user logged in');
			return;
		}

		const nextName = String(rawName || '').trim();
		if (!nextName) {
			feedback.notify('Enter a group name.');
			return;
		}

		try {
			const result = await createPropertyGroup({
				userId: currentUser.id,
				name: nextName,
				description: String(settings?.description || '').trim(),
				defaultCollapsed: Boolean(settings?.defaultCollapsed),
				groupIconKey: settings?.groupIconKey || GROUP_DEFAULT_ICON_KEY,
				groupIconColor:
					settings?.groupIconColor || GROUP_DEFAULT_ICON_COLOR,
				groupIconBgColor:
					settings?.groupIconBgColor || GROUP_DEFAULT_ICON_BG_COLOR,
				sortOrder: propertyGroups.length,
				properties: [],
			}).unwrap();

			// Create notification for property group creation
			try {
				await createNotification({
					userId: currentUser.id,
					type: 'property_group_created',
					title: 'Property Group Created',
					message: `New property group "${nextName}" has been created`,
					data: {
						groupId: result.id,
						groupName: nextName,
					},
					status: 'unread',
					actionUrl: `/properties`,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			} catch (notifError) {
				console.error('Notification failed:', notifError);
			}

			feedback.notify(`Group "${nextName}" created.`);
			return result;
		} catch (error) {
			console.error('Failed to create property group:', error);
			const errorMessage =
				typeof error === 'string'
					? error
					: ((error as any)?.data as string) ||
					(error as any)?.message ||
					'Failed to create property group.';
			feedback.notify(errorMessage);
			return null;
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
					getEffectiveAccessPlanId(currentUser.subscription),
				);
				const maxProperties = planDetails?.maxProperties || 1;

				feedback.notify(
					`Your ${planDetails?.name || 'current'
					} plan allows up to ${maxProperties} properties. ` +
					`You currently have ${totalProperties} properties. ` +
					`Please upgrade your plan to add more properties.`,
				);
				navigate('/paywall');
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

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const shouldOpenCreateDialog =
			params.get('openCreate') === '1' ||
			params.get('openCreate') === 'onboarding' ||
			params.get('action') === 'create';
		if (!shouldOpenCreateDialog) {
			return;
		}

		if (!canManage) {
			return;
		}

		setSelectedGroupForDialog(null);
		setSelectedPropertyForEdit(null);
		setPropertyToDuplicate(null);
		setCopyTasksOnDuplicate(false);
		setCopyAppliancesOnDuplicate(true);
		setShowOnboardingSetupTip(params.get('openCreate') === 'onboarding');
		setDialogOpen(true);

		params.delete('openCreate');
		params.delete('action');
		navigate(
			{
				pathname: location.pathname,
				search: params.toString() ? `?${params.toString()}` : '',
			},
			{ replace: true },
		);
	}, [location.pathname, location.search, navigate, canManage]);

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
		if (
			(!isResidentialProperty(property.propertyType) &&
				!canUseBusinessPropertyTypes(currentUser.subscription)) ||
			(property.isRental && !canUseRentalManagement(currentUser.subscription))
		) {
			feedback.notify(
				'This property remains available to review and edit, but your current plan cannot create another property with its business settings.',
			);
			setOpenDropdown(null);
			return;
		}

		const canAdd = canAddProperty(
			currentUser.subscription,
			totalProperties,
			currentUser.role,
		);
		if (!canAdd) {
			const planDetails = getSubscriptionPlanDetails(
				getEffectiveAccessPlanId(currentUser.subscription),
			);
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
		setShowOnboardingSetupTip(false);
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

	const handleExpandAllGroups = () => {
		setCollapsedGroups(new Set());
		setIsHeaderMenuOpen(false);
	};

	const openManageGroupsDialog = useCallback(
		(options?: {
			view?: 'reorder' | 'create' | 'details' | 'transfer';
			activeGroupId?: string | null;
		}) => {
			setIsHeaderMenuOpen(false);
			setManageGroupNames(
				Object.fromEntries(
					filteredGroups.map((group) => [String(group.id), group.name || '']),
				),
			);
			setManageGroupDescriptions(
				Object.fromEntries(
					filteredGroups.map((group) => [
						String(group.id),
						String(group.description || ''),
					]),
				),
			);
			setManageGroupDefaultCollapsed(
				Object.fromEntries(
					filteredGroups.map((group) => [
						String(group.id),
						Boolean(group.defaultCollapsed),
					]),
				),
			);
			setManageGroupOrder(filteredGroups.map((group) => String(group.id)));
			setManageDialogGroups(filteredGroups.map((group) => ({ ...group })));
			setManageGroupAppearanceDrafts(
				Object.fromEntries(
					filteredGroups.map((group) => {
						const groupId = String(group.id);
						const appearance = getGroupAppearanceFromGroup(group);
						return [groupId, appearance];
					}),
				),
			);
			setTransferTargets({});
			setSelectedTransferPropertyIds([]);
			setSelectedTransferTargetId('');
			setTransferPropertySearch('');
			setOpenManageGroupMenuId(null);
			setManageGroupsView(options?.view || 'reorder');
			setManageNewGroupName('');
			setManageNewGroupDescription('');
			setManageNewGroupDefaultCollapsed(false);
			setManageNewGroupAppearance({
				iconKey: GROUP_DEFAULT_ICON_KEY,
				iconColor: GROUP_DEFAULT_ICON_COLOR,
				iconBgColor: GROUP_DEFAULT_ICON_BG_COLOR,
			});

			const preferredGroupId = String(options?.activeGroupId || '').trim();
			const hasPreferred = preferredGroupId
				? filteredGroups.some((group) => String(group.id) === preferredGroupId)
				: false;
			setActiveManageGroupId(
				hasPreferred
					? preferredGroupId
					: filteredGroups[0]
						? String(filteredGroups[0].id)
						: null,
			);
			setIsManageGroupsDialogOpen(true);
		},
		[filteredGroups, getGroupAppearanceFromGroup],
	);

	const handleHeaderManageGroups = () => {
		openManageGroupsDialog();
	};

	const handleHeaderCreateGroup = () => {
		openManageGroupsDialog({ view: 'create' });
	};

	const handleCreateGroupFromManageDialog = async () => {
		const nextName = manageNewGroupName.trim();
		if (!nextName) {
			feedback.notify('Enter a group name.');
			return;
		}

		const duplicateName = orderedManageGroups.some(
			(group) => String(group.name || '').trim().toLowerCase() === nextName.toLowerCase(),
		);
		if (duplicateName) {
			feedback.notify('A group with this name already exists.');
			return;
		}

		setIsCreatingManageGroup(true);
		try {
			const createdGroup = await handleAddGroup(nextName, {
				description: manageNewGroupDescription,
				defaultCollapsed: manageNewGroupDefaultCollapsed,
				groupIconKey: manageNewGroupAppearance.iconKey,
				groupIconColor: manageNewGroupAppearance.iconColor,
				groupIconBgColor: manageNewGroupAppearance.iconBgColor,
			});
			if (!createdGroup?.id) {
				return;
			}

			const createdGroupId = String(createdGroup.id);
			setManageGroupNames((previous) => ({
				...previous,
				[createdGroupId]: nextName,
			}));
			setManageGroupDescriptions((previous) => ({
				...previous,
				[createdGroupId]: manageNewGroupDescription.trim(),
			}));
			setManageGroupDefaultCollapsed((previous) => ({
				...previous,
				[createdGroupId]: manageNewGroupDefaultCollapsed,
			}));
			setManageGroupOrder((previousOrder) => {
				if (previousOrder.includes(createdGroupId)) {
					return previousOrder;
				}
				return [...previousOrder, createdGroupId];
			});
			setManageDialogGroups((previousGroups) => [
				...previousGroups,
				{ ...createdGroup, properties: createdGroup.properties || [] },
			]);
			setManageGroupAppearanceDrafts((previousDrafts) => ({
				...previousDrafts,
				[createdGroupId]: {
					...manageNewGroupAppearance,
				},
			}));
			setManageGroupsView('reorder');
			setActiveManageGroupId(createdGroupId);
			setManageNewGroupName('');
			setManageNewGroupDescription('');
			setManageNewGroupDefaultCollapsed(false);
			setManageNewGroupAppearance({
				iconKey: GROUP_DEFAULT_ICON_KEY,
				iconColor: GROUP_DEFAULT_ICON_COLOR,
				iconBgColor: GROUP_DEFAULT_ICON_BG_COLOR,
			});
		} finally {
			setIsCreatingManageGroup(false);
		}
	};

	const handleMoveManageGroup = (groupId: string, direction: -1 | 1) => {
		setManageGroupOrder((previousOrder) => {
			const index = previousOrder.indexOf(groupId);
			if (index === -1) return previousOrder;
			const nextIndex = index + direction;
			if (nextIndex < 0 || nextIndex >= previousOrder.length) return previousOrder;

			const reordered = [...previousOrder];
			const [moved] = reordered.splice(index, 1);
			reordered.splice(nextIndex, 0, moved);
			return reordered;
		});
	};

	const handleDragStartManageGroup = (groupId: string) => {
		setDraggingManageGroupId(groupId);
	};

	const handleDropManageGroup = (targetGroupId: string) => {
		if (!draggingManageGroupId || draggingManageGroupId === targetGroupId) {
			setDraggingManageGroupId(null);
			return;
		}

		setManageGroupOrder((previousOrder) => {
			const sourceIndex = previousOrder.indexOf(draggingManageGroupId);
			const targetIndex = previousOrder.indexOf(targetGroupId);
			if (sourceIndex === -1 || targetIndex === -1) {
				return previousOrder;
			}

			const reordered = [...previousOrder];
			const [moved] = reordered.splice(sourceIndex, 1);
			reordered.splice(targetIndex, 0, moved);
			return reordered;
		});
		setDraggingManageGroupId(null);
	};

	useEffect(() => {
		if (!orderedManageGroups.length) {
			setActiveManageGroupId(null);
			return;
		}

		if (
			activeManageGroupId &&
			orderedManageGroups.some(
				(group) => String(group.id) === String(activeManageGroupId),
			)
		) {
			return;
		}

		setActiveManageGroupId(String(orderedManageGroups[0].id));
	}, [activeManageGroupId, orderedManageGroups]);

	const handleSaveManageGroups = async () => {
		setIsSavingManageGroups(true);
		try {
			for (let index = 0; index < orderedManageGroups.length; index += 1) {
				const group = orderedManageGroups[index];
				const groupId = String(group.id);
				const nextName = String(manageGroupNames[groupId] || '').trim();
				const nextDescription = String(
					manageGroupDescriptions[groupId] || '',
				).trim();
				const nextDefaultCollapsed = Boolean(
					manageGroupDefaultCollapsed[groupId],
				);
				const appearanceDraft = getGroupAppearanceDraft(group);
				const nextIconKey = appearanceDraft.iconKey;
				const nextIconColor = appearanceDraft.iconColor;
				const nextIconBgColor = appearanceDraft.iconBgColor;
				const currentAppearance = getGroupAppearanceFromGroup(group);
				const nextSortOrder = index;
				const hasNameChange = nextName.length > 0 && nextName !== group.name;
				const hasDescriptionChange =
					nextDescription !== String(group.description || '').trim();
				const hasDefaultCollapsedChange =
					nextDefaultCollapsed !== Boolean(group.defaultCollapsed);
				const hasSortOrderChange = Number(group.sortOrder ?? -1) !== nextSortOrder;
				const hasAppearanceChange =
					nextIconKey !== currentAppearance.iconKey ||
					nextIconColor !== currentAppearance.iconColor ||
					nextIconBgColor !== currentAppearance.iconBgColor;

				if (
					!hasNameChange &&
					!hasDescriptionChange &&
					!hasDefaultCollapsedChange &&
					!hasSortOrderChange &&
					!hasAppearanceChange
				)
					continue;

				const updates: {
					name?: string;
					description?: string;
					sortOrder?: number;
					defaultCollapsed?: boolean;
					groupIconKey?: PropertyGroupIconKey;
					groupIconColor?: string;
					groupIconBgColor?: string;
				} = {
					sortOrder: nextSortOrder,
					description: nextDescription,
					defaultCollapsed: nextDefaultCollapsed,
					groupIconKey: nextIconKey,
					groupIconColor: nextIconColor,
					groupIconBgColor: nextIconBgColor,
				};
				if (hasNameChange) {
					updates.name = nextName;
				}

				await updatePropertyGroup({
					id: groupId,
					updates,
				}).unwrap();
			}

			feedback.notify('Group updates saved.');
			setManageDialogGroups((previousGroups) =>
				previousGroups.map((group, index) => {
					const groupId = String(group.id);
					const appearanceDraft = getGroupAppearanceDraft(group);
					return {
						...group,
						name: manageGroupNames[groupId] || group.name,
						description: manageGroupDescriptions[groupId] || '',
						defaultCollapsed: Boolean(
							manageGroupDefaultCollapsed[groupId],
						),
						sortOrder: index,
						groupIconKey: appearanceDraft.iconKey,
						groupIconColor: appearanceDraft.iconColor,
						groupIconBgColor: appearanceDraft.iconBgColor,
					};
				}),
			);
			setIsManageGroupsDialogOpen(false);
		} catch (error) {
			console.error('Failed to save group updates:', error);
			feedback.notify('Unable to save group updates. Please try again.');
		} finally {
			setIsSavingManageGroups(false);
		}
	};

	const handleManageGroupsSubmit = async () => {
		if (manageGroupsView === 'create') return;
		await handleSaveManageGroups();
	};

	const handleTransferGroupProperties = async (sourceGroupId: string) => {
		const targetGroupId = String(transferTargets[sourceGroupId] || '').trim();
		if (!targetGroupId || targetGroupId === sourceGroupId) {
			feedback.notify('Choose another group to transfer properties.');
			return;
		}

		const sourceGroup = orderedManageGroups.find(
			(group) => String(group.id) === sourceGroupId,
		);
		const sourceProperties = sourceGroup?.properties || [];
		if (sourceProperties.length === 0) {
			feedback.notify('This group has no properties to transfer.');
			return;
		}
		const targetGroup = orderedManageGroups.find(
			(group) => String(group.id) === targetGroupId,
		);
		if (
			!window.confirm(
				`Move ${sourceProperties.length} ${sourceProperties.length === 1 ? 'property' : 'properties'
				} from "${sourceGroup?.name || 'this group'}" to "${targetGroup?.name || 'the selected group'
				}"?`,
			)
		) {
			return;
		}

		setIsSavingManageGroups(true);
		try {
			await Promise.all(
				sourceProperties.map((property) =>
					updateProperty({
						id: String(property.id),
						updates: { groupId: targetGroupId },
					}).unwrap(),
				),
			);

			setTransferTargets((previousTargets) => ({
				...previousTargets,
				[sourceGroupId]: '',
			}));
			setSelectedTransferPropertyIds([]);
			setSelectedTransferTargetId('');
			setManageDialogGroups((previousGroups) =>
				previousGroups.map((group) =>
					String(group.id) === sourceGroupId
						? { ...group, properties: [] }
						: String(group.id) === targetGroupId
							? {
								...group,
								properties: [
									...(group.properties || []),
									...sourceProperties.map((property) => ({
										...property,
										groupId: targetGroupId,
									})),
								],
							}
							: group,
				),
			);
			feedback.notify('Properties transferred successfully.');
		} catch (error) {
			console.error('Failed to transfer properties:', error);
			feedback.notify('Unable to transfer properties. Please try again.');
		} finally {
			setIsSavingManageGroups(false);
		}
	};

	const handleTransferSelectedProperties = async (
		sourceGroupId: string,
		sourceProperties: Property[],
	) => {
		const targetGroupId = selectedTransferTargetId.trim();
		const selectedIds = new Set(selectedTransferPropertyIds);
		const propertiesToMove = sourceProperties.filter((property) =>
			selectedIds.has(String(property.id)),
		);
		if (!targetGroupId || targetGroupId === sourceGroupId) {
			feedback.notify('Choose another group for the selected properties.');
			return;
		}
		if (propertiesToMove.length === 0) {
			feedback.notify('Select at least one property to move.');
			return;
		}

		setIsSavingManageGroups(true);
		try {
			await Promise.all(
				propertiesToMove.map((property) =>
					updateProperty({
						id: String(property.id),
						updates: { groupId: targetGroupId },
					}).unwrap(),
				),
			);

			setManageDialogGroups((previousGroups) =>
				previousGroups.map((group) => {
					const groupId = String(group.id);
					if (groupId === sourceGroupId) {
						return {
							...group,
							properties: (group.properties || []).filter(
								(item: Property) => !selectedIds.has(String(item.id)),
							),
						};
					}
					if (groupId === targetGroupId) {
						return {
							...group,
							properties: [
								...(group.properties || []),
								...propertiesToMove.map((property) => ({
									...property,
									groupId: targetGroupId,
								})),
							],
						};
					}
					return group;
				}),
			);
			setSelectedTransferPropertyIds([]);
			setSelectedTransferTargetId('');
			feedback.notify(
				`${propertiesToMove.length} ${propertiesToMove.length === 1 ? 'property' : 'properties'
				} moved successfully.`,
			);
		} catch (error) {
			console.error('Failed to move selected properties:', error);
			feedback.notify('Unable to move the selected properties. Please try again.');
		} finally {
			setIsSavingManageGroups(false);
		}
	};

	const handleTransferAllAndDeleteGroup = async (sourceGroupId: string) => {
		const targetGroupId = String(transferTargets[sourceGroupId] || '').trim();
		const sourceGroup = orderedManageGroups.find(
			(group) => String(group.id) === sourceGroupId,
		);
		const targetGroup = orderedManageGroups.find(
			(group) => String(group.id) === targetGroupId,
		);
		const sourceProperties = sourceGroup?.properties || [];

		if (!targetGroupId || targetGroupId === sourceGroupId || !targetGroup) {
			feedback.notify('Choose another group for these properties.');
			return;
		}
		if (
			!window.confirm(
				`Move all ${sourceProperties.length} ${sourceProperties.length === 1 ? 'property' : 'properties'
				} to "${targetGroup.name}", then delete "${sourceGroup?.name || 'this group'
				}"?`,
			)
		) {
			return;
		}

		setIsSavingManageGroups(true);
		try {
			await Promise.all(
				sourceProperties.map((property: Property) =>
					updateProperty({
						id: String(property.id),
						updates: { groupId: targetGroupId },
					}).unwrap(),
				),
			);
			await deletePropertyGroup(sourceGroupId).unwrap();

			setManageDialogGroups((previousGroups) =>
				previousGroups
					.filter((group) => String(group.id) !== sourceGroupId)
					.map((group) =>
						String(group.id) === targetGroupId
							? {
								...group,
								properties: [
									...(group.properties || []),
									...sourceProperties.map((property: Property) => ({
										...property,
										groupId: targetGroupId,
									})),
								],
							}
							: group,
					),
			);
			setManageGroupOrder((previous) =>
				previous.filter((groupId) => groupId !== sourceGroupId),
			);
			setTransferTargets((previous) => {
				const next = { ...previous };
				delete next[sourceGroupId];
				return next;
			});
			setSelectedTransferPropertyIds([]);
			setSelectedTransferTargetId('');
			setActiveManageGroupId(targetGroupId);
			setManageGroupsView('reorder');
			feedback.notify(
				`Properties moved to "${targetGroup.name}" and group deleted.`,
			);
		} catch (error) {
			console.error('Failed to move properties and delete group:', error);
			feedback.notify(
				'Unable to finish moving properties and deleting the group. Please try again.',
			);
		} finally {
			setIsSavingManageGroups(false);
		}
	};

	const handleGroupSettings = (groupId: string) => {
		setOpenGroupMenuId(null);
		openManageGroupsDialog({
			view: 'details',
			activeGroupId: groupId,
		});
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

	const getTenantPropertyRoute = useCallback(
		(property: Property): string | null => {
			// Resident access is property-scoped.
			return property.slug ? `/property/${property.slug}` : null;
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
			? getTenantPropertyRoute(singleVisibleProperty) ||
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
		const targetGroup =
			orderedManageGroups.find((group) => String(group.id) === groupId) ||
			filteredGroups.find((group) => String(group.id) === groupId);
		if ((targetGroup?.properties || []).length > 0) {
			feedback.notify('Move properties out of this group before deleting it.');
			return;
		}

		const groupName = targetGroup?.name || 'this property group';
		if (
			!window.confirm(`Are you sure you want to delete "${groupName}"? This cannot be undone.`)
		) {
			return;
		}
		try {
			const groupToDelete = propertyGroups.find((g) => g.id === groupId);
			await deletePropertyGroup(groupId).unwrap();
			setManageDialogGroups((previousGroups) =>
				previousGroups.filter((group) => String(group.id) !== groupId),
			);
			setManageGroupOrder((previousOrder) =>
				previousOrder.filter((id) => String(id) !== groupId),
			);
			setTransferTargets((previousTargets) => {
				const nextTargets = { ...previousTargets };
				delete nextTargets[groupId];
				return nextTargets;
			});
			setManageGroupNames((previousNames) => {
				const nextNames = { ...previousNames };
				delete nextNames[groupId];
				return nextNames;
			});
			setManageGroupDescriptions((previousDescriptions) => {
				const nextDescriptions = { ...previousDescriptions };
				delete nextDescriptions[groupId];
				return nextDescriptions;
			});
			setManageGroupDefaultCollapsed((previousSettings) => {
				const nextSettings = { ...previousSettings };
				delete nextSettings[groupId];
				return nextSettings;
			});
			setManageGroupAppearanceDrafts((previousDrafts) => {
				const nextDrafts = { ...previousDrafts };
				delete nextDrafts[groupId];
				return nextDrafts;
			});
			setActiveManageGroupId((previousId) =>
				previousId === groupId ? null : previousId,
			);

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

			feedback.notify('Group deleted.');
		} catch (error) {
			console.error('Failed to delete property group:', error);
			feedback.notify('Failed to delete property group. Please try again.');
		}
	};

	const getPropertyAddress = useCallback((property: Property) => {
		const propertyTitle = property.title?.trim() || 'Untitled Property';
		const rawAddress = property.address?.trim();
		if (!rawAddress) {
			return {
				primary: propertyTitle,
				secondary: 'Address not set',
				cityState: 'Location not set',
			};
		}

		const parts = rawAddress.split(',').map((part) => part.trim()).filter(Boolean);
		const normalizeState = (stateValue: string) => {
			const stateMatch = stateValue.match(
				/^([A-Za-z]{2})(?:\s+\d{5}(?:-\d{4})?)?$/,
			);
			return stateMatch ? stateMatch[1].toUpperCase() : stateValue;
		};
		const cityState = (() => {
			if (parts.length >= 3) {
				const city = parts[parts.length - 2];
				const state = normalizeState(parts[parts.length - 1]);
				return [city, state].filter(Boolean).join(', ');
			}

			if (parts.length === 2) {
				const secondPartLooksLikeState =
					/^[A-Za-z]{2}(?:\s+\d{5}(?:-\d{4})?)?$/.test(parts[1]);
				return secondPartLooksLikeState
					? [parts[0], normalizeState(parts[1])].filter(Boolean).join(', ')
					: parts[1];
			}

			return '';
		})();

		return {
			primary: parts[0] || rawAddress,
			secondary: parts.slice(1).join(', '),
			cityState,
		};
	}, []);

	const getPropertyPillLabel = useCallback((property: Property) => {
		if (property.isRental) {
			return 'Rental';
		}

		if (normalizePropertyType(property.propertyType) === 'commercial') {
			return 'Commercial';
		}
		if (isMultiUnitProperty(property.propertyType)) {
			return 'Multi-unit';
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
				label: systemsCount === 1 ? 'Equipment Record' : 'Equipment Records',
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
				analyticsSource: 'import',
				userId: currentUser!.id,
				location: {
					propertyId: newProperty.id,
				},
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
				analyticsSource: 'import',
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

	const handleSaveProperty = async (
		formData: any,
		reportProgress?: (progress: PropertySaveProgress) => void,
	) => {
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
				await updateProperty({
					id: selectedPropertyForEdit.id,
					updates: sanitizedUpdates,
				}).unwrap();

				const generatedSpaceTemplates =
					buildPropertyProfileSpaceTemplates(formData);
				if (generatedSpaceTemplates.length > 0) {
					try {
						const existingSpaces = await getPropertySpaces({
							accountId: selectedPropertyAccountId,
							propertyId: String(selectedPropertyForEdit.id),
							includeArchived: true,
						}).unwrap();
						const spaceResult = await ensureGeneratedPropertySpaces({
							accountId: selectedPropertyAccountId,
							propertyId: String(selectedPropertyForEdit.id),
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
							withWorkflowSupportCode(
								'Property details were saved, but Maintley could not add every Bedroom and Bathroom Space. Please try saving again.',
								WORKFLOW_SUPPORT_CODES.propertySpaceReconciliation,
							),
						);
					}
				}

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
			const shouldAttemptFirstPropertyTrial =
				totalProperties === 0 &&
				isIntentionalFreeAccountSubscription(currentUser?.subscription) &&
				!isTeamMemberAccount &&
				currentUser?.isAccountOwner !== false;
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
				const planDetails = getSubscriptionPlanDetails(
					getEffectiveAccessPlanId(currentUser.subscription),
				);
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
				propertyClassification: formData.propertyClassification,
				bedrooms: formData.bedrooms,
				bathrooms: formData.bathrooms,
				notes: formData.notes,
				isRental: !!formData.isRental,
				...sharingData,
			};

			try {
				const result = await createProperty(newPropertyData);

				if ('data' in result) {
					let firstPropertyTrialActivationFailed = false;
					const generatedSpaceTemplates =
						buildPropertyProfileSpaceTemplates(formData);
					if (generatedSpaceTemplates.length > 0) {
						reportProgress?.({
							title: 'Creating reviewed Spaces...',
							text: 'Maintley is adding the Bedrooms and Bathrooms shown in your review.',
						});
						try {
							await ensureGeneratedPropertySpaces({
								accountId: String(
									result.data.accountId || result.data.userId || currentUser!.id,
								),
								propertyId: String(result.data.id),
								templates: generatedSpaceTemplates,
								existingSpaces: [],
								source: 'property_profile',
								createSpace: (input) => createPropertySpace(input).unwrap(),
							});
						} catch (spaceError) {
							console.error('Property created but reviewed Spaces were not all created:', spaceError);
							feedback.notify(
								withWorkflowSupportCode(
									'Your property was saved, but Maintley could not add every reviewed Space. The Setup Assistant can safely retry without creating duplicates.',
									WORKFLOW_SUPPORT_CODES.propertySpaceReconciliation,
								),
							);
						}
					}
					if (shouldAttemptFirstPropertyTrial) {
						if (isHomeownerPlusTrialEnabled()) {
							reportProgress?.({
								title: 'Activating Homeowner+...',
								text: `Your ${isHomeowner ? 'home' : 'property'} is saved. We are preparing the 30-day Homeowner+ access used by the setup assistant.`,
							});
						}
						try {
							const activation = await finalizeFirstPropertyTrial(result.data.id);
							if (activation.effectiveEntitlementProjection) {
								dispatch(
									updateEntitlementProjection({
										accountId: activation.accountId,
										projection: activation.effectiveEntitlementProjection as any,
									}),
								);
							}
						} catch (activationError) {
							firstPropertyTrialActivationFailed = true;
							console.error(
								'Property was created but Homeowner+ activation did not finish:',
								activationError,
							);
						}
					}

					try {
						await applyDashboardVisibilityPreference(
							result.data.id,
							formData.showOnDashboard ?? true,
						);
					} catch (visibilityError) {
						console.error('Failed to update dashboard visibility:', visibilityError);
						feedback.notify(
							withWorkflowSupportCode(
								'Property was created, but dashboard visibility could not be updated. Please try again.',
								WORKFLOW_SUPPORT_CODES.propertyDashboardPreference,
							),
						);
					}

					addRecentlyViewed({
						id: result.data.id as any, // Firebase uses string IDs
						title: result.data.title,
						slug: result.data.slug,
					});

					if (propertyToDuplicate) {
						let copiedApplianceCount = 0;
						let copiedTaskCount = 0;
						let deviceIdMap = new Map<string, string>();

						if (copyAppliancesOnDuplicate && duplicateSourceDevices.length > 0) {
							try {
								deviceIdMap = await cloneDuplicateAppliances(result.data);
								copiedApplianceCount = deviceIdMap.size;
							} catch (applianceCopyError) {
								console.error('Failed to copy equipment:', applianceCopyError);
								feedback.notify(
									withWorkflowSupportCode(
										'Property was duplicated, but equipment could not all be copied.',
										WORKFLOW_SUPPORT_CODES.propertyEquipmentCopy,
									),
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
									withWorkflowSupportCode(
										'Property was duplicated, but tasks could not all be copied.',
										WORKFLOW_SUPPORT_CODES.propertyTaskCopy,
									),
								);
							}
						}

						const copiedDetails = [
							copiedApplianceCount > 0
								? `${copiedApplianceCount} ${copiedApplianceCount === 1 ? 'equipment record' : 'equipment records'
								}`
								: null,
							copiedTaskCount > 0
								? `${copiedTaskCount} ${copiedTaskCount === 1 ? 'task' : 'tasks'
								}`
								: null,
						].filter(Boolean);

						feedback.notify(
							copiedDetails.length > 0
								? `Duplicated ${formData.name} with ${copiedDetails.join(' and ')}.`
								: `Duplicated ${formData.name}.`,
						);
					} else if (
						formData.openSetupAfterCreate !== false &&
						!firstPropertyTrialActivationFailed
					) {
						feedback.notify(
							`${formData.name} was created. Opening ${isHomeowner ? 'home' : 'property'} setup.`,
							'success',
						);
						navigate(`/property/${result.data.slug}?setup=1`);
					} else if (firstPropertyTrialActivationFailed) {
						feedback.notify(
							`${formData.name} was created, but Homeowner+ access is still activating. Open setup after the access notice appears.`,
						);
						navigate(`/property/${result.data.slug}`);
					} else {
						feedback.notify(`${formData.name} was created.`, 'success');
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

	if (
		propertyGroups.length === 0 &&
		(arePropertyGroupsLoading || arePropertyGroupsFetching)
	) {
		return (
			<LoadingState
				loadingKey='properties-page'
				title='Loading properties'
				message='Preparing your property records.'
			/>
		);
	}

	if (propertyGroups.length === 0 && didPropertyGroupsFail) {
		return (
			<AppZeroState
				kind='noProperties'
				title='Properties could not be loaded'
				description='Maintley could not load your property records. Try again before adding anything new.'
				actions={[
					{
						label: 'Try Again',
						onClick: () => void refetchPropertyGroups(),
					},
				]}
				fullPage
			/>
		);
	}

	if (arePropertyGroupsLoaded && singlePropertyRoute) {
		return <Navigate to={singlePropertyRoute} replace />;
	}

	if (arePropertyGroupsLoaded && visibleProperties.length === 0) {
		const zeroStateKind = isUserTenant || isTeamMemberAccount
			? 'noAssignedProperties'
			: 'noProperties';
		const zeroStateActions = !isUserTenant && !isTeamMemberAccount && canManage
			? [
				{
					label: propertyLanguage.addLabel,
					onClick: handleAddPropertyGlobalClick,
					variant: 'primary' as const,
				},
			]
			: [];

		return (
			<>
				<AppZeroState
					kind={zeroStateKind}
					context={isHomeowner ? 'homeowner' : 'property'}
					actions={zeroStateActions}
					fullPage
				/>
				<PropertyDialog
					isOpen={dialogOpen}
					onClose={handleClosePropertyDialog}
					onSave={handleSaveProperty}
					showOnboardingSetupTip={showOnboardingSetupTip}
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
			</>
		);
	}

	return (
		<StandardAppPage as={Wrapper}>
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>{propertyLanguage.pageTitle}</StandardAppPageTitle>
					<StandardAppPageSubtitle>{propertyLanguage.pageSubtitle}</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
				<TopActions>
					<DesktopPropertyFilters>
						<SearchBar
							type='text'
							placeholder={propertyLanguage.searchPlaceholder}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<FilterSortContainer>
							<FilterButton
								$isActive={activeFilterCount > 0}
								onClick={openFilterPanel}>
								{activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
							</FilterButton>
							{activeFilterCount > 0 && (
								<FilterButton
									$isActive={false}
									onClick={clearPropertyFilters}
									style={{ fontSize: '12px', padding: '6px 10px' }}>
									Clear all
								</FilterButton>
							)}
						</FilterSortContainer>
					</DesktopPropertyFilters>
					{canManage && (
						<>
							<AddPropertyButton
								disabled={handleDisabled()}
								onClick={handleAddPropertyGlobalClick}>
								+ {propertyLanguage.addLabel}
							</AddPropertyButton>
							{canManageGroups && (
								<HeaderMenuWrap ref={headerMenuRef}>
									{/* <HeaderMenuButton
										onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
										aria-label='Open group options'>
										Group Management
									</HeaderMenuButton> */}
									{isHeaderMenuOpen && (
										<HeaderDropdownMenu>
											{/* <HeaderDropdownItem onClick={handleHeaderCreateGroup}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faFolderPlus} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Create Group</HeaderDropdownTitle>
												</div>
											</HeaderDropdownItem> */}
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
											{/* <HeaderDropdownItem onClick={handleHeaderGroupSettings}>
												<HeaderDropdownIcon>
													<FontAwesomeIcon icon={faGear} />
												</HeaderDropdownIcon>
												<div>
													<HeaderDropdownTitle>Group Settings</HeaderDropdownTitle>
													<HeaderDropdownHint>Default group for new properties</HeaderDropdownHint>
												</div>
											</HeaderDropdownItem> */}
										</HeaderDropdownMenu>
									)}
								</HeaderMenuWrap>
							)}
						</>
					)}
				</TopActions>
			</StandardAppPageHeader>
			<CompactResultCount>
				Showing {displayedPropertyCount} of {visibleProperties.length}{' '}
				{visibleProperties.length === 1
					? propertyLanguage.recordSingular
					: propertyLanguage.recordPlural}
			</CompactResultCount>
			<FloatingFilterPanel
				isOpen={isFilterPanelOpen}
				onOpen={openFilterPanel}
				onDismiss={dismissFilterPanel}
				onApply={applyDraftFilters}
				onClearDraft={clearDraftFilters}
				activeFilterCount={activeFilterCount}
				title={propertyLanguage.filterTitle}
				description={propertyLanguage.filterDescription}
				additionalSettingsActions={
					canManageGroups
						? [
							{
								label: 'Manage Groups',
								description: 'Reorder groups or open group settings.',
								onClick: handleHeaderManageGroups,
							},
							{
								label: 'Create Group',
								description: 'Create and customize a new property group.',
								onClick: handleHeaderCreateGroup,
							},
							{
								label: 'Collapse All',
								description: 'Show only the group headings.',
								onClick: handleCollapseAllGroups,
							},
							{
								label: 'Expand All',
								description: 'Show properties in every group.',
								onClick: handleExpandAllGroups,
							},
						]
						: undefined
				}>
				<PropertyFilterFields>
					<PropertyFilterField>
						Search
						<SearchBar
							type='search'
							placeholder={propertyLanguage.searchPlaceholder}
							value={draftSearchQuery}
							onChange={(event) => setDraftSearchQuery(event.target.value)}
						/>
					</PropertyFilterField>
					<PropertyFilterField>
						Location
						<SearchBar
							type='search'
							placeholder='City, state, or zip...'
							value={draftLocation}
							onChange={(event) => setDraftLocation(event.target.value)}
						/>
					</PropertyFilterField>
					<PropertyFilterField>
						Property type
						<PropertyFilterSelect
							value={draftPropertyType}
							onChange={(event) =>
								setDraftPropertyType(event.target.value as typeof draftPropertyType)
							}>
							<option value='all'>All types</option>
							<option value='residential'>Residential</option>
							<option value='multi_unit'>Multi-unit</option>
							<option value='commercial'>Commercial</option>
						</PropertyFilterSelect>
					</PropertyFilterField>
					<PropertyFilterField>
						Property use
						<PropertyFilterSelect
							value={draftFilterBy}
							onChange={(event) =>
								setDraftFilterBy(event.target.value as typeof draftFilterBy)
							}>
							<option value='all'>All properties</option>
							<option value='rental'>Rentals</option>
							<option value='residential'>Owner occupied</option>
						</PropertyFilterSelect>
					</PropertyFilterField>
					<PropertyFilterField>
						Min. bedrooms
						<PropertyFilterSelect
							value={String(draftMinBedrooms)}
							onChange={(event) => setDraftMinBedrooms(Number(event.target.value))}>
							<option value='0'>Any</option>
							<option value='1'>1+</option>
							<option value='2'>2+</option>
							<option value='3'>3+</option>
							<option value='4'>4+</option>
							<option value='5'>5+</option>
						</PropertyFilterSelect>
					</PropertyFilterField>
					<PropertyFilterField>
						Sort by
						<PropertyFilterSelect
							value={draftSortBy}
							onChange={(event) =>
								setDraftSortBy(event.target.value as typeof draftSortBy)
							}>
							<option value='name'>Name A–Z</option>
							<option value='recent'>Recently added</option>
							<option value='updated'>Recently updated</option>
						</PropertyFilterSelect>
					</PropertyFilterField>
				</PropertyFilterFields>
			</FloatingFilterPanel>
			{/* Desktop inline filter panel */}
			{isFilterPanelOpen && (
				<DesktopFilterPanel>
					<DesktopFilterPanelHeader>
						<DesktopFilterPanelTitle>Filter & Sort</DesktopFilterPanelTitle>
						<DesktopFilterPanelActions>
							<DesktopFilterClearButton
								type='button'
								onClick={clearDraftFilters}>
								Clear all
							</DesktopFilterClearButton>
							<DesktopFilterApplyButton
								type='button'
								onClick={applyDraftFilters}>
								Apply
							</DesktopFilterApplyButton>
							<DesktopFilterDismissButton
								type='button'
								onClick={dismissFilterPanel}
								aria-label='Close filter panel'>
								✕
							</DesktopFilterDismissButton>
						</DesktopFilterPanelActions>
					</DesktopFilterPanelHeader>
					<DesktopFilterPanelGrid>
						<PropertyFilterField>
							Search
							<SearchBar
								type='search'
								placeholder={propertyLanguage.searchPlaceholder}
								value={draftSearchQuery}
								onChange={(e) => setDraftSearchQuery(e.target.value)}
							/>
						</PropertyFilterField>
						<PropertyFilterField>
							Location
							<SearchBar
								type='search'
								placeholder='City, state, or zip...'
								value={draftLocation}
								onChange={(e) => setDraftLocation(e.target.value)}
							/>
						</PropertyFilterField>
						<PropertyFilterField>
							Property type
							<PropertyFilterSelect
								value={draftPropertyType}
								onChange={(e) =>
									setDraftPropertyType(e.target.value as typeof draftPropertyType)
								}>
								<option value='all'>All types</option>
								<option value='residential'>Residential</option>
								<option value='multi_unit'>Multi-unit</option>
								<option value='commercial'>Commercial</option>
							</PropertyFilterSelect>
						</PropertyFilterField>
						<PropertyFilterField>
							Property use
							<PropertyFilterSelect
								value={draftFilterBy}
								onChange={(e) =>
									setDraftFilterBy(e.target.value as typeof draftFilterBy)
								}>
								<option value='all'>All properties</option>
								<option value='rental'>Rentals</option>
								<option value='residential'>Owner occupied</option>
							</PropertyFilterSelect>
						</PropertyFilterField>
						<PropertyFilterField>
							Min. bedrooms
							<PropertyFilterSelect
								value={String(draftMinBedrooms)}
								onChange={(e) => setDraftMinBedrooms(Number(e.target.value))}>
								<option value='0'>Any</option>
								<option value='1'>1+</option>
								<option value='2'>2+</option>
								<option value='3'>3+</option>
								<option value='4'>4+</option>
								<option value='5'>5+</option>
							</PropertyFilterSelect>
						</PropertyFilterField>
						<PropertyFilterField>
							Sort by
							<PropertyFilterSelect
								value={draftSortBy}
								onChange={(e) =>
									setDraftSortBy(e.target.value as typeof draftSortBy)
								}>
								<option value='name'>Name A–Z</option>
								<option value='recent'>Recently added</option>
								<option value='updated'>Recently updated</option>
							</PropertyFilterSelect>
						</PropertyFilterField>
					</DesktopFilterPanelGrid>
				</DesktopFilterPanel>
			)}
			{showPropertyGroupUpsell && (
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
				showOnboardingSetupTip={showOnboardingSetupTip}
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
								propertyType: normalizePropertyType(selectedPropertyForEdit.propertyType),
								propertyClassification:
									selectedPropertyForEdit.propertyClassification ||
									getDefaultPropertyClassification(selectedPropertyForEdit.propertyType),
								bedrooms: selectedPropertyForEdit.bedrooms || 0,
								bathrooms: selectedPropertyForEdit.bathrooms || 0,
								notes: selectedPropertyForEdit.notes || '',
								isRental: selectedPropertyForEdit.isRental ?? false,
								coOwners: selectedPropertyForEdit.coOwners || [],
								administrators: selectedPropertyForEdit.administrators || [],
								viewers: selectedPropertyForEdit.viewers || [],
								accessSnapshots: selectedPropertyForEdit.accessSnapshots || {},
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
				{displayedGroups.length === 0 && (
					<AppZeroState
						kind='noPropertyMatches'
						actions={[
							{
								label: 'Clear Filters',
								onClick: clearPropertyFilters,
							},
						]}
					/>
				)}
				{displayedGroups.map((group) => {
					const groupAppearance = getGroupAppearanceFromGroup(group);
					return (
						<GroupSection key={group.id}>
							<GroupHeader>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
									<CollapseToggle
										onClick={() => handleToggleCollapse(group.id as any)}
										title={collapsedGroups.has(group.id as any) ? 'Expand group' : 'Collapse group'}>
										<FontAwesomeIcon icon={collapsedGroups.has(group.id as any) ? faChevronDown : faChevronUp} />
									</CollapseToggle>
									<GroupIconBadge
										$background={groupAppearance.iconBgColor}
										$color={groupAppearance.iconColor}
										aria-hidden='true'>
										<FontAwesomeIcon
											icon={getGroupIconByKey(groupAppearance.iconKey)}
										/>
									</GroupIconBadge>
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
										<GroupTitleBlock>
											<GroupName>
												{getDisplayGroupName(group.name)}
												<GroupCountBadge>
													{(group.properties || []).length}
												</GroupCountBadge>
											</GroupName>
											{group.description && (
												<GroupDescription>{group.description}</GroupDescription>
											)}
										</GroupTitleBlock>
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
														onClick={() => handleGroupSettings(String(group.id))}>
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
										const propertyDisplayName =
											property.title?.trim() ||
											address.primary ||
											'Untitled Property';
										const propertyLocationLabel =
											address.cityState ||
											address.secondary ||
											address.primary ||
											'Location not set';
										const metrics = getPropertyMetrics(property);
										const propertyPillLabel = getPropertyPillLabel(property);
										const propertyImageSrc = getPropertyImageSrc(property.image);
										const isFallbackImage = isPropertyImageFallback(property.image);
										const propertyRoute =
											getTenantPropertyRoute(property) ||
											`/property/${property.slug}`;
										const openProperty = () => {
											addRecentlyViewed({
												id: property.id,
												title: property.title,
												slug: property.slug,
											});
											navigate(propertyRoute);
										};
										return (
											<PropertyTile
												key={property.id}
												onClick={openProperty}>
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
														style={{
															background: groupAppearance.iconBgColor,
														}}
														title={isFavorite(property.id as any) ? 'Remove from favorites' : 'Add to favorites'}>
														<FontAwesomeIcon
															icon={getGroupIconByKey(groupAppearance.iconKey)}
															style={{ color: groupAppearance.iconColor }}
														/>
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
															href={propertyRoute}
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																openProperty();
															}}>
															{propertyDisplayName}
														</PropertyTitle>
														<PropertyAddress>
															<FontAwesomeIcon icon={faLocationDot} />
															<span>{propertyLocationLabel}</span>
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
											<AddPropertyTileTitle>{propertyLanguage.addLabel}</AddPropertyTileTitle>
											<AddPropertyTileHint>
												Add another {propertyLanguage.recordSingular} to this group
											</AddPropertyTileHint>
										</AddPropertyTile>
									)}
								</PropertiesGrid>
							)}
						</GroupSection>
					);
				})}
			</GroupsContainer>

			<GenericModal
				isOpen={isManageGroupsDialogOpen}
				title='Manage Property Groups'
				onClose={() => {
					if (isSavingManageGroups || isCreatingManageGroup) return;
					setIsManageGroupsDialogOpen(false);
				}}
				onSubmit={handleManageGroupsSubmit}
				showActions={true}
				isLoading={isSavingManageGroups || isCreatingManageGroup}
				primaryButtonLabel={
					isSavingManageGroups ? 'Saving...' : 'Save Changes'
				}
				primaryButtonDisabled={orderedManageGroups.some(
					(group) =>
						!String(manageGroupNames[String(group.id)] || '').trim(),
				) || manageGroupsView === 'create'}
				secondaryButtonLabel='Close'>
				<ManageGroupsStack>
					<ManageGroupsToolbar>
						{manageGroupsView === 'reorder' && (
							<SecondaryButton
								type='button'
								onClick={() => setManageGroupsView('create')}>
								Create Group
							</SecondaryButton>
						)}
					</ManageGroupsToolbar>

					{manageGroupsView === 'reorder' && (
						<div style={{ fontSize: 12, color: '#64748b' }}>
							Drag groups into the order you want. On touch screens, use the
							arrow buttons.
						</div>
					)}
					{manageGroupsView === 'create' ? (
						<ManageGroupPanel>
							<ManageGroupPanelHeader>
								<div>
									<h4>Create Group</h4>
									<p>
										Name the group and choose how it should appear.
									</p>
								</div>
								<SecondaryButton
									type='button'
									onClick={() => setManageGroupsView('reorder')}
									disabled={isCreatingManageGroup}>
									Back to Groups
								</SecondaryButton>
							</ManageGroupPanelHeader>
							<div>
								<FormLabel>Group Name</FormLabel>
								<FormInput
									type='text'
									value={manageNewGroupName}
									onChange={(event) =>
										setManageNewGroupName(event.target.value)
									}
									disabled={isCreatingManageGroup}
									placeholder='e.g. Rentals, Commercial, Primary Homes'
									autoFocus
								/>
							</div>
							<div>
								<FormLabel>Description</FormLabel>
								<FormTextarea
									value={manageNewGroupDescription}
									onChange={(event) =>
										setManageNewGroupDescription(event.target.value)
									}
									disabled={isCreatingManageGroup}
									maxLength={140}
									rows={3}
									placeholder='Optional note about the properties in this group'
								/>
							</div>
							<label
								style={{
									display: 'flex',
									alignItems: 'flex-start',
									gap: 10,
									padding: '12px',
									borderRadius: 10,
									background: '#f8fafc',
									cursor: 'pointer',
								}}>
								<input
									type='checkbox'
									checked={manageNewGroupDefaultCollapsed}
									onChange={(event) =>
										setManageNewGroupDefaultCollapsed(
											event.target.checked,
										)
									}
									disabled={isCreatingManageGroup}
								/>
								<span>
									<strong style={{ display: 'block', fontSize: 13 }}>
										Start this group collapsed
									</strong>
									<span
										style={{
											display: 'block',
											fontSize: 12,
											color: '#64748b',
										}}>
										Useful for less frequently visited groups.
									</span>
								</span>
							</label>
							<div style={{ display: 'grid', gap: 8 }}>
								<FormLabel>Icon</FormLabel>
								<FormSelect
									value={manageNewGroupAppearance.iconKey}
									onChange={(event) =>
										setManageNewGroupAppearance((previous) => ({
											...previous,
											iconKey:
												event.target.value as PropertyGroupIconKey,
										}))
									}
									disabled={isCreatingManageGroup}>
									{GROUP_ICON_OPTIONS.map((option) => (
										<option key={option.key} value={option.key}>
											{option.label}
										</option>
									))}
								</FormSelect>
							</div>
							<ManageGroupAppearancePreview>
								<GroupIconBadge
									$background={
										manageNewGroupAppearance.iconBgColor
									}
									$color={manageNewGroupAppearance.iconColor}
									aria-hidden='true'>
									<FontAwesomeIcon
										icon={getGroupIconByKey(
											manageNewGroupAppearance.iconKey,
										)}
									/>
								</GroupIconBadge>
								<div>
									<strong>
										{manageNewGroupName.trim() || 'New Group'}
									</strong>
									<span>Live appearance preview</span>
								</div>
							</ManageGroupAppearancePreview>
							<div style={{ display: 'grid', gap: 8 }}>
								<FormLabel>Color</FormLabel>
								<div
									style={{
										display: 'flex',
										gap: 8,
										flexWrap: 'wrap',
									}}>
									{GROUP_COLOR_PRESETS.map((preset) => (
										<button
											key={`new-${preset.label}`}
											type='button'
											onClick={() =>
												setManageNewGroupAppearance((previous) => ({
													...previous,
													iconColor: preset.iconColor,
													iconBgColor: preset.iconBgColor,
												}))
											}
											disabled={isCreatingManageGroup}
											style={{
												padding: '6px 10px',
												borderRadius: 999,
												border:
													manageNewGroupAppearance.iconBgColor ===
														preset.iconBgColor
														? `2px solid ${COLORS.primary}`
														: '1px solid #e2e8f0',
												background: '#fff',
												cursor: 'pointer',
												fontSize: 12,
											}}>
											<span
												style={{
													display: 'inline-block',
													width: 12,
													height: 12,
													borderRadius: 999,
													background: preset.iconBgColor,
													marginRight: 6,
													verticalAlign: 'middle',
												}}
											/>
											{preset.label}
										</button>
									))}
								</div>
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns:
										'repeat(2, minmax(0, 1fr))',
									gap: 12,
								}}>
								<label>
									<FormLabel>Icon Color</FormLabel>
									<input
										type='color'
										value={manageNewGroupAppearance.iconColor}
										onChange={(event) =>
											setManageNewGroupAppearance((previous) => ({
												...previous,
												iconColor: event.target.value,
											}))
										}
										disabled={isCreatingManageGroup}
										style={{ width: '100%', height: 40 }}
									/>
								</label>
								<label>
									<FormLabel>Background Color</FormLabel>
									<input
										type='color'
										value={manageNewGroupAppearance.iconBgColor}
										onChange={(event) =>
											setManageNewGroupAppearance((previous) => ({
												...previous,
												iconBgColor: event.target.value,
											}))
										}
										disabled={isCreatingManageGroup}
										style={{ width: '100%', height: 40 }}
									/>
								</label>
							</div>
							<SecondaryButton
								type='button'
								onClick={handleCreateGroupFromManageDialog}
								disabled={
									isCreatingManageGroup ||
									!manageNewGroupName.trim()
								}>
								{isCreatingManageGroup
									? 'Creating Group...'
									: 'Create Group'}
							</SecondaryButton>
						</ManageGroupPanel>
					) : manageGroupsView === 'reorder' ? (
						<ManageGroupList>
							{orderedManageGroups.map((group, index) => {
								const groupId = String(group.id);
								const isDragging = draggingManageGroupId === groupId;
								const appearance = getGroupAppearanceDraft(group);
								return (
									<ManageGroupRow
										key={groupId}
										$dragging={isDragging}
										draggable={!isSavingManageGroups}
										onDragStart={() => handleDragStartManageGroup(groupId)}
										onDragOver={(event) => event.preventDefault()}
										onDrop={() => handleDropManageGroup(groupId)}
										onDragEnd={() => setDraggingManageGroupId(null)}>
										<ManageGroupDragHandle title='Drag to reorder'>
											<FontAwesomeIcon icon={faGripVertical} />
										</ManageGroupDragHandle>
										<div
											style={{
												width: 38,
												height: 38,
												borderRadius: 999,
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												background: appearance.iconBgColor,
												flex: '0 0 38px',
											}}>
											<FontAwesomeIcon
												icon={getGroupIconByKey(appearance.iconKey)}
												style={{ color: appearance.iconColor }}
											/>
										</div>
										<ManageGroupPreview>
											<strong>
												{manageGroupNames[groupId] || group.name}
											</strong>
											<span>
												{(group.properties || []).length}{' '}
												{(group.properties || []).length === 1
													? 'property'
													: 'properties'}
												{manageGroupDescriptions[groupId]
													? ` · ${manageGroupDescriptions[groupId]}`
													: ''}
											</span>
										</ManageGroupPreview>
										<ManageGroupRowActions>
											<SecondaryButton
												type='button'
												title='Move up'
												onClick={() => handleMoveManageGroup(groupId, -1)}
												disabled={isSavingManageGroups || index === 0}>
												<FontAwesomeIcon icon={faChevronUp} />
											</SecondaryButton>
											<SecondaryButton
												type='button'
												title='Move down'
												onClick={() => handleMoveManageGroup(groupId, 1)}
												disabled={
													isSavingManageGroups ||
													index === orderedManageGroups.length - 1
												}>
												<FontAwesomeIcon icon={faChevronDown} />
											</SecondaryButton>
											<ManageGroupMenuWrap>
												<ManageGroupMenuButton
													type='button'
													aria-label={`Group options for ${group.name}`}
													aria-expanded={openManageGroupMenuId === groupId}
													onClick={() =>
														setOpenManageGroupMenuId((current) =>
															current === groupId ? null : groupId,
														)
													}>
													<FontAwesomeIcon icon={faEllipsisVertical} />
												</ManageGroupMenuButton>
												{openManageGroupMenuId === groupId && (
													<ManageGroupMenu>
														<ManageGroupMenuItem
															type='button'
															onClick={() => {
																setActiveManageGroupId(groupId);
																setManageGroupsView('details');
																setOpenManageGroupMenuId(null);
															}}>
															Group Settings
														</ManageGroupMenuItem>
														<ManageGroupMenuItem
															type='button'
															onClick={() => {
																setActiveManageGroupId(groupId);
																setManageGroupsView('transfer');
																setOpenManageGroupMenuId(null);
															}}>
															Move Properties
														</ManageGroupMenuItem>
														<ManageGroupMenuItem
															type='button'
															$danger
															disabled={(group.properties || []).length > 0}
															onClick={() => {
																setOpenManageGroupMenuId(null);
																handleDeleteGroup(groupId);
															}}>
															Delete Empty Group
														</ManageGroupMenuItem>
													</ManageGroupMenu>
												)}
											</ManageGroupMenuWrap>
										</ManageGroupRowActions>
									</ManageGroupRow>
								);
							})
							}
						</ManageGroupList>
					) : manageGroupsView === 'details' ? (
						(() => {
							const currentGroup = orderedManageGroups.find(
								(group) =>
									String(group.id) === String(activeManageGroupId),
							);
							if (!currentGroup) return null;
							const currentGroupId = String(currentGroup.id);

							return (
								<ManageGroupPanel>
									<ManageGroupPanelHeader>
										<div>
											<h4>Group Settings</h4>
											<p>Update the group details, behavior, and appearance.</p>
										</div>
										<SecondaryButton
											type='button'
											onClick={() => setManageGroupsView('reorder')}>
											Back to Groups
										</SecondaryButton>
									</ManageGroupPanelHeader>
									<div>
										<FormLabel>Group Name</FormLabel>
										<FormInput
											type='text'
											value={
												manageGroupNames[currentGroupId] ??
												currentGroup.name ??
												''
											}
											onChange={(event) =>
												setManageGroupNames((previous) => ({
													...previous,
													[currentGroupId]: event.target.value,
												}))
											}
											disabled={isSavingManageGroups}
										/>
									</div>
									<div>
										<FormLabel>Description</FormLabel>
										<FormTextarea
											value={
												manageGroupDescriptions[currentGroupId] ??
												currentGroup.description ??
												''
											}
											onChange={(event) =>
												setManageGroupDescriptions((previous) => ({
													...previous,
													[currentGroupId]: event.target.value,
												}))
											}
											disabled={isSavingManageGroups}
											maxLength={140}
											rows={3}
											placeholder='Optional note, such as long-term rentals or family homes'
										/>
									</div>
									<label
										style={{
											display: 'flex',
											alignItems: 'flex-start',
											gap: 10,
											padding: '12px',
											borderRadius: 10,
											background: '#f8fafc',
											cursor: 'pointer',
										}}>
										<input
											type='checkbox'
											checked={Boolean(
												manageGroupDefaultCollapsed[currentGroupId],
											)}
											onChange={(event) =>
												setManageGroupDefaultCollapsed((previous) => ({
													...previous,
													[currentGroupId]: event.target.checked,
												}))
											}
											disabled={isSavingManageGroups}
										/>
										<span>
											<strong style={{ display: 'block', fontSize: 13 }}>
												Start this group collapsed
											</strong>
											<span
												style={{
													display: 'block',
													fontSize: 12,
													color: '#64748b',
												}}>
												Useful for less frequently visited groups.
											</span>
										</span>
									</label>
									{(() => {
										const appearanceDraft =
											getGroupAppearanceDraft(currentGroup);
										return (
											<>
												<div style={{ display: 'grid', gap: 8 }}>
													<FormLabel>Icon</FormLabel>
													<FormSelect
														value={appearanceDraft.iconKey}
														onChange={(event) =>
															setManageGroupAppearanceDrafts(
																(previous) => ({
																	...previous,
																	[currentGroupId]: {
																		...appearanceDraft,
																		iconKey:
																			event.target
																				.value as PropertyGroupIconKey,
																	},
																}),
															)
														}
														disabled={isSavingManageGroups}>
														{GROUP_ICON_OPTIONS.map((option) => (
															<option
																key={option.key}
																value={option.key}>
																{option.label}
															</option>
														))}
													</FormSelect>
												</div>
												<ManageGroupAppearancePreview>
													<GroupIconBadge
														$background={appearanceDraft.iconBgColor}
														$color={appearanceDraft.iconColor}
														aria-hidden='true'>
														<FontAwesomeIcon
															icon={getGroupIconByKey(
																appearanceDraft.iconKey,
															)}
														/>
													</GroupIconBadge>
													<div>
														<strong>
															{manageGroupNames[currentGroupId] ||
																currentGroup.name}
														</strong>
														<span>Live appearance preview</span>
													</div>
												</ManageGroupAppearancePreview>
												<div style={{ display: 'grid', gap: 8 }}>
													<FormLabel>Color</FormLabel>
													<div
														style={{
															display: 'flex',
															gap: 8,
															flexWrap: 'wrap',
														}}>
														{GROUP_COLOR_PRESETS.map((preset) => (
															<button
																key={`settings-${preset.label}-${currentGroupId}`}
																type='button'
																onClick={() =>
																	setManageGroupAppearanceDrafts(
																		(previous) => ({
																			...previous,
																			[currentGroupId]: {
																				...appearanceDraft,
																				iconColor:
																					preset.iconColor,
																				iconBgColor:
																					preset.iconBgColor,
																			},
																		}),
																	)
																}
																disabled={isSavingManageGroups}
																style={{
																	padding: '6px 10px',
																	borderRadius: 999,
																	border:
																		appearanceDraft.iconBgColor ===
																			preset.iconBgColor
																			? `2px solid ${COLORS.primary}`
																			: '1px solid #e2e8f0',
																	background: '#fff',
																	cursor: 'pointer',
																	fontSize: 12,
																}}>
																<span
																	style={{
																		display: 'inline-block',
																		width: 12,
																		height: 12,
																		borderRadius: 999,
																		background:
																			preset.iconBgColor,
																		marginRight: 6,
																		verticalAlign: 'middle',
																	}}
																/>
																{preset.label}
															</button>
														))}
													</div>
												</div>
												<div
													style={{
														display: 'grid',
														gridTemplateColumns:
															'repeat(2, minmax(0, 1fr))',
														gap: 12,
													}}>
													<label>
														<FormLabel>Icon Color</FormLabel>
														<input
															type='color'
															value={appearanceDraft.iconColor}
															onChange={(event) =>
																setManageGroupAppearanceDrafts(
																	(previous) => ({
																		...previous,
																		[currentGroupId]: {
																			...appearanceDraft,
																			iconColor:
																				event.target.value,
																		},
																	}),
																)
															}
															disabled={isSavingManageGroups}
															style={{ width: '100%', height: 40 }}
														/>
													</label>
													<label>
														<FormLabel>Background Color</FormLabel>
														<input
															type='color'
															value={appearanceDraft.iconBgColor}
															onChange={(event) =>
																setManageGroupAppearanceDrafts(
																	(previous) => ({
																		...previous,
																		[currentGroupId]: {
																			...appearanceDraft,
																			iconBgColor:
																				event.target.value,
																		},
																	}),
																)
															}
															disabled={isSavingManageGroups}
															style={{ width: '100%', height: 40 }}
														/>
													</label>
												</div>
											</>
										);
									})()}
								</ManageGroupPanel>
							);
						})()
					) : manageGroupsView === 'transfer' ? (
						(() => {
							const currentGroup = orderedManageGroups.find(
								(group) => String(group.id) === String(activeManageGroupId),
							);
							if (!currentGroup) {
								return <div style={{ color: '#64748b' }}>Select a group from options.</div>;
							}

							const currentGroupId = String(currentGroup.id);
							const propertyCount = (currentGroup.properties || []).length;
							const destinationGroups = orderedManageGroups.filter(
								(group) => String(group.id) !== currentGroupId,
							);
							const normalizedTransferSearch =
								transferPropertySearch.trim().toLowerCase();
							const filteredTransferProperties = (
								currentGroup.properties || []
							).filter((property: Property) => {
								if (!normalizedTransferSearch) return true;
								const address = getPropertyAddress(property);
								return [
									property.title,
									address.primary,
									address.secondary,
								]
									.filter(Boolean)
									.join(' ')
									.toLowerCase()
									.includes(normalizedTransferSearch);
							});
							const selectedTransferIds = new Set(
								selectedTransferPropertyIds,
							);
							const allVisibleSelected =
								filteredTransferProperties.length > 0 &&
								filteredTransferProperties.every((property: Property) =>
									selectedTransferIds.has(String(property.id)),
								);

							return (
								<ManageGroupPanel>
									<ManageGroupPanelHeader>
										<div>
											<h4>Move Properties</h4>
											<p>
												{currentGroup.name} · {propertyCount}{' '}
												{propertyCount === 1 ? 'property' : 'properties'}
											</p>
										</div>
										<SecondaryButton
											type='button'
											onClick={() => setManageGroupsView('reorder')}>
											Back to Groups
										</SecondaryButton>
									</ManageGroupPanelHeader>
									<div style={{ display: 'grid', gap: 8 }}>
										<FormLabel>Move selected properties</FormLabel>
										{propertyCount > 0 ? (
											<>
												<PropertyTransferToolbar>
													<FormInput
														type='search'
														value={transferPropertySearch}
														onChange={(event) =>
															setTransferPropertySearch(
																event.target.value,
															)
														}
														placeholder={propertyLanguage.searchPlaceholder.replace('...', '')}
													/>
													<PropertyTransferSelectionBar>
														<span>
															{selectedTransferPropertyIds.length}{' '}
															selected
														</span>
														<button
															type='button'
															onClick={() => {
																const visibleIds =
																	filteredTransferProperties.map(
																		(property: Property) =>
																			String(property.id),
																	);
																setSelectedTransferPropertyIds(
																	(previous) => {
																		const next = new Set(previous);
																		if (allVisibleSelected) {
																			visibleIds.forEach((id) =>
																				next.delete(id),
																			);
																		} else {
																			visibleIds.forEach((id) =>
																				next.add(id),
																			);
																		}
																		return Array.from(next);
																	},
																);
															}}>
															{allVisibleSelected
																? 'Clear visible'
																: 'Select visible'}
														</button>
													</PropertyTransferSelectionBar>
												</PropertyTransferToolbar>
												<PropertyTransferList>
													{filteredTransferProperties.map(
														(property: Property) => {
															const propertyId = String(property.id);
															const address = getPropertyAddress(property);
															return (
																<PropertyTransferRow
																	as='label'
																	key={propertyId}>
																	<input
																		type='checkbox'
																		checked={selectedTransferIds.has(
																			propertyId,
																		)}
																		onChange={(event) =>
																			setSelectedTransferPropertyIds(
																				(previous) =>
																					event.target.checked
																						? Array.from(
																							new Set([
																								...previous,
																								propertyId,
																							]),
																						)
																						: previous.filter(
																							(id) =>
																								id !== propertyId,
																						),
																			)
																		}
																	/>
																	<PropertyTransferName>
																		<strong>{property.title}</strong>
																		<span>
																			{address.primary}
																			{address.secondary
																				? ` · ${address.secondary}`
																				: ''}
																		</span>
																	</PropertyTransferName>
																</PropertyTransferRow>
															);
														},
													)}
													{filteredTransferProperties.length === 0 && (
														<div
															style={{
																padding: 14,
																fontSize: 12,
																color: '#64748b',
															}}>
															No matching properties.
														</div>
													)}
												</PropertyTransferList>
												<SelectedTransferActions>
													<FormSelect
														value={selectedTransferTargetId}
														onChange={(event) =>
															setSelectedTransferTargetId(
																event.target.value,
															)
														}
														disabled={isSavingManageGroups}>
														<option value=''>
															Choose destination group
														</option>
														{destinationGroups.map((group) => (
															<option key={group.id} value={group.id}>
																{group.name}
															</option>
														))}
													</FormSelect>
													<SecondaryButton
														type='button'
														onClick={() =>
															handleTransferSelectedProperties(
																currentGroupId,
																currentGroup.properties || [],
															)
														}
														disabled={
															isSavingManageGroups ||
															selectedTransferPropertyIds.length === 0 ||
															!selectedTransferTargetId
														}>
														Move Selected
													</SecondaryButton>
												</SelectedTransferActions>
											</>
										) : (
											<div style={{ fontSize: 12, color: '#64748b' }}>
												This group has no properties to move.
											</div>
										)}
									</div>
									<div style={{ display: 'grid', gap: 8 }}>
										<FormLabel>Move the entire group</FormLabel>
										<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
											<FormSelect
												value={transferTargets[currentGroupId] || ''}
												onChange={(event) =>
													setTransferTargets((previous) => ({
														...previous,
														[currentGroupId]: event.target.value,
													}))
												}
												disabled={isSavingManageGroups || propertyCount === 0}
												style={{ flex: 1, minWidth: 180 }}>
												<option value=''>Choose destination group</option>
												{destinationGroups.map((group) => (
													<option key={group.id} value={group.id}>
														{group.name}
													</option>
												))}
											</FormSelect>
										</div>
										<BulkTransferActions>
											<SecondaryButton
												type='button'
												onClick={() =>
													handleTransferGroupProperties(currentGroupId)
												}
												disabled={
													isSavingManageGroups ||
													propertyCount === 0 ||
													!transferTargets[currentGroupId]
												}>
												Move All
											</SecondaryButton>
											<DangerButton
												type='button'
												onClick={() =>
													handleTransferAllAndDeleteGroup(
														currentGroupId,
													)
												}
												disabled={
													isSavingManageGroups ||
													!transferTargets[currentGroupId]
												}>
												Move All & Delete Group
											</DangerButton>
										</BulkTransferActions>
									</div>
									<div>
										<DangerButton
											type='button'
											onClick={() => handleDeleteGroup(currentGroupId)}
											disabled={isSavingManageGroups || propertyCount > 0}>
											Delete Group
										</DangerButton>
										{propertyCount > 0 && (
											<div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
												Move properties first to enable delete.
											</div>
										)}
									</div>
								</ManageGroupPanel>
							);
						})()
					) : null}
				</ManageGroupsStack>
			</GenericModal>

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
		</StandardAppPage>
	);
};
