import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import {
	useCreateDeviceMutation,
	useGetAllDevicesQuery,
} from '../../Redux/API/deviceSlice';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetAllMaintenanceHistoryForUserQuery } from '../../Redux/API/userSlice';
import { AppZeroState } from '../../Components/Library/AppZeroState';
import { LoadingState } from '../../Components/LoadingState';
import { FloatingFilterPanel } from '../../Components/Library';
import { DeviceModal } from '../../Components/Library/Modal';
import { RootState } from '../../Redux/store/store';
import { buildDeviceSlug } from '../../utils/deviceSlug';
import {
	useGetPropertyKnowledgeLinksQuery,
	useSetEquipmentSpaceLinksMutation,
	useSetSupplyLinksMutation,
} from '../../Redux/API/propertyKnowledgeLinkSlice';
import {
	useCreatePropertySupplyMutation,
	useGetPropertySuppliesQuery,
} from '../../Redux/API/supplySlice';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from '../../utils/maintenanceEventUtils';
import { mergeMaintenanceHistoryWithDeviceSources } from '../../maintenanceHistory/maintenanceHistoryAdapter';
import {
	Device,
	Property,
	PropertyDocumentCategory,
} from '../../types/Property.types';
import { usePropertyDocumentUploadWorkflow } from '../../propertyKnowledge/usePropertyDocumentUploadWorkflow';
import {
	canAddDevice,
	getEffectiveSubscriptionPlanId,
	getSubscriptionPlanDetails,
} from '../../utils/subscriptionUtils';
import { getRoleCapabilities } from '../../utils/permissions';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import type { PendingEquipmentSupplyDraft } from '../../Components/EquipmentSuppliesReview/EquipmentSuppliesReview';
import { buildEquipmentSupplyLinkUpdates } from '../../propertyKnowledge/equipmentSupplyConnections';
import {
	AppPage as StandardAppPage,
	AppPageHeader as StandardAppPageHeader,
	AppPageSubtitle as StandardAppPageSubtitle,
	AppPageTitle as StandardAppPageTitle,
	AppPageTitleBlock as StandardAppPageTitleBlock,
} from '../../Components/Library/AppPageLayout/AppPageLayout.styles';
import {
	FilterBar,
	CompactFilterResultCount,
	HubFilterFields,
	HubFilterField,
	SearchInput,
	FilterGroup,
	FilterButton,
	PropertySelect,
	FilterResultCount,
	List,
	EquipmentHero,
	EquipmentHeroContent,
	EquipmentHeroEyebrow,
	EquipmentHeroTitle,
	EquipmentHeroText,
	EquipmentHeroActions,
	EquipmentHeroButton,
	EquipmentHeroStats,
	EquipmentHeroStat,
	EquipmentHeroStatLabel,
	EquipmentHeroStatValue,
	EquipmentGroupStack,
	EquipmentGroupSection,
	EquipmentGroupHeader,
	EquipmentGroupTitleBlock,
	EquipmentGroupTitle,
	EquipmentGroupDescription,
	EquipmentGroupMeta,
	EquipmentGroupBadge,
	EquipmentGroupBody,
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
	Value
} from './DeviceHubPage.styles';


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
	linkedEvents: any[] = [],
): { date?: string; description?: string } | null => {
	const combinedHistory = linkedEvents.map((event: any) => ({
		date: getMaintenanceEventDate(event),
		description:
			getMaintenanceEventTitle(event) ||
			String(event?.description || event?.completionNotes || '').trim(),
	})).filter((entry) =>
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
	const brand = device.brand?.trim();
	const title = [brand, deviceType]
		.filter((value): value is string => Boolean(value))
		.join(' ');
	if (title) return title;

	const fallback = [device.brand, device.model]
		.filter((value): value is string => Boolean(value && value.trim()))
		.map((value) => value.trim())
		.join(' ')
		.trim();

	return fallback || 'Equipment';
};

const buildTechnicalSubtitle = (device: Device): string => {
	const pieces = [
		device.model ? `Model ${device.model}` : '',
		device.serialNumber ? `Serial ${device.serialNumber}` : '',
	]
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

const isTaskOverdue = (task: any): boolean => {
	const dueDate = toDate(task?.dueDate);
	if (!dueDate) return false;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	dueDate.setHours(0, 0, 0, 0);
	return dueDate < today;
};

type EquipmentGroupId =
	| 'comfort'
	| 'safety'
	| 'exterior'
	| 'utilities'
	| 'appliances'
	| 'other';

const equipmentGroupDetails: Record<
	EquipmentGroupId,
	{ label: string; description: string }
> = {
	comfort: {
		label: 'Comfort',
		description: 'Heating, cooling, air quality, and comfort systems.',
	},
	safety: {
		label: 'Safety',
		description: 'Detectors, alarms, and home safety equipment.',
	},
	exterior: {
		label: 'Exterior',
		description: 'Outdoor, garage, roof, drainage, and yard-related equipment.',
	},
	utilities: {
		label: 'Utilities',
		description: 'Electrical, plumbing, water, sump, and utility systems.',
	},
	appliances: {
		label: 'Appliances',
		description: 'Kitchen, laundry, and household appliances.',
	},
	other: {
		label: 'Other',
		description: 'Equipment that does not fit another group yet.',
	},
};

const equipmentGroupOrder: EquipmentGroupId[] = [
	'comfort',
	'safety',
	'exterior',
	'utilities',
	'appliances',
	'other',
];

const getEquipmentGroupId = (device: Device): EquipmentGroupId => {
	const context = [
		device.type,
		(device as any).assetType,
		(device as any).assetVariant,
		(device as any).category,
		device.brand,
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	if (
		/\b(hvac|furnace|air conditioner|ac|heat pump|mini split|thermostat|boiler|humidifier|dehumidifier)\b/.test(
			context,
		)
	) {
		return 'comfort';
	}
	if (
		/\b(smoke|carbon monoxide|co detector|alarm|detector|fire|extinguisher|security)\b/.test(
			context,
		)
	) {
		return 'safety';
	}
	if (
		/\b(roof|gutter|garage|driveway|lawn|irrigation|sprinkler|pool|spa|exterior|siding|door)\b/.test(
			context,
		)
	) {
		return 'exterior';
	}
	if (
		/\b(electrical|panel|plumbing|water heater|well|septic|sump|softener|generator|breaker)\b/.test(
			context,
		)
	) {
		return 'utilities';
	}
	if (
		/\b(refrigerator|fridge|dishwasher|washer|dryer|oven|range|stove|microwave|freezer|cooktop)\b/.test(
			context,
		)
	) {
		return 'appliances';
	}
	return 'other';
};

type DeviceFormData = {
	type: string;
	brand: string;
	model: string;
	serialNumber?: string;
	partNumber?: string;
	filterSize?: string;
	specNotes?: string;
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
	const resolvedMaintenanceHistory = useMemo(
		() => mergeMaintenanceHistoryWithDeviceSources(allMaintenanceHistory, devices),
		[allMaintenanceHistory, devices],
	);
	const [createDevice] = useCreateDeviceMutation();
	const { uploadPropertyDocuments } = usePropertyDocumentUploadWorkflow();

	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned'>('All');
	const [propertyFilter, setPropertyFilter] = useState('');
	const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
	const [draftSearchQuery, setDraftSearchQuery] = useState('');
	const [draftStatusFilter, setDraftStatusFilter] =
		useState<typeof statusFilter>('All');
	const [draftPropertyFilter, setDraftPropertyFilter] = useState('');
	const [collapsedEquipmentGroups, setCollapsedEquipmentGroups] = useState<
		Record<EquipmentGroupId, boolean>
	>({
		comfort: false,
		safety: false,
		exterior: false,
		utilities: false,
		appliances: false,
		other: false,
	});
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [isSavingDevice, setIsSavingDevice] = useState(false);
	const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
	const [pendingPropertyDocumentFiles, setPendingPropertyDocumentFiles] =
		useState<File[]>([]);
	const [pendingPropertyDocumentCategory, setPendingPropertyDocumentCategory] =
		useState<PropertyDocumentCategory>('other');
	const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>([]);
	const [pendingSupplies, setPendingSupplies] = useState<
		PendingEquipmentSupplyDraft[]
	>([]);
	const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
		type: '',
		brand: '',
		model: '',
		serialNumber: '',
		partNumber: '',
		filterSize: '',
		specNotes: '',
		installationDate: '',
		decommissionDate: '',
		status: 'Active',
		location: {
			propertyId: '',
		},
		files: [],
		spaceIds: [],
	});
	const [setEquipmentSpaceLinks] = useSetEquipmentSpaceLinksMutation();

	const openFilterPanel = () => {
		setDraftSearchQuery(searchQuery);
		setDraftStatusFilter(statusFilter);
		setDraftPropertyFilter(propertyFilter);
		setIsFilterPanelOpen(true);
	};

	const dismissFilterPanel = () => {
		setDraftSearchQuery(searchQuery);
		setDraftStatusFilter(statusFilter);
		setDraftPropertyFilter(propertyFilter);
		setIsFilterPanelOpen(false);
	};

	const clearDraftFilters = () => {
		setDraftSearchQuery('');
		setDraftStatusFilter('All');
		setDraftPropertyFilter('');
	};

	const applyDraftFilters = () => {
		setSearchQuery(draftSearchQuery);
		setStatusFilter(draftStatusFilter);
		setPropertyFilter(draftPropertyFilter);
		setIsFilterPanelOpen(false);
	};

	const clearApplianceFilters = () => {
		setSearchQuery('');
		setStatusFilter('All');
		setPropertyFilter('');
	};

	const activeFilterCount =
		(searchQuery.trim() ? 1 : 0) +
		(statusFilter !== 'All' ? 1 : 0) +
		(propertyFilter ? 1 : 0);

	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const canManageAppliances = roleCapabilities.canManageAppliances;
	const canManageSpaces = roleCapabilities.canManageProperties;
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
	const selectedCreatePropertyAccountId = String(
		selectedCreateProperty?.accountId || selectedCreateProperty?.userId || '',
	).trim();
	const { data: selectedPropertySupplies = [] } = useGetPropertySuppliesQuery(
		{
			accountId: selectedCreatePropertyAccountId,
			propertyId: String(selectedCreateProperty?.id || ''),
			includeArchived: true,
		},
		{
			skip:
				!selectedCreatePropertyAccountId || !String(selectedCreateProperty?.id || ''),
		},
	);
	const { data: selectedPropertyKnowledgeLinks = [] } =
		useGetPropertyKnowledgeLinksQuery(
			{
				accountId: selectedCreatePropertyAccountId,
				propertyId: String(selectedCreateProperty?.id || ''),
			},
			{
				skip:
					!selectedCreatePropertyAccountId ||
					!String(selectedCreateProperty?.id || ''),
			},
		);
	const [createPropertySupply] = useCreatePropertySupplyMutation();
	const [setSupplyLinks] = useSetSupplyLinksMutation();

	const handleCreateDeviceFormChange = (field: string, value: string) => {
		if (field.startsWith('location.')) {
			const locationField = field.split('.')[1] as 'propertyId' | 'unitId' | 'suiteId';
			setDeviceFormData((prev) => ({
				...prev,
				spaceIds: locationField === 'propertyId' ? [] : prev.spaceIds,
				location: {
					...prev.location,
					[locationField]: value,
				},
			}));
			if (locationField === 'propertyId') {
				setSelectedSupplyIds([]);
				setPendingSupplies([]);
			}
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

	const handleCloseCreateDeviceModal = () => {
		setShowDeviceModal(false);
		setSelectedSupplyIds([]);
		setPendingSupplies([]);
	};

	const handleSubmitCreateDevice = async (event: React.FormEvent) => {
		event.preventDefault();

		if (isSavingDevice || !canManageAppliances) {
			return;
		}

		const targetProperty = selectedCreateProperty;
		if (!targetProperty?.id) {
			feedback.notify('Select a property before saving this equipment record.');
			return;
		}

		setIsSavingDevice(true);
		try {
			const { spaceIds, ...deviceFields } = deviceFormData;
			const deviceData = {
				...deviceFields,
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
				files: [],
				userId: currentUser?.id,
			};

			const savedDevice = await createDevice(deviceData as any).unwrap();
			if (savedDevice?.id && canManageSpaces) {
				try {
					await setEquipmentSpaceLinks({
						propertyId: String(targetProperty.id),
						equipmentId: String(savedDevice.id),
						spaceIds,
					}).unwrap();
				} catch (linkError) {
					console.error('Error saving equipment Spaces:', linkError);
					feedback.notify(
						'Equipment was saved, but Maintley could not update its Spaces.',
					);
				}
			}

			if (
				(selectedSupplyIds.length > 0 || pendingSupplies.length > 0) &&
				!selectedCreatePropertyAccountId
			) {
				throw new Error('This property is missing its account connection.');
			}
			const desiredSupplyIds = new Set(selectedSupplyIds);
			for (const pendingSupply of pendingSupplies) {
				const { clientId, ...supplyDraft } = pendingSupply;
				const createdSupply = await createPropertySupply({
					...supplyDraft,
					accountId: selectedCreatePropertyAccountId,
					propertyId: String(targetProperty.id),
					source: 'manual',
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

			if (savedDevice?.id) {
				const supplyLinkUpdates = buildEquipmentSupplyLinkUpdates({
					links: selectedPropertyKnowledgeLinks,
					equipmentId: String(savedDevice.id),
					originalSupplyIds: [],
					desiredSupplyIds: Array.from(desiredSupplyIds),
				});
				for (const update of supplyLinkUpdates) {
					await setSupplyLinks({
						propertyId: String(targetProperty.id),
						...update,
					}).unwrap();
				}
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
					property: targetProperty as Property,
					propertyId: String(targetProperty.id),
					batches: propertyDocumentUploads.map(({ file, category }) => ({
						files: [file],
						category,
						systems: savedDevice ? [savedDevice as Device] : [],
						uploadContext: {
							assetIds: savedDevice?.id ? [String(savedDevice.id)] : [],
						},
					})),
				});
			}

			setShowDeviceModal(false);
			feedback.notify('Equipment added successfully.');
		} catch (error: any) {
			console.error('Error saving equipment record from hub:', error);
			feedback.notify(error?.message || 'Unable to add equipment right now.');
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

		if (!canManageAppliances) {
			feedback.notify('Your role can view equipment but cannot add or edit it.');
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
				`Your ${planDetails?.name || 'current'} plan allows up to ${maxDevices} equipment records. ` +
				`You currently have ${devices.length} equipment records. Please upgrade to add more.`,
			);
			return;
		}

		const defaultPropertyId = (() => {
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
		})();

		setDeviceFormData({
			type: '',
			brand: '',
			model: '',
			serialNumber: '',
			partNumber: '',
			filterSize: '',
			specNotes: '',
			installationDate: '',
			decommissionDate: '',
			status: 'Active',
			location: {
				propertyId: defaultPropertyId,
			},
			files: [],
			spaceIds: [],
		});
		setPendingUploadFiles([]);
		setPendingPropertyDocumentFiles([]);
		setPendingPropertyDocumentCategory('other');
		setSelectedSupplyIds([]);
		setPendingSupplies([]);
		setShowDeviceModal(true);

		params.delete('action');
		navigate(
			{
				pathname: location.pathname,
				search: params.toString() ? `?${params.toString()}` : '',
			},
			{ replace: true },
		);
	}, [
		location.pathname,
		location.search,
		isLoadingProperties,
		canManageAppliances,
		feedback,
		properties,
		currentUser?.subscription,
		devices.length,
		effectivePlanId,
		navigate,
		propertyFilter,
		isSinglePropertyPlan,
	]);

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

	const linkedOverdueTaskCountByDevice = useMemo(() => {
		const counts = new Map<string, number>();
		openTasks.forEach((task: any) => {
			if (!isTaskOverdue(task)) return;
			getLinkedDeviceIds(task).forEach((id) => {
				counts.set(id, (counts.get(id) || 0) + 1);
			});
		});
		return counts;
	}, [openTasks]);

	const continuityEventsByDevice = useMemo(() => {
		const map = new Map<string, any[]>();
		const filteredEvents = resolvedMaintenanceHistory.filter(isContinuityEvent);
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
	}, [resolvedMaintenanceHistory]);

	const deviceRows = useMemo(() => {
		return devices
			.map((device) => {
				const deviceId = String(device.id);
				const linkedOpenTasksForDevice = linkedTasksByDevice.get(deviceId) || [];
				const continuityEvents = continuityEventsByDevice.get(deviceId) || [];
				const latestMaintenance = getLatestMaintenanceEntry(continuityEvents);
				const upcomingMaintenance = getUpcomingMaintenanceDate(
					linkedOpenTasksForDevice,
				);
				const property = propertyById.get(String(device.location?.propertyId || ''));
				const locationLabel = buildLocationLabel(device, propertyNameById, [property]);
				const friendlyName = buildFriendlyDeviceName(device);
				const technicalSubtitle = buildTechnicalSubtitle(device);
				const recentActivity = buildRecentActivity(latestMaintenance);
				const openTaskCount = linkedOpenTaskCountByDevice.get(deviceId) || 0;
				const overdueTaskCount =
					linkedOverdueTaskCountByDevice.get(deviceId) || 0;

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
					openTaskCount,
					overdueTaskCount,
					device,
				};
			})
			.sort((a, b) => {
				if (b.overdueTaskCount !== a.overdueTaskCount) {
					return b.overdueTaskCount - a.overdueTaskCount;
				}
				if (b.openTaskCount !== a.openTaskCount) {
					return b.openTaskCount - a.openTaskCount;
				}
				return a.friendlyName.localeCompare(b.friendlyName);
			});
	}, [
		devices,
		linkedOpenTaskCountByDevice,
		linkedOverdueTaskCountByDevice,
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

	const equipmentGroups = useMemo(() => {
		const groups = new Map<
			EquipmentGroupId,
			Array<(typeof filteredDeviceRows)[number]>
		>();
		equipmentGroupOrder.forEach((groupId) => groups.set(groupId, []));
		filteredDeviceRows.forEach((row) => {
			const groupId = getEquipmentGroupId(row.device);
			groups.get(groupId)?.push(row);
		});
		return equipmentGroupOrder
			.map((groupId) => ({
				id: groupId,
				...equipmentGroupDetails[groupId],
				rows: groups.get(groupId) || [],
			}))
			.filter((group) => group.rows.length > 0);
	}, [filteredDeviceRows]);

	const toggleEquipmentGroup = (groupId: EquipmentGroupId) => {
		setCollapsedEquipmentGroups((current) => ({
			...current,
			[groupId]: !current[groupId],
		}));
	};

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

	const highlightedEquipmentRow = useMemo(() => {
		return (
			deviceRows.find((row) => row.status === 'Broken') ||
			deviceRows.find((row) => row.status === 'Maintenance') ||
			deviceRows.find((row) => row.overdueTaskCount > 0) ||
			deviceRows.find((row) => row.openTaskCount > 0) ||
			deviceRows[0]
		);
	}, [deviceRows]);

	const highlightedEquipmentProperty = highlightedEquipmentRow
		? properties.find(
				(property: any) =>
					String(property.id) === highlightedEquipmentRow.propertyId,
		  )
		: null;
	const highlightedEquipmentPath =
		highlightedEquipmentRow && highlightedEquipmentProperty?.slug
			? `/property/${highlightedEquipmentProperty.slug}/device/${buildDeviceSlug(
					highlightedEquipmentRow.device,
			  )}?from=devices`
			: '';
	const highlightedEquipmentNeedsAttention = highlightedEquipmentRow
		? highlightedEquipmentRow.status === 'Broken' ||
		  highlightedEquipmentRow.status === 'Maintenance' ||
		  highlightedEquipmentRow.overdueTaskCount > 0 ||
		  highlightedEquipmentRow.openTaskCount > 0
		: false;


	if (isLoadingProperties || isLoading) {
		return (
			<LoadingState
				loadingKey='appliance-hub'
				title='Loading equipment'
				message='Preparing your equipment records.'
				steps={[
					'Loading your properties...',
					'Reading equipment information...',
					'Checking upcoming maintenance...',
					'Connecting maintenance history...',
					'Building maintenance insights...',
				]}
			/>
		);
	}

	if (!isLoadingProperties && properties.length === 0) {
		return (
			<AppZeroState
				kind='noProperties'
				context={isSinglePropertyPlan ? 'homeowner' : 'property'}
				actions={[
					{
						label: isSinglePropertyPlan ? 'Add Home' : 'Add Property',
						onClick: () => navigate('/properties?openCreate=1'),
					},
				]}
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
						selectedSpaceIds={deviceFormData.spaceIds}
						onSelectedSpaceIdsChange={(spaceIds) =>
							setDeviceFormData((prev) => ({ ...prev, spaceIds }))
						}
						canManageSpaces={canManageSpaces}
						propertySupplies={selectedPropertySupplies}
						selectedSupplyIds={selectedSupplyIds}
						onSelectedSupplyIdsChange={setSelectedSupplyIds}
						pendingSupplies={pendingSupplies}
						onPendingSuppliesChange={setPendingSupplies}
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
					<StandardAppPageTitle>Equipment Hub</StandardAppPageTitle>
					<StandardAppPageSubtitle>
						{isSinglePropertyPlan
							? 'Maintenance status for every equipment record in this home.'
							: 'Cross-property maintenance status for every equipment record.'}
					</StandardAppPageSubtitle>
				</StandardAppPageTitleBlock>
			</StandardAppPageHeader>

			<EquipmentHero>
				<EquipmentHeroContent>
					<EquipmentHeroEyebrow>Your next equipment recommendation</EquipmentHeroEyebrow>
					<EquipmentHeroTitle>
						{highlightedEquipmentRow
							? highlightedEquipmentNeedsAttention
								? `Your ${highlightedEquipmentRow.friendlyName} needs attention`
								: `Start with your ${highlightedEquipmentRow.friendlyName}`
							: 'Every equipment record at a glance'}
					</EquipmentHeroTitle>
					<EquipmentHeroText>
						{highlightedEquipmentRow
							? `${highlightedEquipmentRow.locationLabel} has ${highlightedEquipmentRow.overdueTaskCount > 0
								? `${highlightedEquipmentRow.overdueTaskCount} overdue linked task${highlightedEquipmentRow.overdueTaskCount === 1 ? '' : 's'}`
								: highlightedEquipmentRow.openTaskCount > 0
									? `${highlightedEquipmentRow.openTaskCount} open linked task${highlightedEquipmentRow.openTaskCount === 1 ? '' : 's'}`
									: `a ${highlightedEquipmentRow.status.toLowerCase()} equipment status`
							}. Keeping equipment records current makes service history easier to trust.`
							: 'Track status, upcoming service, and maintenance history across the equipment connected to your home.'}
					</EquipmentHeroText>
					<EquipmentHeroActions>
						{highlightedEquipmentPath && (
							<EquipmentHeroButton
								type='button'
								onClick={() => navigate(highlightedEquipmentPath)}>
								Open Equipment Profile
							</EquipmentHeroButton>
						)}
						{canManageAppliances && (
							<EquipmentHeroButton
								type='button'
								$variant='secondary'
								onClick={() => navigate('/devices?action=create')}>
								Add Equipment
							</EquipmentHeroButton>
						)}
					</EquipmentHeroActions>
				</EquipmentHeroContent>
				<EquipmentHeroStats>
					<EquipmentHeroStat>
						<EquipmentHeroStatLabel>Total Equipment</EquipmentHeroStatLabel>
						<EquipmentHeroStatValue>{devices.length}</EquipmentHeroStatValue>
					</EquipmentHeroStat>
					<EquipmentHeroStat>
						<EquipmentHeroStatLabel>Needs Attention</EquipmentHeroStatLabel>
						<EquipmentHeroStatValue
							$tone={needsAttentionCount > 0 ? 'danger' : 'success'}>
							{needsAttentionCount}
						</EquipmentHeroStatValue>
					</EquipmentHeroStat>
					<EquipmentHeroStat>
						<EquipmentHeroStatLabel>Due in 30 Days</EquipmentHeroStatLabel>
						<EquipmentHeroStatValue
							$tone={upcomingDueSoonCount > 0 ? 'warning' : 'success'}>
							{upcomingDueSoonCount}
						</EquipmentHeroStatValue>
					</EquipmentHeroStat>
					<EquipmentHeroStat>
						<EquipmentHeroStatLabel>Open Tasks</EquipmentHeroStatLabel>
						<EquipmentHeroStatValue>
							{Array.from(linkedOpenTaskCountByDevice.values()).reduce(
								(total, count) => total + count,
								0,
							)}
						</EquipmentHeroStatValue>
					</EquipmentHeroStat>
				</EquipmentHeroStats>
			</EquipmentHero>

			<FilterBar>
				<SearchInput
					type='text'
					placeholder='Search equipment, brands, or locations...'
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
						<option value=''>{isSinglePropertyPlan ? 'All homes' : 'All properties'}</option>
						{properties.map((p: any) => (
							<option key={p.id} value={String(p.id)}>
								{p.title || 'Untitled Property'}
							</option>
						))}
					</PropertySelect>
				) : null}
				<FilterResultCount>
					{filteredDeviceRows.length} of {deviceRows.length} equipment record{deviceRows.length === 1 ? '' : 's'}
				</FilterResultCount>
			</FilterBar>
			<CompactFilterResultCount>
				Showing {filteredDeviceRows.length} of {deviceRows.length}{' '}
				{deviceRows.length === 1 ? 'equipment record' : 'equipment records'}
			</CompactFilterResultCount>
			<FloatingFilterPanel
				isOpen={isFilterPanelOpen}
				onOpen={openFilterPanel}
				onDismiss={dismissFilterPanel}
				onApply={applyDraftFilters}
				onClearDraft={clearDraftFilters}
				activeFilterCount={activeFilterCount}
				title='Search and filter equipment'
				description='Choose which equipment records you want to see, then apply your changes.'>
				<HubFilterFields>
					{properties.length > 1 && (
						<HubFilterField>
							Property
							<PropertySelect
								value={draftPropertyFilter}
								onChange={(event) =>
									setDraftPropertyFilter(event.target.value)
								}>
								<option value=''>{isSinglePropertyPlan ? 'All homes' : 'All properties'}</option>
								{properties.map((property: any) => (
									<option key={property.id} value={String(property.id)}>
										{property.title || 'Untitled Property'}
									</option>
								))}
							</PropertySelect>
						</HubFilterField>
					)}
					<HubFilterField>
						Search
						<SearchInput
							type='search'
							placeholder='Search equipment, brands, or locations...'
							value={draftSearchQuery}
							onChange={(event) =>
								setDraftSearchQuery(event.target.value)
							}
						/>
					</HubFilterField>
				</HubFilterFields>
				<HubFilterField>
					Status
					<FilterGroup>
						{(
							[
								'All',
								'Active',
								'Maintenance',
								'Broken',
								'Decommissioned',
							] as const
						).map((status) => (
							<FilterButton
								key={status}
								type='button'
								$active={draftStatusFilter === status}
								onClick={() => setDraftStatusFilter(status)}>
								{status}
							</FilterButton>
						))}
					</FilterGroup>
				</HubFilterField>
			</FloatingFilterPanel>

			{!isLoading && filteredDeviceRows.length === 0 ? (
				<AppZeroState
					kind='noApplianceMatches'
					actions={[
						{
							label: 'Clear Filters',
							onClick: clearApplianceFilters,
						},
					]}
				/>
			) : (
				<EquipmentGroupStack>
					{equipmentGroups.map((group) => {
						const isCollapsed = collapsedEquipmentGroups[group.id];
						return (
							<EquipmentGroupSection key={group.id}>
								<EquipmentGroupHeader
									type='button'
									onClick={() => toggleEquipmentGroup(group.id)}
									aria-expanded={!isCollapsed}
									aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.label}`}>
									<EquipmentGroupTitleBlock>
										<EquipmentGroupTitle>{group.label}</EquipmentGroupTitle>
										<EquipmentGroupDescription>
											{group.description}
										</EquipmentGroupDescription>
									</EquipmentGroupTitleBlock>
									<EquipmentGroupMeta>
										<EquipmentGroupBadge>{group.rows.length}</EquipmentGroupBadge>
										<FontAwesomeIcon
											icon={isCollapsed ? faChevronDown : faChevronUp}
											aria-hidden='true'
										/>
									</EquipmentGroupMeta>
								</EquipmentGroupHeader>
								{!isCollapsed && (
									<EquipmentGroupBody>
										<List>
											{group.rows.map((row) => {
						const propertyName =
							propertyNameById.get(row.propertyId) || 'Unknown Property';
						const property = properties.find((p: any) => String(p.id) === row.propertyId);
						const propertySlug = property?.slug || '';
						const locationHref = row.device.location?.suiteId
							? `/property/${propertySlug}/suite/${encodeURIComponent(row.locationLabel)}`
							: '';
						const deviceSlug = buildDeviceSlug(row.device);
						const targetPath = propertySlug
							? `/property/${propertySlug}/device/${deviceSlug}?from=devices`
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
									<Label>Equipment Record</Label>
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
									<Value>Last serviced {formatDate(row.lastServiced)}</Value>
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
									<Value
										style={{
											color:
												row.overdueTaskCount > 0 ? '#b91c1c' : undefined,
											fontWeight:
												row.overdueTaskCount > 0 ? 850 : undefined,
										}}>
										{row.overdueTaskCount > 0
											? `${row.overdueTaskCount} overdue task${row.overdueTaskCount === 1 ? '' : 's'
											}`
											: row.openTaskCount > 0
												? `${row.openTaskCount} open task${row.openTaskCount === 1 ? '' : 's'
												}`
												: 'No open tasks'}
									</Value>
								</Field>
							</DeviceCard>
						);
					})}
										</List>
									</EquipmentGroupBody>
								)}
							</EquipmentGroupSection>
						);
					})}
				</EquipmentGroupStack>
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
					selectedSpaceIds={deviceFormData.spaceIds}
					onSelectedSpaceIdsChange={(spaceIds) =>
						setDeviceFormData((prev) => ({ ...prev, spaceIds }))
					}
					canManageSpaces={canManageSpaces}
					propertySupplies={selectedPropertySupplies}
					selectedSupplyIds={selectedSupplyIds}
					onSelectedSupplyIdsChange={setSelectedSupplyIds}
					pendingSupplies={pendingSupplies}
					onPendingSuppliesChange={setPendingSupplies}
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
