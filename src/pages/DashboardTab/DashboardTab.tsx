import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { setCurrentUser } from 'Redux/Slices/userSlice';
import { Task } from 'types/Task.types';
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
	isContinuityEvent,
} from 'utils/maintenanceEventUtils';
import {
	runDashboardIntelligence,
	type DashboardIntelligenceSuggestion,
	type DashboardSuggestedTaskPrefill,
} from 'intelligence/consumers/portfolioDashboard';
import { TaskCompletionModal } from 'Components/TaskCompletionModal';
import { TrialWarningBanner } from 'Components/TrialWarningBanner/TrialWarningBanner';
import { ExpiredTrialBanner } from 'Components/ExpiredTrialBanner/ExpiredTrialBanner';
import { ScheduledSubscriptionBanner } from 'Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner';
import {
	getEffectiveSubscriptionPlanId,
	getTrialDaysRemaining,
	isTrialExpired,
} from 'utils/subscriptionUtils';
import { USER_ROLES } from 'constants/roles';
import {
	handleCheckoutSuccess,
	syncSubscriptionFromStripe,
} from 'services/stripeService';
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
	PortfolioHealthCard,
	PortfolioHeaderText,
	PortfolioMetrics,
	PortfolioMetric,
	PortfolioMetricLabel,
	PortfolioMetricValue,
	DashboardIntelligenceCard,
	DashboardIntelligenceHeader,
	DashboardIntelligenceSourcePill,
	DashboardIntelligenceContext,
	DashboardIntelligenceImpact,
	DashboardIntelligenceActions,
	RecentActivitySection,
	RecentActivityHeader,
	RecentActivitySubtitle,
	RecentActivityList,
	RecentActivityRow,
	RecentActivityMain,
	RecentActivityTitle,
	RecentActivityMeta,
	RecentActivityDate,
	RecentActivityEmpty,
	UrgentQueueSection,
	UrgentQueueHeader,
	QueueHeaderActions,
	QueueFilterPill,
	UrgentQueueSubtitle,
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
import { FloatingFilterPanel, TaskModal } from 'Components/Library';
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

