import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faScrewdriverWrench,
	faClock,
	faCircleCheck,
	faTriangleExclamation,
	faHome,
	faLocationDot,
	faUsers,
	faMicrochip,
	faListCheck,
	faFileLines,
	faCircleExclamation,
	faPenToSquare,
	faUserPlus,
	faPlus,
	faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../Redux/store';
import { useDetailPageData } from 'Hooks/useDetailPageData';
import {
	DetailPageLayout,
	TabContent,
	ReusableTable,
	TaskModal,
	PrimaryButton,
} from 'Components/Library';
import { HeaderlessFeedSurface } from '../../Components/Library/ReusableTable/ReusableTable.styles';
import { Toolbar } from 'pages/PropertyDetailPage/PropertyDetailPage.styles';
import { AddTenantModal } from '../../Components/AddTenantModal';
import { MaintenanceRequestModal } from '../../Components/MaintenanceRequestModal';
import {
	useCreateDeviceMutation,
	useGetUnitDevicesQuery,
} from '../../Redux/API/deviceSlice';
import { useUpdateMaintenanceHistoryMutation } from '../../Redux/API/maintenanceSlice';
import { getDeviceName } from '../../utils/detailPageUtils';
import { TabConfig } from '../../types/DetailPage.types';
import { addMaintenanceRequest } from '../../Redux/Slices/maintenanceRequestsSlice';
import { createMaintenanceRequestUtil } from '../PropertyDetailPage/PropertyDetailPage.utils';
import { MaintenanceRequest } from '../../types/MaintenanceRequest.types';
import { uploadMaintenanceRequestFiles } from '../../utils/maintenanceRequestUpload';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	SectionContainer,
	SectionHeader,
} from '../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../../Components/Library/DataGrid/DataGridStyles';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from '../../utils/financialUtils';
import { getPropertyImageSrc, isPropertyImageFallback } from '../../utils/propertyImagePlaceholder';

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

const InfoLayoutGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
	gap: 16px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const SurfaceCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

const SurfaceHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 14px;
	border-bottom: 1px solid #eef2f7;

	h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
	}
`;

const GhostAction = styled.button`
	border: 1px solid #dbe3ec;
	background: #f8fafc;
	color: #334155;
	font-size: 12px;
	font-weight: 700;
	padding: 6px 10px;
	border-radius: 8px;
	cursor: pointer;
`;

const DetailRows = styled.div`
	display: flex;
	flex-direction: column;
`;

const DetailRow = styled.div`
	display: grid;
	grid-template-columns: 220px minmax(0, 1fr);
	align-items: center;
	padding: 10px 14px;
	border-bottom: 1px solid #f1f5f9;
	gap: 10px;

	&:last-child {
		border-bottom: none;
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 6px;
	}
`;

const DetailLabel = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #64748b;
	display: inline-flex;
	align-items: center;
	gap: 8px;
`;

const DetailValue = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: #0f172a;
`;

const PhotoBody = styled.div`
	padding: 12px;
`;

const PhotoPreview = styled.img`
	width: 100%;
	height: 200px;
	object-fit: cover;
	border-radius: 10px;
	border: 1px solid #dbe3ec;
`;

const StatGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;
	padding: 12px;

	@media (max-width: 640px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
`;

const StatCard = styled.div<{ $tone?: 'danger' | 'default' }>`
	border: 1px solid ${({ $tone }) => ($tone === 'danger' ? '#fecaca' : '#e5e7eb')};
	background: ${({ $tone }) => ($tone === 'danger' ? '#fef2f2' : '#f8fafc')};
	border-radius: 10px;
	padding: 10px;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const StatValue = styled.div`
	font-size: 20px;
	font-weight: 800;
	color: #0f172a;
`;

const StatLabel = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: #64748b;
`;

const ActionList = styled.div`
	display: flex;
	flex-direction: column;
	padding: 4px 10px 10px;
`;

const ActionItem = styled.button<{ $danger?: boolean }>`
	border: none;
	background: transparent;
	text-align: left;
	padding: 10px;
	border-radius: 8px;
	cursor: pointer;
	display: flex;
	align-items: flex-start;
	gap: 10px;
	color: ${({ $danger }) => ($danger ? '#dc2626' : '#0f172a')};

	&:hover {
		background: ${({ $danger }) => ($danger ? '#fef2f2' : '#f8fafc')};
	}
`;

const ActionText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;

	strong {
		font-size: 14px;
		font-weight: 700;
	}

	span {
		font-size: 12px;
		color: #64748b;
	}
