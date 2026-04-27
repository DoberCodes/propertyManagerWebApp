import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faPlus,
	faEdit,
	faTrash,
	faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store';
import {
	useGetDevicesQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
} from 'Redux/API/deviceSlice';
import { useGetTasksQuery } from 'Redux/API/taskSlice';
import { useGetUnitsQuery } from 'Redux/API/propertySlice';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { WarningDialog } from '../../../Components/Library/WarningDialog';
import { DeviceModal } from '../../../Components/Library/Modal';
import { Property, DeviceServiceItem } from '../../../types/Property.types';
import { uploadDeviceFile } from '../../../utils/deviceFileUpload';
import {
	MobileCarouselContainer,
	MobileCarouselViewport,
	MobileCarouselTrack,
	DeviceRow,
	MobileDots,
	MobileDot,
	DesktopTableWrapper,
	Toolbar,
	ToolbarButton,
	TabSummaryBar,
	TabSummaryPill,
	DeviceCard,
	StatusBadge,
	EmptyState,
} from './index.styles';
import { ReusableTable } from '../../../Components/Library';
import { Column, Action } from '../../../Components/Library/ReusableTable';

interface DeviceFormData {
	type: string;
	brand: string;
	model: string;
	serialNumber?: string;
	serviceItems?: DeviceServiceItem[];
	installationDate: string;
	status: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned';
	location: {
		propertyId: string;
		unitId?: string;
		suiteId?: string;
	};
	files?: Array<{
		name: string;
		url: string;
		size: number;
		type: string;
	}>;
}

