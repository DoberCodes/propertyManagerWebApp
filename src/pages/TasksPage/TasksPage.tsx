import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from 'Redux/store/store';
import { AppZeroState } from 'Components/Library/AppZeroState';
import { LoadingState } from 'Components/LoadingState';
import { useGetPropertiesQuery } from 'Redux/API/propertySlice';
import {
	selectIsTeamMemberAccount,
	selectIsTenant,
	selectIsHomeowner,
} from 'Redux/selectors/permissionSelectors';
import { filterTasksByRole } from '../../utils/dataFilters';
import { useTaskHandlers } from '../PropertyDetailPage/useTaskHandlers';
import {
	faFan,
	faSnowflake,
	faClipboardCheck,
	faHouse,
	faScrewdriverWrench,
	faClockRotateLeft,
	faBell,
	faChevronDown,
	faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import {
	FloatingFilterPanel,
	TaskModal,
} from '../../Components/Library';
import { TaskAssignModal } from '../../Components/Library/Modal/TaskAssignModal';
import {
	useGetTasksQuery,
	useDeleteTaskMutation,
	useUpdateTaskMutation,
} from '../../Redux/API/taskSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import {
	TaskOverviewGrid,
	TaskHeroCard,
	TaskHeroEyebrow,
	TaskHeroTitle,
	TaskHeroMeta,
	TaskHeroActions,
	TaskHeroButton,
	TaskGroupStack,
	TaskGroupSection,
	TaskGroupHeader,
	TaskGroupTitleBlock,
	TaskGroupTitle,
	TaskGroupDescription,
	TaskGroupHeaderMeta,
	TaskGroupBadge,
	TaskGroupList,
	TaskDecisionCard,
	TaskDecisionIcon,
	TaskDecisionContent,
	TaskDecisionTitle,
	TaskDecisionMeta,
	TaskDecisionActions,
	TaskDecisionAction,
	TaskControlPanel,
	TaskControlRow,
	TaskFilterAdvancedBody,
	TaskFilterCollapseButton,
	TaskFilterSummaryRow,
	TaskSearchInput,
	TaskSortSelect,
	TaskResultCount,
	TaskFilterFields,
	TaskFilterField,
	AddTaskButton,
	MobileListSection,
	MobileTaskCard,
	MobileTaskHeader,
	MobileTaskTitle,
	MobileTaskMetaGrid,
	MobileMetaItem,
	MobileMetaLabel,
	MobileMetaValue,
	MobileTaskActions,
	MobileActionButton,
	MobileActionLinkRow,
	MobileActionLinkButton,
	QuickFilterChips,
	QuickFilterChip,
	UndoToast,
	UndoButton,
} from './TasksPage.styles';

import {
	compareTasksByDueUrgency,
	getTaskAssigneeDisplayName,
	isTaskOverdueForDisplay,
	updateOverdueTasks,
} from '../../utils/taskUtils';
import {
	getTaskDisplayStatus,
	isTaskDueWithinDays,
} from '../../utils/taskDisplayStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { getRoleCapabilities } from '../../utils/permissions';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../../Components/Library/AppPageLayout/AppPageLayout.styles';
import { COLORS } from '../../constants/colors';
import { Task } from '../../types/Task.types';
import {
	buildTaskTimeBuckets,
	TaskTimeBucketId,
} from '../../tasks/taskTimeBuckets';
import { getTaskTimingLabel } from '../../tasks/taskSchedule';
import { useGetAccountSpacesQuery } from '../../Redux/API/spaceSlice';
import { useGetPropertyKnowledgeLinksQuery } from '../../Redux/API/propertyKnowledgeLinkSlice';
import { getTaskSpaceIds } from '../../types/PropertyKnowledgeLink.types';
import {
	readCollapsedGroupPreference,
	writeCollapsedGroupPreference,
} from '../../utils/listViewPreferences';

const DEFAULT_COLLAPSED_TASK_GROUPS: Record<TaskTimeBucketId, boolean> = {
	overdue: false,
	today: true,
	'this-week': true,
	upcoming: true,
	asap: true,
	unscheduled: true,
};

