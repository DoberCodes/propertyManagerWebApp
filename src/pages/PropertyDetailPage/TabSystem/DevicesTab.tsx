import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import {
	faPlus,
	faEye,
	faEdit,
	faTrash,
	faWrench,
	faFan,
	faSnowflake,
	faClipboardCheck,
	faHouse,
	faPlug,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store';
import { selectIsHomeowner } from 'Redux/selectors/permissionSelectors';
import {
	useGetDevicesQuery,
	useLazyGetAllDevicesQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
} from 'Redux/API/deviceSlice';
import {
	useGetPropertyKnowledgeLinksQuery,
	useSetEquipmentSpaceLinksMutation,
	useSetAttachedEquipmentMutation,
	useSetSupplyLinksMutation,
} from 'Redux/API/propertyKnowledgeLinkSlice';
import {
	useCreatePropertySupplyMutation,
	useGetPropertySuppliesQuery,
} from 'Redux/API/supplySlice';
import { useGetTasksQuery } from 'Redux/API/taskSlice';
import { useGetUnitsQuery } from 'Redux/API/propertySlice';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { WarningDialog } from '../../../Components/Library/WarningDialog';
import { DeviceModal } from '../../../Components/Library/Modal';
import {
	Device,
	Property,
	PropertyDocumentCategory,
} from '../../../types/Property.types';
import { usePropertyDocumentUploadWorkflow } from '../../../propertyKnowledge/usePropertyDocumentUploadWorkflow';
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
	getEffectiveAccessPlanId,
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
import { expectsEquipmentIdentityDetails } from '../../../intelligence/assetRecordExpectations';
import { formatDisplayDate, getDisplayDateTime, parseDisplayDate } from '../../../utils/dateDisplay';
import { getMaintenanceEventDate } from '../../../utils/maintenanceEventUtils';
import { mergeMaintenanceHistoryWithDeviceSources } from '../../../maintenanceHistory/maintenanceHistoryAdapter';
import {
	getEquipmentSpaceIds,
	getAttachedEquipmentIds,
	getEndpointSupplyIds,
} from '../../../types/PropertyKnowledgeLink.types';
import type { PendingEquipmentSupplyDraft } from '../../../Components/EquipmentSuppliesReview/EquipmentSuppliesReview';
import { buildEquipmentSupplyLinkUpdates } from '../../../propertyKnowledge/equipmentSupplyConnections';
import { getTopLevelEquipment } from '../../../propertyKnowledge/equipmentRelationships';

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
	spaceIds: string[];
}

