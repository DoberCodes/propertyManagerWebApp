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

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ property }) => {
	return (
		<SectionContainer>
			<SectionHeader>Maintenance History</SectionHeader>

			{property.maintenanceHistory && property.maintenanceHistory.length > 0 ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Date</th>
								<th>Task</th>
								<th>Device</th>
								<th>Assignee</th>
								<th>Files</th>
							</tr>
						</thead>
						<tbody>
							{property.maintenanceHistory.map((record: any, index: number) => (
								<tr key={index}>
									<td>{record.date}</td>
									<td>{record.description}</td>
									<td>{getDeviceNameUtil(record.deviceId, property)}</td>
									<td>-</td>
									<td>-</td>
								</tr>
							))}
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
