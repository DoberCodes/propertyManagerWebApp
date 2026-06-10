import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCircleCheck,
	faClipboardCheck,
	faClock,
	faCommentDots,
	faFileInvoiceDollar,
	faFileLines,
	faRepeat,
	faScrewdriverWrench,
	faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useGetAllDevicesQuery } from '../../Redux/API/deviceSlice';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetAllMaintenanceHistoryForUserQuery } from '../../Redux/API/userSlice';
import { buildDeviceSlug } from '../../utils/deviceSlug';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from '../../utils/maintenanceEventUtils';
import { Device } from '../../types/Property.types';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const SurfaceCard = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 14px;
	background: #ffffff;
	padding: 14px;
`;

const DevicePrimary = styled.div`
	font-size: 1.05rem;
	font-weight: 800;
	color: #0f172a;
	line-height: 1.22;
`;

const IdentityTopRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
`;

const OpenProfileCue = styled.span`
	flex-shrink: 0;
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	color: #94a3b8;
	transition: color 0.18s ease, transform 0.18s ease;
`;

const TechnicalSubtitle = styled.div`
	margin-top: 4px;
	font-size: 0.88rem;
	font-weight: 700;
	color: #334155;
	line-height: 1.35;
`;

const ContextLinks = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 8px;
	flex-wrap: wrap;
`;

const ContextLink = styled(Link)`
	font-size: 0.8rem;
	font-weight: 600;
	color: #2563eb;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
`;

const ContextArrow = styled.span`
	font-size: 0.78rem;
	color: #94a3b8;
`;

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 5px 10px;
	border-radius: 999px;
	font-size: 0.74rem;
	font-weight: 800;
	letter-spacing: 0.02em;
	border: 1px solid
		${(p) =>
			p.$status === 'Broken'
				? '#fecaca'
				: p.$status === 'Maintenance'
					? '#fcd34d'
					: '#86efac'};
	background: ${(p) =>
		p.$status === 'Broken'
			? '#fef2f2'
			: p.$status === 'Maintenance'
				? '#fffbeb'
				: '#f0fdf4'};
	color: ${(p) =>
		p.$status === 'Broken'
			? '#b91c1c'
			: p.$status === 'Maintenance'
				? '#92400e'
				: '#166534'};
`;

const HubFeedGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.9fr);
	gap: 12px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`;

const FeedSectionTitle = styled.h2`
	margin: 0 0 4px;
	font-size: 1rem;
	font-weight: 800;
	color: #0f172a;
`;

const FeedSectionText = styled.p`
	margin: 0 0 12px;
	font-size: 0.86rem;
	line-height: 1.5;
	color: #64748b;
`;

const ActivityList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const ActivityItem = styled.div`
	padding: 12px 14px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
`;

const ActivityHeaderRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 3px;
`;

