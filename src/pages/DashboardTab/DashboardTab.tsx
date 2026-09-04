import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { setCurrentUser } from 'Redux/Slices/userSlice';
import { Task } from 'types/Task.types';
import { getTaskTimingLabel } from 'tasks/taskSchedule';
import { useGetPropertiesQuery } from 'Redux/API/propertySlice';
import {
	useGetAllMaintenanceHistoryForUserQuery,
	useUpdateUserMutation,
} from 'Redux/API/userSlice';
import { getTenantPropertySlug } from 'utils/permissions';
import {
	selectIsHomeowner,
	selectIsTeamMemberAccount,
	selectIsTenant,
} from 'Redux/selectors/permissionSelectors';
import { filterTasksByRole, findTeamMemberForUser } from 'utils/dataFilters';
import { getTaskDisplayStatus } from 'utils/taskDisplayStatus';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from 'utils/maintenanceEventUtils';
import { mergeMaintenanceHistoryWithDeviceSources } from 'maintenanceHistory/maintenanceHistoryAdapter';
import { getEmbeddedPropertyDocuments } from 'propertyKnowledge/propertyMemoryRecordService';
import {
	runDashboardIntelligence,
	type DashboardIntelligenceSuggestion,
	type DashboardSuggestedTaskPrefill,
} from 'intelligence/consumers/portfolioDashboard';
import {
	aggregateMaintleyIntelligenceReadiness,
	deriveMaintleyIntelligenceReadiness,
	type MaintleyIntelligenceReadinessCategoryId,
} from 'intelligence/readiness';
import { TaskCompletionModal } from 'Components/TaskCompletionModal';
import { TrialWarningBanner } from 'Components/TrialWarningBanner/TrialWarningBanner';
import { ExpiredTrialBanner } from 'Components/ExpiredTrialBanner/ExpiredTrialBanner';
import { ScheduledSubscriptionBanner } from 'Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner';
import {
	canUseRecurringTasks,
	getEffectiveAccessPlanId,
	getTrialDaysRemaining,
	isTrialExpired,
} from 'utils/subscriptionUtils';
import { USER_ROLES } from 'constants/roles';
import { TODAY_PAGE_LABEL } from 'constants/navigation';
import {
	ActionFirstTopSection,
	TodayFocusCard,
	CardEyebrow,
	CardTitle,
	TodayFocusLead,
	TodayFocusSupportingText,
	TodayFocusTaskCard,
	TodayFocusTaskName,
	TodayFocusTaskMeta,
	TodayFocusButtons,
	FocusButton,
	IntelligenceReadinessCard,
	IntelligenceReadinessHeader,
	IntelligenceReadinessHelp,
	IntelligenceReadinessHelpButton,
	IntelligenceReadinessIntro,
	IntelligenceReadinessTitle,
	IntelligenceReadinessDescription,
	IntelligenceReadinessCategories,
	IntelligenceReadinessCategory,
	IntelligenceReadinessCategoryTitle,
	IntelligenceReadinessLevel,
	IntelligenceReadinessSummary,
	IntelligenceReadinessNextStep,
	IntelligenceReadinessFooter,
	IntelligenceReadinessReviewButton,
	IntelligenceReadinessDialogBody,
	IntelligenceReadinessDialogLead,
	IntelligenceReadinessDialogNote,
	IntelligenceReadinessDialogSection,
	IntelligenceReadinessDialogSubhead,
	IntelligenceReadinessDialogFooter,
	IntelligenceReadinessPropertyList,
	IntelligenceReadinessPropertyCard,
	IntelligenceReadinessPropertyHeader,
	IntelligenceReadinessPropertyTitle,
	IntelligenceReadinessPropertyLevel,
	IntelligenceReadinessEvidenceList,
	IntelligenceReadinessEvidenceItem,
	IntelligenceReadinessPropertyAction,
	IntelligenceReadinessFractions,
	IntelligenceReadinessFraction,
	DashboardIntelligenceCard,
	DashboardIntelligenceHeader,
	DashboardIntelligenceSourcePill,
	DashboardIntelligenceRecommendationTitle,
	DashboardIntelligenceContext,
	DashboardIntelligenceImpact,
	DashboardIntelligenceEvidence,
	DashboardIntelligenceActions,
	RecentActivityEmpty,
	HomeActivitySection,
	HomeActivityHeader,
	HomeActivityTabs,
	HomeActivityTab,
	HomeActivityContent,
	HomeTimelineList,
	HomeTimelineRow,
	HomeTimelineDate,
	HomeTimelineDateSub,
	HomeTimelineMain,
	HomeTimelineTitleRow,
	HomeTimelineTitle,
	HomeTimelineBadge,
	HomeTimelineMeta,
	UrgentTaskGroup,
	UrgentTaskGroupLabel,
	UrgentTaskList,
	UrgentTaskRow,
	UrgentTaskMain,
	UrgentTaskTitle,
	UrgentTaskContext,
	UrgentTaskMeta,
	UrgentTaskProperty,
	UrgentTaskAssignee,
	UrgentTaskDue,
	UrgentTaskPriority,
	TitleRow,
	TaskStatusBadge,
	UrgentTaskActions,
	UrgentActionButton,
	UrgentQueueEmpty,
	DashboardPropertyFilter,
	DashboardDesktopPropertyFilter,
	DashboardHeaderActions,
	DashboardScopeControl,
	DashboardScopeButton,
} from './DashboardTab.styles';
import { AppZeroState } from 'Components/Library/AppZeroState';
import { isNativeApp } from 'utils/platform';
import { openSubscriptionManagementInBrowser } from 'utils/authLinks';
import { useTaskHandlers } from 'pages/PropertyDetailPage/useTaskHandlers';
import { FloatingFilterPanel, GenericModal, TaskModal } from 'Components/Library';
import { TaskAssignModal } from 'Components/Library/Modal/TaskAssignModal';
import { useGetTasksQuery, useUpdateTaskMutation } from 'Redux/API/taskSlice';
import { useGetAllDevicesQuery } from 'Redux/API/deviceSlice';
import { useLazyGetMaintenanceHistoryByPropertyQuery } from 'Redux/API/maintenanceSlice';
import { useGetTeamMembersQuery } from 'Redux/API/teamSlice';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../../Components/Library/AppPageLayout/AppPageLayout.styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const isPermissionDeniedError = (error: unknown): boolean => {
	const err = error as {
		code?: string;
		message?: string;
		status?: number | string;
		error?: string;
		data?: { message?: string; error?: string; code?: string | number };
	};
	const code = String(err?.code || err?.data?.code || err?.status || '').toLowerCase();
	const message = String(err?.message || err?.data?.message || err?.error || err?.data?.error || '').toLowerCase();

	return (
		code.includes('permission-denied') ||
		message.includes('missing or insufficient permissions')
	);
};

type DashboardAudience =
	| 'owner_manager'
	| 'maintenance_lead'
	| 'assigned_user'
	| 'single_property';

type DashboardScopePreference = 'my_focus' | 'all_visible_properties';
type HomeActivityTabKey = 'needs_attention' | 'home_timeline';

type HomeTimelineEntry = {
	id: string;
	type: 'task' | 'maintenance' | 'document' | 'home';
	title: string;
	meta: string;
	date: Date;
	dateLabel: string;
};

const HOME_ACTIVITY_LIST_LIMIT = 10;
const TODAY_ACTION_LIMIT = 3;

const MANAGER_DASHBOARD_ROLES = new Set<string>([
	USER_ROLES.ADMIN,
	USER_ROLES.PROPERTY_MANAGER,
	USER_ROLES.ASSISTANT_MANAGER,
]);

const ASSIGNED_WORK_DASHBOARD_ROLES = new Set<string>([
	USER_ROLES.MAINTENANCE,
	USER_ROLES.ACCOUNTING,
	USER_ROLES.LEASING,
	USER_ROLES.CONTRACTOR,
	USER_ROLES.PROPERTY_GUEST,
]);

const normalizeText = (value: unknown): string =>
	String(value || '').trim().toLowerCase();

const getSavedDashboardScope = (
	value: unknown,
): DashboardScopePreference | null => {
	if (value === 'my_focus' || value === 'all_visible_properties') {
		return value;
	}
	return null;
};

