import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faScrewdriverWrench,
	faClock,
	faCircleCheck,
	faTriangleExclamation,
	faEye,
	faPen,
	faTrash,
	faHome,
	faLocationDot,
	faUsers,
	faMicrochip,
	faFan,
	faSnowflake,
	faClipboardCheck,
	faHouse,
	faPlug,
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
import { LoadingState } from '../../Components/LoadingState';
import { MaintenanceRequestModal } from '../../Components/MaintenanceRequestModal';
import {
	useCreateDeviceMutation,
	useDeleteDeviceMutation,
	useGetUnitDevicesQuery,
	useUpdateDeviceMutation,
} from '../../Redux/API/deviceSlice';
import {
	useAddMaintenanceHistoryMutation,
	useDeleteMaintenanceHistoryMutation,
	useUpdateMaintenanceHistoryMutation,
} from '../../Redux/API/maintenanceSlice';
import { useDeleteTaskMutation } from '../../Redux/API/taskSlice';
import { getTaskAssigneeDisplayName } from '../../utils/taskUtils';
import { useRemoveTenantMutation } from '../../Redux/API/tenantSlice';
import { getDeviceName } from '../../utils/detailPageUtils';
import { TabConfig } from '../../types/DetailPage.types';
import { addMaintenanceRequest } from '../../Redux/Slices/maintenanceRequestsSlice';
import {
	deleteMaintenanceRequest,
	updateMaintenanceRequest,
} from '../../Redux/Slices/maintenanceRequestsSlice';
import { createMaintenanceRequestUtil } from '../PropertyDetailPage/PropertyDetailPage.utils';
import { MaintenanceRequest } from '../../types/MaintenanceRequest.types';
import { uploadMaintenanceRequestFiles } from '../../utils/maintenanceRequestUpload';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import { buildDeviceSlug } from '../../utils/deviceSlug';
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
import { resolveUnitOccupants } from '../../utils/unitOccupants';

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

const SectionLead = styled.p`
	margin: -4px 0 14px;
	color: #475569;
	font-size: 0.92rem;
	line-height: 1.5;
	max-width: 760px;
`;

const SummaryBar = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 12px;
`;

const SummaryPill = styled.div`
	height: 30px;
	display: inline-flex;
	align-items: center;
	padding: 0 10px;
	border-radius: 999px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	font-size: 0.75rem;
	font-weight: 700;
	color: #334155;
	white-space: nowrap;
`;

const PrimaryActionButton = styled.button`
	background-color: #16a34a;
	color: #fff;
	border: none;
	padding: 12px 20px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.01em;
	cursor: pointer;
	min-height: 40px;
	box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2), 0 10px 24px rgba(22, 163, 74, 0.22);
	transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		background-color: #15803d;
		box-shadow: 0 6px 10px rgba(21, 128, 61, 0.25), 0 14px 30px rgba(21, 128, 61, 0.28);
		transform: translateY(-2px);
	}
