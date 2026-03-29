import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { ZeroState } from 'Components/Library/ZeroState';
import { useGetPropertiesQuery } from 'Redux/API/propertySlice';
import { filterTasksByRole } from '../../utils/dataFilters';
import { ReusableTable } from '../../Components/Library/ReusableTable';
import { useTaskHandlers } from '../PropertyDetailPage/useTaskHandlers';
import {
	faEdit,
	faTrash,
	faUserPlus,
	faPlus,
	faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Column, Action } from '../../Components/Library/ReusableTable';
import { StatusBadge } from '../PropertyDetailPage/TabSystem/index.styles';
import { MobileTaskCarousel, TaskModal } from '../../Components/Library';
import { TaskAssignModal } from '../../Components/Library/Modal/TaskAssignModal';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
} from '../../Redux/API/taskSlice';
import { Wrapper, TaskGridSection, CarouselSection } from './TasksPage.styles';

import {
	FilterBar,
	FilterConfig,
	FilterValues,
} from 'Components/Library/FilterBar';
import { applyFilters } from '../../utils/tableFilters';
import {
	isTaskOverdueForDisplay,
	matchesDateRangeOrIsOverdue,
	updateOverdueTasks,
} from '../../utils/taskUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { COLORS } from '../../constants/colors';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';

