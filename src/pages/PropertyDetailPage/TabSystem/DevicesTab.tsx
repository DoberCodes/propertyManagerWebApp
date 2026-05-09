import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import {
	faPlus,
	faEye,
	faEdit,
	faTrash,
	faWrench,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
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
import { buildDeviceSlug } from '../../../utils/deviceSlug';
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
	MobileTaskActions,
	MobileActionButton,
} from './index.styles';
import { ReusableTable } from '../../../Components/Library';
import { Column, Action } from '../../../Components/Library/ReusableTable';
import {
	CardMoreDetails,
	CardMoreSummary,
	CardMoreMenu,
	CardMoreMenuItem,
} from './mobileUiShared';

const SectionLead = styled.p`
	margin: -4px 0 14px;
	color: #475569;
	font-size: 0.92rem;
	line-height: 1.5;
`;

const IntelligenceStrip = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;
	margin-bottom: 14px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const IntelligenceCard = styled.div<{ $tone?: 'warning' | 'neutral' | 'success' }>`
	padding: 10px 12px;
	border-radius: 10px;
	border: 1px solid
		${(props) =>
			props.$tone === 'warning'
				? '#fcd34d'
				: props.$tone === 'success'
					? '#86efac'
					: '#cbd5e1'};
	background: ${(props) =>
		props.$tone === 'warning'
			? '#fffbeb'
			: props.$tone === 'success'
				? '#f0fdf4'
				: '#f8fafc'};
	font-size: 0.84rem;
	font-weight: 600;
	color: ${(props) =>
		props.$tone === 'warning'
			? '#92400e'
			: props.$tone === 'success'
				? '#166534'
				: '#334155'};
`;

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
	const navigate = useNavigate();
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

	const linkedOverdueTaskCountByDevice = useMemo(() => {
		const counts = new Map<string, number>();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		openPropertyTasks.forEach((task: any) => {
			if (!task?.dueDate) return;
			const dueDate = new Date(task.dueDate);
			if (Number.isNaN(dueDate.getTime())) return;
			dueDate.setHours(0, 0, 0, 0);
			if (dueDate >= today) return;

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

	const recurringLinkedTaskCountByDevice = useMemo(() => {
		const counts = new Map<string, number>();

		openPropertyTasks.forEach((task: any) => {
			if (!task?.isRecurring) return;

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

	const linkedOverdueTaskCount = useMemo(
		() =>
			Array.from(linkedOverdueTaskCountByDevice.values()).reduce(
				(total, count) => total + count,
				0,
			),
		[linkedOverdueTaskCountByDevice],
	);

	const devicesWithRecurringCareCount = useMemo(
		() =>
			devices.filter(
				(device: any) =>
					(recurringLinkedTaskCountByDevice.get(String(device.id)) || 0) > 0,
			).length,
		[devices, recurringLinkedTaskCountByDevice],
	);

	const getDeviceAttentionState = (device: any) => {
		const status = device.status || 'Active';
		const linkedOpenTasks = linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
		const overdueLinkedTasks =
			linkedOverdueTaskCountByDevice.get(String(device.id)) || 0;
		const recurringLinkedTasks =
			recurringLinkedTaskCountByDevice.get(String(device.id)) || 0;
		const needsAttention =
			status === 'Broken' ||
			status === 'Maintenance' ||
			linkedOpenTasks > 0 ||
			overdueLinkedTasks > 0;

		return {
			status,
			linkedOpenTasks,
			overdueLinkedTasks,
			recurringLinkedTasks,
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
				const {
					status: resolvedStatus,
					linkedOpenTasks,
					overdueLinkedTasks,
					recurringLinkedTasks,
					needsAttention,
				} =
					getDeviceAttentionState({ ...row, status });

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<StatusBadge status={resolvedStatus}>{resolvedStatus}</StatusBadge>
						{overdueLinkedTasks > 0 && (
							<span
								style={{
									fontSize: 12,
									fontWeight: 700,
									color: '#b91c1c',
								}}>
								Overdue by {overdueLinkedTasks} task
								{overdueLinkedTasks === 1 ? '' : 's'}
							</span>
						)}
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
						{recurringLinkedTasks > 0 && (
							<span
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: '#0f766e',
								}}>
								Recurring care: {recurringLinkedTasks}
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
			label: 'View',
			icon: faEye,
			onClick: (device: any) => {
				const deviceSlug = buildDeviceSlug({
					id: device.id,
					type: device.type,
					brand: device.brand,
					model: device.model,
				});
				navigate(`/property/${property.slug}/device/${deviceSlug}`);
			},
		},
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
	const isMobile = useSelector((state: RootState) => state.app.isMobile);

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
			<SectionHeader>Home Systems</SectionHeader>
			<SectionLead>
				Track each system as the operational memory of this property, including
				task context and service lifecycle history.
			</SectionLead>
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

			<IntelligenceStrip>
				<IntelligenceCard $tone={linkedOverdueTaskCount > 0 ? 'warning' : 'success'}>
					{linkedOverdueTaskCount > 0
						? `${linkedOverdueTaskCount} linked task${linkedOverdueTaskCount === 1 ? '' : 's'} overdue`
						: 'No overdue linked tasks'}
				</IntelligenceCard>
				<IntelligenceCard $tone='neutral'>
					{devicesWithRecurringCareCount} device
					{devicesWithRecurringCareCount === 1 ? '' : 's'} with recurring care
				</IntelligenceCard>
				<IntelligenceCard $tone={needsAttentionDeviceCount > 0 ? 'warning' : 'success'}>
					{needsAttentionDeviceCount > 0
						? `${needsAttentionDeviceCount} device${needsAttentionDeviceCount === 1 ? '' : 's'} need attention`
						: 'All devices currently stable'}
				</IntelligenceCard>
			</IntelligenceStrip>

			<Toolbar>
				<ToolbarButton
					className='primary-action'
					onClick={handleOpenCreateModal}
					style={{ width: isMobile ? '100%' : undefined }}>
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
								onClick={() => setSelectedDevice(device)}
								style={{
									borderLeft: `4px solid ${(device.status || 'Active') === 'Broken' ? '#ef4444' : (device.status || 'Active') === 'Maintenance' ? '#f59e0b' : '#22c55e'}`,
								}}>
								{(() => {
									const {
										linkedOpenTasks,
										overdueLinkedTasks,
										recurringLinkedTasks,
										needsAttention,
									} =
										getDeviceAttentionState(device);

									return (
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}>
									<button
										onClick={(event) => {
											event.stopPropagation();
											const deviceSlug = buildDeviceSlug({
												id: device.id,
												type: device.type,
												brand: device.brand,
												model: device.model,
											});
											navigate(`/property/${property.slug}/device/${deviceSlug}`);
										}}
										style={{
											fontWeight: 700,
											fontSize: 14,
											color: '#0f766e',
											background: 'transparent',
											border: 'none',
											cursor: 'pointer',
											padding: 0,
											textAlign: 'left',
										}}>
										{device.type}
									</button>
											<div style={{ fontSize: 12, color: needsAttention ? '#b45309' : '#6b7280', fontWeight: needsAttention ? 700 : 400 }}>
												{linkedOpenTasks > 0
													? `${linkedOpenTasks} open task${linkedOpenTasks === 1 ? '' : 's'}`
													: device.brand}
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
								</DeviceRow>
								{(() => {
									const { overdueLinkedTasks, recurringLinkedTasks } =
										getDeviceAttentionState(device);
									if (overdueLinkedTasks === 0 && recurringLinkedTasks === 0) return null;

									return (
										<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
											{overdueLinkedTasks > 0 && (
												<span
													style={{
														background: '#fef2f2',
														border: '1px solid #fecaca',
														color: '#b91c1c',
														padding: '2px 8px',
														borderRadius: 999,
														fontSize: 11,
														fontWeight: 700,
													}}>
													Overdue {overdueLinkedTasks}
												</span>
											)}
											{recurringLinkedTasks > 0 && (
												<span
													style={{
														background: '#ecfeff',
														border: '1px solid #99f6e4',
														color: '#0f766e',
														padding: '2px 8px',
														borderRadius: 999,
														fontSize: 11,
														fontWeight: 700,
													}}>
													Recurring {recurringLinkedTasks}
												</span>
											)}
										</div>
									);
								})()}
								<MobileTaskActions>
									<MobileActionButton
										variant='danger'
										onClick={(event) => {
											event.stopPropagation();
											handleDeleteDevice(device.id);
										}}
										style={{ flex: 1 }}>
										Delete
									</MobileActionButton>
									<CardMoreDetails
										onClick={(event) => {
											event.stopPropagation();
										}}>
										<CardMoreSummary>More</CardMoreSummary>
										<CardMoreMenu>
											<CardMoreMenuItem
												onClick={(event) => {
													event.stopPropagation();
													const deviceSlug = buildDeviceSlug({
														id: device.id,
														type: device.type,
														brand: device.brand,
														model: device.model,
													});
													navigate(`/property/${property.slug}/device/${deviceSlug}`);
												}}>
												View
											</CardMoreMenuItem>
											<CardMoreMenuItem
												onClick={(event) => {
													event.stopPropagation();
													handleOpenEditModal(device);
												}}>
												Edit
											</CardMoreMenuItem>
										</CardMoreMenu>
									</CardMoreDetails>
								</MobileTaskActions>
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