interface DevicesTabProps {
	property: Property;
	maintenanceHistoryRecords?: any[];
	permissions?: RoleCapabilities;
	openCreateDeviceToken?: number;
	attachToEquipmentId?: string;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
	property,
	maintenanceHistoryRecords = [],
	permissions,
	openCreateDeviceToken = 0,
	attachToEquipmentId,
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
	const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>([]);
	const [pendingSupplies, setPendingSupplies] = useState<
		PendingEquipmentSupplyDraft[]
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
		installationDate: '',
		decommissionDate: '',
		status: 'Active',
		location: {
			propertyId: property.id,
		},
		files: [],
		spaceIds: [],
	});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const lastOpenCreateTokenRef = useRef(0);
	const openCreateModalRef = useRef<() => void>(() => undefined);

	const { data: devices = [], isLoading } = useGetDevicesQuery(property.id);
	const propertyAccountId = String(
		property.accountId || property.userId || '',
	).trim();
	const { data: propertyKnowledgeLinks = [] } =
		useGetPropertyKnowledgeLinksQuery(
			{ accountId: propertyAccountId, propertyId: property.id },
			{ skip: !propertyAccountId || !property.id },
		);
	const [setAttachedEquipment] = useSetAttachedEquipmentMutation();
	const topLevelDevices = useMemo(
		() => getTopLevelEquipment(devices, propertyKnowledgeLinks),
		[devices, propertyKnowledgeLinks],
	);
	const { data: propertySupplies = [] } = useGetPropertySuppliesQuery(
		{
			accountId: propertyAccountId,
			propertyId: property.id,
			includeArchived: true,
		},
		{ skip: !propertyAccountId || !property.id },
	);
	const [createPropertySupply] = useCreatePropertySupplyMutation();
	const [setSupplyLinks] = useSetSupplyLinksMutation();
	const [loadAllDevices, { data: allDevices = [] }] =
		useLazyGetAllDevicesQuery();
	const { data: units = [] } = useGetUnitsQuery(property.id);
	const { data: allTasks = [] } = useGetTasksQuery();
	const resolvedMaintenanceHistory = useMemo(
		() =>
			mergeMaintenanceHistoryWithDeviceSources(
				maintenanceHistoryRecords,
				devices,
			),
		[maintenanceHistoryRecords, devices],
	);

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
			const dueDate = parseDisplayDate(task.dueDate);
			if (!dueDate) return;
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

	const getDeviceInstallDate = useCallback((device: any): string =>
		String(device?.installationDate || device?.installDate || '').trim(), []);

	const hasApplianceDetails = useCallback((device: any) => {
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
			getDeviceInstallDate(device) ||
			String(device?.decommissionDate || '').trim() ||
			serviceItems.length > 0 ||
			files.length > 0,
		);
	}, [getDeviceInstallDate]);

	const getLastServicedDate = (device: any): string => {
		const deviceId = String(device?.id || '').trim();
		const latest = resolvedMaintenanceHistory
			.filter((record: any) =>
				(Array.isArray(record.deviceIds) ? record.deviceIds : [record.deviceId])
					.map((id: any) => String(id || '').trim())
					.includes(deviceId),
			)
			.filter((record: any) => getMaintenanceEventDate(record))
			.sort((a: any, b: any) => {
				const left = getDisplayDateTime(getMaintenanceEventDate(a));
				const right = getDisplayDateTime(getMaintenanceEventDate(b));
				return right - left;
			})[0];
		const latestDate = latest ? getMaintenanceEventDate(latest) : '';
		if (!latestDate) return 'Last serviced not recorded';
		const formatted = formatDisplayDate(latestDate);
		if (!formatted) return 'Last serviced not recorded';
		return `Last serviced ${formatted}`;
	};

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

		return {
			status,
			linkedOpenTasks,
			overdueLinkedTasks,
			recurringLinkedTasks,
		};
	};

	const deviceFilters: FilterConfig[] = [
		{
			key: 'status',
			label: 'Equipment status',
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
			label: 'Record',
			type: 'select',
			options: [
				{ value: 'no-open-tasks', label: 'No open tasks' },
				{ value: 'missing-details', label: 'Missing details' },
			],
		},
	];

	const filteredDevices = useMemo(() => {
		const query = String(filters.search || '').trim().toLowerCase();
		const searchableDevices = query ? devices : topLevelDevices;
		const filtered = searchableDevices.filter((device: any) => {
			const status = getResolvedDeviceStatus(device);
			const linkedOpenTasks =
				linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
			if (filters.status && status !== filters.status) return false;
			if (
				filters.attention === 'no-open-tasks' &&
				linkedOpenTasks > 0
			) {
				return false;
			}
			if (
				filters.attention === 'missing-details' &&
				(!expectsEquipmentIdentityDetails(device) || hasApplianceDetails(device))
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
	}, [devices, topLevelDevices, filters, sortBy, linkedOpenTaskCountByDevice, hasApplianceDetails]);
	const visibleDeviceCount = String(filters.search || '').trim()
		? devices.length
		: topLevelDevices.length;

	const clearDeviceFilters = () => {
		setFilters({});
		setSortBy('type');
	};

	const formatRelativeTime = (value?: string): string => {
		if (!value) return 'No activity recorded yet';
		const target = getDisplayDateTime(value);
		if (!target) return 'No activity recorded yet';

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
				const expectsIdentityDetails = expectsEquipmentIdentityDetails(row);
				const detailsMissing = expectsIdentityDetails && !hasApplianceDetails(row);

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
								{assetType || row.type || 'Equipment'}
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
							{technical || (expectsIdentityDetails ? 'No model details yet' : 'Inspection record')}
						</div>
						<div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
							Location: {locationName}
						</div>
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
							{expectsIdentityDetails && (
								<span>Installed {formatRelativeTime(getDeviceInstallDate(row))}</span>
							)}
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
							<span style={{ color: '#94a3b8' }}>Service history and related records</span>
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
				} =
					getDeviceAttentionState({ ...row, status });

				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
							Installed or retired: {formatRelativeTime(row.decommissionDate || getDeviceInstallDate(row))}
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
	const [setEquipmentSpaceLinks] = useSetEquipmentSpaceLinksMutation();
	const [deleteDevice] = useDeleteDeviceMutation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isMobile = useSelector((state: RootState) => state.app.isMobile);
	const { uploadPropertyDocuments } = usePropertyDocumentUploadWorkflow();
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const canManageAppliances = permissions?.canManageAppliances ?? true;
	const canManageSpaces = permissions?.canManageProperties ?? false;
	const isHomeownerMode = useSelector(selectIsHomeowner);
	const equipmentLanguage = {
		contextNoun: isHomeownerMode ? 'this home' : 'this property',
	};

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
			installationDate: '',
			decommissionDate: '',
			status: 'Active',
			location: {
				propertyId: property.id,
			},
			files: [],
			spaceIds: [],
		});
		setPendingUploadFiles([]);
		setPendingPropertyDocumentFiles([]);
		setPendingPropertyDocumentCategory('other');
		setRemovedExistingFileUrls([]);
		setSelectedSupplyIds([]);
		setPendingSupplies([]);
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
			feedback.notify('Your role can view equipment but cannot add or edit it.');
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
			console.error('Error verifying equipment limit:', error);
			feedback.notify('Unable to verify equipment limits. Please try again.');
			return;
		}

		if (!canAddDevice(currentUser.subscription, accountDeviceCount)) {
			const planDetails = getSubscriptionPlanDetails(
				getEffectiveAccessPlanId(currentUser.subscription),
			);
			const maxDevices = planDetails?.maxDevices || 15;
			if (isTeamMemberAccount) {
				feedback.notify(
					`This account has reached its equipment limit of ${maxDevices}. Ask the account holder to adjust the account or remove unused equipment records.`,
				);
			} else {
				feedback.notify(
					`Your ${planDetails?.name || 'current'} plan allows up to ${maxDevices} equipment records. ` +
					`You currently have ${accountDeviceCount} equipment records. ` +
					`Please upgrade your plan to add more equipment records.`,
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
			feedback.notify('Your role can view equipment but cannot edit it.');
			return;
		}
		setDeviceFormData({
			type: getDeviceAssetType(device),
			assetType: getDeviceAssetType(device),
			assetVariant: getDeviceAssetVariant(device),
			brand: device.brand || '',
			model: device.model || '',
			serialNumber: device.serialNumber || '',
			installationDate: getDeviceInstallDate(device),
			decommissionDate: device.decommissionDate || '',
			status: getResolvedDeviceStatus(device),
			location: device.location || { propertyId: property.id },
			files: device.files || [],
			spaceIds: getEquipmentSpaceIds(
				propertyKnowledgeLinks,
				String(device.id),
			),
		});
		setRemovedExistingFileUrls([]);
		setSelectedSupplyIds(
			getEndpointSupplyIds(
				propertyKnowledgeLinks,
				'equipment',
				String(device.id),
			),
		);
		setPendingSupplies([]);
		setEditingDevice(device);
		setShowDeviceModal(true);
	};

	const handleCloseModal = () => {
		setShowDeviceModal(false);
		resetForm();
		setSelectedDevice(null);
		if (attachToEquipmentId) {
			navigate(`/property/${property.slug}?tab=devices`, { replace: true });
		}
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
			feedback.notify('Your role can view equipment but cannot save equipment changes.');
			return;
		}

		setIsSubmitting(true);
		try {
			const persistedFiles = (deviceFormData.files || []).filter(
				(file) => !removedExistingFileUrls.includes(file.url),
			);

			const { spaceIds, ...deviceFields } = deviceFormData;
			const deviceData = {
				...deviceFields,
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

			if (canManageSpaces) {
				try {
					await setEquipmentSpaceLinks({
						propertyId: property.id,
						equipmentId: savedDeviceId,
						spaceIds,
					}).unwrap();
				} catch (linkError) {
					console.error('Error saving equipment Spaces:', linkError);
					feedback.notify(
						'Equipment was saved, but Maintley could not update its Spaces. You can edit the equipment and try again.',
					);
				}
			}

			const desiredSupplyIds = new Set(selectedSupplyIds);
			for (const pendingSupply of pendingSupplies) {
				const { clientId, ...supplyDraft } = pendingSupply;
				if (!propertyAccountId) {
					throw new Error('This property is missing its account connection.');
				}
				const createdSupply = await createPropertySupply({
					...supplyDraft,
					accountId: propertyAccountId,
					propertyId: property.id,
					analyticsSource: 'user',
					analyticsEntryPoint: 'equipment_review',
				}).unwrap();
				desiredSupplyIds.add(createdSupply.id);
				setPendingSupplies((current) =>
					current.filter((item) => item.clientId !== clientId),
				);
				setSelectedSupplyIds((current) =>
					Array.from(new Set([...current, createdSupply.id])),
				);
			}

			const originalSupplyIds = getEndpointSupplyIds(
				propertyKnowledgeLinks,
				'equipment',
				savedDeviceId,
			);
			const supplyLinkUpdates = buildEquipmentSupplyLinkUpdates({
				links: propertyKnowledgeLinks,
				equipmentId: savedDeviceId,
				originalSupplyIds,
				desiredSupplyIds: Array.from(desiredSupplyIds),
			});
			for (const update of supplyLinkUpdates) {
				await setSupplyLinks({
					propertyId: property.id,
					...update,
				}).unwrap();
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
				await uploadPropertyDocuments({
					property,
					propertyId: property.id,
					batches: propertyDocumentUploads.map(({ file, category }) => ({
						files: [file],
						category,
						systems: devices as Device[],
						uploadContext: {
							assetIds: savedDeviceId ? [savedDeviceId] : [],
						},
					})),
				});
				setPendingUploadFiles([]);
				setPendingPropertyDocumentFiles([]);
				setPendingPropertyDocumentCategory('other');
			}

			if (!editingDevice && attachToEquipmentId && savedDeviceId) {
				const currentAttachedIds = getAttachedEquipmentIds(
					propertyKnowledgeLinks,
					attachToEquipmentId,
				);
				await setAttachedEquipment({
					propertyId: property.id,
					primaryEquipmentId: attachToEquipmentId,
					attachedEquipmentIds: Array.from(
						new Set([...currentAttachedIds, savedDeviceId]),
					),
				}).unwrap();
				const primaryEquipment = devices.find(
					(candidate) => String(candidate.id) === attachToEquipmentId,
				);
				if (primaryEquipment) {
					handleCloseModal();
					navigate(getDeviceDetailPath(primaryEquipment));
					return;
				}
			}

			handleCloseModal();
		} catch (error) {
			console.error('Error saving equipment:', error);
			feedback.notify(
				'Maintley could not finish the Equipment review. Anything already saved remains available, and you can retry without recreating reviewed Supplies.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDevice = (deviceId: string) => {
		if (!canManageAppliances) {
			feedback.notify('Your role can view equipment but cannot delete it.');
			return;
		}
		if (getAttachedEquipmentIds(propertyKnowledgeLinks, deviceId).length > 0) {
			feedback.notify(
				'Remove the connected Equipment from this record before deleting it.',
			);
			return;
		}
		const device = devices.find((item: any) => String(item.id) === String(deviceId));
		const equipmentName = [
			device?.brand,
			device
				? getDeviceAssetVariant(device) || getDeviceAssetType(device) || device.type
				: '',
		]
			.filter(Boolean)
			.join(' ')
			.trim() || 'this equipment record';
		setDeleteDialogMessage(
			`Are you sure you want to delete "${equipmentName}"? This cannot be undone.`,
		);
		setPendingDeleteDeviceId(deviceId);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteDevice = async () => {
		if (!pendingDeleteDeviceId) return;
		try {
			await deleteDevice(pendingDeleteDeviceId);
			setSelectedDevice(null);
		} catch (error) {
			console.error('Error deleting equipment:', error);
			feedback.notify('Failed to delete equipment. Please try again.');
		}
		setDeleteDialogOpen(false);
		setPendingDeleteDeviceId(null);
	};

	if (isLoading) {
		return (
			<LoadingState
				loadingKey='property-appliances'
				title='Loading equipment'
				message={`Preparing the equipment list for ${equipmentLanguage.contextNoun}.`}
				steps={[
					'Reading equipment information...',
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
			<SectionHeader>Equipment</SectionHeader>
			<SectionLead>
				Keep equipment details, related tasks, and service history together for {equipmentLanguage.contextNoun}.
			</SectionLead>
			<TabSummaryBar>
				<TabSummaryPill>Total: {topLevelDevices.length}</TabSummaryPill>
				<TabSummaryPill>
					Active: {topLevelDevices.filter((d) => getResolvedDeviceStatus(d) === 'Active').length}
				</TabSummaryPill>
				<TabSummaryPill>
					Open Equipment Tasks: {linkedOpenTaskCount}
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
							{remainingDeviceSlots <= 0 ? 'Equipment Limit Reached' : 'Add Equipment'}
						</ToolbarButton>
					</Toolbar>
				</DesktopCreateAction>
			)}

			<CompactFilterResultCount>
				Showing {filteredDevices.length} of {visibleDeviceCount} equipment records for{' '}
				{property.title || equipmentLanguage.contextNoun}
			</CompactFilterResultCount>
			<PropertyTabFilterPanel
				propertyName={property.title || equipmentLanguage.contextNoun}
				resourceName='equipment records'
				searchPlaceholder='Search equipment, brands, or models...'
				filters={filters}
				onFiltersChange={setFilters}
				filterConfigs={deviceFilters}
				sortValue={sortBy}
				defaultSortValue='type'
				sortOptions={[
					{ value: 'type', label: 'Equipment type' },
					{ value: 'status', label: 'Equipment status' },
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
						placeholder='Search equipment, brands, or models...'
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
						<option value=''>All record states</option>
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
						<option value='type'>Sort: Equipment type</option>
						<option value='status'>Sort: Equipment status</option>
						<option value='brand'>Sort: Brand</option>
					</select>
				</div>
			</DesktopFilterArea>

			{isMobile && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 4 }}>
					{filteredDevices.map((device) => {
						const { linkedOpenTasks, overdueLinkedTasks, recurringLinkedTasks } = getDeviceAttentionState(device);
						const resolvedStatus = getResolvedDeviceStatus(device);
						const stateTone = resolvedStatus === 'Decommissioned' ? '#64748b' : COLORS.success;
						const expectsIdentityDetails = expectsEquipmentIdentityDetails(device);
						const detailsMissing = expectsIdentityDetails && !hasApplianceDetails(device);
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
												{getDeviceAssetType(device) || device.type || 'Equipment'}
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
											{resolvedStatus}
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
											{expectsIdentityDetails ? getLastServicedDate(device) : 'Inspection record'}
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

			{topLevelDevices.length === 0 ? (
				<AppZeroState
					kind='noAppliances'
					actions={
						canManageAppliances
							? [
								{
									label:
										remainingDeviceSlots <= 0
											? 'Equipment Limit Reached'
											: 'Add Equipment',
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
						actions={deviceActions}
						showCheckbox={false}
						hideHeader={true}
						emptyMessage='No equipment records have been added yet. Add your first equipment record to start maintenance history.'
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
					selectedSpaceIds={deviceFormData.spaceIds}
					onSelectedSpaceIdsChange={(spaceIds) =>
						handleFormChange('spaceIds', spaceIds)
					}
					canManageSpaces={canManageSpaces}
					propertySupplies={propertySupplies}
					selectedSupplyIds={selectedSupplyIds}
					onSelectedSupplyIdsChange={setSelectedSupplyIds}
					pendingSupplies={pendingSupplies}
					onPendingSuppliesChange={setPendingSupplies}
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