export const TasksPage = () => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	// Select groups from state and derive team members with useMemo
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

	// Locally promote past-due tasks to 'Overdue' status so the UI reflects reality
	// even before the daily Firebase scheduled function runs.
	const [processedTasks, setProcessedTasks] = useState(allTasks);
	useEffect(() => {
		updateOverdueTasks(allTasks).then(setProcessedTasks);
	}, [allTasks]);
	const { data: ownedProperties = [] } = useGetPropertiesQuery();

	// Use account/family accessible properties only.
	const allProperties = useMemo(() => {
		const combined = [...ownedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, currentUser?.hiddenPropertyIds]);

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();

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

	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [taskDaysFilter, setTaskDaysFilter] = useState<number>(30);
	const [filters, setFilters] = useState<FilterValues>({});
	const [showFilters, setShowFilters] = useState(false);
	// track the property id for the task we're assigning so the modal can fetch contractors immediately
	const [assigningTaskPropertyId, setAssigningTaskPropertyId] =
		useState<string>('');

	// create task handler used by buttons
	const handleCreateTask = () => {
		taskHandlers.setEditingTaskId('');
		taskHandlers.setShowTaskDialog(true);
	};

	const isMobile = useSelector((state: RootState) => state.app.isMobile);

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

	// options used by the filter bar dropdown
	const assigneeFilterOptions = useMemo(() => {
		const map = new Map<string, string>();
		allTasks.forEach((task) => {
			let id: string | undefined;
			let name: string | undefined;

			if (task.assignedTo && typeof task.assignedTo === 'object') {
				id = task.assignedTo.id;
				name =
					task.assignedTo.name || task.assignedTo.email || task.assignedTo.id;
			} else if (task.assignee) {
				id = task.assignee;
				name = task.assignee;
			}

			if (id && name && !map.has(id)) {
				map.set(id, name);
			}
		});
		return Array.from(map, ([value, label]) => ({ value, label }));
	}, [allTasks]);

	// property options for filtering on the main tasks page
	const propertyFilterOptions = useMemo(() => {
		return allProperties.map((p) => ({ value: p.id, label: p.title }));
	}, [allProperties]);

	const taskFilters: FilterConfig[] = [
		{
			key: 'propertyId',
			label: 'Property',
			type: 'select',
			options: [
				{ value: '', label: 'All properties' },
				...propertyFilterOptions,
			],
		},
		{
			key: 'status',
			label: 'Status',
			type: 'select',
			options: [
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
				...assigneeFilterOptions,
			],
		},
		{
			key: 'dueDate',
			label: 'Due Date',
			type: 'daterange',
		},
	];

	// Get active tasks for display
	const filteredTasks = useMemo(() => {
		const filtered = filterTasksByRole(
			processedTasks,
			currentUser,
			teamMembers,
			allProperties,
		);
		const activeTasks = filtered.filter((task) => task.status !== 'Completed');

		const now = new Date();
		const daysInMs = taskDaysFilter * 24 * 60 * 60 * 1000;
		const futureDate = new Date(now.getTime() + daysInMs);

		// Enrich tasks for display
		const enriched = activeTasks.map((task) => {
			const property = allProperties.find((p) => p.id === task.propertyId);
			return {
				...task,
				propertyTitle: property?.title || task.property || 'Unknown Property',
				assignedToNames: task.assignedTo?.name || '',
			};
		});

		// Apply text/select filters first, then apply due-date logic so overdue tasks are never hidden.
		const afterNonDateFilters = applyFilters(enriched, filters, {
			textFields: ['title', 'notes'],
			selectFields: [
				{ field: 'propertyId', filterKey: 'propertyId' },
				{ field: 'status', filterKey: 'status' },
				{ field: 'priority', filterKey: 'priority' },
				{
					field: 'assignedTo',
					filterKey: 'assignedTo',
					valueGetter: (task: any) =>
						task.assignedTo && typeof task.assignedTo === 'object'
							? task.assignedTo.id
							: task.assignee,
				},
			],
		});

		const dueDateStart = filters.dueDate_start as string | undefined;
		const dueDateEnd = filters.dueDate_end as string | undefined;

		const afterDateAndTimeFilters = afterNonDateFilters.filter((task) => {
			if (isTaskOverdueForDisplay(task as any)) {
				return true;
			}

			if (!task.dueDate) {
				return false;
			}

			const dueDate = new Date(task.dueDate);
			const withinTimeframe = dueDate >= now && dueDate <= futureDate;
			if (!withinTimeframe) {
				return false;
			}

			return matchesDateRangeOrIsOverdue(
				task as any,
				dueDateStart,
				dueDateEnd,
			);
		});

		// Sort overdue tasks first, then due date and priority.
		const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
		return afterDateAndTimeFilters.sort((a, b) => {
			const overdueA = isTaskOverdueForDisplay(a as any);
			const overdueB = isTaskOverdueForDisplay(b as any);
			if (overdueA !== overdueB) {
				return overdueA ? -1 : 1;
			}

			const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
			const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
			if (dateA !== dateB) {
				return dateA - dateB;
			}
			const priorityA =
				priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
			const priorityB =
				priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
			return priorityB - priorityA;
		});
	}, [
		processedTasks,
		currentUser,
		teamMembers,
		allProperties,
		taskDaysFilter,
		filters,
	]);

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

	// Table columns definition
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
		{
			header: 'Assigned To',
			key: 'assignedTo',
			render: (_unused: any, task: any) =>
				typeof task.assignedTo === 'object'
					? task.assignedTo.name
					: task.assignedTo || 'Unassigned',
		},
		{ header: 'Due Date', key: 'dueDate' },
		{ header: 'Property', key: 'propertyTitle' },
	];

	const taskActions: Action[] = [
		{
			label: 'Edit',
			icon: faEdit,
			onClick: (task: any) => {
				taskHandlers.setEditingTaskId(task.id);
				taskHandlers.setShowTaskDialog(true);
			},
		},
		{
			label: 'Complete',
			icon: faCheck,
			onClick: (task: any) => {
				handleTaskCompletion(task.id);
			},
			disabled: (task: any) => task.status === 'Completed',
		},
		{
			label: 'Assign',
			icon: faUserPlus,
			onClick: (task: any) => {
				// capture both id and property up front to avoid race condition
				taskHandlers.setAssigningTaskId(task.id);
				setAssigningTaskPropertyId(task.propertyId || '');
				taskHandlers.setShowTaskAssignDialog(true);
			},
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (_task: any) => {
				if (window.confirm('Are you sure you want to delete this task?')) {
					// Handle delete logic here
				}
			},
			className: 'delete',
		},
	];

	// Get active tasks for carousel (without enrichment)
	const carouselTasks = useMemo(() => {
		const filtered = filterTasksByRole(
			processedTasks,
			currentUser,
			teamMembers,
			allProperties,
		);
		const activeTasks = filtered.filter((task) => task.status !== 'Completed');

		// Sort by due date (ascending), then by priority (descending)
		const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

		const sorted = activeTasks
			.filter((task) => task.dueDate)
			.sort((a, b) => {
				const overdueA = isTaskOverdueForDisplay(a as any);
				const overdueB = isTaskOverdueForDisplay(b as any);
				if (overdueA !== overdueB) {
					return overdueA ? -1 : 1;
				}

				// Primary (within overdue/non-overdue groups): Sort by due date (soonest first)
			const dateA = new Date(a.dueDate!).getTime();
			const dateB = new Date(b.dueDate!).getTime();
			if (dateA !== dateB) {
				return dateA - dateB;
			}

			// Secondary: Sort by priority (highest first)
			const priorityA =
				priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
			const priorityB =
				priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
			return priorityB - priorityA;
			});

		return sorted;
	}, [processedTasks, currentUser, teamMembers, allProperties]);

	const handleTaskCompletion = (taskId: string) => {
		setCompletingTaskId(taskId);
		setShowTaskCompletionModal(true);
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedRows(new Set());
	};

	return (
		<Wrapper>
			{/* Task Filter Section */}
			<div style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginBottom: showFilters ? '12px' : '0',
					}}>
					<input
						type='text'
						placeholder='Search history, notes...'
						value={(filters.search as string) || ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								search: e.target.value,
							}))
						}
						style={{
							flex: 1,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: '8px 10px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							background: '#f9fafb',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							whiteSpace: 'nowrap',
						}}
						title={showFilters ? 'Hide filters' : 'Show filters'}>
						{showFilters ? '▲ Hide Filters' : '▼ Filters'}
					</button>
				</div>
				{showFilters && (
					<>
						<FilterBar filters={taskFilters} onFiltersChange={setFilters} />
						{/* desktop add button below filter bar */}
					</>
				)}
				{!isMobile && (
					<div style={{ marginTop: '12px', textAlign: 'right' }}>
						<button
							onClick={handleCreateTask}
							style={{
								background: COLORS.primary,
								color: 'white',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '4px',
								fontSize: '16px',
								cursor: 'pointer',
							}}
							title='Create new task'>
							<FontAwesomeIcon icon={faPlus} />
						</button>
					</div>
				)}
			</div>

			{isMobile ? (
				<CarouselSection>
					{/* floating create button for mobile view */}
					<button
						onClick={handleCreateTask}
						style={{
							position: 'fixed',
							bottom: '80px',
							right: '20px',
							width: '60px',
							height: '60px',
							borderRadius: '50%',
							backgroundColor: COLORS.primary,
							color: 'white',
							fontSize: '28px',
							border: 'none',
							boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
							zIndex: 1000,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
						aria-label='Create task'>
						<FontAwesomeIcon icon={faPlus} />
					</button>
					<MobileTaskCarousel
						tasks={carouselTasks}
						onTaskComplete={handleTaskCompletion}
						onTaskUpdate={async (taskId, updates) => {
							try {
								await updateTaskMutation({ id: taskId, updates }).unwrap();
							} catch (error) {
								console.error('Failed to update task from carousel', error);
							}
						}}
						taskHandlers={taskHandlers}
					/>
				</CarouselSection>
			) : (
				<>
					{/* Task Grid Section */}
					<TaskGridSection>
						{filteredTasks.length === 0 ? (
							<ZeroState
								title={
									allTasks.length === 0
										? 'No tasks yet'
										: activeTasksCount === 0
										? 'No active tasks'
										: 'No upcoming tasks in selected timeframe'
								}
								description={
									allTasks.length === 0
										? 'Create your first task to get started'
										: activeTasksCount === 0
										? 'All your tasks are completed'
										: `Try adjusting the time filter above or check tasks in other timeframes`
								}
								icon='📊'></ZeroState>
						) : (
							<ReusableTable
								rowData={filteredTasks}
								columns={columns}
								actions={taskActions}
								onRowSelect={(selectedRows) => {
									setSelectedRows(new Set(selectedRows));
								}}
								selectedRows={selectedRows}
								onSelectAll={(_, selectedRowIds) => {
									setSelectedRows(new Set(selectedRowIds));
								}}
								showCheckbox={false}
								onRowUpdate={(updatedRow) => {
									// Prepare updates for Firebase
									const updates: any = {};

									// Update status if changed
									if (updatedRow.status) {
										updates.status = updatedRow.status;
									}

									// Update priority if changed
									if (updatedRow.priority) {
										updates.priority = updatedRow.priority;
									}

									// Handle logic for updated row, e.g., marking a task as completed
									if (updatedRow.status === 'Completed') {
										handleTaskCompletion(updatedRow.id);
										return;
									}

									// Submit to Firebase if there are updates
									if (Object.keys(updates).length > 0) {
										updateTaskMutation({
											id: updatedRow.id,
											updates,
										}).catch((error) => {
											console.error('Failed to update task:', error);
										});
									}
								}}
							/>
						)}
					</TaskGridSection>
				</>
			)}
			{/* Task Modals */}
			{showTaskDialog && (
				<TaskModal
					isOpen={showTaskDialog}
					onClose={() => setShowTaskDialog(false)}
					editingTaskId={editingTaskId}
					editingTask={
						editingTaskId ? allTasks.find((t) => t.id === editingTaskId) : null
					}
					isEditing={!!editingTaskId}
					propertyOptions={propertyFilterOptions}
					assigneeOptions={assigneeOptions}
					currentUser={currentUser}
				/>
			)}

			{showTaskAssignDialog && (
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
					assigneeOptions={assigneeOptions}
				/>
			)}

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
		</Wrapper>
	);
};
