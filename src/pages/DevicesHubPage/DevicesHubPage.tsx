import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
	useCreateDeviceMutation,
	useGetAllDevicesQuery,
} from '../../Redux/API/deviceSlice';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
} from '../../Redux/API/propertySlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetAllMaintenanceHistoryForUserQuery } from '../../Redux/API/userSlice';
import { AppZeroState } from '../../Components/Library/AppZeroState';
import { DeviceModal } from '../../Components/Library/Modal';
import { RootState } from '../../Redux/store/store';
import { buildDeviceSlug } from '../../utils/deviceSlug';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from '../../utils/maintenanceEventUtils';
import {
	Device,
	DeviceServiceItem,
	Property,
	PropertyDocumentCategory,
} from '../../types/Property.types';
import { uploadDeviceFile } from '../../utils/deviceFileUpload';
import { uploadPropertyDocument } from '../../utils/propertyDocumentUpload';
import {
	canAddDevice,
	getEffectiveSubscriptionPlanId,
	getSubscriptionPlanDetails,
} from '../../utils/subscriptionUtils';
import { getRoleCapabilities } from '../../utils/permissions';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../../Components/Library/AppPageLayout/AppPageLayout.styles';
import { 
	SummaryRow, 
	MetricCard, 
	MetricLabel, 
	MetricValue,
	FilterBar, 
	SearchInput, 
	FilterGroup, 
	FilterButton, 
	PropertySelect, 
	FilterResultCount, 
	List, 
	DeviceCard, 
	Field, 
	Label, 
	IdentityTopRow, 
	DevicePrimary, 
	OpenProfileCue, 
	TechnicalSubtitle, 
	ContextLinks, 
	ContextLink, 
	ContextArrow, 
	StatusPill, 
	Value } from './DeviceHubPage.styles';


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

const getLatestMaintenanceEntry = (
	device: Device,
	linkedEvents: any[] = [],
): { date?: string; description?: string } | null => {
	const history = Array.isArray(device.maintenanceHistory)
		? device.maintenanceHistory.map((entry: any) => ({
				date: entry?.date,
				description: entry?.description,
		  }))
		: [];
	const eventEntries = linkedEvents.map((event: any) => ({
		date: getMaintenanceEventDate(event),
		description:
			getMaintenanceEventTitle(event) ||
			String(event?.description || event?.completionNotes || '').trim(),
	}));
	const combinedHistory = [...history, ...eventEntries].filter((entry) =>
		Boolean(entry.date || entry.description),
	);
	if (combinedHistory.length === 0) return null;
	combinedHistory.sort((a, b) => {
		const left = toDate(a?.date)?.getTime() || 0;
		const right = toDate(b?.date)?.getTime() || 0;
		return right - left;
	});
	return combinedHistory[0] || null;
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

const getResolvedDeviceStatus = (device: Device): 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned' => {
	return device.decommissionDate ? 'Decommissioned' : device.status || 'Active';
};

const hasApplianceDetails = (device: Device): boolean => {
	const serviceItems = Array.isArray(device.serviceItems) ? device.serviceItems : [];
	const files = Array.isArray(device.files) ? device.files : [];
	return Boolean(
		String(device.brand || '').trim() ||
			String(device.model || '').trim() ||
			String(device.serialNumber || '').trim() ||
			String(device.partNumber || '').trim() ||
			String(device.filterSize || '').trim() ||
			String(device.specNotes || '').trim() ||
			String(device.installationDate || '').trim() ||
			String(device.decommissionDate || '').trim() ||
			serviceItems.length > 0 ||
			files.length > 0,
	);
};

const buildRecentActivity = (entry?: { date?: string; description?: string } | null): string => {
	if (!entry) return 'No maintenance activity recorded yet';
	const rawDescription = String(entry.description || '').trim();
	if (!rawDescription) return `Maintenance event ${formatRelativeTime(entry.date)}`;
	return `${rawDescription} ${formatRelativeTime(entry.date)}`.trim();
};