export const DashboardTab = () => {
	const ACTIVE_TASK_STATUSES = useMemo(
		() =>
			new Set([
				'Initiated',
				'Pending',
				'In Progress',
				'Awaiting Approval',
				'Rejected',
			]),
		[],
	);

	const PRIORITY_RANK: Record<string, number> = useMemo(
		() => ({
			Urgent: 4,
			High: 3,
			Medium: 2,
			Low: 1,
		}),
		[],
	);

	const DASHBOARD_DUE_WINDOW_DAYS = 90;

	const navigate = useNavigate();
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isHomeowner = useSelector(selectIsHomeowner);
	const nativeApp = isNativeApp();
	// Select team groups and derive members with memoization to avoid new references
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery();
	const reduxTeamMembers = useMemo(
		() =>
			teamGroups
				.flatMap((group) => group.members || [])
				.filter((member): member is typeof member => member !== undefined),
		[teamGroups],
	);
	const teamMembers = useMemo(
		() =>
			(firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers)
				.filter((member): member is typeof member => member !== undefined),
		[firebaseTeamMembers, reduxTeamMembers],
	);

	// Fetch tasks and properties from Firebase
	const { data: allTasks = [], refetch: refetchTasks } = useGetTasksQuery();
	const { data: allDevices = [] } = useGetAllDevicesQuery();
	const { data: ownedProperties = [], isLoading: isLoadingProperties } =
		useGetPropertiesQuery();
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery(undefined, {
			skip: !currentUser?.id && !(currentUser as any)?.uid,
			refetchOnMountOrArgChange: true,
		});
	const resolvedAllMaintenanceHistory = useMemo(
		() => mergeMaintenanceHistoryWithDeviceSources(allMaintenanceHistory, allDevices),
		[allMaintenanceHistory, allDevices],
	);
	const [fetchMaintenanceHistoryByProperty] =
		useLazyGetMaintenanceHistoryByPropertyQuery();
	const availableProperties = useMemo(() => {
		const combined = [...ownedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, currentUser?.hiddenPropertyIds]);
	const [selectedPropertyId, setSelectedPropertyId] = useState('');
	const [draftPropertyId, setDraftPropertyId] = useState('');
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
	const [isReadinessHelpOpen, setIsReadinessHelpOpen] = useState(false);
	const [selectedReadinessCategoryId, setSelectedReadinessCategoryId] =
		useState<MaintleyIntelligenceReadinessCategoryId | null>(null);
	const [isReadinessPropertyChooserOpen, setIsReadinessPropertyChooserOpen] =
		useState(false);
	const [activeHomeActivityTab, setActiveHomeActivityTab] =
		useState<HomeActivityTabKey>('needs_attention');
	const propertyFilteredProperties = useMemo(
		() =>
			selectedPropertyId
				? availableProperties.filter(
					(property) => String(property.id) === selectedPropertyId,
				)
				: availableProperties,
		[availableProperties, selectedPropertyId],
	);

	useEffect(() => {
		if (
			selectedPropertyId &&
			!availableProperties.some(
				(property) => String(property.id) === selectedPropertyId,
			)
		) {
			setSelectedPropertyId('');
			setDraftPropertyId('');
		}
	}, [availableProperties, selectedPropertyId]);

	const openFilterPanel = () => {
		setDraftPropertyId(selectedPropertyId);
		setIsFilterPanelOpen(true);
	};

	const dismissFilterPanel = () => {
		setDraftPropertyId(selectedPropertyId);
		setIsFilterPanelOpen(false);
	};

	const applyPropertyFilter = () => {
		setSelectedPropertyId(draftPropertyId);
		setIsFilterPanelOpen(false);
	};

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [updateUser] = useUpdateUserMutation();

	// Local task handlers for dashboard (used by MobileTaskCarousel)
	const taskHandlers = useTaskHandlers({ updateTaskMutation });

	// Destructure task handlers state
	const {
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		setEditingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
		handleAssignTask,
		handleEditTask,
	} = taskHandlers;

	// Redirect tenants to their assigned property
	const isUserTenant = useSelector(selectIsTenant);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);

	const dashboardAudience = useMemo<DashboardAudience>(() => {
		const role = String(currentUser?.role || '');

		if (role === USER_ROLES.MAINTENANCE_LEAD) {
			return 'maintenance_lead';
		}

		if (isTeamMemberAccount || ASSIGNED_WORK_DASHBOARD_ROLES.has(role)) {
			return 'assigned_user';
		}

		if (
			currentUser?.isAccountOwner === true ||
			MANAGER_DASHBOARD_ROLES.has(role)
		) {
			return 'owner_manager';
		}

		return 'single_property';
	}, [currentUser?.isAccountOwner, currentUser?.role, isTeamMemberAccount]);

	useEffect(() => {
		if (currentUser && isUserTenant) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, isUserTenant, navigate]);

	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [dashboardTaskPrefill, setDashboardTaskPrefill] =
		useState<DashboardSuggestedTaskPrefill | null>(null);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [dashboardMaintenanceHistory, setDashboardMaintenanceHistory] = useState<
		any[]
	>([]);
	const dashboardHistoryLoadedKeyRef = useRef<string>('');

	const currentTeamMember = useMemo(
		() => findTeamMemberForUser(teamMembers, currentUser),
		[teamMembers, currentUser],
	);

	const roleFilteredTasks = useMemo(
		() =>
			filterTasksByRole(
				allTasks,
				currentUser,
				teamMembers,
				availableProperties,
			),
		[allTasks, currentUser, teamMembers, availableProperties],
	);

	const propertyFilteredIdList = useMemo(
		() =>
			propertyFilteredProperties
				.map((property) => String(property?.id || '').trim())
				.filter(Boolean)
				.sort(),
		[propertyFilteredProperties],
	);

	const propertyFilteredTitles = useMemo(
		() =>
			new Set(
				propertyFilteredProperties
					.map((property) => String((property as any).title || '').trim())
					.filter(Boolean),
			),
		[propertyFilteredProperties],
	);

	const propertyFilteredSlugs = useMemo(
		() =>
			new Set(
				propertyFilteredProperties
					.map((property) => String((property as any).slug || '').trim())
					.filter(Boolean),
			),
		[propertyFilteredProperties],
	);

	const propertyScopedTasks = useMemo(() => {
		if (propertyFilteredIdList.length === 0) return [];
		const propertyFilteredIds = new Set(propertyFilteredIdList);

		return roleFilteredTasks.filter((task) => {
			const taskPropertyId = String(task.propertyId || '').trim();
			const taskPropertyTitle = String(
				task.property || task.propertyTitle || '',
			).trim();
			const taskPropertySlug = String((task as any).propertySlug || '').trim();

			return (
				(taskPropertyId && propertyFilteredIds.has(taskPropertyId)) ||
				(taskPropertyTitle && propertyFilteredTitles.has(taskPropertyTitle)) ||
				(taskPropertySlug && propertyFilteredSlugs.has(taskPropertySlug))
			);
		});
	}, [
		roleFilteredTasks,
		propertyFilteredIdList,
		propertyFilteredTitles,
		propertyFilteredSlugs,
	]);

	const isTaskAssignedToCurrentUser = useMemo(() => {
		const idTokens = new Set(
			[
				currentUser?.id,
				(currentUser as any)?.uid,
				(currentUser as any)?.teamMemberId,
				currentTeamMember?.id,
			]
				.map((value) => String(value || '').trim())
				.filter(Boolean),
		);
		const emailTokens = new Set(
			[currentUser?.email, currentTeamMember?.email]
				.map(normalizeText)
				.filter(Boolean),
		);
		const nameTokens = new Set(
			[
				`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`,
				`${currentTeamMember?.firstName || ''} ${currentTeamMember?.lastName || ''}`,
			]
				.map(normalizeText)
				.filter(Boolean),
		);

		return (task: Task): boolean => {
			const assigneeIds = [
				task.assignee,
				task.assignedTo?.id,
				(task as any).assignedToId,
				(task as any).assignedUserId,
			]
				.map((value) => String(value || '').trim())
				.filter(Boolean);
			if (assigneeIds.some((id) => idTokens.has(id))) {
				return true;
			}

			const assigneeEmails = [
				task.assignedTo?.email,
				task.assigneeEmail,
				(task as any).assignedToEmail,
			]
				.map(normalizeText)
				.filter(Boolean);
			if (assigneeEmails.some((email) => emailTokens.has(email))) {
				return true;
			}

			const assigneeNames = [
				task.assignedTo?.name,
				task.assigneeName,
				`${task.assigneeFirstName || ''} ${task.assigneeLastName || ''}`,
			]
				.map(normalizeText)
				.filter(Boolean);
			return assigneeNames.some((name) => nameTokens.has(name));
		};
	}, [currentUser, currentTeamMember]);

	const defaultDashboardScope = useMemo<DashboardScopePreference>(() => {
		const role = String(currentUser?.role || '');
		const isManagerOrOwner =
			currentUser?.isAccountOwner === true ||
			MANAGER_DASHBOARD_ROLES.has(role) ||
			dashboardAudience === 'maintenance_lead';
		if (!isManagerOrOwner && availableProperties.length > 1) {
			return 'my_focus';
		}
		if (dashboardAudience === 'assigned_user') {
			return 'my_focus';
		}
		return 'all_visible_properties';
	}, [
		availableProperties.length,
		currentUser?.isAccountOwner,
		currentUser?.role,
		dashboardAudience,
	]);

	const dashboardScope = useMemo<DashboardScopePreference>(
		() =>
			getSavedDashboardScope(currentUser?.dashboardPreferences?.scope) ||
			defaultDashboardScope,
		[currentUser?.dashboardPreferences?.scope, defaultDashboardScope],
	);

	const myFocusTasks = useMemo(
		() => propertyScopedTasks.filter(isTaskAssignedToCurrentUser),
		[propertyScopedTasks, isTaskAssignedToCurrentUser],
	);

	const myFocusPropertyIds = useMemo(
		() =>
			new Set(
				myFocusTasks
					.map((task) => String(task.propertyId || '').trim())
					.filter(Boolean),
			),
		[myFocusTasks],
	);

	const allProperties = useMemo(() => {
		if (dashboardScope === 'all_visible_properties' || selectedPropertyId) {
			return propertyFilteredProperties;
		}

		return propertyFilteredProperties.filter((property) =>
			myFocusPropertyIds.has(String(property.id)),
		);
	}, [
		dashboardScope,
		myFocusPropertyIds,
		propertyFilteredProperties,
		selectedPropertyId,
	]);

	const filteredTasks = useMemo(
		() =>
			dashboardScope === 'my_focus'
				? myFocusTasks
				: propertyScopedTasks,
		[dashboardScope, myFocusTasks, propertyScopedTasks],
	);

	const visiblePropertyIds = useMemo(
		() => new Set(allProperties.map((property) => String(property.id))),
		[allProperties],
	);

	const visibleDevices = useMemo(
		() =>
			allDevices.filter((device: any) =>
				visiblePropertyIds.has(String(device?.location?.propertyId || '')),
			),
		[allDevices, visiblePropertyIds],
	);
	const resolvedDashboardMaintenanceHistory = useMemo(
		() =>
			mergeMaintenanceHistoryWithDeviceSources(
				dashboardMaintenanceHistory,
				visibleDevices,
			),
		[dashboardMaintenanceHistory, visibleDevices],
	);
	const trackedSystemsCount = visibleDevices.length;

	const handleDashboardScopeChange = async (
		scope: DashboardScopePreference,
	) => {
		if (!currentUser || scope === dashboardScope) return;

		const previousPreferences = currentUser.dashboardPreferences || {};
		const dashboardPreferences = {
			...previousPreferences,
			scope,
		};

		dispatch(
			setCurrentUser({
				...currentUser,
				dashboardPreferences,
			}),
		);

		try {
			await updateUser({
				id: currentUser.id,
				updates: { dashboardPreferences },
			}).unwrap();
		} catch (error) {
			console.error('Failed to update dashboard scope preference:', error);
			dispatch(
				setCurrentUser({
					...currentUser,
					dashboardPreferences: previousPreferences,
				}),
			);
		}
	};

	const dashboardFraming = useMemo(() => {
		const isSinglePropertyScope = allProperties.length === 1;
		const isMyFocus = dashboardScope === 'my_focus';
		const propertyCountLabel = `${allProperties.length} ${allProperties.length === 1 ? 'home' : 'homes'
			}`;
		const systemsCountLabel = `${trackedSystemsCount} ${trackedSystemsCount === 1 ? 'equipment record' : 'equipment records'
			}`;
		const scopePill = isMyFocus
			? 'My Focus'
			: isSinglePropertyScope
				? 'One home view'
				: `${allProperties.length} homes in view`;
		const overviewEyebrow = isMyFocus
			? 'Your Homes'
			: isSinglePropertyScope
				? 'Maintley Intelligence'
				: 'Homes in View';
		const overviewText =
			allProperties.length === 0
				? 'No homes have assigned work in this view.'
				: `Guidance based on saved records across ${propertyCountLabel} and ${systemsCountLabel}.`;

		switch (dashboardAudience) {
			case 'maintenance_lead':
				return {
					pageSubtitle: isMyFocus
						? 'See the work assigned to you across the homes in view.'
						: 'See team-visible work, overdue tasks, and property context in view.',
					focusEyebrow: isMyFocus ? 'Your Focus' : 'Team Focus',
					focusTitle: isMyFocus
						? 'Handle your next task'
						: 'Keep priority work moving',
					overviewEyebrow: isSinglePropertyScope
						? overviewEyebrow
						: isMyFocus
							? 'Your Homes'
							: 'Team Homes',
					overviewText,
					queueTitle: isMyFocus ? 'Your Tasks' : 'Team Tasks',
					queueSubtitle: isMyFocus
						? 'Overdue and upcoming tasks assigned to you are grouped so you can decide what to handle next.'
						: 'Overdue and upcoming team-visible tasks are grouped so you can decide what needs attention next.',
					scopePill,
					recentSubtitle: isMyFocus
						? 'Recently recorded work connected to your focus.'
						: 'Recently recorded work across the homes currently in view.',
				};
			case 'assigned_user':
				return {
					pageSubtitle: isMyFocus
						? 'See the work assigned to you and the property context around it.'
						: 'See the work and property updates visible to you.',
					focusEyebrow: 'Your Focus',
					focusTitle: 'Handle your next task',
					overviewEyebrow: isSinglePropertyScope
						? overviewEyebrow
						: 'Your Homes',
					overviewText,
					queueTitle: 'Your Tasks',
					queueSubtitle:
						'Overdue and upcoming tasks in your view are grouped so you can decide what to handle next.',
					scopePill,
					recentSubtitle: isMyFocus
						? 'Recently recorded work connected to your focus.'
						: 'Recently recorded work connected to the homes in your view.',
				};
			case 'single_property':
				return {
					pageSubtitle: isMyFocus
						? 'See your assigned maintenance work and recent records.'
						: "See today's maintenance priorities and recent records for this property.",
					focusEyebrow: isMyFocus ? 'Your Focus' : "Today's Focus",
					focusTitle: 'Handle what matters first',
					overviewEyebrow,
					overviewText,
					queueTitle: isMyFocus ? 'Your Tasks' : 'Maintenance Tasks',
					queueSubtitle:
						'Overdue and upcoming maintenance tasks are grouped so you can decide what to handle next.',
					scopePill,
					recentSubtitle: isMyFocus
						? 'Recently recorded work connected to your focus.'
						: 'Recently recorded work for the property in view.',
				};
			case 'owner_manager':
			default:
				return {
					pageSubtitle: isMyFocus
						? 'See the work assigned to you across the homes in view.'
						: isSinglePropertyScope
							? "See today's priorities, upcoming work, and recent maintenance for this property."
							: "See today's priorities, upcoming work, and recent maintenance across the homes in view.",
					focusEyebrow: isMyFocus ? 'Your Focus' : "Today's Focus",
					focusTitle: isMyFocus
						? 'Handle your next task'
						: 'Handle what matters first',
					overviewEyebrow,
					overviewText,
					queueTitle: isMyFocus ? 'Your Tasks' : 'Needs Attention',
					queueSubtitle: isMyFocus
						? 'Overdue and upcoming tasks assigned to you are grouped so you can decide what to handle next.'
						: 'Overdue and upcoming maintenance tasks are grouped so you can decide what to handle next.',
					scopePill,
					recentSubtitle: isMyFocus
						? 'Recently recorded work connected to your focus.'
						: 'Recently recorded work across the homes in view.',
				};
		}
	}, [
		allProperties.length,
		dashboardAudience,
		dashboardScope,
		trackedSystemsCount,
	]);

	const propertyLookup = useMemo(
		() =>
			new Map(
				allProperties.map((property: any) => [
					property.id,
					{
						title: String(property.title || 'Property').trim(),
						slug: String(property.slug || '').trim(),
					},
				]),
			),
		[allProperties],
	);

	const visiblePropertyIdList = useMemo(
		() =>
			allProperties
				.map((property) => String(property?.id || '').trim())
				.filter(Boolean)
				.sort(),
		[allProperties],
	);

	const dashboardTaskLookup = useMemo(
		() => new Map(filteredTasks.map((task) => [task.id, task])),
		[filteredTasks],
	);

	const visiblePropertyIdsKey = useMemo(
		() => visiblePropertyIdList.join('|'),
		[visiblePropertyIdList],
	);

	useEffect(() => {
		let isCancelled = false;

		if (!visiblePropertyIdsKey) {
			dashboardHistoryLoadedKeyRef.current = '';
			setDashboardMaintenanceHistory((previousHistory) =>
				previousHistory.length > 0 ? [] : previousHistory,
			);
			return;
		}

		if (dashboardHistoryLoadedKeyRef.current === visiblePropertyIdsKey) {
			return;
		}

		const propertyIdsToLoad = visiblePropertyIdsKey.split('|').filter(Boolean);

		setDashboardMaintenanceHistory((previousHistory) =>
			previousHistory.length > 0 ? [] : previousHistory,
		);

		const loadDashboardMaintenanceHistory = async () => {
			try {
				const propertyHistories = await Promise.all(
					propertyIdsToLoad.map(async (propertyId) => {
						try {
							return await fetchMaintenanceHistoryByProperty(propertyId).unwrap();
						} catch (error) {
							if (!isPermissionDeniedError(error)) {
								console.warn(
									'Could not load dashboard maintenance history for property:',
									propertyId,
									error,
								);
							}
							return [];
						}
					}),
				);

				const uniqueHistory = propertyHistories
					.flat()
					.filter(
						(record, index, self) =>
							index === self.findIndex((entry: any) => entry.id === record.id),
					);

				if (!isCancelled) {
					setDashboardMaintenanceHistory(uniqueHistory);
					dashboardHistoryLoadedKeyRef.current = visiblePropertyIdsKey;
				}
			} catch (error) {
				if (!isPermissionDeniedError(error)) {
					console.warn('Could not build dashboard maintenance history aggregate:', error);
				}
				if (!isCancelled) {
					setDashboardMaintenanceHistory((previousHistory) =>
						previousHistory.length > 0 ? [] : previousHistory,
					);
					dashboardHistoryLoadedKeyRef.current = visiblePropertyIdsKey;
				}
			}
		};

		void loadDashboardMaintenanceHistory();

		return () => {
			isCancelled = true;
		};
	}, [visiblePropertyIdsKey, fetchMaintenanceHistoryByProperty]);

	const scopedMaintenanceHistory = useMemo(() => {
		const visiblePropertyIds = new Set(allProperties.map((property) => property.id));
		const visiblePropertyTitles = new Set(
			allProperties
				.map((property) => String((property as any).title || '').trim())
				.filter(Boolean),
		);

		return resolvedAllMaintenanceHistory
			.filter(isContinuityEvent)
			.filter((record: any) => {
				const recordPropertyId = String(record?.propertyId || '').trim();
				const recordPropertyTitle = String(record?.propertyTitle || '').trim();
				const legacyPropertyField = String(record?.property || '').trim();

				if (recordPropertyId && visiblePropertyIds.has(recordPropertyId)) {
					return true;
				}

				if (recordPropertyTitle && visiblePropertyTitles.has(recordPropertyTitle)) {
					return true;
				}

				if (
					legacyPropertyField &&
					(visiblePropertyTitles.has(legacyPropertyField) ||
						visiblePropertyIds.has(legacyPropertyField))
				) {
					return true;
				}

				return false;
			});
	}, [resolvedAllMaintenanceHistory, allProperties]);

	const dashboardIntelligenceHistory = useMemo(
		() =>
			resolvedDashboardMaintenanceHistory.length > 0
				? resolvedDashboardMaintenanceHistory
				: scopedMaintenanceHistory,
		[resolvedDashboardMaintenanceHistory, scopedMaintenanceHistory],
	);

	const effectivePlanId = useMemo(
		() =>
			getEffectiveAccessPlanId(currentUser?.subscription as any),
		[currentUser?.subscription],
	);

	const dashboardIntelligence = useMemo(
		() =>
			runDashboardIntelligence({
				properties: allProperties,
				systems: visibleDevices,
				tasks: filteredTasks,
				maintenanceHistory: dashboardIntelligenceHistory,
				planId: effectivePlanId,
				limit: 1,
			}),
		[
			allProperties,
			visibleDevices,
			filteredTasks,
			dashboardIntelligenceHistory,
			effectivePlanId,
		],
	);

	const dashboardSuggestion = dashboardIntelligence.primarySuggestion;

	const getDashboardSuggestionSourceLabel = (
		suggestion: DashboardIntelligenceSuggestion,
	): string => {
		switch (suggestion.source) {
			case 'context':
				return 'Seasonal';
			case 'history_inference':
				return isHomeowner ? 'Home History' : 'Property History';
			case 'knowledge_pack':
				return 'Maintley Knowledge';
			case 'property_memory':
			default:
				return isHomeowner ? 'Home Memory' : 'Property Memory';
		}
	};

	const completedTasksCount = useMemo(() => {
		if (resolvedDashboardMaintenanceHistory.length > 0) {
			return resolvedDashboardMaintenanceHistory.filter(isContinuityEvent).length;
		}

		if (scopedMaintenanceHistory.length > 0) {
			return scopedMaintenanceHistory.length;
		}

		return 0;
	}, [resolvedDashboardMaintenanceHistory, scopedMaintenanceHistory]);

	const taskStatusCounts = useMemo(() => {
		const now = new Date();
		const maxDueDate = new Date(now);
		maxDueDate.setDate(maxDueDate.getDate() + DASHBOARD_DUE_WINDOW_DAYS);
		let overdue = 0;
		let upcoming = 0;
		let completed = completedTasksCount;

		filteredTasks.forEach((task) => {
			if (!task.dueDate || task.status === 'Completed') {
				// Already counted in maintenance history
				return;
			}

			if (!ACTIVE_TASK_STATUSES.has(task.status)) {
				return;
			}

			const dueDate = new Date(task.dueDate);
			if (dueDate < now) {
				overdue++;
			} else if (dueDate <= maxDueDate) {
				upcoming++;
			}
		});

		return {
			overdue,
			upcoming,
			completed,
		};
	}, [
		filteredTasks,
		completedTasksCount,
		ACTIVE_TASK_STATUSES,
		DASHBOARD_DUE_WINDOW_DAYS,
	]);

	const propertyIntelligenceReadiness = useMemo(() => {
		const sourceRecords = resolvedDashboardMaintenanceHistory.length
			? resolvedDashboardMaintenanceHistory
			: scopedMaintenanceHistory;
		return allProperties.map((property) => {
			const propertyId = String(property.id);
			const systems = visibleDevices.filter(
				(device) => String(device.location?.propertyId || '') === propertyId,
			);
			const systemIds = new Set(systems.map((system) => String(system.id)));
			const tasks = propertyScopedTasks.filter(
				(task) => String(task.propertyId || task.property || '') === propertyId,
			);
			const maintenanceHistory = sourceRecords.filter((record: any) => {
				if (String(record?.propertyId || '') === propertyId) return true;
				const linkedIds = [
					...(Array.isArray(record?.deviceIds) ? record.deviceIds : []),
					record?.deviceId,
					record?.equipmentId,
				]
					.map((value) => String(value || ''))
					.filter(Boolean);
				return linkedIds.some((id) => systemIds.has(id));
			});

			return {
				propertyId,
				propertyTitle: String(property.title || 'Property'),
				propertySlug: String(property.slug || property.id || ''),
				readiness: deriveMaintleyIntelligenceReadiness({
					systems,
					tasks,
					maintenanceHistory,
				}),
			};
		});
	}, [
		allProperties,
		resolvedDashboardMaintenanceHistory,
		propertyScopedTasks,
		scopedMaintenanceHistory,
		visibleDevices,
	]);
	const intelligenceReadiness = useMemo(
		() => aggregateMaintleyIntelligenceReadiness(propertyIntelligenceReadiness),
		[propertyIntelligenceReadiness],
	);
	const hasRecurringTaskAccess = canUseRecurringTasks(
		currentUser?.subscription as any,
	);
	const getReadinessNextStep = (
		category: (typeof intelligenceReadiness.categories)[number],
	): string => {
		if (
			category.id === 'maintenance_coverage' &&
			category.level !== 'ready' &&
			!hasRecurringTaskAccess
		) {
			return 'Your current access does not include recurring tasks. You can still add one-time maintenance tasks.';
		}
		return category.nextStep;
	};

	const readinessRecordLabel = isHomeowner ? 'home' : 'property';
	const openIntelligenceReviewForProperty = (propertySlug: string) => {
		const targetSlug = String(propertySlug || '').trim();
		if (!targetSlug) return;
		setSelectedReadinessCategoryId(null);
		setIsReadinessPropertyChooserOpen(false);
		navigate(
			`/property/${encodeURIComponent(targetSlug)}?tab=insights&insightsTab=overview`,
		);
	};
	const handleReadinessReviewAction = () => {
		if (propertyIntelligenceReadiness.length === 1) {
			openIntelligenceReviewForProperty(
				propertyIntelligenceReadiness[0].propertySlug,
			);
			return;
		}
		setIsReadinessPropertyChooserOpen(true);
	};
	const readinessScopeLabel =
		propertyIntelligenceReadiness.length === 0
			? 'No properties in view'
			: propertyIntelligenceReadiness.length === 1
			? propertyIntelligenceReadiness[0].propertyTitle
			: `Across ${propertyIntelligenceReadiness.length} properties`;
	const selectedReadinessCategory = intelligenceReadiness.categories.find(
		(category) => category.id === selectedReadinessCategoryId,
	);
	const getPropertyReadinessCategory = (
		property: (typeof propertyIntelligenceReadiness)[number],
		categoryId: MaintleyIntelligenceReadinessCategoryId,
	) =>
		property.readiness.categories.find((category) => category.id === categoryId);
	const formatReadinessFraction = (
		property: (typeof propertyIntelligenceReadiness)[number],
		categoryId: MaintleyIntelligenceReadinessCategoryId,
	): string => {
		const category = getPropertyReadinessCategory(property, categoryId);
		if (!category || category.evidence.applicableRecords === 0) return '—';
		return `${category.evidence.supportedRecords}/${category.evidence.applicableRecords}`;
	};
	const getReadinessEvidenceLines = (
		category: (typeof intelligenceReadiness.categories)[number],
	): string[] => {
		const { evidence } = category;
		if (category.id === 'equipment_context') {
			return [
				`${evidence.supportedRecords} of ${evidence.applicableRecords} equipment records have a recognized type.`,
			];
		}
		if (category.id === 'maintenance_coverage') {
			return [
				`${evidence.scheduledRecords || 0} equipment records have a valid recurring schedule.`,
				`${evidence.guidedRecords || 0} schedules match general Maintley care guidance.`,
				`${evidence.customScheduleRecords || 0} schedules use a custom interval or care item.`,
			];
		}
		return [
			`${evidence.historyLinkedRecords || 0} of ${evidence.applicableRecords} applicable equipment records have linked service history.`,
			`${evidence.patternRecords || 0} equipment records have at least three comparable, dated service events for a recorded pattern.`,
		];
	};

	const urgentTasks = useMemo(() => {
		const now = new Date();
		const maxDueDate = new Date(now);
		maxDueDate.setDate(maxDueDate.getDate() + DASHBOARD_DUE_WINDOW_DAYS);
		return filteredTasks
			.filter(
				(task): task is Task =>
					Boolean(task.dueDate) &&
					ACTIVE_TASK_STATUSES.has(task.status) &&
					task.status !== 'Completed' &&
					(() => {
						const dueDate = new Date(task.dueDate);
						if (Number.isNaN(dueDate.getTime())) {
							return false;
						}
						return dueDate < now || dueDate <= maxDueDate;
					})(),
			)
			.sort((a, b) => {
				const aDue = new Date(a.dueDate).getTime();
				const bDue = new Date(b.dueDate).getTime();
				const aOverdue = aDue < now.getTime() ? 1 : 0;
				const bOverdue = bDue < now.getTime() ? 1 : 0;

				if (aOverdue !== bOverdue) return bOverdue - aOverdue;
				if (aDue !== bDue) return aDue - bDue;

				const aPriority = PRIORITY_RANK[a.priority || 'Low'] || 1;
				const bPriority = PRIORITY_RANK[b.priority || 'Low'] || 1;
				return bPriority - aPriority;
			})
			.slice(0, HOME_ACTIVITY_LIST_LIMIT);
	}, [filteredTasks, ACTIVE_TASK_STATUSES, PRIORITY_RANK, DASHBOARD_DUE_WINDOW_DAYS]);

	const nextUrgentTask = urgentTasks[0] || null;
	const todayUrgentTasks = useMemo(
		() => urgentTasks.slice(0, TODAY_ACTION_LIMIT),
		[urgentTasks],
	);

	const todayFocusLead = useMemo(() => {
		if (taskStatusCounts.overdue > 0 && nextUrgentTask) {
			return `${taskStatusCounts.overdue} ${taskStatusCounts.overdue === 1 ? 'task is' : 'tasks are'
				} overdue. Start with ${nextUrgentTask.title}.`;
		}

		if (nextUrgentTask) {
			return `Next up: ${nextUrgentTask.title}.`;
		}

		return 'You are caught up for today.';
	}, [taskStatusCounts.overdue, nextUrgentTask]);

	const todayFocusSupport = useMemo(() => {
		if (nextUrgentTask) {
			const remainingUpcoming = Math.max(taskStatusCounts.upcoming - 1, 0);
			if (remainingUpcoming > 0) {
				return `${remainingUpcoming} more ${remainingUpcoming === 1 ? 'task is' : 'tasks are'
					} due soon after that.`;
			}
			return 'Handle this first to keep the rest of the list easier to manage.';
		}

		if (taskStatusCounts.completed > 0) {
			return 'Use this window to plan preventive maintenance before it becomes urgent.';
		}

		return 'Add the next planned maintenance task while the queue is clear.';
	}, [nextUrgentTask, taskStatusCounts.upcoming, taskStatusCounts.completed]);

	const overdueUrgentTasks = useMemo(
		() =>
			todayUrgentTasks.filter(
				(task) => new Date(task.dueDate).getTime() < Date.now(),
			),
		[todayUrgentTasks],
	);

	const dueSoonUrgentTasks = useMemo(
		() =>
			todayUrgentTasks.filter(
				(task) => new Date(task.dueDate).getTime() >= Date.now(),
			),
		[todayUrgentTasks],
	);

	const formatUrgentDueLabel = (task: Task) => {
		const due = new Date(task.dueDate);
		const now = new Date();
		if (Number.isNaN(due.getTime())) {
			return getTaskTimingLabel(task);
		}

		const diffMs = due.getTime() - now.getTime();
		const dayMs = 24 * 60 * 60 * 1000;
		const diffDays = Math.ceil(diffMs / dayMs);

		if (diffDays < 0) {
			const absDays = Math.abs(diffDays);
			return `Overdue by ${absDays} day${absDays === 1 ? '' : 's'}`;
		}
		if (diffDays === 0) {
			return 'Due today';
		}
		if (diffDays === 1) {
			return 'Due tomorrow';
		}
		return `Due in ${diffDays} days`;
	};

	const formatActivityDate = (value: Date) =>
		value.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});

	const formatTimelineDate = (value: Date) =>
		value.toLocaleDateString(undefined, {
			month: 'numeric',
			day: 'numeric',
			year: '2-digit',
		});

	const getUrgentTaskPropertyName = useCallback((task: Task) => {
		return (
			propertyLookup.get(task.propertyId)?.title ||
			task.propertyTitle ||
			task.property ||
			'Property'
		);
	}, [propertyLookup]);

	const homeTimelineEntries = useMemo<HomeTimelineEntry[]>(() => {
		const sourceRecords = dashboardMaintenanceHistory.length
			? dashboardMaintenanceHistory
			: scopedMaintenanceHistory;
		const entries: HomeTimelineEntry[] = [];

		sourceRecords.forEach((record: any) => {
			const eventDateValue = getMaintenanceEventDate(record);
			const eventDate = new Date(eventDateValue || '');
			if (Number.isNaN(eventDate.getTime())) return;

			const recordPropertyId = String(record?.propertyId || '').trim();
			const propertyName =
				propertyLookup.get(recordPropertyId)?.title ||
				String(record?.propertyTitle || record?.property || '').trim() ||
				'Home';

			entries.push({
				id: `maintenance-${String(record?.id || `${propertyName}-${eventDateValue}`).trim()}`,
				type: 'maintenance',
				title: getMaintenanceEventTitle(record) || 'Maintenance completed',
				meta: `${propertyName} - Service record`,
				date: eventDate,
				dateLabel: formatTimelineDate(eventDate),
			});
		});

		filteredTasks.forEach((task) => {
			const completionValue = String(task.completionDate || task.approvedAt || '').trim();
			if (!completionValue) return;

			const dateValue = completionValue;
			const eventDate = new Date(dateValue);
			if (Number.isNaN(eventDate.getTime())) return;

			const propertyName = getUrgentTaskPropertyName(task);
			const displayStatus = getTaskDisplayStatus(task).label;

			entries.push({
				id: `task-${task.id}-${dateValue}`,
				type: 'task',
				title: `${task.title} completed`,
				meta: `${propertyName} - ${displayStatus}`,
				date: eventDate,
				dateLabel: formatTimelineDate(eventDate),
			});
		});

		allProperties.forEach((property: any) => {
			const propertyName = String(property?.title || 'Home').trim();

			const propertyDocuments = getEmbeddedPropertyDocuments(property);
			if (propertyDocuments.length > 0) {
				propertyDocuments.forEach((document: any) => {
					const uploadedAt = new Date(String(document?.uploadedAt || document?.updatedAt || ''));
					if (Number.isNaN(uploadedAt.getTime())) return;

					entries.push({
						id: `document-${String(document?.id || document?.name || uploadedAt.toISOString()).trim()}`,
						type: 'document',
						title: `${String(document?.name || document?.fileName || 'Document').trim()} added`,
						meta: `${propertyName} - Document`,
						date: uploadedAt,
						dateLabel: formatTimelineDate(uploadedAt),
					});
				});
			}

			const createdAt = new Date(String(property?.createdAt || ''));
			if (!Number.isNaN(createdAt.getTime())) {
				entries.push({
					id: `home-created-${property.id}`,
					type: 'home',
					title: `${propertyName} added to Maintley`,
					meta: 'Home record',
					date: createdAt,
					dateLabel: formatTimelineDate(createdAt),
				});
			}
		});

		return entries
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.slice(0, HOME_ACTIVITY_LIST_LIMIT);
	}, [
		allProperties,
		dashboardMaintenanceHistory,
		filteredTasks,
		getUrgentTaskPropertyName,
		propertyLookup,
		scopedMaintenanceHistory,
	]);

	const homeActivityTabs = useMemo(
		() => [
			{
				key: 'needs_attention' as HomeActivityTabKey,
				label: 'Needs Attention',
				description:
					'Overdue and upcoming maintenance tasks grouped so you can decide what to handle next.',
			},
			{
				key: 'home_timeline' as HomeActivityTabKey,
				label: 'Home Timeline',
				description:
					'A chronological view of completed tasks, service records, documents, and home updates.',
			},
		],
		[],
	);

	const getUrgentTaskAssignee = (task: Task) => {
		if (task.assignedTo?.name) {
			return `Assigned to ${task.assignedTo.name}`;
		}

		const assigneeId = String(task.assignedTo?.id || task.assignee || '').trim();
		if (!assigneeId) {
			return 'Unassigned';
		}

		const member = teamMembers.find((teamMember) => teamMember.id === assigneeId);
		if (!member) {
			return 'Assigned';
		}

		const displayName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
		return `Assigned to ${displayName || member.email || 'team member'}`;
	};

	const handleOpenTask = (taskId: string) => {
		setDashboardTaskPrefill(null);
		handleEditTask([taskId]);
	};

	const handleOpenCreateTask = (
		prefill: DashboardSuggestedTaskPrefill | null = null,
	) => {
		setEditingTaskId(null);
		setDashboardTaskPrefill(prefill);
		setShowTaskDialog(true);
	};

	const handleStartTask = async (task: Task) => {
		if (!task?.id) {
			return;
		}
		handleOpenTask(task.id);
	};

	const handleCompleteTask = (taskId: string) => {
		setCompletingTaskId(taskId);
		setShowTaskCompletionModal(true);
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
	};

	const handleSubscriptionAction = () => {
		if (!nativeApp) {
			navigate('/paywall');
			return;
		}

		void openSubscriptionManagementInBrowser();
	};

	const getSingleAffectedPropertySlug = (
		suggestion: DashboardIntelligenceSuggestion,
	): string => {
		if (suggestion.affectedPropertyIds.length !== 1) {
			return '';
		}

		return propertyLookup.get(suggestion.affectedPropertyIds[0])?.slug || '';
	};

	const handleOpenDashboardSuggestion = (
		suggestion: DashboardIntelligenceSuggestion,
	) => {
		const singlePropertySlug = getSingleAffectedPropertySlug(suggestion);

		switch (suggestion.suggestedActionType) {
			case 'open_task': {
				const taskId = suggestion.relatedTaskIds.find((id) =>
					dashboardTaskLookup.has(id),
				);
				if (taskId && suggestion.relatedTaskIds.length === 1) {
					handleOpenTask(taskId);
					return;
				}
				navigate('/tasks');
				return;
			}
			case 'create_task':
				handleOpenCreateTask(suggestion.suggestedTask || null);
				return;
			case 'edit_property':
				navigate(singlePropertySlug ? `/property/${singlePropertySlug}` : '/properties');
				return;
			case 'add_asset':
			case 'add_system':
				navigate(
					singlePropertySlug
						? `/property/${singlePropertySlug}?tab=devices&action=create-system`
						: '/devices?action=create',
				);
				return;
			case 'open_maintenance':
				navigate(singlePropertySlug ? `/property/${singlePropertySlug}` : '/properties');
				return;
			case 'edit_asset':
			case 'edit_system':
			case 'open_assets':
			case 'open_systems':
				navigate(
					singlePropertySlug
						? `/property/${singlePropertySlug}?tab=devices`
						: '/devices',
				);
				return;
			default:
				navigate('/tasks');
		}
	};

	if (
		!isUserTenant &&
		!isLoadingProperties &&
		availableProperties.length === 0
	) {
		return (
			<AppZeroState
				kind='noProperties'
				context={isHomeowner ? 'homeowner' : 'property'}
				actions={[
					{
						label: isHomeowner ? 'Add Home' : 'Add Property',
						onClick: () => navigate('/properties?openCreate=1'),
					},
				]}
				fullPage
			/>
		);
	}

	return (
		<StandardAppPage>
			{/* Scheduled Subscription Banner */}
			{!isTeamMemberAccount &&
				currentUser?.subscription?.hasScheduledSubscription &&
				currentUser?.subscription?.scheduledPlan &&
				currentUser?.subscription?.trialEndsAt && (
					<ScheduledSubscriptionBanner
						scheduledPlan={currentUser.subscription.scheduledPlan}
						trialEndsAt={currentUser.subscription.trialEndsAt}
						onManageClick={() => navigate('/settings')}
					/>
				)}

			{/* Legacy access-period warning banner */}
			{!isTeamMemberAccount &&
				currentUser?.subscription?.status === 'trial' &&
				!currentUser?.subscription?.hasScheduledSubscription && (
					<TrialWarningBanner
						daysRemaining={getTrialDaysRemaining(
							currentUser.subscription as any,
						)}
						onUpgradeClick={handleSubscriptionAction}
					/>
				)}
			{!isTeamMemberAccount &&
				currentUser?.subscription &&
				isTrialExpired(currentUser.subscription) && (
					<ExpiredTrialBanner onUpgradeClick={handleSubscriptionAction} />
				)}

			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>{TODAY_PAGE_LABEL}</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						{dashboardFraming.pageSubtitle}
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
				<DashboardHeaderActions>
					<DashboardScopeControl aria-label='Today view'>
						<DashboardScopeButton
							type='button'
							$isActive={dashboardScope === 'my_focus'}
							aria-pressed={dashboardScope === 'my_focus'}
							onClick={() => {
								void handleDashboardScopeChange('my_focus');
							}}>
							My Focus
						</DashboardScopeButton>
						<DashboardScopeButton
							type='button'
							$isActive={dashboardScope === 'all_visible_properties'}
							aria-pressed={dashboardScope === 'all_visible_properties'}
							onClick={() => {
								void handleDashboardScopeChange('all_visible_properties');
							}}>
							All Work
						</DashboardScopeButton>
					</DashboardScopeControl>
					{availableProperties.length > 1 && (
						<DashboardDesktopPropertyFilter>
							Home
							<select
								value={selectedPropertyId}
								onChange={(event) =>
									setSelectedPropertyId(event.target.value)
								}>
								<option value=''>All homes</option>
								{availableProperties.map((property) => (
									<option key={property.id} value={String(property.id)}>
										{property.title || 'Untitled Property'}
									</option>
								))}
							</select>
						</DashboardDesktopPropertyFilter>
					)}
				</DashboardHeaderActions>
			</StandardAppPageHeader>

			{availableProperties.length > 1 && (
				<FloatingFilterPanel
					isOpen={isFilterPanelOpen}
					onOpen={openFilterPanel}
					onDismiss={dismissFilterPanel}
					onApply={applyPropertyFilter}
					onClearDraft={() => setDraftPropertyId('')}
					activeFilterCount={selectedPropertyId ? 1 : 0}
					title='Filter dashboard'
					description='Choose the property you want to see, then apply your change.'>
					<DashboardPropertyFilter>
						Property
						<select
							value={draftPropertyId}
							onChange={(event) => setDraftPropertyId(event.target.value)}>
							<option value=''>All properties</option>
							{availableProperties.map((property) => (
								<option key={property.id} value={String(property.id)}>
									{property.title || 'Untitled Property'}
								</option>
							))}
						</select>
					</DashboardPropertyFilter>
				</FloatingFilterPanel>
			)}

			{/* Action-first top section */}
			<ActionFirstTopSection>
				<TodayFocusCard>
					<CardEyebrow>{dashboardFraming.focusEyebrow}</CardEyebrow>
					<CardTitle>{dashboardFraming.focusTitle}</CardTitle>
					<TodayFocusLead>{todayFocusLead}</TodayFocusLead>
					<TodayFocusSupportingText>
						{todayFocusSupport}
					</TodayFocusSupportingText>
					{nextUrgentTask && (
						<TodayFocusTaskCard>
							<TitleRow>
								<TodayFocusTaskName>{nextUrgentTask.title}</TodayFocusTaskName>
								<TaskStatusBadge $status={getTaskDisplayStatus(nextUrgentTask).label}>
									{getTaskDisplayStatus(nextUrgentTask).label}
								</TaskStatusBadge>
							</TitleRow>
							<TodayFocusTaskMeta>
								{formatUrgentDueLabel(nextUrgentTask)}
								{' • '}
								{getUrgentTaskPropertyName(nextUrgentTask)}
							</TodayFocusTaskMeta>
						</TodayFocusTaskCard>
					)}
					<TodayFocusButtons>
						<FocusButton
							onClick={() => {
								if (nextUrgentTask) {
									void handleStartTask(nextUrgentTask);
									return;
								}
								navigate('/tasks');
							}}>
							{nextUrgentTask ? 'Open Task' : 'Open Task List'}
						</FocusButton>
						{nextUrgentTask && (
							<FocusButton
								$variant='success'
								onClick={() => handleCompleteTask(nextUrgentTask.id)}>
								Complete
							</FocusButton>
						)}
						{urgentTasks.length > 0 && (
							<button
								onClick={() => navigate('/tasks')}
								style={{
									alignSelf: 'center',
									marginLeft: 'auto',
									fontSize: '0.82rem',
									fontWeight: 600,
									color: 'inherit',
									opacity: 0.55,
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									padding: 0,
									whiteSpace: 'nowrap',
								}}>
								View all tasks →
							</button>
						)}
					</TodayFocusButtons>
				</TodayFocusCard>

				<IntelligenceReadinessCard>
					<IntelligenceReadinessHeader>
						<CardEyebrow>Maintley Intelligence</CardEyebrow>
						<IntelligenceReadinessHelp>
							<IntelligenceReadinessHelpButton
								type='button'
								aria-label='How Maintley Intelligence readiness works'
								title='How readiness works'
								onClick={() => setIsReadinessHelpOpen(true)}>
								<FontAwesomeIcon icon={faCircleInfo} aria-hidden='true' />
							</IntelligenceReadinessHelpButton>
						</IntelligenceReadinessHelp>
					</IntelligenceReadinessHeader>
					<IntelligenceReadinessIntro>
						<IntelligenceReadinessTitle>
							Guidance readiness
						</IntelligenceReadinessTitle>
						<IntelligenceReadinessDescription>
							{readinessScopeLabel}. See what Maintley can currently understand from the records saved in this view.
						</IntelligenceReadinessDescription>
					</IntelligenceReadinessIntro>
					<IntelligenceReadinessCategories>
						{intelligenceReadiness.categories.map((category) => (
							<IntelligenceReadinessCategory
								key={category.id}
								type='button'
								$clickable
								aria-label={`Explain ${category.title.toLowerCase()} readiness by property`}
								title={`View ${category.title.toLowerCase()} details`}
								onClick={() => setSelectedReadinessCategoryId(category.id)}>
								<IntelligenceReadinessCategoryTitle>
									{category.title}
								</IntelligenceReadinessCategoryTitle>
								<IntelligenceReadinessLevel $level={category.level}>
									{category.levelLabel}
								</IntelligenceReadinessLevel>
								<IntelligenceReadinessSummary>
									{category.summary}
								</IntelligenceReadinessSummary>
								<IntelligenceReadinessNextStep>
									Next: {getReadinessNextStep(category)}
								</IntelligenceReadinessNextStep>
							</IntelligenceReadinessCategory>
						))}
					</IntelligenceReadinessCategories>
					{propertyIntelligenceReadiness.length > 0 && (
						<IntelligenceReadinessFooter>
							<IntelligenceReadinessReviewButton
								type='button'
								onClick={handleReadinessReviewAction}>
								{propertyIntelligenceReadiness.length === 1
									? `Open ${propertyIntelligenceReadiness[0].propertyTitle} Review`
									: `Choose a ${readinessRecordLabel} to review`}
							</IntelligenceReadinessReviewButton>
						</IntelligenceReadinessFooter>
					)}
				</IntelligenceReadinessCard>

				{dashboardSuggestion && (
					<DashboardIntelligenceCard>
						<DashboardIntelligenceHeader>
							<CardEyebrow>Maintley Intelligence</CardEyebrow>
							<DashboardIntelligenceSourcePill>
								{getDashboardSuggestionSourceLabel(dashboardSuggestion)}
							</DashboardIntelligenceSourcePill>
						</DashboardIntelligenceHeader>
						<CardTitle>Recommended Next Step</CardTitle>
						<DashboardIntelligenceRecommendationTitle>
							{dashboardSuggestion.title}
						</DashboardIntelligenceRecommendationTitle>
						{dashboardSuggestion.contextLabel && (
							<DashboardIntelligenceContext>
								{dashboardSuggestion.contextLabel}
							</DashboardIntelligenceContext>
						)}
						<DashboardIntelligenceImpact>
							{dashboardSuggestion.whyItMatters}
						</DashboardIntelligenceImpact>
						{(dashboardSuggestion.evidenceDetails?.length ||
							dashboardSuggestion.evidenceSummary) && (
							<DashboardIntelligenceEvidence>
								<summary>Why</summary>
								<div className='evidence-content'>
									{dashboardSuggestion.evidenceDetails?.length ? (
										dashboardSuggestion.evidenceDetails.map((detail, index) => (
											<span className='evidence-line' key={`${detail.label}-${index}`}>
												{detail.text}
											</span>
										))
									) : (
										<span className='evidence-text'>
											{dashboardSuggestion.evidenceSummary}
										</span>
									)}
								</div>
							</DashboardIntelligenceEvidence>
						)}
						<DashboardIntelligenceActions>
							<FocusButton
								type='button'
								onClick={() =>
									handleOpenDashboardSuggestion(dashboardSuggestion)
								}>
								{dashboardSuggestion.suggestedActionLabel}
							</FocusButton>
						</DashboardIntelligenceActions>
					</DashboardIntelligenceCard>
				)}
			</ActionFirstTopSection>

			<HomeActivitySection id='home-activity'>
				<HomeActivityHeader>
					<HomeActivityTabs aria-label='Home activity views'>
						{homeActivityTabs.map((tab) => (
							<HomeActivityTab
								key={tab.key}
								type='button'
								$active={activeHomeActivityTab === tab.key}
								aria-pressed={activeHomeActivityTab === tab.key}
								onClick={() => setActiveHomeActivityTab(tab.key)}>
							{tab.label}
						</HomeActivityTab>
					))}
				</HomeActivityTabs>
				</HomeActivityHeader>

				<HomeActivityContent>
					{activeHomeActivityTab === 'needs_attention' && (
						<>
							{urgentTasks.length === 0 ? (
								filteredTasks.length === 0 ? (
									dashboardScope === 'my_focus' ? (
										<UrgentQueueEmpty>
											No tasks assigned to you right now.
										</UrgentQueueEmpty>
									) : (
										<AppZeroState
											kind='noTasks'
											actions={[
												{
													label: 'Add Task',
													onClick: () => handleOpenCreateTask(),
												},
											]}
										/>
									)
								) : (
									<UrgentQueueEmpty>Nothing needing attention right now. Great job.</UrgentQueueEmpty>
								)
							) : (
								<UrgentTaskList>
									{overdueUrgentTasks.length > 0 && (
										<UrgentTaskGroup>
											<UrgentTaskGroupLabel>Overdue</UrgentTaskGroupLabel>
											{overdueUrgentTasks.map((task) => (
												<UrgentTaskRow
													key={task.id}
													onClick={() => handleOpenTask(task.id)}>
													<UrgentTaskMain>
														<TitleRow>
															<UrgentTaskTitle>{task.title}</UrgentTaskTitle>
															<TaskStatusBadge $status={getTaskDisplayStatus(task).label}>
																{getTaskDisplayStatus(task).label}
															</TaskStatusBadge>
														</TitleRow>
														<UrgentTaskContext>
															<UrgentTaskProperty>
																{getUrgentTaskPropertyName(task)}
															</UrgentTaskProperty>
															<UrgentTaskAssignee>
																{getUrgentTaskAssignee(task)}
															</UrgentTaskAssignee>
														</UrgentTaskContext>
														<UrgentTaskMeta>
															<UrgentTaskDue>{formatUrgentDueLabel(task)}</UrgentTaskDue>
															<UrgentTaskPriority $priority={task.priority || 'Low'}>
																{task.priority || 'Low'}
															</UrgentTaskPriority>
														</UrgentTaskMeta>
													</UrgentTaskMain>
													<UrgentTaskActions>
														<UrgentActionButton
															$variant='success'
															onClick={(event) => {
																event.stopPropagation();
																handleCompleteTask(task.id);
															}}>
															Complete
														</UrgentActionButton>
														<UrgentActionButton
															$variant='secondary'
															onClick={(event) => {
																event.stopPropagation();
																handleAssignTask(task.id);
															}}>
															Assign
														</UrgentActionButton>
													</UrgentTaskActions>
												</UrgentTaskRow>
											))}
										</UrgentTaskGroup>
									)}
									{dueSoonUrgentTasks.length > 0 && (
										<UrgentTaskGroup>
											<UrgentTaskGroupLabel>Due Soon</UrgentTaskGroupLabel>
											{dueSoonUrgentTasks.map((task) => (
												<UrgentTaskRow
													key={task.id}
													onClick={() => handleOpenTask(task.id)}>
													<UrgentTaskMain>
														<TitleRow>
															<UrgentTaskTitle>{task.title}</UrgentTaskTitle>
															<TaskStatusBadge $status={getTaskDisplayStatus(task).label}>
																{getTaskDisplayStatus(task).label}
															</TaskStatusBadge>
														</TitleRow>
														<UrgentTaskContext>
															<UrgentTaskProperty>
																{getUrgentTaskPropertyName(task)}
															</UrgentTaskProperty>
															<UrgentTaskAssignee>
																{getUrgentTaskAssignee(task)}
															</UrgentTaskAssignee>
														</UrgentTaskContext>
														<UrgentTaskMeta>
															<UrgentTaskDue>{formatUrgentDueLabel(task)}</UrgentTaskDue>
															<UrgentTaskPriority $priority={task.priority || 'Low'}>
																{task.priority || 'Low'}
															</UrgentTaskPriority>
														</UrgentTaskMeta>
													</UrgentTaskMain>
													<UrgentTaskActions>
														<UrgentActionButton
															$variant='success'
															onClick={(event) => {
																event.stopPropagation();
																handleCompleteTask(task.id);
															}}>
															Complete
														</UrgentActionButton>
														<UrgentActionButton
															$variant='secondary'
															onClick={(event) => {
																event.stopPropagation();
																handleAssignTask(task.id);
															}}>
															Assign
														</UrgentActionButton>
													</UrgentTaskActions>
												</UrgentTaskRow>
											))}
										</UrgentTaskGroup>
									)}
								</UrgentTaskList>
							)}
						</>
					)}

					{activeHomeActivityTab === 'home_timeline' && (
						<>
							{homeTimelineEntries.length === 0 ? (
								<RecentActivityEmpty>
									<p>Tasks, service records, documents, and home updates will appear here as your home history grows.</p>
									<FocusButton
										type='button'
										onClick={() => handleOpenCreateTask()}>
										Add Task
									</FocusButton>
								</RecentActivityEmpty>
							) : (
								<HomeTimelineList>
									{homeTimelineEntries.map((entry) => (
										<HomeTimelineRow key={entry.id}>
											<HomeTimelineDate>
												{entry.dateLabel}
												<HomeTimelineDateSub>
													{formatActivityDate(entry.date)}
												</HomeTimelineDateSub>
											</HomeTimelineDate>
											<HomeTimelineMain>
												<HomeTimelineTitleRow>
													<HomeTimelineTitle>{entry.title}</HomeTimelineTitle>
													<HomeTimelineBadge $type={entry.type}>
														{entry.type === 'maintenance'
															? 'Service'
															: entry.type === 'document'
																? 'Document'
																: entry.type === 'home'
																	? 'Home'
																	: 'Task'}
													</HomeTimelineBadge>
												</HomeTimelineTitleRow>
												<HomeTimelineMeta>{entry.meta}</HomeTimelineMeta>
											</HomeTimelineMain>
										</HomeTimelineRow>
									))}
								</HomeTimelineList>
							)}
						</>
					)}
				</HomeActivityContent>
			</HomeActivitySection>

			<GenericModal
				isOpen={Boolean(selectedReadinessCategoryId)}
				title={selectedReadinessCategory?.title || 'Readiness details'}
				onClose={() => setSelectedReadinessCategoryId(null)}
				showActions={false}
				compact>
				<IntelligenceReadinessDialogBody>
					<IntelligenceReadinessDialogLead>
						{selectedReadinessCategory?.summary}
					</IntelligenceReadinessDialogLead>
					<IntelligenceReadinessDialogSubhead>
						Readiness by property
					</IntelligenceReadinessDialogSubhead>
					<IntelligenceReadinessPropertyList>
						{selectedReadinessCategoryId &&
							propertyIntelligenceReadiness.map((property) => {
								const category = getPropertyReadinessCategory(
									property,
									selectedReadinessCategoryId,
								);
								if (!category) return null;
								return (
									<IntelligenceReadinessPropertyCard key={property.propertyId}>
										<IntelligenceReadinessPropertyHeader>
											<IntelligenceReadinessPropertyTitle>
												{property.propertyTitle}
											</IntelligenceReadinessPropertyTitle>
											<IntelligenceReadinessPropertyLevel $level={category.level}>
												{category.levelLabel}
											</IntelligenceReadinessPropertyLevel>
										</IntelligenceReadinessPropertyHeader>
										<IntelligenceReadinessSummary>
											{category.summary}
										</IntelligenceReadinessSummary>
										<IntelligenceReadinessEvidenceList>
											{getReadinessEvidenceLines(category).map((line) => (
												<IntelligenceReadinessEvidenceItem key={line}>
													{line}
												</IntelligenceReadinessEvidenceItem>
											))}
										</IntelligenceReadinessEvidenceList>
										<IntelligenceReadinessPropertyAction
											type='button'
											onClick={() =>
												openIntelligenceReviewForProperty(property.propertySlug)
											}>
											Open {property.propertyTitle} Insights
										</IntelligenceReadinessPropertyAction>
									</IntelligenceReadinessPropertyCard>
								);
							})}
					</IntelligenceReadinessPropertyList>
					<IntelligenceReadinessDialogNote>
						Maintley uses saved schedules, general Maintley guidance, and recorded maintenance history. It does not inspect equipment or predict equipment failure.
					</IntelligenceReadinessDialogNote>
				</IntelligenceReadinessDialogBody>
			</GenericModal>

			<GenericModal
				isOpen={isReadinessPropertyChooserOpen}
				title={`Choose a ${readinessRecordLabel} to review`}
				onClose={() => setIsReadinessPropertyChooserOpen(false)}
				showActions={false}
				compact>
				<IntelligenceReadinessDialogBody>
					<IntelligenceReadinessDialogLead>
						Choose the property whose saved records and Maintley guidance you want to review.
					</IntelligenceReadinessDialogLead>
					<IntelligenceReadinessPropertyList>
						{propertyIntelligenceReadiness.map((property) => (
							<IntelligenceReadinessPropertyCard key={property.propertyId}>
								<IntelligenceReadinessPropertyTitle>
									{property.propertyTitle}
								</IntelligenceReadinessPropertyTitle>
								<IntelligenceReadinessFractions>
									<IntelligenceReadinessFraction>
									Recorded {formatReadinessFraction(property, 'equipment_context')}
									</IntelligenceReadinessFraction>
									<IntelligenceReadinessFraction>
									Scheduled {formatReadinessFraction(property, 'maintenance_coverage')}
									</IntelligenceReadinessFraction>
									<IntelligenceReadinessFraction>
									Informed {formatReadinessFraction(property, 'service_history')}
									</IntelligenceReadinessFraction>
								</IntelligenceReadinessFractions>
								<IntelligenceReadinessPropertyAction
									type='button'
									onClick={() =>
										openIntelligenceReviewForProperty(property.propertySlug)
									}>
									Open {property.propertyTitle} Review
								</IntelligenceReadinessPropertyAction>
							</IntelligenceReadinessPropertyCard>
						))}
					</IntelligenceReadinessPropertyList>
					<IntelligenceReadinessDialogFooter>
						Fractions show supported records out of applicable records
					</IntelligenceReadinessDialogFooter>
				</IntelligenceReadinessDialogBody>
			</GenericModal>

			<GenericModal
				isOpen={isReadinessHelpOpen}
				title='Maintley Intelligence readiness'
				onClose={() => setIsReadinessHelpOpen(false)}
				showActions={false}
				compact>
				<IntelligenceReadinessDialogBody>
					<IntelligenceReadinessDialogLead>
						Readiness shows what guidance Maintley can provide from the records saved for this {readinessRecordLabel}. It does not describe the physical condition of the {readinessRecordLabel}.
					</IntelligenceReadinessDialogLead>
					<IntelligenceReadinessDialogSubhead>What the levels mean</IntelligenceReadinessDialogSubhead>
					<IntelligenceReadinessDialogSection>
						<strong>Recorded</strong>
						<span>
							Maintley recognizes the equipment type and can provide equipment-specific guidance.
						</span>
					</IntelligenceReadinessDialogSection>
					<IntelligenceReadinessDialogSection>
						<strong>Scheduled</strong>
						<span>
							The equipment has a usable recurring task and due date, so Maintley can show upcoming care.
						</span>
					</IntelligenceReadinessDialogSection>
					<IntelligenceReadinessDialogSection>
						<strong>Informed</strong>
						<span>
							Comparable dated service events provide enough history for recorded-pattern guidance. This does not predict failure.
						</span>
					</IntelligenceReadinessDialogSection>
					<IntelligenceReadinessDialogNote>
						Readiness is separate from your plan. Adding records does not change your subscription or grant access to paid features.
					</IntelligenceReadinessDialogNote>
					<IntelligenceReadinessDialogFooter>
						Based only on saved Maintley records
					</IntelligenceReadinessDialogFooter>
				</IntelligenceReadinessDialogBody>
			</GenericModal>

			{/* Task Completion Modal */}
			{showTaskCompletionModal && completingTaskId && (
				<TaskCompletionModal
					taskId={completingTaskId}
					taskTitle={
						dashboardTaskLookup.get(completingTaskId)?.title || ''
					}
					task={dashboardTaskLookup.get(completingTaskId)}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}

			<TaskModal
				isOpen={showTaskDialog}
				onClose={() => {
					setShowTaskDialog(false);
					setDashboardTaskPrefill(null);
				}}
				onSaved={() => {
					setDashboardTaskPrefill(null);
					void refetchTasks();
				}}
				editingTaskId={editingTaskId}
				initialTask={editingTaskId ? null : dashboardTaskPrefill}
				editingTask={
					editingTaskId ? dashboardTaskLookup.get(editingTaskId) || null : null
				}
				isEditing={!!editingTaskId}
				currentUser={currentUser}
				propertyOptions={allProperties.map((p) => ({
					label: p.title,
					value: p.id,
				}))}
			/>

			<TaskAssignModal
				isOpen={showTaskAssignDialog}
				onClose={() => setShowTaskAssignDialog(false)}
				task={
					assigningTaskId
						? dashboardTaskLookup.get(assigningTaskId) || null
						: null
				}
				propertyId={
					assigningTaskId
						? dashboardTaskLookup.get(assigningTaskId)?.propertyId || ''
						: ''
				}
				selectedAssignee={
					assigningTaskId
						? dashboardTaskLookup.get(assigningTaskId)?.assignedTo
						: null
				}
			/>
		</StandardAppPage>
	);
};
