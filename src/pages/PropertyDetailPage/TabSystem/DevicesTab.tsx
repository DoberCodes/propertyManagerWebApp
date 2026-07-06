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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'Redux/store';
import {
	useGetDevicesQuery,
	useLazyGetAllDevicesQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
} from 'Redux/API/deviceSlice';
import { useGetTasksQuery } from 'Redux/API/taskSlice';
import {
	useGetUnitsQuery,
	useUpdatePropertyMutation,
} from 'Redux/API/propertySlice';
import { apiSlice } from 'Redux/API/apiSlice';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { WarningDialog } from '../../../Components/Library/WarningDialog';
import { DeviceModal } from '../../../Components/Library/Modal';
import {
	Device,
	Property,
	DeviceServiceItem,
	PropertyDocumentCategory,
} from '../../../types/Property.types';
import {
	preparePropertyMemoryDocumentUploads,
	startPdfDocumentKnowledgeProcessing,
} from '../../../propertyKnowledge/propertyDocumentUploads';
import { buildDeviceSlug } from '../../../utils/deviceSlug';
import { useAppFeedback } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	DesktopTableWrapper,
	Toolbar,
	ToolbarButton,
	TabSummaryBar,
	TabSummaryPill,
	DeviceCard,
	StatusBadge,
	MobileTaskActions,
	MobileActionButton,
	MobileActionLinkRow,
	MobileActionLinkButton,
	MobileFeedMeta,
	MobileFeedLine,
	MobileFeedLineMuted,
} from './index.styles';
import { AppZeroState, ReusableTable } from '../../../Components/Library';
import { LoadingState } from '../../../Components/LoadingState';
import { Column, Action } from '../../../Components/Library/ReusableTable';
import {
	CompactFilterResultCount,
	DesktopCreateAction,
	DesktopFilterArea,
} from './mobileUiShared';
import { PropertyTabFilterPanel } from './PropertyTabFilterPanel';
import { FilterConfig, FilterValues } from '../../../Components/Library/FilterBar';
import {
	canAddDevice,
	getEffectiveSubscriptionPlanId,
	getRemainingDeviceSlots,
	getSubscriptionPlanDetails,
} from '../../../utils/subscriptionUtils';
import { RoleCapabilities } from '../../../utils/permissions';
import {
	getDeviceAssetVariant,
	getDeviceAssetType,
	getAssetVariantOptions,
	normalizeAssetVariant,
	normalizeAssetType,
	UNKNOWN_ASSET_TYPE,
} from '../../../utils/systemTypes';
import { COLORS } from '../../../constants/colors';

const SectionLead = styled.p`
	margin: -4px 0 14px;
	color: ${COLORS.gray600};
	font-size: 0.92rem;
	line-height: 1.5;
`;

