import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCircleCheck,
	faClipboardCheck,
	faClock,
	faCommentDots,
	faEdit,
	faFileInvoiceDollar,
	faFileLines,
	faRepeat,
	faScrewdriverWrench,
	faShieldHalved,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../Redux/store/store';
import {
	useGetPropertiesQuery,
	useGetUnitQuery,
	useGetUnitsQuery,
} from '../../Redux/API/propertySlice';
import {
	useGetDeviceQuery,
	useGetDevicesQuery,
	useUpdateDeviceMutation,
} from '../../Redux/API/deviceSlice';
import { useDeleteTaskMutation, useGetTasksQuery } from '../../Redux/API/taskSlice';
import {
	useAddMaintenanceHistoryMutation,
	useGetMaintenanceHistoryByPropertyQuery,
} from '../../Redux/API/maintenanceSlice';
import {
	useCreateContractorMutation,
	useGetContractorsByPropertyQuery,
} from '../../Redux/API/contractorSlice';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from '../../utils/maintenanceEventUtils';
import { getTaskAssigneeDisplayName } from '../../utils/taskUtils';
import { DetailPageLayout, TabContent, ReusableTable, GenericModal, ButtonGroup, FormInput, FormLabel, FormRow, FormSelect, FormTextarea } from '../../Components/Library';
import { DeviceModal } from '../../Components/Library/Modal';
import { TaskModal } from '../../Components/Library/Modal/TaskModal';
import { TabConfig } from '../../types/DetailPage.types';
import {
	InfoGrid,
	InfoCard,
	InfoLabel,
	InfoValue,
	SectionContainer,
	SectionHeader,
} from '../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../../Components/Library/DataGrid/DataGridStyles';
import {
	calculateCostTotal,
	formatCurrency,
	getFinancialDisplayTotal,
	hasCostData,
	toNumberOrUndefined,
} from '../../utils/financialUtils';
import { uploadDeviceFile } from '../../utils/deviceFileUpload';
import { usePropertyDocumentUploadWorkflow } from '../../propertyKnowledge/usePropertyDocumentUploadWorkflow';
import { COLORS } from '../../constants/colors';
import {
	getDeviceIdFromSlug,
	getDeviceSlugBase,
} from '../../utils/deviceSlug';
import {
	parseDeviceBarcodePayload,
	parsePartBarcodePayload,
} from '../../utils/barcodeScanParser';
import {
	canLinkParts,
	canUseRecurringTasks,
	canTrackWarranties,
} from '../../utils/subscriptionUtils';
import { isNativeApp } from '../../utils/platform';
import { getRoleCapabilities } from '../../utils/permissions';
import { LockedFeatureCallout } from '../../Components/Library/LockedFeatureCallout';
import {
	DeviceServiceItem,
	PropertyDocument,
	PropertyDocumentCategory,
} from '../../types/Property.types';
import {
	DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS,
	DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY,
	buildDeviceServiceItemDetails,
} from '../../constants/deviceServiceItems';
import { BarcodeScannerModal } from '../../Components/Library/BarcodeScanner/BarcodeScannerModal';
import { LoadingState } from '../../Components/LoadingState';
import { PageStack, HeroEditButton, SummaryGrid, SummaryCard, SummaryLabel, SummaryValue, QuickActionPanel, QuickActionHeader, ViewActionsButton, QuickActionGrid, QuickActionButton, QuickActionHint, SectionBlock, SectionEyebrow, SectionTitleStrong, SectionDescription, PhotoActions, ScanButton, PhotoHelperText, PhotoSection, DevicePhotoCard, DevicePhotoImg, PhotoPlaceholder, PhotoActionButton, RemovePhotoButton, MobileCardStack, MobileDetailCard, MobileDetailHeader, MobileDetailTitle, MobileDetailMeta, ActionButton, SubmitButton, CombinedHistoryContainer, TimelineList, TimelineItem, TimelineDate, TimelineDateSub, TimelineContent, TimelineTitleRow, TimelineIconBadge, TimelineTitle, TimelineEventBadge, TimelineDescription, TimelineMeta, TimelineExpandButton, TimelineDetailsPanel, TimelineDetailBlock, TimelineDetailLabel, TimelineDetailValue, TimelineAttachmentList, TimelineAttachmentLink, PartsForm, FormField, DynamicFieldsGrid, PartsTable } from './DeviceDetailPage.styles';

type PartFormState = Omit<DeviceServiceItem, 'id'>;

type DeviceEditFormState = {
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
		usage?: 'appliance_photo' | 'document';
	}>;
};

const formatDate = (value?: string) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString();
};

