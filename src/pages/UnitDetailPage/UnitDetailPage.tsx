import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useDetailPageData } from 'Hooks/useDetailPageData';
import {
	DetailPageLayout,
	TabContent,
	ReusableTable,
	GenericModal,
	FormGroup,
	FormLabel,
	FormInput,
	FormTextarea,
	PrimaryButton,
} from 'Components/Library';
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
import { DeviceModal } from '../../Components/Library/Modal';
import { useCreateTaskMutation } from '../../Redux/API/taskSlice';

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

	// Modal states
	const [showAddTenantModal, setShowAddTenantModal] = React.useState(false);
	const [showAddDeviceModal, setShowAddDeviceModal] = React.useState(false);
	const [showCreateTaskModal, setShowCreateTaskModal] = React.useState(false);
	const [showLinkHistoryModal, setShowLinkHistoryModal] = React.useState(false);
	const [linkedHistoryIds, setLinkedHistoryIds] = React.useState<string[]>([]);
	const [pendingLinkedHistoryIds, setPendingLinkedHistoryIds] = React.useState<
		string[]
	>([]);
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
	const [createDevice] = useCreateDeviceMutation();
	const [createTask] = useCreateTaskMutation();
	const [updateMaintenanceHistory] = useUpdateMaintenanceHistoryMutation();
	const { data: unitDevices = [], isLoading: devicesLoading } =
		useGetUnitDevicesQuery(unit?.id || '', { skip: !unit?.id });

	const maintenanceHistoryOptions = React.useMemo(() => {
		return unitMaintenanceHistory.map((record: any) => {
			const dateLabel = record.completionDate
				? new Date(record.completionDate).toLocaleDateString()
				: 'No date';
			return {
				label: `${
					record.title || record.taskTitle || 'Maintenance'
				} - ${dateLabel}`,
				value: record.id,
			};
		});
	}, [unitMaintenanceHistory]);

	const handleOpenLinkHistoryModal = () => {
		setPendingLinkedHistoryIds(linkedHistoryIds);
		setShowLinkHistoryModal(true);
	};

	const handleToggleHistory = (historyId: string) => {
		setPendingLinkedHistoryIds((prev) =>
			prev.includes(historyId)
				? prev.filter((id) => id !== historyId)
				: [...prev, historyId],
		);
	};

	const handleSaveLinkedHistory = (e: React.FormEvent) => {
		e.preventDefault();
		setLinkedHistoryIds(pendingLinkedHistoryIds);
		setShowLinkHistoryModal(false);
	};

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
			alert('Failed to upload files. Please try again.');
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
			subtitle={property.title}
			badge={`${property.slug} / ${unit.name
				.replace(/\s+/g, '-')
				.toLowerCase()}`}
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
					</TabContent>
				)}

				{/* Devices Tab */}
				{activeTab === 'devices' && (
					<TabContent>
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
					</TabContent>
				)}

				{/* Tasks Tab */}
				{activeTab === 'tasks' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Unit Tasks</SectionHeader>
							<Toolbar>
								<PrimaryButton onClick={() => setShowCreateTaskModal(true)}>
									Add Task
								</PrimaryButton>
							</Toolbar>
							<ReusableTable
								rowData={unitTasks.map((task) => ({
									...task,
									assignedToNames: task.assignee || '',
									propertyTitle: property?.title || '',
								}))}
								columns={[
									{
										header: 'Task',
										key: 'title',
									},
									{
										header: 'Assignee',
										key: 'assignedToNames',
									},
									{
										header: 'Due Date',
										key: 'dueDate',
									},
									{
										header: 'Status',
										key: 'status',
									},
									{
										header: 'Notes',
										key: 'notes',
									},
								]}
								showCheckbox={false}
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
					</TabContent>
				)}
			</ContentContainer>

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
				<GenericModal
					isOpen={showCreateTaskModal}
					onClose={() => setShowCreateTaskModal(false)}
					title='Create Task'
					showActions={true}
					onSubmit={async (e) => {
						e.preventDefault();
						const formData = new FormData(e.target as HTMLFormElement);
						const taskData = {
							title: formData.get('title') as string,
							dueDate: formData.get('dueDate') as string,
							status: 'Pending' as const,
							notes: formData.get('notes') as string,
							userId: currentUser?.id || '',
							property: property?.title || '',
							propertyId: property?.id || '',
							unitId: unit?.id || '',
						};
						try {
							const createdTask = await createTask(taskData).unwrap();
							if (linkedHistoryIds.length > 0) {
								await syncTaskMaintenanceLinks(
									createdTask.id,
									linkedHistoryIds,
								);
							}
							setShowCreateTaskModal(false);
							setLinkedHistoryIds([]);
						} catch (error) {
							console.error('Failed to create task:', error);
						}
					}}
					primaryButtonLabel='Create Task'
					secondaryButtonLabel='Cancel'>
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<FormGroup>
							<FormLabel>Task Title *</FormLabel>
							<FormInput
								type='text'
								name='title'
								placeholder='Enter task title'
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Due Date</FormLabel>
							<FormInput type='date' name='dueDate' />
						</FormGroup>

						<FormGroup>
							<FormLabel>Notes</FormLabel>
							<FormTextarea
								name='notes'
								placeholder='Enter task notes'
								rows={3}
							/>
						</FormGroup>

						{maintenanceHistoryOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Maintenance History</FormLabel>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<button
										type='button'
										onClick={handleOpenLinkHistoryModal}
										style={{
											padding: '8px 12px',
											background: '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											cursor: 'pointer',
											fontSize: '14px',
										}}>
										🔗 Link Maintenance History ({linkedHistoryIds.length})
									</button>
									{linkedHistoryIds.length > 0 && (
										<span style={{ fontSize: '12px', color: '#6b7280' }}>
											{linkedHistoryIds.length} linked
										</span>
									)}
								</div>
							</FormGroup>
						)}
					</div>
				</GenericModal>
			)}

			{showLinkHistoryModal && (
				<GenericModal
					isOpen={showLinkHistoryModal}
					onClose={() => setShowLinkHistoryModal(false)}
					onSubmit={handleSaveLinkedHistory}
					title='Link Maintenance History'
					showActions={true}
					primaryButtonLabel='Link History'
					secondaryButtonLabel='Cancel'>
					<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
						{maintenanceHistoryOptions.length > 0 ? (
							maintenanceHistoryOptions.map((option) => (
								<label
									key={option.value}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '6px 0',
									}}>
									<input
										type='checkbox'
										checked={pendingLinkedHistoryIds.includes(option.value)}
										onChange={() => handleToggleHistory(option.value)}
									/>
									<span>{option.label}</span>
								</label>
							))
						) : (
							<p style={{ margin: 0, color: '#6b7280' }}>
								No maintenance history available for this unit.
							</p>
						)}
					</div>
				</GenericModal>
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
