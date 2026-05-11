import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { Task, TaskFormData } from 'types/Task.types';
import { useGetPropertiesQuery } from 'Redux/API/propertySlice';
import {
	useGetAllMaintenanceHistoryForUserQuery,
} from 'Redux/API/userSlice';
import { getTenantPropertySlug } from 'utils/permissions';
import { selectIsTenant } from 'Redux/selectors/permissionSelectors';
import { filterTasksByRole } from 'utils/dataFilters';
import { getCurrentLocation } from 'utils/geolocation';
import {
	getMaintenanceEventDate,
	isContinuityEvent,
} from 'utils/maintenanceEventUtils';
import { TaskCompletionModal } from 'Components/TaskCompletionModal';
import { TrialWarningBanner } from 'Components/TrialWarningBanner/TrialWarningBanner';
import { ExpiredTrialBanner } from 'Components/ExpiredTrialBanner/ExpiredTrialBanner';
import { ScheduledSubscriptionBanner } from 'Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner';
import { getTrialDaysRemaining, isTrialExpired } from 'utils/subscriptionUtils';
import { handleCheckoutSuccess } from 'services/stripeService';
import {
	Wrapper,
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
	HomeHealthCard,
	HomeHealthHeader,
	HomeHealthStatusPill,
	HomeHealthScoreValue,
	HomeHealthTrend,
	HomeHealthRecommendation,
	HomeHealthDrivers,
	HomeHealthDriver,
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
} from './DashboardTab.styles';
import { SeasonalMaintenance } from 'Components/SeasonalMaintenance';
import { SeasonalCard } from 'data/seasonalTipCards';
import { useTaskHandlers } from 'pages/PropertyDetailPage/useTaskHandlers';
import { TaskModal } from 'Components/Library';
import { TaskAssignModal } from 'Components/Library/Modal/TaskAssignModal';
import { useGetTasksQuery, useUpdateTaskMutation } from 'Redux/API/taskSlice';
import { useGetAllDevicesQuery } from 'Redux/API/deviceSlice';
import { useLazyGetMaintenanceHistoryByPropertyQuery } from 'Redux/API/maintenanceSlice';

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

	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	// Select team groups and derive members with memoization to avoid new references
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const teamMembers = useMemo(
		() =>
			teamGroups
				.flatMap((group) => group.members || [])
				.filter((member): member is typeof member => member !== undefined),
		[teamGroups],
	);

	// Fetch tasks and properties from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: allDevices = [] } = useGetAllDevicesQuery();
	const { data: ownedProperties = [] } = useGetPropertiesQuery();
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery(undefined, {
			skip: !currentUser?.id && !(currentUser as any)?.uid,
			refetchOnMountOrArgChange: true,
		});
	const [fetchMaintenanceHistoryByProperty] =
		useLazyGetMaintenanceHistoryByPropertyQuery();
	const allProperties = useMemo(() => {
		const combined = [...ownedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, currentUser?.hiddenPropertyIds]);

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

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();

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
		handleCreateTask,
		handleEditTask,
	} = taskHandlers;

	// Redirect tenants to their assigned property
	const isUserTenant = useSelector(selectIsTenant);

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

	// Get user geolocation once on mount (with permission request on mobile)
	useEffect(() => {
		const getLocation = async () => {
			const location = await getCurrentLocation();
			if (location) {
				setUserLocation(location);
				// Set default temp unit based on location
			}
		};
		getLocation();
	}, []);

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
				.then((result) => {
					console.info('Checkout verification result:', result);
					window.location.reload();
				})
				.catch((error) => {
					console.error('Checkout verification failed:', error);
				});
		}
	}, [location.search, currentUser]);

	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
	const [dashboardMaintenanceHistory, setDashboardMaintenanceHistory] = useState<
		any[]
	>([]);
	const dashboardHistoryLoadedKeyRef = useRef<string>('');
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [seasonalTaskDraft, setSeasonalTaskDraft] = useState<
		| (Partial<TaskFormData> & {
				propertyId?: string;
				unitId?: string;
				linkedMaintenanceHistoryIds?: string[];
		  })
		| null
	>(null);

	// Generate assignee options for task editing
	const assigneeOptions = useMemo(() => {
		const assignees: Array<{ label: string; value: string; email?: string }> =
			[];

		// Add team members
		teamMembers
			.filter((member): member is typeof member => member !== undefined)
			.forEach((member) => {
				assignees.push({
					label: `${member.firstName || ''} ${member.lastName || ''} (${
						member.title || ''
					})`.trim(),
					value: member.id,
					email: member.email,
				});
			});

		return assignees;
	}, [teamMembers]);

	// Task status counts for banner display
	const filteredTasks = useMemo(
		() =>
			filterTasksByRole(allTasks, currentUser, teamMembers, allProperties),
		[allTasks, currentUser, teamMembers, allProperties],
	);

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

	const visiblePropertyIdsKey = useMemo(
		() => visiblePropertyIdList.join('|'),
		[visiblePropertyIdList],
	);

	useEffect(() => {
		let isCancelled = false;

		if (!visiblePropertyIdsKey) {
			dashboardHistoryLoadedKeyRef.current = '';
			setDashboardMaintenanceHistory([]);
			return;
		}

		if (dashboardHistoryLoadedKeyRef.current === visiblePropertyIdsKey) {
			return;
		}

		const loadDashboardMaintenanceHistory = async () => {
			try {
				const propertyHistories = await Promise.all(
					visiblePropertyIdList.map(async (propertyId) => {
						try {
							return await fetchMaintenanceHistoryByProperty(propertyId).unwrap();
						} catch (error) {
							console.warn(
								'Could not load dashboard maintenance history for property:',
								propertyId,
								error,
							);
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
				console.warn('Could not build dashboard maintenance history aggregate:', error);
				if (!isCancelled) {
					setDashboardMaintenanceHistory([]);
					dashboardHistoryLoadedKeyRef.current = visiblePropertyIdsKey;
				}
			}
		};

		void loadDashboardMaintenanceHistory();

		return () => {
			isCancelled = true;
		};
	}, [visiblePropertyIdsKey]);

	const deviceLookup = useMemo(
		() =>
			new Map(
				visibleDevices.map((device: any) => {
					const id = String(device?.id || '').trim();
					const name =
						[device?.type, device?.brand, device?.model]
							.filter(Boolean)
							.join(' ')
							.trim() || 'Device';
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

	const completedThisMonthCount = useMemo(() => {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();

		const sourceRecords = scopedMaintenanceHistory.length
			? scopedMaintenanceHistory
			: allMaintenanceHistory.filter(isContinuityEvent);

		return sourceRecords.filter((record: any) => {
				const completionDate = new Date(
					getMaintenanceEventDate(record) || '',
				);
				return (
					!Number.isNaN(completionDate.getTime()) &&
					completionDate.getMonth() === currentMonth &&
					completionDate.getFullYear() === currentYear
				);
			}).length;
	}, [scopedMaintenanceHistory, allMaintenanceHistory]);

	const taskStatusCounts = useMemo(() => {
		const now = new Date();
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
			} else {
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
			: scopedMaintenanceHistory.length
				? scopedMaintenanceHistory
				: allMaintenanceHistory.filter(isContinuityEvent);

		return sourceRecords.filter((record: any) => {
			const eventDate = new Date(getMaintenanceEventDate(record) || '');
			return (
				!Number.isNaN(eventDate.getTime()) &&
				eventDate.getMonth() === currentMonth &&
				eventDate.getFullYear() === currentYear
			);
		}).length;
	}, [dashboardMaintenanceHistory, scopedMaintenanceHistory, allMaintenanceHistory]);

	const recentMaintenanceActivity = useMemo(() => {
		const sourceRecords = dashboardMaintenanceHistory.length
			? dashboardMaintenanceHistory
			: scopedMaintenanceHistory.length
				? scopedMaintenanceHistory
				: allMaintenanceHistory.filter(isContinuityEvent);

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
					? deviceLookup.get(normalizedDeviceIds[0]) || 'Device'
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
			.slice(0, 8);

		return activity;
	}, [
		dashboardMaintenanceHistory,
		scopedMaintenanceHistory,
		allMaintenanceHistory,
		propertyLookup,
		deviceLookup,
	]);

	// Property score calculation (100 - penalty for overdue tasks)
	const propertyScore = useMemo(() => {
		const baseScore = 100;
		const penaltyPerOverdueTask = 5; // 5 points deducted per overdue task
		const score = Math.max(
			0,
			baseScore - taskStatusCounts.overdue * penaltyPerOverdueTask,
		);
		return score;
	}, [taskStatusCounts.overdue]);

	const urgentTasks = useMemo(() => {
		const now = new Date();
		return filteredTasks
			.filter(
				(task): task is Task =>
					Boolean(task.dueDate) &&
					ACTIVE_TASK_STATUSES.has(task.status) &&
					task.status !== 'Completed',
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
	}, [filteredTasks, ACTIVE_TASK_STATUSES, PRIORITY_RANK]);

	const nextUrgentTask = urgentTasks[0] || null;

	const todayFocusLead = useMemo(() => {
		if (taskStatusCounts.overdue > 0 && nextUrgentTask) {
			return `${taskStatusCounts.overdue} ${
				taskStatusCounts.overdue === 1 ? 'workflow is' : 'workflows are'
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
				return `${remainingUpcoming} more ${
					remainingUpcoming === 1 ? 'workflow is' : 'workflows are'
				} due soon after that.`;
			}
			return 'Clear this first to reduce the rest of today\'s pressure.';
		}

		if (taskStatusCounts.completed > 0) {
			return 'Use this window to plan preventive maintenance before it becomes urgent.';
		}

		return 'Add the next planned maintenance workflow while the queue is clear.';
	}, [nextUrgentTask, taskStatusCounts.upcoming, taskStatusCounts.completed]);

	const homeHealthStatus = useMemo(() => {
		if (propertyScore >= 90) return 'Strong';
		if (propertyScore >= 75) return 'Stable';
		return 'At Risk';
	}, [propertyScore]);

	const homeHealthInterpretation = useMemo(() => {
		if (taskStatusCounts.overdue > 0) {
			return `${taskStatusCounts.overdue} overdue ${
				taskStatusCounts.overdue === 1 ? 'service window is' : 'service windows are'
			} pulling this down.`;
		}
		if (taskStatusCounts.upcoming > 0) {
			return `${taskStatusCounts.upcoming} upcoming ${
				taskStatusCounts.upcoming === 1 ? 'service window is' : 'service windows are'
			} creating near-term pressure.`;
		}
		return 'No urgent drag right now. System care is in a healthy range.';
	}, [taskStatusCounts.overdue, taskStatusCounts.upcoming]);

	const trackedSystemsCount = visibleDevices.length;

	const homeHealthPrimaryAction = useMemo(() => {
		if (nextUrgentTask && taskStatusCounts.overdue > 0) {
			return `Best next recovery: close the overdue work on ${nextUrgentTask.title}.`;
		}

		if (nextUrgentTask) {
			return `Best next move: start ${nextUrgentTask.title} before that service window slips.`;
		}

		if (completedThisMonthCount > 0) {
			return 'Best next move: schedule one preventive service window while the queue is clear.';
		}

		return 'Best next move: add the next planned maintenance workflow.';
	}, [nextUrgentTask, taskStatusCounts.overdue, completedThisMonthCount]);

	const homeHealthDrivers = useMemo(() => {
		const overduePenalty = taskStatusCounts.overdue * 5;
		const completionMomentum = Math.min(20, taskStatusCounts.completed * 0.5);
		const upcomingPressure = Math.min(15, taskStatusCounts.upcoming * 2);

		return [
			`Overdue penalty: -${overduePenalty} pts`,
			`Completion momentum: +${completionMomentum.toFixed(0)} pts`,
			`Upcoming pressure: -${upcomingPressure.toFixed(0)} pts`,
		];
	}, [
		taskStatusCounts.overdue,
		taskStatusCounts.completed,
		taskStatusCounts.upcoming,
	]);

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

	const normalizeTaskTitle = useCallback(
		(value?: string | null) =>
			String(value || '')
				.trim()
				.toLowerCase()
				.replace(/\s+/g, ' '),
		[],
	);

	const getSeasonalTaskPriority = (card: SeasonalCard) => {
		if (card.priorityLevel === 'high') {
			return 'High';
		}
		if (card.priorityLevel === 'medium') {
			return 'Medium';
		}
		return 'Low';
	};

	const getSeasonalTaskDueDate = (card: SeasonalCard) => {
		const daysUntilDue =
			card.priorityLevel === 'high'
				? 7
				: card.priorityLevel === 'medium'
				? 14
				: 30;
		const dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + daysUntilDue);
		return dueDate.toISOString().split('T')[0];
	};

	const getSeasonalTipTaskState = useCallback(
		(card: SeasonalCard) => {
			if (!allProperties.length) {
				return {
					disabled: true,
					label: 'No Property Available',
					helperText: 'Add a property before scheduling seasonal work.',
				};
			}

			if (allProperties.length > 1) {
				return {
					disabled: false,
					label: 'Add Workflow',
					helperText: 'Choose the property in the maintenance workflow modal.',
				};
			}

			const currentPropertyId = allProperties[0]?.id || '';
			const alreadyAdded = filteredTasks.some(
				(task) =>
					ACTIVE_TASK_STATUSES.has(task.status) &&
					task.propertyId === currentPropertyId &&
					normalizeTaskTitle(task.title) === normalizeTaskTitle(card.title),
			);

			if (alreadyAdded) {
				return {
					disabled: true,
					label: 'Already Added',
					helperText: 'This tip is already active for the property in view.',
				};
			}

			return {
				disabled: false,
				label: 'Add Workflow',
				helperText: 'Create a prefilled maintenance workflow from this seasonal tip.',
			};
		},
		[allProperties, filteredTasks, ACTIVE_TASK_STATUSES, normalizeTaskTitle],
	);

	const handleOpenBlankTaskModal = () => {
		setSeasonalTaskDraft(null);
		handleCreateTask();
	};

	const handleAddSeasonalTipTask = useCallback(
		(card: SeasonalCard) => {
			const propertyId = allProperties.length === 1 ? allProperties[0]?.id || '' : '';
			setEditingTaskId(null);
			setSeasonalTaskDraft({
				title: card.title,
				dueDate: getSeasonalTaskDueDate(card),
				status: 'Initiated',
				priority: getSeasonalTaskPriority(card),
				category: 'Seasonal Maintenance',
				notes: ['Seasonal maintenance tip:', ...card.bullets.map((bullet) => `- ${bullet}`)].join('\n'),
				propertyId,
			});
			setShowTaskDialog(true);
		},
		[allProperties, setEditingTaskId, setShowTaskDialog],
	);

	const handleOpenTask = (taskId: string) => {
		handleEditTask([taskId]);
	};

	const handleStartTask = async (task: Task) => {
		if (!task?.id) {
			return;
		}

		if (task.status === 'In Progress') {
			handleOpenTask(task.id);
			return;
		}

		try {
			setStartingTaskId(task.id);
			await updateTaskMutation({
				id: task.id,
				updates: { status: 'In Progress' },
			}).unwrap();
		} catch (error) {
			console.error('Failed to start task from dashboard:', error);
		} finally {
			setStartingTaskId(null);
		}
	};

	const handleCompleteTask = (taskId: string) => {
		setCompletingTaskId(taskId);
		setShowTaskCompletionModal(true);
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
	};

	return (
		<Wrapper>
			{/* Scheduled Subscription Banner */}
			{currentUser?.subscription?.hasScheduledSubscription &&
				currentUser?.subscription?.scheduledPlan &&
				currentUser?.subscription?.trialEndsAt && (
					<ScheduledSubscriptionBanner
						scheduledPlan={currentUser.subscription.scheduledPlan}
						trialEndsAt={currentUser.subscription.trialEndsAt}
						onManageClick={() => navigate('/settings')}
					/>
				)}

			{/* Trial/Expired Warning Banner */}
			{currentUser?.subscription?.status === 'trial' &&
				!currentUser?.subscription?.hasScheduledSubscription && (
					<TrialWarningBanner
						daysRemaining={getTrialDaysRemaining(
							currentUser.subscription as any,
						)}
						onUpgradeClick={() => navigate('/paywall')}
					/>
				)}
			{currentUser?.subscription &&
				isTrialExpired(currentUser.subscription) && (
					<ExpiredTrialBanner onUpgradeClick={() => navigate('/paywall')} />
				)}

			{/* Action-first top section */}
			<ActionFirstTopSection>
				<TodayFocusCard>
					<CardEyebrow>Today's Focus</CardEyebrow>
					<CardTitle>Handle what matters first</CardTitle>
					<TodayFocusLead>{todayFocusLead}</TodayFocusLead>
					<TodayFocusSupportingText>
						{todayFocusSupport}
					</TodayFocusSupportingText>
					{nextUrgentTask && (
						<TodayFocusTaskCard>
							<TitleRow>
								<TodayFocusTaskName>{nextUrgentTask.title}</TodayFocusTaskName>
								<TaskStatusBadge $status={nextUrgentTask.status}>
									{nextUrgentTask.status}
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
							disabled={startingTaskId === nextUrgentTask?.id}
							onClick={() => {
								if (nextUrgentTask) {
									void handleStartTask(nextUrgentTask);
									return;
								}
								navigate('/tasks');
							}}>
							{nextUrgentTask
								? startingTaskId === nextUrgentTask.id
									? 'Starting...'
									: nextUrgentTask.status === 'In Progress'
									? 'Open Task'
									: 'Start Now'
								: 'Open Urgent Queue'}
						</FocusButton>
						<FocusButton $variant='secondary' onClick={handleOpenBlankTaskModal}>
							Add Task
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
					<CardEyebrow>System Awareness</CardEyebrow>
					<CardTitle>Operational continuity</CardTitle>
					<PortfolioHeaderText>
						Across {allProperties.length}{' '}
						{allProperties.length === 1 ? 'property' : 'properties'} and {trackedSystemsCount}{' '}
						{trackedSystemsCount === 1 ? 'tracked system' : 'tracked systems'}.
					</PortfolioHeaderText>
					<PortfolioMetrics>
						<PortfolioMetric>
							<PortfolioMetricValue>
								{systemsNeedingAttentionCount}
							</PortfolioMetricValue>
							<PortfolioMetricLabel>Systems Needing Attention</PortfolioMetricLabel>
						</PortfolioMetric>
						<PortfolioMetric>
							<PortfolioMetricValue>
								{upcomingServiceWindowCount}
							</PortfolioMetricValue>
							<PortfolioMetricLabel>Upcoming Service Windows</PortfolioMetricLabel>
						</PortfolioMetric>
						<PortfolioMetric>
							<PortfolioMetricValue>
								{maintenanceEventsThisMonth}
							</PortfolioMetricValue>
							<PortfolioMetricLabel>Maintenance Events This Month</PortfolioMetricLabel>
						</PortfolioMetric>
					</PortfolioMetrics>
				</PortfolioHealthCard>

				<HomeHealthCard>
					<HomeHealthHeader>
						<div>
							<CardEyebrow>Home Health Score</CardEyebrow>
							<HomeHealthStatusPill $status={homeHealthStatus}>
								{homeHealthStatus}
							</HomeHealthStatusPill>
						</div>
						<HomeHealthScoreValue>{propertyScore}</HomeHealthScoreValue>
					</HomeHealthHeader>
					<HomeHealthTrend>{homeHealthInterpretation}</HomeHealthTrend>
					<HomeHealthRecommendation>
						{homeHealthPrimaryAction}
					</HomeHealthRecommendation>
					<HomeHealthDrivers>
						{homeHealthDrivers.slice(0, 2).map((driver) => (
							<HomeHealthDriver key={driver}>{driver}</HomeHealthDriver>
						))}
					</HomeHealthDrivers>
				</HomeHealthCard>
			</ActionFirstTopSection>

			<RecentActivitySection>
				<RecentActivityHeader>
					<div>
						<CardEyebrow>Recent Maintenance Activity</CardEyebrow>
						<CardTitle>Latest system events</CardTitle>
						<RecentActivitySubtitle>
							The most recent device-level maintenance updates across your active properties.
						</RecentActivitySubtitle>
					</div>
				</RecentActivityHeader>
				{recentMaintenanceActivity.length === 0 ? (
					<RecentActivityEmpty>
						No device maintenance events yet. Complete tasks or add logs from a device page to build continuity.
					</RecentActivityEmpty>
				) : (
					<RecentActivityList>
						{recentMaintenanceActivity.map((entry: any) => (
							<RecentActivityRow key={entry.id}>
								<RecentActivityMain>
									<RecentActivityTitle>{entry.description}</RecentActivityTitle>
									<RecentActivityMeta>
										{entry.deviceName} • {entry.propertyName}
									</RecentActivityMeta>
								</RecentActivityMain>
								<RecentActivityDate>{formatActivityDate(entry.timestamp)}</RecentActivityDate>
							</RecentActivityRow>
						))}
					</RecentActivityList>
				)}
			</RecentActivitySection>

			{/* Urgent queue */}
			<UrgentQueueSection id='urgent-task-queue'>
				<UrgentQueueHeader>
					<div>
							<CardTitle>Systems Needing Attention</CardTitle>
						<UrgentQueueSubtitle>
								The highest-risk maintenance work is surfaced first so you can reduce overdue pressure fast.
						</UrgentQueueSubtitle>
					</div>
					<QueueHeaderActions>
						<QueueFilterPill>
							{allProperties.length === 1
								? 'Single property view'
								: `${allProperties.length} properties in view`}
						</QueueFilterPill>
						{overdueUrgentTasks.length > 0 && (
							<QueueFilterPill $tone='urgent'>
								{overdueUrgentTasks.length} overdue now
							</QueueFilterPill>
						)}
					</QueueHeaderActions>
				</UrgentQueueHeader>

				{urgentTasks.length === 0 ? (
					<UrgentQueueEmpty>Nothing urgent right now. Great job.</UrgentQueueEmpty>
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
								<TaskStatusBadge $status={task.status}>{task.status}</TaskStatusBadge>
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
								<TaskStatusBadge $status={task.status}>{task.status}</TaskStatusBadge>
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

			{/* Seasonal remains useful but secondary */}
			<SeasonalMaintenance
				location={userLocation}
				compact
				onAddTipAsTask={handleAddSeasonalTipTask}
				getAddTipTaskState={getSeasonalTipTaskState}
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

			<TaskModal
				isOpen={showTaskDialog}
				onClose={() => {
					setShowTaskDialog(false);
					setSeasonalTaskDraft(null);
				}}
				editingTaskId={editingTaskId}
				initialTask={seasonalTaskDraft}
				editingTask={
					editingTaskId ? allTasks.find((t) => t.id === editingTaskId) : null
				}
				isEditing={!!editingTaskId}
				assigneeOptions={assigneeOptions}
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
						? allTasks.find((t) => t.id === assigningTaskId)
						: null
				}
				propertyId={
					assigningTaskId
						? allTasks.find((t) => t.id === assigningTaskId)?.propertyId || ''
						: ''
				}
				selectedAssignee={
					assigningTaskId
						? allTasks.find((t) => t.id === assigningTaskId)?.assignedTo
						: null
				}
				assigneeOptions={assigneeOptions}
			/>
		</Wrapper>
	);
};