interface DeviceFormData {
	type: string;
	assetType?: string;
	assetVariant?: string;
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
	permissions?: RoleCapabilities;
	openCreateDeviceToken?: number;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
	property,
	permissions,
	openCreateDeviceToken = 0,
}) => {
	const navigate = useNavigate();
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const feedback = useAppFeedback();
	const [editingDevice, setEditingDevice] = useState<any>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedDevice, setSelectedDevice] = useState<any>(null);
	const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
	const [pendingPropertyDocumentFiles, setPendingPropertyDocumentFiles] =
		useState<File[]>([]);
	const [pendingPropertyDocumentCategory, setPendingPropertyDocumentCategory] =
		useState<PropertyDocumentCategory>('other');
	const [removedExistingFileUrls, setRemovedExistingFileUrls] = useState<
		string[]
	>([]);
	// delete confirmation dialog state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteDialogMessage, setDeleteDialogMessage] = useState('');
	const [pendingDeleteDeviceId, setPendingDeleteDeviceId] = useState<
		string | null
	>(null);
	const [filters, setFilters] = useState<FilterValues>({});
	const [sortBy, setSortBy] = useState<'type' | 'status' | 'brand'>('type');

	const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
		type: UNKNOWN_ASSET_TYPE,
		assetType: UNKNOWN_ASSET_TYPE,
		assetVariant: '',
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
	const lastOpenCreateTokenRef = useRef(0);
	const openCreateModalRef = useRef<() => void>(() => undefined);

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const [loadAllDevices, { data: allDevices = [] }] =
		useLazyGetAllDevicesQuery();
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
			String(device?.assetType || '').trim() ||
			String(device?.assetVariant || '').trim() ||
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

	const getLastServicedDate = (device: any): string => {
		const history = Array.isArray(device?.maintenanceHistory)
			? device.maintenanceHistory
			: [];
		const latest = history
			.filter((entry: any) => entry?.date)
			.sort((a: any, b: any) => {
				const left = new Date(a.date).getTime() || 0;
				const right = new Date(b.date).getTime() || 0;
				return right - left;
			})[0];
		if (!latest?.date) return 'Last serviced not recorded';
		const date = new Date(latest.date);
		if (Number.isNaN(date.getTime())) return 'Last serviced not recorded';
		return `Last serviced ${date.toLocaleDateString()}`;
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

	const deviceFilters: FilterConfig[] = [
		{
			key: 'status',
			label: 'Lifecycle Status',
			type: 'select',
			options: [
				{ value: 'Active', label: 'Active' },
				{ value: 'Maintenance', label: 'Maintenance' },
				{ value: 'Broken', label: 'Broken' },
				{ value: 'Decommissioned', label: 'Decommissioned' },
			],
		},
		{
			key: 'attention',
			label: 'Attention',
			type: 'select',
			options: [
				{ value: 'needs-attention', label: 'Needs attention' },
				{ value: 'no-open-tasks', label: 'No open tasks' },
				{ value: 'missing-details', label: 'Missing details' },
			],
		},
	];

	const filteredDevices = useMemo(() => {
		const query = String(filters.search || '').trim().toLowerCase();
		const filtered = devices.filter((device: any) => {
			const status = getResolvedDeviceStatus(device);
			const linkedOpenTasks =
				linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
			const overdueLinkedTasks =
				linkedOverdueTaskCountByDevice.get(String(device.id)) || 0;
			const needsAttention =
				status === 'Broken' ||
				status === 'Maintenance' ||
				linkedOpenTasks > 0 ||
				overdueLinkedTasks > 0;
			if (filters.status && status !== filters.status) return false;
			if (
				filters.attention === 'needs-attention' &&
				!needsAttention
			) {
				return false;
			}
			if (
				filters.attention === 'no-open-tasks' &&
				linkedOpenTasks > 0
			) {
				return false;
			}
			if (
				filters.attention === 'missing-details' &&
				hasApplianceDetails(device)
			) {
				return false;
			}
			if (query) {
				const haystack = [
					getDeviceAssetType(device),
					getDeviceAssetVariant(device),
					device.type,
					device.brand,
					device.model,
					device.serialNumber,
					device.filterSize,
					device.specNotes,
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				if (!haystack.includes(query)) return false;
			}
			return true;
		});

		return [...filtered].sort((left: any, right: any) => {
			if (sortBy === 'status') {
				return getResolvedDeviceStatus(left).localeCompare(
					getResolvedDeviceStatus(right),
				);
			}
			if (sortBy === 'brand') {
				return String(left.brand || '').localeCompare(String(right.brand || ''));
			}
			return String(left.type || '').localeCompare(String(right.type || ''));
		});
	}, [devices, filters, sortBy, linkedOpenTaskCountByDevice, linkedOverdueTaskCountByDevice]);

	const clearDeviceFilters = () => {
		setFilters({});
		setSortBy('type');
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
		const context = `${getDeviceAssetType(device)} ${getDeviceAssetVariant(device)} ${device.type || ''} ${device.brand || ''} ${device.model || ''}`.toLowerCase();
		if (context.includes('hvac') || context.includes('heat') || context.includes('cool')) {
			return { icon: faFan, color: COLORS.primary, background: COLORS.primaryLight };
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

	const propertyAssignedDocumentsByDevice = useMemo(() => {
		const map = new Map<string, any[]>();
		const documents = Array.isArray((property as any)?.documents)
			? (property as any).documents
			: [];
		documents.forEach((document: any) => {
			const linkedDeviceIds = [
				document?.assignedDeviceId,
				...(Array.isArray(document?.links?.assetIds)
					? document.links.assetIds
					: []),
			].filter(Boolean);
			linkedDeviceIds.forEach((linkedDeviceId) => {
				const deviceId = String(linkedDeviceId);
				map.set(deviceId, [...(map.get(deviceId) || []), document]);
			});
		});
		return map;
	}, [property]);

	const columns: Column[] = [
		{
			header: 'System Profile',
			key: 'type',
			render: (_value: string, row: any) => {
				const locationName = row.location?.unitId
					? units.find((u) => u.id === row.location.unitId)?.name || 'Unit'
					: 'Property level';
				const technical = [row.brand, row.model].filter(Boolean).join(' ');
				const assetType = getDeviceAssetType(row);
				const assetVariant = getDeviceAssetVariant(row);
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
								{assetType || row.type || 'Appliance'}
							</div>
							{assetVariant && (
								<span
									style={{
										border: `1px solid ${COLORS.primaryHover}`,
										background: COLORS.primaryLight,
										color: COLORS.successDark,
										borderRadius: 999,
										padding: '2px 7px',
										fontSize: 11,
										fontWeight: 800,
										whiteSpace: 'nowrap',
									}}>
									{assetVariant}
								</span>
							)}
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
								<span style={{ color: COLORS.primary, fontWeight: 700 }}>
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
						color: COLORS.successDark,
						background: COLORS.successLight,
						border: COLORS.primaryHover,
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
			render: (files: any[], row: any) => {
				const directCount = Array.isArray(files) ? files.length : 0;
				const assignedCount =
					propertyAssignedDocumentsByDevice.get(String(row.id))?.length || 0;
				const count = directCount + assignedCount;
				return (
					<span style={{ color: count > 0 ? COLORS.primary : COLORS.textMuted, fontWeight: count > 0 ? 700 : 500 }}>
						{count > 0 ? `${count} record${count === 1 ? '' : 's'} stored` : 'No documents yet'}
					</span>
				);
			},
		},
	];

	const [createDevice] = useCreateDeviceMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [updateProperty] = useUpdatePropertyMutation();
	const [deleteDevice] = useDeleteDeviceMutation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isMobile = useSelector((state: RootState) => state.app.isMobile);
	const dispatch = useDispatch();
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const canManageAppliances = permissions?.canManageAppliances ?? true;

	const deviceActions: Action[] = [
		{
			label: 'View',
			icon: faEye,
			onClick: (device: any) => {
				navigate(getDeviceDetailPath(device));
			},
		},
		...(canManageAppliances
			? [
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
			]
			: []),
	];

	const resetForm = () => {
		setDeviceFormData({
			type: UNKNOWN_ASSET_TYPE,
			assetType: UNKNOWN_ASSET_TYPE,
			assetVariant: '',
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
		setPendingPropertyDocumentFiles([]);
		setPendingPropertyDocumentCategory('other');
		setRemovedExistingFileUrls([]);
		setEditingDevice(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const remainingDeviceSlots = useMemo(() => {
		if (!currentUser?.subscription) return 0;
		const knownDeviceCount = allDevices.length || devices.length;
		return getRemainingDeviceSlots(currentUser.subscription, knownDeviceCount);
	}, [allDevices.length, currentUser?.subscription, devices.length]);

	const handleOpenCreateModal = async () => {
		if (!canManageAppliances) {
			feedback.notify('Your role can view appliances but cannot add or edit them.');
			return;
		}
		if (!currentUser?.subscription) {
			feedback.notify('Unable to verify subscription. Please contact support.');
			return;
		}

		let accountDeviceCount = allDevices.length;
		try {
			const loadedDevices = await loadAllDevices(undefined, true).unwrap();
			accountDeviceCount = loadedDevices.length;
		} catch (error) {
			console.error('Error verifying appliance limit:', error);
			feedback.notify('Unable to verify appliance limits. Please try again.');
			return;
		}

		if (!canAddDevice(currentUser.subscription, accountDeviceCount)) {
			const planDetails = getSubscriptionPlanDetails(
				getEffectiveSubscriptionPlanId(currentUser.subscription),
			);
			const maxDevices = planDetails?.maxDevices || 15;
			if (isTeamMemberAccount) {
				feedback.notify(
					`This account has reached its appliance limit of ${maxDevices}. Ask the account holder to adjust the account or remove unused appliances.`,
				);
			} else {
				feedback.notify(
					`Your ${planDetails?.name || 'current'} plan allows up to ${maxDevices} appliances. ` +
					`You currently have ${accountDeviceCount} appliances. ` +
					`Please upgrade your plan to add more appliances.`,
				);
			}
			return;
		}

		resetForm();
		setShowDeviceModal(true);
	};

	openCreateModalRef.current = handleOpenCreateModal;

	useEffect(() => {
		if (
			!openCreateDeviceToken ||
			lastOpenCreateTokenRef.current === openCreateDeviceToken
		) {
			return;
		}

		lastOpenCreateTokenRef.current = openCreateDeviceToken;
		openCreateModalRef.current();
	}, [openCreateDeviceToken]);

	const handleOpenEditModal = (device: any) => {
		if (!canManageAppliances) {
			feedback.notify('Your role can view appliances but cannot edit them.');
			return;
		}
		setDeviceFormData({
			type: getDeviceAssetType(device),
			assetType: getDeviceAssetType(device),
			assetVariant: getDeviceAssetVariant(device),
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
			if (field === 'assetType') {
				const nextAssetType = normalizeAssetType(value);
				const variantOptions = getAssetVariantOptions(nextAssetType);
				const nextVariant = variantOptions.includes(prev.assetVariant || '')
					? prev.assetVariant || ''
					: '';
				return {
					...prev,
					type: nextAssetType,
					assetType: nextAssetType,
					assetVariant: nextVariant,
				};
			}

			if (field === 'assetVariant') {
				return {
					...prev,
					assetVariant: normalizeAssetVariant(prev.assetType || prev.type, value),
				};
			}

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
		if (!canManageAppliances) {
			feedback.notify('Your role can view appliances but cannot save appliance changes.');
			return;
		}

		setIsSubmitting(true);
		try {
			const persistedFiles = (deviceFormData.files || []).filter(
				(file) => !removedExistingFileUrls.includes(file.url),
			);

			const deviceData = {
				...deviceFormData,
				type: normalizeAssetType(deviceFormData.assetType || deviceFormData.type),
				assetType: normalizeAssetType(deviceFormData.assetType || deviceFormData.type),
				assetVariant: normalizeAssetVariant(
					deviceFormData.assetType || deviceFormData.type,
					deviceFormData.assetVariant,
				),
				brand: deviceFormData.brand.trim(),
				model: deviceFormData.model.trim(),
				serialNumber: deviceFormData.serialNumber?.trim() || '',
				status: deviceFormData.decommissionDate ? 'Decommissioned' : deviceFormData.status,
				files: persistedFiles,
				userId: currentUser!.id,
			};

			let savedDeviceId = editingDevice?.id ? String(editingDevice.id) : '';
			if (editingDevice) {
				await updateDevice({
					id: editingDevice.id,
					updates: deviceData,
				}).unwrap();
			} else {
				const savedDevice = await createDevice(deviceData).unwrap();
				savedDeviceId = String((savedDevice as any)?.id || '');
			}

			const propertyDocumentUploads = [
				...pendingUploadFiles.map((file) => ({
					file,
					category: 'other' as PropertyDocumentCategory,
				})),
				...pendingPropertyDocumentFiles.map((file) => ({
					file,
					category: pendingPropertyDocumentCategory,
				})),
			];
			if (propertyDocumentUploads.length > 0) {
				const propertyDocuments = Array.isArray((property as any)?.documents)
					? (property as any).documents
					: [];
				const propertyKnowledgeSuggestions = Array.isArray(
					(property as any)?.knowledgeSuggestions,
				)
					? (property as any).knowledgeSuggestions
					: [];
				const savedDocuments: any[] = [];
				const knowledgeSuggestions: any[] = [];
				const pdfDocuments: any[] = [];
				for (const { file, category } of propertyDocumentUploads) {
					const result = await preparePropertyMemoryDocumentUploads({
						files: [file],
						propertyId: property.id,
						category,
						property,
						systems: devices as Device[],
						uploadContext: {
							assetIds: savedDeviceId ? [savedDeviceId] : [],
						},
					});
					savedDocuments.push(...result.documents);
					knowledgeSuggestions.push(...result.knowledgeSuggestions);
					pdfDocuments.push(...result.pdfDocuments);
				}
				await updateProperty({
					id: property.id,
					updates: {
						documents: [...propertyDocuments, ...savedDocuments],
						knowledgeSuggestions: [
							...propertyKnowledgeSuggestions,
							...knowledgeSuggestions,
						],
					},
				}).unwrap();
				startPdfDocumentKnowledgeProcessing({
					propertyId: property.id,
					documents: pdfDocuments,
					onProcessed: () => {
						dispatch(apiSlice.util.invalidateTags(['Properties']));
					},
					onError: () => {
						dispatch(apiSlice.util.invalidateTags(['Properties']));
					},
				});
				setPendingUploadFiles([]);
				setPendingPropertyDocumentFiles([]);
				setPendingPropertyDocumentCategory('other');
			}

			handleCloseModal();
		} catch (error) {
			console.error('Error saving appliance:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDevice = (deviceId: string) => {
		if (!canManageAppliances) {
			feedback.notify('Your role can view appliances but cannot delete them.');
			return;
		}
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
			<LoadingState
				loadingKey='property-appliances'
				title='Loading appliances'
				message='Preparing this property appliance list.'
				steps={[
					'Reading appliance information...',
					'Checking upcoming maintenance...',
					'Connecting maintenance history...',
					'Looking for missing documentation...',
					'Almost ready...',
				]}
			/>
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

			{canManageAppliances && (
				<DesktopCreateAction>
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
				</DesktopCreateAction>
			)}

			<CompactFilterResultCount>
				Showing {filteredDevices.length} of {devices.length} appliances for{' '}
				{property.title || 'this property'}
			</CompactFilterResultCount>
			<PropertyTabFilterPanel
				propertyName={property.title || 'this property'}
				resourceName='appliances and systems'
				searchPlaceholder='Search appliances, brands, or models...'
				filters={filters}
				onFiltersChange={setFilters}
				filterConfigs={deviceFilters}
				sortValue={sortBy}
				defaultSortValue='type'
				sortOptions={[
					{ value: 'type', label: 'Appliance type' },
					{ value: 'status', label: 'Lifecycle status' },
					{ value: 'brand', label: 'Brand' },
				]}
				onSortChange={(value) =>
					setSortBy(value as 'type' | 'status' | 'brand')
				}
			/>
			<DesktopFilterArea>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns:
							'minmax(240px, 1.4fr) repeat(3, minmax(170px, 1fr))',
						gap: 10,
						marginBottom: 16,
					}}>
					<input
						type='search'
						placeholder='Search appliances, brands, or models...'
						value={(filters.search as string) || ''}
						onChange={(event) =>
							setFilters((current) => ({
								...current,
								search: event.target.value,
							}))
						}
						style={{
							minHeight: 42,
							padding: '8px 12px',
							border: '1px solid #cbd5e1',
							borderRadius: 10,
						}}
					/>
					<select
						value={(filters.status as string) || ''}
						onChange={(event) =>
							setFilters((current) => ({
								...current,
								status: event.target.value,
							}))
						}
						style={{ minHeight: 42, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 10 }}>
						<option value=''>All statuses</option>
						{deviceFilters[0].options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<select
						value={(filters.attention as string) || ''}
						onChange={(event) =>
							setFilters((current) => ({
								...current,
								attention: event.target.value,
							}))
						}
						style={{ minHeight: 42, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 10 }}>
						<option value=''>All attention states</option>
						{deviceFilters[1].options?.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<select
						value={sortBy}
						onChange={(event) =>
							setSortBy(event.target.value as 'type' | 'status' | 'brand')
						}
						style={{ minHeight: 42, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 10 }}>
						<option value='type'>Sort: Appliance type</option>
						<option value='status'>Sort: Lifecycle status</option>
						<option value='brand'>Sort: Brand</option>
					</select>
				</div>
			</DesktopFilterArea>

			{isMobile && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
					{filteredDevices.map((device) => {
						const { linkedOpenTasks, overdueLinkedTasks, recurringLinkedTasks, needsAttention } = getDeviceAttentionState(device);
						const resolvedStatus = getResolvedDeviceStatus(device);
						const stateTone = needsAttention ? '#f59e0b' : resolvedStatus === 'Decommissioned' ? '#64748b' : COLORS.success;
						const detailsMissing = !hasApplianceDetails(device);
						const assignedPropertyDocuments =
							propertyAssignedDocumentsByDevice.get(String(device.id)) || [];
						const documentCount =
							(device.files?.length || 0) + assignedPropertyDocuments.length;
						const deviceSummary = [device.brand, device.model]
							.filter(Boolean)
							.join(' · ');
						return (
							<DeviceCard
								key={device.id}
								$isSelected={selectedDevice === device}
								onClick={() => setSelectedDevice(device)}
								style={{
									borderLeftColor: resolvedStatus === 'Broken' ? '#ef4444' : resolvedStatus === 'Maintenance' ? '#f59e0b' : resolvedStatus === 'Decommissioned' ? '#64748b' : COLORS.success,
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
												{getDeviceAssetType(device) || device.type || 'Appliance'}
											</button>
											{getDeviceAssetVariant(device) && (
												<div style={{ fontSize: 12, color: COLORS.successDark, fontWeight: 800 }}>
													{getDeviceAssetVariant(device)}
												</div>
											)}
											{detailsMissing && (
												<div style={{ fontSize: 12, color: '#854d0e', fontWeight: 800 }}>
													No details added
												</div>
											)}
										</div>
										<span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: `${stateTone}14`, color: stateTone, border: `1px solid ${stateTone}33`, whiteSpace: 'nowrap' }}>
											{needsAttention ? 'Needs Attention' : resolvedStatus}
										</span>
									</div>
									<MobileFeedMeta>
										{deviceSummary && (
											<MobileFeedLine>{deviceSummary}</MobileFeedLine>
										)}
										<MobileFeedLineMuted>
											{linkedOpenTasks} open task{linkedOpenTasks === 1 ? '' : 's'}
											{recurringLinkedTasks > 0 ? ' • Recurring care active' : ''}
										</MobileFeedLineMuted>
										<MobileFeedLineMuted>
											{getLastServicedDate(device)}
										</MobileFeedLineMuted>
										{overdueLinkedTasks > 0 && (
											<MobileFeedLineMuted style={{ color: '#b91c1c', fontWeight: 700 }}>
												Overdue by {overdueLinkedTasks} task{overdueLinkedTasks === 1 ? '' : 's'}
											</MobileFeedLineMuted>
										)}
										{documentCount > 0 && (
											<MobileFeedLineMuted>
												{documentCount} document{documentCount === 1 ? '' : 's'} attached
											</MobileFeedLineMuted>
										)}
									</MobileFeedMeta>
								</div>
								<MobileTaskActions>
									<MobileActionButton variant='primary' onClick={(event) => { event.stopPropagation(); navigate(getDeviceDetailPath(device)); }}>View history</MobileActionButton>
									{canManageAppliances && (
										<MobileActionLinkRow>
											<MobileActionLinkButton onClick={(event) => { event.stopPropagation(); handleOpenEditModal(device); }}>Edit</MobileActionLinkButton>
											<MobileActionLinkButton $danger onClick={(event) => { event.stopPropagation(); handleDeleteDevice(device.id); }}>Delete</MobileActionLinkButton>
										</MobileActionLinkRow>
									)}
								</MobileTaskActions>
							</DeviceCard>
						);
					})}
				</div>
			)}

			{devices.length === 0 ? (
				<AppZeroState
					kind='noAppliances'
					actions={
						canManageAppliances
							? [
								{
									label:
										remainingDeviceSlots <= 0
											? 'Appliance Limit Reached'
											: 'Add Appliance',
									onClick: handleOpenCreateModal,
									disabled: remainingDeviceSlots <= 0,
									hideOnCompact: true,
								},
							]
							: []
					}
				/>
			) : filteredDevices.length === 0 ? (
				<AppZeroState
					kind='noApplianceMatches'
					actions={[
						{
							label: 'Clear Filters',
							onClick: clearDeviceFilters,
						},
					]}
				/>
			) : (
				<DesktopTableWrapper>
					<ReusableTable
						columns={columns}
						rowData={filteredDevices}
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
			{canManageAppliances && (
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
					deviceId={editingDevice?.id}
					units={units}
					pendingPropertyDocumentFiles={pendingPropertyDocumentFiles}
					onPendingPropertyDocumentFilesChange={setPendingPropertyDocumentFiles}
					pendingPropertyDocumentCategory={pendingPropertyDocumentCategory}
					onPendingPropertyDocumentCategoryChange={
						setPendingPropertyDocumentCategory
					}
				/>
			)}
		</SectionContainer>
	);
};
