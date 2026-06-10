import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import {
	faEdit,
	faTrash,
	faUserPlus,
	faCheckCircle,
	faArrowUpAZ,
	faFan,
	faSnowflake,
	faClipboardCheck,
	faHouse,
	faScrewdriverWrench,
	faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { TasksTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from '../../../Components/Library/FilterBar';
import { applyFilters } from '../../../utils/tableFilters';
import {
	isTaskOverdueForDisplay,
	matchesDateRangeOrIsOverdue,
	updateOverdueTasks,
} from '../../../utils/taskUtils';
import { isTrialExpired } from '../../../utils/subscriptionUtils';
import { ReusableTable, TaskModal } from '../../../Components/Library';
import { Column, Action } from '../../../Components/Library/ReusableTable';
import { WarningDialog } from '../../../Components/Library/WarningDialog';
import { useAppFeedback } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	MobileTaskCard,
	MobileTaskHeader,
	MobileTaskTitle,
	MobileFeedMeta,
	MobileFeedLine,
	MobileFeedLineMuted,
	MobileTaskActions,
	MobileActionButton,
	MobileActionLinkRow,
	MobileActionLinkButton,
	Toolbar,
	ToolbarButton,
	TabSummaryBar,
	TabSummaryPill,
	SectionLead,
	StatusBadge,
	EmptyState,
	DesktopTableWrapper,
} from './index.styles';
import { TaskAssignModal } from '../../../Components/Library/Modal/TaskAssignModal';
import { TaskCompletionModal } from '../../../Components/TaskCompletionModal/TaskCompletionModal';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
} from './mobileUiShared';
import { Task } from '../../../types/Task.types';
import {
	useDeleteTaskMutation,
} from '../../../Redux/API/taskSlice';