`;

const OccupantsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const OccupantCard = styled.div`
	border: 1px solid #dbe3ec;
	border-radius: 14px;
	background: #fff;
	padding: 14px 16px;
	display: grid;
	grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.9fr) auto;
	gap: 18px;
	align-items: center;

	@media (max-width: 980px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

const OccupantName = styled.div`
	font-size: 1.05rem;
	font-weight: 800;
	color: #0f172a;
`;

const OccupantMeta = styled.div`
	font-size: 0.86rem;
	font-weight: 600;
	color: #64748b;
	margin-top: 4px;
`;

const OccupantInfoStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;

	strong {
		font-size: 0.9rem;
		color: #0f172a;
	}

	span {
		font-size: 0.82rem;
		color: #64748b;
	}
`;

const OccupantActionRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	justify-self: end;

	@media (max-width: 980px) {
		justify-self: start;
	}
`;

const OccupantActionButton = styled.button<{ $danger?: boolean }>`
	border: 1px solid ${({ $danger }) => ($danger ? '#fecaca' : '#dbe3ec')};
	background: ${({ $danger }) => ($danger ? '#fef2f2' : '#f8fafc')};
	color: ${({ $danger }) => ($danger ? '#dc2626' : '#0f172a')};
	border-radius: 999px;
	padding: 8px 12px;
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
`;

const DeviceSystemsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const DeviceSystemRow = styled.div`
	border: 1px solid #dbe3ec;
	border-radius: 14px;
	background: #fff;
	padding: 16px;
	display: grid;
	grid-template-columns: minmax(260px, 1.2fr) minmax(180px, 0.7fr) minmax(220px, 0.9fr) minmax(180px, 0.6fr) auto;
	gap: 16px;
	align-items: center;

	@media (max-width: 1200px) {
		grid-template-columns: minmax(240px, 1fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr) auto;
	}

	@media (max-width: 980px) {
		grid-template-columns: 1fr;
		gap: 12px;
	}
`;

const DeviceProfile = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const DeviceTitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const DeviceIcon = styled.span<{ $color: string; $bg: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 8px;
	color: ${({ $color }) => $color};
	background: ${({ $bg }) => $bg};
	flex-shrink: 0;
`;

const DeviceTitle = styled.div`
	font-size: 1.05rem;
	font-weight: 800;
	color: #0f172a;
	line-height: 1.3;
`;

const DeviceSubTitle = styled.div`
	font-size: 0.9rem;
	font-weight: 700;
	color: #334155;
`;

const DeviceMetaLine = styled.div`
	font-size: 0.82rem;
	color: #64748b;
`;

const DeviceStatusCol = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const HealthChip = styled.span<{ $attention?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 10px;
	border-radius: 999px;
	border: 1px solid ${({ $attention }) => ($attention ? '#fcd34d' : '#86efac')};
	background: ${({ $attention }) => ($attention ? '#fffbeb' : '#f0fdf4')};
	color: ${({ $attention }) => ($attention ? '#92400e' : '#166534')};
	font-size: 0.78rem;
	font-weight: 800;
	width: fit-content;
`;

const DeviceStatePill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 0.8rem;
	font-weight: 700;
	width: fit-content;
	background: ${({ $status }) => {
		switch ($status) {
			case 'Active':
				return 'rgba(34, 197, 94, 0.1)';
			case 'Maintenance':
				return 'rgba(245, 158, 11, 0.1)';
			case 'Broken':
				return 'rgba(239, 68, 68, 0.1)';
			default:
				return 'rgba(107, 114, 128, 0.12)';
		}
	}};
	color: ${({ $status }) => {
		switch ($status) {
			case 'Active':
				return '#22c55e';
			case 'Maintenance':
				return '#f59e0b';
			case 'Broken':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
`;

const DeviceActivityCol = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;

	strong {
		font-size: 0.95rem;
		font-weight: 800;
		color: #0f172a;
	}

	span {
		font-size: 0.82rem;
		color: #64748b;
	}
`;

const DeviceDocsCol = styled.div`
	font-size: 0.95rem;
	font-weight: 700;
	color: #94a3b8;
`;

const DeviceActionsCol = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px;
	border: 1px solid #dbe3ec;
	border-radius: 999px;
	background: #f8fafc;
	justify-self: end;

	@media (max-width: 980px) {
		justify-self: start;
	}
`;

const ViewAction = styled.button`
	border: 1px solid #a7f3d0;
	background: #ecfdf5;
	color: #0f766e;
	padding: 7px 12px;
	font-size: 0.82rem;
	font-weight: 700;
	border-radius: 999px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
`;

const IconAction = styled.button<{ $danger?: boolean }>`
	border: none;
	background: transparent;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	cursor: pointer;
	color: ${({ $danger }) => ($danger ? '#ef4444' : '#64748b')};
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;

export const UnitDetailPage: React.FC = () => {
	const feedback = useAppFeedback();
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
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		React.useState(false);
	const [showEditTenantModal, setShowEditTenantModal] = React.useState(false);
	const [editingTenant, setEditingTenant] = React.useState<any | null>(null);
	const [editingTask, setEditingTask] = React.useState<any | null>(null);
	const [taskModalMode, setTaskModalMode] = React.useState<'create' | 'edit'>('create');

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
	const [updateDevice] = useUpdateDeviceMutation();
	const [deleteDevice] = useDeleteDeviceMutation();
	const [removeTenant] = useRemoveTenantMutation();
	const [deleteTask] = useDeleteTaskMutation();
	const [addMaintenanceHistory] = useAddMaintenanceHistoryMutation();
	const [deleteMaintenanceHistory] = useDeleteMaintenanceHistoryMutation();
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

	const unitOccupants = React.useMemo(() => {
		if (!unit) return [];
		const propertyTenants = Array.isArray((property as any)?.tenants)
			? ((property as any).tenants as any[])
			: [];
		return resolveUnitOccupants({ unit, propertyTenants });
	}, [property, unit]);

	const occupantsWithEmailCount = React.useMemo(
		() => unitOccupants.filter((occupant: any) => Boolean(occupant?.email)).length,
		[unitOccupants],
	);

	const occupantsWithPhoneCount = React.useMemo(
		() => unitOccupants.filter((occupant: any) => Boolean(occupant?.phone)).length,
		[unitOccupants],
	);

	const occupantsWithLeaseCount = React.useMemo(
		() =>
			unitOccupants.filter(
				(occupant: any) => Boolean(occupant?.leaseStart) || Boolean(occupant?.leaseEnd),
			).length,
		[unitOccupants],
	);

	const tabsConfig: TabConfig[] = [
		{ id: 'info', label: 'Unit Info' },
		{ id: 'occupants', label: `Occupants (${unitOccupants.length})` },
		{ id: 'devices', label: `Equipment (${unitDevices.length})` },
		{ id: 'tasks', label: `Tasks (${unitTasks.length})` },
		{ id: 'history', label: `Maintenance History (${unitMaintenanceHistory.length})` },
		{ id: 'requests', label: `Requests (${unitRequests.length})` },
	];

	const openUnitTasks = React.useMemo(
		() => unitTasks.filter((task: any) => task.status !== 'Completed'),
		[unitTasks],
	);

	const linkedOpenTaskCountByDevice = React.useMemo(() => {
		const counts = new Map<string, number>();

		openUnitTasks.forEach((task: any) => {
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
	}, [openUnitTasks]);

	const linkedOpenTaskCount = React.useMemo(
		() =>
			Array.from(linkedOpenTaskCountByDevice.values()).reduce(
				(total, count) => total + count,
				0,
			),
		[linkedOpenTaskCountByDevice],
	);

	const needsAttentionDeviceCount = React.useMemo(
		() =>
			unitDevices.filter((device: any) => {
				const status = device.status || 'Active';
				const linkedOpenTasks = linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
				return status === 'Broken' || status === 'Maintenance' || linkedOpenTasks > 0;
			}).length,
		[unitDevices, linkedOpenTaskCountByDevice],
	);

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

		const weeks = Math.floor(absDays / 7);
		if (weeks < 5) {
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
		if (!property?.slug) return '#';
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

	const handleEditOccupant = (occupant: any) => {
		const tenants = Array.isArray((property as any)?.tenants)
			? ((property as any).tenants as any[])
			: [];
		const matchingTenant = tenants.find((t) => t.id === occupant.id);
		if (!matchingTenant) {
			feedback.notify('Could not locate full tenant profile for editing.');
			return;
		}
		setEditingTenant(matchingTenant);
		setShowEditTenantModal(true);
	};

	const handleDeleteOccupant = async (occupant: any) => {
		if (!property?.id || !occupant?.id) return;
		if (!window.confirm(`Delete occupant ${occupant.firstName || ''} ${occupant.lastName || ''}?`)) {
			return;
		}
		try {
			await removeTenant({ propertyId: property.id, tenantId: occupant.id }).unwrap();
			feedback.notify('Occupant deleted');
		} catch (error) {
			console.error('Failed to delete occupant:', error);
			feedback.notify('Failed to delete occupant');
		}
	};

	const handleCreateDeviceQuick = async () => {
		if (!property?.id || !unit?.id) return;
		const type = window.prompt('Equipment type (required):', 'HVAC') || '';
		if (!type.trim()) return;
		const brand = window.prompt('Brand (required):', 'Unknown') || '';
		if (!brand.trim()) return;
		const model = window.prompt('Model (required):', 'N/A') || '';
		if (!model.trim()) return;

		try {
			await createDevice({
				type,
				brand,
				model,
				installationDate: new Date().toISOString().split('T')[0],
				status: 'Active',
				location: { propertyId: property.id, unitId: unit.id },
			} as any).unwrap();
			feedback.notify('Equipment created');
		} catch (error) {
			console.error('Failed to create equipment:', error);
			feedback.notify('Failed to create equipment');
		}
	};

	const handleEditDeviceQuick = async (device: any) => {
		const nextStatus = window.prompt(
			'Update equipment status (Active, Maintenance, Broken, Decommissioned):',
			device.status || 'Active',
		);
		if (!nextStatus) return;
		try {
			await updateDevice({ id: device.id, updates: { status: nextStatus as any } }).unwrap();
			feedback.notify('Equipment updated');
		} catch (error) {
			console.error('Failed to update equipment:', error);
			feedback.notify('Failed to update equipment');
		}
	};

	const handleDeleteDeviceQuick = async (device: any) => {
		if (!device?.id) return;
		if (!window.confirm(`Delete equipment "${[device.brand, device.type, device.model].filter(Boolean).join(' ') || 'record'}"?`)) {
			return;
		}
		try {
			await deleteDevice(device.id).unwrap();
			feedback.notify('Equipment deleted');
		} catch (error) {
			console.error('Failed to delete equipment:', error);
			feedback.notify('Failed to delete equipment');
		}
	};

	const handleCreateTaskFromUnit = () => {
		setTaskModalMode('create');
		setEditingTask(null);
		setShowCreateTaskModal(true);
	};

	const handleEditTaskFromUnit = (task: any) => {
		setTaskModalMode('edit');
		setEditingTask(task);
		setShowCreateTaskModal(true);
	};

	const handleDeleteTaskFromUnit = async (task: any) => {
		if (!task?.id) return;
		if (!window.confirm(`Delete task "${task.title || 'Untitled'}"?`)) {
			return;
		}
		try {
			await deleteTask(task.id).unwrap();
			feedback.notify('Task deleted');
		} catch (error) {
			console.error('Failed to delete task:', error);
			feedback.notify('Failed to delete task');
		}
	};

	const handleCreateMaintenanceHistoryQuick = async () => {
		if (!property?.id || !unit?.id) return;
		const title = window.prompt('Maintenance title (required):', 'Maintenance performed') || '';
		if (!title.trim()) return;
		const completionDate = window.prompt('Completion date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]) || '';
		if (!completionDate.trim()) return;
		try {
			await addMaintenanceHistory({
				propertyId: property.id,
				propertyTitle: property.title,
				title,
				completionDate,
				unitId: unit.id,
				completionNotes: '',
			}).unwrap();
			feedback.notify('Maintenance history added');
		} catch (error) {
			console.error('Failed to add maintenance history:', error);
			feedback.notify('Failed to add maintenance history');
		}
	};

	const handleEditMaintenanceHistoryQuick = async (record: any) => {
		const title = window.prompt('Update title:', record.title || record.taskTitle || 'Maintenance') || '';
		if (!title.trim()) return;
		try {
			await updateMaintenanceHistory({
				id: record.id,
				updates: { title },
			}).unwrap();
			feedback.notify('Maintenance history updated');
		} catch (error) {
			console.error('Failed to update maintenance history:', error);
			feedback.notify('Failed to update maintenance history');
		}
	};

	const handleDeleteMaintenanceHistoryQuick = async (record: any) => {
		if (!record?.id) return;
		if (!window.confirm('Remove this record from maintenance history? The correction will remain in the audit trail.')) {
			return;
		}
		const correctionReason = window.prompt(
			'Why is this maintenance record being removed?',
			'Duplicate or incorrect record',
		)?.trim();
		if (!correctionReason) return;
		try {
			await deleteMaintenanceHistory({ id: record.id, correctionReason }).unwrap();
			feedback.notify('Maintenance history deleted');
		} catch (error) {
			console.error('Failed to delete maintenance history:', error);
			feedback.notify('Failed to delete maintenance history');
		}
	};

	const handleEditRequestQuick = (request: any) => {
		const nextTitle = window.prompt('Update request title:', request.title || '') || '';
		if (!nextTitle.trim()) return;
		dispatch(updateMaintenanceRequest({ ...request, title: nextTitle }));
		feedback.notify('Request updated');
	};

	const handleDeleteRequestQuick = (request: any) => {
		if (!request?.id) return;
		if (!window.confirm('Delete this maintenance request?')) {
			return;
		}
		dispatch(deleteMaintenanceRequest(request.id));
		feedback.notify('Request deleted');
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
											<DetailValue>{unitOccupants.length}</DetailValue>
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
											<StatLabel>Equipment</StatLabel>
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
											<StatValue>{unitOccupants.length}</StatValue>
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
												<strong>Create Task</strong>
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
							<SectionLead>
								Track each resident as part of this unit&apos;s operating profile, including
								lease context and direct contact details.
							</SectionLead>
							<SummaryBar>
								<SummaryPill>Total: {unitOccupants.length}</SummaryPill>
								<SummaryPill>With Email: {occupantsWithEmailCount}</SummaryPill>
								<SummaryPill>With Phone: {occupantsWithPhoneCount}</SummaryPill>
								<SummaryPill>Lease Details: {occupantsWithLeaseCount}</SummaryPill>
							</SummaryBar>
							<Toolbar>
								<PrimaryActionButton onClick={() => setShowAddTenantModal(true)}>
									<FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
									Add Occupant
								</PrimaryActionButton>
							</Toolbar>
							{unitOccupants.length > 0 ? (
								<OccupantsList>
									{unitOccupants.map((occupant: any, idx: number) => (
										<OccupantCard
											key={
												occupant.id ||
												`${occupant.email || 'occupant'}-${occupant.firstName || ''}-${occupant.lastName || ''}-${idx}`
											}>
											<div>
												<OccupantName>
													{[occupant.firstName, occupant.lastName].filter(Boolean).join(' ') || 'Unnamed Occupant'}
												</OccupantName>
												<OccupantMeta>
													{occupant.email || 'No email on file'}
												</OccupantMeta>
											</div>
											<OccupantInfoStack>
												<strong>Phone</strong>
												<span>{occupant.phone || 'Not provided'}</span>
											</OccupantInfoStack>
											<OccupantInfoStack>
												<strong>Lease Window</strong>
												<span>
													{occupant.leaseStart || 'N/A'} - {occupant.leaseEnd || 'N/A'}
												</span>
											</OccupantInfoStack>
											<OccupantActionRow>
												<OccupantActionButton type='button' onClick={() => handleEditOccupant(occupant)}>
													<FontAwesomeIcon icon={faPen} /> Edit
												</OccupantActionButton>
												<OccupantActionButton $danger type='button' onClick={() => handleDeleteOccupant(occupant)}>
													<FontAwesomeIcon icon={faTrash} /> Delete
												</OccupantActionButton>
											</OccupantActionRow>
										</OccupantCard>
									))}
								</OccupantsList>
							) : (
								<EmptyState>
									<p>No occupants assigned to this unit</p>
								</EmptyState>
							)}
						</SectionContainer>
					</div>
				)}

				{/* Equipment Tab */}
				{activeTab === 'devices' && (
					<div>
						<SectionContainer>
							<SectionHeader>Home Systems</SectionHeader>
							<SectionLead>
								Track each system as the operational memory of this property, including task context and service lifecycle history.
							</SectionLead>
							<SummaryBar>
								<SummaryPill>Total: {unitDevices.length}</SummaryPill>
								<SummaryPill>
									Active: {unitDevices.filter((d: any) => (d.status || 'Active') === 'Active').length}
								</SummaryPill>
								<SummaryPill>Needs Attention: {needsAttentionDeviceCount}</SummaryPill>
								<SummaryPill>Open Equipment Tasks: {linkedOpenTaskCount}</SummaryPill>
							</SummaryBar>
							<Toolbar>
								<PrimaryActionButton onClick={handleCreateDeviceQuick}>
									<FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
									Add Equipment
								</PrimaryActionButton>
							</Toolbar>
							{devicesLoading ? (
								<LoadingState
									loadingKey='unit-appliances'
									title='Loading equipment'
									message='Preparing this unit equipment list.'
									steps={[
										'Reading equipment information...',
										'Checking upcoming maintenance...',
										'Connecting maintenance history...',
										'Almost ready...',
									]}
								/>
							) : unitDevices.length > 0 ? (
								<DeviceSystemsList>
									{unitDevices.map((device: any, idx: number) => {
										const status = device.status || 'Active';
										const linkedOpenTasks = linkedOpenTaskCountByDevice.get(String(device.id)) || 0;
										const needsAttention =
											status === 'Broken' || status === 'Maintenance' || linkedOpenTasks > 0;
										const iconStyle = getDeviceOperationalIcon(device);

										return (
											<DeviceSystemRow key={device.id || `device-${idx}`}>
												<DeviceProfile>
													<DeviceTitleRow>
														<DeviceIcon $color={iconStyle.color} $bg={iconStyle.background}>
															<FontAwesomeIcon icon={iconStyle.icon} />
														</DeviceIcon>
														<DeviceTitle>
															{getDeviceName(device.id, { devices: unitDevices }) || device.type || 'Equipment'}
														</DeviceTitle>
													</DeviceTitleRow>
													<DeviceSubTitle>
														{[device.brand, device.model].filter(Boolean).join(' ') || 'No model details yet'}
													</DeviceSubTitle>
													<DeviceMetaLine>
														Location: {typeof device.location === 'string' ? device.location : unit?.name || 'Unit'}
													</DeviceMetaLine>
													<DeviceMetaLine>
														Installed {formatRelativeTime(device.installationDate)}
													</DeviceMetaLine>
													<div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
														<button
															type='button'
															onClick={() => navigate(getDeviceDetailPath(device))}
															style={{
																background: 'transparent',
																border: 'none',
																padding: 0,
																margin: 0,
																cursor: 'pointer',
																color: '#1d4ed8',
																fontWeight: 700,
																fontSize: '0.82rem',
															}}>
															View history
														</button>
														<span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
															Lifecycle timeline and service records
														</span>
													</div>
												</DeviceProfile>

												<DeviceStatusCol>
													<HealthChip $attention={needsAttention}>
														<FontAwesomeIcon icon={needsAttention ? faTriangleExclamation : faCircleCheck} />
														{needsAttention ? 'Needs Attention' : 'Healthy'}
													</HealthChip>
													<DeviceStatePill $status={status}>{status}</DeviceStatePill>
												</DeviceStatusCol>

												<DeviceActivityCol>
													<strong>
														{linkedOpenTasks > 0
															? `${linkedOpenTasks} active continuity task${linkedOpenTasks === 1 ? '' : 's'}`
															: 'No active continuity tasks'}
													</strong>
													<span>
														Last lifecycle update: {formatRelativeTime(device.installationDate)}
													</span>
												</DeviceActivityCol>

												<DeviceDocsCol>
													{Array.isArray(device.files) && device.files.length > 0
														? `${device.files.length} document${device.files.length === 1 ? '' : 's'} stored`
														: 'No documents yet'}
												</DeviceDocsCol>

												<DeviceActionsCol>
													<ViewAction
														type='button'
														onClick={() => navigate(getDeviceDetailPath(device))}>
														View <FontAwesomeIcon icon={faEye} />
													</ViewAction>
													<IconAction type='button' onClick={() => handleEditDeviceQuick(device)}>
														<FontAwesomeIcon icon={faPen} />
													</IconAction>
													<IconAction $danger type='button' onClick={() => handleDeleteDeviceQuick(device)}>
														<FontAwesomeIcon icon={faTrash} />
													</IconAction>
												</DeviceActionsCol>
											</DeviceSystemRow>
										);
									})}
								</DeviceSystemsList>
							) : (
								<EmptyState>
									<p>No equipment has been recorded yet. Add your first equipment record to start maintenance history.</p>
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
								<PrimaryButton onClick={handleCreateTaskFromUnit}>
									Add Task
								</PrimaryButton>
							</Toolbar>
							<HeaderlessFeedSurface>
								<ReusableTable
									rowData={unitTasks.map((task) => ({
										...task,
										assignedToNames: getTaskAssigneeDisplayName(task, ''),
										propertyTitle: property?.title || '',
									}))}
									columns={[
									{
										header: 'Task Summary',
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
															: 'Continuity task active'}
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
									actions={[
										{
											label: 'Edit',
											icon: faPen,
											onClick: (task: any) => handleEditTaskFromUnit(task),
										},
										{
											label: 'Delete',
											icon: faTrash,
											onClick: (task: any) => handleDeleteTaskFromUnit(task),
											className: 'delete',
										},
									]}
									showCheckbox={false}
									hideHeader={true}
									emptyMessage='No unit tasks yet. Add one to keep unit continuity active.'
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
							<Toolbar>
								<PrimaryButton onClick={handleCreateMaintenanceHistoryQuick}>
									Add History
								</PrimaryButton>
							</Toolbar>
							{unitMaintenanceHistory.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Date</th>
												<th>Description</th>
												<th>Equipment</th>
												<th>Cost</th>
												<th>Actions</th>
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
													<td>
														<div style={{ display: 'flex', gap: 8 }}>
															<button type='button' onClick={() => handleEditMaintenanceHistoryQuick(record)}>Edit</button>
															<button type='button' onClick={() => handleDeleteMaintenanceHistoryQuick(record)}>Delete</button>
														</div>
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
												<th>Actions</th>
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
													<td>
														<div style={{ display: 'flex', gap: 8 }}>
															<button type='button' onClick={() => handleEditRequestQuick(req)}>Edit</button>
															<button type='button' onClick={() => handleDeleteRequestQuick(req)}>Delete</button>
														</div>
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
					defaultUnit={unit?.name}
				/>
			)}

			{showEditTenantModal && editingTenant && (
				<AddTenantModal
					open={showEditTenantModal}
					onClose={() => {
						setShowEditTenantModal(false);
						setEditingTenant(null);
					}}
					propertyId={property?.id || ''}
					mode='edit'
					tenant={editingTenant}
					defaultUnit={unit?.name}
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
					isEditing={taskModalMode === 'edit'}
					editingTask={editingTask}
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
