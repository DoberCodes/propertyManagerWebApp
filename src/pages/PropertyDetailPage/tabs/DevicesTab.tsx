import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faPlus,
	faEdit,
	faTrash,
	faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { Property } from '../../../Redux/API/apiSlice';
import {
	useGetDevicesQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
} from '../../../Redux/API/apiSlice';
import { GenericModal } from '../../../Components/Library';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	Toolbar,
	ToolbarButton,
	GridContainer,
	GridTable,
	EmptyState,
} from '../PropertyDetailPage.styles';

interface DeviceFormData {
	type: string;
	brand: string;
	model: string;
	installationDate: string;
	status: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned';
	location: {
		propertyId: string;
		unitId?: string;
		suiteId?: string;
	};
}

interface DevicesTabProps {
	property: Property;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ property }) => {
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [editingDevice, setEditingDevice] = useState<any>(null);
	const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
		type: '',
		brand: '',
		model: '',
		installationDate: '',
		status: 'Active',
		location: {
			propertyId: property.id,
		},
	});

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const [createDevice] = useCreateDeviceMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [deleteDevice] = useDeleteDeviceMutation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const resetForm = () => {
		setDeviceFormData({
			type: '',
			brand: '',
			model: '',
			installationDate: '',
			status: 'Active',
			location: {
				propertyId: property.id,
			},
		});
		setEditingDevice(null);
	};

	const handleOpenCreateModal = () => {
		resetForm();
		setShowDeviceModal(true);
	};

	const handleOpenEditModal = (device: any) => {
		setDeviceFormData({
			type: device.type || '',
			brand: device.brand || '',
			model: device.model || '',
			installationDate: device.installationDate || '',
			status: device.status || 'Active',
			location: device.location || { propertyId: property.id },
		});
		setEditingDevice(device);
		setShowDeviceModal(true);
	};

	const handleCloseModal = () => {
		setShowDeviceModal(false);
		resetForm();
	};

	const handleFormChange = (field: string, value: any) => {
		if (field.startsWith('location.')) {
			const locationField = field.split('.')[1];
			setDeviceFormData((prev) => ({
				...prev,
				location: {
					...prev.location,
					[locationField]: value,
				},
			}));
		} else {
			setDeviceFormData((prev) => ({
				...prev,
				[field]: value,
			}));
		}
	};

	const handleSubmit = async () => {
		try {
			const deviceData = {
				...deviceFormData,
				userId: currentUser!.id,
			};

			if (editingDevice) {
				await updateDevice({
					id: editingDevice.id,
					updates: deviceData,
				});
			} else {
				await createDevice(deviceData);
			}

			handleCloseModal();
		} catch (error) {
			console.error('Error saving device:', error);
		}
	};

	const handleDeleteDevice = async (deviceId: string) => {
		if (window.confirm('Are you sure you want to delete this device?')) {
			try {
				await deleteDevice(deviceId);
			} catch (error) {
				console.error('Error deleting device:', error);
			}
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Active':
				return '#22c55e';
			case 'Maintenance':
				return '#f59e0b';
			case 'Broken':
				return '#ef4444';
			case 'Decommissioned':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	};

	if (isLoading) {
		return (
			<SectionContainer>
				<SectionHeader>Household Devices</SectionHeader>
				<div>Loading devices...</div>
			</SectionContainer>
		);
	}

	return (
		<SectionContainer>
			<SectionHeader>Household Devices</SectionHeader>

			<Toolbar>
				<ToolbarButton onClick={handleOpenCreateModal}>
					<FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
					Add Device
				</ToolbarButton>
			</Toolbar>

			{devices.length === 0 ? (
				<EmptyState>
					<FontAwesomeIcon icon={faWrench} size='3x' color='#ccc' />
					<p>No devices added yet</p>
					<p>Click "Add Device" to get started</p>
				</EmptyState>
			) : (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Type</th>
								<th>Brand</th>
								<th>Model</th>
								<th>Status</th>
								<th>Installation Date</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{devices.map((device) => (
								<tr key={device.id}>
									<td>{device.type}</td>
									<td>{device.brand}</td>
									<td>{device.model}</td>
									<td>
										<span
											style={{
												color: getStatusColor(device.status || 'Active'),
												fontWeight: 'bold',
											}}>
											{device.status || 'Active'}
										</span>
									</td>
									<td>
										{device.installationDate
											? new Date(device.installationDate).toLocaleDateString()
											: 'N/A'}
									</td>
									<td>
										<ToolbarButton
											onClick={() => handleOpenEditModal(device)}
											style={{ marginRight: '8px' }}>
											<FontAwesomeIcon icon={faEdit} />
										</ToolbarButton>
										<ToolbarButton
											className='delete'
											onClick={() => handleDeleteDevice(device.id)}>
											<FontAwesomeIcon icon={faTrash} />
										</ToolbarButton>
									</td>
								</tr>
							))}
						</tbody>
					</GridTable>
				</GridContainer>
			)}

			{/* Device Modal */}
			{showDeviceModal && (
				<GenericModal
					isOpen={showDeviceModal}
					onClose={handleCloseModal}
					title={editingDevice ? 'Edit Device' : 'Add New Device'}
					onSubmit={handleSubmit}
					primaryButtonLabel={editingDevice ? 'Update Device' : 'Add Device'}
					secondaryButtonLabel='Cancel'>
					<div
						style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Device Type *
							</label>
							<input
								type='text'
								value={deviceFormData.type}
								onChange={(e) => handleFormChange('type', e.target.value)}
								placeholder='e.g., HVAC System, Water Heater'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
								required
							/>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Brand
							</label>
							<input
								type='text'
								value={deviceFormData.brand}
								onChange={(e) => handleFormChange('brand', e.target.value)}
								placeholder='Brand name'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Model
							</label>
							<input
								type='text'
								value={deviceFormData.model}
								onChange={(e) => handleFormChange('model', e.target.value)}
								placeholder='Model number'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Status
							</label>
							<select
								value={deviceFormData.status}
								onChange={(e) => handleFormChange('status', e.target.value)}
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}>
								<option value='Active'>Active</option>
								<option value='Maintenance'>Maintenance</option>
								<option value='Broken'>Broken</option>
								<option value='Decommissioned'>Decommissioned</option>
							</select>
						</div>

						<div>
							<label
								style={{
									display: 'block',
									marginBottom: '4px',
									fontWeight: 'bold',
								}}>
								Installation Date
							</label>
							<input
								type='date'
								value={deviceFormData.installationDate}
								onChange={(e) =>
									handleFormChange('installationDate', e.target.value)
								}
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
						</div>
					</div>
				</GenericModal>
			)}
		</SectionContainer>
	);
};