const formatRelativeTime = (value?: string): string => {
	if (!value) return 'recently';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'recently';

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

const getTimelineEntryKey = (entry: any, index: number): string => {
	if (entry?.id) return String(entry.id);
	if (entry?.raw?.id) return String(entry.raw.id);
	if (entry?.raw?.originalTaskId) return `task-${entry.raw.originalTaskId}`;
	return `${entry?.sourceType || 'timeline'}-${entry?.date || 'no-date'}-${entry?.title || 'event'}-${index}`;
};

const getTimelineAttachments = (entry: any): Array<{ name: string; url?: string }> => {
	const raw = entry?.raw || {};
	const files: Array<{ name: string; url?: string }> = [];

	if (raw.completionFile?.name) {
		files.push({
			name: raw.completionFile.name,
			url: raw.completionFile.url,
		});
	}

	if (raw.completionFileData?.name) {
		files.push({
			name: raw.completionFileData.name,
			url: raw.completionFileData.url,
		});
	}

	if (Array.isArray(raw.attachments)) {
		raw.attachments.forEach((attachment: any) => {
			const name = attachment?.fileName || attachment?.name;
			if (!name) return;
			files.push({ name, url: attachment?.url });
		});
	}

	if (Array.isArray(raw.files)) {
		raw.files.forEach((file: any) => {
			if (!file?.name) return;
			files.push({ name: file.name, url: file.url });
		});
	}

	if (entry?.sourceType === 'device-log') {
		const title = String(entry?.title || '').toLowerCase();
		if (title.includes('document') || title.includes('invoice') || title.includes('warranty')) {
			const detail = String(entry?.description || '').trim();
			if (detail) files.push({ name: detail });
		}
	}

	const deduped = new Map<string, { name: string; url?: string }>();
	files.forEach((file) => {
		const key = `${file.name}::${file.url || ''}`;
		if (!deduped.has(key)) deduped.set(key, file);
	});
	return Array.from(deduped.values());
};

const getTimelineContractorLabel = (entry: any): string => {
	const raw = entry?.raw || {};
	if (raw.assignedTo?.name) return String(raw.assignedTo.name);
	if (raw.assignee) return String(raw.assignee);
	if (raw.completedByName) return String(raw.completedByName);
	if (raw.completedBy) return String(raw.completedBy);
	return 'Not recorded';
};

const getTimelinePartsUsed = (entry: any): string => {
	const raw = entry?.raw || {};
	const parts: string[] = [];

	if (Array.isArray(raw.partsUsed)) {
		raw.partsUsed.forEach((part: any) => {
			if (typeof part === 'string' && part.trim()) parts.push(part.trim());
			if (part && typeof part === 'object' && part.name) parts.push(String(part.name));
		});
	}

	if (Array.isArray(raw.serviceItems)) {
		raw.serviceItems.forEach((item: any) => {
			if (item?.name) parts.push(String(item.name));
		});
	}

	if (parts.length === 0) return 'Not documented';
	return Array.from(new Set(parts)).join(', ');
};

const getTimelineNotes = (entry: any): string => {
	const raw = entry?.raw || {};
	if (raw.completionNotes) return String(raw.completionNotes);
	if (raw.notes) return String(raw.notes);
	if (raw.financials?.notes) return String(raw.financials.notes);
	return 'No additional notes recorded';
};

const getTimelineTitle = (description?: string) => {
	const raw = String(description || '').trim();
	if (!raw) return 'Maintenance event';
	if (raw.toLowerCase().startsWith('document uploaded:')) return 'Document uploaded';
	if (raw.toLowerCase().startsWith('service note added:')) return 'Service note added';
	if (raw.toLowerCase().startsWith('repair logged:')) return 'Repair logged';
	if (raw.toLowerCase().startsWith('warranty uploaded:')) return 'Warranty uploaded';
	if (raw.toLowerCase().startsWith('invoice uploaded:')) return 'Invoice uploaded';
	if (raw.toLowerCase().startsWith('recurring maintenance created:')) return 'Recurring maintenance created';
	if (raw.toLowerCase().startsWith('inspection completed:')) return 'Inspection completed';
	if (raw.toLowerCase().startsWith('task completed:')) return 'Task completed';
	return raw.split(':')[0] || 'Maintenance event';
};

const getTimelineDescription = (description?: string) => {
	const raw = String(description || '').trim();
	if (!raw) return 'Recorded in maintenance history';
	const colonIndex = raw.indexOf(':');
	if (colonIndex === -1) return raw;
	return raw.slice(colonIndex + 1).trim() || raw;
};

type TimelineEventCategory =
	| 'repair'
	| 'invoice'
	| 'inspection'
	| 'recurring'
	| 'scheduled'
	| 'completed'
	| 'warranty'
	| 'document'
	| 'note'
	| 'default';

const getTimelineEventCategory = (entry: { title?: string; description?: string; type?: string }): TimelineEventCategory => {
	const text = `${String(entry.title || '')} ${String(entry.description || '')} ${String(entry.type || '')}`.toLowerCase();
	if (text.includes('repair')) return 'repair';
	if (text.includes('invoice')) return 'invoice';
	if (text.includes('inspection')) return 'inspection';
	if (text.includes('recurring')) return 'recurring';
	if (text.includes('scheduled task') || text.includes('due on') || text.includes('scheduled maintenance')) return 'scheduled';
	if (text.includes('warranty')) return 'warranty';
	if (text.includes('document') || text.includes('upload') || text.includes('file')) return 'document';
	if (text.includes('note')) return 'note';
	if (text.includes('complete') || text.includes('approved') || text.includes('done')) return 'completed';
	return 'default';
};

const getTimelineEventIcon = (category: TimelineEventCategory) => {
	switch (category) {
		case 'repair':
			return { icon: faScrewdriverWrench, color: '#92400e', background: '#fef3c7' };
		case 'invoice':
			return { icon: faFileInvoiceDollar, color: '#1d4ed8', background: '#dbeafe' };
		case 'inspection':
			return { icon: faClipboardCheck, color: COLORS.primaryDark, background: COLORS.primaryLight };
		case 'recurring':
			return { icon: faRepeat, color: '#7c3aed', background: '#ede9fe' };
		case 'scheduled':
			return { icon: faClock, color: '#1d4ed8', background: '#dbeafe' };
		case 'completed':
			return { icon: faCircleCheck, color: COLORS.successDark, background: COLORS.successLight };
		case 'warranty':
			return { icon: faShieldHalved, color: '#1e3a8a', background: '#dbeafe' };
		case 'document':
			return { icon: faFileLines, color: '#334155', background: '#e2e8f0' };
		case 'note':
			return { icon: faCommentDots, color: COLORS.primaryDark, background: COLORS.primaryLight };
		default:
			return { icon: faClock, color: '#475569', background: '#e2e8f0' };
	}
};

const getTimelineEventLabel = (entry: { type?: string; title?: string; description?: string }) => {
	const eventType = String(entry.type || '').toLowerCase();
	const text = `${String(entry.title || '')} ${String(entry.description || '')} ${String(entry.type || '')}`.toLowerCase();

	if (eventType === 'task_completed') return 'Task Completed';
	if (eventType === 'task_approved') return 'Task Approved';
	if (eventType === 'scheduled_task') return 'Scheduled Task';
	if (eventType === 'repair_logged' || text.includes('repair')) return 'Repair Logged';
	if (eventType === 'inspection_completed' || text.includes('inspection')) return 'Inspection';
	if (eventType === 'invoice_uploaded' || text.includes('invoice')) return 'Invoice';
	if (eventType === 'document_uploaded' || text.includes('document')) return 'Document';
	if (eventType === 'service_note_added' || text.includes('note')) return 'Service Note';
	if (eventType === 'maintenance_recorded' || text.includes('recorded')) return 'Recorded';
	if (eventType === 'completed' || text.includes('complete') || text.includes('done')) return 'Completed';
	return 'Event';
};

const sanitizeDeviceServiceItem = (item: DeviceServiceItem): DeviceServiceItem =>
	Object.fromEntries(
		Object.entries(item).filter(([, value]) => value !== undefined),
	) as DeviceServiceItem;

export const DeviceDetailPage: React.FC = () => {
	const { slug, deviceSlug } = useParams<{ slug: string; deviceSlug: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const applianceAction = searchParams.get('action');
	const capturedApplianceActionRef = useRef<string | null>(null);
	const pendingApplianceActionRef = useRef<string | null>(null);
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isMobile = useSelector((state: RootState) => state.app.isMobile);
	const roleCapabilities = useMemo(
		() => getRoleCapabilities(currentUser?.role),
		[currentUser?.role],
	);
	const isTeamMemberAccount = currentUser?.isTeamMemberAccount === true;
	const canManageApplianceActions =
		!isTeamMemberAccount || roleCapabilities.canManageAppliances;
	const canCreateTaskActions =
		!isTeamMemberAccount || roleCapabilities.canCreateTasks;
	const canLogMaintenanceActions =
		!isTeamMemberAccount || roleCapabilities.canManageMaintenanceHistory;
	const canUploadDocumentActions = canLogMaintenanceActions;
	const canAccessParts =
		canManageApplianceActions &&
		!!currentUser?.subscription &&
		canLinkParts(currentUser.subscription);
	const canAccessWarranty =
		!!currentUser?.subscription && canTrackWarranties(currentUser.subscription);
	const canAccessRecurringTasks =
		!!currentUser?.subscription && canUseRecurringTasks(currentUser.subscription as any);
	const photoInputRef = useRef<HTMLInputElement | null>(null);
	const documentInputRef = useRef<HTMLInputElement | null>(null);
	const [showDeviceEditModal, setShowDeviceEditModal] = useState(false);
	const [editingDevice, setEditingDevice] = useState<any>(null);
	const [deviceFormData, setDeviceFormData] = useState<DeviceEditFormState>({
		type: '',
		brand: '',
		model: '',
		serialNumber: '',
		serviceItems: [],
		installationDate: '',
		decommissionDate: '',
		status: 'Active',
		location: {
			propertyId: '',
		},
		files: [],
	});
	const [pendingDeviceFiles, setPendingDeviceFiles] = useState<File[]>([]);
	const [removedExistingFileUrls, setRemovedExistingFileUrls] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<string>('info');
	const [areQuickActionsOpen, setAreQuickActionsOpen] = useState(false);
	const [showTaskModal, setShowTaskModal] = useState(false);
	const [showRecurringTaskModal, setShowRecurringTaskModal] = useState(false);
	const [showPartModal, setShowPartModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState<any | null>(null);
	const [isEditingTask, setIsEditingTask] = useState(false);
	const [showQuickLogModal, setShowQuickLogModal] = useState(false);
	const [quickLogMode, setQuickLogMode] = useState<
		'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor'
	>('note');
	const [quickLogDate, setQuickLogDate] = useState(new Date().toISOString().split('T')[0]);
	const [quickLogDescription, setQuickLogDescription] = useState('');
	const [quickLogAttachment, setQuickLogAttachment] = useState<File | null>(null);
	const [quickLogWarrantyExpiration, setQuickLogWarrantyExpiration] = useState('');
	const [quickLogFinancials, setQuickLogFinancials] = useState({
		contractorCost: '',
		materialsCost: '',
		laborCost: '',
		otherCost: '',
	});
	const [quickLogSelectedContractorId, setQuickLogSelectedContractorId] =
		useState('');
	const [quickLogCreateContractor, setQuickLogCreateContractor] = useState(false);
	const [quickLogNewContractor, setQuickLogNewContractor] = useState({
		name: '',
		company: '',
		category: 'General',
		phone: '',
		email: '',
		notes: '',
	});
	const [isSavingQuickLog, setIsSavingQuickLog] = useState(false);
	const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [isDeviceScanOpen, setIsDeviceScanOpen] = useState(false);
	const [isPartScanOpen, setIsPartScanOpen] = useState(false);
	const [expandedTimelineEntries, setExpandedTimelineEntries] = useState<Record<string, boolean>>({});
	const [partFormData, setPartFormData] = useState<PartFormState>({
		name: '',
		category: 'part',
		details: '',
		partNumber: '',
		size: '',
		manufacturer: '',
		material: '',
		voltage: '',
		mervRating: '',
		compatibility: '',
		replacementInterval: '',
		notes: '',
	});

	const [updateDevice] = useUpdateDeviceMutation();
	const [deleteTask] = useDeleteTaskMutation();
	const [addMaintenanceHistory] = useAddMaintenanceHistoryMutation();
	const [createContractor, { isLoading: isCreatingContractor }] =
		useCreateContractorMutation();
	const { uploadPropertyDocuments } = usePropertyDocumentUploadWorkflow();

	const resetPartForm = () => {
		setPartFormData({
			name: '',
			category: 'part',
			details: '',
			partNumber: '',
			size: '',
			manufacturer: '',
			material: '',
			voltage: '',
			mervRating: '',
			compatibility: '',
			replacementInterval: '',
			notes: '',
		});
	};


	const deviceId = useMemo(() => getDeviceIdFromSlug(deviceSlug), [deviceSlug]);

	const { data: properties = [] } = useGetPropertiesQuery();
	const property = useMemo(
		() => properties.find((item: any) => item.slug === slug),
		[properties, slug],
	);
	const applianceProfileSource = searchParams.get('from')?.toLowerCase() || '';
	const cameFromDevicesHub = ['devices', 'appliances', 'appliance-hub'].includes(
		applianceProfileSource,
	);
	const applianceProfileBackPath = cameFromDevicesHub
		? '/devices'
		: property?.slug
			? `/property/${property.slug}?tab=devices`
			: '/properties';
	const applianceProfileBackLabel = cameFromDevicesHub
		? 'Back to Appliances'
		: 'Back to Property';

	const { data: device, isLoading: deviceLoading } = useGetDeviceQuery(deviceId || '', {
		skip: !deviceId,
	});

	const { data: units = [] } = useGetUnitsQuery(property?.id || '', {
		skip: !property?.id,
	});
	const { data: unitById } = useGetUnitQuery(device?.location?.unitId || '', {
		skip: !device?.location?.unitId,
	});

	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: propertyDevices = [] } = useGetDevicesQuery(property?.id || '', {
		skip: !property?.id,
	});
	const { data: propertyContractors = [] } = useGetContractorsByPropertyQuery(
		property?.id || '',
		{
			skip: !property?.id,
		},
	);
	const { data: propertyMaintenanceHistory = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
			refetchOnMountOrArgChange: true,
		});

	const normalizeIdentifier = (value?: string) =>
		String(value || '')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');

	const locationLabel = useMemo(() => {
		if (!device || !property) return 'N/A';

		if (device.location?.unitId) {
			const unit = units.find(
				(item: any) => String(item.id || '') === String(device.location?.unitId || ''),
			);
			const unitName =
				unit?.name ||
				(unit as any)?.unitName ||
				(unitById as any)?.name ||
				(unitById as any)?.unitName;
			return unitName || 'Property level';
		}

		if (device.location?.suiteId) {
			const suite = (Array.isArray(property.suites) ? property.suites : []).find(
				(item: any) => item.id === device.location.suiteId,
			);
			return suite?.name || 'Property level';
		}

		return 'Property level';
	}, [device, property, unitById, units]);

	const deviceTaskTemplate = useMemo(() => {
		if (!device || !property) return null;
		const deviceName = [device.type, device.brand, device.model]
			.filter(Boolean)
			.join(' ')
			.trim() || 'Appliance';
		return {
			title: `${deviceName} maintenance`,
			dueDate: new Date().toISOString().split('T')[0],
			status: 'Initiated',
			propertyId: property.id,
			unitId: String(device.location?.unitId || ''),
			location: '',
			devices: [String(device.id)],
			priority: 'Medium',
			isRecurring: false,
			notes: `${deviceName} maintenance task created from the appliance page.`,
		};
	}, [device, property]);

	const recurringTaskTemplate = useMemo(() => {
		if (!deviceTaskTemplate) return null;
		return {
			...deviceTaskTemplate,
			title: `${deviceTaskTemplate.title} - recurring`,
			...(canAccessRecurringTasks
				? {
					isRecurring: true,
					recurrenceFrequency: 'monthly',
				}
				: { isRecurring: false }),
		};
	}, [canAccessRecurringTasks, deviceTaskTemplate]);

	const taskUnitOptions = useMemo(() => {
		return units.map((unit: any) => ({
			label: unit.unitName || unit.name || unit.title || 'Unit',
			value: String(unit.id || ''),
		}));
	}, [units]);

	const linkedTasks = useMemo(() => {
		if (!device || !property) return [];
		const deviceIdString = String(device.id);

		return allTasks
			.filter((task: any) => {
				if (task.propertyId !== property.id) return false;
				if (String(task.deviceId || '') === deviceIdString) return true;
				if (Array.isArray(task.devices)) {
					return task.devices.map((id: any) => String(id)).includes(deviceIdString);
				}
				return false;
			})
			.filter((task: any) => String(task.status || '').toLowerCase() !== 'completed');
	}, [allTasks, device, property]);

	const relatedMaintenanceHistory = useMemo(() => {
		if (!device) return [];
		const deviceIdString = String(device.id);

		return propertyMaintenanceHistory
			.filter((record: any) => {
				if (!isContinuityEvent(record)) return false;
				if (String(record.deviceId || '') === deviceIdString) return true;
				if (Array.isArray(record.deviceIds)) {
					return record.deviceIds
						.map((id: any) => String(id))
						.includes(deviceIdString);
				}
				if (Array.isArray(record.devices)) {
					return record.devices
						.map((id: any) => String(id))
						.includes(deviceIdString);
				}
				return false;
			})
			.sort((a: any, b: any) => {
				const aDate = new Date(getMaintenanceEventDate(a) || 0).getTime() || 0;
				const bDate = new Date(getMaintenanceEventDate(b) || 0).getTime() || 0;
				return bDate - aDate;
			});
	}, [device, propertyMaintenanceHistory]);

	const deviceTimelineEntries = useMemo(() => {
		const deviceMaintenanceEntries = Array.isArray(device?.maintenanceHistory)
			? device.maintenanceHistory.map((entry: any, index: number) => ({
				id: `device-log-${entry.date || 'no-date'}-${index}`,
				sourceType: 'device-log',
				date: entry.date,
				title: getTimelineTitle(entry.description),
				description: getTimelineDescription(entry.description),
				type: 'Appliance Log',
				raw: entry,
			}))
			: [];

		const propertyEntries = relatedMaintenanceHistory.map((record: any, index: number) => ({
			id: record.id || record.originalTaskId || `maintenance-record-${index}`,
			sourceType: 'maintenance-record',
			date: getMaintenanceEventDate(record),
			title: getMaintenanceEventTitle(record) || getTimelineTitle(record.description) || 'Maintenance event',
			description:
				record.completionNotes ||
				record.notes ||
				getTimelineDescription(record.description) ||
				record.description ||
				'Maintenance record',
			type: record.eventType || record.status || 'Completed',
			raw: record,
		}));

		return [...deviceMaintenanceEntries, ...propertyEntries].sort((a, b) => {
			const aDate = new Date(a.date || 0).getTime() || 0;
			const bDate = new Date(b.date || 0).getTime() || 0;
			return bDate - aDate;
		});
	}, [device?.maintenanceHistory, relatedMaintenanceHistory]);

	const scheduledTaskTimelineEntries = useMemo(() => {
		return linkedTasks
			.filter((task: any) => {
				const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
				return Boolean(dueDate && !Number.isNaN(dueDate.getTime()));
			})
			.map((task: any) => ({
				id: `scheduled-task-${task.id}`,
				sourceType: 'scheduled-task',
				date: task.dueDate,
				title: task.title || 'Scheduled maintenance task',
				description: `Due on ${formatDate(task.dueDate)}${task.priority ? ` • ${task.priority} priority` : ''}${getTaskAssigneeDisplayName(task, '') ? ` • Assigned to ${getTaskAssigneeDisplayName(task, '')}` : ''}`,
				type: 'scheduled_task',
				raw: task,
			}))
			.sort((a, b) => {
				const aDate = new Date(a.date || 0).getTime() || 0;
				const bDate = new Date(b.date || 0).getTime() || 0;
				return bDate - aDate;
			});
	}, [linkedTasks]);

	const combinedTimelineEntries = useMemo(
		() => [...scheduledTaskTimelineEntries, ...deviceTimelineEntries].sort((a, b) => {
			const aDate = new Date(a.date || 0).getTime() || 0;
			const bDate = new Date(b.date || 0).getTime() || 0;
			return bDate - aDate;
		}),
		[scheduledTaskTimelineEntries, deviceTimelineEntries],
	);

	const applianceMaintenanceFeedRecords = useMemo(() => {
		const records: any[] = [];
		const seenKeys = new Set<string>();

		const getRecordKey = (record: any) => {
			const rawDate = getMaintenanceEventDate(record) || record?.date || '';
			const dateKey = String(rawDate).split('T')[0];
			const textKey = String(
				record?.title ||
				record?.taskTitle ||
				record?.description ||
				record?.completionNotes ||
				'',
			)
				.trim()
				.toLowerCase();
			return `${dateKey}|${textKey}`;
		};

		relatedMaintenanceHistory.forEach((record: any) => {
			const key = getRecordKey(record);
			if (seenKeys.has(key)) return;
			seenKeys.add(key);
			records.push(record);
		});

		if (Array.isArray(device?.maintenanceHistory)) {
			device.maintenanceHistory.forEach((entry: any, index: number) => {
				const record = {
					id: `appliance-log-${entry.date || 'no-date'}-${index}`,
					date: entry.date,
					completionDate: entry.date,
					title: getTimelineTitle(entry.description),
					description: getTimelineDescription(entry.description),
					status: 'Logged',
					sourceType: 'appliance-log',
				};
				const key = getRecordKey(record);
				if (seenKeys.has(key)) return;
				seenKeys.add(key);
				records.push(record);
			});
		}

		return records.sort((a, b) => {
			const aDate = new Date(getMaintenanceEventDate(a) || a?.date || 0).getTime() || 0;
			const bDate = new Date(getMaintenanceEventDate(b) || b?.date || 0).getTime() || 0;
			return bDate - aDate;
		});
	}, [device?.maintenanceHistory, relatedMaintenanceHistory]);

	const deviceFiles = useMemo(() => device?.files || [], [device?.files]);
	const devicePhotoFile = useMemo(
		() =>
			deviceFiles.find((file: any) => file?.usage === 'appliance_photo') ||
			deviceFiles.find(
				(file: any) =>
					!file?.usage && String(file.type || '').startsWith('image/'),
			),
		[deviceFiles],
	);
	const deviceDocumentFiles = useMemo(
		() =>
			deviceFiles.filter(
				(file: any) => !devicePhotoFile || file.url !== devicePhotoFile.url,
			),
		[deviceFiles, devicePhotoFile],
	);
	const serviceParts = device?.serviceItems || [];
	const resolvedDeviceStatus = device?.decommissionDate
		? 'Decommissioned'
		: device?.status || 'Active';
	const hasApplianceDetails = useMemo(() => {
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
	}, [device]);
	const activePartFields = useMemo(
		() =>
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY[partFormData.category] ||
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY.other,
		[partFormData.category],
	);



	const applianceAssignedDocumentEntries = useMemo(() => {
		const all = new Map<
			string,
			{
				name: string;
				url?: string;
				type?: string;
				size?: number;
				date?: string;
				source: 'appliance' | 'maintenance' | 'property';
				sourceLabel?: string;
			}
		>();

		deviceDocumentFiles.forEach((file: any) => {
			if (!file?.name) return;
			const key = `${file.name}::${file.url || ''}`;
			if (!all.has(key)) {
				all.set(key, {
					name: file.name,
					url: file.url,
					type: file.type,
					size: file.size,
					date: file.uploadedAt || file.createdAt,
					source: 'appliance',
				});
			}
		});

		const propertyDocuments = Array.isArray((property as any)?.documents)
			? ((property as any).documents as PropertyDocument[])
			: [];
		propertyDocuments.forEach((document) => {
			const linkedDeviceIds = [
				document.assignedDeviceId,
				...(document.links?.assetIds || []),
			].filter(Boolean);
			const documentName = document.fileName || document.name;
			const documentUrl = document.fileUrl || document.url;
			if (
				!documentName ||
				!linkedDeviceIds.some(
					(linkedDeviceId) => String(linkedDeviceId) === String(device?.id || ''),
				)
			) {
				return;
			}
			const key = `${documentName}::${documentUrl || ''}`;
			if (!all.has(key)) {
				all.set(key, {
					name: documentName,
					url: documentUrl,
					type:
						document.category === 'manual'
							? 'Manual'
							: document.category === 'warranty'
								? 'Warranty'
								: 'Property document',
					size: document.size,
					date: document.uploadedAt,
					source: 'property',
					sourceLabel: 'Property document',
				});
			}
		});

		relatedMaintenanceHistory.forEach((record: any) => {
			const sourceLabel =
				record?.title || record?.taskTitle || record?.description || 'Maintenance record';
			const date = getMaintenanceEventDate(record) || record?.date;
			const attachments = getTimelineAttachments({
				raw: record,
				sourceType: 'maintenance-record',
			});

			attachments.forEach((file) => {
				if (!file?.name) return;
				const key = `${file.name}::${file.url || ''}`;
				if (!all.has(key)) {
					all.set(key, {
						name: file.name,
						url: file.url,
						date,
						source: 'maintenance',
						sourceLabel,
					});
				}
			});
		});

		return Array.from(all.values()).sort((a, b) => {
			const aTime = new Date(a.date || 0).getTime() || 0;
			const bTime = new Date(b.date || 0).getTime() || 0;
			return bTime - aTime;
		});
	}, [device?.id, deviceDocumentFiles, property, relatedMaintenanceHistory]);

	const documentCount = useMemo(
		() => applianceAssignedDocumentEntries.length,
		[applianceAssignedDocumentEntries],
	);

	const repairCount = useMemo(
		() =>
			deviceTimelineEntries.filter((entry) =>
				/repair|fixed|replace|replaced|serviced|service/i.test(
					`${entry.title} ${entry.description}`,
				),
			).length,
		[deviceTimelineEntries],
	);

	const lastServicedEntry = useMemo(() => deviceTimelineEntries[0] || null, [deviceTimelineEntries]);

	const maintenanceEventCount = deviceTimelineEntries.length;

	const toggleTimelineDetails = (entryKey: string) => {
		setExpandedTimelineEntries((prev) => ({
			...prev,
			[entryKey]: !prev[entryKey],
		}));
	};

	const openCreateTaskModal = () => {
		if (!canCreateTaskActions) return;
		if (!deviceTaskTemplate) return;
		setSelectedTask(null);
		setIsEditingTask(false);
		setShowRecurringTaskModal(false);
		setShowTaskModal(true);
	};

	const openEditTaskModal = (task: any) => {
		if (!roleCapabilities.canManageTasks || !task) return;
		setSelectedTask(task);
		setIsEditingTask(true);
		setShowRecurringTaskModal(false);
		setShowTaskModal(true);
	};

	const handleDeleteLinkedTask = async (task: any) => {
		if (!roleCapabilities.canManageTasks || !task?.id) return;
		if (!window.confirm(`Delete the task "${task.title || 'Task'}"?`)) return;
		await deleteTask(task.id).unwrap();
	};

	const openRecurringTaskModal = () => {
		if (!canCreateTaskActions) return;
		if (!canAccessRecurringTasks) return;
		if (!recurringTaskTemplate) return;
		setShowTaskModal(false);
		setShowRecurringTaskModal(true);
	};

	const openQuickLogModal = (
		mode: 'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
	) => {
		if (!canLogMaintenanceActions) {
			return;
		}
		setQuickLogMode(mode);
		setQuickLogDescription('');
		setQuickLogDate(new Date().toISOString().split('T')[0]);
		setQuickLogAttachment(null);
		setQuickLogWarrantyExpiration('');
		setQuickLogFinancials({
			contractorCost: '',
			materialsCost: '',
			laborCost: '',
			otherCost: '',
		});
		setQuickLogSelectedContractorId('');
		setQuickLogCreateContractor(false);
		setQuickLogNewContractor({
			name: '',
			company: '',
			category: 'General',
			phone: '',
			email: '',
			notes: '',
		});
		setShowQuickLogModal(true);
	};

	const handleSaveQuickLog = async () => {
		if (!canLogMaintenanceActions) return;
		if (!device || !property || !quickLogDescription.trim()) return;
		setIsSavingQuickLog(true);
		try {
			const prefixMap: Record<
				'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
				string
			> = {
				'repair': 'Repair logged:',
				'note': 'Service note added:',
				'invoice': 'Invoice uploaded:',
				'inspection': 'Inspection completed:',
				'warranty': 'Warranty added:',
				'contractor': 'Contractor visit logged:',
			};
			const eventMap: Record<
				'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
				| 'maintenance_recorded'
				| 'service_note_added'
				| 'repair_logged'
				| 'invoice_uploaded'
				| 'inspection_completed'
				| 'warranty_added'
				| 'contractor_visit_logged'
			> = {
				'repair': 'repair_logged',
				'note': 'service_note_added',
				'invoice': 'invoice_uploaded',
				'inspection': 'inspection_completed',
				'warranty': 'warranty_added',
				'contractor': 'contractor_visit_logged',
			};
			const sourceMap: Record<
				'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
				'device_log' | 'manual_entry' | 'contractor_entry'
			> = {
				'repair': 'device_log',
				'note': 'device_log',
				'invoice': 'device_log',
				'inspection': 'device_log',
				'warranty': 'manual_entry',
				'contractor': 'contractor_entry',
			};
			const descriptionPrefix = prefixMap[quickLogMode];
			const summaryDescription = quickLogDescription.trim();
			let descriptionText = summaryDescription;

			const shouldCaptureFinancials =
				quickLogMode === 'repair' ||
				quickLogMode === 'invoice' ||
				quickLogMode === 'inspection';
			const financialActual = {
				contractorCost: toNumberOrUndefined(quickLogFinancials.contractorCost),
				materialsCost: toNumberOrUndefined(quickLogFinancials.materialsCost),
				laborCost: toNumberOrUndefined(quickLogFinancials.laborCost),
				otherCost: toNumberOrUndefined(quickLogFinancials.otherCost),
			};
			const financials =
				shouldCaptureFinancials && hasCostData(financialActual)
					? {
						currency: 'USD',
						actual: financialActual,
					}
					: undefined;

			let completedBy: string | undefined;
			let completedByName: string | undefined;

			if (quickLogMode === 'contractor') {
				const selectedContractor = propertyContractors.find(
					(contractor: any) => contractor.id === quickLogSelectedContractorId,
				);

				if (quickLogCreateContractor) {
					const contractorName = quickLogNewContractor.name.trim();
					if (!contractorName) {
						setIsSavingQuickLog(false);
						return;
					}

					const createdContractor = await createContractor({
						propertyId: property.id,
						name: contractorName,
						company: quickLogNewContractor.company.trim() || contractorName,
						category: quickLogNewContractor.category.trim() || 'General',
						phone: quickLogNewContractor.phone.trim() || 'Not provided',
						email: quickLogNewContractor.email.trim(),
						notes: quickLogNewContractor.notes.trim(),
					}).unwrap();

					completedBy = createdContractor?.id;
					completedByName = createdContractor?.name || contractorName;
				} else if (selectedContractor) {
					completedBy = selectedContractor.id;
					completedByName = selectedContractor.name;
				}

				if (completedByName) {
					descriptionText = `${descriptionText}\n\nContractor: ${completedByName}`;
				}
			}

			if (quickLogMode === 'warranty' && quickLogWarrantyExpiration) {
				descriptionText = `${descriptionText}\n\nWarranty expiration: ${quickLogWarrantyExpiration}`;
			}

			const supportsAttachment =
				quickLogMode === 'note' ||
				quickLogMode === 'contractor' ||
				(quickLogMode === 'warranty' && canAccessWarranty);

			await addMaintenanceHistory({
				propertyId: property.id,
				propertyTitle: property.title,
				title: `${descriptionPrefix} ${summaryDescription}`,
				description: descriptionText,
				completionDate: new Date(quickLogDate).toISOString(),
				completedBy,
				completedByName,
				unitId: device.location?.unitId,
				deviceIds: [device.id],
				completionFile: supportsAttachment ? quickLogAttachment || undefined : undefined,
				financials,
				eventType: eventMap[quickLogMode],
				eventSource: sourceMap[quickLogMode],
				tags: [
					'device',
					quickLogMode,
					...(completedBy ? ['contractor-linked'] : []),
					...(quickLogMode === 'warranty' && quickLogWarrantyExpiration
						? ['warranty-expiration']
						: []),
				],
			}).unwrap();

			const nextEntries = [
				{
					date: quickLogDate,
					description: `${descriptionPrefix} ${summaryDescription}`,
				},
				...(Array.isArray(device.maintenanceHistory) ? device.maintenanceHistory : []),
			];
			await updateDevice({
				id: device.id,
				updates: { maintenanceHistory: nextEntries },
			}).unwrap();
			setShowQuickLogModal(false);
		} finally {
			setIsSavingQuickLog(false);
		}
	};

	const handleRecurringTaskSaved = async () => {
		if (!canCreateTaskActions) {
			setShowRecurringTaskModal(false);
			return;
		}
		if (!device) {
			setShowRecurringTaskModal(false);
			return;
		}
		try {
			const deviceName = [device.type, device.brand, device.model]
				.filter(Boolean)
				.join(' ')
				.trim() || 'Appliance';
			const nextEntries = [
				{
					date: new Date().toISOString(),
					description: `Recurring maintenance created: ${deviceName}`,
				},
				...(Array.isArray(device.maintenanceHistory) ? device.maintenanceHistory : []),
			];
			await updateDevice({
				id: device.id,
				updates: { maintenanceHistory: nextEntries },
			}).unwrap();
		} finally {
			setShowRecurringTaskModal(false);
		}
	};

	const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!canUploadDocumentActions) {
			if (documentInputRef.current) {
				documentInputRef.current.value = '';
			}
			return;
		}
		if (!file || !device || !property) return;
		try {
			const isWarrantyDocument = /warranty|guarantee/i.test(file.name) && canAccessWarranty;
			const documentCategory: PropertyDocumentCategory = isWarrantyDocument
				? 'warranty'
				: 'other';

			await uploadPropertyDocuments({
				property,
				propertyId: property.id,
				batches: [
					{
						files: [file],
						category: documentCategory,
						systems: [device],
						uploadContext: {
							assetIds: [String(device.id)],
						},
					},
				],
			});
		} finally {
			if (documentInputRef.current) {
				documentInputRef.current.value = '';
			}
		}
	};

	const resetDeviceEditState = () => {
		setEditingDevice(null);
		setPendingDeviceFiles([]);
		setRemovedExistingFileUrls([]);
		setDeviceFormData({
			type: device?.type || '',
			brand: device?.brand || '',
			model: device?.model || '',
			serialNumber: device?.serialNumber || '',
			serviceItems: device?.serviceItems || [],
			installationDate: device?.installationDate || '',
			decommissionDate: device?.decommissionDate || '',
			status: device?.decommissionDate ? 'Decommissioned' : device?.status || 'Active',
			location: device?.location || { propertyId: property?.id || '' },
			files: deviceDocumentFiles,
		});
	};

	const handleOpenEditDeviceModal = () => {
		if (!canManageApplianceActions) return;
		if (!device || !property) return;
		setEditingDevice(device);
		setDeviceFormData({
			type: device.type || '',
			brand: device.brand || '',
			model: device.model || '',
			serialNumber: device.serialNumber || '',
			serviceItems: device.serviceItems || [],
			installationDate: device.installationDate || '',
			decommissionDate: device.decommissionDate || '',
			status: device.decommissionDate ? 'Decommissioned' : device.status || 'Active',
			location: device.location || { propertyId: property.id },
			files: deviceDocumentFiles,
		});
		setPendingDeviceFiles([]);
		setRemovedExistingFileUrls([]);
		setShowDeviceEditModal(true);
	};

	const handleCloseEditDeviceModal = () => {
		setShowDeviceEditModal(false);
		resetDeviceEditState();
	};

	const handleDeviceFormChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = event.target;

		if (name.startsWith('location.')) {
			const locationField = name.split('.')[1];
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
			if (name === 'decommissionDate') {
				return {
					...prev,
					decommissionDate: value,
					status: value ? 'Decommissioned' : prev.status === 'Decommissioned' ? 'Active' : prev.status,
				};
			}

			if (name === 'status' && value !== 'Decommissioned') {
				return {
					...prev,
					status: value as DeviceEditFormState['status'],
					decommissionDate: '',
				};
			}

			return {
				...prev,
				[name]: value,
			};
		});
	};

	const handleSaveDeviceEdit = async () => {
		if (!canManageApplianceActions) return;
		if (!device || !property || !editingDevice) return;

		try {
			const persistedFiles = (deviceFormData.files || []).filter(
				(file) => !removedExistingFileUrls.includes(file.url),
			);
			const nextFiles = devicePhotoFile
				? [devicePhotoFile, ...persistedFiles]
				: persistedFiles;

			await updateDevice({
				id: editingDevice.id,
				updates: {
					...deviceFormData,
					type: deviceFormData.type.trim(),
					brand: deviceFormData.brand.trim(),
					model: deviceFormData.model.trim(),
					serialNumber: deviceFormData.serialNumber?.trim() || '',
					status: deviceFormData.decommissionDate
						? 'Decommissioned'
						: deviceFormData.status,
					files: nextFiles,
				},
			}).unwrap();

			if (pendingDeviceFiles.length > 0) {
				await uploadPropertyDocuments({
					property,
					propertyId: property.id,
					batches: [
						{
							files: pendingDeviceFiles,
							category: 'other',
							systems: [editingDevice],
							uploadContext: {
								assetIds: [String(editingDevice.id)],
							},
						},
					],
				});
			}

			setShowDeviceEditModal(false);
			resetDeviceEditState();
		} catch (error) {
			console.error('Failed to save appliance edits:', error);
		}
	};

	const tabs: TabConfig[] = [
		{ id: 'info' as any, label: 'Details' },
		{ id: 'tasks' as any, label: 'Tasks', count: linkedTasks.length },
		{
			id: 'history' as any,
			label: 'History',
			count: combinedTimelineEntries.length,
		},
		{ id: 'documents' as any, label: 'Documents', count: documentCount },
		{ id: 'parts' as any, label: 'Parts', count: serviceParts.length },
	];

	const handleAddPart = async () => {
		if (!canManageApplianceActions || !canAccessParts) return;
		if (!device || !partFormData.name.trim()) return;

		const newPart = sanitizeDeviceServiceItem({
			id: `${Date.now()}`,
			name: partFormData.name.trim(),
			category: partFormData.category,
			details: buildDeviceServiceItemDetails(partFormData) || undefined,
			partNumber: partFormData.partNumber?.trim() || undefined,
			size: partFormData.size?.trim() || undefined,
			manufacturer: partFormData.manufacturer?.trim() || undefined,
			material: partFormData.material?.trim() || undefined,
			voltage: partFormData.voltage?.trim() || undefined,
			mervRating: partFormData.mervRating?.trim() || undefined,
			compatibility: partFormData.compatibility?.trim() || undefined,
			replacementInterval: partFormData.replacementInterval?.trim() || undefined,
			notes: partFormData.notes?.trim() || undefined,
		});

		const updatedParts = [...serviceParts, newPart].map(sanitizeDeviceServiceItem);
		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts },
		}).unwrap();

		resetPartForm();
	};

	const handleUpdatePart = async () => {
		if (!canManageApplianceActions || !canAccessParts) return;
		if (!device || editingPartIndex === null || !partFormData.name.trim()) return;

		const updatedParts = [...serviceParts];
		updatedParts[editingPartIndex] = sanitizeDeviceServiceItem({
			...serviceParts[editingPartIndex],
			name: partFormData.name.trim(),
			category: partFormData.category,
			details: buildDeviceServiceItemDetails(partFormData) || undefined,
			partNumber: partFormData.partNumber?.trim() || undefined,
			size: partFormData.size?.trim() || undefined,
			manufacturer: partFormData.manufacturer?.trim() || undefined,
			material: partFormData.material?.trim() || undefined,
			voltage: partFormData.voltage?.trim() || undefined,
			mervRating: partFormData.mervRating?.trim() || undefined,
			compatibility: partFormData.compatibility?.trim() || undefined,
			replacementInterval: partFormData.replacementInterval?.trim() || undefined,
			notes: partFormData.notes?.trim() || undefined,
		});

		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts.map(sanitizeDeviceServiceItem) },
		}).unwrap();

		resetPartForm();
		setEditingPartIndex(null);
	};

	const handleDeletePart = async (index: number) => {
		if (!canManageApplianceActions || !canAccessParts) return;
		if (!device) return;

		const updatedParts = serviceParts
			.filter((_: any, i: number) => i !== index)
			.map(sanitizeDeviceServiceItem);
		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts },
		}).unwrap();
	};

	const handleEditPart = (index: number) => {
		if (!canManageApplianceActions || !canAccessParts) return;
		const part = serviceParts[index];
		setPartFormData({
			name: part.name || '',
			category: part.category || 'part',
			details: part.details || '',
			partNumber: part.partNumber || '',
			size: part.size || '',
			manufacturer: part.manufacturer || '',
			material: part.material || '',
			voltage: part.voltage || '',
			mervRating: part.mervRating || '',
			compatibility: part.compatibility || '',
			replacementInterval: part.replacementInterval || '',
			notes: part.notes || '',
		});
		setEditingPartIndex(index);
	};

	const handleDeviceBarcodeDetected = async (rawValue: string) => {
		if (!canManageApplianceActions) return;
		if (!device) return;
		const parsed = parseDeviceBarcodePayload(rawValue);
		const updates: any = {};

		const scannedSerial = normalizeIdentifier(parsed.serialNumber || rawValue);
		const scannedPart = normalizeIdentifier(parsed.partNumber || rawValue);
		const matchingDevice = propertyDevices.find((candidate: any) => {
			if (!candidate || String(candidate.id) === String(device.id)) return false;
			const candidateSerial = normalizeIdentifier(candidate.serialNumber);
			const candidatePart = normalizeIdentifier(candidate.partNumber);
			return (
				(!!scannedSerial && !!candidateSerial && scannedSerial === candidateSerial) ||
				(!!scannedPart && !!candidatePart && scannedPart === candidatePart)
			);
		});

		if (parsed.type || matchingDevice?.type) updates.type = parsed.type || matchingDevice?.type;
		if (parsed.brand || matchingDevice?.brand) updates.brand = parsed.brand || matchingDevice?.brand;
		if (parsed.model || matchingDevice?.model) updates.model = parsed.model || matchingDevice?.model;
		if (parsed.serialNumber) updates.serialNumber = parsed.serialNumber;
		if (parsed.partNumber) updates.partNumber = parsed.partNumber;
		if (parsed.filterSize || matchingDevice?.filterSize) {
			updates.filterSize = parsed.filterSize || matchingDevice?.filterSize;
		}
		if (parsed.specNotes) {
			updates.specNotes = matchingDevice
				? `${parsed.specNotes} | Matched existing appliance: ${matchingDevice.type || 'Appliance'} ${matchingDevice.brand || ''} ${matchingDevice.model || ''}`.trim()
				: parsed.specNotes;
			updates.notes = parsed.specNotes;
		}

		if (Object.keys(updates).length === 0) return;
		await updateDevice({ id: device.id, updates });
	};

	const handlePartBarcodeDetected = (rawValue: string) => {
		if (!canManageApplianceActions || !canAccessParts) return;
		const parsed = parsePartBarcodePayload(rawValue);
		setPartFormData((prev) => ({
			...prev,
			name: parsed.name || prev.name,
			category: parsed.category || prev.category,
			details: parsed.details || prev.details,
			partNumber: parsed.partNumber || prev.partNumber,
			size: parsed.size || prev.size,
			manufacturer: parsed.manufacturer || prev.manufacturer,
			material: parsed.material || prev.material,
			voltage: parsed.voltage || prev.voltage,
			mervRating: parsed.mervRating || prev.mervRating,
			compatibility: parsed.compatibility || prev.compatibility,
			replacementInterval: parsed.replacementInterval || prev.replacementInterval,
			notes: parsed.notes || prev.notes,
		}));
	};

	const handleSelectPhotoClick = () => {
		if (!canManageApplianceActions) return;
		photoInputRef.current?.click();
	};

	const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!canManageApplianceActions) {
			if (photoInputRef.current) {
				photoInputRef.current.value = '';
			}
			return;
		}
		if (!file || !device || !property) return;
		if (!String(file.type || '').startsWith('image/')) return;

		try {
			setIsUploadingPhoto(true);
			const uploaded = await uploadDeviceFile(file, property.id, device.id);
			const photoFile = {
				...uploaded,
				usage: 'appliance_photo' as const,
			};
			const filesWithoutPreviousPhoto = (device.files || []).filter(
				(existing: any) =>
					!devicePhotoFile || existing.url !== devicePhotoFile.url,
			);
			await updateDevice({
				id: device.id,
				updates: { files: [photoFile, ...filesWithoutPreviousPhoto] },
			});
		} finally {
			setIsUploadingPhoto(false);
			if (photoInputRef.current) {
				photoInputRef.current.value = '';
			}
		}
	};

	const handleRemovePhoto = async () => {
		if (!canManageApplianceActions) return;
		if (!device || !devicePhotoFile) return;
		const nextFiles = (device.files || []).filter(
			(file: any) => file.url !== devicePhotoFile.url,
		);
		await updateDevice({
			id: device.id,
			updates: { files: nextFiles },
		});
	};

	useEffect(() => {
		if (applianceAction) {
			if (capturedApplianceActionRef.current !== applianceAction) {
				capturedApplianceActionRef.current = applianceAction;
				pendingApplianceActionRef.current = applianceAction;

				const nextSearchParams = new URLSearchParams(searchParams);
				nextSearchParams.delete('action');
				setSearchParams(nextSearchParams, { replace: true });
			}
		} else {
			capturedApplianceActionRef.current = null;
		}

		const pendingAction = pendingApplianceActionRef.current;
		if (!pendingAction || !device || !property) return;
		pendingApplianceActionRef.current = null;

		switch (pendingAction) {
			case 'add_part':
				if (!canManageApplianceActions || !canAccessParts) break;
				setPartFormData({
					name: '',
					category: 'part',
					details: '',
					partNumber: '',
					size: '',
					manufacturer: '',
					material: '',
					voltage: '',
					mervRating: '',
					compatibility: '',
					replacementInterval: '',
					notes: '',
				});
				setShowPartModal(true);
				break;
			case 'add-task':
				if (!canCreateTaskActions || !deviceTaskTemplate) break;
				setSelectedTask(null);
				setIsEditingTask(false);
				setShowRecurringTaskModal(false);
				setShowTaskModal(true);
				break;
			case 'upload-document':
				if (!canUploadDocumentActions) break;
				setActiveTab('documents');
				documentInputRef.current?.click();
				break;
			case 'add-log':
				if (!canLogMaintenanceActions) break;
				setQuickLogMode('note');
				setQuickLogDescription('');
				setQuickLogDate(new Date().toISOString().split('T')[0]);
				setQuickLogAttachment(null);
				setQuickLogWarrantyExpiration('');
				setQuickLogFinancials({
					contractorCost: '',
					materialsCost: '',
					laborCost: '',
					otherCost: '',
				});
				setQuickLogSelectedContractorId('');
				setQuickLogCreateContractor(false);
				setQuickLogNewContractor({
					name: '',
					company: '',
					category: 'General',
					phone: '',
					email: '',
					notes: '',
				});
				setShowQuickLogModal(true);
				break;
			default:
				break;
		}
	}, [
		applianceAction,
		canAccessParts,
		canCreateTaskActions,
		canLogMaintenanceActions,
		canManageApplianceActions,
		canUploadDocumentActions,
		device,
		deviceDocumentFiles,
		deviceTaskTemplate,
		property,
		searchParams,
		setSearchParams,
	]);

	if (!slug || !deviceId) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Invalid appliance link</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	if (!property) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Property not found</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	if (deviceLoading) {
		return (
			<LoadingState
				loadingKey='appliance-detail'
				title='Loading appliance'
				message='Preparing this appliance record.'
				steps={[
					'Reading appliance information...',
					'Connecting maintenance history...',
					'Indexing warranties...',
					'Looking for missing documentation...',
					'Building maintenance insights...',
				]}
			/>
		);
	}

	if (!device || device.location?.propertyId !== property.id) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Appliance not found for this property</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	const prettyDeviceSlug = getDeviceSlugBase({
		type: device.type,
		brand: device.brand,
		model: device.model,
	});

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	return (
		<DetailPageLayout
			title={device.type || 'Appliance'}
			subtitle={`${property.title} • ${property.slug}`}
			badge={prettyDeviceSlug}
			backPath={applianceProfileBackPath}
			backLabel={applianceProfileBackLabel}
			headerTheme='slate'
			contentMaxWidth='100%'
			topRightActions={
				canManageApplianceActions ? (
					<HeroEditButton
						type='button'
						aria-label='Edit appliance'
						title='Edit appliance'
						onClick={handleOpenEditDeviceModal}>
						<FontAwesomeIcon icon={faEdit} aria-hidden='true' />
					</HeroEditButton>
				) : undefined
			}
			compactTabs
			tabs={tabs}
			activeTab={activeTab}
			onTabChange={handleTabChange}>
			<PageStack>
				<SummaryGrid>
					<SummaryCard>
						<SummaryLabel>Maintenance Events Recorded</SummaryLabel>
						<SummaryValue>{maintenanceEventCount}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Last Maintenance Event</SummaryLabel>
						<SummaryValue style={{ fontSize: 18, lineHeight: 1.3 }}>
							{lastServicedEntry ? formatDate(lastServicedEntry.date) : 'Not yet'}
						</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Repairs Documented</SummaryLabel>
						<SummaryValue>{repairCount}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Documents Stored</SummaryLabel>
						<SummaryValue>{documentCount}</SummaryValue>
					</SummaryCard>
				</SummaryGrid>

				{(canManageApplianceActions ||
					canCreateTaskActions ||
					canUploadDocumentActions ||
					canLogMaintenanceActions) && (
						<QuickActionPanel id='appliance-quick-actions'>
							<QuickActionHeader>
								<div>
									<h3>Quick Actions</h3>
									<p>Keep this appliance moving with the next maintenance step.</p>
								</div>
								<ViewActionsButton
									type='button'
									aria-expanded={areQuickActionsOpen}
									aria-controls='appliance-quick-action-list'
									onClick={() => setAreQuickActionsOpen((isOpen) => !isOpen)}>
									{areQuickActionsOpen ? 'Hide Actions' : 'View Actions'}
								</ViewActionsButton>
							</QuickActionHeader>
							{areQuickActionsOpen && (
								<>
									<QuickActionGrid id='appliance-quick-action-list'>
										{canCreateTaskActions && (
											<>
												<QuickActionButton type='button' onClick={openCreateTaskModal}>
													<strong>Create Task</strong>
													<span>Turn this appliance into a tracked maintenance job.</span>
												</QuickActionButton>
												<QuickActionButton
													type='button'
													onClick={openRecurringTaskModal}
													disabled={!canAccessRecurringTasks}>
													<strong>Add Recurring Maintenance</strong>
													<span>
														{canAccessRecurringTasks
															? 'Set ongoing care for filters, service, and inspections.'
															: 'Homeowner+ feature for ongoing care schedules.'}
													</span>
												</QuickActionButton>
											</>
										)}
										{canUploadDocumentActions && (
											<QuickActionButton type='button' onClick={() => documentInputRef.current?.click()}>
												<strong>Upload Invoice / Document</strong>
												<span>Store proof of service, receipts, or manuals here.</span>
											</QuickActionButton>
										)}
										{canLogMaintenanceActions && (
											<>
												<QuickActionButton type='button' onClick={() => openQuickLogModal('note')}>
													<strong>Add Service Note</strong>
													<span>Capture context that should travel with the system.</span>
												</QuickActionButton>
												<QuickActionButton type='button' onClick={() => openQuickLogModal('repair')}>
													<strong>Log Repair</strong>
													<span>Write a repair entry directly into the maintenance trail.</span>
												</QuickActionButton>
												<QuickActionButton type='button' onClick={() => openQuickLogModal('invoice')}>
													<strong>Log Invoice</strong>
													<span>Record invoice details in the maintenance history.</span>
												</QuickActionButton>
												<QuickActionButton type='button' onClick={() => openQuickLogModal('inspection')}>
													<strong>Log Inspection</strong>
													<span>Document findings and recommendations from inspections.</span>
												</QuickActionButton>
												<QuickActionButton
													type='button'
													onClick={() => openQuickLogModal('warranty')}
													title={undefined}>
													<strong>Log Warranty</strong>
													<span>
														{canAccessWarranty
															? 'Capture coverage terms, expiration details, and warranty documents.'
															: isTeamMemberAccount
																? 'Capture warranty dates and notes. Document uploads depend on your role.'
																: isNativeApp()
																	? 'Capture expiration dates and notes. Manage document access in the web account center.'
																	: 'Capture expiration dates and notes. Upgrade to attach warranty documents.'}
													</span>
												</QuickActionButton>
												<QuickActionButton type='button' onClick={() => openQuickLogModal('contractor')}>
													<strong>Log Contractor Visit</strong>
													<span>Document who visited, what they found, and next steps.</span>
												</QuickActionButton>
											</>
										)}
									</QuickActionGrid>
									<QuickActionHint>
										These actions all feed the same service history so the appliance becomes more useful over time.
									</QuickActionHint>
								</>
							)}
						</QuickActionPanel>
					)}
				{canUploadDocumentActions && (
					<input
						ref={documentInputRef}
						type='file'
						accept='image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'
						onChange={handleDocumentUpload}
						style={{ display: 'none' }}
					/>
				)}

				{activeTab === 'info' && (
					<TabContent>
						<SectionContainer>
							<SectionBlock>
								<SectionEyebrow>Appliance Information</SectionEyebrow>
								<SectionTitleStrong>Core Profile and Warranty Context</SectionTitleStrong>
								<SectionDescription>
									Keep this profile current so linked tasks, service records, and documents stay actionable.
								</SectionDescription>
							</SectionBlock>
							{canManageApplianceActions && (
								<PhotoActions style={{ marginBottom: 14 }}>
									<ScanButton type='button' onClick={() => setIsDeviceScanOpen(true)}>
										Scan Appliance Barcode
									</ScanButton>
									<PhotoHelperText>
										Use barcode/QR scan to auto-fill appliance type, brand, model, and serial when available.
									</PhotoHelperText>
								</PhotoActions>
							)}

							<PhotoSection>
								<DevicePhotoCard>
									{devicePhotoFile?.url ? (
										<DevicePhotoImg src={devicePhotoFile.url} alt={`${device.type || 'Appliance'} photo`} />
									) : (
										<PhotoPlaceholder>No appliance photo selected</PhotoPlaceholder>
									)}
								</DevicePhotoCard>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
									<SectionHeader style={{ marginBottom: 4 }}>Appliance Photo</SectionHeader>
									<PhotoHelperText>
										Add a clear photo for quick recognition. This appears in the appliance profile.
									</PhotoHelperText>
									<PhotoActions>
										<PhotoActionButton
											type='button'
											onClick={handleSelectPhotoClick}
											disabled={isUploadingPhoto}>
											{isUploadingPhoto
												? 'Uploading...'
												: devicePhotoFile
													? 'Replace Photo'
													: 'Upload Photo'}
										</PhotoActionButton>
										{devicePhotoFile && (
											<RemovePhotoButton type='button' onClick={handleRemovePhoto}>
												Remove Photo
											</RemovePhotoButton>
										)}
										<input
											ref={photoInputRef}
											type='file'
											accept='image/*'
											onChange={handlePhotoUpload}
											style={{ display: 'none' }}
										/>
									</PhotoActions>
								</div>
							</PhotoSection>

							<SectionHeader>Appliance Information</SectionHeader>
							{!hasApplianceDetails && (
								<InfoCard style={{ borderColor: '#fde68a', background: '#fefce8' }}>
									<InfoLabel>Profile Details</InfoLabel>
									<InfoValue style={{ color: '#854d0e' }}>
										No details added yet. This appliance can still be linked to tasks now and filled in later.
									</InfoValue>
								</InfoCard>
							)}
							<InfoGrid>
								<InfoCard>
									<InfoLabel>Name</InfoLabel>
									<InfoValue>{device.type || 'N/A'}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Brand</InfoLabel>
									<InfoValue>{device.brand || 'N/A'}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Model</InfoLabel>
									<InfoValue>{device.model || 'N/A'}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Serial Number</InfoLabel>
									<InfoValue>{device.serialNumber || 'N/A'}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Status</InfoLabel>
									<InfoValue>{resolvedDeviceStatus}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Installed</InfoLabel>
									<InfoValue>{formatDate(device.installationDate)}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Decommissioned</InfoLabel>
									<InfoValue>{formatDate(device.decommissionDate)}</InfoValue>
								</InfoCard>
								<InfoCard>
									<InfoLabel>Location</InfoLabel>
									<InfoValue>{locationLabel}</InfoValue>
								</InfoCard>
							</InfoGrid>

							{device.notes && (
								<InfoCard>
									<InfoLabel>Notes</InfoLabel>
									<InfoValue>{device.notes}</InfoValue>
								</InfoCard>
							)}

						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'documents' && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Appliance Documents ({documentCount})</SectionHeader>
							<InfoCard style={{ marginBottom: 12 }}>
								<InfoLabel>Appliance-Assigned Files</InfoLabel>
								<InfoValue>
									This tab shows documents directly assigned to this appliance or system.
								</InfoValue>
							</InfoCard>
							{applianceAssignedDocumentEntries.length > 0 ? (
								<div style={{ display: 'grid', gap: 10 }}>
									{applianceAssignedDocumentEntries.map((file: any, index: number) => (
										<div
											key={`${file.name}-${file.url || 'no-url'}-${index}`}
											style={{
												background: '#ffffff',
												border: '1px solid #e2e8f0',
												borderRadius: 10,
												padding: '12px 14px',
												display: 'grid',
												gap: 6,
											}}>
											{file.url ? (
												<a href={file.url} target='_blank' rel='noopener noreferrer'>
													{file.name}
												</a>
											) : (
												<div style={{ fontWeight: 600, color: '#1f2937' }}>{file.name}</div>
											)}
											<div style={{ fontSize: 12, color: '#64748b' }}>
												{file.source === 'maintenance'
													? file.sourceLabel || 'Maintenance record'
													: file.type || 'Appliance file'}
												{typeof file.size === 'number' ? ` • ${(file.size / 1024).toFixed(1)} KB` : ''}
												{file.date
													? ` • ${formatDate(file.date)}`
													: ''}
											</div>
										</div>
									))}
								</div>
							) : (
								<EmptyState>
									<p>No documents assigned to this appliance yet.</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'tasks' && (
					<TabContent>
						{/* <UpcomingCareCard>
						<UpcomingCareHeader>
							<UpcomingCareTitle>Upcoming Care</UpcomingCareTitle>
							<UpcomingCareLink onClick={() => setActiveTab('history')}>View Timeline →</UpcomingCareLink>
						</UpcomingCareHeader>
						<UpcomingCareRows>
							<UpcomingCareRow $tone={overdueTasksCount > 0 ? 'error' : 'success'}>
								{overdueTasksCount > 0
									? `${overdueTasksCount} overdue maintenance item${overdueTasksCount === 1 ? '' : 's'}`
									: 'No overdue items'}
							</UpcomingCareRow>
							<UpcomingCareRow $tone={recurringTaskCount > 0 ? 'info' : 'neutral'}>
								{recurringTaskCount > 0
									? `${recurringTaskCount} recurring task${recurringTaskCount === 1 ? '' : 's'} active`
									: 'No recurring tasks configured'}
							</UpcomingCareRow>
							<UpcomingCareRow $tone='neutral'>
								{nextScheduledMaintenance
									? `Next scheduled maintenance: ${nextScheduledMaintenance}`
									: 'No additional maintenance due in next 30 days'}
							</UpcomingCareRow>
						</UpcomingCareRows>
					</UpcomingCareCard> */}

						<SectionContainer>
							<SectionBlock>
								<SectionEyebrow>Linked Tasks</SectionEyebrow>
								<SectionTitleStrong>Appliance Tasks</SectionTitleStrong>
								<SectionDescription>
									Use this as your appliance-specific queue for assignments and completions.
								</SectionDescription>
							</SectionBlock>
							<SectionHeader>Open Tasks ({linkedTasks.length})</SectionHeader>
							{isMobile ? (
								<MobileCardStack>
									{linkedTasks.length > 0 ? (
										linkedTasks.map((task: any) => (
											<MobileDetailCard key={task.id}>
												<MobileDetailHeader>
													<div>
														<MobileDetailTitle>{task.title}</MobileDetailTitle>
													</div>
													<span style={{ fontSize: 12, fontWeight: 700, color: task.status === 'Overdue' ? '#b91c1c' : COLORS.successDark, background: task.status === 'Overdue' ? '#fee2e2' : COLORS.successLight, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>
														{task.status || 'Pending'}
													</span>
												</MobileDetailHeader>
												<MobileDetailMeta>
													<div>Maintenance Lead: {getTaskAssigneeDisplayName(task)}</div>
													<div>Due: {task.dueDate || 'No due date set'}</div>
													<div>Priority: {task.priority || 'Low'}</div>
												</MobileDetailMeta>
												{roleCapabilities.canManageTasks && (
													<ButtonGroup>
														<ActionButton onClick={() => openEditTaskModal(task)}>
															<FontAwesomeIcon icon={faEdit} />
															Edit
														</ActionButton>
														<ActionButton className='delete' onClick={() => handleDeleteLinkedTask(task)}>
															<FontAwesomeIcon icon={faTrash} />
															Delete
														</ActionButton>
													</ButtonGroup>
												)}
											</MobileDetailCard>
										))
									) : (
										<EmptyState>
											<p>No open tasks linked to this appliance. New maintenance tasks will appear here.</p>
											{canCreateTaskActions && (
												<SubmitButton type='button' onClick={openCreateTaskModal}>
													Add Task
												</SubmitButton>
											)}
										</EmptyState>
									)}
								</MobileCardStack>
							) : (
								<ReusableTable
									rowData={linkedTasks}
									showCheckbox={false}
									columns={[
										{
											header: 'Task Summary',
											key: 'title',
											render: (value: string, row: any) => (
												<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 300 }}>
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
																color: COLORS.primaryDark,
															}}>
															<FontAwesomeIcon icon={faScrewdriverWrench} />
														</span>
														<strong>{value}</strong>
													</div>
													<div style={{ fontSize: 12, color: '#64748b' }}>
														Maintenance Lead: {row.assignee || 'Unassigned'}
													</div>
												</div>
											),
										},
										{
											header: 'Status',
											key: 'status',
											render: (value: string) => (
												<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
													<FontAwesomeIcon
														icon={value === 'Overdue' ? faClock : faCircleCheck}
														color={value === 'Overdue' ? '#b91c1c' : COLORS.successDark}
													/>
													<span style={{ fontWeight: 700 }}>{value || 'Pending'}</span>
												</div>
											),
										},
										{
											header: 'Maintenance Activity',
											key: 'dueDate',
											render: (value: string, row: any) => (
												<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
													<div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
														{row.status === 'Overdue'
															? 'Maintenance is overdue'
															: 'Maintenance task active'}
													</div>
													<div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center' }}>
														<FontAwesomeIcon icon={faClock} />
														Due: {value || 'No due date set'}
													</div>
													<div style={{ fontSize: 12, color: '#64748b' }}>
														Priority: {row.priority || 'Low'}
													</div>
												</div>
											),
										},
									]}
									hideHeader={true}
									emptyTitle='No open tasks linked yet'
									emptyMessage='No open tasks linked to this appliance. New maintenance tasks will appear here.'
									emptyActionLabel={canCreateTaskActions ? 'Add Task' : undefined}
									onEmptyAction={canCreateTaskActions ? openCreateTaskModal : undefined}
									actions={roleCapabilities.canManageTasks ? [
										{
											label: 'Edit',
											icon: faEdit,
											onClick: (task: any) => openEditTaskModal(task),
										},
										{
											label: 'Delete',
											icon: faTrash,
											onClick: (task: any) => handleDeleteLinkedTask(task),
											className: 'delete',
										},
									] : []}
								/>
							)}
						</SectionContainer>
					</TabContent>
				)}

				{activeTab === 'history' && (
					<TabContent>
						<CombinedHistoryContainer>
							<SectionContainer>
								<SectionBlock>
									<SectionEyebrow>Timeline</SectionEyebrow>
									<SectionTitleStrong>Maintenance Timeline</SectionTitleStrong>
									<SectionDescription>
										A simple chronological record of what has happened to this system.
									</SectionDescription>
								</SectionBlock>
								{combinedTimelineEntries.length > 0 ? (
									<TimelineList>
										{combinedTimelineEntries.map((entry: any, index: number) => (
											<TimelineItem key={getTimelineEntryKey(entry, index)}>
												<div>
													<TimelineDate>{formatRelativeTime(entry.date)}</TimelineDate>
													<TimelineDateSub>{formatDate(entry.date)}</TimelineDateSub>
												</div>
												<TimelineContent>
													<TimelineTitleRow>
														{(() => {
															const iconData = getTimelineEventIcon(
																getTimelineEventCategory(entry),
															);
															return (
																<TimelineIconBadge
																	$color={iconData.color}
																	$background={iconData.background}>
																	<FontAwesomeIcon icon={iconData.icon} />
																</TimelineIconBadge>
															);
														})()}
														<TimelineTitle>{entry.title}</TimelineTitle>
														<TimelineEventBadge>{getTimelineEventLabel(entry)}</TimelineEventBadge>
													</TimelineTitleRow>
													<TimelineDescription>{entry.description}</TimelineDescription>
													<TimelineMeta>{entry.type}</TimelineMeta>
													{entry.sourceType === 'scheduled-task' && roleCapabilities.canManageTasks ? (
														<ButtonGroup>
															<ActionButton onClick={() => openEditTaskModal(entry.raw)}>
																<FontAwesomeIcon icon={faEdit} />
																Edit Task
															</ActionButton>
															<ActionButton className='delete' onClick={() => handleDeleteLinkedTask(entry.raw)}>
																<FontAwesomeIcon icon={faTrash} />
																Delete Task
															</ActionButton>
														</ButtonGroup>
													) : null}
													<TimelineExpandButton
														type='button'
														onClick={() => toggleTimelineDetails(getTimelineEntryKey(entry, index))}>
														{expandedTimelineEntries[getTimelineEntryKey(entry, index)]
															? 'Hide details'
															: 'View details'}
													</TimelineExpandButton>
													{expandedTimelineEntries[getTimelineEntryKey(entry, index)] ? (
														<TimelineDetailsPanel>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Notes</TimelineDetailLabel>
																<TimelineDetailValue>{getTimelineNotes(entry)}</TimelineDetailValue>
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Contractor Info</TimelineDetailLabel>
																<TimelineDetailValue>{getTimelineContractorLabel(entry)}</TimelineDetailValue>
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Attachments, Photos, Invoices</TimelineDetailLabel>
																{getTimelineAttachments(entry).length > 0 ? (
																	<TimelineAttachmentList>
																		{getTimelineAttachments(entry).map((file, fileIndex) =>
																			file.url ? (
																				<TimelineAttachmentLink
																					key={`${file.name}-${file.url || 'no-url'}-${fileIndex}`}
																					href={file.url}
																					target='_blank'
																					rel='noreferrer'>
																					{file.name}
																				</TimelineAttachmentLink>
																			) : (
																				<TimelineDetailValue key={`${file.name}-label-${fileIndex}`}>
																					{file.name}
																				</TimelineDetailValue>
																			),
																		)}
																	</TimelineAttachmentList>
																) : (
																	<TimelineDetailValue>No files attached</TimelineDetailValue>
																)}
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Parts Used</TimelineDetailLabel>
																<TimelineDetailValue>{getTimelinePartsUsed(entry)}</TimelineDetailValue>
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Invoice / Cost</TimelineDetailLabel>
																<TimelineDetailValue>
																	{entry.raw?.financials
																		? `${formatCurrency(
																			getFinancialDisplayTotal(entry.raw.financials),
																			entry.raw.financials.currency || 'USD',
																		)}${entry.raw.financials.notes ? ` • ${entry.raw.financials.notes}` : ''}`
																		: 'No financials recorded'}
																</TimelineDetailValue>
															</TimelineDetailBlock>
														</TimelineDetailsPanel>
													) : null}
												</TimelineContent>
											</TimelineItem>
										))}
									</TimelineList>
								) : (
									<EmptyState>
										<p>
											No timeline entries yet. Tasks and quick service notes create the record for this appliance.
										</p>
										{(canCreateTaskActions || canLogMaintenanceActions) && (
											<ButtonGroup>
												{canCreateTaskActions && (
													<SubmitButton type='button' onClick={openCreateTaskModal}>
														Add Task
													</SubmitButton>
												)}
												{canLogMaintenanceActions && (
													<ScanButton type='button' onClick={() => openQuickLogModal('note')}>
														Add Service Note
													</ScanButton>
												)}
											</ButtonGroup>
										)}
									</EmptyState>
								)}
							</SectionContainer>

							<SectionContainer>
								<SectionBlock>
									<SectionEyebrow>Service History</SectionEyebrow>
									<SectionTitleStrong>Maintenance Lifecycle Records</SectionTitleStrong>
									<SectionDescription>
										Every completed record adds to the long-term operational memory of this system.
									</SectionDescription>
								</SectionBlock>
								<SectionHeader>Maintenance History ({applianceMaintenanceFeedRecords.length})</SectionHeader>
								{applianceMaintenanceFeedRecords.length > 0 ? (
									isMobile ? (
										<MobileCardStack>
											{applianceMaintenanceFeedRecords.map((record: any, index: number) => {
												const attachments = getTimelineAttachments({ raw: record });
												return (
													<MobileDetailCard key={`${record.id || record.originalTaskId || 'history'}-${index}`}>
														<MobileDetailHeader>
															<MobileDetailTitle>{record.title || record.taskTitle || record.description || 'Task'}</MobileDetailTitle>
															<span style={{ fontSize: 12, fontWeight: 700, color: COLORS.successDark, background: COLORS.successLight, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>
																{record.status || 'Completed'}
															</span>
														</MobileDetailHeader>
														<MobileDetailMeta>
															<div>Date: {formatDate(getMaintenanceEventDate(record) || record.date)}</div>
															<div>Cost: {formatCurrency(getFinancialDisplayTotal(record.financials), record.financials?.currency || 'USD')}</div>
															<div>
																Documents: {attachments.length > 0 ? attachments.map((file) => file.name).join(', ') : 'None'}
															</div>
														</MobileDetailMeta>
													</MobileDetailCard>
												);
											})}
										</MobileCardStack>
									) : (
										<GridContainer>
											<GridTable>
												<thead>
													<tr>
														<th>Date</th>
														<th>Description</th>
														<th>Status</th>
														<th>Documents</th>
														<th>Cost</th>
													</tr>
												</thead>
												<tbody>
													{applianceMaintenanceFeedRecords.map((record: any, index: number) => {
														const attachments = getTimelineAttachments({ raw: record });
														return (
															<tr
																key={`${record.id || record.originalTaskId || 'history'}-${index}`}>
																<td>
																	{formatDate(
																		getMaintenanceEventDate(record) ||
																		record.date,
																	)}
																</td>
																<td>
																	{record.title || record.taskTitle || record.description || 'Task'}
																</td>
																<td>{record.status || 'Completed'}</td>
																<td>
																	{attachments.length > 0 ? (
																		<TimelineAttachmentList>
																			{attachments.map((file, fileIndex) =>
																				file.url ? (
																					<TimelineAttachmentLink
																						key={`${file.name}-${file.url}-${fileIndex}`}
																						href={file.url}
																						target='_blank'
																						rel='noreferrer'>
																						{file.name}
																					</TimelineAttachmentLink>
																				) : (
																					<span key={`${file.name}-${fileIndex}`}>
																						{file.name}
																					</span>
																				),
																			)}
																		</TimelineAttachmentList>
																	) : (
																		'-'
																	)}
																</td>
																<td>
																	{formatCurrency(
																		getFinancialDisplayTotal(record.financials),
																		record.financials?.currency || 'USD',
																	)}
																</td>
															</tr>
														);
													})}
												</tbody>
											</GridTable>
										</GridContainer>
									)
								) : (
									<EmptyState>
										<p>
											No maintenance history linked to this appliance yet. Completed tasks will appear here as the service record grows.
										</p>
										{canCreateTaskActions && (
											<SubmitButton type='button' onClick={openCreateTaskModal}>
												Add Task
											</SubmitButton>
										)}
									</EmptyState>
								)}
							</SectionContainer>
						</CombinedHistoryContainer>
					</TabContent>
				)}

				{activeTab === 'parts' && (
					<TabContent>
						<SectionContainer>
							{!canAccessParts && (
								<LockedFeatureCallout
									title={
										isTeamMemberAccount
											? 'Parts & Service is limited by your assigned role'
											: 'Parts & Service is locked on your current plan'
									}
									description={
										isTeamMemberAccount
											? 'Your account access is controlled by the account holder.'
											: 'Track part inventory, filter specs, and service component history by upgrading to the Property plan or higher.'
									}
									upgradeLabel='Upgrade for Parts'
									showUpgradeAction={!isTeamMemberAccount}
									compact
								/>
							)}
							<SectionBlock>
								<SectionEyebrow>Warranty and Documents</SectionEyebrow>
								<SectionTitleStrong>Parts, Filters, and Service Knowledge</SectionTitleStrong>
								<SectionDescription>
									Capture part numbers, specs, and service notes so replacements are fast in the field.
								</SectionDescription>
							</SectionBlock>
							<SectionHeader>Parts & Service</SectionHeader>
							<PhotoActions style={{ marginBottom: 10 }}>
								<ScanButton
									type='button'
									onClick={() => setIsPartScanOpen(true)}
									disabled={!canAccessParts}>
									Scan Part Barcode
								</ScanButton>
								<PhotoHelperText>
									Scan to prefill part number, size/spec, and notes fields.
								</PhotoHelperText>
							</PhotoActions>

							{/* Add/Edit Form
							<PartsForm>
								<div style={{ marginBottom: editingPartIndex !== null ? 12 : 0 }}>
									<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
										{editingPartIndex !== null ? 'Edit Part' : 'Add New Part'}
									</div>
								</div>

								<FormRow>
									<FormField>
										<FormLabel>Part Name</FormLabel>
										<FormInput
											type='text'
											placeholder='Part Name'
											value={partFormData.name}
											disabled={!canAccessParts}
											onChange={(e) =>
												setPartFormData({ ...partFormData, name: e.target.value })
											}
										/>
									</FormField>
									<FormField>
										<FormLabel>Category</FormLabel>
										<FormSelect
											value={partFormData.category}
											disabled={!canAccessParts}
											onChange={(e) =>
												setPartFormData({ ...partFormData, category: e.target.value })
											}>
											{DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</FormSelect>
									</FormField>

									<ButtonGroup>
										{editingPartIndex !== null ? (
											<>
												<SubmitButton onClick={handleUpdatePart} disabled={!canAccessParts}>Update</SubmitButton>
												<CancelButton onClick={handleCancelEdit} disabled={!canAccessParts}>Cancel</CancelButton>
											</>
										) : (
											<SubmitButton onClick={handleAddPart} disabled={!canAccessParts}>Add Part</SubmitButton>
										)}
									</ButtonGroup>
								</FormRow>

								<DynamicFieldsGrid>
									{activePartFields.map((field) => (
										<FormField key={String(field.key)}>
											<FormLabel>{field.label}</FormLabel>
											<FormInput
												type={field.type || 'text'}
												placeholder={field.placeholder}
												value={String(partFormData[field.key] || '')}
												disabled={!canAccessParts}
												onChange={(e) =>
													setPartFormData({
														...partFormData,
														[field.key]: e.target.value,
													})
												}
											/>
										</FormField>
									))}
								</DynamicFieldsGrid>

								<FormField>
									<FormLabel>Additional Notes</FormLabel>
									<FormTextarea
										placeholder='Any relevant details for this part, such as installation tips or preferred vendor.'
										value={partFormData.notes || ''}
										disabled={!canAccessParts}
										onChange={(e) =>
											setPartFormData({ ...partFormData, notes: e.target.value })
										}
									/>
								</FormField>
							</PartsForm> */}

							{/* Parts Table */}
							{serviceParts.length > 0 ? (
								isMobile ? (
									<MobileCardStack>
										{serviceParts.map((part: DeviceServiceItem, index: number) => (
											<MobileDetailCard key={`${part.id}-${index}`}>
												<MobileDetailHeader>
													<MobileDetailTitle>{part.name}</MobileDetailTitle>
													<span style={{ display: 'inline-flex', padding: '4px 8px', backgroundColor: COLORS.successLight, color: COLORS.successDark, borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
														{part.category}
													</span>
												</MobileDetailHeader>
												<MobileDetailMeta>
													<div>Part #: {part.partNumber || '-'}</div>
													<div>Size / Spec: {part.size || part.mervRating || part.voltage || '-'}</div>
													<div>Notes: {part.notes || '-'}</div>
												</MobileDetailMeta>
												{canAccessParts && (
													<ButtonGroup>
														<ActionButton onClick={() => handleEditPart(index)}>
															<FontAwesomeIcon icon={faEdit} />
															Edit
														</ActionButton>
														<ActionButton className='delete' onClick={() => handleDeletePart(index)}>
															<FontAwesomeIcon icon={faTrash} />
															Delete
														</ActionButton>
													</ButtonGroup>
												)}
											</MobileDetailCard>
										))}
									</MobileCardStack>
								) : (
									<PartsTable>
										<thead>
											<tr>
												<th>Part Name</th>
												<th>Category</th>
												<th>Part #</th>
												<th>Size/Spec</th>
												<th>Notes</th>
												<th style={{ width: '150px' }}>Actions</th>
											</tr>
										</thead>
										<tbody>
											{serviceParts.map((part: DeviceServiceItem, index: number) => (
												<tr key={`${part.id}-${index}`}>
													<td style={{ fontWeight: 500 }}>{part.name}</td>
													<td>
														<span
															style={{
																display: 'inline-block',
																padding: '4px 8px',
																backgroundColor: COLORS.successLight,
																color: COLORS.successDark,
																borderRadius: '4px',
																fontSize: '12px',
																fontWeight: 500,
															}}>
															{part.category}
														</span>
													</td>
													<td>{part.partNumber || '-'}</td>
													<td>{part.size || part.mervRating || part.voltage || '-'}</td>
													<td>{part.notes || '-'}</td>
													<td>
														<ActionButton onClick={() => handleEditPart(index)} disabled={!canAccessParts}>
															<FontAwesomeIcon icon={faEdit} />
															Edit
														</ActionButton>
														<ActionButton
															className='delete'
															disabled={!canAccessParts}
															onClick={() => handleDeletePart(index)}>
															<FontAwesomeIcon icon={faTrash} />
															Delete
														</ActionButton>
													</td>
												</tr>
											))}
										</tbody>
									</PartsTable>
								)
							) : (
								<EmptyState>
									<p>No parts added yet. Add a part to get started.</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

				<TaskModal
					isOpen={showTaskModal}
					isEditing={isEditingTask}
					editingTaskId={isEditingTask ? selectedTask?.id || null : null}
					editingTask={isEditingTask ? selectedTask : null}
					initialTask={isEditingTask ? undefined : deviceTaskTemplate || undefined}
					propertyId={property?.id || null}
					onClose={() => {
						setShowTaskModal(false);
						setSelectedTask(null);
						setIsEditingTask(false);
					}}
					onSaved={() => {
						setShowTaskModal(false);
						setSelectedTask(null);
						setIsEditingTask(false);
					}}
					currentUser={currentUser || null}
					unitId={device?.location?.unitId || null}
					unitOptions={taskUnitOptions}
				/>

				<TaskModal
					isOpen={showRecurringTaskModal}
					isEditing={false}
					editingTaskId={null}
					initialTask={recurringTaskTemplate || undefined}
					propertyId={property?.id || null}
					onClose={() => setShowRecurringTaskModal(false)}
					onSaved={handleRecurringTaskSaved}
					currentUser={currentUser || null}
					unitId={device?.location?.unitId || null}
					unitOptions={taskUnitOptions}
				/>

				<GenericModal
					isOpen={showQuickLogModal}
					title={
						quickLogMode === 'repair'
							? 'Log Repair'
							: quickLogMode === 'invoice'
								? 'Log Invoice'
								: quickLogMode === 'inspection'
									? 'Log Inspection'
									: quickLogMode === 'warranty'
										? 'Log Warranty'
										: quickLogMode === 'contractor'
											? 'Log Contractor Visit'
											: 'Add Service Note'
					}
					onClose={() => setShowQuickLogModal(false)}
					onSubmit={handleSaveQuickLog}
					showActions={true}
					primaryButtonLabel={
						isSavingQuickLog || isCreatingContractor ? 'Saving...' : 'Save Entry'
					}
					secondaryButtonLabel='Cancel'>
					<PartsForm>
						<FormRow style={{ gridTemplateColumns: '1fr 1fr' }}>
							<FormField>
								<FormLabel>Date</FormLabel>
								<FormInput
									type='date'
									value={quickLogDate}
									onChange={(e) => setQuickLogDate(e.target.value)}
								/>
							</FormField>
							<FormField>
								<FormLabel>Type</FormLabel>
								<FormSelect
									value={quickLogMode}
									onChange={(e) =>
										setQuickLogMode(
											e.target.value as
											| 'note'
											| 'repair'
											| 'invoice'
											| 'inspection'
											| 'warranty'
											| 'contractor'
										)
									}>
									<option value='note'>Service Note</option>
									<option value='repair'>Repair</option>
									<option value='invoice'>Invoice</option>
									<option value='inspection'>Inspection</option>
									<option value='warranty'>
										Warranty{canAccessWarranty || isTeamMemberAccount ? '' : ' (details available)'}
									</option>
									<option value='contractor'>Contractor Visit</option>
								</FormSelect>
							</FormField>
						</FormRow>
						<FormField>
							<FormLabel>Description</FormLabel>
							<FormTextarea
								placeholder={
									quickLogMode === 'repair'
										? 'Describe the repair, parts used, and any follow-up.'
										: quickLogMode === 'invoice'
											? 'Invoice number, amount, and service details.'
											: quickLogMode === 'inspection'
												? 'Inspection findings, recommendations, and any issues noted.'
												: quickLogMode === 'warranty'
													? 'Warranty provider, coverage details, and expiration notes.'
													: quickLogMode === 'contractor'
														? 'Contractor name, scope of visit, and recommended follow-up.'
														: 'Add a note that should stay with the maintenance record.'
								}
								value={quickLogDescription}
								onChange={(e) => setQuickLogDescription(e.target.value)}
							/>
						</FormField>

						{(quickLogMode === 'repair' ||
							quickLogMode === 'invoice' ||
							quickLogMode === 'inspection') && (
								<>
									<FormLabel>Financial Details</FormLabel>
									<FormRow style={{ gridTemplateColumns: '1fr 1fr' }}>
										<FormField>
											<FormInput
												type='number'
												min='0'
												step='0.01'
												placeholder='Contractor cost'
												value={quickLogFinancials.contractorCost}
												onChange={(e) =>
													setQuickLogFinancials((prev) => ({
														...prev,
														contractorCost: e.target.value,
													}))
												}
											/>
										</FormField>
										<FormField>
											<FormInput
												type='number'
												min='0'
												step='0.01'
												placeholder='Materials cost'
												value={quickLogFinancials.materialsCost}
												onChange={(e) =>
													setQuickLogFinancials((prev) => ({
														...prev,
														materialsCost: e.target.value,
													}))
												}
											/>
										</FormField>
									</FormRow>
									<FormRow style={{ gridTemplateColumns: '1fr 1fr' }}>
										<FormField>
											<FormInput
												type='number'
												min='0'
												step='0.01'
												placeholder='Labor cost'
												value={quickLogFinancials.laborCost}
												onChange={(e) =>
													setQuickLogFinancials((prev) => ({
														...prev,
														laborCost: e.target.value,
													}))
												}
											/>
										</FormField>
										<FormField>
											<FormInput
												type='number'
												min='0'
												step='0.01'
												placeholder='Other cost'
												value={quickLogFinancials.otherCost}
												onChange={(e) =>
													setQuickLogFinancials((prev) => ({
														...prev,
														otherCost: e.target.value,
													}))
												}
											/>
										</FormField>
									</FormRow>
									<div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
										Total:{' '}
										{formatCurrency(
											calculateCostTotal({
												contractorCost: toNumberOrUndefined(quickLogFinancials.contractorCost),
												materialsCost: toNumberOrUndefined(quickLogFinancials.materialsCost),
												laborCost: toNumberOrUndefined(quickLogFinancials.laborCost),
												otherCost: toNumberOrUndefined(quickLogFinancials.otherCost),
											}),
										)}
									</div>
								</>
							)}

						{quickLogMode === 'warranty' && (
							<>
								<FormField>
									<FormLabel>Warranty Expiration (Optional)</FormLabel>
									<FormInput
										type='date'
										value={quickLogWarrantyExpiration}
										onChange={(e) => setQuickLogWarrantyExpiration(e.target.value)}
									/>
								</FormField>
								{canAccessWarranty ? (
									<FormField>
										<FormLabel>Warranty Document (Optional)</FormLabel>
										<FormInput
											type='file'
											onChange={(e) =>
												setQuickLogAttachment(e.target.files?.[0] || null)
											}
										/>
									</FormField>
								) : (
									<div style={{ fontSize: '12px', color: '#64748b' }}>
										Document upload for warranty records follows your plan's storage limits.
									</div>
								)}
							</>
						)}

						{quickLogMode === 'contractor' && (
							<>
								<FormField>
									<FormLabel>Existing Contractor (Optional)</FormLabel>
									<FormSelect
										value={quickLogSelectedContractorId}
										onChange={(e) => setQuickLogSelectedContractorId(e.target.value)}>
										<option value=''>No linked contractor</option>
										{propertyContractors.map((contractor: any) => (
											<option key={contractor.id} value={contractor.id}>
												{contractor.name}
												{contractor.category ? ` (${contractor.category})` : ''}
											</option>
										))}
									</FormSelect>
								</FormField>
								<label
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 8,
										fontSize: '13px',
										color: '#334155',
									}}>
									<input
										type='checkbox'
										checked={quickLogCreateContractor}
										onChange={(e) => setQuickLogCreateContractor(e.target.checked)}
									/>
									Create new contractor for this visit
								</label>
								{quickLogCreateContractor && (
									<>
										<FormRow style={{ gridTemplateColumns: '1fr 1fr' }}>
											<FormField>
												<FormInput
													placeholder='Contractor name'
													value={quickLogNewContractor.name}
													onChange={(e) =>
														setQuickLogNewContractor((prev) => ({
															...prev,
															name: e.target.value,
														}))
													}
												/>
											</FormField>
											<FormField>
												<FormInput
													placeholder='Company'
													value={quickLogNewContractor.company}
													onChange={(e) =>
														setQuickLogNewContractor((prev) => ({
															...prev,
															company: e.target.value,
														}))
													}
												/>
											</FormField>
										</FormRow>
										<FormRow style={{ gridTemplateColumns: '1fr 1fr' }}>
											<FormField>
												<FormInput
													placeholder='Category'
													value={quickLogNewContractor.category}
													onChange={(e) =>
														setQuickLogNewContractor((prev) => ({
															...prev,
															category: e.target.value,
														}))
													}
												/>
											</FormField>
											<FormField>
												<FormInput
													placeholder='Phone'
													value={quickLogNewContractor.phone}
													onChange={(e) =>
														setQuickLogNewContractor((prev) => ({
															...prev,
															phone: e.target.value,
														}))
													}
												/>
											</FormField>
										</FormRow>
										<FormField>
											<FormInput
												type='email'
												placeholder='Email (optional)'
												value={quickLogNewContractor.email}
												onChange={(e) =>
													setQuickLogNewContractor((prev) => ({
														...prev,
														email: e.target.value,
													}))
												}
											/>
										</FormField>
									</>
								)}
								<FormField>
									<FormLabel>Visit Document (Optional)</FormLabel>
									<FormInput
										type='file'
										onChange={(e) => setQuickLogAttachment(e.target.files?.[0] || null)}
									/>
								</FormField>
							</>
						)}

						{quickLogMode === 'note' && (
							<FormField>
								<FormLabel>Attach Document (Optional)</FormLabel>
								<FormInput
									type='file'
									onChange={(e) => setQuickLogAttachment(e.target.files?.[0] || null)}
								/>
							</FormField>
						)}

						{quickLogAttachment && (
							<div style={{ fontSize: '12px', color: '#64748b' }}>
								Attached: {quickLogAttachment.name}
							</div>
						)}
					</PartsForm>
				</GenericModal>

				{partFormData && (
					<GenericModal
						isOpen={showPartModal}
						onClose={() => {
							setShowPartModal(false);
							resetPartForm();
							setEditingPartIndex(null);
						}}
						onSubmit={async () => {
							if (!device || !partFormData.name.trim()) return;
							if (editingPartIndex !== null) {
								await handleUpdatePart();
							} else {
								await handleAddPart();
							}
							setShowPartModal(false);
						}}
						title={editingPartIndex !== null ? 'Edit Part' : 'Add Part'}
						showActions={true}
						primaryButtonLabel={editingPartIndex !== null ? 'Update Part' : 'Add Part'}
						primaryButtonDisabled={!partFormData.name.trim()}
						secondaryButtonLabel='Cancel'
					>
						<PartsForm>
							<FormRow>
								<FormField>
									<FormLabel>Part Name</FormLabel>
									<FormInput
										type='text'
										placeholder='Part Name'
										value={partFormData.name}
										onChange={(e) =>
											setPartFormData({ ...partFormData, name: e.target.value })
										}
									/>
								</FormField>
								<FormField>
									<FormLabel>Category</FormLabel>
									<FormSelect
										value={partFormData.category}
										onChange={(e) =>
											setPartFormData({ ...partFormData, category: e.target.value })
										}>
										{DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</FormSelect>
								</FormField>
							</FormRow>
							<DynamicFieldsGrid>
								{activePartFields.map((field) => (
									<FormField key={String(field.key)}>
										<FormLabel>{field.label}</FormLabel>
										<FormInput
											type={field.type || 'text'}
											placeholder={field.placeholder}
											value={String(partFormData[field.key] || '')}
											onChange={(e) =>
												setPartFormData({
													...partFormData,
													[field.key]: e.target.value,
												})
											}
										/>
									</FormField>
								))}
							</DynamicFieldsGrid>
							<FormField>
								<FormLabel>Additional Notes</FormLabel>
								<FormTextarea
									placeholder='Any relevant details for this part, such as installation tips or preferred vendor.'
									value={partFormData.notes || ''}
									onChange={(e) =>
										setPartFormData({ ...partFormData, notes: e.target.value })
									}
								/>
							</FormField>
						</PartsForm>
					</GenericModal>
				)}

				{device && property && (
					<DeviceModal
						isOpen={showDeviceEditModal}
						onClose={handleCloseEditDeviceModal}
						onSubmit={handleSaveDeviceEdit}
						property={property}
						deviceId={editingDevice?.id}
						isEditing={true}
						units={units}
						pendingFiles={pendingDeviceFiles}
						onPendingFilesChange={setPendingDeviceFiles}
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
							setPendingDeviceFiles((prev) =>
								prev.filter((file) => `${file.name}-${file.size}` !== fileKey),
							)
						}
						deviceFormData={deviceFormData}
						onFormChange={handleDeviceFormChange}
					/>
				)}
			</PageStack>
			<BarcodeScannerModal
				isOpen={isDeviceScanOpen}
				title='Scan Appliance Barcode'
				onClose={() => setIsDeviceScanOpen(false)}
				onDetected={handleDeviceBarcodeDetected}
			/>
			<BarcodeScannerModal
				isOpen={isPartScanOpen}
				title='Scan Part Barcode'
				onClose={() => setIsPartScanOpen(false)}
				onDetected={handlePartBarcodeDetected}
			/>
		</DetailPageLayout>
	);
};
