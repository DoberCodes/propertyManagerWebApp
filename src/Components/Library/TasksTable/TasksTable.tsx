/**
 * Shared TasksTable component
 * Displays tasks in a table format for any entity (Property, Unit, Suite)
 */

import React from 'react';
import styled from 'styled-components';
import { Task } from '../../../types/Task.types';
import { getAssigneeName } from '../../../utils/detailPageUtils';

const GridContainer = styled.div`
	overflow-x: auto;
`;

const GridTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin-top: 12px;

	thead {
		background: #f3f4f6;
	}

	th {
		padding: 12px;
		text-align: left;
		font-weight: 600;
		font-size: 13px;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	td {
		padding: 12px;
		border-bottom: 1px solid #e5e7eb;
		color: #4b5563;
	}

	tbody tr:hover {
		background: #f9fafb;
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;

	p {
		margin: 0;
		font-size: 14px;
	}
`;

interface TasksTableProps {
	tasks: Task[];
	emptyMessage?: string;
	onTaskClick?: (taskId: string) => void;
}

export const TasksTable: React.FC<TasksTableProps> = ({
	tasks,
	emptyMessage = 'No tasks found',
	onTaskClick,
}) => {
	if (tasks.length === 0) {
		return (
			<EmptyState>
				<p>{emptyMessage}</p>
			</EmptyState>
		);
	}

	return (
		<GridContainer>
			<GridTable>
				<thead>
					<tr>
						<th>Task</th>
						<th>Assignee</th>
						<th>Due Date</th>
						<th>Status</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{tasks.map((task) => (
						<tr
							key={task.id}
							onClick={() => onTaskClick?.(task.id)}
							style={{ cursor: onTaskClick ? 'pointer' : 'default' }}>
							<td>
								<strong>{task.title}</strong>
							</td>
							<td>{getAssigneeName(task)}</td>
							<td>{task.dueDate}</td>
							<td>{task.status}</td>
							<td>{task.notes || '-'}</td>
						</tr>
					))}
				</tbody>
			</GridTable>
		</GridContainer>
	);
};
