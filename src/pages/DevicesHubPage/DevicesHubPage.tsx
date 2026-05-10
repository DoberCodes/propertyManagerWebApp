import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useGetAllDevicesQuery } from '../../Redux/API/deviceSlice';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { buildDeviceSlug } from '../../utils/deviceSlug';
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
	font-size: 1.04rem;
	font-weight: 800;
	color: #0f172a;
	line-height: 1.2;
`;

const DeviceSecondary = styled.div`
	margin-top: 4px;
	font-size: 0.8rem;
	color: #64748b;
	line-height: 1.4;
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

const DeviceCard = styled(Link)`
	display: grid;
	grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.15fr) minmax(0, 0.75fr) minmax(0, 0.95fr) minmax(0, 1.2fr) minmax(0, 1.3fr) minmax(0, 0.75fr);
	gap: 12px;
	align-items: center;
	border: 1px solid #dbe3ea;
	background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
	border-radius: 14px;
	padding: 14px 16px;
	text-decoration: none;
	color: inherit;
	transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
	box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);

	&:hover {
		border-color: #16a34a;
		background: #f8fff8;
		transform: translateY(-2px);
		box-shadow: 0 14px 30px rgba(22, 163, 74, 0.12);
	}

	@media (max-width: 1120px) {
		grid-template-columns: 1fr;
		gap: 6px;
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
	margin-bottom: 3px;
`;

const Value = styled.div`
	font-size: 0.88rem;
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

const buildFriendlyDeviceName = (device: Device, propertyName: string): string => {
	const deviceType = device.type?.trim() || 'Device';
	if (device.location?.unitId || device.location?.suiteId) {
		const location = device.location.unitId || device.location.suiteId;
		return `${location ? String(location) : propertyName} ${deviceType}`.trim();
	}
	return deviceType;
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
	const { data: devices = [], isLoading } = useGetAllDevicesQuery();
	const { data: properties = [] } = useGetPropertiesQuery();
	const { data: allTasks = [] } = useGetTasksQuery();

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
				const friendlyName = buildFriendlyDeviceName(device, locationLabel);
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

	const recentActivityFeed = useMemo(
		() =>
			deviceRows
				.filter((row) => row.recentActivity !== 'No maintenance activity recorded yet')
				.slice(0, 6),
		[deviceRows],
	);

	const devicesNeedingAttention = useMemo(
		() => deviceRows.filter((row) => row.status === 'Broken' || row.status === 'Maintenance' || row.openTaskCount > 0).slice(0, 6),
		[deviceRows],
	);

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
				<h1>Devices Hub</h1>
				<p>Cross-property operational awareness for systems under care.</p>
			</Header>

			<SummaryRow>
				<MetricCard>
					<MetricLabel>Total Devices</MetricLabel>
					<MetricValue>{devices.length}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricLabel>Need Attention</MetricLabel>
					<MetricValue>{needsAttentionCount}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricLabel>Upcoming in 30 Days</MetricLabel>
					<MetricValue>{upcomingDueSoonCount}</MetricValue>
				</MetricCard>
				<MetricCard>
					<MetricLabel>Open Device Tasks</MetricLabel>
					<MetricValue>
						{Array.from(linkedOpenTaskCountByDevice.values()).reduce(
							(total, count) => total + count,
							0,
						)}
					</MetricValue>
				</MetricCard>
			</SummaryRow>

			{!isLoading && deviceRows.length === 0 ? (
				<EmptyState>
					No devices yet. Add your first system from a property page to start building continuity.
				</EmptyState>
			) : (
				<List>
					{deviceRows.map((row) => {
						const propertyName =
							propertyNameById.get(row.propertyId) || 'Unknown Property';
						const propertySlug =
							properties.find((p: any) => String(p.id) === row.propertyId)?.slug || '';
						const deviceSlug = buildDeviceSlug(row.device);
						const targetPath = propertySlug
							? `/property/${propertySlug}/device/${deviceSlug}`
							: '/properties';

						return (
							<DeviceCard key={row.id} to={targetPath}>
								<Field>
									<Label>Friendly Name</Label>
									<DevicePrimary>{row.friendlyName}</DevicePrimary>
									<DeviceSecondary>{row.locationLabel}</DeviceSecondary>
								</Field>
								<Field>
									<Label>Technical Subtitle</Label>
									<DevicePrimary style={{ fontSize: '0.92rem' }}>{row.technicalSubtitle}</DevicePrimary>
									<DeviceSecondary>{propertyName}</DeviceSecondary>
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
									<Label>Upcoming Maintenance</Label>
									<Value>{formatDate(row.upcomingMaintenance)}</Value>
								</Field>
								<Field>
									<Label>Recent Activity</Label>
									<Value>{row.recentActivity}</Value>
								</Field>
								<Field>
									<Label>Open Task Count</Label>
									<Value>{row.openTaskCount}</Value>
								</Field>
							</DeviceCard>
						);
					})}
				</List>
			)}

			<HubFeedGrid>
				<SurfaceCard>
					<FeedSectionTitle>Recent System Activity</FeedSectionTitle>
					<FeedSectionText>
						A running feed of the newest maintenance events across all devices.
					</FeedSectionText>
					{recentActivityFeed.length > 0 ? (
						<ActivityList>
							{recentActivityFeed.map((row) => (
								<ActivityItem key={`recent-${row.id}`}>
									<ActivityMeta>{formatRelativeTime(row.lastServiced)}</ActivityMeta>
									<ActivityTitle>{row.friendlyName}</ActivityTitle>
									<ActivityDescription>
										{buildEventTitle({ description: row.latestMaintenanceDescription })} - {buildEventDetail({ description: row.latestMaintenanceDescription })}
									</ActivityDescription>
								</ActivityItem>
							))}
						</ActivityList>
					) : (
						<EmptyState>No recent system activity yet.</EmptyState>
					)}
				</SurfaceCard>

				<SurfaceCard>
					<FeedSectionTitle>Devices Needing Attention</FeedSectionTitle>
					<FeedSectionText>
						The systems most likely to need a follow-up next.
					</FeedSectionText>
					{devicesNeedingAttention.length > 0 ? (
						<ActivityList>
							{devicesNeedingAttention.map((row) => (
								<ActivityItem key={`attention-${row.id}`}>
									<ActivityMeta>{row.status === 'Broken' ? 'Broken' : row.openTaskCount > 0 ? 'Open Work' : 'Maintenance'}</ActivityMeta>
									<ActivityTitle>{row.friendlyName}</ActivityTitle>
									<ActivityDescription>
										{row.openTaskCount > 0
											? `${row.openTaskCount} open task${row.openTaskCount === 1 ? '' : 's'}`
											: `Status is ${row.status.toLowerCase()}`}
									</ActivityDescription>
								</ActivityItem>
							))}
						</ActivityList>
					) : (
						<EmptyState>No devices need attention right now.</EmptyState>
					)}
				</SurfaceCard>
			</HubFeedGrid>
		</Wrapper>
	);
};
