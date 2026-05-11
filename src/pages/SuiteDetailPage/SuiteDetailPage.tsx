import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faScrewdriverWrench,
	faClock,
	faCircleCheck,
	faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useDetailPageData } from '../../Hooks/useDetailPageData';
import {
	DetailPageLayout,
	TabContent,
	ReusableTable,
} from '../../Components/Library';
import { HeaderlessFeedSurface } from '../../Components/Library/ReusableTable/ReusableTable.styles';
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
			label: `Occupants${
				(suite?.occupants || []).length
					? ` (${(suite?.occupants || []).length})`
					: ''
			}`,
		},
		{
			id: 'devices',
			label: `Devices${
				(suite?.deviceIds || []).length
					? ` (${(suite?.deviceIds || []).length})`
					: ''
			}`,
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
											{suite.occupants.map((occupant: any, idx: number) => (
												<tr
													key={
														occupant.id ||
														`${occupant.email || 'occupant'}-${
															occupant.firstName || ''
														}-${occupant.lastName || ''}-${idx}`
													}
												>
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
											{suite.deviceIds.map((deviceId: string, idx: number) => (
												<tr key={deviceId || `device-${idx}`}>
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
							<HeaderlessFeedSurface>
								<ReusableTable
									rowData={suiteTasks.map((task) => ({
										...task,
										assignedToNames: task.assignee || '',
										propertyTitle: property?.title || '',
									}))}
									columns={[
									{
										header: 'Workflow Summary',
										key: 'title',
										render: (value: string, row: any) => (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
															width: 24,
															height: 24,
															borderRadius: 8,
															background: '#ecfeff',
															color: '#0f766e',
														}}>
														<FontAwesomeIcon icon={faScrewdriverWrench} />
													</span>
													<strong>{value}</strong>
												</div>
												<div style={{ fontSize: 12, color: '#64748b' }}>
													Maintenance Lead: {row.assignedToNames || 'Unassigned'}
												</div>
											</div>
										),
									},
									{
										header: 'Continuity Activity',
										key: 'dueDate',
										render: (value: string, row: any) => {
											const overdue = row.status === 'Overdue';
											return (
												<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
													<div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
														{overdue
															? 'Maintenance continuity interrupted'
															: 'Continuity workflow active'}
													</div>
													<div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center' }}>
														<FontAwesomeIcon icon={faClock} />
														Due: {value || 'No due date set'}
													</div>
												</div>
											);
										},
									},
									{
										header: 'Status',
										key: 'status',
										render: (value: string) => (
											<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<FontAwesomeIcon
													icon={value === 'Overdue' ? faTriangleExclamation : faCircleCheck}
													color={value === 'Overdue' ? '#b91c1c' : '#166534'}
												/>
												<span style={{ fontWeight: 700 }}>{value || 'Pending'}</span>
											</div>
										),
									},
									]}
									showCheckbox={false}
									hideHeader={true}
									emptyMessage='No suite workflows yet. Add one to keep suite continuity active.'
								/>
							</HeaderlessFeedSurface>
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
											{suiteMaintenanceHistory.map((record) => (
												<tr
													key={`${
														record.id || record.originalTaskId || record.date || 'history'
													}`}>
													<td>
														{record.completionDate ||
															record.approvedAt ||
															record.dueDate ||
															record.date ||
															'-'}
													</td>
													<td>
														{record.title ||
															record.taskTitle ||
															record.description ||
															'Task'}
													</td>
													<td>
														{getDeviceName(
															(record as any).deviceId ||
																(Array.isArray((record as any).devices)
																	? (record as any).devices[0]
																	: undefined),
															property,
														)}
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
											{suiteRequests.map((req, idx) => (
												<tr key={req.id || `request-${idx}`}>
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