const ActivityIconBadge = styled.span<{ $color: string; $background: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border-radius: 7px;
	color: ${(props) => props.$color};
	background: ${(props) => props.$background};
	font-size: 0.72rem;
	flex-shrink: 0;
`;

const ActivityMeta = styled.div`
	font-size: 0.74rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #16a34a;
	margin-bottom: 4px;
`;

const ActivityTitle = styled.div`
	font-size: 0.92rem;
	font-weight: 800;
	color: #0f172a;
	margin-bottom: 3px;
`;

const ActivityDescription = styled.div`
	font-size: 0.84rem;
	color: #64748b;
	line-height: 1.45;
`;

const ActivityContext = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 6px;
	flex-wrap: wrap;
`;

const ActivityContextLink = styled(Link)`
	font-size: 0.78rem;
	font-weight: 600;
	color: #2563eb;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
`;

const ActivityContextSep = styled.span`
	font-size: 0.72rem;
	color: #94a3b8;
`;

const AttentionPriorityBadge = styled.span<{ $color: string; $background: string; $border: string }>`
	display: inline-flex;
	align-items: center;
	padding: 3px 8px;
	border-radius: 999px;
	font-size: 0.7rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: ${(p) => p.$color};
	background: ${(p) => p.$background};
	border: 1px solid ${(p) => p.$border};
`;

const AttentionHeaderRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
`;

const AttentionReason = styled.div`
	font-size: 0.83rem;
	color: #475569;
	line-height: 1.4;
	margin-bottom: 6px;
`;

const AttentionContext = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
`;

const AttentionContextLink = styled(Link)`
	font-size: 0.78rem;
	font-weight: 600;
	color: #2563eb;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
`;

const AttentionContextSep = styled.span`
	font-size: 0.72rem;
	color: #94a3b8;
`;

const FilterBar = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`;

const SearchInput = styled.input`
	flex: 1;
	min-width: 180px;
	max-width: 320px;
	height: 36px;
	padding: 0 12px;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	font-size: 0.88rem;
	font-weight: 500;
	color: #0f172a;
	background: #ffffff;
	outline: none;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;

	&::placeholder {
		color: #94a3b8;
	}

	&:focus {
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
	}
`;

const FilterGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
`;

const FilterButton = styled.button<{ $active: boolean }>`
	height: 34px;
	padding: 0 12px;
	border-radius: 8px;
	border: 1px solid ${(p) => (p.$active ? '#22c55e' : '#e2e8f0')};
	background: ${(p) => (p.$active ? '#f0fdf4' : '#ffffff')};
	color: ${(p) => (p.$active ? '#166534' : '#475569')};
	font-size: 0.82rem;
	font-weight: ${(p) => (p.$active ? 700 : 600)};
	cursor: pointer;
	transition: all 0.15s ease;
	white-space: nowrap;

	&:hover {
		border-color: #22c55e;
		color: #166534;
		background: #f0fdf4;
	}
`;

const PropertySelect = styled.select`
	height: 36px;
	padding: 0 10px;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	font-size: 0.85rem;
	font-weight: 500;
	color: #334155;
	background: #ffffff;
	cursor: pointer;
	outline: none;
	max-width: 200px;
	transition: border-color 0.15s ease;

	&:focus {
		border-color: #22c55e;
	}
`;

const FilterResultCount = styled.span`
	margin-left: auto;
	font-size: 0.8rem;
	font-weight: 600;
	color: #64748b;
	white-space: nowrap;
`;

const Header = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;

	h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 800;
		color: #0f172a;
	}

	p {
		margin: 0;
		font-size: 0.97rem;
		color: #64748b;
	}
`;

const SummaryRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const MetricCard = styled.div`
	border: 1px solid #dbe3ea;
	border-radius: 14px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	padding: 14px 15px;
	box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
`;

const MetricLabel = styled.div`
	font-size: 0.74rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #64748b;
	margin-bottom: 6px;
`;

const MetricValue = styled.div`
	font-size: 1.55rem;
	font-weight: 800;
	color: #0f172a;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const DeviceCard = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1.9fr) minmax(0, 0.8fr) minmax(0, 0.95fr) minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 0.75fr);
	gap: 16px;
	align-items: center;
	border: 1px solid #d7e2ea;
	background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
	border-radius: 16px;
	padding: 18px 18px;
	color: inherit;
	cursor: pointer;
	overflow: hidden;
	transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 10px;
		bottom: 10px;
		width: 4px;
		border-radius: 999px;
		background: linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%);
		transition: background 0.18s ease, opacity 0.18s ease;
		opacity: 0.9;
	}

	> div:not(:first-child) {
		padding-left: 14px;
		border-left: 1px solid #edf2f7;
	}

	&:hover {
		border-color: #22c55e;
		background: linear-gradient(180deg, #ffffff 0%, #f6fff8 100%);
		transform: translateY(-2px);
		box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);

		&::before {
			background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
		}

		${DevicePrimary} {
			text-decoration: underline;
			text-decoration-color: #22c55e;
			text-underline-offset: 3px;
		}

		${OpenProfileCue} {
			color: #16a34a;
			transform: translateX(2px);
		}
	}

	&:active {
		transform: translateY(-1px);
	}

	@media (max-width: 1120px) {
		grid-template-columns: 1fr;
		gap: 8px;
		padding: 16px;

		> div:not(:first-child) {
			padding-left: 0;
			border-left: none;
			padding-top: 8px;
			border-top: 1px solid #edf2f7;
		}
	}
`;

const Field = styled.div`
	min-width: 0;
`;

const Label = styled.div`
	font-size: 0.69rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: #64748b;
	margin-bottom: 5px;
`;

const Value = styled.div`
	font-size: 0.89rem;
	font-weight: 600;
	color: #334155;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const EmptyState = styled.div`
	border: 1px dashed #cbd5e1;
	border-radius: 12px;
	padding: 36px 20px;
	text-align: center;
	color: #64748b;
