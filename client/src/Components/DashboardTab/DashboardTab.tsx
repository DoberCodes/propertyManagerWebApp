import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';
import { Task } from '../../Redux/Slices/propertyDataSlice';
import {
	canEditTasks,
	canManageProperties,
	isTenant,
	getTenantPropertySlug,
} from '../../utils/permissions';
import { filterTasksByRole } from '../../utils/dataFilters';
import { TaskCompletionModal } from '../Library/TaskCompletionModal';
import {
	Wrapper,
	TaskGridSection,
	TaskGridHeader,
	TaskGridTitle,
	ActionButton,
	ActionDropdown,
	DropdownItem,
	TableWrapper,
	Table,
	BottomSectionsWrapper,
	Section,
	SectionTitle,
	SectionContent,
} from './DashboardTab.styles';

interface TaskWithEdit extends Task {
	isEditing?: boolean;
}

export const DashboardTab = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups.flatMap((group) => group.members),
	);
	const allTasks = useSelector(
		(state: RootState) => state.propertyData.tasks || [],
	);

	// Redirect tenants to their assigned property
	useEffect(() => {
		if (currentUser && isTenant(currentUser.role)) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, navigate]);

	const [actionMenuOpen, setActionMenuOpen] = useState(false);
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
	const [tasks, setTasks] = useState<TaskWithEdit[]>([
		{
			id: 1,
			title: 'Fix plumbing issue',
			dueDate: '2026-02-10',
			status: 'In Progress',
			property: 'Downtown Apartments',
			notes: 'Check main line',
		},
		{
			id: 2,
			title: 'Paint living room',
			dueDate: '2026-02-15',
			status: 'Pending',
			property: 'Sunset Heights',
			notes: 'Use light blue color',
		},
		{
			id: 3,
			title: 'Replace HVAC filter',
			dueDate: '2026-02-05',
			status: 'Completed',
			property: 'Oak Street Complex',
			notes: 'Order replacement parts',
		},
	]);

	// Check if user can edit tasks
	const canEdit = currentUser ? canEditTasks(currentUser.role) : false;
	const canManage = currentUser ? canManageProperties(currentUser.role) : false;

	// Filter tasks based on user role
	const filteredTasks = useMemo(() => {
		const tasksForFilter = tasks as Task[];
		return filterTasksByRole(
			tasksForFilter,
			currentUser,
			teamMembers,
		) as TaskWithEdit[];
	}, [tasks, currentUser, teamMembers]);

	const handleAddTask = () => {
		const newTask: TaskWithEdit = {
			id: Date.now(),
			title: '',
			dueDate: '',
			status: 'Pending',
			property: '',
			notes: '',
			isEditing: true,
		};
		setTasks([...tasks, newTask]);
		setActionMenuOpen(false);
	};

	const handleActionClick = (action: string) => {
		if (action === 'add_task') {
			handleAddTask();
		} else {
			console.log('Action:', action);
			setActionMenuOpen(false);
		}
	};

	const handleCellChange = (
		taskId: number,
		field: keyof Task,
		value: string,
	) => {
		setTasks(
			tasks.map((task) =>
				task.id === taskId ? { ...task, [field]: value } : task,
			),
		);
	};

	const handleCellBlur = (taskId: number) => {
		setTasks(
			tasks.map((task) =>
				task.id === taskId ? { ...task, isEditing: false } : task,
			),
		);
	};

	const handleRowDoubleClick = (taskId: number) => {
		// Navigate to task detail page
		navigate(`/task/${taskId}`);
	};

	const handleRowSelect = (taskId: number) => {
		const newSelected = new Set(selectedRows);
		if (newSelected.has(taskId)) {
			newSelected.delete(taskId);
		} else {
			newSelected.add(taskId);
		}
		setSelectedRows(newSelected);
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const allNonEditingTasks = filteredTasks
				.filter((task) => !task.isEditing)
				.map((task) => task.id);
			setSelectedRows(new Set(allNonEditingTasks));
		} else {
			setSelectedRows(new Set());
		}
	};

	const handleDeleteSelected = () => {
		const filteredTasks = tasks.filter((task) => !selectedRows.has(task.id));
		setTasks(filteredTasks);
		setSelectedRows(new Set());
	};

	const handleCompleteTask = () => {
		if (selectedRows.size === 1) {
			const taskId = Array.from(selectedRows)[0];
			setCompletingTaskId(taskId);
			setShowTaskCompletionModal(true);
		}
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedRows(new Set());
	};

	return (
		<Wrapper>
			{/* Task Grid Section */}
			<TaskGridSection>
				<TaskGridHeader>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<TaskGridTitle>Tasks</TaskGridTitle>
						{selectedRows.size > 0 && (
							<span style={{ fontSize: '12px', color: '#999999' }}>
								({selectedRows.size} selected)
							</span>
						)}
					</div>
					<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
						<button
							onClick={handleCompleteTask}
							disabled={selectedRows.size !== 1}
							style={{
								backgroundColor:
									selectedRows.size === 1 ? '#22c55e' : '#d1d5db',
								color: 'white',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '4px',
								cursor: selectedRows.size === 1 ? 'pointer' : 'not-allowed',
								fontSize: '14px',
								transition: 'background-color 0.2s ease',
							}}
							onMouseEnter={(e) => {
								if (selectedRows.size === 1) {
									e.currentTarget.style.backgroundColor = '#16a34a';
								}
							}}
							onMouseLeave={(e) => {
								if (selectedRows.size === 1) {
									e.currentTarget.style.backgroundColor = '#22c55e';
								}
							}}>
							Mark as Complete
						</button>
					</div>
				</TaskGridHeader>
				<TableWrapper>
					<Table>
						<thead>
							<tr>
								<th style={{ width: '40px', textAlign: 'center' }}>
									<input
										type='checkbox'
										ref={(input) => {
											if (input) {
												input.indeterminate =
													selectedRows.size > 0 &&
													!filteredTasks
														.filter((t) => !t.isEditing)
														.every((t) => selectedRows.has(t.id));
											}
										}}
										checked={
											filteredTasks.filter((t) => !t.isEditing).length > 0 &&
											filteredTasks
												.filter((t) => !t.isEditing)
												.every((t) => selectedRows.has(t.id))
										}
										onChange={(e) => handleSelectAll(e.target.checked)}
										style={{ cursor: 'pointer' }}
									/>
								</th>
								<th>Task</th>
								<th>Due Date</th>
								<th>Status</th>
								<th>Property</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{filteredTasks.map((task) => (
								<tr
									key={task.id}
									onDoubleClick={() =>
										!task.isEditing && handleRowDoubleClick(task.id)
									}
									style={{
										cursor: task.isEditing ? 'default' : 'pointer',
										backgroundColor: selectedRows.has(task.id)
											? 'rgba(34, 197, 94, 0.1)'
											: undefined,
									}}>
									<td style={{ textAlign: 'center', width: '40px' }}>
										{!task.isEditing && (
											<input
												type='checkbox'
												checked={selectedRows.has(task.id)}
												onChange={() => handleRowSelect(task.id)}
												style={{ cursor: 'pointer' }}
												onClick={(e) => e.stopPropagation()}
											/>
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.title}
												onChange={(e) =>
													handleCellChange(task.id, 'title', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter task name'
												autoFocus
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.title
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='date'
												value={task.dueDate}
												onChange={(e) =>
													handleCellChange(task.id, 'dueDate', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.dueDate
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.status}
												onChange={(e) =>
													handleCellChange(task.id, 'status', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter status'
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.status
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.property}
												onChange={(e) =>
													handleCellChange(task.id, 'property', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter property'
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.property
										)}
									</td>
									<td>
										{task.isEditing ? (
											<input
												type='text'
												value={task.notes}
												onChange={(e) =>
													handleCellChange(task.id, 'notes', e.target.value)
												}
												onBlur={() => handleCellBlur(task.id)}
												placeholder='Enter notes'
												style={{
													width: '100%',
													border: '1px solid #22c55e',
													background: 'transparent',
													padding: '4px',
													fontSize: '14px',
												}}
											/>
										) : (
											task.notes
										)}
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</TableWrapper>
			</TaskGridSection>

			{/* Bottom Three Sections */}
			<BottomSectionsWrapper>
				<Section>
					<SectionTitle>Notifications</SectionTitle>
					<SectionContent>No new notifications</SectionContent>
				</Section>
				<Section>
					<SectionTitle>Efficiency Chart</SectionTitle>
					<SectionContent>Chart placeholder</SectionContent>
				</Section>
				<Section>
					<SectionTitle>My Team</SectionTitle>
					<SectionContent>
						{teamMembers.length > 0 ? (
							<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
								{teamMembers.map((member) => (
									<li
										key={member.id}
										style={{
											padding: '8px 0',
											fontSize: '13px',
											color: '#666666',
											borderBottom: '1px solid #f0f0f0',
										}}>
										<div style={{ fontWeight: 'bold' }}>
											{member.firstName} {member.lastName}
										</div>
										<div style={{ fontSize: '12px', color: '#999999' }}>
											{member.title}
										</div>
										<div style={{ fontSize: '12px', color: '#999999' }}>
											{member.email}
										</div>
									</li>
								))}
							</ul>
						) : (
							<div style={{ fontSize: '12px', color: '#999999' }}>
								No team members found
							</div>
						)}
					</SectionContent>
				</Section>
			</BottomSectionsWrapper>

			{/* Task Completion Modal */}
			{showTaskCompletionModal && completingTaskId && (
				<TaskCompletionModal
					taskId={completingTaskId}
					taskTitle={tasks.find((t) => t.id === completingTaskId)?.title || ''}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}
		</Wrapper>
	);
};