interface DevicesTabProps {
	property: Property;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ property }) => {
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [editingDevice, setEditingDevice] = useState<any>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedDevice, setSelectedDevice] = useState<any>(null);
	const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
	const [removedExistingFileUrls, setRemovedExistingFileUrls] = useState<
		string[]
	>([]);
	// delete confirmation dialog state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteDialogMessage, setDeleteDialogMessage] = useState('');
	const [pendingDeleteDeviceId, setPendingDeleteDeviceId] = useState<
		string | null
	>(null);

	const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
		type: '',
		brand: '',
		model: '',
		serialNumber: '',
		serviceItems: [],
		installationDate: '',
		status: 'Active',
		location: {
			propertyId: property.id,
		},
		files: [],
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Mobile carousel index
	const [carouselIndex, setCarouselIndex] = useState(0);

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const { data: units = [] } = useGetUnitsQuery(property.id);
	const { data: allTasks = [] } = useGetTasksQuery();

	const openPropertyTasks = useMemo(
		() =>
			allTasks.filter(
				(task: any) => task.propertyId === property.id && task.status !== 'Completed',
			),
		[allTasks, property.id],
	);

	const linkedOpenTaskCountByDevice = useMemo(() => {
		const counts = new Map<string, number>();

		openPropertyTasks.forEach((task: any) => {
			const linkedIds = new Set<string>();

			if (Array.isArray(task.devices)) {
				task.devices.forEach((deviceId: string | number) => {
					if (deviceId !== undefined && deviceId !== null) {
						linkedIds.add(String(deviceId));
					}
				});
			}

			if (task.deviceId !== undefined && task.deviceId !== null) {
				linkedIds.add(String(task.deviceId));
			}

			linkedIds.forEach((deviceId) => {
				counts.set(deviceId, (counts.get(deviceId) || 0) + 1);
			});
		});

		return counts;
	}, [openPropertyTasks]);

	const needsAttentionDeviceCount = useMemo(
		() =>
			devices.filter((device: any) => {
				const status = device.status || 'Active';
				const linkedOpenTasks = linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
				return status === 'Broken' || status === 'Maintenance' || linkedOpenTasks > 0;
			}).length,
		[devices, linkedOpenTaskCountByDevice],
	);

	const linkedOpenTaskCount = useMemo(
		() =>
			Array.from(linkedOpenTaskCountByDevice.values()).reduce(
				(total, count) => total + count,
				0,
			),
		[linkedOpenTaskCountByDevice],
	);

	const getDeviceAttentionState = (device: any) => {
		const status = device.status || 'Active';
		const linkedOpenTasks = linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
		const needsAttention =
			status === 'Broken' || status === 'Maintenance' || linkedOpenTasks > 0;

		return {
			status,
			linkedOpenTasks,
			needsAttention,
		};
	};

	const columns: Column[] = [
		{ header: 'Type', key: 'type' },
		{ header: 'Brand', key: 'brand' },
		{ header: 'Model', key: 'model' },
		{ header: 'Installation Date', key: 'installationDate', type: 'date' },
		{
			header: 'Status',
			key: 'status',
			render: (status: string, row: any) => {
				const { status: resolvedStatus, linkedOpenTasks, needsAttention } =
					getDeviceAttentionState({ ...row, status });

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<StatusBadge status={resolvedStatus}>{resolvedStatus}</StatusBadge>
						{needsAttention && (
							<span
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: '#b45309',
								}}>
								{linkedOpenTasks > 0
									? `${linkedOpenTasks} open linked task${linkedOpenTasks === 1 ? '' : 's'}`
									: 'Needs attention'}
							</span>
						)}
					</div>
				);
			},
		},
		{
			header: 'Location',
			key: 'location.unitId',
			type: 'dropdown',
			options: (row) => {
				const unit = units.find((u) => u.id === row.location.unitId);
				return unit ? [unit.name] : [];
			},
			render: (value: string) => {
				const unit = units.find((u) => u.id === value);
				return unit ? unit.name : 'Property';
			},
		},
		{
			header: 'Files',
			key: 'files',
			render: (files: any[]) =>
				files && files.length > 0 ? `${files.length} file(s)` : 'None',
		},
	];

	const deviceActions: Action[] = [
		{
			label: 'Edit',
			icon: faEdit,
			onClick: (device: any) => handleOpenEditModal(device),
		},
		{
			label: 'Delete',
			icon: faTrash,
			onClick: (device: any) => handleDeleteDevice(device.id),
			className: 'delete',
		},
	];

	// Reset/ clamp carousel index when device list changes
	useEffect(() => {
		if (carouselIndex > devices.length - 1) {
			setCarouselIndex(Math.max(0, devices.length - 1));
		}
		if (devices.length === 0) setCarouselIndex(0);
	}, [devices.length, carouselIndex]);
	const [createDevice] = useCreateDeviceMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [deleteDevice] = useDeleteDeviceMutation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const resetForm = () => {
		setDeviceFormData({
			type: '',
			brand: '',
			model: '',
			serialNumber: '',
			serviceItems: [],
			installationDate: '',
			status: 'Active',
			location: {
				propertyId: property.id,
			},
			files: [],
		});
		setPendingUploadFiles([]);
		setRemovedExistingFileUrls([]);
		setEditingDevice(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
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
			serialNumber: device.serialNumber || '',
			serviceItems: device.serviceItems || [],
			installationDate: device.installationDate || '',
			status: device.status || 'Active',
			location: device.location || { propertyId: property.id },
			files: device.files || [],
		});
		setRemovedExistingFileUrls([]);
		setEditingDevice(device);
		setShowDeviceModal(true);
	};

	const handleCloseModal = () => {
		setShowDeviceModal(false);
		resetForm();
		setSelectedDevice(null);
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
		if (isSubmitting) return;

		setIsSubmitting(true);
		try {
			const persistedFiles = (deviceFormData.files || []).filter(
				(file) => !removedExistingFileUrls.includes(file.url),
			);
			let uploadedFiles = persistedFiles;

			if (pendingUploadFiles.length > 0) {
				const uploaded = await Promise.all(
					pendingUploadFiles.map((file) =>
						uploadDeviceFile(file, property.id, editingDevice?.id),
					),
				);
				uploadedFiles = [...persistedFiles, ...uploaded];
			}

			const deviceData = {
				...deviceFormData,
				files: uploadedFiles,
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
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDevice = (deviceId: string) => {
		setDeleteDialogMessage('Are you sure you want to delete this device?');
		setPendingDeleteDeviceId(deviceId);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteDevice = async () => {
		if (!pendingDeleteDeviceId) return;
		try {
			await deleteDevice(pendingDeleteDeviceId);
			setSelectedDevice(null);
		} catch (error) {
			console.error('Error deleting device:', error);
			alert('Failed to delete device. Please try again.');
		}
		setDeleteDialogOpen(false);
		setPendingDeleteDeviceId(null);
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
			<WarningDialog
				open={deleteDialogOpen}
				title='Confirm Deletion'
				message={deleteDialogMessage}
				confirmText='Delete'
				cancelText='Cancel'
				onConfirm={confirmDeleteDevice}
				onCancel={() => setDeleteDialogOpen(false)}
			/>
			<SectionHeader>Household Devices</SectionHeader>
			<TabSummaryBar>
				<TabSummaryPill>Total: {devices.length}</TabSummaryPill>
				<TabSummaryPill>
					Active: {devices.filter((d) => (d.status || 'Active') === 'Active').length}
				</TabSummaryPill>
				<TabSummaryPill>
					Needs Attention: {needsAttentionDeviceCount}
				</TabSummaryPill>
				<TabSummaryPill>
					Open Device Tasks: {linkedOpenTaskCount}
				</TabSummaryPill>
			</TabSummaryBar>

			<Toolbar>
				<ToolbarButton onClick={handleOpenCreateModal}>
					<FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
					Add Device
				</ToolbarButton>
			</Toolbar>

			{/* Mobile carousel (shows when viewport <= 1024px) */}
			<MobileCarouselContainer>
				<MobileCarouselViewport>
					<MobileCarouselTrack index={carouselIndex}>
						{devices.map((device) => (
							<DeviceCard
								key={device.id}
								$isSelected={selectedDevice === device}
								onClick={() => setSelectedDevice(device)}>
								{(() => {
									const { linkedOpenTasks, needsAttention } =
										getDeviceAttentionState(device);

									return (
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}>
									<div style={{ fontWeight: 700 }}>{device.type}</div>
									<div style={{ fontSize: 12, color: needsAttention ? '#b45309' : '#6b7280', fontWeight: needsAttention ? 700 : 400 }}>
										{linkedOpenTasks > 0 ? `${linkedOpenTasks} open task${linkedOpenTasks === 1 ? '' : 's'}` : device.brand}
									</div>
								</div>
									);
								})()}
								<DeviceRow>
									<div style={{ fontSize: 14 }}>{device.model || '—'}</div>
									<StatusBadge status={device.status || 'Active'}>
										{device.status || 'Active'}
									</StatusBadge>
								</DeviceRow>
								<DeviceRow>
									<div style={{ fontSize: 12, color: '#6b7280' }}>
										{device.installationDate
											? new Date(device.installationDate).toLocaleDateString()
											: 'N/A'}
									</div>
									<div style={{ display: 'flex', gap: 8 }}>
										<button
											onClick={() => handleOpenEditModal(device)}
											style={{
												background: 'transparent',
												border: 'none',
												cursor: 'pointer',
												padding: '8px',
												borderRadius: '4px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												minWidth: '44px',
												minHeight: '44px',
											}}>
											<FontAwesomeIcon icon={faEdit} />
										</button>
										<button
											onClick={() => handleDeleteDevice(device.id)}
											style={{
												background: 'transparent',
												border: 'none',
												cursor: 'pointer',
												color: '#ef4444',
												padding: '8px',
												borderRadius: '4px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												minWidth: '44px',
												minHeight: '44px',
											}}>
											<FontAwesomeIcon icon={faTrash} />
										</button>
									</div>
								</DeviceRow>
								{device.files && device.files.length > 0 ? (
									<div
										style={{
											marginTop: 8,
											display: 'flex',
											gap: 8,
											flexWrap: 'wrap',
										}}>
										{device.files.map((file, i) => (
											<a
												key={i}
												href={file.url}
												target='_blank'
												rel='noopener noreferrer'
												style={{
													fontSize: 12,
													color: '#2563eb',
													textDecoration: 'none',
												}}>
												{file.name}
											</a>
										))}
									</div>
								) : null}
							</DeviceCard>
						))}
					</MobileCarouselTrack>
				</MobileCarouselViewport>
				<MobileDots>
					{devices.map((_, i) => (
						<MobileDot
							key={i}
							$active={i === carouselIndex}
							onClick={() => setCarouselIndex(i)}
						/>
					))}
				</MobileDots>
			</MobileCarouselContainer>

			{devices.length === 0 ? (
				<EmptyState>
					<FontAwesomeIcon icon={faWrench} size='3x' color='#ccc' />
					<p>No devices added yet</p>
					<p>Click "Add Device" to get started</p>
				</EmptyState>
			) : (
				<DesktopTableWrapper>
					<ReusableTable
						columns={columns}
						rowData={devices}
						actions={deviceActions}
					/>
				</DesktopTableWrapper>
			)}
			{/* Device Modal */}
			<DeviceModal
				isOpen={showDeviceModal}
				onClose={handleCloseModal}
				onSubmit={handleSubmit}
				isEditing={Boolean(editingDevice)}
				pendingFiles={pendingUploadFiles}
				onPendingFilesChange={setPendingUploadFiles}
				removedExistingFileUrls={removedExistingFileUrls}
				onRemoveExistingFile={(url) =>
					setRemovedExistingFileUrls((prev) =>
						prev.includes(url) ? prev : [...prev, url],
					)
				}
				onRestoreExistingFile={(url) =>
					setRemovedExistingFileUrls((prev) => prev.filter((item) => item !== url))
				}
				onRemovePendingFile={(fileKey) =>
					setPendingUploadFiles((prev) =>
						prev.filter((file) => `${file.name}-${file.size}` !== fileKey),
					)
				}
				deviceFormData={deviceFormData}
				onFormChange={(e) =>
					handleFormChange(e.currentTarget.name, e.currentTarget.value)
				}
				onServiceItemsChange={(items) =>
					handleFormChange('serviceItems', items)
				}
				property={property}
				units={units}
			/>
		</SectionContainer>
	);
};