`;

const toDate = (value?: string): Date | null => {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date;
};

const formatDate = (value?: string): string => {
	const date = toDate(value);
	if (!date) return 'Not recorded';
	return date.toLocaleDateString();
};

const formatRelativeTime = (value?: string): string => {
	const date = toDate(value);
	if (!date) return 'recently';

	const diffMs = Date.now() - date.getTime();
	const diffDays = Math.round(Math.abs(diffMs) / 86400000);

	if (diffDays === 0) return diffMs >= 0 ? 'today' : 'later today';
	if (diffDays === 1) return diffMs >= 0 ? 'yesterday' : 'tomorrow';
	if (diffDays < 7) return diffMs >= 0 ? `${diffDays} days ago` : `in ${diffDays} days`;
	if (diffDays < 30) {
		const weeks = Math.round(diffDays / 7);
		return diffMs >= 0 ? `${weeks} weeks ago` : `in ${weeks} weeks`;
	}
	const months = Math.round(diffDays / 30);
	return diffMs >= 0 ? `${months} months ago` : `in ${months} months`;
};

const isOpenTask = (task: any): boolean => String(task?.status || '') !== 'Completed';

const getLinkedDeviceIds = (task: any): Set<string> => {
	const ids = new Set<string>();
	if (Array.isArray(task?.devices)) {
		task.devices.forEach((id: any) => {
			if (id !== undefined && id !== null) ids.add(String(id));
		});
	}
	if (task?.deviceId !== undefined && task?.deviceId !== null) {
		ids.add(String(task.deviceId));
	}
	return ids;
};

const getLatestMaintenanceEntry = (device: Device): { date?: string; description?: string } | null => {
	const history = Array.isArray(device.maintenanceHistory)
		? [...device.maintenanceHistory]
		: [];
	if (history.length === 0) return null;
	history.sort((a, b) => {
		const left = toDate(a?.date)?.getTime() || 0;
		const right = toDate(b?.date)?.getTime() || 0;
		return right - left;
	});
	return history[0] || null;
};

const buildFriendlyDeviceName = (device: Device): string => {
	const deviceType = device.type?.trim();
	if (deviceType) return deviceType;

	const fallback = [device.brand, device.model]
		.filter((value): value is string => Boolean(value && value.trim()))
		.map((value) => value.trim())
		.join(' ')
		.trim();

	return fallback || 'Appliance';
};

const buildTechnicalSubtitle = (device: Device): string => {
	const pieces = [device.brand, device.model, device.serialNumber]
		.filter((value): value is string => Boolean(value && value.trim()))
		.map((value) => value.trim());
	if (pieces.length === 0) return 'No technical subtitle recorded';
	return pieces.join(' • ');
};

const buildRecentActivity = (entry?: { date?: string; description?: string } | null): string => {
	if (!entry) return 'No maintenance activity recorded yet';
	const rawDescription = String(entry.description || '').trim();
	if (!rawDescription) return `Maintenance event ${formatRelativeTime(entry.date)}`;
	return `${rawDescription} ${formatRelativeTime(entry.date)}`.trim();
};

const buildEventTitle = (entry?: { description?: string } | null): string => {
	const description = String(entry?.description || '').trim();
	if (!description) return 'Maintenance event';
	const prefixes = [
		'Document uploaded:',
		'Service note added:',
		'Repair logged:',
		'Warranty uploaded:',
		'Invoice uploaded:',
		'Recurring maintenance created:',
		'Inspection completed:',
		'Task completed:',
	];
	for (const prefix of prefixes) {
		if (description.toLowerCase().startsWith(prefix.toLowerCase())) {
			return prefix.replace(':', '');
		}
	}
	return description.split(':')[0] || 'Maintenance event';
};

const buildEventDetail = (entry?: { description?: string } | null): string => {
	const description = String(entry?.description || '').trim();
	if (!description) return 'Recorded in the maintenance timeline';
	const colonIndex = description.indexOf(':');
	if (colonIndex === -1) return description;
	return description.slice(colonIndex + 1).trim() || description;
};

type ActivityEventCategory =
	| 'repair'
	| 'invoice'
	| 'inspection'
	| 'recurring'
	| 'completed'
	| 'warranty'
	| 'document'
	| 'note'
	| 'default';

const getActivityEventCategory = (description?: string): ActivityEventCategory => {
	const text = String(description || '').toLowerCase();
	if (text.includes('repair')) return 'repair';
	if (text.includes('invoice')) return 'invoice';
	if (text.includes('inspection')) return 'inspection';
	if (text.includes('recurring')) return 'recurring';
	if (text.includes('warranty')) return 'warranty';
	if (text.includes('document') || text.includes('upload') || text.includes('file')) return 'document';
	if (text.includes('note')) return 'note';
	if (text.includes('complete') || text.includes('approved') || text.includes('done')) return 'completed';
	return 'default';
};

const getActivityEventIcon = (category: ActivityEventCategory) => {
	switch (category) {
		case 'repair':
			return { icon: faScrewdriverWrench, color: '#92400e', background: '#fef3c7' };
		case 'invoice':
			return { icon: faFileInvoiceDollar, color: '#1d4ed8', background: '#dbeafe' };
		case 'inspection':
			return { icon: faClipboardCheck, color: '#0f766e', background: '#ccfbf1' };
		case 'recurring':
			return { icon: faRepeat, color: '#7c3aed', background: '#ede9fe' };
		case 'completed':
			return { icon: faCircleCheck, color: '#166534', background: '#dcfce7' };
		case 'warranty':
			return { icon: faShieldHalved, color: '#1e3a8a', background: '#dbeafe' };
		case 'document':
			return { icon: faFileLines, color: '#334155', background: '#e2e8f0' };
		case 'note':
			return { icon: faCommentDots, color: '#0f766e', background: '#ccfbf1' };
		default:
			return { icon: faClock, color: '#475569', background: '#e2e8f0' };
	}
};

const buildLocationLabel = (device: Device, propertyNameById: Map<string, string>, properties: any[]): string => {
	const propertyName = propertyNameById.get(String(device.location?.propertyId || '')) || 'Property';
	if (device.location?.unitId) {
		const unitLabel = properties
			.flatMap((property: any) => property.units || [])
			.find((unit: any) => String(unit.id) === String(device.location?.unitId));
		return unitLabel?.name || `Unit ${device.location.unitId}`;
	}
	if (device.location?.suiteId) {
		const suiteLabel = properties
			.flatMap((property: any) => property.suites || [])
			.find((suite: any) => String(suite.id) === String(device.location?.suiteId));
		return suiteLabel?.name || `Suite ${device.location.suiteId}`;
	}
	return propertyName;
};

const getUpcomingMaintenanceDate = (linkedOpenTasks: any[]): string | undefined => {
	const candidate = linkedOpenTasks
		.filter((task) => toDate(task?.dueDate))
		.sort((a, b) => {
			const left = toDate(a?.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
			const right = toDate(b?.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
			return left - right;
		})[0];
	return candidate?.dueDate;
};

export const DevicesHubPage: React.FC = () => {
	const navigate = useNavigate();
	const { data: devices = [], isLoading } = useGetAllDevicesQuery();
	const { data: properties = [] } = useGetPropertiesQuery();
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: allMaintenanceHistory = [] } = useGetAllMaintenanceHistoryForUserQuery();

	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Maintenance' | 'Broken'>('All');
	const [propertyFilter, setPropertyFilter] = useState('');

	const propertyNameById = useMemo(() => {
		const map = new Map<string, string>();
		properties.forEach((property: any) => {
			map.set(String(property.id), property.title || 'Untitled Property');
		});
		return map;
	}, [properties]);

	const propertyById = useMemo(() => {
		const map = new Map<string, any>();
		properties.forEach((property: any) => {
			map.set(String(property.id), property);
		});
		return map;
	}, [properties]);

	const openTasks = useMemo(() => allTasks.filter(isOpenTask), [allTasks]);

	const linkedOpenTaskCountByDevice = useMemo(() => {
		const counts = new Map<string, number>();
		openTasks.forEach((task: any) => {
			getLinkedDeviceIds(task).forEach((id) => {
				counts.set(id, (counts.get(id) || 0) + 1);
			});
		});
		return counts;
	}, [openTasks]);

	const linkedTasksByDevice = useMemo(() => {
		const map = new Map<string, any[]>();
		openTasks.forEach((task: any) => {
			getLinkedDeviceIds(task).forEach((id) => {
				if (!map.has(id)) map.set(id, []);
				map.get(id)!.push(task);
			});
		});
		return map;
	}, [openTasks]);

	const continuityEventsByDevice = useMemo(() => {
		const map = new Map<string, any[]>();
		const filteredEvents = allMaintenanceHistory.filter(isContinuityEvent);
		filteredEvents.forEach((event: any) => {
			if (Array.isArray(event.deviceIds)) {
				event.deviceIds.forEach((deviceId: string) => {
					const id = String(deviceId);
					if (!map.has(id)) map.set(id, []);
					map.get(id)!.push(event);
				});
			} else if (event.deviceId) {
				const id = String(event.deviceId);
				if (!map.has(id)) map.set(id, []);
				map.get(id)!.push(event);
			}
		});
		return map;
	}, [allMaintenanceHistory]);

	const deviceRows = useMemo(() => {
		return devices
			.map((device) => {
				const deviceId = String(device.id);
				const linkedOpenTasksForDevice = linkedTasksByDevice.get(deviceId) || [];
				const latestMaintenance = getLatestMaintenanceEntry(device);
				const upcomingMaintenance = getUpcomingMaintenanceDate(
					linkedOpenTasksForDevice,
				);
				const property = propertyById.get(String(device.location?.propertyId || ''));
				const locationLabel = buildLocationLabel(device, propertyNameById, [property]);
				const friendlyName = buildFriendlyDeviceName(device);
				const technicalSubtitle = buildTechnicalSubtitle(device);
				const recentActivity = buildRecentActivity(latestMaintenance);

				return {
					id: device.id,
					friendlyName,
					technicalSubtitle,
					locationLabel,
					propertyId: String(device.location?.propertyId || ''),
					status: device.status || 'Active',
					lastServiced: latestMaintenance?.date,
					latestMaintenanceDescription: latestMaintenance?.description,
					upcomingMaintenance,
					recentActivity,
					openTaskCount: linkedOpenTaskCountByDevice.get(deviceId) || 0,
					device,
				};
			})
			.sort((a, b) => {
				if (b.openTaskCount !== a.openTaskCount) {
					return b.openTaskCount - a.openTaskCount;
				}
				return a.friendlyName.localeCompare(b.friendlyName);
			});
	}, [devices, linkedOpenTaskCountByDevice, linkedTasksByDevice, propertyById, propertyNameById]);

	const filteredDeviceRows = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		return deviceRows.filter((row) => {
			if (statusFilter !== 'All' && row.status !== statusFilter) return false;
			if (propertyFilter && row.propertyId !== propertyFilter) return false;
			if (query) {
				const haystack = [
					row.friendlyName,
					row.technicalSubtitle,
					row.locationLabel,
				].join(' ').toLowerCase();
				if (!haystack.includes(query)) return false;
			}
			return true;
		});
	}, [deviceRows, searchQuery, statusFilter, propertyFilter]);

	const recentActivityFeed = useMemo(() => {
		type FeedEntry = {
			key: string;
			deviceSlug: string;
			friendlyName: string;
			propertyName: string;
			propertySlug: string;
			locationLabel: string;
			locationHref: string;
			description?: string;
			date?: string;
		};

		const entries: FeedEntry[] = [];
		const filteredEvents = allMaintenanceHistory.filter(isContinuityEvent);

		filteredEvents.forEach((event: any, eventIndex: number) => {
			const deviceIds = Array.isArray(event.deviceIds) ? event.deviceIds : (event.deviceId ? [event.deviceId] : []);
			
			deviceIds.forEach((deviceId: any) => {
				const device = devices.find((d) => String(d.id) === String(deviceId));
				if (!device) return;

				const property = propertyById.get(String(device.location?.propertyId || ''));
				const propName = propertyNameById.get(String(device.location?.propertyId || '')) || 'Property';
				const propSlug = property?.slug || '';
				const locLabel = buildLocationLabel(device, propertyNameById, [property]);
				const devFriendlyName = buildFriendlyDeviceName(device);
				const devSlug = buildDeviceSlug(device);
				const locHref = device.location?.suiteId
						? `/property/${propSlug}/suite/${encodeURIComponent(locLabel)}`
						: '';

				entries.push({
					key: `${eventIndex}-${deviceId}`,
					deviceSlug: devSlug,
					friendlyName: devFriendlyName,
					propertyName: propName,
					propertySlug: propSlug,
					locationLabel: locLabel,
					locationHref: locHref,
					description: getMaintenanceEventTitle(event),
					date: getMaintenanceEventDate(event),
				});
			});
		});

		return entries
			.sort((a, b) => {
				const left = toDate(a.date)?.getTime() || 0;
				const right = toDate(b.date)?.getTime() || 0;
				return right - left;
			})
			.slice(0, 10);
	}, [allMaintenanceHistory, devices, propertyById, propertyNameById]);

	const devicesNeedingAttention = useMemo(() => {
		type PriorityTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;
		type AttentionEntry = {
			id: string | number;
			friendlyName: string;
			propertyName: string;
			propertySlug: string;
			locationLabel: string;
			locationHref: string;
			deviceSlug: string;
			priorityTier: PriorityTier;
			priorityLabel: string;
			priorityColor: string;
			priorityBackground: string;
			priorityBorder: string;
			reasonDescription: string;
		};

		const now = new Date();
		const fourteenDays = new Date(now);
		fourteenDays.setDate(now.getDate() + 14);
		const sixMonthsAgo = new Date(now);
		sixMonthsAgo.setMonth(now.getMonth() - 6);

		const entries: AttentionEntry[] = [];

		deviceRows.forEach((row) => {
			const property = propertyById.get(row.propertyId);
			const propSlug = property?.slug || '';
			const propName = propertyNameById.get(row.propertyId) || 'Property';
			const devSlug = buildDeviceSlug(row.device);
			const locHref = row.device.location?.suiteId
					? `/property/${propSlug}/suite/${encodeURIComponent(row.locationLabel)}`
					: '';

			const linkedTasks = linkedTasksByDevice.get(String(row.id)) || [];
			const overdueCount = linkedTasks.filter((t: any) => {
				const due = toDate(t?.dueDate);
				return due !== null && due < now;
			}).length;
			const dueSoon = toDate(row.upcomingMaintenance);
			const lastServiced = toDate(row.lastServiced);
			const continuityEvents = continuityEventsByDevice.get(String(row.id)) || [];
			const hasNoHistory = continuityEvents.length === 0;
			const isStale = lastServiced !== null && lastServiced < sixMonthsAgo;

			let priorityTier: PriorityTier | null = null;
			let priorityLabel = '';
			let priorityColor = '';
			let priorityBackground = '';
			let priorityBorder = '';
			let reasonDescription = '';

			if (row.status === 'Broken') {
				priorityTier = 1;
				priorityLabel = 'Broken';
				priorityColor = '#b91c1c';
				priorityBackground = '#fef2f2';
				priorityBorder = '#fecaca';
				reasonDescription = 'Appliance is marked as broken and may need immediate service.';
			} else if (overdueCount > 0) {
				priorityTier = 2;
				priorityLabel = 'Overdue';
				priorityColor = '#c2410c';
				priorityBackground = '#fff7ed';
				priorityBorder = '#fed7aa';
				reasonDescription = `${overdueCount} task${overdueCount === 1 ? '' : 's'} past due date.`;
			} else if (dueSoon !== null && dueSoon <= fourteenDays) {
				priorityTier = 3;
				priorityLabel = 'Due Soon';
				priorityColor = '#92400e';
				priorityBackground = '#fffbeb';
				priorityBorder = '#fcd34d';
				reasonDescription = `Maintenance due ${formatRelativeTime(row.upcomingMaintenance)}.`;
			} else if (row.openTaskCount > 0) {
				priorityTier = 4;
				priorityLabel = 'Open Work';
				priorityColor = '#1d4ed8';
				priorityBackground = '#eff6ff';
				priorityBorder = '#bfdbfe';
				reasonDescription = `${row.openTaskCount} open task${row.openTaskCount === 1 ? '' : 's'} pending.`;
			} else if (row.status === 'Maintenance') {
				priorityTier = 5;
				priorityLabel = 'In Maintenance';
				priorityColor = '#854d0e';
				priorityBackground = '#fefce8';
				priorityBorder = '#fef08a';
				reasonDescription = 'Appliance is currently in a maintenance state.';
			} else if (hasNoHistory) {
				priorityTier = 6;
				priorityLabel = 'Never Serviced';
				priorityColor = '#475569';
				priorityBackground = '#f1f5f9';
				priorityBorder = '#cbd5e1';
				reasonDescription = 'No maintenance history has been recorded for this appliance.';
			} else if (isStale) {
				priorityTier = 7;
				priorityLabel = 'Stale';
				priorityColor = '#475569';
				priorityBackground = '#f1f5f9';
				priorityBorder = '#cbd5e1';
				reasonDescription = `Last service was over 6 months ago (${formatRelativeTime(row.lastServiced)}).`;
			}

			if (priorityTier !== null) {
				entries.push({
					id: row.id,
					friendlyName: row.friendlyName,
					propertyName: propName,
					propertySlug: propSlug,
					locationLabel: row.locationLabel,
					locationHref: locHref,
					deviceSlug: devSlug,
					priorityTier,
					priorityLabel,
					priorityColor,
					priorityBackground,
					priorityBorder,
					reasonDescription,
				});
			}
		});

		return entries
			.sort((a, b) => a.priorityTier - b.priorityTier || a.friendlyName.localeCompare(b.friendlyName))
			.slice(0, 8);
	}, [deviceRows, propertyById, propertyNameById, linkedTasksByDevice, continuityEventsByDevice]);

	const needsAttentionCount = useMemo(
		() =>
			deviceRows.filter(
				(row) =>
					row.status === 'Broken' ||
					row.status === 'Maintenance' ||
					row.openTaskCount > 0,
			).length,
		[deviceRows],
	);

	const upcomingDueSoonCount = useMemo(() => {
		const now = new Date();
		const dueSoon = new Date(now);
		dueSoon.setDate(now.getDate() + 30);
		return deviceRows.filter((row) => {
			const date = toDate(row.upcomingMaintenance);
			return !!date && date <= dueSoon;
		}).length;
	}, [deviceRows]);

	return (
		<Wrapper>
			<Header>
				<h1>Appliances & Systems Hub</h1>
				<p>Cross-property maintenance status for every appliance and system.</p>
			</Header>

			<SummaryRow>
				<MetricCard>
					<MetricLabel>Total Appliances</MetricLabel>
					<MetricValue>{devices.length}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricLabel>Maintenance Risks</MetricLabel>
					<MetricValue>{needsAttentionCount}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricLabel>Due in 30 Days</MetricLabel>
					<MetricValue>{upcomingDueSoonCount}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricLabel>Open Linked Tasks</MetricLabel>
					<MetricValue>
						{Array.from(linkedOpenTaskCountByDevice.values()).reduce(
							(total, count) => total + count,
							0,
						)}
					</MetricValue>
				</MetricCard>
			</SummaryRow>

			<FilterBar>
				<SearchInput
					type='text'
					placeholder='Search systems, brands, or locations…'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<FilterGroup>
					{(['All', 'Active', 'Maintenance', 'Broken'] as const).map((s) => (
						<FilterButton key={s} $active={statusFilter === s} onClick={() => setStatusFilter(s)}>
							{s}
						</FilterButton>
					))}
				</FilterGroup>
				{properties.length > 1 ? (
					<PropertySelect
						value={propertyFilter}
						onChange={(e) => setPropertyFilter(e.target.value)}>
						<option value=''>All properties</option>
						{properties.map((p: any) => (
							<option key={p.id} value={String(p.id)}>
								{p.title || 'Untitled Property'}
							</option>
						))}
					</PropertySelect>
				) : null}
				<FilterResultCount>
					{filteredDeviceRows.length} of {deviceRows.length} appliance{deviceRows.length === 1 ? '' : 's'}
				</FilterResultCount>
			</FilterBar>

			{!isLoading && deviceRows.length === 0 ? (
				<EmptyState>
					No systems yet. Add your first system from a property page to begin maintenance tracking.
				</EmptyState>
			) : !isLoading && filteredDeviceRows.length === 0 ? (
				<EmptyState>No systems match your current filters.</EmptyState>
			) : (
				<List>
					{filteredDeviceRows.map((row) => {
						const propertyName =
							propertyNameById.get(row.propertyId) || 'Unknown Property';
						const property = properties.find((p: any) => String(p.id) === row.propertyId);
						const propertySlug = property?.slug || '';
						const locationHref = row.device.location?.suiteId
								? `/property/${propertySlug}/suite/${encodeURIComponent(row.locationLabel)}`
								: '';
						const deviceSlug = buildDeviceSlug(row.device);
						const targetPath = propertySlug
							? `/property/${propertySlug}/device/${deviceSlug}`
							: '/properties';

						return (
							<DeviceCard
								key={row.id}
								role='link'
								tabIndex={0}
								onClick={() => navigate(targetPath)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										navigate(targetPath);
									}
								}}>
								<Field>
									<Label>System Identity</Label>
									<IdentityTopRow>
										<DevicePrimary>{row.friendlyName}</DevicePrimary>
										<OpenProfileCue>Open profile →</OpenProfileCue>
									</IdentityTopRow>
									<TechnicalSubtitle>{row.technicalSubtitle}</TechnicalSubtitle>
									<ContextLinks>
										<ContextLink
											to={propertySlug ? `/property/${propertySlug}` : '/properties'}
											onClick={(event) => event.stopPropagation()}>
												{propertyName}
										</ContextLink>
										{locationHref ? (
											<>
												<ContextArrow>→</ContextArrow>
												<ContextLink to={locationHref} onClick={(event) => event.stopPropagation()}>
													{row.locationLabel}
												</ContextLink>
											</>
										) : null}
									</ContextLinks>
								</Field>
								<Field>
									<Label>Status</Label>
									<StatusPill $status={row.status}>{row.status}</StatusPill>
								</Field>
								<Field>
									<Label>Last Maintenance Event</Label>
									<Value>{formatDate(row.lastServiced)}</Value>
								</Field>
								<Field>
									<Label>Next Planned Service</Label>
									<Value>{formatDate(row.upcomingMaintenance)}</Value>
								</Field>
								<Field>
									<Label>Maintenance Snapshot</Label>
									<Value>{row.recentActivity}</Value>
								</Field>
								<Field>
									<Label>Open Linked Tasks</Label>
									<Value>{row.openTaskCount}</Value>
								</Field>
							</DeviceCard>
						);
					})}
				</List>
			)}

			<HubFeedGrid>
				<SurfaceCard>
					<FeedSectionTitle>Maintenance Activity Feed</FeedSectionTitle>
					<FeedSectionText>
						A running feed of lifecycle updates across every connected system.
					</FeedSectionText>
					{recentActivityFeed.length > 0 ? (
						<ActivityList>
							{recentActivityFeed.map((entry) => {
								const iconData = getActivityEventIcon(
									getActivityEventCategory(entry.description),
								);
								const deviceHref = entry.propertySlug && entry.deviceSlug
									? `/property/${entry.propertySlug}/device/${entry.deviceSlug}`
									: '/properties';
								return (
									<ActivityItem key={entry.key}>
										<ActivityMeta>{formatRelativeTime(entry.date)}</ActivityMeta>
										<ActivityHeaderRow>
											<ActivityIconBadge $color={iconData.color} $background={iconData.background}>
												<FontAwesomeIcon icon={iconData.icon} />
											</ActivityIconBadge>
											<ActivityTitle>{entry.friendlyName}</ActivityTitle>
										</ActivityHeaderRow>
										<ActivityDescription>
											{buildEventTitle({ description: entry.description })} — {buildEventDetail({ description: entry.description })}
										</ActivityDescription>
										<ActivityContext>
											<ActivityContextLink
												to={entry.propertySlug ? `/property/${entry.propertySlug}` : '/properties'}
												onClick={(e) => e.stopPropagation()}>
												{entry.propertyName}
											</ActivityContextLink>
											{entry.locationHref ? (
												<>
													<ActivityContextSep>→</ActivityContextSep>
													<ActivityContextLink to={entry.locationHref} onClick={(e) => e.stopPropagation()}>
														{entry.locationLabel}
													</ActivityContextLink>
												</>
											) : null}
											<ActivityContextSep>·</ActivityContextSep>
											<ActivityContextLink to={deviceHref} onClick={(e) => e.stopPropagation()}>
												View appliance →
											</ActivityContextLink>
										</ActivityContext>
									</ActivityItem>
								);
							})}
						</ActivityList>
					) : (
						<EmptyState>No maintenance activity yet.</EmptyState>
					)}
				</SurfaceCard>

				<SurfaceCard>
					<FeedSectionTitle>Systems Requiring Follow-Up</FeedSectionTitle>
					<FeedSectionText>
						Systems flagged for lifecycle risk, overdue work, stale records, or due-soon service.
					</FeedSectionText>
					{devicesNeedingAttention.length > 0 ? (
						<ActivityList>
							{devicesNeedingAttention.map((entry) => {
								const deviceHref = entry.propertySlug && entry.deviceSlug
									? `/property/${entry.propertySlug}/device/${entry.deviceSlug}`
									: '/properties';
								return (
									<ActivityItem key={`attention-${entry.id}`}>
										<AttentionHeaderRow>
											<AttentionPriorityBadge
												$color={entry.priorityColor}
												$background={entry.priorityBackground}
												$border={entry.priorityBorder}>
												{entry.priorityLabel}
											</AttentionPriorityBadge>
											<ActivityTitle>{entry.friendlyName}</ActivityTitle>
										</AttentionHeaderRow>
										<AttentionReason>{entry.reasonDescription}</AttentionReason>
										<AttentionContext>
											<AttentionContextLink
												to={entry.propertySlug ? `/property/${entry.propertySlug}` : '/properties'}
												onClick={(e) => e.stopPropagation()}>
												{entry.propertyName}
											</AttentionContextLink>
											{entry.locationHref ? (
												<>
													<AttentionContextSep>→</AttentionContextSep>
													<AttentionContextLink to={entry.locationHref} onClick={(e) => e.stopPropagation()}>
														{entry.locationLabel}
													</AttentionContextLink>
												</>
											) : null}
											<AttentionContextSep>·</AttentionContextSep>
											<AttentionContextLink to={deviceHref} onClick={(e) => e.stopPropagation()}>
												View appliance →
											</AttentionContextLink>
										</AttentionContext>
									</ActivityItem>
								);
							})}
						</ActivityList>
					) : (
						<EmptyState>No systems require follow-up right now.</EmptyState>
					)}
				</SurfaceCard>
			</HubFeedGrid>
		</Wrapper>
	);
};