export const TasksPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isUserTenant = useSelector(selectIsTenant);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);
	const isHomeowner = useSelector(selectIsHomeowner);
	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const canManageTasks = roleCapabilities.canManageTasks;
	const canCreateTasks = roleCapabilities.canCreateTasks;
	const accountId = String(currentUser?.accountId || currentUser?.id || '').trim();
	// Select groups from state and derive team members with useMemo
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
	const {
		data: allTasks = [],
		isLoading: areTasksLoading,
		isFetching: areTasksFetching,
		isSuccess: areTasksLoaded,
		isError: didTasksFail,
		refetch: refetchTasks,
	} = useGetTasksQuery();
	const { data: accountSpaces = [] } = useGetAccountSpacesQuery(
		{ accountId, includeArchived: true },
		{ skip: !accountId },
	);
	const { data: accountKnowledgeLinks = [] } =
		useGetPropertyKnowledgeLinksQuery(
			{ accountId },
			{ skip: !accountId },
		);
	const taskSpaceIdsByTaskId = useMemo(
		() =>
			new Map(
				allTasks.map((task) => [
					task.id,
					getTaskSpaceIds(accountKnowledgeLinks, task.id),
				]),
			),
		[accountKnowledgeLinks, allTasks],
	);
	const taskSpaceNamesByTaskId = useMemo(() => {
		const spaceNameById = new Map(
			accountSpaces.map((space) => [space.id, space.name]),
		);
		return new Map(
			allTasks.map((task) => [
				task.id,
				(taskSpaceIdsByTaskId.get(task.id) || [])
					.map((spaceId) => spaceNameById.get(spaceId))
					.filter((name): name is string => Boolean(name)),
			]),
		);
	}, [accountSpaces, allTasks, taskSpaceIdsByTaskId]);
	const getTaskSpaceLabel = useCallback(
		(taskId: string) => (taskSpaceNamesByTaskId.get(taskId) || []).join(', '),
		[taskSpaceNamesByTaskId],
	);

	// Locally promote past-due tasks to 'Overdue' status so the UI reflects reality
	// even before the daily Firebase scheduled function runs.
	const [processedTasks, setProcessedTasks] = useState(allTasks);
	useEffect(() => {
		updateOverdueTasks(allTasks).then(setProcessedTasks);
	}, [allTasks]);
	const {
		data: ownedProperties = [],
		isLoading: isLoadingProperties,
		isFetching: isFetchingProperties,
		isSuccess: arePropertiesLoaded,
		isError: didPropertiesFail,
		refetch: refetchProperties,
	} = useGetPropertiesQuery();

	// Use account/family accessible properties only.
	const allProperties = useMemo(() => {
		const combined = [...ownedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, currentUser?.hiddenPropertyIds]);

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [deleteTaskMutation] = useDeleteTaskMutation();

	// Local task handlers
	const taskHandlers = useTaskHandlers({ updateTaskMutation });

	// Destructure task handlers state
	const {
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
	} = taskHandlers;

	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [quickFilter, setQuickFilter] = useState<
		'all' | 'overdue' | 'due-soon' | 'due-next-30' | 'unassigned'
	>('all');
	const [sortState, setSortState] = useState<{
		key: string;
		direction: 'asc' | 'desc';
	}>({ key: 'dueDate', direction: 'asc' });
	const [areTopFiltersExpanded, setAreTopFiltersExpanded] = useState(false);
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
	const [draftSearchTerm, setDraftSearchTerm] = useState('');
	const [draftQuickFilter, setDraftQuickFilter] = useState<
		'all' | 'overdue' | 'due-soon' | 'due-next-30' | 'unassigned'
	>('all');
	const [draftSortValue, setDraftSortValue] = useState('dueDate:asc');
	const [advancedFilters, setAdvancedFilters] = useState({
		status: '',
		priority: '',
		assignedTo: '',
		category: '',
		spaceId: '',
		propertyId: '',
		dueDateStart: '',
		dueDateEnd: '',
	});
	const [draftAdvancedFilters, setDraftAdvancedFilters] =
		useState(advancedFilters);
	const [undoToastMessage, setUndoToastMessage] = useState<string | null>(null);
	const [pendingUndo, setPendingUndo] = useState<{
		kind: 'complete' | 'delete';
		taskId: string;
		taskTitle: string;
		timeoutId: number;
	} | null>(null);
	const taskGroupPreferenceKey = `maintley:tasks:collapsed:${currentUser?.id || 'anonymous'}`;
	const [collapsedTaskGroups, setCollapsedTaskGroups] = useState<
		Record<TaskTimeBucketId, boolean>
	>(() =>
		readCollapsedGroupPreference(
			typeof window === 'undefined' ? null : window.localStorage,
			taskGroupPreferenceKey,
			DEFAULT_COLLAPSED_TASK_GROUPS,
		).value,
	);
	// track the property id for the task we're assigning so the modal can fetch contractors immediately
	const [assigningTaskPropertyId, setAssigningTaskPropertyId] =
		useState<string>('');

	// create task handler used by buttons
	const handleCreateTask = () => {
		if (!canCreateTasks) return;
		taskHandlers.setEditingTaskId('');
		taskHandlers.setShowTaskDialog(true);
	};

	const isMobile = useSelector((state: RootState) => state.app.isMobile);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const action = params.get('action');

		if (!action) {
			return;
		}

		const clearActionParams = () => {
			const nextParams = new URLSearchParams(location.search);
			nextParams.delete('action');
			nextParams.delete('taskId');

			navigate(
				{
					pathname: location.pathname,
					search: nextParams.toString()
						? `?${nextParams.toString()}`
						: '',
				},
				{ replace: true },
			);
		};

		if (action === 'create') {
			if (canCreateTasks) {
				taskHandlers.setEditingTaskId('');
				taskHandlers.setShowTaskDialog(true);
			}
			clearActionParams();
			return;
		}

		const taskId = params.get('taskId');
		if (!taskId) {
			clearActionParams();
			return;
		}

		const task = allTasks.find((currentTask) => currentTask.id === taskId);
		if (!task) {
			return;
		}

		if (action === 'assign' && canManageTasks) {
			taskHandlers.setAssigningTaskId(task.id);
			setAssigningTaskPropertyId(task.propertyId || '');
			taskHandlers.setShowTaskAssignDialog(true);
			clearActionParams();
			return;
		}

		if (action === 'complete' && canManageTasks) {
			setCompletingTaskId(task.id);
			setShowTaskCompletionModal(true);
			clearActionParams();
			return;
		}

		clearActionParams();
	}, [
		location.pathname,
		location.search,
		navigate,
		allTasks,
		canCreateTasks,
		canManageTasks,
		taskHandlers,
	]);

	// property options for filtering on the main tasks page
	const propertyFilterOptions = useMemo(() => {
		return allProperties.map((p) => ({ value: p.id, label: p.title }));
	}, [allProperties]);
	const taskPropertyLanguage = {
		filterLabel: isHomeowner ? 'Home' : 'Property',
		allOptionLabel: isHomeowner ? 'All homes' : 'All properties',
		itemPrefix: isHomeowner ? 'Home' : 'Property',
		sortLabel: isHomeowner ? 'Home A-Z' : 'Property A-Z',
		addRecordLabel: isHomeowner ? 'Add Home' : 'Add Property Record',
		unknownLabel: isHomeowner ? 'Unknown Home' : 'Unknown Property',
	};

	const globalTaskFilterOptions = useMemo(() => {
		const accessibleTasks = filterTasksByRole(
			processedTasks,
			currentUser,
			teamMembers,
			allProperties,
		).filter((task) => task.status !== 'Completed');
		const uniqueOptions = (values: Array<string | undefined>) =>
			Array.from(
				new Set(values.map((value) => String(value || '').trim()).filter(Boolean)),
			)
				.sort((left, right) => left.localeCompare(right))
				.map((value) => ({ value, label: value }));

		const assigneeMap = new Map<string, string>();
		accessibleTasks.forEach((task: any) => {
			const assigneeId =
				task.assignedTo && typeof task.assignedTo === 'object'
					? task.assignedTo.id
					: task.assignee;
			if (assigneeId) {
				assigneeMap.set(
					String(assigneeId),
					getTaskAssigneeDisplayName(task, 'Former assignee'),
				);
			}
		});

		return {
			statuses: uniqueOptions(accessibleTasks.map((task) => task.status)),
			categories: uniqueOptions(accessibleTasks.map((task) => task.category)),
			spaces: accountSpaces
				.filter((space) =>
					accessibleTasks.some((task) =>
						(taskSpaceIdsByTaskId.get(task.id) || []).includes(space.id),
					),
				)
				.map((space) => ({
					value: space.id,
					label: `${space.name}${space.isArchived ? ' (Archived)' : ''}`,
				})),
			assignees: Array.from(assigneeMap.entries())
				.map(([value, label]) => ({ value, label }))
				.sort((left, right) => left.label.localeCompare(right.label)),
		};
	}, [
		processedTasks,
		currentUser,
		teamMembers,
		allProperties,
		accountSpaces,
		taskSpaceIdsByTaskId,
	]);

	const renderAdvancedFilterFields = (
		values: typeof advancedFilters,
		onChange: (
			key: keyof typeof advancedFilters,
			value: string,
		) => void,
	) => (
		<TaskFilterFields>
			<TaskFilterField>
				{taskPropertyLanguage.filterLabel}
				<TaskSortSelect
					value={values.propertyId}
					onChange={(event) => onChange('propertyId', event.target.value)}>
					<option value=''>{taskPropertyLanguage.allOptionLabel}</option>
					{propertyFilterOptions.map((option) => (
						<option key={option.value} value={String(option.value)}>
							{option.label}
						</option>
					))}
				</TaskSortSelect>
			</TaskFilterField>
			<TaskFilterField>
				Priority
				<TaskSortSelect
					value={values.priority}
					onChange={(event) => onChange('priority', event.target.value)}>
					<option value=''>All priorities</option>
					{['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
						<option key={priority} value={priority}>
							{priority}
						</option>
					))}
				</TaskSortSelect>
			</TaskFilterField>
			<TaskFilterField>
				Assigned to
				<TaskSortSelect
					value={values.assignedTo}
					onChange={(event) => onChange('assignedTo', event.target.value)}>
					<option value=''>All assignees</option>
					<option value='unassigned'>Unassigned</option>
					{globalTaskFilterOptions.assignees.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</TaskSortSelect>
			</TaskFilterField>
			<TaskFilterField>
				Category
				<TaskSortSelect
					value={values.category}
					onChange={(event) => onChange('category', event.target.value)}>
					<option value=''>All categories</option>
					{globalTaskFilterOptions.categories.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</TaskSortSelect>
			</TaskFilterField>
			<TaskFilterField>
				Space
				<TaskSortSelect
					value={values.spaceId}
					onChange={(event) => onChange('spaceId', event.target.value)}>
					<option value=''>All Spaces</option>
					{globalTaskFilterOptions.spaces.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</TaskSortSelect>
			</TaskFilterField>
			<TaskFilterField>
				Due after
				<TaskSearchInput
					type='date'
					value={values.dueDateStart}
					onChange={(event) => onChange('dueDateStart', event.target.value)}
				/>
			</TaskFilterField>
			<TaskFilterField>
				Due before
				<TaskSearchInput
					type='date'
					value={values.dueDateEnd}
					onChange={(event) => onChange('dueDateEnd', event.target.value)}
				/>
			</TaskFilterField>
		</TaskFilterFields>
	);

	const clearTopFilters = () => {
		setSearchTerm('');
		setQuickFilter('all');
		setAdvancedFilters({
			status: '',
			priority: '',
			assignedTo: '',
			category: '',
			spaceId: '',
			propertyId: '',
			dueDateStart: '',
			dueDateEnd: '',
		});
	};

	const openFilterPanel = () => {
		setDraftSearchTerm(searchTerm);
		setDraftQuickFilter(quickFilter);
		setDraftSortValue(`${sortState.key}:${sortState.direction}`);
		setDraftAdvancedFilters({ ...advancedFilters });
		setIsFilterPanelOpen(true);
	};

	const dismissFilterPanel = () => {
		setDraftSearchTerm(searchTerm);
		setDraftQuickFilter(quickFilter);
		setDraftSortValue(`${sortState.key}:${sortState.direction}`);
		setDraftAdvancedFilters({ ...advancedFilters });
		setIsFilterPanelOpen(false);
	};

	const clearDraftFilters = () => {
		setDraftSearchTerm('');
		setDraftQuickFilter('all');
		setDraftSortValue('dueDate:asc');
		setDraftAdvancedFilters({
			status: '',
			priority: '',
			assignedTo: '',
			category: '',
			spaceId: '',
			propertyId: '',
			dueDateStart: '',
			dueDateEnd: '',
		});
	};

	const applyDraftFilters = () => {
		const [key, direction] = draftSortValue.split(':') as [
			string,
			'asc' | 'desc',
		];
		setSearchTerm(draftSearchTerm);
		setQuickFilter(draftQuickFilter);
		setAdvancedFilters({ ...draftAdvancedFilters });
		setSortState({ key, direction });
		setIsFilterPanelOpen(false);
	};

	const activeFilterCount =
		(searchTerm.trim() ? 1 : 0) +
		(quickFilter !== 'all' ? 1 : 0) +
		(sortState.key !== 'dueDate' || sortState.direction !== 'asc' ? 1 : 0) +
		Object.values(advancedFilters).filter(Boolean).length;

	const hasEnabledTaskNotifications = (task: any) =>
		task?.enableNotifications === true &&
		Array.isArray(task?.notifications) &&
		task.notifications.length > 0;

	const getTaskPropertyLabel = (task: any) =>
		String(task?.propertyTitle || task?.property || taskPropertyLanguage.unknownLabel).trim() ||
		taskPropertyLanguage.unknownLabel;

	const handleSortOptionChange = (value: string) => {
		const [key, direction] = value.split(':') as [string, 'asc' | 'desc'];
		setSortState({ key, direction });
	};

	// Get active tasks for display
	const filteredTasks = useMemo(() => {
		const filtered = filterTasksByRole(
			processedTasks,
			currentUser,
			teamMembers,
			allProperties,
		);
		const activeTasks = filtered.filter((task) => task.status !== 'Completed');

		// Enrich tasks for display
		const enriched = activeTasks.map((task) => {
			const property = allProperties.find((p) => p.id === task.propertyId);
			return {
				...task,
				propertyTitle: property?.title || task.property || 'Unknown Property',
				assignedToNames: getTaskAssigneeDisplayName(task, ''),
				spaceSearchText: getTaskSpaceLabel(task.id),
			};
		});

		// Search over task content and accepted Space relationships.
		const normalizedSearch = searchTerm.trim().toLowerCase();
		const afterSearch = normalizedSearch
			? enriched.filter((task) => {
				const haystack = `${task.title || ''} ${task.notes || ''} ${task.spaceSearchText || ''}`.toLowerCase();
				return haystack.includes(normalizedSearch);
			})
			: enriched;

		const afterQuickFilter = afterSearch.filter((task) => {
			if (quickFilter === 'all') return true;
			if (quickFilter === 'overdue') return isTaskOverdueForDisplay(task as any);
			if (quickFilter === 'due-soon') return getTaskDisplayStatus(task).isDueSoon;
			if (quickFilter === 'due-next-30') return isTaskDueWithinDays(task, 30);
			if (quickFilter === 'unassigned') {
				return !task.assignedTo && !task.assignee;
			}
			return true;
		});

		const afterAdvancedFilters = afterQuickFilter.filter((task: any) => {
			if (advancedFilters.status && task.status !== advancedFilters.status) {
				return false;
			}
			if (
				advancedFilters.priority &&
				task.priority !== advancedFilters.priority
			) {
				return false;
			}
			if (
				advancedFilters.category &&
				task.category !== advancedFilters.category
			) {
				return false;
			}
			if (
				advancedFilters.spaceId &&
				!(taskSpaceIdsByTaskId.get(task.id) || []).includes(
					advancedFilters.spaceId,
				)
			) {
				return false;
			}
			if (
				advancedFilters.propertyId &&
				String(task.propertyId) !== advancedFilters.propertyId
			) {
				return false;
			}
			if (advancedFilters.assignedTo) {
				const assigneeId =
					task.assignedTo && typeof task.assignedTo === 'object'
						? task.assignedTo.id
						: task.assignee;
				if (advancedFilters.assignedTo === 'unassigned') {
					if (assigneeId) return false;
				} else if (String(assigneeId || '') !== advancedFilters.assignedTo) {
					return false;
				}
			}
			if (advancedFilters.dueDateStart || advancedFilters.dueDateEnd) {
				if (!task.dueDate) return false;
				const dueTime = new Date(task.dueDate).getTime();
				if (Number.isNaN(dueTime)) return false;
				if (
					advancedFilters.dueDateStart &&
					dueTime < new Date(advancedFilters.dueDateStart).getTime()
				) {
					return false;
				}
				if (advancedFilters.dueDateEnd) {
					const endDate = new Date(advancedFilters.dueDateEnd);
					endDate.setHours(23, 59, 59, 999);
					if (dueTime > endDate.getTime()) return false;
				}
			}
			return true;
		});

		// Keep overdue first, then apply user-selected sort.
		const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
		return afterAdvancedFilters.sort((a, b) => {
			const overdueA = isTaskOverdueForDisplay(a as any);
			const overdueB = isTaskOverdueForDisplay(b as any);
			if (overdueA !== overdueB) {
				return overdueA ? -1 : 1;
			}

			let baseCompare = 0;
			if (sortState.key === 'dueDate') {
				baseCompare = compareTasksByDueUrgency(a, b);
			} else if (sortState.key === 'priority') {
				const priorityA =
					priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
				const priorityB =
					priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
				baseCompare = priorityA - priorityB;
			} else if (sortState.key === 'status') {
				baseCompare = (a.status || '').localeCompare(b.status || '');
			} else if (sortState.key === 'title') {
				baseCompare = (a.title || '').localeCompare(b.title || '');
			} else if (sortState.key === 'assignedTo') {
				const assigneeA = getTaskAssigneeDisplayName(a, '');
				const assigneeB = getTaskAssigneeDisplayName(b, '');
				baseCompare = assigneeA.localeCompare(assigneeB);
			} else if (sortState.key === 'propertyTitle') {
				baseCompare = (a.propertyTitle || a.property || '').localeCompare(
					b.propertyTitle || b.property || '',
				);
			}

			if (baseCompare === 0) {
				const fallbackA =
					priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
				const fallbackB =
					priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
				baseCompare = fallbackB - fallbackA;
			}

			return sortState.direction === 'asc' ? baseCompare : -baseCompare;
		});
	}, [
		processedTasks,
		currentUser,
		teamMembers,
		allProperties,
		taskSpaceIdsByTaskId,
		getTaskSpaceLabel,
		searchTerm,
		quickFilter,
		advancedFilters,
		sortState,
	]);

	const taskTimeBuckets = useMemo(
		() =>
			buildTaskTimeBuckets(filteredTasks as Task[]).filter(
				(bucket) => bucket.tasks.length > 0,
			),
		[filteredTasks],
	);
	const nextStepTask = taskTimeBuckets.find((bucket) => bucket.tasks.length > 0)
		?.tasks[0];

	// Count of active tasks (before timeframe filtering)
	const activeTasksCount = useMemo(() => {
		const filtered = filterTasksByRole(
			processedTasks,
			currentUser,
			teamMembers,
			allProperties,
		);
		return filtered.filter((task) => task.status !== 'Completed').length;
	}, [processedTasks, currentUser, teamMembers, allProperties]);

	const accessibleTasksCount = useMemo(() => {
		return filterTasksByRole(
			processedTasks,
			currentUser,
			teamMembers,
			allProperties,
		).length;
	}, [processedTasks, currentUser, teamMembers, allProperties]);

	const getTaskZeroStateConfig = () => {
		const hasNoTasks = accessibleTasksCount === 0;
		const hasNoActiveTasks = !hasNoTasks && activeTasksCount === 0;
		const kind: 'noTasks' | 'noActiveTasks' | 'noTaskMatches' = hasNoTasks
			? 'noTasks'
			: hasNoActiveTasks
				? 'noActiveTasks'
				: 'noTaskMatches';
		const actions =
			kind === 'noTaskMatches'
				? [{ label: 'Clear Filters', onClick: clearTopFilters }]
				: canCreateTasks
					? [
						{
							label: 'Add Task',
							onClick: handleCreateTask,
							hideOnCompact: true,
						},
					]
					: [];

		return { kind, actions };
	};

	const formatRelativeDue = (value?: string, scheduleMode?: any) => {
		if (!value) return getTaskTimingLabel({ dueDate: value, scheduleMode });
		const target = new Date(value).getTime();
		if (Number.isNaN(target)) return 'No due date set';
		const diffMs = target - Date.now();
		const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
		if (absDays === 0) return diffMs < 0 ? 'Due today (late)' : 'Due today';
		if (absDays === 1) return diffMs < 0 ? 'Overdue by 1 day' : 'Due tomorrow';
		return diffMs < 0 ? `Overdue by ${absDays} days` : `Due in ${absDays} days`;
	};

	const getTaskIcon = (task: any) => {
		const context = `${task.title || ''} ${task.category || ''} ${getTaskSpaceLabel(task.id)}`.toLowerCase();
		if (context.includes('hvac') || context.includes('heat') || context.includes('cool')) {
			return { icon: faFan, color: COLORS.primary, background: COLORS.primaryLight };
		}
		if (context.includes('season') || context.includes('winter') || context.includes('summer')) {
			return { icon: faSnowflake, color: '#1d4ed8', background: '#dbeafe' };
		}
		if (context.includes('inspect') || context.includes('audit')) {
			return { icon: faClipboardCheck, color: '#0369a1', background: '#e0f2fe' };
		}
		if (context.includes('exterior') || context.includes('roof') || context.includes('yard')) {
			return { icon: faHouse, color: '#9a3412', background: '#ffedd5' };
		}
		if (task.status === 'Completed') {
			return { icon: faClockRotateLeft, color: COLORS.successDark, background: COLORS.successLight };
		}
		return { icon: faScrewdriverWrench, color: '#475569', background: '#f1f5f9' };
	};


	const handleAssignTask = (task: any) => {
		if (!canManageTasks) return;
		// Capture both id and property up front to avoid race condition
		taskHandlers.setAssigningTaskId(task.id);
		setAssigningTaskPropertyId(task.propertyId || '');
		taskHandlers.setShowTaskAssignDialog(true);
	};

	const openTaskProfile = (task: any) => {
		if (!task?.id) return;
		navigate(`/tasks/${task.id}`);
	};

	const toggleTaskGroup = (bucketId: TaskTimeBucketId) => {
		setCollapsedTaskGroups((current) => {
			const next = {
				...current,
				[bucketId]: !current[bucketId],
			};
			writeCollapsedGroupPreference(
				typeof window === 'undefined' ? null : window.localStorage,
				taskGroupPreferenceKey,
				next,
			);
			return next;
		});
	};

	const getTaskGroupTone = (
		bucketId: TaskTimeBucketId,
	): 'danger' | 'warning' | 'success' | 'neutral' => {
		if (bucketId === 'overdue') return 'danger';
		if (bucketId === 'today' || bucketId === 'this-week') return 'warning';
		if (bucketId === 'upcoming') return 'success';
		return 'neutral';
	};

	const getAssigneeLabel = (task: any) =>
		getTaskAssigneeDisplayName(task);

	const formatDueDate = (dueDate?: string, scheduleMode?: any) => {
		if (!dueDate) return getTaskTimingLabel({ dueDate, scheduleMode });
		const parsed = new Date(dueDate);
		if (Number.isNaN(parsed.getTime())) return dueDate;
		return parsed.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const executePendingAction = async (action: {
		kind: 'complete' | 'delete';
		taskId: string;
		taskTitle: string;
		timeoutId: number;
	}) => {
		if (action.kind === 'complete') {
			handleTaskCompletion(action.taskId);
			return;
		}

		try {
			await deleteTaskMutation(action.taskId).unwrap();
		} catch (error) {
			console.error('Failed to delete task:', error);
		}
	};

	const queueUndoableAction = (action: {
		kind: 'complete' | 'delete';
		taskId: string;
		taskTitle: string;
	}) => {
		if (!canManageTasks) return;
		if (pendingUndo) {
			window.clearTimeout(pendingUndo.timeoutId);
			void executePendingAction(pendingUndo);
		}

		const timeoutId = window.setTimeout(() => {
			setPendingUndo((current) => {
				if (!current || current.taskId !== action.taskId || current.kind !== action.kind) {
					return current;
				}
				void executePendingAction(current);
				setUndoToastMessage(null);
				return null;
			});
		}, 4500);

		setPendingUndo({ ...action, timeoutId });
		setUndoToastMessage(
			action.kind === 'delete'
				? `Removing "${action.taskTitle}" from your active tasks...`
				: `Completing "${action.taskTitle}" and logging history...`,
		);
	};

	const handleUndoPendingAction = () => {
		if (!pendingUndo) return;
		window.clearTimeout(pendingUndo.timeoutId);
		setPendingUndo(null);
		setUndoToastMessage(null);
	};

	useEffect(() => {
		return () => {
			if (pendingUndo) {
				window.clearTimeout(pendingUndo.timeoutId);
			}
		};
	}, [pendingUndo]);

	const handleTaskCompletion = (taskId: string) => {
		setCompletingTaskId(taskId);
		setShowTaskCompletionModal(true);
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
	};

	const renderTaskDecisionCard = (task: any) => {
		const operational = getTaskDisplayStatus(task);
		const iconStyle = getTaskIcon(task);
		const isOverdue = operational.isOverdue;
		const assigneeLabel = getAssigneeLabel(task);
		return (
			<TaskDecisionCard key={task.id} $overdue={isOverdue}>
				<TaskDecisionIcon
					$color={iconStyle.color}
					$background={iconStyle.background}>
					<FontAwesomeIcon icon={iconStyle.icon} />
				</TaskDecisionIcon>
				<TaskDecisionContent>
					<TaskDecisionTitle
						type='button'
						onClick={() => openTaskProfile(task)}>
						{task.title || 'Untitled task'}
					</TaskDecisionTitle>
					<TaskDecisionMeta $danger={isOverdue}>
						{formatRelativeDue(task.dueDate, task.scheduleMode)}
						{task.priority ? ` - ${task.priority} priority` : ''}
					</TaskDecisionMeta>
					<TaskDecisionMeta>
						{taskPropertyLanguage.itemPrefix}: {getTaskPropertyLabel(task)}
						{assigneeLabel ? ` - ${assigneeLabel}` : ''}
					</TaskDecisionMeta>
				</TaskDecisionContent>
				<TaskDecisionActions>
					<TaskDecisionAction
						type='button'
						$primary
						onClick={() => openTaskProfile(task)}>
						Open
					</TaskDecisionAction>
					{canManageTasks && task.status !== 'Completed' && (
						<TaskDecisionAction
							type='button'
							onClick={() => handleTaskCompletion(task.id)}>
							Complete
						</TaskDecisionAction>
					)}
				</TaskDecisionActions>
			</TaskDecisionCard>
		);
	};

	if (
		(ownedProperties.length === 0 &&
			(isLoadingProperties || isFetchingProperties)) ||
		(allTasks.length === 0 && (areTasksLoading || areTasksFetching))
	) {
		return (
			<LoadingState
				loadingKey='tasks-page'
				title='Loading tasks'
				message='Preparing your properties and maintenance tasks.'
			/>
		);
	}

	if (
		(ownedProperties.length === 0 && didPropertiesFail) ||
		(allTasks.length === 0 && didTasksFail)
	) {
		return (
			<AppZeroState
				kind='noTasks'
				title='Tasks could not be loaded'
				description='Maintley could not load your task records. Try again before creating anything new.'
				actions={[
					{
						label: 'Try Again',
						onClick: () => {
							void refetchProperties();
							void refetchTasks();
						},
					},
				]}
				fullPage
			/>
		);
	}

	if (arePropertiesLoaded && ownedProperties.length === 0) {
		return (
			<AppZeroState
				kind={isUserTenant || isTeamMemberAccount ? 'noAssignedProperties' : 'noProperties'}
				actions={
					!isUserTenant && !isTeamMemberAccount
						? [{ label: taskPropertyLanguage.addRecordLabel, onClick: () => navigate('/properties?openCreate=1') }]
						: []
				}
				fullPage
			/>
		);
	}

	if (
		areTasksLoaded &&
		filteredTasks.length === 0 &&
		activeFilterCount === 0 &&
		!showTaskDialog
	) {
		const taskZeroState = getTaskZeroStateConfig();
		return (
			<AppZeroState
				kind={taskZeroState.kind}
				actions={taskZeroState.actions}
				fullPage
			/>
		);
	}

	return (
		<StandardAppPage>
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>Tasks</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						Track overdue work, upcoming maintenance, and assignment status across your properties.
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
				{canCreateTasks && (
					<AddTaskButton type='button' onClick={handleCreateTask}>
						+ Add Task
					</AddTaskButton>
				)}
			</StandardAppPageHeader>
			{/* Task Filter Section */}
			<TaskControlPanel>
				<TaskFilterSummaryRow>
					<QuickFilterChips>
						<QuickFilterChip
							$active={quickFilter === 'all'}
							onClick={() => setQuickFilter('all')}>
							All
						</QuickFilterChip>
						<QuickFilterChip
							$active={quickFilter === 'overdue'}
							onClick={() => setQuickFilter('overdue')}>
							Overdue
						</QuickFilterChip>
						<QuickFilterChip
							$active={quickFilter === 'due-soon'}
							onClick={() => setQuickFilter('due-soon')}>
							Due Soon
						</QuickFilterChip>
						<QuickFilterChip
							$active={quickFilter === 'due-next-30'}
							onClick={() => setQuickFilter('due-next-30')}>
							Next 30 Days
						</QuickFilterChip>
						<QuickFilterChip
							$active={quickFilter === 'unassigned'}
							onClick={() => setQuickFilter('unassigned')}>
							Unassigned
						</QuickFilterChip>
						{(searchTerm.trim().length > 0 ||
							quickFilter !== 'all' ||
							Object.values(advancedFilters).some(Boolean)) && (
								<QuickFilterChip onClick={clearTopFilters}>Clear</QuickFilterChip>
							)}
					</QuickFilterChips>
					<TaskFilterCollapseButton
						type='button'
						onClick={() => setAreTopFiltersExpanded((value) => !value)}
						aria-expanded={areTopFiltersExpanded}
						aria-label={areTopFiltersExpanded ? 'Collapse task filters' : 'Expand task filters'}
						title={areTopFiltersExpanded ? 'Collapse filters' : 'Expand filters'}>
						<FontAwesomeIcon icon={areTopFiltersExpanded ? faChevronUp : faChevronDown} />
					</TaskFilterCollapseButton>
				</TaskFilterSummaryRow>
				<TaskResultCount>
					Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
				</TaskResultCount>
				{areTopFiltersExpanded && (
					<TaskFilterAdvancedBody>
						<TaskControlRow>
							<TaskSearchInput
								type='text'
								placeholder='Search task titles and notes...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<TaskSortSelect
								value={`${sortState.key}:${sortState.direction}`}
								onChange={(e) => handleSortOptionChange(e.target.value)}
								aria-label='Organize tasks'>
								<option value='dueDate:asc'>Sort: Due soonest</option>
								<option value='dueDate:desc'>Sort: Due latest</option>
								<option value='priority:desc'>Sort: Priority first</option>
								<option value='title:asc'>Sort: Title A-Z</option>
								<option value='propertyTitle:asc'>Sort: {taskPropertyLanguage.sortLabel}</option>
								<option value='status:asc'>Sort: Status</option>
							</TaskSortSelect>
						</TaskControlRow>
						{renderAdvancedFilterFields(advancedFilters, (key, value) =>
							setAdvancedFilters((current) => ({ ...current, [key]: value }))
						)}
					</TaskFilterAdvancedBody>
				)}
			</TaskControlPanel>

			<FloatingFilterPanel
				isOpen={isFilterPanelOpen}
				onOpen={openFilterPanel}
				onDismiss={dismissFilterPanel}
				onApply={applyDraftFilters}
				onClearDraft={clearDraftFilters}
				activeFilterCount={activeFilterCount}
				title='Search and filter tasks'
				description='Choose what you want to see, then apply your changes.'>
				<TaskFilterFields>
					<TaskFilterField>
						Search
						<TaskSearchInput
							type='search'
							placeholder='Search task titles and notes...'
							value={draftSearchTerm}
							onChange={(event) =>
								setDraftSearchTerm(event.target.value)
							}
						/>
					</TaskFilterField>
					<TaskFilterField>
						Sort
						<TaskSortSelect
							value={draftSortValue}
							onChange={(event) =>
								setDraftSortValue(event.target.value)
							}>
							<option value='dueDate:asc'>Due soonest</option>
							<option value='dueDate:desc'>Due latest</option>
							<option value='priority:desc'>Priority first</option>
							<option value='title:asc'>Title A-Z</option>
							<option value='propertyTitle:asc'>{taskPropertyLanguage.sortLabel}</option>
							<option value='status:asc'>Status</option>
						</TaskSortSelect>
					</TaskFilterField>
				</TaskFilterFields>
				{renderAdvancedFilterFields(
					draftAdvancedFilters,
					(key, value) =>
						setDraftAdvancedFilters((current) => ({
							...current,
							[key]: value,
						})),
				)}
				<QuickFilterChips>
					{[
						['all', 'All'],
						['overdue', 'Overdue'],
						['due-soon', 'Due Soon'],
						['due-next-30', 'Next 30 Days'],
						['unassigned', 'Unassigned'],
					].map(([value, label]) => (
						<QuickFilterChip
							key={value}
							type='button'
							$active={draftQuickFilter === value}
							onClick={() =>
								setDraftQuickFilter(
									value as typeof draftQuickFilter,
								)
							}>
							{label}
						</QuickFilterChip>
					))}
				</QuickFilterChips>
			</FloatingFilterPanel>

			{filteredTasks.length === 0 ? (
				<AppZeroState
					kind='noTaskMatches'
					actions={[
						{
							label: 'Clear Filters',
							onClick: () => {
								clearTopFilters();
								setSortState({
									key: 'dueDate',
									direction: 'asc',
								});
							},
						},
					]}
				/>
			) : (
				<TaskOverviewGrid>
					<TaskHeroCard>
						<TaskHeroEyebrow>Handle what matters first</TaskHeroEyebrow>
						<TaskHeroTitle>
							{nextStepTask?.title || 'Review your open maintenance'}
						</TaskHeroTitle>
						<TaskHeroMeta>
							{nextStepTask
								? `${formatRelativeDue(nextStepTask.dueDate, nextStepTask.scheduleMode)} - ${nextStepTask.priority || 'Low'} priority - ${getTaskPropertyLabel(nextStepTask)}`
								: 'Open maintenance will appear here when it is ready to review.'}
						</TaskHeroMeta>
						{nextStepTask && (
							<TaskHeroActions>
								{canManageTasks && nextStepTask.status !== 'Completed' && (
									<TaskHeroButton
										type='button'
										onClick={() => handleTaskCompletion(nextStepTask.id)}>
										Complete Task
									</TaskHeroButton>
								)}
								<TaskHeroButton
									type='button'
									$variant='secondary'
									onClick={() => openTaskProfile(nextStepTask)}>
									Open Profile
								</TaskHeroButton>
							</TaskHeroActions>
						)}
					</TaskHeroCard>

					<TaskGroupStack>
						{taskTimeBuckets.map((bucket) => {
							const tone = getTaskGroupTone(bucket.id);
							const isCollapsed = collapsedTaskGroups[bucket.id];
							return (
								<TaskGroupSection key={bucket.id} $tone={tone}>
									<TaskGroupHeader
										type='button'
										onClick={() => toggleTaskGroup(bucket.id)}
										aria-expanded={!isCollapsed}>
										<TaskGroupTitleBlock>
											<TaskGroupTitle>{bucket.label}</TaskGroupTitle>
											<TaskGroupDescription>
												{bucket.description}
											</TaskGroupDescription>
										</TaskGroupTitleBlock>
										<TaskGroupHeaderMeta>
											<TaskGroupBadge $tone={tone}>
												{bucket.tasks.length}
											</TaskGroupBadge>
											<FontAwesomeIcon
												icon={isCollapsed ? faChevronDown : faChevronUp}
											/>
										</TaskGroupHeaderMeta>
									</TaskGroupHeader>
									{!isCollapsed && (
										<TaskGroupList>
											{bucket.tasks.map((task) =>
												renderTaskDecisionCard(task),
											)}
										</TaskGroupList>
									)}
								</TaskGroupSection>
							);
						})}
					</TaskGroupStack>
				</TaskOverviewGrid>
			)}

			{isMobile && (
				<MobileListSection>
					{filteredTasks.length === 0 && (
						<AppZeroState
							kind='noTaskMatches'
							actions={[
								{
									label: 'Clear Filters',
									onClick: () => {
										clearTopFilters();
										setSortState({
											key: 'dueDate',
											direction: 'asc',
										});
									},
								},
							]}
						/>
					)}
					{filteredTasks.map((task: any) => {
						const operational = getTaskDisplayStatus(task);
						const isOverdue = operational.isOverdue;
						const operationalLabel = operational.label;
						const operationalTone = operational.color;
						const maintenanceStatusText =
							operational.label === 'Completed'
								? 'Maintenance completed'
								: operational.label === 'Overdue'
									? 'Maintenance is overdue'
									: operational.label === 'Due Soon'
										? 'Maintenance is coming due soon'
										: operational.label === 'Open'
											? 'Ready to schedule or review'
											: 'Upcoming maintenance';
						const assigneeLabel = getAssigneeLabel(task);
						const assigneeText =
							assigneeLabel === 'Unassigned'
								? 'Unassigned'
								: `Assigned to ${assigneeLabel}`;
						const hasTaskNotifications = hasEnabledTaskNotifications(task);
						return (
							<MobileTaskCard key={task.id} $overdue={isOverdue}>
								<MobileTaskHeader>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											width: '100%',
											gap: 8,
										}}>
										<MobileTaskTitle style={{ margin: 0 }}>{task.title}</MobileTaskTitle>
										{hasTaskNotifications && (
											<div
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													justifyContent: 'center',
													width: 24,
													height: 24,
													marginLeft: 'auto',
													borderRadius: 999,
													fontSize: 12,
													color: '#a16207',
													background: '#fef9c3',
													border: '1px solid #facc15',
												}}>
												<FontAwesomeIcon icon={faBell} />
											</div>
										)}
									</div>
									<div
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: 6,
											padding: '5px 10px',
											borderRadius: 999,
											border: `1px solid ${operationalTone}33`,
											background: `${operationalTone}12`,
											color: operationalTone,
											fontSize: 12,
											fontWeight: 800,
											width: 'fit-content',
										}}>
										{operationalLabel}
									</div>
								</MobileTaskHeader>
								<MobileTaskMetaGrid>
									<MobileMetaItem>
										<MobileMetaLabel>Identity</MobileMetaLabel>
										<MobileMetaValue>
											<div>{taskPropertyLanguage.itemPrefix}: {getTaskPropertyLabel(task)}</div>
											<div style={{ marginTop: 2, fontSize: '0.8rem', color: '#64748b' }}>
												{task.category || 'General maintenance'}
												{getTaskSpaceLabel(task.id)
													? ` · ${getTaskSpaceLabel(task.id)}`
													: ''}
											</div>
										</MobileMetaValue>
									</MobileMetaItem>
									<MobileMetaItem>
										<MobileMetaLabel>Maintenance Status</MobileMetaLabel>
										<MobileMetaValue>
											{maintenanceStatusText}
										</MobileMetaValue>
									</MobileMetaItem>
									<MobileMetaItem>
										<MobileMetaLabel>Maintenance Context</MobileMetaLabel>
										<MobileMetaValue>
											<div>{assigneeText}</div>
											<div style={{ marginTop: 2, fontSize: '0.8rem', color: '#64748b' }}>
												{task.priority || 'Low'} priority · {formatDueDate(task.dueDate, task.scheduleMode)}
											</div>
										</MobileMetaValue>
									</MobileMetaItem>
								</MobileTaskMetaGrid>
								{canManageTasks && (
									<MobileTaskActions>
										<MobileActionButton onClick={() => openTaskProfile(task)}>
											Open Profile
										</MobileActionButton>
										<MobileActionLinkRow>
											<MobileActionLinkButton onClick={() => handleAssignTask(task)}>
												Assign
											</MobileActionLinkButton>
											{task.status !== 'Completed' && (
												<MobileActionLinkButton
													onClick={() => handleTaskCompletion(task.id)}
												>
													Complete
												</MobileActionLinkButton>
											)}
											<MobileActionLinkButton
												$danger
												onClick={() =>
													queueUndoableAction({
														kind: 'delete',
														taskId: task.id,
														taskTitle: task.title || 'Task',
													})
												}
											>
												Delete
											</MobileActionLinkButton>
										</MobileActionLinkRow>
									</MobileTaskActions>
								)}
							</MobileTaskCard>
						);
					})}
				</MobileListSection>
			)}
			{/* Task Modals */}
			{showTaskDialog && (canManageTasks || canCreateTasks) && (
				<TaskModal
					isOpen={showTaskDialog}
					onClose={() => setShowTaskDialog(false)}
					editingTaskId={editingTaskId}
					editingTask={
						editingTaskId ? allTasks.find((t) => t.id === editingTaskId) : null
					}
					isEditing={!!editingTaskId}
					propertyOptions={propertyFilterOptions}
					currentUser={currentUser}
				/>
			)}

			{showTaskAssignDialog && canManageTasks && (
				<TaskAssignModal
					isOpen={showTaskAssignDialog}
					onClose={() => setShowTaskAssignDialog(false)}
					task={
						assigningTaskId
							? allTasks.find((t) => t.id === assigningTaskId)
							: null
					}
					propertyId={assigningTaskPropertyId}
					selectedAssignee={null}
				/>
			)}

			{showTaskCompletionModal && completingTaskId && canManageTasks && (
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

			{undoToastMessage && pendingUndo && (
				<UndoToast>
					<span>{undoToastMessage}</span>
					<UndoButton type='button' onClick={handleUndoPendingAction}>
						Undo
					</UndoButton>
				</UndoToast>
			)}
		</StandardAppPage>
	);
};
