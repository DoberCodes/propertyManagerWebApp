import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../Hooks/useFavorites';
import {
	Wrapper,
	Header,
	HeaderContent,
	PropertyTitle,
	FavoriteButton,
	BackButton,
	TabButton,
	TabContent,
	Toolbar,
	ToolbarButton,
	GridContainer,
	GridTable,
	InfoGrid,
	InfoCard,
	InfoLabel,
	InfoValue,
	SectionHeader,
	SectionContainer,
	DevicesGrid,
	DeviceCard,
	DeviceField,
	TaskStatus,
	EmptyState,
	TitleContainer,
	EditableTitleInput,
	PencilIcon,
	TabControlsContainer,
	TabButtonsWrapper,
	TaskCheckbox,
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogForm,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	DialogButtonGroup,
	DialogCancelButton,
	DialogSubmitButton,
	MinimalEditButton,
	EditableFieldInput,
	DetailsEditHeader,
	DevicesSectionHeader,
	AddDeviceButton,
} from './PropertyDetailPage.styles';

// Mock properties data - in a real app, this would come from props or API
const PROPERTIES_DATA = [
	{
		id: 1,
		title: 'Downtown Apartments',
		slug: 'downtown-apartments',
		image: 'https://via.placeholder.com/600x300?text=Downtown+Apartments',
		owner: 'John Smith',
		address: '123 Main Street, Downtown District',
		bedrooms: 4,
		bathrooms: 2,
		administrators: ['john@example.com', 'jane@example.com'],
		viewers: ['viewer1@example.com'],
		devices: [
			{
				id: 1,
				type: 'HVAC System',
				brand: 'Carrier',
				model: 'AquaEdge',
				installationDate: '2024-03-15',
			},
			{
				id: 2,
				type: 'Water Heater',
				brand: 'Rheem',
				model: 'Prestige',
				installationDate: '2023-07-20',
			},
		],
		notes:
			'Modern downtown apartment complex with premium finishes and full amenities.',
		maintenanceHistory: [
			{
				date: '2026-01-15',
				description: 'HVAC filter replacement',
				deviceId: 1,
			},
			{ date: '2025-12-20', description: 'Plumbing inspection', deviceId: 2 },
			{ date: '2025-11-10', description: 'Roof inspection', deviceId: 1 },
		],
	},
	{
		id: 2,
		title: 'Business Park',
		slug: 'business-park',
		image: 'https://via.placeholder.com/600x300?text=Business+Park',
		owner: 'Corporate Solutions Inc',
		address: '456 Commerce Avenue, Business District',
		bedrooms: 0,
		bathrooms: 8,
		administrators: ['admin@business.com'],
		viewers: ['tenant1@business.com', 'tenant2@business.com'],
		devices: [
			{
				id: 3,
				type: 'Access Control',
				brand: 'Honeywell',
				model: 'Equinox',
				installationDate: '2024-06-01',
			},
		],
		notes:
			'Commercial office space with dedicated parking and meeting facilities.',
		maintenanceHistory: [
			{ date: '2026-01-10', description: 'Roof maintenance', deviceId: 3 },
			{ date: '2025-11-05', description: 'HVAC service', deviceId: 3 },
		],
	},
	{
		id: 3,
		title: 'Sunset Heights',
		slug: 'sunset-heights',
		image: 'https://via.placeholder.com/600x300?text=Sunset+Heights',
		owner: 'Sarah Johnson',
		address: '789 Hill Road, Residential Area',
		bedrooms: 5,
		bathrooms: 3,
		administrators: ['sarah@example.com'],
		viewers: [],
		devices: [
			{
				id: 4,
				type: 'Security System',
				brand: 'ADT',
				model: 'Pulse',
				installationDate: '2024-01-15',
			},
		],
		notes:
			'Beautiful residential home with panoramic views and extensive outdoor space.',
		maintenanceHistory: [
			{ date: '2026-01-20', description: 'Gutter cleaning' },
			{ date: '2025-12-15', description: 'Exterior paint touch-up' },
			{ date: '2025-11-10', description: 'Roof repair' },
		],
	},
	{
		id: 4,
		title: 'Oak Street Complex',
		slug: 'oak-street-complex',
		image: 'https://via.placeholder.com/600x300?text=Oak+Street',
		owner: 'Property Group LLC',
		address: '321 Oak Street, Mixed Use Zone',
		bedrooms: 6,
		bathrooms: 4,
		administrators: ['manager@property.com'],
		viewers: ['assistant@property.com'],
		devices: [
			{
				id: 5,
				type: 'Smart Thermostat',
				brand: 'Nest',
				model: 'Learning Thermostat',
				installationDate: '2024-08-10',
			},
		],
		notes: 'Modern mixed-use property with residential and retail spaces.',
		maintenanceHistory: [
			{ date: '2026-01-08', description: 'Foundation inspection' },
			{ date: '2025-12-01', description: 'Electrical system upgrade' },
		],
	},
];

