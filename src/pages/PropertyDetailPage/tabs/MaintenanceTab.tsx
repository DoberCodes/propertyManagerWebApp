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
	maintenanceHistoryRecords = [],
}) => {
	const hasHistory =
		property.maintenanceHistory && property.maintenanceHistory.length > 0;
	const hasMaintenanceRecords = maintenanceHistoryRecords.length > 0;

	return (
		<SectionContainer>
			<SectionHeader>Maintenance History</SectionHeader>

			{hasHistory || hasMaintenanceRecords ? (
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
							{/* Display maintenance history records */}
							{maintenanceHistoryRecords.map((record: any) => (
								<tr key={`history-${record.id || record.originalTaskId}`}>
									<td>
										{record.completionDate ||
											record.approvedAt ||
											record.dueDate ||
											'-'}
									</td>
									<td>
										<strong>
											{record.title || record.taskTitle || 'Task'}
										</strong>
										{record.notes && (
											<>
												<br />
												<small style={{ color: '#666' }}>{record.notes}</small>
											</>
										)}
									</td>
									<td>
										{record.completedBy ||
											record.approvedBy ||
											record.assignee ||
											'-'}
									</td>
									<td>{record.completionNotes || '-'}</td>
									<td>
										{record.completionFile ? (
											<a
												href={record.completionFile.url}
												target='_blank'
												rel='noopener noreferrer'
												style={{ color: '#22c55e' }}>
												📎 {record.completionFile.name}
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
