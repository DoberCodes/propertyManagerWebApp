import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useDetailPageData } from '../../Hooks/useDetailPageData';
import { DetailPageLayout, TabContent } from '../../Components/Library';
import { TasksTable } from '../../Components/Library/TasksTable';
import { getDeviceName } from '../../utils/detailPageUtils';
import { TabConfig } from '../../types/DetailPage.types';
import {
	InfoGrid,
	InfoCard,
	InfoLabel,
	InfoValue,
	SectionContainer,
	SectionHeader,
} from '../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../../Components/Library/DataGrid/DataGridStyles';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	height: 100%;
	overflow-y: auto;
	background-color: #fafafa;
`;

const ContentContainer = styled.div`
	flex: 1;
	padding: 20px;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;
`;

export const UnitDetailPage: React.FC = () => {
	const navigate = useNavigate();
	const { slug, unitName } = useParams<{ slug: string; unitName: string }>();
	const [activeTab, setActiveTab] = React.useState<
		| 'info'
		| 'tenants'
		| 'occupants'
		| 'devices'
		| 'tasks'
		| 'history'
		| 'requests'
	>('info');

	// Use the generic data hook
	const {
		property,
		entity: unit,
		tasks: unitTasks,
		maintenanceHistory: unitMaintenanceHistory,
		maintenanceRequests: unitRequests,
	} = useDetailPageData({
		propertySlug: slug!,
		entityName: decodeURIComponent(unitName || ''),
		entityType: 'unit',
		propertyType: 'Multi-Family',
	});

	// Tab configuration
	const tabsConfig: TabConfig[] = [
		{ id: 'info', label: 'Unit Info' },
		{ id: 'occupants', label: `Occupants (${(unit?.occupants || []).length})` },
		{ id: 'devices', label: `Devices (${(unit?.deviceIds || []).length})` },
		{ id: 'tasks', label: `Tasks (${unitTasks.length})` },
		{
			id: 'history',
			label: `Maintenance History (${unitMaintenanceHistory.length})`,
		},
		{ id: 'requests', label: `Requests (${unitRequests.length})` },
	];

	if (!property || !unit) {
		return (
			<Wrapper>
				<ContentContainer>
					<EmptyState>
						<p>Unit not found</p>
					</EmptyState>
				</ContentContainer>
			</Wrapper>
		);
	}

	return (
		<DetailPageLayout
			title={unit.name}
			subtitle={property.title}
			breadcrumbs={[
				{ label: property.title, path: `/property/${property.slug}` },
				{ label: unit.name },
			]}
			badge={`${property.slug} / ${unit.name.replace(/\s+/g, '-').toLowerCase()}`}
			backPath={`/property/${property.slug}`}
			tabs={tabsConfig}
			activeTab={activeTab}
			onTabChange={(tab) => setActiveTab(tab as any)}>
			<ContentContainer>
				{activeTab === 'info' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Information</SectionHeader>
							<InfoGrid>
								<InfoCard>
									<InfoLabel>Unit Name</InfoLabel>
									<InfoValue>{unit.name}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Property</InfoLabel>
									<InfoValue>{property.title}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Property Address</InfoLabel>
									<InfoValue>{property.address || 'N/A'}</InfoValue>
								</InfoCard>
							</InfoGrid>
							{unit.notes && (
								<InfoCard>
									<InfoLabel>Notes</InfoLabel>
									<InfoValue>{unit.notes}</InfoValue>
								</InfoCard>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Occupants Tab */}
				{activeTab === 'occupants' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Occupants</SectionHeader>
							{unit.occupants && unit.occupants.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Name</th>
												<th>Email</th>
												<th>Phone</th>
												<th>Lease Start</th>
												<th>Lease End</th>
											</tr>
										</thead>
										<tbody>
											{unit.occupants.map((occupant: any) => (
												<tr key={occupant.id}>
													<td>
														{occupant.firstName} {occupant.lastName}
													</td>
													<td>{occupant.email}</td>
													<td>{occupant.phone}</td>
													<td>{occupant.leaseStart || 'N/A'}</td>
													<td>{occupant.leaseEnd || 'N/A'}</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No occupants assigned to this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Devices Tab */}
				{activeTab === 'devices' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Devices</SectionHeader>
							{unit.deviceIds && unit.deviceIds.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Device ID</th>
											</tr>
										</thead>
										<tbody>
											{unit.deviceIds.map((deviceId: string) => (
												<tr key={deviceId}>
													<td>{deviceId}</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No devices assigned to this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Tasks Tab */}
				{activeTab === 'tasks' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Tasks</SectionHeader>
							<TasksTable
								tasks={unitTasks}
								emptyMessage='No tasks assigned to this unit'
							/>
						</SectionContainer>
					</TabContent>
				)}

				{/* Maintenance History Tab */}
				{activeTab === 'history' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Maintenance History</SectionHeader>
							{unitMaintenanceHistory.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Date</th>
												<th>Description</th>
												<th>Device</th>
											</tr>
										</thead>
										<tbody>
											{unitMaintenanceHistory.map((record, idx) => (
												<tr key={`${record.date}-${idx}`}>
													<td>{record.date}</td>
													<td>{record.description}</td>
													<td>
														{getDeviceName((record as any).deviceId, property)}
													</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No maintenance history for this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{/* Maintenance Requests Tab */}
				{activeTab === 'requests' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Maintenance Requests</SectionHeader>
							{unitRequests.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Status</th>
												<th>Title</th>
												<th>Priority</th>
												<th>Submitted By</th>
												<th>Date</th>
											</tr>
										</thead>
										<tbody>
											{unitRequests.map((req) => (
												<tr key={req.id}>
													<td>{req.status}</td>
													<td>
														<strong>{req.title}</strong>
													</td>
													<td>{req.priority}</td>
													<td>{req.submittedByName}</td>
													<td>
														{req.submittedAt
															? new Date(req.submittedAt).toLocaleDateString()
															: 'N/A'}
													</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No maintenance requests for this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}
			</ContentContainer>
		</DetailPageLayout>
	);
};
