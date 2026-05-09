import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import {
	faEdit,
	faTrash,
	faUserPlus,
	faCheckCircle,
	faCalendarDays,
	faFlag,
	faUser,
	faPlus,
	faArrowUpAZ,
} from '@fortawesome/free-solid-svg-icons';
import { TasksTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { TaskSelect } from '../../../Components/Library/Select/TaskSelect';
import { GridContainer } from './index.styles';
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
import {
	MobileTaskCard,
	MobileTaskHeader,
	MobileTaskTitle,
	MobileTaskMeta,
	MobileTaskRow,
	MobileTaskLabel,
	MobileTaskValue,
	MobileTaskActions,
	MobileActionButton,
	Toolbar,
	ToolbarButton,
	TabSummaryBar,
	TabSummaryPill,
	StatusBadge,
	EmptyState,
	DesktopTableWrapper,
} from './index.styles';
import { TaskAssignModal } from '../../../Components/Library/Modal/TaskAssignModal';
import {
	ActiveFilterChips,
	ActiveFilterChip,
	ActiveFilterChipClear,
} from './mobileUiShared';
import { Task } from '../../../types/Task.types';
import {
	useDeleteTaskMutation,
	useUpdateTaskMutation,
} from '../../../Redux/API/taskSlice';

export const TasksTab: React.FC<TasksTabProps> = ({
	propertyTasks,
	property,
	currentUser,
	assigneeOptions = [],
	unitOptions = [],
	selectedUnitId,
	onSelectUnit,
}) => {
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);
	const [processedTasks, setProcessedTasks] = useState<any[]>([]);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [quickView, setQuickView] = useState<'all' | 'overdue' | 'inProgress'>('all');
	const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

	const [showAssignModal, setShowAssignModal] = useState(false);
	const [showTaskModal, setShowTaskModal] = useState(false);
	const [showCompleteTaskConfirmation, setShowCompleteTaskConfirmation] =
		useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const [isEditing, setIsEditing] = useState(false);
	const { isMobile } = useSelector((state: any) => state.app);

	// Task mutations
	const [deleteTaskMutation] = useDeleteTaskMutation();
	const [updateTaskMutation] = useUpdateTaskMutation();

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
		setShowCompleteTaskConfirmation(true);
	};

	const confirmDeleteTask = async () => {
		if (selectedTask) {
			try {
				await deleteTaskMutation(selectedTask.id);
				setShowDeleteConfirmation(false);
				setSelectedTask(null);
			} catch (error) {
				console.error('Failed to delete task:', error);
				alert('Failed to delete task. Please try again.');
			}
		}
	};

	const confirmCompleteTask = async () => {
		if (selectedTask) {
			try {
				await updateTaskMutation({
					id: selectedTask.id,
					updates: { status: 'Completed' },
				});
				setShowCompleteTaskConfirmation(false);
				setSelectedTask(null);
			} catch (error) {
				console.error('Failed to complete task:', error);
			}
		}
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

	const columns: Column[] = [
		{ header: 'Title', key: 'title' },
		{
			header: 'Status',
			key: 'status',
			render: (status: string) => (
				<StatusBadge status={status}>{status}</StatusBadge>
			),
		},
		{ header: 'Priority', key: 'priority' },
		{ header: 'Category', key: 'category' },
		{ header: 'Location', key: 'location' },
		{
			header: 'Assigned To',
			key: 'assignedTo',
			render: (_unused: any, task: any) =>
				typeof task.assignedTo === 'object'
					? task.assignedTo.name
					: task.assignedTo || 'Unassigned',
		},
		{
			header: 'Due Date',
			key: 'dueDate',
			render: (_unused: any, task: any) => task.dueDate || 'ASAP',
		},
	];

	const taskActions: Action<Task>[] = [
		{
			label: 'Edit',
			icon: faEdit,
			onClick: (task: Task) => handleEditTask(task),
		},
		{
			label: 'Assign',
			icon: faUserPlus,
			onClick: (task: Task) => handleAssignTask(task),
		},
		{
			label: 'Complete',
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
		const filtered = applyFilters(processedTasks, filters, {
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

	return (
		<SectionContainer>
			<SectionHeader>Associated Tasks</SectionHeader>
			<div
				style={{
					fontSize: 12,
					fontWeight: 700,
					letterSpacing: '0.06em',
					textTransform: 'uppercase',
					color: '#64748b',
					marginBottom: 6,
				}}>
				Quick Filters
			</div>
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
			<Toolbar>
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
			</Toolbar>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					flexDirection: isMobile ? 'column' : 'row',
					marginBottom: showFilters ? '12px' : '0',
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
						<GridContainer>
							<ReusableTable
								columns={columns}
								rowData={filteredTasks}
								actions={taskActions}
								showCheckbox={false}
							/>
						</GridContainer>
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

									<MobileTaskMeta>
										<MobileTaskRow>
											<MobileTaskLabel>
												<FontAwesomeIcon icon={faUser} /> Assigned To
											</MobileTaskLabel>
											<MobileTaskValue>
												{typeof task.assignedTo === 'object'
													? task.assignedTo.name
													: task.assignedTo || 'Unassigned'}
											</MobileTaskValue>
										</MobileTaskRow>

										<MobileTaskRow>
											<MobileTaskLabel>
												<FontAwesomeIcon icon={faCalendarDays} /> Due Date
											</MobileTaskLabel>
											<MobileTaskValue>{task.dueDate || 'ASAP'}</MobileTaskValue>
										</MobileTaskRow>

										{task.priority && (
											<MobileTaskRow>
												<MobileTaskLabel>
													<FontAwesomeIcon icon={faFlag} /> Priority
												</MobileTaskLabel>
												<MobileTaskValue style={{ color: getPriorityTone(task.priority) }}>
													{task.priority}
												</MobileTaskValue>
											</MobileTaskRow>
										)}

										{task.category && (
											<MobileTaskRow>
												<MobileTaskLabel>Category</MobileTaskLabel>
												<MobileTaskValue>{task.category}</MobileTaskValue>
											</MobileTaskRow>
										)}

										{task.location && (
											<MobileTaskRow>
												<MobileTaskLabel>Location</MobileTaskLabel>
												<MobileTaskValue>{task.location}</MobileTaskValue>
											</MobileTaskRow>
										)}
									</MobileTaskMeta>

									<MobileTaskActions>
										<MobileActionButton
											variant='secondary'
											onClick={(e) => {
												e.stopPropagation();
												handleCompleteTask(task);
											}}
											style={{ flex: 1 }}>
											Complete
										</MobileActionButton>
										<MobileActionButton
											variant='secondary'
											onClick={(e) => {
												e.stopPropagation();
												handleEditTask(task);
											}}
											style={{ flex: 1 }}>
											Edit
										</MobileActionButton>
										<MobileActionButton
											variant='danger'
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task);
											}}
											style={{ flex: 1 }}>
											Delete
										</MobileActionButton>
									</MobileTaskActions>
								</MobileTaskCard>
							);
						})}
					</div>
				</>
			) : (
				<EmptyState>
					<p>No tasks associated with this property</p>
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
				unitId={selectedUnitId}
				unitOptions={unitOptions}
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

			<WarningDialog
				open={showCompleteTaskConfirmation}
				title='Complete Task'
				message={`Are you sure you want to mark the task "${selectedTask?.title}" as completed?`}
				confirmText='Complete'
				cancelText='Cancel'
				onConfirm={confirmCompleteTask}
				onCancel={() => setShowCompleteTaskConfirmation(false)}
			/>
		</SectionContainer>
	);
};
