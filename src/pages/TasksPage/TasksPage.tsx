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
import { TaskModal } from '../../Components/Library';
import { TaskAssignModal } from '../../Components/Library/Modal/TaskAssignModal';
import {
	useGetTasksQuery,
	useDeleteTaskMutation,
	useUpdateTaskMutation,
} from '../../Redux/API/taskSlice';
import {
	Wrapper,
	TaskGridSection,
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
	QuickFilterChips,
	QuickFilterChip,
	UndoToast,
	UndoButton,
} from './TasksPage.styles';

import {
	isTaskOverdueForDisplay,
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

	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [quickFilter, setQuickFilter] = useState<
		'all' | 'overdue' | 'in-progress' | 'unassigned' | 'due-this-week'
	>('all');
	const [sortState, setSortState] = useState<{
		key: string;
		direction: 'asc' | 'desc';
	}>({ key: 'dueDate', direction: 'asc' });
	const [undoToastMessage, setUndoToastMessage] = useState<string | null>(null);
	const [pendingUndo, setPendingUndo] = useState<{
		kind: 'complete' | 'delete';
		taskId: string;
		taskTitle: string;
		timeoutId: number;
	} | null>(null);
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

	// property options for filtering on the main tasks page
	const propertyFilterOptions = useMemo(() => {
		return allProperties.map((p) => ({ value: p.id, label: p.title }));
	}, [allProperties]);

	const handleSort = (key: string) => {
		setSortState((prev) =>
			prev.key === key
				? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
				: { key, direction: 'asc' },
		);
	};

	const clearTopFilters = () => {
		setSearchTerm('');
		setQuickFilter('all');
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

		const now = new Date();

		// Enrich tasks for display
		const enriched = activeTasks.map((task) => {
			const property = allProperties.find((p) => p.id === task.propertyId);
			return {
				...task,
				propertyTitle: property?.title || task.property || 'Unknown Property',
				assignedToNames: task.assignedTo?.name || '',
			};
		});

		// Search over title and notes only.
		const normalizedSearch = searchTerm.trim().toLowerCase();
		const afterSearch = normalizedSearch
			? enriched.filter((task) => {
					const haystack = `${task.title || ''} ${task.notes || ''}`.toLowerCase();
					return haystack.includes(normalizedSearch);
			  })
			: enriched;

		const afterQuickFilter = afterSearch.filter((task) => {
			if (quickFilter === 'all') return true;
			if (quickFilter === 'overdue') return isTaskOverdueForDisplay(task as any);
			if (quickFilter === 'in-progress') return task.status === 'In Progress';
			if (quickFilter === 'unassigned') {
				return !task.assignedTo && !task.assignee;
			}
			if (quickFilter === 'due-this-week') {
				if (!task.dueDate) return false;
				const dueDate = new Date(task.dueDate);
				if (Number.isNaN(dueDate.getTime())) return false;
				const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
				return dueDate >= now && dueDate <= weekOut;
			}
			return true;
		});

		// Keep overdue first, then apply user-selected sort.
		const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
		return afterQuickFilter.sort((a, b) => {
			const overdueA = isTaskOverdueForDisplay(a as any);
			const overdueB = isTaskOverdueForDisplay(b as any);
			if (overdueA !== overdueB) {
				return overdueA ? -1 : 1;
			}

			let baseCompare = 0;
			if (sortState.key === 'dueDate') {
				const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
				const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
				baseCompare = dateA - dateB;
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
				const assigneeA =
					typeof a.assignedTo === 'object'
						? a.assignedTo?.name || ''
						: a.assignedTo || a.assignee || '';
				const assigneeB =
					typeof b.assignedTo === 'object'
						? b.assignedTo?.name || ''
						: b.assignedTo || b.assignee || '';
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
		searchTerm,
		quickFilter,
		sortState,
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
		{ header: 'Title', key: 'title', sortable: true },
		{
			header: 'Status',
			key: 'status',
			sortable: true,
			render: (status: string) => (
				<StatusBadge status={status}>{status}</StatusBadge>
			),
		},
		{ header: 'Priority', key: 'priority', sortable: true },
		{ header: 'Category', key: 'category' },
		{ header: 'Location', key: 'location' },
		{
			header: 'Assigned To',
			key: 'assignedTo',
			sortable: true,
			render: (_unused: any, task: any) =>
				typeof task.assignedTo === 'object'
					? task.assignedTo.name
					: task.assignedTo || 'Unassigned',
		},
		{
			header: 'Due Date',
			key: 'dueDate',
			sortable: true,
			render: (_unused: any, task: any) => task.dueDate || 'ASAP',
		},
		{ header: 'Property', key: 'propertyTitle', sortable: true },
	];

	const handleEditTask = (task: any) => {
		taskHandlers.setEditingTaskId(task.id);
		taskHandlers.setShowTaskDialog(true);
	};

	const handleAssignTask = (task: any) => {
		// Capture both id and property up front to avoid race condition
		taskHandlers.setAssigningTaskId(task.id);
		setAssigningTaskPropertyId(task.propertyId || '');
		taskHandlers.setShowTaskAssignDialog(true);
	};

	const getAssigneeLabel = (task: any) =>
		typeof task.assignedTo === 'object'
			? task.assignedTo.name
			: task.assignedTo || 'Unassigned';

	const formatDueDate = (dueDate?: string) => {
		if (!dueDate) return 'ASAP';
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
				? `Deleting "${action.taskTitle}"...`
				: `Completing "${action.taskTitle}"...`,
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

	const taskActions: Action[] = [
		{
			label: 'Edit',
			icon: faEdit,
			onClick: (task: any) => handleEditTask(task),
		},
		{
			label: 'Complete',
			icon: faCheck,
			onClick: (task: any) => {
				queueUndoableAction({
					kind: 'complete',
					taskId: task.id,
					taskTitle: task.title || 'Task',
				});
			},
			disabled: (task: any) => task.status === 'Completed',
		},
		{
			label: 'Assign',
			icon: faUserPlus,
			onClick: (task: any) => handleAssignTask(task),
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (task: any) => {
				queueUndoableAction({
					kind: 'delete',
					taskId: task.id,
					taskTitle: task.title || 'Task',
				});
			},
			className: 'delete',
		},
	];

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
						marginBottom: '0',
					}}>
					<input
						type='text'
						placeholder='Search history, notes...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							flex: 1,
							padding: '8px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '4px',
							fontSize: '14px',
						}}
					/>
					{!isMobile && (
						<button
							onClick={handleCreateTask}
							style={{
								background: COLORS.primary,
								color: 'white',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '6px',
								fontSize: '0.85rem',
								fontWeight: 700,
								cursor: 'pointer',
								whiteSpace: 'nowrap',
							}}
							title='Create new task'>
							+ Add Task
						</button>
					)}
				</div>
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
						$active={quickFilter === 'in-progress'}
						onClick={() => setQuickFilter('in-progress')}>
						In Progress
					</QuickFilterChip>
					<QuickFilterChip
						$active={quickFilter === 'unassigned'}
						onClick={() => setQuickFilter('unassigned')}>
						Unassigned
					</QuickFilterChip>
					<QuickFilterChip
						$active={quickFilter === 'due-this-week'}
						onClick={() => setQuickFilter('due-this-week')}>
						Due This Week
					</QuickFilterChip>
					{(searchTerm.trim().length > 0 || quickFilter !== 'all') && (
						<QuickFilterChip onClick={clearTopFilters}>Clear</QuickFilterChip>
					)}
				</QuickFilterChips>
				<div
					style={{
						marginTop: '10px',
						fontSize: '0.8rem',
						fontWeight: 600,
						color: '#6b7280',
					}}>
					Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
				</div>
			</div>

			{isMobile ? (
				<MobileListSection>
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
					{filteredTasks.length === 0 ? (
						<ZeroState
							title={
								allTasks.length === 0
									? 'No tasks yet'
									: activeTasksCount === 0
									? 'No active tasks'
									: 'No tasks match your search or filter'
							}
							description={
								allTasks.length === 0
									? 'Create your first task to get started'
									: activeTasksCount === 0
									? 'All your tasks are completed'
									: 'Try a different search term or quick filter chip'
							}
							icon='📊'
						/>
					) : (
						filteredTasks.map((task: any) => {
							const isOverdue = isTaskOverdueForDisplay(task);
							return (
								<MobileTaskCard key={task.id} $overdue={isOverdue}>
									<MobileTaskHeader>
										<MobileTaskTitle>{task.title}</MobileTaskTitle>
										<StatusBadge status={task.status}>
											{task.status}
										</StatusBadge>
									</MobileTaskHeader>
									<MobileTaskMetaGrid>
										<MobileMetaItem>
											<MobileMetaLabel>Due Date</MobileMetaLabel>
											<MobileMetaValue>{formatDueDate(task.dueDate)}</MobileMetaValue>
										</MobileMetaItem>
										<MobileMetaItem>
											<MobileMetaLabel>Priority</MobileMetaLabel>
											<MobileMetaValue>{task.priority || 'Low'}</MobileMetaValue>
										</MobileMetaItem>
										<MobileMetaItem>
											<MobileMetaLabel>Assigned To</MobileMetaLabel>
											<MobileMetaValue>{getAssigneeLabel(task)}</MobileMetaValue>
										</MobileMetaItem>
										<MobileMetaItem>
											<MobileMetaLabel>Property</MobileMetaLabel>
											<MobileMetaValue>
												{task.propertyTitle || task.property || 'Unknown Property'}
											</MobileMetaValue>
										</MobileMetaItem>
									</MobileTaskMetaGrid>
									<MobileTaskActions>
										<MobileActionButton onClick={() => handleEditTask(task)}>
											Edit
										</MobileActionButton>
										<MobileActionButton
											$variant='secondary'
											onClick={() => handleAssignTask(task)}>
											Assign
										</MobileActionButton>
										{task.status !== 'Completed' && (
											<MobileActionButton
												$variant='success'
												onClick={() =>
													queueUndoableAction({
														kind: 'complete',
														taskId: task.id,
														taskTitle: task.title || 'Task',
													})
												}>
												Complete
											</MobileActionButton>
										)}
										<MobileActionButton
											$variant='secondary'
											onClick={() =>
												queueUndoableAction({
													kind: 'delete',
													taskId: task.id,
													taskTitle: task.title || 'Task',
												})
											}>
											Delete
										</MobileActionButton>
									</MobileTaskActions>
								</MobileTaskCard>
							);
						})
					)}
				</MobileListSection>
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
										: 'No tasks match your search or filter'
								}
								description={
									allTasks.length === 0
										? 'Create your first task to get started'
										: activeTasksCount === 0
										? 'All your tasks are completed'
										: 'Try a different search term or quick filter chip'
								}
								icon='📊'></ZeroState>
						) : (
							<ReusableTable
								rowData={filteredTasks}
								columns={columns}
								actions={taskActions}
								sortState={sortState}
								onSort={handleSort}
								getRowClassName={(row) =>
									isTaskOverdueForDisplay(row as any) ? 'overdue-row' : undefined
								}
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

			{undoToastMessage && pendingUndo && (
				<UndoToast>
					<span>{undoToastMessage}</span>
					<UndoButton type='button' onClick={handleUndoPendingAction}>
						Undo
					</UndoButton>
				</UndoToast>
			)}
		</Wrapper>
	);
};
