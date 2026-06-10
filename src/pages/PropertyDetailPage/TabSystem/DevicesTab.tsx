import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import {
	faPlus,
	faEye,
	faEdit,
	faTrash,
	faWrench,
	faCircleCheck,
	faTriangleExclamation,
	faFan,
	faSnowflake,
	faClipboardCheck,
	faHouse,
	faPlug,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store';
import {
	useGetDevicesQuery,
	useGetAllDevicesQuery,
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
import { useAppFeedback } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	MobileCarouselContainer,
	DeviceRow,
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
	MobileActionLinkRow,
	MobileActionLinkButton,
	MobileFeedMeta,
	MobileFeedLine,
	MobileFeedLineMuted,
} from './index.styles';
import { ReusableTable } from '../../../Components/Library';
import { Column, Action } from '../../../Components/Library/ReusableTable';
import {
	CardMoreDetails,
	CardMoreSummary,
	CardMoreMenu,
	CardMoreMenuItem,
} from './mobileUiShared';
import {
	canAddDevice,
	getRemainingDeviceSlots,
	getSubscriptionPlanDetails,
} from '../../../utils/subscriptionUtils';

const SectionLead = styled.p`
	margin: -4px 0 14px;
	color: #475569;
	font-size: 0.92rem;
	line-height: 1.5;
`;

interface DeviceFormData {
	type: string;
	brand: string;
	model: string;
	serialNumber?: string;
	serviceItems?: DeviceServiceItem[];
	installationDate: string;
	decommissionDate?: string;
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
	const feedback = useAppFeedback();
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
		decommissionDate: '',
		status: 'Active',
		location: {
			propertyId: property.id,
		},
		files: [],
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const { data: allDevices = [] } = useGetAllDevicesQuery();
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

	const getResolvedDeviceStatus = (device: any) =>
		device?.decommissionDate ? 'Decommissioned' : device?.status || 'Active';

	const hasApplianceDetails = (device: any) => {
		const serviceItems = Array.isArray(device?.serviceItems) ? device.serviceItems : [];
		const files = Array.isArray(device?.files) ? device.files : [];
		return Boolean(
			String(device?.brand || '').trim() ||
				String(device?.model || '').trim() ||
				String(device?.serialNumber || '').trim() ||
				String(device?.partNumber || '').trim() ||
				String(device?.filterSize || '').trim() ||
				String(device?.specNotes || '').trim() ||
				String(device?.installationDate || '').trim() ||
				String(device?.decommissionDate || '').trim() ||
				serviceItems.length > 0 ||
				files.length > 0,
		);
	};

	const needsAttentionDeviceCount = useMemo(
		() =>
			devices.filter((device: any) => {
				const status = getResolvedDeviceStatus(device);
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
		const status = getResolvedDeviceStatus(device);
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

	const formatRelativeTime = (value?: string): string => {
		if (!value) return 'No activity recorded yet';
		const target = new Date(value).getTime();
		if (Number.isNaN(target)) return 'No activity recorded yet';

		const now = Date.now();
		const diffMs = now - target;
		const absDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

		if (absDays === 0) return diffMs >= 0 ? 'Today' : 'Later today';
		if (absDays === 1) return diffMs >= 0 ? 'Yesterday' : 'Tomorrow';
		if (absDays < 7) return diffMs >= 0 ? `${absDays} days ago` : `In ${absDays} days`;
		if (absDays < 30) {
			const weeks = Math.floor(absDays / 7);
			return diffMs >= 0
				? `${weeks} week${weeks === 1 ? '' : 's'} ago`
				: `In ${weeks} week${weeks === 1 ? '' : 's'}`;
		}

		const months = Math.floor(absDays / 30);
		return diffMs >= 0
			? `${months} month${months === 1 ? '' : 's'} ago`
			: `In ${months} month${months === 1 ? '' : 's'}`;
	};

	const getDeviceDetailPath = (device: any) => {
		const deviceSlug = buildDeviceSlug({
			id: device.id,
			type: device.type,
			brand: device.brand,
			model: device.model,
		});
		return `/property/${property.slug}/device/${deviceSlug}`;
	};

	const getDeviceOperationalIcon = (device: any) => {
		const context = `${device.type || ''} ${device.brand || ''} ${device.model || ''}`.toLowerCase();
		if (context.includes('hvac') || context.includes('heat') || context.includes('cool')) {
			return { icon: faFan, color: '#0f766e', background: '#ecfeff' };
		}
		if (context.includes('season') || context.includes('winter') || context.includes('summer')) {
			return { icon: faSnowflake, color: '#1d4ed8', background: '#dbeafe' };
		}
		if (context.includes('inspect')) {
			return { icon: faClipboardCheck, color: '#0369a1', background: '#e0f2fe' };
		}
		if (context.includes('exterior') || context.includes('roof') || context.includes('garage')) {
			return { icon: faHouse, color: '#7c2d12', background: '#ffedd5' };
		}
		if (context.includes('electric') || context.includes('panel') || context.includes('outlet')) {
			return { icon: faPlug, color: '#7c3aed', background: '#f3e8ff' };
		}
		return { icon: faWrench, color: '#475569', background: '#f1f5f9' };
	};

	const columns: Column[] = [
		{
			header: 'System Profile',
			key: 'type',
			render: (_value: string, row: any) => {
				const locationName = row.location?.unitId
					? units.find((u) => u.id === row.location.unitId)?.name || 'Unit'
					: 'Property level';
				const technical = [row.brand, row.model].filter(Boolean).join(' ');
				const { linkedOpenTasks, recurringLinkedTasks } = getDeviceAttentionState(row);
				const iconStyle = getDeviceOperationalIcon(row);
				const detailsMissing = !hasApplianceDetails(row);

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 270 }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<span
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 24,
									height: 24,
									borderRadius: 8,
									color: iconStyle.color,
									background: iconStyle.background,
									flexShrink: 0,
								}}>
								<FontAwesomeIcon icon={iconStyle.icon} />
							</span>
							<div style={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
								{row.type || 'Appliance'}
							</div>
							{detailsMissing && (
								<span
									style={{
										border: '1px solid #facc15',
										background: '#fefce8',
										color: '#854d0e',
										borderRadius: 999,
										padding: '2px 7px',
										fontSize: 11,
										fontWeight: 800,
										whiteSpace: 'nowrap',
									}}>
									No details added
								</span>
							)}
						</div>
						<div style={{ fontSize: 13, fontWeight: 700, color: '#334155', lineHeight: 1.4 }}>
							{technical || 'No model details yet'}
						</div>
						<div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
							Location: {locationName}
						</div>
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
							<span>Installed {formatRelativeTime(row.installationDate)}</span>
							{row.decommissionDate && (
								<span style={{ color: '#64748b', fontWeight: 700 }}>
									Decommissioned {formatRelativeTime(row.decommissionDate)}
								</span>
							)}
							{linkedOpenTasks > 0 && (
								<span style={{ color: '#b45309', fontWeight: 700 }}>
									{linkedOpenTasks} open task{linkedOpenTasks === 1 ? '' : 's'}
								</span>
							)}
							{recurringLinkedTasks > 0 && (
								<span style={{ color: '#0f766e', fontWeight: 700 }}>
									Recurring care active
								</span>
							)}
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
							<button
								type='button'
								onClick={() => navigate(getDeviceDetailPath(row))}
								style={{
									border: 'none',
									background: 'transparent',
									color: '#1d4ed8',
									fontWeight: 700,
									cursor: 'pointer',
									padding: 0,
								}}>
								View history
							</button>
							<span style={{ color: '#94a3b8' }}>Lifecycle timeline and service records</span>
						</div>
					</div>
				);
			},
		},
		{
			header: 'Status',
			key: 'status',
			render: (status: string, row: any) => {
				const {
					status: resolvedStatus,
					overdueLinkedTasks,
					needsAttention,
				} =
					getDeviceAttentionState({ ...row, status });

				const chip = needsAttention
					? {
						label: 'Needs Attention',
						color: '#92400e',
						background: '#fffbeb',
						border: '#fcd34d',
					  }
					: {
						label: 'Healthy',
						color: '#166534',
						background: '#f0fdf4',
						border: '#86efac',
					  };

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<div
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 6,
								padding: '6px 10px',
								borderRadius: 999,
								border: `1px solid ${chip.border}`,
								background: chip.background,
								color: chip.color,
								fontSize: 12,
								fontWeight: 800,
								width: 'fit-content',
							}}>
							<FontAwesomeIcon icon={needsAttention ? faTriangleExclamation : faCircleCheck} />
							{chip.label}
						</div>
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
					</div>
				);
			},
		},
		{
			header: 'Activity',
			key: 'installationDate',
			render: (_value: string, row: any) => {
				const { linkedOpenTasks, overdueLinkedTasks, recurringLinkedTasks } =
					getDeviceAttentionState(row);
				const activityText =
					overdueLinkedTasks > 0
						? `Maintenance overdue on ${overdueLinkedTasks} task${overdueLinkedTasks === 1 ? '' : 's'}`
						: linkedOpenTasks > 0
							? `${linkedOpenTasks} maintenance task${linkedOpenTasks === 1 ? '' : 's'} in progress`
							: recurringLinkedTasks > 0
								? 'Recurring maintenance active'
								: 'No active maintenance tasks';

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						<div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{activityText}</div>
						<div style={{ fontSize: 12, color: '#64748b' }}>
							Last lifecycle update: {formatRelativeTime(row.decommissionDate || row.installationDate)}
						</div>
					</div>
				);
			},
		},
		{
			header: 'Files & Docs',
			key: 'files',
			render: (files: any[]) => {
				const count = Array.isArray(files) ? files.length : 0;
				return (
					<span style={{ color: count > 0 ? '#0f766e' : '#94a3b8', fontWeight: count > 0 ? 700 : 500 }}>
						{count > 0 ? `${count} record${count === 1 ? '' : 's'} stored` : 'No documents yet'}
					</span>
				);
			},
		},
	];

	const deviceActions: Action[] = [
		{
			label: 'View',
			icon: faEye,
			onClick: (device: any) => {
				navigate(getDeviceDetailPath(device));
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
			decommissionDate: '',
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

	const remainingDeviceSlots = useMemo(() => {
		if (!currentUser?.subscription) return 0;
		return getRemainingDeviceSlots(currentUser.subscription, allDevices.length);
	}, [allDevices.length, currentUser?.subscription]);

	const handleOpenCreateModal = () => {
		if (!currentUser?.subscription) {
			feedback.notify('Unable to verify subscription. Please contact support.');
			return;
		}

		if (!canAddDevice(currentUser.subscription, allDevices.length)) {
			const planDetails = getSubscriptionPlanDetails(currentUser.subscription.plan);
			const maxDevices = planDetails?.maxDevices || 8;
			feedback.notify(
				`Your ${planDetails?.name || 'current'} plan allows up to ${maxDevices} appliances. ` +
					`You currently have ${allDevices.length} appliances. ` +
					`Please upgrade your plan to add more appliances.`,
			);
			return;
		}

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
			decommissionDate: device.decommissionDate || '',
			status: getResolvedDeviceStatus(device),
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
			return;
		}

		setDeviceFormData((prev) => {
			if (field === 'decommissionDate') {
				return {
					...prev,
					decommissionDate: value,
					status: value ? 'Decommissioned' : prev.status === 'Decommissioned' ? 'Active' : prev.status,
				};
			}

			if (field === 'status' && value !== 'Decommissioned') {
				return {
					...prev,
					status: value,
					decommissionDate: '',
				};
			}

			return {
				...prev,
				[field]: value,
			};
		});
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
				type: deviceFormData.type.trim(),
				brand: deviceFormData.brand.trim(),
				model: deviceFormData.model.trim(),
				serialNumber: deviceFormData.serialNumber?.trim() || '',
				status: deviceFormData.decommissionDate ? 'Decommissioned' : deviceFormData.status,
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
			console.error('Error saving appliance:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDevice = (deviceId: string) => {
		setDeleteDialogMessage('Are you sure you want to delete this appliance?');
		setPendingDeleteDeviceId(deviceId);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteDevice = async () => {
		if (!pendingDeleteDeviceId) return;
		try {
			await deleteDevice(pendingDeleteDeviceId);
			setSelectedDevice(null);
		} catch (error) {
			console.error('Error deleting appliance:', error);
			feedback.notify('Failed to delete appliance. Please try again.');
		}
		setDeleteDialogOpen(false);
		setPendingDeleteDeviceId(null);
	};

	if (isLoading) {
		return (
			<SectionContainer>
				<SectionHeader>Household Appliances</SectionHeader>
				<div>Loading appliances...</div>
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
					Active: {devices.filter((d) => getResolvedDeviceStatus(d) === 'Active').length}
				</TabSummaryPill>
				<TabSummaryPill>
					Needs Attention: {needsAttentionDeviceCount}
				</TabSummaryPill>
				<TabSummaryPill>
					Open Appliance Tasks: {linkedOpenTaskCount}
				</TabSummaryPill>
			</TabSummaryBar>

			<Toolbar>
				<ToolbarButton
					className='primary-action'
					disabled={remainingDeviceSlots <= 0}
					onClick={handleOpenCreateModal}
					style={{ width: isMobile ? '100%' : undefined }}>
					<FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
					{remainingDeviceSlots <= 0 ? 'Appliance Limit Reached' : 'Add Appliance'}
				</ToolbarButton>
			</Toolbar>

			{isMobile && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
					{devices.map((device) => {
						const { linkedOpenTasks, overdueLinkedTasks, recurringLinkedTasks, needsAttention } = getDeviceAttentionState(device);
						const resolvedStatus = getResolvedDeviceStatus(device);
						const stateTone = needsAttention ? '#f59e0b' : resolvedStatus === 'Decommissioned' ? '#64748b' : '#22c55e';
						const detailsMissing = !hasApplianceDetails(device);
						return (
							<DeviceCard
								key={device.id}
								$isSelected={selectedDevice === device}
								onClick={() => setSelectedDevice(device)}
								style={{
									borderLeftColor: resolvedStatus === 'Broken' ? '#ef4444' : resolvedStatus === 'Maintenance' ? '#f59e0b' : resolvedStatus === 'Decommissioned' ? '#64748b' : '#22c55e',
								}}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
									<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
										<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
											<button
												onClick={(event) => {
													event.stopPropagation();
													navigate(getDeviceDetailPath(device));
												}}
												style={{
													fontWeight: 800,
													fontSize: 15,
													color: '#0f172a',
													background: 'transparent',
													border: 'none',
													cursor: 'pointer',
													padding: 0,
													textAlign: 'left',
													lineHeight: 1.3,
												}}>
												{device.type || 'Appliance'}
											</button>
											{detailsMissing && (
												<div style={{ fontSize: 12, color: '#854d0e', fontWeight: 800 }}>
													No details added
												</div>
											)}
											<div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
												{device.brand || 'No brand'}
											</div>
										</div>
										<span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: `${stateTone}14`, color: stateTone, border: `1px solid ${stateTone}33`, whiteSpace: 'nowrap' }}>
											{needsAttention ? 'Needs Attention' : resolvedStatus}
										</span>
									</div>
									<MobileFeedMeta>
										<MobileFeedLine>{device.model || 'No model details yet'}</MobileFeedLine>
										<MobileFeedLineMuted>
											Installed {device.installationDate ? new Date(device.installationDate).toLocaleDateString() : 'Not set'}
											{device.decommissionDate
												? ` | Decommissioned ${new Date(device.decommissionDate).toLocaleDateString()}`
												: ''}
										</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											{linkedOpenTasks} open task{linkedOpenTasks === 1 ? '' : 's'}
											{recurringLinkedTasks > 0 ? ' • Recurring care active' : ''}
										</MobileFeedLineMuted>
										{overdueLinkedTasks > 0 && (
											<MobileFeedLineMuted style={{ color: '#b91c1c', fontWeight: 700 }}>
												Overdue by {overdueLinkedTasks} task{overdueLinkedTasks === 1 ? '' : 's'}
											</MobileFeedLineMuted>
										)}
									</MobileFeedMeta>
								</div>
								<MobileTaskActions>
									<MobileActionButton variant='primary' onClick={(event) => { event.stopPropagation(); navigate(getDeviceDetailPath(device)); }}>View history</MobileActionButton>
									<MobileActionLinkRow>
										<MobileActionLinkButton onClick={(event) => { event.stopPropagation(); handleOpenEditModal(device); }}>Edit</MobileActionLinkButton>
										<MobileActionLinkButton $danger onClick={(event) => { event.stopPropagation(); handleDeleteDevice(device.id); }}>Delete</MobileActionLinkButton>
									</MobileActionLinkRow>
								</MobileTaskActions>
								{device.files && device.files.length > 0 ? (
									<div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
										{device.files.map((file, i) => (
											<a key={i} href={file.url} target='_blank' rel='noopener noreferrer' style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>{file.name}</a>
										))}
									</div>
								) : null}
							</DeviceCard>
						);
					})}
				</div>
			)}

			{devices.length === 0 ? (
				<EmptyState>
					<FontAwesomeIcon icon={faWrench} size='3x' color='#ccc' />
					<p>No appliances added yet</p>
					<p>Add one appliance or system when you are ready to start building service history.</p>
					<ToolbarButton
						type='button'
						onClick={handleOpenCreateModal}
						disabled={remainingDeviceSlots <= 0}>
						{remainingDeviceSlots <= 0 ? 'Appliance Limit Reached' : 'Add Appliance'}
					</ToolbarButton>
				</EmptyState>
			) : (
				<DesktopTableWrapper>
					<ReusableTable
						columns={columns}
						rowData={devices}
						getRowClassName={(row: any) =>
							getDeviceAttentionState(row).needsAttention ? 'attention-row' : undefined
						}
						actions={deviceActions}
						showCheckbox={false}
						hideHeader={true}
						emptyMessage='No systems have been recorded yet. Add your first appliance to start operational history.'
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
