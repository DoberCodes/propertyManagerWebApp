import React from 'react';
import { RequestsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	TaskStatus,
	ToolbarButton,
	EmptyState,
} from '../PropertyDetailPage.styles';
import { UserRole } from '../../../constants/roles';
import {
	formatDateUtil,
	getPriorityColorUtil,
	getRequestStatusUtil,
} from '../PropertyDetailPage.utils';

export const RequestsTab: React.FC<RequestsTabProps> = ({
	propertyMaintenanceRequests,
	currentUser,
	canApproveMaintenanceRequest,
	handleConvertRequestToTask,
}) => {
	return (
		<SectionContainer>
			<SectionHeader>Maintenance Requests</SectionHeader>

			{propertyMaintenanceRequests.length > 0 ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Status</th>
								<th>Title</th>
								<th>Category</th>
								<th>Priority</th>
								<th>Submitted By</th>
								<th>Unit</th>
								<th>Date</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{propertyMaintenanceRequests.map((request) => (
								<tr key={request.id}>
									<td>
										<TaskStatus status={getRequestStatusUtil(request.status)}>
											{request.status}
										</TaskStatus>
									</td>
									<td>
										<strong>{request.title}</strong>
										<br />
										<small style={{ color: '#666', fontSize: '12px' }}>
											{request.description.substring(0, 80)}
											{request.description.length > 80 && '...'}
										</small>
									</td>
									<td>{request.category}</td>
									<td>
										<span
											style={{
												color: getPriorityColorUtil(request.priority),
												fontWeight: 'bold',
											}}>
											{request.priority}
										</span>
									</td>
									<td>{request.submittedByName}</td>
									<td>
										{request.unit ? (
											<span
												style={{
													backgroundColor: '#e8f5e9',
													padding: '4px 8px',
													borderRadius: '4px',
													fontSize: '12px',
													fontWeight: '500',
													color: '#2e7d32',
												}}>
												{request.unit}
											</span>
										) : (
											<span style={{ color: '#999', fontSize: '12px' }}>
												N/A
											</span>
										)}
									</td>
									<td>{formatDateUtil(request.submittedAt)}</td>
									<td>
										{request.status === 'Pending' &&
											currentUser &&
											canApproveMaintenanceRequest(
												currentUser.role as UserRole,
											) && (
												<ToolbarButton
													onClick={() => handleConvertRequestToTask(request.id)}
													style={{
														padding: '6px 12px',
														fontSize: '13px',
														backgroundColor: '#27ae60',
													}}>
													Convert to Task
												</ToolbarButton>
											)}
										{request.status === 'Converted to Task' && (
											<span style={{ color: '#27ae60', fontSize: '12px' }}>
												✓ Task #{request.convertedToTaskId}
											</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</GridTable>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No maintenance requests for this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
