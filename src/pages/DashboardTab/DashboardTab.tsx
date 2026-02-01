import React, { useState, useMemo, useEffect } from 'react';
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';
import { PageHeaderSection } from '../../Components/Library/PageHeaders';
import { ZeroState } from '../../Components/Library/ZeroState';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
	useGetPropertySharesQuery,
	useCreateNotificationMutation,
	useGetPropertiesQuery,
} from '../../Redux/API/apiSlice';
import { UserRole } from '../../constants/roles';
import { isTenant, getTenantPropertySlug } from '../../utils/permissions';
import { filterTasksByRole } from '../../utils/dataFilters';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { NotificationPanel } from '../../Components/Library/NotificationPanel';
import {
	Wrapper,
	TaskGridSection,
	TableWrapper,
	Table,
	BottomSectionsWrapper,
	Section,
	SectionTitle,
	SectionContent,
} from './DashboardTab.styles';

export const DashboardTab = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups
			.flatMap((group) => group.members || [])
			.filter((member): member is typeof member => member !== undefined),
	);

	// Fetch tasks and properties from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: allProperties = [] } = useGetPropertiesQuery();

	// Firebase mutations
	const [updateTask] = useUpdateTaskMutation();
	const [createNotification] = useCreateNotificationMutation();

	// Pie chart data for efficiency
	const efficiencyData = useMemo(() => {
		const now = new Date();
		let completed = 0,
			inProgress = 0,
			overdue = 0;
		allTasks.forEach((task) => {
			if (task.status === 'Completed') {
				completed++;
			} else if (
				task.dueDate &&
				new Date(task.dueDate) < now &&
				(task.status === 'Pending' ||
					task.status === 'In Progress' ||
					task.status === 'Awaiting Approval' ||
					task.status === 'Rejected')
			) {
				overdue++;
			} else {
				inProgress++;
			}
		});
		return [
			{ name: 'Completed', value: completed },
			{ name: 'In Progress', value: inProgress },
			{ name: 'Overdue', value: overdue },
		];
	}, [allTasks]);

	const COLORS = ['#34d399', '#60a5fa', '#f87171'];

	// Redirect tenants to their assigned property
	useEffect(() => {
		if (currentUser && isTenant(currentUser.role as UserRole)) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, navigate]);

	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

	// Track which task is being assigned
	const assigningTask = allTasks.find((t) => t.id === assigningTaskId);
	// Only fetch property shares for the property of the task being assigned
	const { data: propertyShares = [] } = useGetPropertySharesQuery(
		assigningTask?.propertyId ?? '',
		{ skip: !assigningTask },
	);
	const sharedUsers = propertyShares.map((share) => ({
		id: share.sharedWithUserId || share.sharedWithEmail,
		firstName: share.sharedWithEmail?.split('@')[0] || 'Shared User',
		lastName: '',
		email: share.sharedWithEmail,
		isSharedUser: true,
	}));

	// Filter tasks based on user role and properties
	const filteredTasks = useMemo(() => {
		return filterTasksByRole(allTasks, currentUser, teamMembers, allProperties);
	}, [allTasks, currentUser, teamMembers, allProperties]);

	const handleRowDoubleClick = (taskId: string) => {
		// Navigate to task detail page
		navigate(`/task/${taskId}`);
	};

	const handleRowSelect = (taskId: string) => {
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
			const allTaskIds = filteredTasks.map((task) => task.id);
			setSelectedRows(new Set(allTaskIds));
		} else {
			setSelectedRows(new Set());
		}
	};

	const handleAssignTask = async (
		taskId: string,
		assigneeId: string | null,
	) => {
		try {
			type AssignedToType =
				| { id: string; name: string; email?: string }
				| undefined;
			let assignedTo: AssignedToType = undefined;
			if (assigneeId) {
				let assignee = teamMembers.find((m) => m.id === assigneeId);
				if (!assignee && currentUser && assigneeId === currentUser.id) {
					assignee = {
						id: currentUser.id,
						firstName: currentUser.firstName || '',
						lastName: currentUser.lastName || '',
						email: currentUser.email,
						groupId: '',
						title: currentUser.title || '',
						phone: currentUser.phone || '',
						role: currentUser.role,
						address: '',
						notes: '',
						linkedProperties: [],
						taskHistory: [],
						files: [],
					};
				}
				if (!assignee) {
					const shared = sharedUsers.find((u) => u.id === assigneeId);
					if (shared) {
						assignee = {
							id: shared.id,
							firstName: shared.firstName,
							lastName: shared.lastName,
							email: shared.email,
							groupId: '',
							title: '',
							phone: '',
							role: '',
							address: '',
							notes: '',
							linkedProperties: [],
							taskHistory: [],
							files: [],
						};
					}
				}
				if (assignee) {
					assignedTo = {
						id: assignee.id,
						name:
							assignee.firstName && assignee.lastName
								? `${assignee.firstName} ${assignee.lastName}`
								: assignee.firstName || assignee.email || 'Shared User',
						email: assignee.email,
					};
				}
			}
			await updateTask({
				id: taskId,
				updates: { assignedTo: assignedTo ? assignedTo : undefined },
			}).unwrap();

			// Create notification for task assignment if assignedTo is set
			if (assignedTo && typeof assignedTo === 'object' && 'id' in assignedTo) {
				const taskToAssign = allTasks.find((t) => t.id === taskId);
				const propertyId = taskToAssign?.propertyId;
				const propertyTitle = taskToAssign?.property;
				await createNotification({
					userId: assignedTo.id,
					type: 'task_assigned',
					title: 'Task Assigned',
					message: `You have been assigned to task "${taskToAssign?.title}"`,
					data: {
						taskId: taskId,
						taskTitle: taskToAssign?.title,
						assignedTo,
						propertyId: propertyId,
						propertyTitle: propertyTitle,
					},
					status: 'unread',
					actionUrl: propertyId ? `/properties/${propertyId}` : undefined,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}).unwrap();
			}
			setAssigningTaskId(null);
		} catch (error) {
			console.error('Error assigning task:', error);
		}
	};

	const getAssignedMemberName = (assignedTo?: {
		id: string;
		name: string;
		email?: string;
	}) => {
		if (!assignedTo) return 'Unassigned';
		return assignedTo.name || assignedTo.email || 'Shared User';
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
			<PageHeaderSection>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					{selectedRows.size > 0 && (
						<span style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>
							{selectedRows.size} selected
						</span>
					)}
				</div>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<button
						onClick={handleCompleteTask}
						disabled={selectedRows.size !== 1}
						style={{
							backgroundColor: selectedRows.size === 1 ? '#22c55e' : '#d1d5db',
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
			</PageHeaderSection>

			{/* Task Grid Section */}
			<TaskGridSection>
				{filteredTasks.length === 0 ? (
					<ZeroState
						icon='📋'
						title='No Tasks Yet'
						description='Get started by creating a property and adding tasks to manage your properties effectively.'
						actions={[
							{
								label: 'Go to Properties',
								onClick: () => navigate('/properties'),
								variant: 'primary',
							},
							{
								label: 'Manage Team',
								onClick: () => navigate('/team'),
								variant: 'secondary',
							},
							{
								label: 'Learn More',
								onClick: () => navigate('/docs'),
								variant: 'secondary',
							},
						]}
					/>
				) : (
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
														!filteredTasks.every((t) => selectedRows.has(t.id));
												}
											}}
											checked={
												filteredTasks.length > 0 &&
												filteredTasks.every((t) => selectedRows.has(t.id))
											}
											onChange={(e) => handleSelectAll(e.target.checked)}
											style={{ cursor: 'pointer' }}
										/>
									</th>
									<th>Task</th>
									<th>Assigned To</th>
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
										onDoubleClick={() => handleRowDoubleClick(task.id)}
										style={{
											cursor: 'pointer',
											backgroundColor: selectedRows.has(task.id)
												? 'rgba(34, 197, 94, 0.1)'
												: undefined,
										}}>
										<td style={{ textAlign: 'center', width: '40px' }}>
											<input
												type='checkbox'
												checked={selectedRows.has(task.id)}
												onChange={() => handleRowSelect(task.id)}
												style={{ cursor: 'pointer' }}
												onClick={(e) => e.stopPropagation()}
											/>
										</td>
										<td>{task.title}</td>
										<td>
											{assigningTaskId === task.id ? (
												<select
													value={task.assignedTo?.id || ''}
													onChange={(e) =>
														handleAssignTask(task.id, e.target.value || null)
													}
													onBlur={() => setAssigningTaskId(null)}
													autoFocus
													style={{
														padding: '4px 8px',
														borderRadius: '4px',
														border: '1px solid #22c55e',
														cursor: 'pointer',
													}}>
													<option value=''>Unassigned</option>
													{/* Show all team members */}
													{teamMembers.filter(Boolean).map((member) => (
														<option key={member.id} value={member.id}>
															{member.firstName} {member.lastName}
														</option>
													))}
													{/* Show current user if not in teamMembers */}
													{currentUser &&
														!teamMembers.some(
															(m) => m.id === currentUser.id,
														) && (
															<option
																key={currentUser.id}
																value={currentUser.id}>
																{currentUser.firstName} {currentUser.lastName}{' '}
																(You)
															</option>
														)}
													{/* Show shared users for this property */}
													{sharedUsers
														.filter(
															(user) =>
																user.id !== currentUser?.id &&
																!teamMembers.some((m) => m.id === user.id),
														)
														.map((user) => (
															<option key={user.id} value={user.id}>
																{user.firstName} (Shared User)
															</option>
														))}
												</select>
											) : (
												<span
													onClick={() => setAssigningTaskId(task.id)}
													style={{ cursor: 'pointer', color: '#22c55e' }}>
													{getAssignedMemberName(task.assignedTo)}
												</span>
											)}
										</td>
										<td>{task.dueDate}</td>
										<td>{task.status}</td>
										<td>{task.property}</td>
										<td>{task.notes}</td>
									</tr>
								))}
							</tbody>
						</Table>
					</TableWrapper>
				)}{' '}
			</TaskGridSection>

			{/* Bottom Two Sections */}
			<BottomSectionsWrapper>
				<NotificationPanel />
				<Section>
					<SectionTitle>Efficiency Chart</SectionTitle>
					<SectionContent>
						<ResponsiveContainer width='100%' height={220}>
							<PieChart>
								<Pie
									data={efficiencyData}
									dataKey='value'
									nameKey='name'
									cx='50%'
									cy='50%'
									outerRadius={70}
									label>
									{efficiencyData.map((_, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))}
								</Pie>
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</SectionContent>
				</Section>
				<Section>
					<SectionTitle>My Team</SectionTitle>
					<SectionContent>
						{teamMembers.length > 0 ? (
							<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
								{teamMembers.filter(Boolean).map((member) => (
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
					taskTitle={
						allTasks.find((t) => t.id === completingTaskId)?.title || ''
					}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}
		</Wrapper>
	);
};
