import React from 'react';
import { MaintenanceTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../PropertyDetailPage.styles';
import { getDeviceNameUtil } from '../PropertyDetailPage.utils';

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
	property,
	completedTasks = [],
}) => {
	const hasHistory =
		property.maintenanceHistory && property.maintenanceHistory.length > 0;
	const hasCompletedTasks = completedTasks.length > 0;

	return (
		<SectionContainer>
			<SectionHeader>Maintenance History</SectionHeader>

			{hasHistory || hasCompletedTasks ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Date</th>
								<th>Task</th>
								<th>Completed By</th>
								<th>Notes</th>
								<th>Files</th>
							</tr>
						</thead>
						<tbody>
							{/* Display completed tasks */}
							{completedTasks.map((task: any) => (
								<tr key={`task-${task.id}`}>
									<td>{task.completionDate || task.dueDate || '-'}</td>
									<td>
										<strong>{task.title}</strong>
										{task.notes && (
											<>
												<br />
												<small style={{ color: '#666' }}>{task.notes}</small>
											</>
										)}
									</td>
									<td>{task.completedBy || task.assignee || '-'}</td>
									<td>{task.completionNotes || '-'}</td>
									<td>
										{task.completionFile ? (
											<a
												href={task.completionFile.url}
												target='_blank'
												rel='noopener noreferrer'
												style={{ color: '#22c55e' }}>
												📎 {task.completionFile.name}
											</a>
										) : (
											'-'
										)}
									</td>
								</tr>
							))}
							{/* Display legacy maintenance history */}
							{property.maintenanceHistory &&
								property.maintenanceHistory.map(
									(record: any, index: number) => (
										<tr key={`history-${index}`}>
											<td>{record.date}</td>
											<td>{record.description}</td>
											<td>{getDeviceNameUtil(record.deviceId, property)}</td>
											<td>-</td>
											<td>-</td>
										</tr>
									),
								)}
						</tbody>
					</GridTable>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No maintenance history for this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