// Mock tasks data
const MOCK_TASKS = [
	{
		id: 1,
		title: 'Replace air filters',
		dueDate: '2026-02-01',
		status: 'In Progress',
		property: 'Downtown Apartments',
	},
	{
		id: 2,
		title: 'Quarterly maintenance inspection',
		dueDate: '2026-02-15',
		status: 'Pending',
		property: 'Downtown Apartments',
	},
	{
		id: 3,
		title: 'Parking lot sweeping',
		dueDate: '2026-01-28',
		status: 'Completed',
		property: 'Business Park',
	},
];

export const PropertyDetailPage = () => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const { isFavorite, toggleFavorite } = useFavorites();
	const [activeTab, setActiveTab] = useState<
		'details' | 'tasks' | 'maintenance'
	>('details');
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editedTitle, setEditedTitle] = useState('');
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedProperty, setEditedProperty] = useState<any>({});
	const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
	const [showTaskDialog, setShowTaskDialog] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
	const [taskFormData, setTaskFormData] = useState({
		title: '',
		dueDate: '',
		status: 'Pending' as const,
		notes: '',
	});
	const [showDeviceDialog, setShowDeviceDialog] = useState(false);
	const [deviceFormData, setDeviceFormData] = useState({
		type: '',
		brand: '',
		model: '',
		installationDate: '',
	});

	// Find the property based on slug
	const property = useMemo(() => {
		return PROPERTIES_DATA.find((p) => p.slug === slug);
	}, [slug]);

	// Filter tasks for this property
	const propertyTasks = useMemo(() => {
		if (!property) return [];
		return MOCK_TASKS.filter((task) => task.property === property.title);
	}, [property]);

	// Helper functions
	const handleTitleEdit = () => {
		setIsEditingTitle(true);
		setEditedTitle(property?.title || '');
	};

	const handleTitleSave = () => {
		// In a real app, this would update via API
		// For now, we'll just close the edit mode
		setIsEditingTitle(false);
		// You could update the property here via an API call
	};

	const handleTaskCheckbox = (taskId: number) => {
		setSelectedTasks((prev) =>
			prev.includes(taskId)
				? prev.filter((id) => id !== taskId)
				: [...prev, taskId],
		);
	};

	const handleCreateTask = () => {
		setEditingTaskId(null);
		setTaskFormData({
			title: '',
			dueDate: '',
			status: 'Pending',
			notes: '',
		});
		setShowTaskDialog(true);
	};

	const handleEditTask = () => {
		if (selectedTasks.length === 1) {
			const taskToEdit = propertyTasks.find((t) => t.id === selectedTasks[0]);
			if (taskToEdit) {
				setEditingTaskId(taskToEdit.id);
				setTaskFormData({
					title: taskToEdit.title,
					dueDate: taskToEdit.dueDate,
					status: taskToEdit.status as any,
					notes: '',
				});
				setShowTaskDialog(true);
			}
		}
	};

	const handleDeleteTask = () => {
		if (selectedTasks.length > 0) {
			// In a real app, this would delete via API
			console.log('Deleting tasks:', selectedTasks);
			setSelectedTasks([]);
		}
	};

	const handlePropertyFieldChange = (field: string, value: string) => {
		setEditedProperty((prev: any) => ({
			...prev,
			[field]: value,
		}));
	};

	const getPropertyFieldValue = (field: string) => {
		if (isEditMode && field in editedProperty) {
			return editedProperty[field];
		}
		return (property as any)?.[field] || '';
	};

	const handleOpenDeviceDialog = () => {
		setDeviceFormData({
			type: '',
			brand: '',
			model: '',
			installationDate: '',
		});
		setShowDeviceDialog(true);
	};

	const handleDeviceFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setDeviceFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleDeviceFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would add to the property's devices via API
		console.log('Adding device:', deviceFormData);
		setShowDeviceDialog(false);
	};

	const handleTaskFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would save via API
		console.log('Saving task:', { id: editingTaskId, ...taskFormData });
		setShowTaskDialog(false);
	};

	const handleTaskFormChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setTaskFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const getDeviceName = (deviceId?: number) => {
		if (!property || !deviceId) return '-';
		const device = property.devices?.find((d) => d.id === deviceId);
		return device ? `${device.type} - ${device.brand}` : '-';
	};

	if (!property) {
		return (
			<Wrapper>
				<EmptyState>
					<h2>Property not found</h2>
					<p>The property you're looking for doesn't exist.</p>
					<BackButton onClick={() => navigate('/manage')}>
						← Back to Properties
					</BackButton>
				</EmptyState>
			</Wrapper>
		);
	}

	const isFav = isFavorite(property.id);

	return (
		<Wrapper>
			<Header style={{ backgroundImage: `url(${property.image})` }}>
				<BackButton onClick={() => navigate('/manage')}>← Back</BackButton>
				<HeaderContent>
					<TitleContainer>
						{isEditingTitle ? (
							<EditableTitleInput
								value={editedTitle}
								onChange={(e) => setEditedTitle(e.target.value)}
								onBlur={handleTitleSave}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleTitleSave();
									if (e.key === 'Escape') setIsEditingTitle(false);
								}}
								autoFocus
							/>
						) : (
							<PropertyTitle>{property.title}</PropertyTitle>
						)}
						<PencilIcon onClick={handleTitleEdit} title='Edit property name'>
							✎
						</PencilIcon>
					</TitleContainer>
					<FavoriteButton
						onClick={() =>
							toggleFavorite({
								id: property.id,
								title: property.title,
								slug: property.slug,
							})
						}>
						{isFav ? '★ Favorited' : '☆ Add to Favorites'}
					</FavoriteButton>
				</HeaderContent>
			</Header>

			{/* Tab Navigation */}
			<TabControlsContainer>
				<TabButtonsWrapper>
					<TabButton
						isActive={activeTab === 'details'}
						onClick={() => setActiveTab('details')}>
						Details
					</TabButton>
					<TabButton
						isActive={activeTab === 'tasks'}
						onClick={() => setActiveTab('tasks')}>
						Tasks
					</TabButton>
					<TabButton
						isActive={activeTab === 'maintenance'}
						onClick={() => setActiveTab('maintenance')}>
						Maintenance History
					</TabButton>
				</TabButtonsWrapper>
			</TabControlsContainer>

			{/* Details Tab */}
			{activeTab === 'details' && (
				<TabContent>
					{/* Edit Mode Header */}
					<DetailsEditHeader>
						<SectionHeader>Property Information</SectionHeader>
						<MinimalEditButton
							onClick={() => setIsEditMode(!isEditMode)}
							title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}>
							✎
						</MinimalEditButton>
					</DetailsEditHeader>

					<SectionContainer>
						<InfoGrid>
							<InfoCard>
								<InfoLabel>Owner</InfoLabel>
								{isEditMode ? (
									<EditableFieldInput
										type='text'
										value={getPropertyFieldValue('owner')}
										onChange={(e) =>
											handlePropertyFieldChange('owner', e.target.value)
										}
									/>
								) : (
									<InfoValue>{getPropertyFieldValue('owner')}</InfoValue>
								)}
							</InfoCard>
							<InfoCard>
								<InfoLabel>Address</InfoLabel>
								{isEditMode ? (
									<EditableFieldInput
										type='text'
										value={getPropertyFieldValue('address')}
										onChange={(e) =>
											handlePropertyFieldChange('address', e.target.value)
										}
									/>
								) : (
									<InfoValue>{getPropertyFieldValue('address')}</InfoValue>
								)}
							</InfoCard>
							<InfoCard>
								<InfoLabel>Bedrooms</InfoLabel>
								{isEditMode ? (
									<EditableFieldInput
										type='number'
										value={getPropertyFieldValue('bedrooms')}
										onChange={(e) =>
											handlePropertyFieldChange('bedrooms', e.target.value)
										}
									/>
								) : (
									<InfoValue>{getPropertyFieldValue('bedrooms')}</InfoValue>
								)}
							</InfoCard>
							<InfoCard>
								<InfoLabel>Bathrooms</InfoLabel>
								{isEditMode ? (
									<EditableFieldInput
										type='number'
										value={getPropertyFieldValue('bathrooms')}
										onChange={(e) =>
											handlePropertyFieldChange('bathrooms', e.target.value)
										}
									/>
								) : (
									<InfoValue>{getPropertyFieldValue('bathrooms')}</InfoValue>
								)}
							</InfoCard>
							<InfoCard>
								<InfoLabel>Administrators</InfoLabel>
								{isEditMode ? (
									<EditableFieldInput
										type='text'
										value={getPropertyFieldValue('administrators')}
										onChange={(e) =>
											handlePropertyFieldChange(
												'administrators',
												e.target.value,
											)
										}
										placeholder='Comma-separated emails'
									/>
								) : (
									<InfoValue>
										{(property?.administrators?.length || 0) > 0
											? property?.administrators?.join(', ')
											: 'None'}
									</InfoValue>
								)}
							</InfoCard>
							<InfoCard>
								<InfoLabel>Viewers</InfoLabel>
								{isEditMode ? (
									<EditableFieldInput
										type='text'
										value={getPropertyFieldValue('viewers')}
										onChange={(e) =>
											handlePropertyFieldChange('viewers', e.target.value)
										}
										placeholder='Comma-separated emails'
									/>
								) : (
									<InfoValue>
										{(property?.viewers?.length || 0) > 0
											? property?.viewers?.join(', ')
											: 'None'}
									</InfoValue>
								)}
							</InfoCard>
						</InfoGrid>
					</SectionContainer>

					{/* Notes */}
					{property.notes && (
						<SectionContainer>
							<SectionHeader>Notes</SectionHeader>
							<InfoCard style={{ padding: '16px' }}>
								{isEditMode ? (
									<EditableFieldInput
										type='text'
										value={getPropertyFieldValue('notes')}
										onChange={(e) =>
											handlePropertyFieldChange('notes', e.target.value)
										}
										placeholder='Edit property notes'
										style={{ minHeight: '80px', padding: '12px' }}
										as='textarea'
									/>
								) : (
									<p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
										{getPropertyFieldValue('notes')}
									</p>
								)}
							</InfoCard>
						</SectionContainer>
					)}

					{/* Devices */}
					{property.devices && (
						<SectionContainer>
							<DevicesSectionHeader>
								<SectionHeader style={{ margin: 0 }}>
									Household Devices
								</SectionHeader>
								<AddDeviceButton onClick={handleOpenDeviceDialog}>
									+ Add Device
								</AddDeviceButton>
							</DevicesSectionHeader>
							{property.devices.length > 0 ? (
								<DevicesGrid>
									{property.devices.map((device) => (
										<DeviceCard key={device.id}>
											<DeviceField>
												<InfoLabel>Device Type</InfoLabel>
												<InfoValue>{device.type}</InfoValue>
											</DeviceField>
											<DeviceField>
												<InfoLabel>Brand</InfoLabel>
												<InfoValue>{device.brand}</InfoValue>
											</DeviceField>
											<DeviceField>
												<InfoLabel>Model</InfoLabel>
												<InfoValue>{device.model}</InfoValue>
											</DeviceField>
											<DeviceField>
												<InfoLabel>Installation Date</InfoLabel>
												<InfoValue>{device.installationDate}</InfoValue>
											</DeviceField>
										</DeviceCard>
									))}
								</DevicesGrid>
							) : (
								<EmptyState style={{ marginTop: '12px' }}>
									<p>No household devices added yet</p>
								</EmptyState>
							)}
						</SectionContainer>
					)}
				</TabContent>
			)}

			{/* Tasks Tab */}
			{activeTab === 'tasks' && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>Associated Tasks</SectionHeader>
						<Toolbar>
							<ToolbarButton onClick={handleCreateTask}>
								+ Create Task
							</ToolbarButton>
							<ToolbarButton
								disabled={selectedTasks.length !== 1}
								onClick={handleEditTask}>
								Edit Task
							</ToolbarButton>
							<ToolbarButton
								className='delete'
								disabled={selectedTasks.length === 0}
								onClick={handleDeleteTask}>
								Delete Task
							</ToolbarButton>
						</Toolbar>

						{propertyTasks.length > 0 ? (
							<GridContainer>
								<GridTable>
									<thead>
										<tr>
											<th style={{ width: '40px' }}>
												<TaskCheckbox
													onChange={() => {
														if (selectedTasks.length === propertyTasks.length) {
															setSelectedTasks([]);
														} else {
															setSelectedTasks(propertyTasks.map((t) => t.id));
														}
													}}
													checked={
														selectedTasks.length === propertyTasks.length
													}
												/>
											</th>
											<th>Task Name</th>
											<th>Assignee</th>
											<th>Due Date</th>
											<th>Status</th>
											<th>Notes</th>
										</tr>
									</thead>
									<tbody>
										{propertyTasks.map((task) => (
											<tr
												key={task.id}
												style={{
													backgroundColor: selectedTasks.includes(task.id)
														? '#f0fdf4'
														: 'transparent',
												}}>
												<td>
													<TaskCheckbox
														checked={selectedTasks.includes(task.id)}
														onChange={() => handleTaskCheckbox(task.id)}
													/>
												</td>
												<td>
													<strong>{task.title}</strong>
												</td>
												<td>-</td>
												<td>{task.dueDate}</td>
												<td>
													<TaskStatus status={task.status}>
														{task.status}
													</TaskStatus>
												</td>
												<td>-</td>
											</tr>
										))}
									</tbody>
								</GridTable>
							</GridContainer>
						) : (
							<EmptyState>
								<p>No tasks associated with this property</p>
							</EmptyState>
						)}
					</SectionContainer>
				</TabContent>
			)}

			{/* Maintenance History Tab */}
			{activeTab === 'maintenance' && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>Maintenance History</SectionHeader>

						{property.maintenanceHistory &&
						property.maintenanceHistory.length > 0 ? (
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
										{property.maintenanceHistory.map((record, index) => (
											<tr key={index}>
												<td>{record.date}</td>
												<td>{record.description}</td>
												<td>{getDeviceName((record as any).deviceId)}</td>
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
				</TabContent>
			)}

			{/* Add Device Dialog */}
			{showDeviceDialog && (
				<DialogOverlay
					onClick={(e: React.MouseEvent<HTMLDivElement>) => {
						if (e.target === e.currentTarget) {
							setShowDeviceDialog(false);
						}
					}}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>Add New Household Device</DialogHeader>
						<DialogForm onSubmit={handleDeviceFormSubmit}>
							<FormGroup>
								<FormLabel>Device Type *</FormLabel>
								<FormInput
									type='text'
									name='type'
									value={deviceFormData.type}
									onChange={handleDeviceFormChange}
									placeholder='e.g., HVAC System, Water Heater'
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Brand *</FormLabel>
								<FormInput
									type='text'
									name='brand'
									value={deviceFormData.brand}
									onChange={handleDeviceFormChange}
									placeholder='e.g., Carrier, Rheem'
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Model *</FormLabel>
								<FormInput
									type='text'
									name='model'
									value={deviceFormData.model}
									onChange={handleDeviceFormChange}
									placeholder='e.g., AquaEdge, Prestige'
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Installation Date *</FormLabel>
								<FormInput
									type='date'
									name='installationDate'
									value={deviceFormData.installationDate}
									onChange={handleDeviceFormChange}
									required
								/>
							</FormGroup>

							<DialogButtonGroup>
								<DialogCancelButton
									type='button'
									onClick={() => setShowDeviceDialog(false)}>
									Cancel
								</DialogCancelButton>
								<DialogSubmitButton type='submit'>
									Add Device
								</DialogSubmitButton>
							</DialogButtonGroup>
						</DialogForm>
					</DialogContent>
				</DialogOverlay>
			)}

			{/* Task Create/Edit Dialog */}
			{showTaskDialog && (
				<DialogOverlay
					onClick={(e: React.MouseEvent<HTMLDivElement>) => {
						if (e.target === e.currentTarget) {
							setShowTaskDialog(false);
						}
					}}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>
							{editingTaskId ? 'Edit Task' : 'Create New Task'}
						</DialogHeader>
						<DialogForm onSubmit={handleTaskFormSubmit}>
							<FormGroup>
								<FormLabel>Task Name *</FormLabel>
								<FormInput
									type='text'
									name='title'
									value={taskFormData.title}
									onChange={handleTaskFormChange}
									placeholder='Enter task name'
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Due Date *</FormLabel>
								<FormInput
									type='date'
									name='dueDate'
									value={taskFormData.dueDate}
									onChange={handleTaskFormChange}
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Status *</FormLabel>
								<FormSelect
									name='status'
									value={taskFormData.status}
									onChange={handleTaskFormChange}>
									<option value='Pending'>Pending</option>
									<option value='In Progress'>In Progress</option>
									<option value='Completed'>Completed</option>
								</FormSelect>
							</FormGroup>

							<FormGroup>
								<FormLabel>Notes</FormLabel>
								<FormTextarea
									name='notes'
									value={taskFormData.notes}
									onChange={handleTaskFormChange}
									placeholder='Add any notes about this task...'
								/>
							</FormGroup>

							<DialogButtonGroup>
								<DialogCancelButton
									type='button'
									onClick={() => setShowTaskDialog(false)}>
									Cancel
								</DialogCancelButton>
								<DialogSubmitButton type='submit'>
									{editingTaskId ? 'Update Task' : 'Create Task'}
								</DialogSubmitButton>
							</DialogButtonGroup>
						</DialogForm>
					</DialogContent>
				</DialogOverlay>
			)}
		</Wrapper>
	);
};
