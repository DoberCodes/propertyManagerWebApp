import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../../Redux/Store/store';
import { Breadcrumb } from '../../Components/Library/Breadcrumb';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	min-height: 100%;
	background-color: #fafafa;
`;

const Header = styled.div`
	position: relative;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	padding: 22px 18px;
	color: white;
	flex-shrink: 0;
`;

const HeaderContent = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const HeaderTopRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`;

const BackLink = styled.button`
	background: rgba(255, 255, 255, 0.15);
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 999px;
	padding: 8px 12px;
	cursor: pointer;
	font-weight: 600;
	font-size: 13px;
	backdrop-filter: blur(4px);
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.25);
	}
`;

const SuiteTitle = styled.h1`
	margin: 0;
	font-size: 26px;
	font-weight: 600;
	color: white;

	@media (max-width: 768px) {
		font-size: 21px;
	}
`;

const PropertyName = styled.p`
	margin: 0;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
`;

const ContentContainer = styled.div`
	flex: 1;
	padding: 16px;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;
`;

const TabControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0;
	background-color: white;
	border-bottom: 2px solid #e5e7eb;
	border-radius: 8px 8px 0 0;
	padding: 0 16px;
`;

const TabButtonsWrapper = styled.div`
	display: flex;
	gap: 0;
	flex: 1;
	overflow-x: auto;

	&::-webkit-scrollbar {
		height: 4px;
	}

	&::-webkit-scrollbar-thumb {
		background: #c0c0c0;
		border-radius: 2px;
	}
`;

interface TabButtonProps {
	isActive: boolean;
}

const TabButton = styled.button<TabButtonProps>`
	background: none;
	border: none;
	padding: 12px 16px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	color: ${(props) => (props.isActive ? '#22c55e' : '#6b7280')};
	border-bottom: ${(props) => (props.isActive ? '2px solid #22c55e' : 'none')};
	white-space: nowrap;
	transition: all 0.3s ease;

	&:hover {
		color: #22c55e;
	}
`;

const TabContent = styled.div`
	background-color: white;
	border-radius: 0 0 8px 8px;
	padding: 16px;
	margin-top: -2px;
`;

const SectionContainer = styled.div`
	padding: 12px 0;
`;

const SectionHeader = styled.h2`
	font-size: 17px;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 12px 0;
`;

const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 12px;
	margin-bottom: 16px;
`;

const InfoCard = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 12px;
`;

const InfoLabel = styled.label`
	display: block;
	font-size: 12px;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-bottom: 8px;
`;

const InfoValue = styled.p`
	margin: 0;
	font-size: 16px;
	color: #1f2937;
	font-weight: 500;
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

const GridContainer = styled.div`
	overflow-x: auto;
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

export const SuiteDetailPage: React.FC = () => {
	const navigate = useNavigate();
	const { slug, suiteName } = useParams<{ slug: string; suiteName: string }>();
	const [activeTab, setActiveTab] = React.useState<
		'info' | 'occupants' | 'devices' | 'tasks' | 'history' | 'requests'
	>('info');

	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const tasks = useSelector((state: RootState) => state.propertyData.tasks);
	const maintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
	);

	const { property, suite } = useMemo(() => {
		for (const group of propertyGroups) {
			for (const prop of group.properties || []) {
				if (prop.slug === slug && prop.propertyType === 'Commercial') {
					const foundSuite = (prop.suites as any[])?.find(
						(s) => s.name === decodeURIComponent(suiteName || ''),
					);
					if (foundSuite) {
						return { property: prop, suite: foundSuite };
					}
				}
			}
		}
		return { property: null, suite: null };
	}, [propertyGroups, slug, suiteName]);

	const suiteTasks = useMemo(() => {
		if (!property || !suite) return [];
		return tasks.filter(
			(task) => task.property === property.title && task.suiteId === suite.id,
		);
	}, [property, suite, tasks]);

	const suiteMaintenanceHistory = useMemo(() => {
		if (!property || !suite) return [];
		return (property.taskHistory || []).filter(
			(record: any) => record.suite === suite.name,
		);
	}, [property, suite]);

	const suiteRequests = useMemo(() => {
		if (!property || !suite) return [];
		return maintenanceRequests.filter(
			(req) =>
				req.propertyId === (property.id as any) && req.suite === suite.name,
		);
	}, [maintenanceRequests, property, suite]);

	const getDeviceName = (deviceId?: string) => {
		if (!property || !deviceId) return '-';
		const device = property.deviceIds?.find((d: any) => d === deviceId);
		return device ? `Device ${device}` : '-';
	};

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
		<Wrapper>
			<Header>
				<HeaderContent>
					<Breadcrumb
						items={[
							{ label: property.title, path: `/property/${property.slug}` },
							{ label: suite.name },
						]}
					/>
					<HeaderTopRow>
						<BackLink onClick={() => navigate(`/property/${property.slug}`)}>
							← Back to Property
						</BackLink>
					</HeaderTopRow>
					<SuiteTitle>{suite.name}</SuiteTitle>
					<PropertyName>{property.title}</PropertyName>
				</HeaderContent>
			</Header>

			<ContentContainer>
				<TabControlsContainer>
					<TabButtonsWrapper>
						<TabButton
							isActive={activeTab === 'info'}
							onClick={() => setActiveTab('info')}>
							Suite Info
						</TabButton>
						<TabButton
							isActive={activeTab === 'occupants'}
							onClick={() => setActiveTab('occupants')}>
							Occupants{' '}
							{(suite.occupants || []).length
								? `(${(suite.occupants || []).length})`
								: ''}
						</TabButton>
						<TabButton
							isActive={activeTab === 'devices'}
							onClick={() => setActiveTab('devices')}>
							Devices{' '}
							{(suite.deviceIds || []).length
								? `(${(suite.deviceIds || []).length})`
								: ''}
						</TabButton>
						<TabButton
							isActive={activeTab === 'tasks'}
							onClick={() => setActiveTab('tasks')}>
							Tasks ({suiteTasks.length})
						</TabButton>
						<TabButton
							isActive={activeTab === 'history'}
							onClick={() => setActiveTab('history')}>
							Maintenance History ({suiteMaintenanceHistory.length})
						</TabButton>
						<TabButton
							isActive={activeTab === 'requests'}
							onClick={() => setActiveTab('requests')}>
							Requests ({suiteRequests.length})
						</TabButton>
					</TabButtonsWrapper>
				</TabControlsContainer>

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
							{suiteTasks.length > 0 ? (
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
											{suiteTasks.map((task) => (
												<tr key={task.id}>
													<td>
														<strong>{task.title}</strong>
													</td>
													<td>{task.completedBy || 'Unassigned'}</td>
													<td>{task.dueDate}</td>
													<td>{task.status}</td>
													<td>{task.notes || '-'}</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No tasks assigned to this suite</p>
								</EmptyState>
							)}
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
													<td>{getDeviceName((record as any).deviceId)}</td>
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
		</Wrapper>
	);
};
