import React from 'react';
import { TasksTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	Toolbar,
	ToolbarButton,
	GridContainer,
	GridTable,
	TaskCheckbox,
	TaskStatus,
	EmptyState,
} from '../PropertyDetailPage.styles';

export const TasksTab: React.FC<TasksTabProps> = ({
	propertyTasks,
	selectedTasks,
	setSelectedTasks,
	handleTaskCheckbox,
	handleCreateTask,
	handleEditTask,
	handleAssignTask,
	handleCompleteTask,
	handleDeleteTask,
}) => {
	return (
		<SectionContainer>
			<SectionHeader>Associated Tasks</SectionHeader>
			<Toolbar>
				<ToolbarButton onClick={handleCreateTask}>+ Create Task</ToolbarButton>
				<ToolbarButton
					disabled={selectedTasks.length !== 1}
					onClick={handleEditTask}>
					Edit Task
				</ToolbarButton>
				<ToolbarButton
					disabled={selectedTasks.length !== 1}
					onClick={handleAssignTask}>
					Assign To
				</ToolbarButton>
				<ToolbarButton
					disabled={selectedTasks.length === 0}
					onClick={handleCompleteTask}
					style={{ backgroundColor: '#22c55e' }}>
					Mark as Complete
				</ToolbarButton>
				<ToolbarButton
					className='delete'
					disabled={selectedTasks.length === 0}
					onClick={handleDeleteTask}>
					Delete Task
				</ToolbarButton>
			</Toolbar>

			{propertyTasks.length > 0 ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th style={{ width: '40px' }}>
									<TaskCheckbox
										onChange={() => {
											if (selectedTasks.length === propertyTasks.length) {
												setSelectedTasks([]);
											} else {
												setSelectedTasks(propertyTasks.map((t) => t.id));
											}
										}}
										checked={selectedTasks.length === propertyTasks.length}
									/>
								</th>
								<th>Task Name</th>
								<th>Assigned To</th>
								<th>Due Date</th>
								<th>Status</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{propertyTasks.map((task) => (
								<tr
									key={task.id}
									style={{
										backgroundColor: selectedTasks.includes(task.id)
											? '#f0fdf4'
											: 'transparent',
									}}>
									<td>
										<TaskCheckbox
											checked={selectedTasks.includes(task.id)}
											onChange={() => handleTaskCheckbox(task.id)}
										/>
									</td>
									<td>
										<strong>{task.title}</strong>
									</td>
									<td>
										{task.assignedTo
											? task.assignedTo.name ||
												task.assignedTo.email ||
												task.assignedTo.id
											: 'Unassigned'}
									</td>
									<td>{task.dueDate}</td>
									<td>
										<TaskStatus status={task.status}>{task.status}</TaskStatus>
									</td>
									<td>{task.notes || '-'}</td>
								</tr>
							))}
						</tbody>
					</GridTable>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No tasks associated with this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