`;

export const UnitDetailPage: React.FC = () => {
	const feedback = useAppFeedback();
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

	// Modal states
	const [showAddTenantModal, setShowAddTenantModal] = React.useState(false);
	const [showAddDeviceModal, setShowAddDeviceModal] = React.useState(false);
	const [showCreateTaskModal, setShowCreateTaskModal] = React.useState(false);
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		React.useState(false);

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

	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const dispatch = useDispatch();
	const [updateMaintenanceHistory] = useUpdateMaintenanceHistoryMutation();
	const { data: unitDevices = [], isLoading: devicesLoading } =
		useGetUnitDevicesQuery(unit?.id || '', { skip: !unit?.id });

	const propertyImageSrc = getPropertyImageSrc(property?.image);
	const unitOverdueTasksCount = React.useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return unitTasks.filter((task: any) => {
			if (task.status === 'Completed') return false;
			if (task.status === 'Overdue') return true;
			if (!task.dueDate) return false;
			const dueDate = new Date(task.dueDate);
			if (Number.isNaN(dueDate.getTime())) return false;
			dueDate.setHours(0, 0, 0, 0);
			return dueDate < today;
		}).length;
	}, [unitTasks]);

	const handleMaintenanceRequestSubmit = async (
		request: MaintenanceRequest,
	) => {
		if (!property || !currentUser) return;
		try {
			const rawFiles = (request.files || []).filter(
				(file): file is File => file instanceof File,
			);
			const uploadedFiles = await uploadMaintenanceRequestFiles(
				rawFiles,
				property.id,
			);
			const newRequest = createMaintenanceRequestUtil(
				{
					...request,
					files: uploadedFiles,
				},
				property,
				currentUser,
			);
			dispatch(addMaintenanceRequest(newRequest));
			setShowMaintenanceRequestModal(false);
		} catch (error) {
			console.error('Failed to upload maintenance request files:', error);
			feedback.notify('Failed to upload files. Please try again.');
		}
	};

	const syncTaskMaintenanceLinks = async (
		taskId: string,
		selectedHistoryIds: string[],
	) => {
		for (const historyId of selectedHistoryIds) {
			const record = unitMaintenanceHistory.find(
				(history: any) => history.id === historyId,
			);
			if (!record) continue;
			const linkedTaskIds = record.linkedTaskIds || [];
			const updatedLinkedTaskIds = Array.from(
				new Set([...linkedTaskIds, taskId]),
			);
			await updateMaintenanceHistory({
				id: historyId,
				updates: { linkedTaskIds: updatedLinkedTaskIds },
			}).unwrap();
		}
	};

	// Tab configuration
	const tabsConfig: TabConfig[] = [
		{ id: 'info', label: 'Unit Info' },
		{ id: 'occupants', label: `Occupants (${(unit?.occupants || []).length})` },
		{ id: 'devices', label: `Devices (${unitDevices.length})` },
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
			subtitle={property.address || property.title}
			badge={`${property.slug.toUpperCase()} / ${unit.name.toUpperCase()}`}
			backPath={`/property/${property.slug}`}
			backLabel='← Back to Property'
			headerImageUrl={isPropertyImageFallback(propertyImageSrc) ? undefined : propertyImageSrc}
			tabs={tabsConfig}
			activeTab={activeTab}
			onTabChange={(tab) => setActiveTab(tab as any)}>
			{activeTab === 'info' && (
					<div>
						<InfoLayoutGrid>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								<SurfaceCard>
									<SurfaceHeader>
										<h3>Unit Details</h3>
										<GhostAction onClick={() => setActiveTab('tasks')}>Manage</GhostAction>
									</SurfaceHeader>
									<DetailRows>
										<DetailRow>
											<DetailLabel><FontAwesomeIcon icon={faHome} /> Unit Name</DetailLabel>
											<DetailValue>{unit.name}</DetailValue>
										</DetailRow>
										<DetailRow>
											<DetailLabel><FontAwesomeIcon icon={faLocationDot} /> Property</DetailLabel>
											<DetailValue>{property.title}</DetailValue>
										</DetailRow>
										<DetailRow>
											<DetailLabel><FontAwesomeIcon icon={faLocationDot} /> Address</DetailLabel>
											<DetailValue>{property.address || 'N/A'}</DetailValue>
										</DetailRow>
										<DetailRow>
											<DetailLabel><FontAwesomeIcon icon={faUsers} /> Occupants</DetailLabel>
											<DetailValue>{(unit.occupants || []).length}</DetailValue>
										</DetailRow>
										{unit.notes && (
											<DetailRow>
												<DetailLabel><FontAwesomeIcon icon={faFileLines} /> Notes</DetailLabel>
												<DetailValue>{unit.notes}</DetailValue>
											</DetailRow>
										)}
									</DetailRows>
								</SurfaceCard>

								<SurfaceCard>
									<SurfaceHeader>
										<h3>Important Information</h3>
										<GhostAction onClick={() => setActiveTab('info')}>Edit</GhostAction>
									</SurfaceHeader>
									<DetailRows>
										<DetailRow>
											<DetailLabel>Property Type</DetailLabel>
											<DetailValue>{property.propertyType || 'N/A'}</DetailValue>
										</DetailRow>
										<DetailRow>
											<DetailLabel>Bedrooms / Bathrooms</DetailLabel>
											<DetailValue>{property.bedrooms ?? '-'} / {property.bathrooms ?? '-'}</DetailValue>
										</DetailRow>
										<DetailRow>
											<DetailLabel>Rental Status</DetailLabel>
											<DetailValue>{property.isRental ? 'Rental' : 'Owner Occupied'}</DetailValue>
										</DetailRow>
									</DetailRows>
								</SurfaceCard>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
								<SurfaceCard>
									<SurfaceHeader>
										<h3>Property Photo</h3>
										<GhostAction onClick={() => setActiveTab('devices')}>Edit</GhostAction>
									</SurfaceHeader>
									<PhotoBody>
										<PhotoPreview src={propertyImageSrc} alt={property.title} />
									</PhotoBody>
								</SurfaceCard>

								<SurfaceCard>
									<SurfaceHeader>
										<h3>Details at a Glance</h3>
									</SurfaceHeader>
									<StatGrid>
										<StatCard>
											<StatValue>{unitDevices.length}</StatValue>
											<StatLabel>Devices</StatLabel>
										</StatCard>
										<StatCard>
											<StatValue>{unitTasks.length}</StatValue>
											<StatLabel>Tasks</StatLabel>
										</StatCard>
										<StatCard>
											<StatValue>{unitMaintenanceHistory.length}</StatValue>
											<StatLabel>Maintenance Records</StatLabel>
										</StatCard>
										<StatCard>
											<StatValue>{unitRequests.length}</StatValue>
											<StatLabel>Open Requests</StatLabel>
										</StatCard>
										<StatCard>
											<StatValue>{(unit.occupants || []).length}</StatValue>
											<StatLabel>Occupants</StatLabel>
										</StatCard>
										<StatCard $tone={unitOverdueTasksCount > 0 ? 'danger' : 'default'}>
											<StatValue>{unitOverdueTasksCount}</StatValue>
											<StatLabel>Overdue Tasks</StatLabel>
										</StatCard>
									</StatGrid>
								</SurfaceCard>

								<SurfaceCard>
									<SurfaceHeader>
										<h3>Unit Actions</h3>
									</SurfaceHeader>
									<ActionList>
										<ActionItem onClick={() => setActiveTab('info')}>
											<FontAwesomeIcon icon={faPenToSquare} />
											<ActionText>
												<strong>Edit Unit Details</strong>
												<span>Update unit profile information.</span>
											</ActionText>
										</ActionItem>
										<ActionItem onClick={() => setShowAddTenantModal(true)}>
											<FontAwesomeIcon icon={faUserPlus} />
											<ActionText>
												<strong>Add Occupant</strong>
												<span>Assign a tenant or resident to this unit.</span>
											</ActionText>
										</ActionItem>
										<ActionItem onClick={() => setShowCreateTaskModal(true)}>
											<FontAwesomeIcon icon={faWrench} />
											<ActionText>
												<strong>Create Workflow</strong>
												<span>Start maintenance continuity for this unit.</span>
											</ActionText>
										</ActionItem>
										<ActionItem $danger onClick={() => setActiveTab('tasks')}>
											<FontAwesomeIcon icon={faCircleExclamation} />
											<ActionText>
												<strong>Review Overdue Tasks</strong>
												<span>Jump to unit tasks and clear blockers.</span>
											</ActionText>
										</ActionItem>
									</ActionList>
								</SurfaceCard>
							</div>
						</InfoLayoutGrid>
					</div>
				)}

				{/* Occupants Tab */}
				{activeTab === 'occupants' && (
					<div>
						<SectionContainer>
							<SectionHeader>Unit Occupants</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowAddTenantModal(true)}>
									Add Occupant
								</PrimaryButton>
							</Toolbar>
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
											{unit.occupants.map((occupant: any, idx: number) => (
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
									<p>No occupants assigned to this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</div>
				)}

				{/* Devices Tab */}
				{activeTab === 'devices' && (
					<div>
						<SectionContainer>
							<SectionHeader>Unit Devices</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowAddDeviceModal(true)}>
									Add Device
								</PrimaryButton>
							</Toolbar>
							{devicesLoading ? (
								<div>Loading devices...</div>
							) : unitDevices.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Type</th>
												<th>Brand</th>
												<th>Model</th>
												<th>Status</th>
												<th>Installation Date</th>
											</tr>
										</thead>
										<tbody>
											{unitDevices.map((device, idx) => (
												<tr key={device.id || `device-${idx}`}>
													<td>{device.type}</td>
													<td>{device.brand}</td>
													<td>{device.model}</td>
													<td>
														<span
															style={{
																color:
																	device.status === 'Active'
																		? '#22c55e'
																		: device.status === 'Maintenance'
																		? '#f59e0b'
																		: device.status === 'Broken'
																		? '#ef4444'
																		: '#6b7280',
																fontWeight: 'bold',
															}}>
															{device.status || 'Active'}
														</span>
													</td>
													<td>
														{device.installationDate
															? new Date(
																	device.installationDate,
															  ).toLocaleDateString()
															: 'N/A'}
													</td>
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
					</div>
				)}

				{/* Tasks Tab */}
				{activeTab === 'tasks' && (
					<div>
						<SectionContainer>
							<SectionHeader>Unit Tasks</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowCreateTaskModal(true)}>
									Add Task
								</PrimaryButton>
							</Toolbar>
							<HeaderlessFeedSurface>
								<ReusableTable
									rowData={unitTasks.map((task) => ({
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
									emptyMessage='No unit workflows yet. Add one to keep unit continuity active.'
								/>
							</HeaderlessFeedSurface>
						</SectionContainer>
					</div>
				)}

				{/* Maintenance History Tab */}
				{activeTab === 'history' && (
					<div>
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
												<th>Cost</th>
											</tr>
										</thead>
										<tbody>
											{unitMaintenanceHistory.map((record, idx) => (
												<tr
													key={`${
														record.id || record.originalTaskId || record.date || 'history'
													}-${idx}`}>
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
													<td>
														{formatCurrency(
															getFinancialDisplayTotal((record as any).financials),
															(record as any).financials?.currency || 'USD',
														)}
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
					</div>
				)}

				{/* Maintenance Requests Tab */}
				{activeTab === 'requests' && (
					<div>
						<SectionContainer>
							<SectionHeader>Unit Maintenance Requests</SectionHeader>
							<Toolbar>
								<PrimaryButton
									onClick={() => setShowMaintenanceRequestModal(true)}>
									Add Request
								</PrimaryButton>
							</Toolbar>
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
											{unitRequests.map((req, idx) => (
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
									<p>No maintenance requests for this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</div>
				)}

			{/* Modals */}
			{showAddTenantModal && (
				<AddTenantModal
					open={showAddTenantModal}
					onClose={() => setShowAddTenantModal(false)}
					propertyId={property?.id || ''}
				/>
			)}

			{showAddDeviceModal && (
				<> </>
				// <DeviceModel
				// 	isOpen={showAddDeviceModal}
				// 	onClose={() => setShowAddDeviceModal(false)}
				// 	onSubmit={handleDeviceFormSubmit}
				// 	onFormChange={handleDeviceFormChange}
				// 	deviceFormData={deviceFormData}
				// />
			)}

			{showCreateTaskModal && (
				<TaskModal
					isOpen={showCreateTaskModal}
					onClose={() => setShowCreateTaskModal(false)}
					isEditing={false}
					editingTask={null}
					propertyId={property?.id || ''}
					unitId={unit?.id || ''}
					currentUser={currentUser}
					taskTitlePlaceholder='Enter task title'
					onSaved={(createdTask) => {
						const historyIds = createdTask?.linkedMaintenanceHistoryIds || [];
						if (createdTask?.id && historyIds.length > 0) {
							syncTaskMaintenanceLinks(createdTask.id, historyIds).catch((error) => {
								console.error('Failed to sync maintenance links:', error);
							});
						}
					}}
				/>
			)}

			{showMaintenanceRequestModal && (
				<MaintenanceRequestModal
					isOpen={showMaintenanceRequestModal}
					onClose={() => setShowMaintenanceRequestModal(false)}
					onSubmit={handleMaintenanceRequestSubmit}
					propertyTitle={property.title}
				/>
			)}
		</DetailPageLayout>
	);
};