export const TasksTab: React.FC<TasksTabProps> = ({
	propertyTasks,
	property,
	currentUser,
	assigneeOptions = [],
	openCreateTaskToken = 0,
}) => {
	const feedback = useAppFeedback();
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);
	const [processedTasks, setProcessedTasks] = useState<any[]>([]);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [quickView, setQuickView] = useState<'all' | 'overdue' | 'inProgress'>('all');
	const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

	const [showAssignModal, setShowAssignModal] = useState(false);
	const [showTaskModal, setShowTaskModal] = useState(false);
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const [isEditing, setIsEditing] = useState(false);
	const { isMobile } = useSelector((state: any) => state.app);

	// Task mutations
	const [deleteTaskMutation] = useDeleteTaskMutation();

	// Wrapper functions for table actions
	const handleCreateTask = () => {
		setIsEditing(false);
		setShowTaskModal(true);
	};

	const handleEditTask = (task: Task) => {
		setSelectedTask(task);
		setIsEditing(true);
		setShowTaskModal(true);
	};

	const handleDeleteTask = (task: Task) => {
		setSelectedTask(task);
		setShowDeleteConfirmation(true);
	};

	const handleAssignTask = (task: Task) => {
		setSelectedTask(task);
		setShowAssignModal(true);
	};

	const handleCompleteTask = (task: Task) => {
		setSelectedTask(task);
		setShowTaskCompletionModal(true);
	};

	const confirmDeleteTask = async () => {
		if (selectedTask) {
			try {
				await deleteTaskMutation(selectedTask.id);
				setShowDeleteConfirmation(false);
				setSelectedTask(null);
				feedback.notify('Task removed. Your queue is now cleaner and easier to manage.');
			} catch (error) {
				console.error('Failed to delete task:', error);
				feedback.notify('Failed to delete task. Please try again.');
			}
		}
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setSelectedTask(null);
	};

	const categoryFilterOptions = useMemo(() => {
		const categories = processedTasks
			.map((task) => task.category)
			.filter(
				(category): category is string =>
					typeof category === 'string' && category.trim().length > 0,
			)
			.map((category) => category.trim());

		return Array.from(new Set(categories)).map((category) => ({
			value: category,
			label: category,
		}));
	}, [processedTasks]);

	const locationFilterOptions = useMemo(() => {
		const locations = processedTasks
			.map((task) => task.location)
			.filter(
				(location): location is string =>
					typeof location === 'string' && location.trim().length > 0,
			)
			.map((location) => location.trim());

		return Array.from(new Set(locations)).map((location) => ({
			value: location,
			label: location,
		}));
	}, [processedTasks]);

	const getPriorityTone = (priority?: string) => {
		switch (priority) {
			case 'Urgent':
			case 'High':
				return '#b91c1c';
			case 'Medium':
				return '#b45309';
			case 'Low':
				return '#166534';
			default:
				return '#475569';
		}
	};

	const formatRelativeTime = (value?: string): string => {
		if (!value) return 'No due date set';
		const target = new Date(value).getTime();
		if (Number.isNaN(target)) return 'No due date set';

		const now = Date.now();
		const diffMs = target - now;
		const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

		if (absDays === 0) return diffMs < 0 ? 'Due today (late)' : 'Due today';
		if (absDays === 1) return diffMs < 0 ? 'Overdue by 1 day' : 'Due tomorrow';
		if (absDays < 7) return diffMs < 0 ? `Overdue by ${absDays} days` : `Due in ${absDays} days`;
		if (absDays < 30) {
			const weeks = Math.floor(absDays / 7);
			return diffMs < 0
				? `Overdue by ${weeks} week${weeks === 1 ? '' : 's'}`
				: `Due in ${weeks} week${weeks === 1 ? '' : 's'}`;
		}

		const months = Math.floor(absDays / 30);
		return diffMs < 0
			? `Overdue by ${months} month${months === 1 ? '' : 's'}`
			: `Due in ${months} month${months === 1 ? '' : 's'}`;
	};

	const getTaskOperationalStatus = (task: any) => {
		const overdue = isTaskOverdueForDisplay(task as Task);
		if (overdue) {
			return {
				label: 'Overdue',
				color: '#991b1b',
				background: '#fee2e2',
				border: '#fca5a5',
			};
		}

		if (task.status === 'In Progress') {
			return {
				label: 'In Progress',
				color: '#1e3a8a',
				background: '#dbeafe',
				border: '#93c5fd',
			};
		}

		if (task.status === 'Completed') {
			return {
				label: 'Recently Serviced',
				color: '#166534',
				background: '#dcfce7',
				border: '#86efac',
			};
		}

		if (task.status === 'Pending' || task.status === 'Awaiting Approval') {
			return {
				label: 'Needs Action',
				color: '#92400e',
				background: '#fffbeb',
				border: '#fcd34d',
			};
		}

		return {
			label: 'Healthy Queue',
			color: '#065f46',
			background: '#ecfdf5',
			border: '#6ee7b7',
		};
	};

	const getTaskIcon = (task: any) => {
		const context = `${task.title || ''} ${task.category || ''} ${task.location || ''}`.toLowerCase();
		if (context.includes('hvac') || context.includes('heat') || context.includes('cool')) {
			return { icon: faFan, color: '#0f766e', background: '#ecfeff' };
		}
		if (context.includes('season') || context.includes('winter') || context.includes('summer')) {
			return { icon: faSnowflake, color: '#1d4ed8', background: '#dbeafe' };
		}
		if (context.includes('inspect') || context.includes('audit')) {
			return { icon: faClipboardCheck, color: '#0369a1', background: '#e0f2fe' };
		}
		if (context.includes('exterior') || context.includes('roof') || context.includes('yard') || context.includes('home')) {
			return { icon: faHouse, color: '#7c2d12', background: '#ffedd5' };
		}
		if (task.status === 'Completed') {
			return { icon: faClockRotateLeft, color: '#166534', background: '#ecfdf5' };
		}
		return { icon: faScrewdriverWrench, color: '#475569', background: '#f1f5f9' };
	};

	const formatRelativePast = (value?: string) => {
		if (!value) return 'No recorded activity yet';
		const target = new Date(value).getTime();
		if (Number.isNaN(target)) return 'No recorded activity yet';
		const diffMs = Date.now() - target;
		const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
		if (absDays === 0) return 'Today';
		if (absDays === 1) return '1 day ago';
		if (absDays < 7) return `${absDays} days ago`;
		if (absDays < 30) {
			const weeks = Math.floor(absDays / 7);
			return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
		}
		const months = Math.floor(absDays / 30);
		return `${months} month${months === 1 ? '' : 's'} ago`;
	};

	const formatMonthYear = (value?: string) => {
		if (!value) return null;
		const target = new Date(value);
		if (Number.isNaN(target.getTime())) return null;
		return target.toLocaleDateString('en-US', {
			month: 'short',
			year: 'numeric',
		});
	};

	const getContinuitySignals = (task: any) => {
		const signals: string[] = [];
		const recurringSince = formatMonthYear(task.createdAt || task.lastRecurrenceDate);

		if (task.isRecurring) {
			signals.push(
				task.recurrenceFrequency
					? `Recurring ${task.recurrenceFrequency}`
					: 'Recurring task',
			);
		}

		if (recurringSince && task.isRecurring) {
			signals.push(`Recurring since ${recurringSince}`);
		}

		if (task.completionDate) {
			signals.push(`Last completed ${formatRelativePast(task.completionDate)}`);
		} else if (task.updatedAt) {
			signals.push(`Last updated ${formatRelativePast(task.updatedAt)}`);
		} else if (task.createdAt) {
			signals.push(`Opened ${formatRelativePast(task.createdAt)}`);
		}

		if (signals.length === 0) {
			signals.push('Awaiting first recorded maintenance event');
		}

		return signals.slice(0, 3);
	};

	const columns: Column[] = [
		{
			header: 'Task',
			key: 'title',
			render: (_value: any, task: any) => {
				const assignee =
					typeof task.assignedTo === 'object'
						? task.assignedTo.name
						: task.assignedTo || 'Unassigned';
				const overdue = isTaskOverdueForDisplay(task as Task);
				const iconStyle = getTaskIcon(task);

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 24,
									height: 24,
									borderRadius: 8,
									color: iconStyle.color,
									background: iconStyle.background,
									flexShrink: 0,
								}}>
								<FontAwesomeIcon icon={iconStyle.icon} />
							</span>
							<div style={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
								{task.title}
							</div>
						</div>
						<div style={{ fontSize: 13, fontWeight: 700, color: '#334155', lineHeight: 1.4 }}>
							{task.category || 'General maintenance'}
							{task.location ? ` • ${task.location}` : ''}
						</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#64748b' }}>
							<span>Assigned To: {assignee}</span>
							<span>•</span>
							<span style={{ color: overdue ? '#b91c1c' : '#64748b', fontWeight: overdue ? 700 : 500 }}>
								{formatRelativeTime(task.dueDate)}
							</span>
							{task.priority && (
								<>
									<span>•</span>
									<span style={{ color: getPriorityTone(task.priority), fontWeight: 700 }}>
										Priority: {task.priority}
									</span>
								</>
							)}
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
							<button
								type='button'
								onClick={() => handleEditTask(task)}
								style={{
									border: 'none',
									background: 'transparent',
									color: '#1d4ed8',
									fontWeight: 700,
									cursor: 'pointer',
									padding: 0,
								}}>
								View history
							</button>
						</div>
					</div>
				);
			},
		},
		{
			header: 'Maintenance Status',
			key: 'updatedAt',
			render: (_value: string, task: any) => {
						const continuitySignals = getContinuitySignals(task);
				const recurringSummary = task.isRecurring
					? task.recurrenceFrequency
						? `Recurring ${task.recurrenceFrequency}`
						: 'Recurring task active'
					: task.completionDate
						? 'Task has recorded maintenance history'
						: 'First maintenance event still pending';
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
							{recurringSummary}
						</div>
						{continuitySignals.slice(1).map((signal, signalIndex) => (
							<div key={`${task.id}-continuity-${signalIndex}`} style={{ fontSize: 12, color: '#64748b' }}>
								{signal}
							</div>
						))}
					</div>
				);
			},
		},
		{
			header: 'State',
			key: 'status',
			render: (_unused: any, task: any) => {
				const chip = getTaskOperationalStatus(task);
				const overdue = isTaskOverdueForDisplay(task as Task);
				const activityText =
					task.status === 'Completed'
						? 'Recorded in maintenance history'
						: task.status === 'In Progress'
							? 'Maintenance in progress'
							: overdue
								? 'Maintenance is overdue'
								: task.status === 'Pending' || task.status === 'Awaiting Approval'
									? 'Waiting for approval'
									: 'Queued for upcoming maintenance';

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								padding: '6px 10px',
								borderRadius: 999,
								fontSize: 12,
								fontWeight: 800,
								letterSpacing: '0.02em',
								color: chip.color,
								background: chip.background,
								border: `1px solid ${chip.border}`,
								width: 'fit-content',
							}}>
							{chip.label}
						</span>
						<div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{activityText}</div>
						<div style={{ fontSize: 12, color: overdue ? '#b91c1c' : '#64748b', fontWeight: overdue ? 700 : 500 }}>
							{formatRelativeTime(task.dueDate)}
						</div>
					</div>
				);
			},
		},
	];

	const taskActions: Action<Task>[] = [
		{
			label: 'Refine Task',
			icon: faEdit,
			onClick: (task: Task) => handleEditTask(task),
		},
		{
			label: 'Assign Owner',
			icon: faUserPlus,
			onClick: (task: Task) => handleAssignTask(task),
		},
		{
			label: 'Complete and Log',
			icon: faCheckCircle,
			onClick: (task: Task) => handleCompleteTask(task),
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (task: Task) => handleDeleteTask(task),
			className: 'delete',
		},
	];

	// Process tasks to mark overdue ones
	useEffect(() => {
		const processTasks = async () => {
			const updatedTasks = await updateOverdueTasks(propertyTasks);
			setProcessedTasks(updatedTasks);
		};

		processTasks();
	}, [propertyTasks]);

	useEffect(() => {
		if (openCreateTaskToken > 0) {
			handleCreateTask();
		}
	}, [openCreateTaskToken]);

	// Filter configuration for tasks
	const taskFilters: FilterConfig[] = [
		{
			key: 'status',
			label: 'Status',
			type: 'select',
			options: [
				{ value: 'Initiated', label: 'Initiated' },
				{ value: 'Pending', label: 'Pending' },
				{ value: 'In Progress', label: 'In Progress' },
				{ value: 'Awaiting Approval', label: 'Awaiting Approval' },
				{ value: 'Completed', label: 'Completed' },
				{ value: 'Rejected', label: 'Rejected' },
				{ value: 'Overdue', label: 'Overdue' },
				{ value: 'Hold', label: 'Hold' },
			],
		},
		{
			key: 'priority',
			label: 'Priority',
			type: 'select',
			options: [
				{ value: 'Low', label: 'Low' },
				{ value: 'Medium', label: 'Medium' },
				{ value: 'High', label: 'High' },
				{ value: 'Urgent', label: 'Urgent' },
			],
		},
		{
			key: 'assignedTo',
			label: 'Assigned To',
			type: 'select',
			options: [
				{ value: 'unassigned', label: 'Unassigned' },
				// Dynamically populate with users from existing tasks
				...Array.from(
					processedTasks
						.filter((task) => task.assignedTo || task.assignee)
						.reduce((uniqueUsers, task) => {
							let userId: string;
							let userName: string;

							if (task.assignedTo && typeof task.assignedTo === 'object') {
								userId = task.assignedTo.id;
								userName =
									task.assignedTo.name ||
									task.assignedTo.email ||
									'Unknown User';
							} else if (task.assignee) {
								userId = task.assignee;
								userName =
									task.assigneeFirstName && task.assigneeLastName
										? `${task.assigneeFirstName} ${task.assigneeLastName}`
										: task.assigneeEmail || task.assignee || 'Unknown User';
							} else {
								return uniqueUsers; // Skip if no assignee info
							}

							// Only add if we haven't seen this user name before
							if (!uniqueUsers.has(userName)) {
								uniqueUsers.set(userName, {
									id: userId,
									name: userName,
								});
							}

							return uniqueUsers;
						}, new Map<string, { id: string; name: string }>())
						.values(),
				).map((user) => ({
					value: (user as { id: string; name: string }).id,
					label: (user as { id: string; name: string }).name,
				})),
			],
		},
		{
			key: 'category',
			label: 'Category',
			type: 'select',
			options: categoryFilterOptions,
		},
		{
			key: 'location',
			label: 'Location',
			type: 'select',
			options: locationFilterOptions,
		},
		{
			key: 'dueDate',
			label: 'Due Date',
			type: 'daterange',
		},
	];

	// Apply filters to tasks
	const filteredTasks = useMemo(() => {
		// Units are temporarily hidden from the app flow; do not apply unit scoping.
		const unitFiltered = processedTasks;

		const filtered = applyFilters(unitFiltered, filters, {
			textFields: ['title', 'notes'],
			selectFields: [
				{ field: 'status', filterKey: 'status' },
				{ field: 'priority', filterKey: 'priority' },
				{ field: 'category', filterKey: 'category' },
				{ field: 'location', filterKey: 'location' },
				{
					field: 'assignedTo',
					filterKey: 'assignedTo',
					valueGetter: (task) =>
						task.assignedTo && typeof task.assignedTo === 'object'
							? task.assignedTo.id
							: task.assignee,
				},
			],
		});

		const dueDateStart = filters.dueDate_start as string | undefined;
		const dueDateEnd = filters.dueDate_end as string | undefined;

		const afterDateFilter = filtered.filter((task) =>
			matchesDateRangeOrIsOverdue(task as Task, dueDateStart, dueDateEnd),
		);

		const quickFiltered = afterDateFilter.filter((task) => {
			if (quickView === 'overdue') {
				return isTaskOverdueForDisplay(task as Task);
			}

			if (quickView === 'inProgress') {
				return task.status === 'In Progress';
			}

			return true;
		});

		const priorityRank: Record<string, number> = {
			Urgent: 0,
			High: 1,
			Medium: 2,
			Low: 3,
		};

		return quickFiltered.sort((a, b) => {
			if (sortBy === 'title') {
				return (a.title || '').localeCompare(b.title || '');
			}

			if (sortBy === 'priority') {
				const rankA = priorityRank[a.priority || 'Low'] ?? 4;
				const rankB = priorityRank[b.priority || 'Low'] ?? 4;
				if (rankA !== rankB) {
					return rankA - rankB;
				}
			}

			const overdueA = isTaskOverdueForDisplay(a as Task);
			const overdueB = isTaskOverdueForDisplay(b as Task);
			if (overdueA !== overdueB) {
				return overdueA ? -1 : 1;
			}

			const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
			const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
			return dateA - dateB;
		});
	}, [processedTasks, filters, quickView, sortBy]);
	const totalTaskCount = processedTasks.length;
	const overdueTaskCount = processedTasks.filter((task) =>
		isTaskOverdueForDisplay(task as Task),
	).length;
	const inProgressTaskCount = processedTasks.filter(
		(task) => task.status === 'In Progress',
	).length;

	const activeFilterChips = useMemo(() => {
		const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

		if (filters.search) {
			chips.push({
				key: 'search',
				label: `Search: ${filters.search}`,
				onRemove: () =>
					setFilters((prev) => ({
						...prev,
						search: '',
					})),
			});
		}

		['status', 'priority', 'category', 'location', 'assignedTo'].forEach((key) => {
			const value = filters[key] as string | undefined;
			if (value) {
				chips.push({
					key,
					label: `${key}: ${value}`,
					onRemove: () =>
						setFilters((prev) => ({
							...prev,
							[key]: '',
						})),
				});
			}
		});

		if (filters.dueDate_start || filters.dueDate_end) {
			chips.push({
				key: 'dueDate',
				label: `Due: ${filters.dueDate_start || '...'} to ${filters.dueDate_end || '...'}`,
				onRemove: () =>
					setFilters((prev) => ({
						...prev,
						dueDate_start: '',
						dueDate_end: '',
					})),
			});
		}

		if (quickView !== 'all') {
			chips.push({
				key: 'quickView',
				label: quickView === 'overdue' ? 'Quick: Overdue' : 'Quick: In Progress',
				onRemove: () => setQuickView('all'),
			});
		}

		return chips;
	}, [filters, quickView]);

	return (
		<SectionContainer>
			<SectionHeader>Maintenance Tasks</SectionHeader>
			<SectionLead>
				Manage recurring tasks, due dates, and overdue maintenance in one place.
			</SectionLead>
			<TabSummaryBar>
				<TabSummaryPill
					as='button'
					onClick={() => setQuickView('all')}
					style={{
						cursor: 'pointer',
						borderRadius: 8,
						padding: '0 12px',
						background: quickView === 'all' ? '#d1fae5' : '#f8fafc',
						borderColor: quickView === 'all' ? '#34d399' : '#e2e8f0',
						color: quickView === 'all' ? '#065f46' : '#475569',
						fontWeight: quickView === 'all' ? 800 : 700,
					}}>
					All Tasks: {totalTaskCount}
				</TabSummaryPill>
				<TabSummaryPill
					as='button'
					onClick={() => setQuickView('overdue')}
					style={{
						cursor: 'pointer',
						borderRadius: 8,
						padding: '0 12px',
						background: quickView === 'overdue' ? '#fee2e2' : '#f8fafc',
						borderColor: quickView === 'overdue' ? '#f87171' : '#e2e8f0',
						color: quickView === 'overdue' ? '#991b1b' : '#475569',
						fontWeight: quickView === 'overdue' ? 800 : 700,
					}}>
					Overdue: {overdueTaskCount}
				</TabSummaryPill>
				<TabSummaryPill
					as='button'
					onClick={() => setQuickView('inProgress')}
					style={{
						cursor: 'pointer',
						borderRadius: 8,
						padding: '0 12px',
						background: quickView === 'inProgress' ? '#dbeafe' : '#f8fafc',
						borderColor: quickView === 'inProgress' ? '#60a5fa' : '#e2e8f0',
						color: quickView === 'inProgress' ? '#1e3a8a' : '#475569',
						fontWeight: quickView === 'inProgress' ? 800 : 700,
					}}>
					In Progress: {inProgressTaskCount}
				</TabSummaryPill>
			</TabSummaryBar>
			<Toolbar style={{ marginBottom: 12 }}>
				<ToolbarButton
					onClick={handleCreateTask}
					style={{ width: isMobile ? '100%' : undefined }}
					disabled={
						currentUser?.subscription &&
						isTrialExpired(currentUser.subscription)
					}
					title={
						currentUser?.subscription &&
						isTrialExpired(currentUser.subscription)
							? 'Upgrade your subscription to add new tasks'
							: undefined
					}>
					+ Create Task
				</ToolbarButton>
				{/* Units are temporarily hidden from the app flow.
				{unitOptions.length > 0 && (
					<div style={{ marginLeft: isMobile ? '0' : '12px', minWidth: isMobile ? '100%' : '220px', width: isMobile ? '100%' : undefined }}>
						<TaskSelect
							name='unitFilter'
							value={selectedUnitId || ''}
							onChange={(value) => onSelectUnit && onSelectUnit(value)}
							placeholder='All units'
							options={[
								{ value: '', label: 'All units' },
								...unitOptions,
							]}
						/>
					</div>
				)}
				*/}
			</Toolbar>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					flexDirection: isMobile ? 'column' : 'row',
					marginBottom: isMobile ? (showFilters ? '12px' : '10px') : showFilters ? '12px' : '0',
				}}>
				<input
					type='text'
					placeholder='Search tasks...'
					value={(filters.search as string) || ''}
					onChange={(e) =>
						setFilters((prev) => ({
							...prev,
							search: e.target.value,
						}))
					}
					style={{
						flex: 1,
						width: isMobile ? '100%' : undefined,
						padding: '8px 12px',
						border: '1px solid #e5e7eb',
						borderRadius: '4px',
						fontSize: '14px',
					}}
				/>
				<select
					value={sortBy}
					onChange={(event) => setSortBy(event.target.value as 'dueDate' | 'priority' | 'title')}
					style={{
						padding: isMobile ? '10px 12px' : '8px 10px',
						width: isMobile ? '100%' : '170px',
						border: '1px solid #e5e7eb',
						borderRadius: '4px',
						background: '#ffffff',
						fontWeight: 600,
					}}
					aria-label='Sort tasks'>
					<option value='dueDate'>Sort: Due Date</option>
					<option value='priority'>Sort: Priority</option>
					<option value='title'>Sort: Title</option>
				</select>
				<button
					onClick={() => setShowFilters(!showFilters)}
					style={{
						padding: isMobile ? '10px 12px' : '8px 10px',
						width: isMobile ? '100%' : undefined,
						border: '1px solid #e5e7eb',
						borderRadius: '4px',
						background: '#f9fafb',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 6,
						whiteSpace: 'nowrap',
					}}
					title={showFilters ? 'Hide filters' : 'Show filters'}>
					<FontAwesomeIcon icon={faArrowUpAZ} />
					{showFilters ? 'Hide Filters' : 'Filters'}
				</button>
				</div>
				{activeFilterChips.length > 0 && (
				<ActiveFilterChips>
					{activeFilterChips.map((chip) => (
						<ActiveFilterChip key={chip.key} onClick={chip.onRemove}>
							{chip.label} ×
						</ActiveFilterChip>
					))}
					<ActiveFilterChipClear
						onClick={() => {
							setFilters({});
							setQuickView('all');
						}}>
						Clear all
					</ActiveFilterChipClear>
				</ActiveFilterChips>
				)}
				{showFilters && (
				<FilterBar
					filters={taskFilters}
					onFiltersChange={setFilters}
					useCustomSelect={true}
				/>
				)}

			{filteredTasks.length > 0 ? (
				<>
					<DesktopTableWrapper>
						<ReusableTable
							columns={columns}
							rowData={filteredTasks}
							getRowClassName={(task: any) =>
								isTaskOverdueForDisplay(task as Task) ? 'overdue-row' : undefined
							}
							actions={taskActions}
							emptyTitle='No tasks yet'
							emptyMessage='Start with one maintenance task to build your service timeline and reminders.'
							emptyActionLabel='Add First Task'
							onEmptyAction={handleCreateTask}
							showCheckbox={false}
							hideHeader={true}
						/>
					</DesktopTableWrapper>

					{/* Mobile Task Cards */}
					<div>
						{filteredTasks.map((task) => {
							const cardAccent =
								task.status === 'Overdue'
									? '#ef4444'
									: task.status === 'In Progress'
									? '#3b82f6'
									: '#94a3b8';

							return (
								<MobileTaskCard
									key={task.id}
									$isSelected={selectedTask === task}
									onClick={() => setSelectedTask(task)}
									style={{ borderLeft: `4px solid ${cardAccent}` }}>
									<MobileTaskHeader>
										<MobileTaskTitle>{task.title}</MobileTaskTitle>
										<StatusBadge status={task.status}>{task.status}</StatusBadge>
									</MobileTaskHeader>

									<MobileFeedMeta>
										<MobileFeedLine>
											{task.category || 'General maintenance'}
											{task.location ? ` • ${task.location}` : ''}
										</MobileFeedLine>
										<MobileFeedLine>
											{task.status === 'Overdue'
												? 'Maintenance is overdue'
												: task.status === 'In Progress'
													? 'Task is actively moving'
												: 'Queued for upcoming maintenance'}
										</MobileFeedLine>
										<MobileFeedLineMuted>
											Assigned to{' '}
											{typeof task.assignedTo === 'object'
												? task.assignedTo.name
												: task.assignedTo || 'Unassigned'}
										</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											{task.priority || 'Low'} priority • {task.dueDate || 'ASAP'}
										</MobileFeedLineMuted>
										{task.isRecurring && (
											<MobileFeedLineMuted>
												Recurring {task.recurrenceFrequency || 'schedule'}
											</MobileFeedLineMuted>
										)}
									</MobileFeedMeta>

									<MobileTaskActions>
										<MobileActionButton
											variant='primary'
											onClick={(e) => {
												e.stopPropagation();
												handleEditTask(task);
											}}
											style={{ flex: 1 }}>
											Refine Task
										</MobileActionButton>
										<MobileActionLinkRow>
											<MobileActionLinkButton
												onClick={(e) => {
													e.stopPropagation();
													handleAssignTask(task);
												}}>
												Assign
											</MobileActionLinkButton>
											<MobileActionLinkButton
											onClick={(e) => {
												e.stopPropagation();
												handleCompleteTask(task);
											}}>
												Complete
											</MobileActionLinkButton>
											<MobileActionLinkButton
												$danger
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task);
											}}>
												Delete
											</MobileActionLinkButton>
										</MobileActionLinkRow>
									</MobileTaskActions>
								</MobileTaskCard>
							);
						})}
					</div>
				</>
			) : (
				<EmptyState>
					<p>No matching tasks yet. Create one to start your maintenance timeline and reminders.</p>
					<ToolbarButton type='button' onClick={handleCreateTask}>
						Add Task
					</ToolbarButton>
				</EmptyState>
			)}



			<TaskAssignModal
				isOpen={showAssignModal}
				task={selectedTask}
				propertyId={''}
				onClose={() => setShowAssignModal(false)}
				selectedAssignee={selectedTask?.assignedTo}
			/>

			<TaskModal
				isOpen={showTaskModal}
				onClose={() => setShowTaskModal(false)}
				editingTask={isEditing ? selectedTask : undefined}
				editingTaskId={isEditing ? selectedTask?.id : undefined}
				isEditing={isEditing}
				propertyId={property?.id || ''}
				unitId=''
				assigneeOptions={assigneeOptions}
				currentUser={currentUser}
				onSaved={(updatedTask) => {
					if (updatedTask) {
						setSelectedTask(updatedTask);
					}
				}}
			/>

			<WarningDialog
				open={showDeleteConfirmation}
				title='Delete Task'
				message={`Are you sure you want to delete the task "${selectedTask?.title}"? This action cannot be undone.`}
				confirmText='Delete'
				cancelText='Cancel'
				onConfirm={confirmDeleteTask}
				onCancel={() => setShowDeleteConfirmation(false)}
			/>

			{showTaskCompletionModal && selectedTask && (
				<TaskCompletionModal
					taskId={selectedTask.id}
					taskTitle={selectedTask.title || ''}
					task={selectedTask}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}
		</SectionContainer>
	);
};