const buildLocationLabel = (device: Device, propertyNameById: Map<string, string>, properties: any[]): string => {
	const propertyName = propertyNameById.get(String(device.location?.propertyId || '')) || 'Property';
	const scopedProperties = properties.filter(Boolean);
	if (device.location?.unitId) {
		const unitLabel = properties
			.filter(Boolean)
			.flatMap((property: any) => (Array.isArray(property.units) ? property.units : []))
			.find((unit: any) => String(unit.id) === String(device.location?.unitId));
		return unitLabel?.name || propertyName;
	}
	if (device.location?.suiteId) {
		const suiteLabel = scopedProperties
			.flatMap((property: any) => (Array.isArray(property.suites) ? property.suites : []))
			.find((suite: any) => String(suite.id) === String(device.location?.suiteId));
		return suiteLabel?.name || propertyName;
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

type DeviceFormData = {
	type: string;
	brand: string;
	model: string;
	serialNumber?: string;
	partNumber?: string;
	filterSize?: string;
	specNotes?: string;
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
};

export const DevicesHubPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const { data: devices = [], isLoading } = useGetAllDevicesQuery();
	const { data: properties = [], isLoading: isLoadingProperties } =
		useGetPropertiesQuery();
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: allMaintenanceHistory = [] } = useGetAllMaintenanceHistoryForUserQuery();
	const [createDevice] = useCreateDeviceMutation();
	const [updateProperty] = useUpdatePropertyMutation();

	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned'>('All');
	const [propertyFilter, setPropertyFilter] = useState('');
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [isSavingDevice, setIsSavingDevice] = useState(false);
	const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
	const [pendingPropertyDocumentFiles, setPendingPropertyDocumentFiles] =
		useState<File[]>([]);
	const [pendingPropertyDocumentCategory, setPendingPropertyDocumentCategory] =
		useState<PropertyDocumentCategory>('other');
	const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
		type: '',
		brand: '',
		model: '',
		serialNumber: '',
		partNumber: '',
		filterSize: '',
		specNotes: '',
		serviceItems: [],
		installationDate: '',
		decommissionDate: '',
		status: 'Active',
		location: {
			propertyId: '',
		},
		files: [],
	});

	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const canManageAppliances = roleCapabilities.canManageAppliances;
	const effectivePlanId = getEffectiveSubscriptionPlanId(
		currentUser?.subscription,
		'homeowner',
	);
	const isSinglePropertyPlan =
		effectivePlanId === 'homeowner' || effectivePlanId === 'homeowner_plus';

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

	const selectedCreateProperty = useMemo<Property | null>(() => {
		if (properties.length === 0) {
			return null;
		}

		const selected = properties.find(
			(property: any) =>
				String(property.id) === String(deviceFormData.location?.propertyId || ''),
		);
		return (selected || properties[0] || null) as Property | null;
	}, [properties, deviceFormData.location?.propertyId]);

	const resolveDefaultCreatePropertyId = () => {
		if (properties.length === 0) {
			return '';
		}

		if (isSinglePropertyPlan) {
			return String(properties[0].id);
		}

		if (
			propertyFilter &&
			properties.some((property: any) => String(property.id) === propertyFilter)
		) {
			return propertyFilter;
		}

		return String(properties[0].id);
	};

	const clearCreateActionParam = () => {
		const params = new URLSearchParams(location.search);
		params.delete('action');
		navigate(
			{
				pathname: location.pathname,
				search: params.toString() ? `?${params.toString()}` : '',
			},
			{ replace: true },
		);
	};

	const resetCreateDeviceForm = (propertyId: string) => {
		setDeviceFormData({
			type: '',
			brand: '',
			model: '',
			serialNumber: '',
			partNumber: '',
			filterSize: '',
			specNotes: '',
			serviceItems: [],
			installationDate: '',
			decommissionDate: '',
			status: 'Active',
			location: {
				propertyId,
			},
			files: [],
		});
		setPendingUploadFiles([]);
		setPendingPropertyDocumentFiles([]);
		setPendingPropertyDocumentCategory('other');
	};

	const handleCreateDeviceFormChange = (field: string, value: string) => {
		if (field.startsWith('location.')) {
			const locationField = field.split('.')[1] as 'propertyId' | 'unitId' | 'suiteId';
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
					status:
						value
							? 'Decommissioned'
							: prev.status === 'Decommissioned'
								? 'Active'
								: prev.status,
				};
			}

			if (field === 'status' && value !== 'Decommissioned') {
				return {
					...prev,
					status: value as DeviceFormData['status'],
					decommissionDate: '',
				};
			}

			return {
				...prev,
				[field]: value,
			};
		});
	};

	const handleOpenCreateDeviceModal = () => {
		if (!canManageAppliances) {
			feedback.notify('Your role can view appliances but cannot add or edit them.');
			return;
		}

		if (properties.length === 0) {
			navigate('/properties?action=create');
			return;
		}

		if (!currentUser?.subscription) {
			feedback.notify('Unable to verify subscription. Please contact support.');
			return;
		}

		if (!canAddDevice(currentUser.subscription, devices.length)) {
			const planDetails = getSubscriptionPlanDetails(effectivePlanId);
			const maxDevices = planDetails?.maxDevices || 15;
			feedback.notify(
				`Your ${planDetails?.name || 'current'} plan allows up to ${maxDevices} appliances. ` +
					`You currently have ${devices.length} appliances. Please upgrade to add more.`,
			);
			return;
		}

		resetCreateDeviceForm(resolveDefaultCreatePropertyId());
		setShowDeviceModal(true);
	};

	const handleCloseCreateDeviceModal = () => {
		setShowDeviceModal(false);
	};

	const handleSubmitCreateDevice = async (event: React.FormEvent) => {
		event.preventDefault();

		if (isSavingDevice || !canManageAppliances) {
			return;
		}

		const targetProperty = selectedCreateProperty;
		if (!targetProperty?.id) {
			feedback.notify('Select a property before saving this appliance.');
			return;
		}

		setIsSavingDevice(true);
		try {
			let uploadedFiles: DeviceFormData['files'] = [];
			if (pendingUploadFiles.length > 0) {
				uploadedFiles = await Promise.all(
					pendingUploadFiles.map((file) =>
						uploadDeviceFile(file, String(targetProperty.id)),
					),
				);
			}

			const deviceData = {
				...deviceFormData,
				type: deviceFormData.type.trim(),
				brand: deviceFormData.brand.trim(),
				model: deviceFormData.model.trim(),
				serialNumber: deviceFormData.serialNumber?.trim() || '',
				partNumber: deviceFormData.partNumber?.trim() || '',
				filterSize: deviceFormData.filterSize?.trim() || '',
				specNotes: deviceFormData.specNotes?.trim() || '',
				status: deviceFormData.decommissionDate
					? 'Decommissioned'
					: deviceFormData.status,
				location: {
					...deviceFormData.location,
					propertyId: String(targetProperty.id),
					unitId: undefined,
					suiteId: undefined,
				},
				files: uploadedFiles,
				userId: currentUser?.id,
			};

			const savedDevice = await createDevice(deviceData as any).unwrap();
			const savedDeviceId = savedDevice?.id;

			if (savedDeviceId && pendingPropertyDocumentFiles.length > 0) {
				const propertyDocuments = Array.isArray((targetProperty as any)?.documents)
					? (targetProperty as any).documents
					: [];

				const uploadedDocuments = await Promise.all(
					pendingPropertyDocumentFiles.map((file) =>
						uploadPropertyDocument(
							file,
							String(targetProperty.id),
							pendingPropertyDocumentCategory,
						),
					),
				);

				await updateProperty({
					id: String(targetProperty.id),
					updates: {
						documents: [
							...propertyDocuments,
							...uploadedDocuments.map((document) => ({
								...document,
								assignedDeviceId: savedDeviceId,
							})),
						],
					},
				}).unwrap();
			}

			setShowDeviceModal(false);
			feedback.notify('Appliance added successfully.');
		} catch (error: any) {
			console.error('Error saving appliance from hub:', error);
			feedback.notify(error?.message || 'Unable to add appliance right now.');
		} finally {
			setIsSavingDevice(false);
		}
	};

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		if (params.get('action') !== 'create') {
			return;
		}

		if (isLoadingProperties) {
			return;
		}

		handleOpenCreateDeviceModal();
		clearCreateActionParam();
	}, [location.pathname, location.search, isLoadingProperties]);

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
				const continuityEvents = continuityEventsByDevice.get(deviceId) || [];
				const latestMaintenance = getLatestMaintenanceEntry(device, continuityEvents);
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
					detailsMissing: !hasApplianceDetails(device),
					locationLabel,
					propertyId: String(device.location?.propertyId || ''),
					status: getResolvedDeviceStatus(device),
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
	}, [
		devices,
		linkedOpenTaskCountByDevice,
		linkedTasksByDevice,
		continuityEventsByDevice,
		propertyById,
		propertyNameById,
	]);

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


	if (!isLoadingProperties && properties.length === 0) {
		return (
			<AppZeroState
				kind='noProperties'
				actions={[{ label: 'Add Property', onClick: () => navigate('/properties?openCreate=1') }]}
				fullPage
			/>
		);
	}

	if (!isLoading && deviceRows.length === 0) {
		return (
			<>
				<AppZeroState
					kind='noAppliances'
					actions={[{ label: 'Open Properties', onClick: () => navigate('/properties') }]}
					fullPage
				/>
				{showDeviceModal && selectedCreateProperty && canManageAppliances && (
					<DeviceModal
						isOpen={showDeviceModal}
						onClose={handleCloseCreateDeviceModal}
						onSubmit={handleSubmitCreateDevice}
						property={selectedCreateProperty}
						availableProperties={properties as Property[]}
						allowPropertySelection={!isSinglePropertyPlan}
						isEditing={false}
						pendingFiles={pendingUploadFiles}
						onPendingFilesChange={setPendingUploadFiles}
						deviceFormData={deviceFormData as any}
						onFormChange={(event) =>
							handleCreateDeviceFormChange(
								event.currentTarget.name,
								event.currentTarget.value,
							)
						}
						onServiceItemsChange={(items) =>
							setDeviceFormData((prev) => ({ ...prev, serviceItems: items }))
						}
						pendingPropertyDocumentFiles={pendingPropertyDocumentFiles}
						onPendingPropertyDocumentFilesChange={setPendingPropertyDocumentFiles}
						pendingPropertyDocumentCategory={pendingPropertyDocumentCategory}
						onPendingPropertyDocumentCategoryChange={
							setPendingPropertyDocumentCategory
						}
					/>
				)}
			</>
		);
	}

	return (
		<StandardAppPage>
			<StandardAppPageHeader>
				<StandardAppPageTitleBlock>
					<StandardAppPageTitle>Appliances & Systems Hub</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						Cross-property maintenance status for every appliance and system.
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
			</StandardAppPageHeader>

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
					{(['All', 'Active', 'Maintenance', 'Broken', 'Decommissioned'] as const).map((s) => (
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

			{!isLoading && filteredDeviceRows.length === 0 ? (
				<AppZeroState
					kind='noApplianceMatches'
					actions={[
						{
							label: 'Clear Filters',
							onClick: () => {
								setSearchQuery('');
								setStatusFilter('All');
								setPropertyFilter('');
							},
						},
					]}
				/>
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
									{row.detailsMissing && (
										<div style={{ marginTop: 4, color: '#854d0e', fontSize: '0.75rem', fontWeight: 800 }}>
											No details added
										</div>
									)}
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

			{showDeviceModal && selectedCreateProperty && canManageAppliances && (
				<DeviceModal
					isOpen={showDeviceModal}
					onClose={handleCloseCreateDeviceModal}
					onSubmit={handleSubmitCreateDevice}
					property={selectedCreateProperty}
					availableProperties={properties as Property[]}
					allowPropertySelection={!isSinglePropertyPlan}
					isEditing={false}
					pendingFiles={pendingUploadFiles}
					onPendingFilesChange={setPendingUploadFiles}
					deviceFormData={deviceFormData as any}
					onFormChange={(event) =>
						handleCreateDeviceFormChange(
							event.currentTarget.name,
							event.currentTarget.value,
						)
					}
					onServiceItemsChange={(items) =>
						setDeviceFormData((prev) => ({ ...prev, serviceItems: items }))
					}
					pendingPropertyDocumentFiles={pendingPropertyDocumentFiles}
					onPendingPropertyDocumentFilesChange={setPendingPropertyDocumentFiles}
					pendingPropertyDocumentCategory={pendingPropertyDocumentCategory}
					onPendingPropertyDocumentCategoryChange={
						setPendingPropertyDocumentCategory
					}
				/>
			)}
		</StandardAppPage>
	);
};
