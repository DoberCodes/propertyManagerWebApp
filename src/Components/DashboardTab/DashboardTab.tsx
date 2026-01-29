import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/Store/store';
import { PageHeaderSection } from '../Library/PageHeaders';
import { ZeroState } from '../Library/ZeroState';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
} from '../../Redux/API/apiSlice';
import { UserRole } from '../../constants/roles';
import { isTenant, getTenantPropertySlug } from '../../utils/permissions';
import { filterTasksByRole } from '../../utils/dataFilters';
import { TaskCompletionModal } from '../Library/TaskCompletionModal';
import { InvitationsPanel } from '../Library/InvitationsPanel';
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

	// Fetch tasks from Firebase
	const { data: allTasks = [] } = useGetTasksQuery(currentUser!.id);

	// Firebase mutations
	const [updateTask] = useUpdateTaskMutation();

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

	// Filter tasks based on user role
	const filteredTasks = useMemo(() => {
		return filterTasksByRole(allTasks, currentUser, teamMembers);
	}, [allTasks, currentUser, teamMembers]);

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

	const handleAssignTask = async (taskId: string, memberId: string | null) => {
		try {
			await updateTask({
				id: taskId,
				updates: { assignedTo: memberId || undefined },
			}).unwrap();
			setAssigningTaskId(null);
		} catch (error) {
			console.error('Error assigning task:', error);
		}
	};

	const getAssignedMemberName = (memberId?: string) => {
		if (!memberId) return 'Unassigned';
		const member = teamMembers.find((m) => m.id === memberId);
		return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
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

			{/* Invitations Panel */}
			<InvitationsPanel
				userEmail={currentUser!.email}
				userId={currentUser!.id}
			/>

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
													value={task.assignedTo || ''}
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
													{teamMembers.filter(Boolean).map((member) => (
														<option key={member.id} value={member.id}>
															{member.firstName} {member.lastName}
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
