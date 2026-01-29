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
	height: 100%;
	overflow-y: auto;
	background-color: #fafafa;
`;

const Header = styled.div`
	position: relative;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	padding: 30px 20px;
	color: white;
	flex-shrink: 0;
`;

const HeaderContent = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const HeaderTopRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`;

const SlugBadge = styled.span`
	background: #ecfdf3;
	color: #16a34a;
	border: 1px solid #bbf7d0;
	padding: 6px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
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

const UnitTitle = styled.h1`
	margin: 0;
	font-size: 28px;
	font-weight: 600;
	color: white;

	@media (max-width: 768px) {
		font-size: 22px;
	}
`;

const PropertyName = styled.p`
	margin: 0;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
`;

const ContentContainer = styled.div`
	flex: 1;
	padding: 20px;
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
	padding: 20px;
	margin-top: -2px;
`;

const SectionContainer = styled.div`
	padding: 16px 0;
`;

const SectionHeader = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 16px 0;
`;

const InfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-bottom: 20px;
`;

const InfoCard = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
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

	// Get properties from Redux
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const tasks = useSelector((state: RootState) => state.propertyData.tasks);
	const maintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
	);

	// Find the property and unit
	const { property, unit } = useMemo(() => {
		for (const group of propertyGroups) {
			for (const prop of group.properties || []) {
				if (prop.slug === slug && prop.propertyType === 'Multi-Family') {
					const foundUnit = (prop.units as any[])?.find(
						(u) => u.name === decodeURIComponent(unitName || ''),
					);
					if (foundUnit) {
						return { property: prop, unit: foundUnit };
					}
				}
			}
		}
		return { property: null, unit: null };
	}, [propertyGroups, slug, unitName]);

	const unitTasks = useMemo(() => {
		if (!property || !unit) return [];
		return tasks.filter(
			(task) => task.property === property.title && task.unitId === unit.id,
		);
	}, [property, unit, tasks]);

	const unitMaintenanceHistory = useMemo(() => {
		if (!property || !unit) return [];
		return (property.taskHistory || []).filter(
			(record: any) => record.unit === unit.name,
		);
	}, [property, unit]);

	const unitRequests = useMemo(() => {
		if (!property || !unit) return [];
		return maintenanceRequests.filter(
			(req) => req.propertyId === property.id && req.unit === unit.name,
		);
	}, [maintenanceRequests, property, unit]);

	const getDeviceName = (deviceId?: string) => {
		if (!property || !deviceId) return '-';
		const device = property.deviceIds?.find((d: any) => d === deviceId);
		return device ? `Device ${device}` : '-';
	};

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
		<Wrapper>
			<Header>
				<HeaderContent>
					<Breadcrumb
						items={[
							{ label: property.title, path: `/property/${property.slug}` },
							{ label: unit.name },
						]}
					/>
					<HeaderTopRow>
						<SlugBadge>
							{property.slug} / {unit.name.replace(/\s+/g, '-').toLowerCase()}
						</SlugBadge>
						<BackLink onClick={() => navigate(`/property/${property.slug}`)}>
							← Back to Property
						</BackLink>
					</HeaderTopRow>
					<UnitTitle>{unit.name}</UnitTitle>
					<PropertyName>{property.title}</PropertyName>
				</HeaderContent>
			</Header>

			<ContentContainer>
				{/* Tab Navigation */}
				<TabControlsContainer>
					<TabButtonsWrapper>
						<TabButton
							isActive={activeTab === 'info'}
							onClick={() => setActiveTab('info')}>
							Unit Info
						</TabButton>
						<TabButton
							isActive={activeTab === 'occupants'}
							onClick={() => setActiveTab('occupants')}>
							Occupants ({(unit.occupants || []).length})
						</TabButton>
						<TabButton
							isActive={activeTab === 'devices'}
							onClick={() => setActiveTab('devices')}>
							Devices ({(unit.deviceIds || []).length})
						</TabButton>
						<TabButton
							isActive={activeTab === 'tasks'}
							onClick={() => setActiveTab('tasks')}>
							Tasks ({unitTasks.length})
						</TabButton>
						<TabButton
							isActive={activeTab === 'history'}
							onClick={() => setActiveTab('history')}>
							Maintenance History ({unitMaintenanceHistory.length})
						</TabButton>
						<TabButton
							isActive={activeTab === 'requests'}
							onClick={() => setActiveTab('requests')}>
							Requests ({unitRequests.length})
						</TabButton>
					</TabButtonsWrapper>
				</TabControlsContainer>

				{/* Unit Info Tab */}
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
							{unitTasks.length > 0 ? (
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
											{unitTasks.map((task) => (
												<tr key={task.id}>
													<td>
														<strong>{task.title}</strong>
													</td>
													<td>{task.assignedTo || 'Unassigned'}</td>
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
									<p>No tasks assigned to this unit</p>
								</EmptyState>
							)}
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
													<td>{getDeviceName((record as any).deviceId)}</td>
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
		</Wrapper>
	);
};
