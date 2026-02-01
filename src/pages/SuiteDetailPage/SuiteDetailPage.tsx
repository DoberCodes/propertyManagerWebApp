import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useDetailPageData } from '../../Hooks/useDetailPageData';
import { DetailPageLayout } from '../../Components/Library/DetailPageLayout';
import { TasksTable } from '../../Components/Library/TasksTable';
import { getDeviceName } from '../../utils/detailPageUtils';
import { TabConfig } from '../../types/DetailPage.types';
import { TabContent } from '../../Components/Library/Tabs/TabStyles';
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
	min-height: 100%;
	background-color: #fafafa;
`;

const ContentContainer = styled.div`
	flex: 1;
	padding: 16px;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;
`;

export const SuiteDetailPage: React.FC = () => {
	const navigate = useNavigate();
	const { slug, suiteName } = useParams<{ slug: string; suiteName: string }>();
	const [activeTab, setActiveTab] = React.useState<
		'info' | 'occupants' | 'devices' | 'tasks' | 'history' | 'requests'
	>('info');

	// Use the generic data hook
	const {
		property,
		entity: suite,
		tasks: suiteTasks,
		maintenanceHistory: suiteMaintenanceHistory,
		maintenanceRequests: suiteRequests,
	} = useDetailPageData({
		propertySlug: slug!,
		entityName: decodeURIComponent(suiteName || ''),
		entityType: 'suite',
		propertyType: 'Commercial',
	});

	// Tab configuration
	const tabsConfig: TabConfig[] = [
		{ id: 'info', label: 'Suite Info' },
		{
			id: 'occupants',
			label: `Occupants${(suite?.occupants || []).length ? ` (${(suite?.occupants || []).length})` : ''}`,
		},
		{
			id: 'devices',
			label: `Devices${(suite?.deviceIds || []).length ? ` (${(suite?.deviceIds || []).length})` : ''}`,
		},
		{ id: 'tasks', label: `Tasks (${suiteTasks.length})` },
		{
			id: 'history',
			label: `Maintenance History (${suiteMaintenanceHistory.length})`,
		},
		{ id: 'requests', label: `Requests (${suiteRequests.length})` },
	];

	if (!property || !suite) {
		return (
			<Wrapper>
				<ContentContainer>
					<EmptyState>
						<p>Suite not found</p>
					</EmptyState>
				</ContentContainer>
			</Wrapper>
		);
	}

	return (
		<DetailPageLayout
			title={suite.name}
			subtitle={property.title}
			breadcrumbs={[
				{ label: property.title, path: `/property/${property.slug}` },
				{ label: suite.name },
			]}
			backPath={`/property/${property.slug}`}
			tabs={tabsConfig}
			activeTab={activeTab}
			onTabChange={(tab) => setActiveTab(tab as any)}>
			<ContentContainer>
				{activeTab === 'info' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suite Information</SectionHeader>
							<InfoGrid>
								<InfoCard>
									<InfoLabel>Suite Name</InfoLabel>
									<InfoValue>{suite.name}</InfoValue>
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
							{suite.notes && (
								<InfoCard>
									<InfoLabel>Notes</InfoLabel>
									<InfoValue>{suite.notes}</InfoValue>
								</InfoCard>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'occupants' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suite Occupants</SectionHeader>
							{suite.occupants && suite.occupants.length > 0 ? (
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
											{suite.occupants.map((occupant: any) => (
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
									<p>No tenants assigned to this suite</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'devices' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suite Devices</SectionHeader>
							{suite.deviceIds && suite.deviceIds.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Device ID</th>
											</tr>
										</thead>
										<tbody>
											{suite.deviceIds.map((deviceId: string) => (
												<tr key={deviceId}>
													<td>{deviceId}</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No devices assigned to this suite</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'tasks' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suite Tasks</SectionHeader>
							<TasksTable
								tasks={suiteTasks}
								emptyMessage='No tasks assigned to this suite'
							/>
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'history' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suite Maintenance History</SectionHeader>
							{suiteMaintenanceHistory.length > 0 ? (
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
											{suiteMaintenanceHistory.map((record, idx) => (
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
									<p>No maintenance history for this suite</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'requests' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suite Maintenance Requests</SectionHeader>
							{suiteRequests.length > 0 ? (
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
											{suiteRequests.map((req) => (
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
									<p>No maintenance requests for this suite</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}
			</ContentContainer>
		</DetailPageLayout>
	);
};