const getLinkedDeviceIds = (task: Partial<Task> & { deviceId?: string | number }): Set<string> => {
	const ids = new Set<string>();
	if (Array.isArray(task.devices)) {
		task.devices.forEach((deviceId) => {
			if (deviceId !== undefined && deviceId !== null) {
				ids.add(String(deviceId));
			}
		});
	}
	if (task.deviceId !== undefined && task.deviceId !== null) {
		ids.add(String(task.deviceId));
	}
	return ids;
};

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
	const location = useLocation();
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

	// Handle Stripe checkout success
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const sessionId = urlParams.get('session_id');

		if (sessionId && currentUser) {
			const currentHash = window.location.hash;
			const cleanHash = currentHash.replace(/[?&]session_id=[^&]*/, '');
			window.history.replaceState(
				{},
				'',
				window.location.pathname + window.location.search + cleanHash,
			);

			handleCheckoutSuccess(sessionId)
				.then(() => {
					window.location.reload();
				})
				.catch((error) => {
					console.error('Checkout verification failed:', error);
				});
		}
	}, [location.search, currentUser]);

	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [dashboardTaskPrefill, setDashboardTaskPrefill] =
		useState<DashboardSuggestedTaskPrefill | null>(null);
	const hasAttemptedSubscriptionSyncRef = useRef(false);

	useEffect(() => {
		if (hasAttemptedSubscriptionSyncRef.current) {
			return;
		}

		if (!currentUser?.subscription?.stripeCustomerId) {
			return;
		}

		hasAttemptedSubscriptionSyncRef.current = true;
		syncSubscriptionFromStripe().catch((error) => {
			console.warn('Background Stripe subscription sync skipped:', error);
		});
	}, [currentUser?.subscription?.stripeCustomerId]);

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
		const propertyCountLabel = `${allProperties.length} ${
			allProperties.length === 1 ? 'home' : 'homes'
		}`;
		const systemsCountLabel = `${trackedSystemsCount} ${
			trackedSystemsCount === 1 ? 'equipment record' : 'equipment records'
		}`;
		const scopePill = isMyFocus
			? 'My Focus'
			: isSinglePropertyScope
				? 'One home view'
				: `${allProperties.length} homes in view`;
		const overviewEyebrow = isMyFocus
			? 'Your Homes'
			: isSinglePropertyScope
				? 'Home Overview'
				: 'Homes in View';
		const overviewText =
			allProperties.length === 0
				? 'No homes have assigned work in this view.'
				: `Current maintenance picture across ${propertyCountLabel} and ${systemsCountLabel}.`;

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
					queueTitle: isMyFocus ? 'Your Tasks' : 'Needing Attention',
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

	const deviceLookup = useMemo(
		() =>
			new Map(
				visibleDevices.map((device: any) => {
					const id = String(device?.id || '').trim();
					const name =
						[device?.type, device?.brand, device?.model]
							.filter(Boolean)
							.join(' ')
							.trim() || 'Appliance';
					return [id, name];
				}),
			),
		[visibleDevices],
	);

	const scopedMaintenanceHistory = useMemo(() => {
		const visiblePropertyIds = new Set(allProperties.map((property) => property.id));
		const visiblePropertyTitles = new Set(
			allProperties
				.map((property) => String((property as any).title || '').trim())
				.filter(Boolean),
		);

		return allMaintenanceHistory
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
	}, [allMaintenanceHistory, allProperties]);

	const dashboardIntelligenceHistory = useMemo(
		() =>
			dashboardMaintenanceHistory.length > 0
				? dashboardMaintenanceHistory
				: scopedMaintenanceHistory,
		[dashboardMaintenanceHistory, scopedMaintenanceHistory],
	);

	const effectivePlanId = useMemo(
		() =>
			getEffectiveSubscriptionPlanId(
				currentUser?.subscription as any,
				'homeowner',
			),
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
		if (dashboardMaintenanceHistory.length > 0) {
			return dashboardMaintenanceHistory.filter(isContinuityEvent).length;
		}

		if (scopedMaintenanceHistory.length > 0) {
			return scopedMaintenanceHistory.length;
		}

		// Legacy fallback for properties storing maintenance history directly.
		return allProperties.reduce((total, property: any) => {
			const taskHistoryCount = Array.isArray(property?.taskHistory)
				? property.taskHistory.length
				: 0;
			const maintenanceHistoryCount = Array.isArray(property?.maintenanceHistory)
				? property.maintenanceHistory.length
				: 0;
			return total + Math.max(taskHistoryCount, maintenanceHistoryCount);
		}, 0);
	}, [dashboardMaintenanceHistory, scopedMaintenanceHistory, allProperties]);

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

	const overdueDeviceIds = useMemo(() => {
		const now = Date.now();
		const ids = new Set<string>();

		filteredTasks.forEach((task) => {
			if (!task.dueDate || !ACTIVE_TASK_STATUSES.has(task.status)) {
				return;
			}

			if (new Date(task.dueDate).getTime() >= now) {
				return;
			}

			getLinkedDeviceIds(task).forEach((deviceId) => ids.add(deviceId));
		});

		return ids;
	}, [filteredTasks, ACTIVE_TASK_STATUSES]);

	const upcomingServiceWindowCount = useMemo(() => {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const maxDate = new Date(now);
		maxDate.setDate(maxDate.getDate() + 30);
		const dueSoonDeviceIds = new Set<string>();

		filteredTasks.forEach((task) => {
			if (!task.dueDate || !ACTIVE_TASK_STATUSES.has(task.status)) {
				return;
			}

			const dueDate = new Date(task.dueDate);
			if (Number.isNaN(dueDate.getTime())) {
				return;
			}
			dueDate.setHours(0, 0, 0, 0);

			if (dueDate < now || dueDate > maxDate) {
				return;
			}

			getLinkedDeviceIds(task).forEach((deviceId) => dueSoonDeviceIds.add(deviceId));
		});

		return dueSoonDeviceIds.size;
	}, [filteredTasks, ACTIVE_TASK_STATUSES]);

	const systemsNeedingAttentionCount = useMemo(
		() =>
			visibleDevices.filter((device: any) => {
				const status = String(device?.status || '');
				return (
					status === 'Broken' ||
					status === 'Maintenance' ||
					overdueDeviceIds.has(String(device.id))
				);
			}).length,
		[visibleDevices, overdueDeviceIds],
	);

	const maintenanceEventsThisMonth = useMemo(() => {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();

		const sourceRecords = dashboardMaintenanceHistory.length
			? dashboardMaintenanceHistory
			: scopedMaintenanceHistory;

		return sourceRecords.filter((record: any) => {
			const eventDate = new Date(getMaintenanceEventDate(record) || '');
			return (
				!Number.isNaN(eventDate.getTime()) &&
				eventDate.getMonth() === currentMonth &&
				eventDate.getFullYear() === currentYear
			);
		}).length;
	}, [dashboardMaintenanceHistory, scopedMaintenanceHistory]);

	const recentMaintenanceActivity = useMemo(() => {
		const sourceRecords = dashboardMaintenanceHistory.length
			? dashboardMaintenanceHistory
			: scopedMaintenanceHistory;

		const activity = sourceRecords
			.map((record: any) => {
				const timestamp = new Date(getMaintenanceEventDate(record) || '');
				if (Number.isNaN(timestamp.getTime())) {
					return null;
				}

				const recordPropertyId = String(record?.propertyId || '').trim();
				const propertyName =
					propertyLookup.get(recordPropertyId)?.title ||
					String(record?.propertyTitle || '').trim() ||
					'Property';

				const rawDeviceIds = Array.isArray(record?.deviceIds)
					? record.deviceIds
					: Array.isArray(record?.devices)
						? record.devices
						: record?.deviceId
							? [record.deviceId]
							: [];
				const normalizedDeviceIds = rawDeviceIds
					.map((id: any) => String(id).trim())
					.filter(Boolean);

				const deviceName = normalizedDeviceIds.length
					? deviceLookup.get(normalizedDeviceIds[0]) || 'Appliance'
					: 'Property-level';

				return {
					id:
						String(record?.id || '').trim() ||
						`${recordPropertyId}-${String(record?.completionDate || '')}-${String(record?.title || '')}`,
					timestamp,
					description: String(
						record?.title ||
						record?.description ||
						record?.completionNotes ||
						'Maintenance event logged',
					).trim(),
					deviceName,
					propertyName,
				};
			})
			.filter(Boolean)
			.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, 5);

		return activity;
	}, [
		dashboardMaintenanceHistory,
		scopedMaintenanceHistory,
		propertyLookup,
		deviceLookup,
	]);

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
			.slice(0, 5);
	}, [filteredTasks, ACTIVE_TASK_STATUSES, PRIORITY_RANK, DASHBOARD_DUE_WINDOW_DAYS]);

	const nextUrgentTask = urgentTasks[0] || null;

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
			urgentTasks.filter((task) => new Date(task.dueDate).getTime() < Date.now()),
		[urgentTasks],
	);

	const dueSoonUrgentTasks = useMemo(
		() =>
			urgentTasks.filter((task) => new Date(task.dueDate).getTime() >= Date.now()),
		[urgentTasks],
	);

	const formatUrgentDueLabel = (task: Task) => {
		const due = new Date(task.dueDate);
		const now = new Date();
		if (Number.isNaN(due.getTime())) {
			return 'No due date';
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

	const getUrgentTaskPropertyName = (task: Task) => {
		return (
			propertyLookup.get(task.propertyId)?.title ||
			task.propertyTitle ||
			task.property ||
			'Property'
		);
	};

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
					<StandardAppPageTitle>Dashboard</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						{dashboardFraming.pageSubtitle}
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
				<DashboardHeaderActions>
					<DashboardScopeControl aria-label='Dashboard view'>
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
								onClick={() =>
									document
										.getElementById('urgent-task-queue')
										?.scrollIntoView({ behavior: 'smooth', block: 'start' })
								}
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
								View all →
							</button>
						)}
					</TodayFocusButtons>
				</TodayFocusCard>

				<PortfolioHealthCard>
					<CardEyebrow>{dashboardFraming.overviewEyebrow}</CardEyebrow>
					<PortfolioHeaderText>
						{dashboardFraming.overviewText}
					</PortfolioHeaderText>
					<PortfolioMetrics>
						<PortfolioMetric>
							<PortfolioMetricValue>
								{systemsNeedingAttentionCount}
							</PortfolioMetricValue>
							<PortfolioMetricLabel>Needs Attention</PortfolioMetricLabel>
						</PortfolioMetric>
						<PortfolioMetric>
							<PortfolioMetricValue>
								{upcomingServiceWindowCount}
							</PortfolioMetricValue>
							<PortfolioMetricLabel>Upcoming Service</PortfolioMetricLabel>
						</PortfolioMetric>
						<PortfolioMetric>
							<PortfolioMetricValue>
								{maintenanceEventsThisMonth}
							</PortfolioMetricValue>
							<PortfolioMetricLabel>Logged This Month</PortfolioMetricLabel>
						</PortfolioMetric>
					</PortfolioMetrics>
				</PortfolioHealthCard>

				{dashboardSuggestion && (
					<DashboardIntelligenceCard>
						<DashboardIntelligenceHeader>
							<CardEyebrow>Maintley Intelligence</CardEyebrow>
							<DashboardIntelligenceSourcePill>
								{getDashboardSuggestionSourceLabel(dashboardSuggestion)}
							</DashboardIntelligenceSourcePill>
						</DashboardIntelligenceHeader>
						<CardTitle>{dashboardSuggestion.title}</CardTitle>
						{dashboardSuggestion.contextLabel && (
							<DashboardIntelligenceContext>
								{dashboardSuggestion.contextLabel}
							</DashboardIntelligenceContext>
						)}
						<DashboardIntelligenceImpact>
							{dashboardSuggestion.whyItMatters}
						</DashboardIntelligenceImpact>
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

			{/* Urgent queue */}
			<UrgentQueueSection id='urgent-task-queue'>
				<UrgentQueueHeader>
					<div>
						<CardTitle>{dashboardFraming.queueTitle}</CardTitle>
						<UrgentQueueSubtitle>
							{dashboardFraming.queueSubtitle}
						</UrgentQueueSubtitle>
					</div>
					<QueueHeaderActions>
						<QueueFilterPill>
							{dashboardFraming.scopePill}
						</QueueFilterPill>
						{overdueUrgentTasks.length > 0 && (
							<QueueFilterPill $tone='urgent'>
								{overdueUrgentTasks.length} overdue now
							</QueueFilterPill>
						)}
					</QueueHeaderActions>
				</UrgentQueueHeader>

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
			</UrgentQueueSection>

			<RecentActivitySection>
				<RecentActivityHeader>
					<div>
						<CardEyebrow>Recent Maintenance</CardEyebrow>
						<RecentActivitySubtitle>
							{dashboardFraming.recentSubtitle}
						</RecentActivitySubtitle>
					</div>
				</RecentActivityHeader>
				{recentMaintenanceActivity.length === 0 ? (
					<RecentActivityEmpty>
						<p>No maintenance records yet. Complete tasks or add a maintenance record to build the service history.</p>
						<FocusButton
							type='button'
							onClick={() => handleOpenCreateTask()}>
							Add Task
						</FocusButton>
					</RecentActivityEmpty>
				) : (
					<RecentActivityList>
						{recentMaintenanceActivity.map((entry: any) => (
							<RecentActivityRow key={entry.id}>
								<RecentActivityMain>
									<RecentActivityTitle>{entry.description}</RecentActivityTitle>
									<RecentActivityMeta>
										{entry.deviceName} - {entry.propertyName}
									</RecentActivityMeta>
								</RecentActivityMain>
								<RecentActivityDate>{formatActivityDate(entry.timestamp)}</RecentActivityDate>
							</RecentActivityRow>
						))}
					</RecentActivityList>
				)}
			</RecentActivitySection>

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
