import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from 'react';
import { useAppFeedback } from '../AppFeedback/AppFeedbackProvider';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { doc, getDoc } from 'firebase/firestore';
import { GenericModal } from './GenericModal';
import {
	FormGroup,
	FormGrid,
	FormLabel,
	FormInput,
	FormTextarea,
	FormGroupFull,
	ModalTabContainer,
	ModalTab,
	ModalTabContent,
} from './ModalStyles';
import { MultiSelect } from '../index';
import { TaskSelect } from '../Select/TaskSelect';
import {
	TaskNotification,
	TaskFinancials,
	CostBreakdown,
} from '../../../types/Task.types';
import {
	getDefaultTaskNotifications,
	getDefaultNotificationMessage,
} from '../../../utils/taskNotificationUtils';
import {
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useGetTasksQuery,
} from '../../../Redux/API/taskSlice';
import { useGetAllDevicesQuery } from '../../../Redux/API/deviceSlice';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
} from '../../../Redux/API/propertySlice';
import { useGetAllMaintenanceHistoryForUserQuery } from '../../../Redux/API/userSlice';
import { addTask, updateTask } from '../../../Redux/Slices/propertyDataSlice';
import {
	calculateCostTotal,
	hasCostData,
	toNumberOrUndefined,
	formatCurrency,
} from '../../../utils/financialUtils';
import { db } from '../../../config/firebase';
import { COLORS } from '../../../constants/colors';
import { Device, PropertyDocumentCategory } from '../../../types/Property.types';
import { RootState } from '../../../Redux/store/store';
import { canUseRecurringTasks } from '../../../utils/subscriptionUtils';
import { TaskDocumentsPanel } from '../../TaskDocumentsPanel/TaskDocumentsPanel';
import { uploadPropertyDocument } from '../../../utils/propertyDocumentUpload';

const LINKED_DEVICE_NOTES_START = '--- Linked Appliance Details ---';
const LINKED_DEVICE_NOTES_END = '--- End Linked Appliance Details ---';

const escapeForRegex = (value: string) =>
	value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripLinkedDeviceNotes = (notes: string) => {
	if (!notes) return '';
	const markerPattern = new RegExp(
		`${escapeForRegex(LINKED_DEVICE_NOTES_START)}[\\s\\S]*?${escapeForRegex(LINKED_DEVICE_NOTES_END)}`,
		'g',
	);
	return notes.replace(markerPattern, '').trim();
};

const buildLinkedDeviceDetailsSection = (devices: Device[]) => {
	if (!devices.length) return '';

	const lines: string[] = [
		LINKED_DEVICE_NOTES_START,
		'Use these linked appliance details while performing this task:',
		'',
	];

	devices.forEach((device, index) => {
		const displayName =
			(device.brand && device.model
				? `${device.brand} ${device.model}`
				: device.model || device.brand || device.type || `Appliance ${index + 1}`) +
			(device.type ? ` (${device.type})` : '');
		const serviceItems = device.serviceItems || [];

		lines.push(`${index + 1}. ${displayName}`);
		if (device.serialNumber) lines.push(`   Serial Number: ${device.serialNumber}`);

		if (serviceItems.length > 0) {
			serviceItems.forEach((item, itemIndex) => {
				lines.push(
					`   ${itemIndex + 1}) [${item.category}] ${item.name}${
						item.details ? ` - ${item.details}` : ''
					}`,
				);
			});
		} else {
			// Backward compatibility for older appliances that still use scalar fields.
			if (device.partNumber) lines.push(`   Part Number: ${device.partNumber}`);
			if (device.filterSize) lines.push(`   Filter Size: ${device.filterSize}`);
			if (device.specNotes) lines.push(`   Service Notes: ${device.specNotes}`);
		}

		if (
			!device.serialNumber &&
			serviceItems.length === 0 &&
			!device.partNumber &&
			!device.filterSize &&
			!device.specNotes
		) {
			lines.push('   No additional appliance specs saved yet.');
		}
		lines.push('');
	});

	lines.push(LINKED_DEVICE_NOTES_END);
	return lines.join('\n').trim();
};

const mergeNotesWithLinkedDeviceDetails = (
	notes: string,
	linkedDeviceSection: string,
) => {
	const baseNotes = stripLinkedDeviceNotes(notes || '');
	if (!linkedDeviceSection) return baseNotes;
	return baseNotes
		? `${baseNotes}\n\n${linkedDeviceSection}`
		: linkedDeviceSection;
};

const SuggestionInputWrap = styled.div`
	position: relative;
`;

const SuggestionDropdown = styled.div`
	position: absolute;
	top: calc(100% + 6px);
	left: 0;
	right: 0;
	background: #ffffff;
	border: 1px solid ${COLORS.gray200};
	border-radius: 10px;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
	max-height: 220px;
	overflow-y: auto;
	z-index: 30;
`;

const SuggestionItem = styled.button<{ $active?: boolean }>`
	width: 100%;
	text-align: left;
	padding: 0.6rem 0.75rem;
	border: none;
	border-bottom: 1px solid ${COLORS.gray100};
	background: ${(props) => (props.$active ? COLORS.primaryLight : '#ffffff')};
	color: ${(props) => (props.$active ? COLORS.primary : COLORS.textPrimary)};
	cursor: pointer;
	font-size: 0.9rem;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: ${COLORS.primaryLight};
		color: ${COLORS.primary};
	}
`;

const CheckboxRow = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.45rem;
	font-size: 0.88rem;
	color: ${COLORS.textSecondary};
	cursor: pointer;
`;

const TabLabel = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;

	@media (max-width: 480px) {
		gap: 0.28rem;
		white-space: nowrap;
	}
`;

const TabBadge = styled.span<{ $tone?: 'optional' | 'warning' | 'success' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.15rem 0.45rem;
	border-radius: 999px;
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	background: ${(props) =>
		props.$tone === 'warning'
			? '#fee2e2'
			: props.$tone === 'success'
				? '#dcfce7'
				: '#eef2f7'};
	color: ${(props) =>
		props.$tone === 'warning'
			? '#b91c1c'
			: props.$tone === 'success'
				? '#166534'
				: COLORS.textSecondary};

	@media (max-width: 480px) {
		font-size: 0.64rem;
		padding: 0.12rem 0.35rem;
	}
`;

const StickyTabRail = styled.div`
	position: sticky;
	top: 0;
	z-index: 12;
	background: #ffffff;
	flex-shrink: 0;
	padding-top: 0.15rem;
`;

const TabContentScrollArea = styled.div`
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding-bottom: 0.5rem;
`;

const SummaryBanner = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
	margin-bottom: 1.25rem;
	border: 1px solid #d1fae5;
	border-radius: 10px;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
`;

const SummaryBannerHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.65rem;
	flex-wrap: wrap;
`;

const SummaryToggleButton = styled.button`
	border: none;
	background: transparent;
	color: ${COLORS.primary};
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;
	padding: 0.2rem 0;
	text-decoration: underline;
	text-underline-offset: 2px;

	&:hover {
		color: ${COLORS.primaryDark};
	}

	@media (max-width: 480px) {
		font-size: 0.76rem;
	}
`;

const SummaryTitle = styled.div`
	font-size: 0.95rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};

	@media (max-width: 480px) {
		font-size: 0.88rem;
	}
`;

const SummaryMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
`;

const SummaryPill = styled.span<{ $tone?: 'warning' | 'neutral' | 'success' }>`
	display: inline-flex;
	align-items: center;
	padding: 0.35rem 0.65rem;
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: 600;
	background: ${(props) =>
		props.$tone === 'warning'
			? '#fef3c7'
			: props.$tone === 'success'
				? '#dcfce7'
				: '#ffffff'};
	color: ${(props) =>
		props.$tone === 'warning'
			? '#92400e'
			: props.$tone === 'success'
				? '#166534'
				: COLORS.textSecondary};
	border: 1px solid
		${(props) =>
			props.$tone === 'warning'
				? '#fcd34d'
				: props.$tone === 'success'
					? '#86efac'
					: COLORS.gray200};
`;

const RequiredList = styled.div`
	font-size: 0.85rem;
	color: ${COLORS.textSecondary};
	line-height: 1.5;
`;

const SectionCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 10px;
	background: #ffffff;
	margin-bottom: 1rem;
`;

const SectionHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
`;

const SectionTitle = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};

	@media (max-width: 480px) {
		font-size: 0.94rem;
	}
`;

const SectionDescription = styled.p`
	margin: 0;
	font-size: 0.87rem;
	color: ${COLORS.textSecondary};
	line-height: 1.5;

	@media (max-width: 480px) {
		font-size: 0.82rem;
	}
`;

const FieldHint = styled.div`
	margin-top: 0.45rem;
	font-size: 0.82rem;
	color: ${COLORS.textSecondary};
	line-height: 1.45;
`;

const FieldError = styled.div`
	margin-top: 0.45rem;
	font-size: 0.82rem;
	font-weight: 600;
	color: #b91c1c;
`;

const DueDateModeGroup = styled.div`
	display: inline-flex;
	padding: 0.25rem;
	border-radius: 10px;
	background: ${COLORS.gray100};
	gap: 0.25rem;
`;

const DueDateModeButton = styled.button<{ $active: boolean }>`
	border: none;
	padding: 0.55rem 0.85rem;
	border-radius: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	cursor: pointer;
	background: ${(props) => (props.$active ? '#ffffff' : 'transparent')};
	color: ${(props) =>
		props.$active ? COLORS.primaryDark : COLORS.textSecondary};
	box-shadow: ${(props) =>
		props.$active ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none'};
`;

const HelperBox = styled.div`
	padding: 0.85rem 1rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 8px;
	background: ${COLORS.gray50};
	font-size: 0.84rem;
	color: ${COLORS.textSecondary};
	line-height: 1.5;
`;

const AdvancedStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const MoreOptionsToggle = styled.button<{ $active?: boolean }>`
	border: 1px solid ${(props) => (props.$active ? '#16a34a' : COLORS.gray200)};
	background: ${(props) => (props.$active ? '#f0fdf4' : '#ffffff')};
	color: ${(props) => (props.$active ? '#166534' : COLORS.textPrimary)};
	border-radius: 8px;
	padding: 0.55rem 0.85rem;
	font-size: 0.84rem;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 0.15s ease, border-color 0.15s ease;
`;

interface TaskFormData {
	title: string;
	dueDate: string;
	status: string;
	requiresWorkOrder?: boolean;
	category?: string;
	location?: string;
	priority?: string;
	notes: string;
	assignedTo?: string;
	devices?: string[];
	isRecurring?: boolean;
	recurrenceFrequency?: string;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: string;
	enableNotifications?: boolean;
	notifications?: TaskNotification[];
	linkedMaintenanceHistoryIds?: string[];
	// new optional fields for cross‑property/unit tasks
	propertyId?: string;
	unitId?: string;
	financials?: TaskFinancials;
}

type ActiveTab = 'details' | 'advanced' | 'schedule' | 'notifications' | 'financial';

type SmartScheduleSuggestion = {
	label: string;
	frequency: string;
	interval?: number;
	customUnit?: string;
	daysUntilDue: number;
};

interface EditTaskModalProps {
	isOpen: boolean;
	isEditing: boolean;
	// optional: when editing inside a page you can pass the task id or the whole task
	editingTaskId?: string | null;
	editingTask?: any | null; // full task object for editing
	initialTask?:
		| (Partial<TaskFormData> & {
				propertyId?: string;
				unitId?: string;
				linkedMaintenanceHistoryIds?: string[];
		  })
		| null;
	propertyId?: string | null;
	// when the caller wants the user to choose a property/unit
	propertyOptions?: { label: string; value: string }[];
	unitId?: string | null;
	unitOptions?: { label: string; value: string }[];
	onClose: () => void;
	onSaved?: (updatedTask?: any) => void; // called after successful create/update
	statusOptions?: string[];
	priorityOptions?: string[];
	assigneeOptions?: { label: string; value: string; email?: string }[];
	currentUser?: any | null;
	// new/optional callbacks and placeholders
	taskTitlePlaceholder?: string;
}

export const TaskModal: React.FC<EditTaskModalProps> = ({
	isOpen,
	isEditing,
	editingTaskId = null,
	editingTask = null,
	initialTask = null,
	propertyId = null,
	onClose,
	onSaved,
	statusOptions = ['Initiated', 'Completed'],
	priorityOptions = ['Low', 'Medium', 'High', 'Urgent'],
	assigneeOptions = [],
	currentUser = null,
	propertyOptions = [],
	unitId = null,
	taskTitlePlaceholder = 'Task title',
}) => {
	const feedback = useAppFeedback();
	const storeCurrentUser = useSelector(
		(state: RootState) => state.user.currentUser,
	);
	const effectiveCurrentUser = currentUser || storeCurrentUser;
	const canUseRecurringTaskFeature = Boolean(
		effectiveCurrentUser?.subscription &&
			canUseRecurringTasks(effectiveCurrentUser.subscription as any),
	);

	const normalizeTaskTitle = (value?: string | null) =>
		String(value || '')
			.trim()
			.toLowerCase()
			.replace(/\s+/g, ' ');

	// modal-owned form state (defaults)
	const defaultForm: TaskFormData = useMemo(
		() => ({
			title: '',
			dueDate: new Date().toISOString().split('T')[0],
			status: 'Initiated',
			requiresWorkOrder: false,
			category: '',
			location: '',
			notes: '',
			devices: [],
			isRecurring: false,
			recurrenceFrequency: undefined,
			recurrenceInterval: undefined,
			recurrenceCustomUnit: undefined,
			enableNotifications: true,
			notifications: getDefaultTaskNotifications(),
			linkedMaintenanceHistoryIds: [],
			propertyId: propertyId || '',
			unitId: unitId || '',
			financials: {
				currency: 'USD',
				estimate: {},
			},
		}),
		[propertyId, unitId],
	);

	const dispatch = useDispatch();
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: allDevices = [] } = useGetAllDevicesQuery();
	const { data: allProperties = [] } = useGetPropertiesQuery();
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery();
	const [createTask] = useCreateTaskMutation();
	const [updateTaskApi] = useUpdateTaskMutation();
	const [updateProperty] = useUpdatePropertyMutation();

	const [formState, setFormState] = useState<TaskFormData>(defaultForm);
	const [pendingTaskDocumentFiles, setPendingTaskDocumentFiles] = useState<File[]>(
		[],
	);
	const [pendingTaskDocumentCategory, setPendingTaskDocumentCategory] =
		useState<PropertyDocumentCategory>('other');
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const [activeSuggestion, setActiveSuggestion] = useState<
		'category' | 'location' | null
	>(null);
	const categoryWrapRef = useRef<HTMLDivElement | null>(null);
	const locationWrapRef = useRef<HTMLDivElement | null>(null);
	const titleInputRef = useRef<HTMLInputElement | null>(null);
	const hasInitializedFormForOpen = useRef(false);

	const selectedPropertyId = formState.propertyId || propertyId || '';

	// Determine if selected property is single family
	const selectedProperty = useMemo(() => {
		if (!selectedPropertyId) return null;
		return allProperties.find((p: any) => p.id === selectedPropertyId);
	}, [selectedPropertyId, allProperties]);

	// Units are temporarily hidden from the app flow.

	const defaultCategoryOptions = useMemo(
		() => [
			'Kitchen',
			'Bedroom',
			'Living Room',
			'Bathroom',
			'Garage',
			'Outside',
			'Basement',
			'Laundry Room',
			'Hallway',
			'Office',
		],
		[],
	);

	const defaultLocationSuggestions: Record<string, string[]> = useMemo(
		() => ({
			Kitchen: ['Sink', 'Dishwasher', 'Refrigerator', 'Stove'],
			Bedroom: ['Closet', 'Window', 'Ceiling Fan', 'Door'],
			'Living Room': ['Fireplace', 'Window', 'Entertainment Area', 'Ceiling'],
			Bathroom: ['Sink', 'Toilet', 'Shower', 'Bathtub'],
			Garage: ['Garage Door', 'Workbench', 'Water Heater', 'Storage Shelves'],
			Outside: ['Front Yard', 'Backyard', 'Driveway', 'Patio'],
			Basement: ['Sump Pump', 'Stairs', 'Storage Area', 'Foundation Wall'],
			'Laundry Room': ['Washer', 'Dryer', 'Utility Sink', 'Vent'],
			Hallway: ['Light Fixture', 'Closet', 'Flooring', 'Wall'],
			Office: ['Desk Area', 'Window', 'Electrical Outlet', 'Door'],
		}),
		[],
	);

	const categoryOptions = useMemo(() => {
		const existingCategories = allTasks
			.map((task: any) => task.category)
			.filter((category: any): category is string =>
				typeof category === 'string' && category.trim().length > 0,
			)
			.map((category: string) => category.trim());

		return Array.from(new Set([...defaultCategoryOptions, ...existingCategories]));
	}, [allTasks, defaultCategoryOptions]);

	const locationOptions = useMemo(() => {
		const selectedCategory = formState.category?.trim();
		const categorySuggestions = selectedCategory
			? defaultLocationSuggestions[selectedCategory] || []
			: [];
		const existingLocations = allTasks
			.filter((task: any) => {
				if (!selectedCategory) return true;
				return task.category === selectedCategory;
			})
			.map((task: any) => task.location)
			.filter((location: any): location is string =>
				typeof location === 'string' && location.trim().length > 0,
			)
			.map((location: string) => location.trim());

		return Array.from(new Set([...categorySuggestions, ...existingLocations]));
	}, [allTasks, defaultLocationSuggestions, formState.category]);

	const filteredCategoryOptions = useMemo(() => {
		const query = (formState.category || '').trim().toLowerCase();
		if (!query) return categoryOptions;
		return categoryOptions.filter((category) =>
			category.toLowerCase().includes(query),
		);
	}, [categoryOptions, formState.category]);

	const filteredLocationOptions = useMemo(() => {
		const query = (formState.location || '').trim().toLowerCase();
		if (!query) return locationOptions;
		return locationOptions.filter((location) =>
			location.toLowerCase().includes(query),
		);
	}, [locationOptions, formState.location]);

	// Device options for task linking (property-scoped)
	const internalDeviceOptions = React.useMemo(() => {
		const scopedDevices = selectedPropertyId
			? allDevices.filter((device: any) => {
					const devicePropertyId =
						device.propertyId ||
						device.location?.propertyId ||
						device.property?.id ||
						'';
					return devicePropertyId === selectedPropertyId;
			  })
			: allDevices;

		return scopedDevices.map((device) => {
			const displayName =
				device.brand && device.model
					? `${device.brand} ${device.model}`
					: device.type || 'Unknown Appliance';
			return {
				label: `${displayName} (${device.type || 'Unknown Type'})`,
				value: device.id,
			};
		});
	}, [allDevices, selectedPropertyId]);

	// Memoized device change handler to prevent re-renders
	const handleDeviceChange = useCallback((devices: string[]) => {
		setFormState((prev) => ({ ...prev, devices }));
	}, []);

	// Maintenance history options for task linking (property-scoped)
	const internalMaintenanceHistoryOptions = React.useMemo(() => {
		const scopedHistory = selectedPropertyId
			? allMaintenanceHistory.filter((record: any) => {
					const historyPropertyId =
						record.propertyId || record.property?.id || '';
					return historyPropertyId === selectedPropertyId;
			  })
			: allMaintenanceHistory;

		return scopedHistory.map((record) => {
			const dateLabel = record.completionDate
				? new Date(record.completionDate).toLocaleDateString()
				: 'No date';
			return {
				label: `${record.title || 'Maintenance'} - ${dateLabel}`,
				value: record.id,
			};
		});
	}, [allMaintenanceHistory, selectedPropertyId]);

	const linkedDevices = useMemo(() => {
		const linkedIds = formState.devices || [];
		if (!linkedIds.length) return [] as Device[];

		const byId = new Map(
			allDevices.map((device: any) => [device.id, device as Device]),
		);
		return linkedIds
			.map((id) => byId.get(id))
			.filter((device): device is Device => Boolean(device));
	}, [formState.devices, allDevices]);

	const linkedDeviceDetailsSection = useMemo(
		() => buildLinkedDeviceDetailsSection(linkedDevices),
		[linkedDevices],
	);

	useEffect(() => {
		if (!isOpen) return;

		setFormState((prev) => {
			const nextNotes = mergeNotesWithLinkedDeviceDetails(
				prev.notes || '',
				linkedDeviceDetailsSection,
			);

			if (nextNotes === (prev.notes || '')) {
				return prev;
			}

			return {
				...prev,
				notes: nextNotes,
			};
		});
	}, [isOpen, linkedDeviceDetailsSection]);

	// Memoize the found task to prevent unnecessary re-renders
	const foundTask = React.useMemo(() => {
		if (editingTaskId && !editingTask) {
			return allTasks.find((t: any) => t.id === editingTaskId);
		}
		return null;
	}, [editingTaskId, editingTask, allTasks]);

	// initialize form when modal opens or when editingTaskId/initialTask changes
	useEffect(() => {
		if (!isOpen) {
			hasInitializedFormForOpen.current = false;
			return;
		}

		// In create mode, initialize once per modal open so user edits (like unit changes)
		// are not overwritten by parent re-renders that recreate initialTask/defaultForm objects.
		if (
			hasInitializedFormForOpen.current &&
			!isEditing &&
			!editingTaskId &&
			!editingTask
		) {
			return;
		}
		hasInitializedFormForOpen.current = true;

		if (editingTask) {
			setFormState({
				title: editingTask.title || '',
				dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
				status: editingTask.status || 'Initiated',
				requiresWorkOrder: Boolean((editingTask as any).requiresWorkOrder),
				category: editingTask.category || '',
				location: editingTask.location || '',
				notes: editingTask.notes || '',
				priority: editingTask.priority,
				assignedTo: editingTask.assignedTo?.id || editingTask.assignee || '',
				devices: editingTask.devices || [],
				isRecurring: editingTask.isRecurring || false,
				recurrenceFrequency: editingTask.recurrenceFrequency,
				recurrenceInterval: editingTask.recurrenceInterval,
				recurrenceCustomUnit: editingTask.recurrenceCustomUnit,
				enableNotifications: (editingTask as any).enableNotifications || false,
				notifications: (editingTask as any).notifications || [],
				linkedMaintenanceHistoryIds:
					(editingTask as any).linkedMaintenanceHistoryIds || [],
				propertyId:
					(editingTask as any).propertyId ||
					(editingTask as any).property?.id ||
					propertyId ||
					'',
				unitId: (editingTask as any).unitId || unitId || '',
				financials: (editingTask as any).financials || {
					currency: 'USD',
					estimate: {},
				},
			});
			return;
		}

		if (foundTask) {
			setFormState({
				title: foundTask.title || '',
				dueDate: foundTask.dueDate ? foundTask.dueDate.split('T')[0] : '',
				status: foundTask.status || 'Initiated',
				requiresWorkOrder: Boolean((foundTask as any).requiresWorkOrder),
				category: foundTask.category || '',
				location: foundTask.location || '',
				notes: foundTask.notes || '',
				priority: foundTask.priority,
				assignedTo: foundTask.assignedTo?.id || foundTask.assignee || '',
				devices: foundTask.devices || [],
				isRecurring: foundTask.isRecurring || false,
				recurrenceFrequency: foundTask.recurrenceFrequency,
				recurrenceInterval: foundTask.recurrenceInterval,
				recurrenceCustomUnit: foundTask.recurrenceCustomUnit,
				enableNotifications: (foundTask as any).enableNotifications || false,
				notifications: (foundTask as any).notifications || [],
				linkedMaintenanceHistoryIds:
					(foundTask as any).linkedMaintenanceHistoryIds || [],
				propertyId:
					(foundTask as any).propertyId ||
					(foundTask as any).property?.id ||
					propertyId ||
					'',
				unitId: (foundTask as any).unitId || unitId || '',
				financials: (foundTask as any).financials || {
					currency: 'USD',
					estimate: {},
				},
			});
			return;
		}

		if (initialTask) {
			setFormState({
				...defaultForm,
				...initialTask,
				title: initialTask.title || defaultForm.title,
				dueDate: initialTask.dueDate || defaultForm.dueDate,
				status: initialTask.status || defaultForm.status,
				notes: initialTask.notes || defaultForm.notes,
				category: initialTask.category || defaultForm.category,
				location: initialTask.location || defaultForm.location,
				priority: initialTask.priority || defaultForm.priority,
				assignedTo: initialTask.assignedTo || defaultForm.assignedTo,
				devices: initialTask.devices || defaultForm.devices,
				isRecurring: initialTask.isRecurring || defaultForm.isRecurring,
				recurrenceFrequency:
					initialTask.recurrenceFrequency || defaultForm.recurrenceFrequency,
				recurrenceInterval:
					initialTask.recurrenceInterval || defaultForm.recurrenceInterval,
				recurrenceCustomUnit:
					initialTask.recurrenceCustomUnit ||
					defaultForm.recurrenceCustomUnit,
				enableNotifications:
					initialTask.enableNotifications ?? defaultForm.enableNotifications,
				notifications: initialTask.notifications ?? defaultForm.notifications,
				linkedMaintenanceHistoryIds:
					initialTask.linkedMaintenanceHistoryIds ||
					defaultForm.linkedMaintenanceHistoryIds,
				propertyId: initialTask.propertyId || defaultForm.propertyId,
				unitId: initialTask.unitId || defaultForm.unitId,
				financials: initialTask.financials
					? {
						...defaultForm.financials,
						...initialTask.financials,
					}
					: defaultForm.financials,
			});
			return;
		}

		setFormState(defaultForm);
	}, [
		isOpen,
		isEditing,
		editingTaskId,
		editingTask,
		initialTask,
		foundTask,
		defaultForm,
	]);

	const handleChange = (e: React.ChangeEvent<any>) => {
		const { name, value, type, checked } = e.target as any;
		let newValue: any;
		if (name === 'recurrenceInterval') {
			newValue = value === '' ? undefined : parseInt(value, 10);
		} else {
			newValue = type === 'checkbox' ? checked : value;
		}

		if (name === 'propertyId') {
			setFormState((prev) => ({
				...prev,
				propertyId: newValue,
				unitId: '',
				devices: [],
				linkedMaintenanceHistoryIds: [],
			}));
			setPendingLinkedHistoryIds([]);
			return;
		}

		setFormState((prev) => ({
			...prev,
			[name]: newValue,
		}));
	};
	// keep legacy `onChange` variable name for backward-compatible internal usage
	const onChange = handleChange;
	// keep legacy `fd` variable name for backwards-compatibility inside this component
	const fd = formState;

	const [activeTab, setActiveTab] = useState<ActiveTab>('details');
	const tabContentScrollRef = useRef<HTMLDivElement | null>(null);
	const [showCreateMoreOptions, setShowCreateMoreOptions] = useState(false);
	const [isCoreSummaryExpanded, setIsCoreSummaryExpanded] = useState(false);
	const [showLinkHistoryModal, setShowLinkHistoryModal] = useState(false);
	const [pendingLinkedHistoryIds, setPendingLinkedHistoryIds] = useState<
		string[]
	>(fd.linkedMaintenanceHistoryIds || []);
	const wantsRecurrence = Boolean(
		canUseRecurringTaskFeature &&
			(formState.recurrenceFrequency ||
				formState.recurrenceInterval ||
				formState.recurrenceCustomUnit),
	);
	const hasSchedule = Boolean(
		canUseRecurringTaskFeature &&
			formState.recurrenceFrequency &&
			(formState.recurrenceFrequency === 'custom'
				? formState.recurrenceInterval && formState.recurrenceCustomUnit
				: true), // For non-custom frequencies, just need the frequency
	);

	useEffect(() => {
		if (isOpen) {
			setActiveTab('details');
			setSubmitAttempted(false);
			setShowCreateMoreOptions(false);
			setIsCoreSummaryExpanded(false);
			setPendingTaskDocumentFiles([]);
			setPendingTaskDocumentCategory('other');
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		tabContentScrollRef.current?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});
	}, [isOpen, activeTab]);

	const smartScheduleSuggestion = useMemo<SmartScheduleSuggestion | null>(() => {
		const searchPool = `${formState.title || ''} ${formState.category || ''} ${formState.location || ''}`.toLowerCase();
		if (!searchPool.trim()) return null;

		if ((searchPool.includes('hvac') || searchPool.includes('air filter') || searchPool.includes('filter')) && !searchPool.includes('water')) {
			return {
				label: 'HVAC filters usually run on a 90-day cadence.',
				frequency: 'quarterly',
				daysUntilDue: 90,
			};
		}

		if (searchPool.includes('inspection') || searchPool.includes('annual service')) {
			return {
				label: 'Annual inspections work best on a yearly schedule.',
				frequency: 'yearly',
				daysUntilDue: 365,
			};
		}

		if (searchPool.includes('smoke') || searchPool.includes('detector battery')) {
			return {
				label: 'Smoke detector checks are commonly done every 6 months.',
				frequency: 'custom',
				interval: 6,
				customUnit: 'months',
				daysUntilDue: 180,
			};
		}

		if (searchPool.includes('gutter')) {
			return {
				label: 'Gutter cleaning is often repeated every 6 months.',
				frequency: 'custom',
				interval: 6,
				customUnit: 'months',
				daysUntilDue: 180,
			};
		}

		return null;
	}, [formState.category, formState.location, formState.title]);

	const hasAppliedSmartSchedule = Boolean(
		formState.recurrenceFrequency ||
		formState.recurrenceInterval ||
		formState.recurrenceCustomUnit,
	);

	const applySmartSchedule = () => {
		if (!smartScheduleSuggestion) return;
		if (!canUseRecurringTaskFeature) {
			feedback.notify('Recurring tasks are a Homeowner+ feature.');
			return;
		}

		const suggestedDueDate = new Date();
		suggestedDueDate.setDate(suggestedDueDate.getDate() + smartScheduleSuggestion.daysUntilDue);
		const dueDateIso = suggestedDueDate.toISOString().split('T')[0];

		setFormState((prev) => ({
			...prev,
			recurrenceFrequency: smartScheduleSuggestion.frequency,
			recurrenceInterval: smartScheduleSuggestion.interval,
			recurrenceCustomUnit: smartScheduleSuggestion.customUnit,
			dueDate:
				!prev.dueDate || prev.dueDate === new Date().toISOString().split('T')[0]
					? dueDateIso
					: prev.dueDate,
		}));
	};

	const stripRecurringFieldsForPlan = useCallback(
		(taskData: any) => {
			if (canUseRecurringTaskFeature) {
				return taskData;
			}

			const nextTask = { ...taskData };
			nextTask.isRecurring = false;
			delete nextTask.recurrenceFrequency;
			delete nextTask.recurrenceInterval;
			delete nextTask.recurrenceCustomUnit;
			delete nextTask.parentTaskId;
			delete nextTask.lastRecurrenceDate;
			return nextTask;
		},
		[canUseRecurringTaskFeature],
	);

	useEffect(() => {
		if (canUseRecurringTaskFeature) return;
		if (
			formState.isRecurring ||
			formState.recurrenceFrequency ||
			formState.recurrenceInterval ||
			formState.recurrenceCustomUnit
		) {
			setFormState((prev) => ({
				...prev,
				isRecurring: false,
				recurrenceFrequency: undefined,
				recurrenceInterval: undefined,
				recurrenceCustomUnit: undefined,
			}));
		}
	}, [
		canUseRecurringTaskFeature,
		formState.isRecurring,
		formState.recurrenceCustomUnit,
		formState.recurrenceFrequency,
		formState.recurrenceInterval,
	]);

	useEffect(() => {
		if (hasSchedule && !formState.isRecurring) {
			setFormState((prev) => ({ ...prev, isRecurring: true }));
		}

		if (!hasSchedule && formState.isRecurring) {
			setFormState((prev) => ({ ...prev, isRecurring: false }));
		}
	}, [hasSchedule, formState.isRecurring]);

	useEffect(() => {
		if (!showLinkHistoryModal) return;
		setPendingLinkedHistoryIds(formState.linkedMaintenanceHistoryIds || []);
	}, [showLinkHistoryModal, formState.linkedMaintenanceHistoryIds]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				categoryWrapRef.current?.contains(target) ||
				locationWrapRef.current?.contains(target)
			) {
				return;
			}
			setActiveSuggestion(null);
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleToggleHistory = (historyId: string) => {
		setPendingLinkedHistoryIds((prev) =>
			prev.includes(historyId)
				? prev.filter((id) => id !== historyId)
				: [...prev, historyId],
		);
	};

	const handleSaveLinkedHistory = (e: React.FormEvent) => {
		e.preventDefault();
		onChange({
			target: {
				name: 'linkedMaintenanceHistoryIds',
				value: pendingLinkedHistoryIds,
				type: 'custom',
			},
		} as any);
		setShowLinkHistoryModal(false);
	};

	const handleFinancialEstimateChange = (
		field: keyof CostBreakdown,
		value: string,
	) => {
		setFormState((prev) => ({
			...prev,
			financials: {
				...(prev.financials || {}),
				currency: prev.financials?.currency || 'USD',
				estimate: {
					...(prev.financials?.estimate || {}),
					[field]: toNumberOrUndefined(value),
				},
			},
		}));
	};

		const isCreateMode = !isEditing;
		const isAsap = !formState.dueDate;
		const requiresPropertySelection = propertyOptions.length > 0 && !propertyId;
		const missingRequiredFields = useMemo(() => {
			const missing: string[] = [];
			if (requiresPropertySelection && !String(formState.propertyId || '').trim()) {
				missing.push('Property');
			}
			if (!String(formState.title || '').trim()) {
				missing.push('Task Name');
			}
			if (!String(formState.priority || '').trim()) {
				missing.push('Priority');
			}
			return missing;
		}, [formState.priority, formState.propertyId, formState.title, requiresPropertySelection]);

		const completedBasics = useMemo(() => {
			const checks = [
				!requiresPropertySelection || Boolean(String(formState.propertyId || '').trim()),
				Boolean(String(formState.title || '').trim()),
				Boolean(String(formState.priority || '').trim()),
			];
			return checks.filter(Boolean).length;
		}, [formState.priority, formState.propertyId, formState.title, requiresPropertySelection]);

		const detailsTabTone = missingRequiredFields.length > 0 ? 'warning' : 'success';

		const detailsError = submitAttempted && missingRequiredFields.length > 0;

		const sanitizeCostBreakdown = (
			costs?: CostBreakdown,
		): CostBreakdown | undefined => {
			if (!costs) return undefined;
		const sanitized: CostBreakdown = {};
		if (costs.contractorCost !== undefined) {
			sanitized.contractorCost = costs.contractorCost;
		}
		if (costs.materialsCost !== undefined) {
			sanitized.materialsCost = costs.materialsCost;
		}
		if (costs.laborCost !== undefined) {
			sanitized.laborCost = costs.laborCost;
		}
		if (costs.otherCost !== undefined) {
			sanitized.otherCost = costs.otherCost;
		}
		return hasCostData(sanitized) ? sanitized : undefined;
	};

	const getLinkedDevicesForSubmit = useCallback(async (): Promise<Device[]> => {
		const selectedDeviceIds = formState.devices || [];
		if (selectedDeviceIds.length === 0) {
			return [];
		}

		const cachedDevicesById = new Map(
			allDevices.map((device: any) => [device.id, device as Device]),
		);

		const fetchedDevices = await Promise.all(
			selectedDeviceIds.map(async (deviceId) => {
				try {
					const deviceSnapshot = await getDoc(doc(db, 'devices', deviceId));
					if (!deviceSnapshot.exists()) {
						return cachedDevicesById.get(deviceId) || null;
					}

					return {
						id: deviceSnapshot.id,
						...(deviceSnapshot.data() as Omit<Device, 'id'>),
					} as Device;
				} catch (error) {
					console.warn('Failed to load full linked appliance details for task notes', {
						deviceId,
						error,
					});
					return cachedDevicesById.get(deviceId) || null;
				}
			}),
		);

		return fetchedDevices.filter((device): device is Device => Boolean(device));
	}, [allDevices, formState.devices]);

	const uploadPendingTaskDocuments = async (
		savedTaskId: string,
		scopedPropertyId: string,
		savedTaskStatus?: string,
	) => {
		if (!savedTaskId || !scopedPropertyId || pendingTaskDocumentFiles.length === 0) {
			return;
		}

		const propertyForDocuments =
			allProperties.find((property: any) => property.id === scopedPropertyId) ||
			selectedProperty;
		if (!propertyForDocuments) {
			feedback.notify('Task saved, but property details were still loading so documents were not uploaded.');
			return;
		}
		const propertyDocuments = Array.isArray(propertyForDocuments?.documents)
			? propertyForDocuments.documents
			: [];
		const uploadedDocuments = await Promise.all(
			pendingTaskDocumentFiles.map((file) =>
				uploadPropertyDocument(file, scopedPropertyId, pendingTaskDocumentCategory),
			),
		);

		await updateProperty({
			id: scopedPropertyId,
			updates: {
				documents: [
					...propertyDocuments,
					...uploadedDocuments.map((document) => ({
						...document,
						assignedTaskId: savedTaskId,
						assignedTaskStatus:
							savedTaskStatus === 'Completed' ? 'Completed' : 'Pending',
					})),
				],
			},
		}).unwrap();
		setPendingTaskDocumentFiles([]);
		setPendingTaskDocumentCategory('other');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitAttempted(true);

		if (missingRequiredFields.length > 0) {
			setActiveTab('details');
			titleInputRef.current?.focus();
			return;
		}

		const scopedPropertyId = formState.propertyId || propertyId || '';
		const normalizedDraftTitle = normalizeTaskTitle(formState.title);
		if (normalizedDraftTitle && scopedPropertyId && !isEditing) {
			const duplicateTask = allTasks.find((task: any) => {
				const taskPropertyId = String(task?.propertyId || task?.property?.id || '').trim();
				const taskStatus = String(task?.status || '').trim();
				return (
					taskPropertyId === scopedPropertyId &&
					taskStatus !== 'Completed' &&
					normalizeTaskTitle(task?.title) === normalizedDraftTitle
				);
			});

			if (duplicateTask) {
				feedback.notify('A task with this title already exists for the selected property.');
				return;
			}
		}

		try {
			const linkedDevicesForSubmit = await getLinkedDevicesForSubmit();
			const linkedDeviceNotesForSubmit = buildLinkedDeviceDetailsSection(
				linkedDevicesForSubmit,
			);
			const estimatedCosts = sanitizeCostBreakdown(formState.financials?.estimate);
			const actualCosts = sanitizeCostBreakdown(formState.financials?.actual);
			const financialNotes = formState.financials?.notes?.trim();
			const mergedNotes = mergeNotesWithLinkedDeviceDetails(
				formState.notes || '',
				linkedDeviceNotesForSubmit,
			);
			const sanitizedFinancials =
				estimatedCosts || actualCosts || financialNotes
					? {
						currency: formState.financials?.currency || 'USD',
						...(estimatedCosts ? { estimate: estimatedCosts } : {}),
						...(actualCosts ? { actual: actualCosts } : {}),
						...(financialNotes ? { notes: financialNotes } : {}),
					}
					: undefined;
			// Determine if this is an update operation
			const taskId = editingTaskId || editingTask?.id;
			const isUpdate = !!taskId;

			if (isUpdate) {
				if (!taskId) {
					console.error('TaskModal: No task ID available for update');
					feedback.notify('Unable to update task: missing task ID');
					return;
				}
				let updatesRaw: any = {
					...formState,
					dueDate: formState.dueDate?.trim() || '',
					notes: mergedNotes,
					financials: sanitizedFinancials,
				};
				// clean nested undefined in notifications to avoid Firestore errors
				if (
					updatesRaw.notifications &&
					Array.isArray(updatesRaw.notifications)
				) {
					updatesRaw.notifications = updatesRaw.notifications.map((n: any) => {
						const copy = { ...n };
						Object.keys(copy).forEach((k) => {
							if (copy[k] === undefined) delete copy[k];
						});
						return copy;
					});
				}

				// Convert assignedTo from string (user ID) to object format
				if (updatesRaw.assignedTo && assigneeOptions) {
					const selectedOption = assigneeOptions.find(
						(option) => option.value === updatesRaw.assignedTo,
					);
					if (selectedOption) {
						const assignedToObj: any = {
							id: selectedOption.value,
							name: selectedOption.label,
						};
						// Only include email if it exists and is not empty
						if (selectedOption.email && selectedOption.email.trim()) {
							assignedToObj.email = selectedOption.email;
						}
						updatesRaw.assignedTo = assignedToObj;
					}
				} else if (!updatesRaw.assignedTo) {
					// If assignedTo is empty, remove it
					delete updatesRaw.assignedTo;
				}

				// Keep appliance and history linking optional by omitting empty arrays.
				if (Array.isArray(updatesRaw.devices) && updatesRaw.devices.length === 0) {
					delete updatesRaw.devices;
				}
				if (
					Array.isArray(updatesRaw.linkedMaintenanceHistoryIds) &&
					updatesRaw.linkedMaintenanceHistoryIds.length === 0
				) {
					delete updatesRaw.linkedMaintenanceHistoryIds;
				}

				const updates = Object.fromEntries(
					Object.entries(stripRecurringFieldsForPlan(updatesRaw)).filter(
						([, value]) => value !== undefined,
					),
				);

				const updated = await updateTaskApi({
					id: taskId,
					updates,
				}).unwrap();
				await uploadPendingTaskDocuments(
					taskId,
					String(updates.propertyId || formState.propertyId || propertyId || ''),
					String(updates.status || formState.status || ''),
				);
				dispatch(updateTask(updated));
				onSaved?.(updated);
				onClose();
			} else {
				let newTaskRaw: any = {
					...formState,
					dueDate: formState.dueDate?.trim() || '',
					notes: mergedNotes,
					financials: sanitizedFinancials,
					propertyId: formState.propertyId || propertyId || '',
					userId: effectiveCurrentUser?.id || '',
					property: selectedProperty?.title || '',
				};
				// sanitize notifications objects
				if (
					newTaskRaw.notifications &&
					Array.isArray(newTaskRaw.notifications)
				) {
					newTaskRaw.notifications = newTaskRaw.notifications.map((n: any) => {
						const copy = { ...n };
						Object.keys(copy).forEach((k) => {
							if (copy[k] === undefined) delete copy[k];
						});
						return copy;
					});
				}

				// Convert assignedTo from string (user ID) to object format
				if (newTaskRaw.assignedTo && assigneeOptions) {
					const selectedOption = assigneeOptions.find(
						(option) => option.value === newTaskRaw.assignedTo,
					);
					if (selectedOption) {
						const assignedToObj: any = {
							id: selectedOption.value,
							name: selectedOption.label,
						};
						// Only include email if it exists and is not empty
						if (selectedOption.email && selectedOption.email.trim()) {
							assignedToObj.email = selectedOption.email;
						}
						newTaskRaw.assignedTo = assignedToObj;
					}
				} else if (!newTaskRaw.assignedTo) {
					// If assignedTo is empty, remove it
					delete newTaskRaw.assignedTo;
				}

				// Keep appliance and history linking optional by omitting empty arrays.
				if (Array.isArray(newTaskRaw.devices) && newTaskRaw.devices.length === 0) {
					delete newTaskRaw.devices;
				}
				if (
					Array.isArray(newTaskRaw.linkedMaintenanceHistoryIds) &&
					newTaskRaw.linkedMaintenanceHistoryIds.length === 0
				) {
					delete newTaskRaw.linkedMaintenanceHistoryIds;
				}

				// Filter out undefined values to prevent Firestore errors
				const newTask = Object.fromEntries(
					Object.entries(stripRecurringFieldsForPlan(newTaskRaw)).filter(
						([, value]) => value !== undefined,
					),
				) as any;

				const created = await createTask(newTask).unwrap();
				await uploadPendingTaskDocuments(
					created.id,
					created.propertyId || newTask.propertyId || '',
					created.status || newTask.status,
				);
				dispatch(addTask(created));
				onSaved?.(created);
				onClose();
			}
		} catch (error) {
			console.error('Error saving task:', error);
			feedback.notify('Failed to save task. Please try again.');
		}
	};

	return (
		<>
			<GenericModal
				isOpen={isOpen}
				title={isEditing ? 'Refine Maintenance Task' : 'Create Maintenance Task'}
				onClose={onClose}
				onSubmit={handleSubmit}
				showActions={true}
				primaryButtonLabel={isEditing ? 'Save Changes' : 'Create Maintenance Task'}
				secondaryButtonLabel='Cancel'
				primaryButtonDisabled={missingRequiredFields.length > 0}>
				<StickyTabRail>
				<ModalTabContainer>
					<ModalTab
						type='button'
						$active={activeTab === 'details'}
						onClick={() => setActiveTab('details')}>
						<TabLabel>
							Task Details
							{missingRequiredFields.length > 0 && (
								<TabBadge $tone={detailsTabTone}>
									{`${missingRequiredFields.length} required`}
								</TabBadge>
							)}
						</TabLabel>
					</ModalTab>
					{isCreateMode ? (
						<ModalTab
							type='button'
							$active={activeTab === 'advanced'}
							onClick={() => setActiveTab('advanced')}>
							<TabLabel>
								More Options
							</TabLabel>
						</ModalTab>
					) : (
						<>
							<ModalTab
								type='button'
								$active={activeTab === 'schedule'}
								onClick={() => setActiveTab('schedule')}>
								<TabLabel>
									Recurrence
								</TabLabel>
							</ModalTab>
							<ModalTab
								type='button'
								$active={activeTab === 'notifications'}
								onClick={() => setActiveTab('notifications')}>
								<TabLabel>
									Notifications
								</TabLabel>
							</ModalTab>
							<ModalTab
								type='button'
								$active={activeTab === 'financial'}
								onClick={() => setActiveTab('financial')}>
								<TabLabel>
									Financials
								</TabLabel>
							</ModalTab>
						</>
					)}
				</ModalTabContainer>
				</StickyTabRail>

				<TabContentScrollArea ref={tabContentScrollRef}>
					<ModalTabContent $active={activeTab === 'details'}>
					{isCreateMode && (
						<SummaryBanner>
							<SummaryBannerHeader>
								<SummaryPill $tone={detailsTabTone}>
									{completedBasics}/3 core items complete
								</SummaryPill>
								<SummaryToggleButton
									type='button'
									onClick={() =>
										setIsCoreSummaryExpanded((prev) => !prev)
									}>
									{isCoreSummaryExpanded ? 'Hide details' : 'Show details'}
								</SummaryToggleButton>
							</SummaryBannerHeader>
							{isCoreSummaryExpanded && (
								<>
									<SummaryTitle>Create the maintenance task first, then add optional automation if needed.</SummaryTitle>
									<SummaryMeta>
										<SummaryPill $tone='neutral'>Lifecycle status defaults to Initiated</SummaryPill>
										<SummaryPill $tone={isAsap ? 'success' : 'neutral'}>
											{isAsap ? 'ASAP task' : 'Scheduled task'}
										</SummaryPill>
									</SummaryMeta>
									<RequiredList>
										{missingRequiredFields.length > 0
											? `Still needed: ${missingRequiredFields.join(', ')}`
											: 'All required fields are complete. You can create this maintenance task now or continue with optional settings.'}
									</RequiredList>
								</>
							)}
						</SummaryBanner>
					)}
					<FormGrid>
						<FormGroupFull>
							<SectionHeader>
								<SectionTitle>Core Setup</SectionTitle>
								<SectionDescription>
									Define what needs to be done, where it belongs, and how urgent it is.
								</SectionDescription>
							</SectionHeader>
						</FormGroupFull>

						<FormGroup>
							<FormLabel>Task Title *</FormLabel>
							<FormInput
								ref={titleInputRef}
								type='text'
								name='title'
								value={formState.title}
								onChange={handleChange}
								placeholder={taskTitlePlaceholder}
								required
							/>
							{detailsError && !String(formState.title || '').trim() && (
								<FieldError>Task title is required.</FieldError>
							)}
						</FormGroup>

						{propertyOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Property *</FormLabel>
								<TaskSelect
									name='propertyId'
									value={formState.propertyId || ''}
									onChange={(value) =>
										handleChange({
											target: { name: 'propertyId', value, type: 'select-one' },
										} as any)
									}
									placeholder='Select a property...'
									options={propertyOptions}
								/>
								{detailsError && requiresPropertySelection && !String(formState.propertyId || '').trim() && (
									<FieldError>Select a property for this task.</FieldError>
								)}
							</FormGroup>
						)}

						<FormGroup>
							<FormLabel>Priority *</FormLabel>
							<TaskSelect
								name='priority'
								value={formState.priority || ''}
								onChange={(value) =>
									onChange({
										target: { name: 'priority', value, type: 'select-one' },
									} as any)
								}
								placeholder='Select a priority...'
								options={priorityOptions.map((priority) => ({
									value: priority,
									label: priority,
								}))}
							/>
							{detailsError && !String(formState.priority || '').trim() && (
									<FieldError>Select a priority to keep maintenance planning clear.</FieldError>
							)}
						</FormGroup>

						<FormGroup>
							<FormLabel>Due Timing</FormLabel>
							<DueDateModeGroup>
								<DueDateModeButton
									type='button'
									$active={!isAsap}
									onClick={() =>
										setFormState((prev) => ({
											...prev,
											dueDate: prev.dueDate || new Date().toISOString().split('T')[0],
										}))
									}>
									Due date
								</DueDateModeButton>
								<DueDateModeButton
									type='button'
									$active={isAsap}
									onClick={() =>
										setFormState((prev) => ({
											...prev,
											dueDate: '',
										}))
									}>
									ASAP
								</DueDateModeButton>
							</DueDateModeGroup>
							{isAsap ? (
								<HelperBox>
									This task will be created without a due date and can be addressed as soon as capacity allows.
								</HelperBox>
							) : (
								<>
									<FormInput
										type='date'
										name='dueDate'
										value={formState.dueDate}
										onChange={onChange}
									/>
									<FieldHint>
										Pick a target date when this maintenance task should be completed.
									</FieldHint>
								</>
							)}
						</FormGroup>

						{isCreateMode && smartScheduleSuggestion && !hasAppliedSmartSchedule && (
							<FormGroupFull>
								<HelperBox>
									<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
										<strong style={{ color: '#166534' }}>Smart default:</strong>
										<span>{smartScheduleSuggestion.label}</span>
										<MoreOptionsToggle type='button' onClick={applySmartSchedule}>
											Apply Suggested Schedule
										</MoreOptionsToggle>
									</div>
								</HelperBox>
							</FormGroupFull>
						)}

						{isCreateMode && (
							<FormGroupFull>
								<MoreOptionsToggle
									type='button'
									$active={showCreateMoreOptions}
									onClick={() => setShowCreateMoreOptions((prev) => !prev)}>
									{showCreateMoreOptions ? 'Hide More Options' : 'Show More Options'}
								</MoreOptionsToggle>
							</FormGroupFull>
						)}

						{(!isCreateMode || showCreateMoreOptions) && (
							<>

						<FormGroupFull>
							<SectionHeader>
								<SectionTitle>Assignment and context</SectionTitle>
								<SectionDescription>
									Add people and system context so the work is repeatable and traceable.
								</SectionDescription>
							</SectionHeader>
						</FormGroupFull>

						<FormGroup>
							<FormLabel>Category</FormLabel>
							<SuggestionInputWrap ref={categoryWrapRef}>
								<FormInput
									type='text'
									name='category'
									value={formState.category || ''}
									onChange={handleChange}
									onFocus={() => setActiveSuggestion('category')}
									placeholder='e.g., Kitchen'
								/>
								{activeSuggestion === 'category' &&
									filteredCategoryOptions.length > 0 && (
										<SuggestionDropdown>
											{filteredCategoryOptions.map((category) => (
												<SuggestionItem
													type='button'
													key={category}
													$active={
														(formState.category || '').trim() === category
													}
													onMouseDown={(e) => e.preventDefault()}
													onClick={() => {
														setFormState((prev) => ({
															...prev,
															category,
														}));
														setActiveSuggestion(null);
													}}>
													{category}
												</SuggestionItem>
											))}
										</SuggestionDropdown>
									)}
							</SuggestionInputWrap>
						</FormGroup>

						<FormGroup>
							<FormLabel>Location</FormLabel>
							<SuggestionInputWrap ref={locationWrapRef}>
								<FormInput
									type='text'
									name='location'
									value={formState.location || ''}
									onChange={handleChange}
									onFocus={() => setActiveSuggestion('location')}
									placeholder='e.g., Sink'
								/>
								{activeSuggestion === 'location' &&
									filteredLocationOptions.length > 0 && (
										<SuggestionDropdown>
											{filteredLocationOptions.map((location) => (
												<SuggestionItem
													type='button'
													key={location}
													$active={
														(formState.location || '').trim() === location
													}
													onMouseDown={(e) => e.preventDefault()}
													onClick={() => {
														setFormState((prev) => ({
															...prev,
															location,
														}));
														setActiveSuggestion(null);
													}}>
													{location}
												</SuggestionItem>
											))}
										</SuggestionDropdown>
									)}
							</SuggestionInputWrap>
						</FormGroup>

								{/* Units are temporarily hidden from the app flow.
								{filteredUnitOptions.length > 0 && (
									<FormGroup>
										<FormLabel>Unit</FormLabel>
										<TaskSelect
											name='unitId'
											value={formState.unitId || ''}
											onChange={(value) =>
												handleChange({
													target: { name: 'unitId', value, type: 'select-one' },
												} as any)
											}
											placeholder='(none)'
											options={[
												{ value: '', label: '(none)' },
												...filteredUnitOptions,
											]}
										/>
									</FormGroup>
								)}
								*/}

						{assigneeOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Assigned To</FormLabel>
								<TaskSelect
									name='assignedTo'
									value={formState.assignedTo || ''}
									onChange={(value) =>
										onChange({
											target: { name: 'assignedTo', value, type: 'select-one' },
										} as any)
									}
									placeholder='Unassigned'
									options={[
										{
											value: '',
											label:
												currentUser && formState.assignedTo === currentUser.id
													? 'Unassign me'
													: 'Unassigned',
										},
										...assigneeOptions,
									]}
								/>
							</FormGroup>
						)}

						{internalDeviceOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Connected Appliances (Optional)</FormLabel>
								<MultiSelect
									options={internalDeviceOptions}
									value={formState.devices || []}
									onChange={handleDeviceChange}
									placeholder='Select appliances for this task...'
								/>
								<small style={{ color: '#6b7280' }}>
									Linked appliance service items are automatically appended to task
									notes when you save. Leave blank for non-appliance tasks.
								</small>
							</FormGroup>
						)}

						{internalMaintenanceHistoryOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Linked Maintenance Records</FormLabel>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<button
										type='button'
										onClick={() => setShowLinkHistoryModal(true)}
										style={{
											padding: '8px 12px',
											background: '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											cursor: 'pointer',
											fontSize: '14px',
										}}>
										🔗 Link Maintenance Records (
										{formState.linkedMaintenanceHistoryIds?.length || 0})
									</button>
									{(formState.linkedMaintenanceHistoryIds?.length || 0) > 0 && (
										<span style={{ fontSize: '12px', color: '#6b7280' }}>
											{formState.linkedMaintenanceHistoryIds?.length} linked
										</span>
									)}
								</div>
							</FormGroup>
						)}

						<FormGroupFull>
							<TaskDocumentsPanel
								property={selectedProperty}
								propertyId={selectedPropertyId}
								taskId={editingTaskId || editingTask?.id || foundTask?.id}
								taskStatus={formState.status}
								canUpload={Boolean(selectedPropertyId)}
								pendingFiles={pendingTaskDocumentFiles}
								onPendingFilesChange={setPendingTaskDocumentFiles}
								pendingCategory={pendingTaskDocumentCategory}
								onPendingCategoryChange={setPendingTaskDocumentCategory}
							/>
						</FormGroupFull>

						{!isCreateMode && (
							<>
								<FormGroupFull>
									<SectionHeader>
										<SectionTitle>Task</SectionTitle>
										<SectionDescription>
											Adjust lifecycle state and completion rules when editing an existing task.
										</SectionDescription>
									</SectionHeader>
								</FormGroupFull>
								<FormGroup>
									<FormLabel>Status *</FormLabel>
									<TaskSelect
										name='status'
										value={formState.status || ''}
										onChange={(value) =>
											handleChange({
												target: { name: 'status', value, type: 'select-one' },
											} as any)
										}
										placeholder='Select a status...'
										options={statusOptions.map((status) => ({
											value: status,
											label: status,
										}))}
									/>
								</FormGroup>

								<FormGroup>
									<FormLabel>Completion Requirement</FormLabel>
									<CheckboxRow>
										<input
											type='checkbox'
											name='requiresWorkOrder'
											checked={Boolean(formState.requiresWorkOrder)}
											onChange={handleChange}
										/>
										Require completion form/work order when marking complete
									</CheckboxRow>
								</FormGroup>
							</>
						)}

						<FormGroupFull>
							<FormLabel>Task Notes</FormLabel>
							<FormTextarea
								name='notes'
								value={formState.notes}
								onChange={onChange}
								placeholder='Add any notes about this task...'
							/>
						</FormGroupFull>
							</>
						)}
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'advanced'}>
					<AdvancedStack>
						<SectionCard>
							<SectionHeader>
								<SectionTitle>Task defaults</SectionTitle>
								<SectionDescription>
									These settings are optional during creation. You can keep the defaults and update them later.
								</SectionDescription>
							</SectionHeader>
							<FormGrid>
								<FormGroup>
									<FormLabel>Status *</FormLabel>
									<TaskSelect
										name='status'
										value={formState.status || ''}
										onChange={(value) =>
											handleChange({
												target: { name: 'status', value, type: 'select-one' },
											} as any)
										}
										placeholder='Select a status...'
										options={statusOptions.map((status) => ({
											value: status,
											label: status,
										}))}
									/>
									<FieldHint>
										New tasks usually start as Initiated.
									</FieldHint>
								</FormGroup>

								<FormGroup>
									<FormLabel>Completion Requirement</FormLabel>
									<CheckboxRow>
										<input
											type='checkbox'
											name='requiresWorkOrder'
											checked={Boolean(formState.requiresWorkOrder)}
											onChange={handleChange}
										/>
										Require completion form/work order when marking complete
									</CheckboxRow>
								</FormGroup>
							</FormGrid>
						</SectionCard>

						<SectionCard>
							<SectionHeader>
								<SectionTitle>
									Recurrence {!canUseRecurringTaskFeature && <TabBadge>Homeowner+</TabBadge>}
								</SectionTitle>
								<SectionDescription>
									{canUseRecurringTaskFeature
										? 'Only configure this if the task should regenerate after completion.'
										: 'Recurring task schedules are available with Homeowner+.'}
								</SectionDescription>
							</SectionHeader>
							<FormGrid>
								<FormGroup>
									<FormLabel>Recurrence Frequency</FormLabel>
									<TaskSelect
										name='recurrenceFrequency'
										value={formState.recurrenceFrequency || ''}
										onChange={(value) =>
											onChange({
												target: {
													name: 'recurrenceFrequency',
													value,
													type: 'select-one',
												},
											} as any)
										}
										placeholder='No recurrence'
										disabled={!canUseRecurringTaskFeature}
										options={[
											{ value: 'daily', label: 'Daily' },
											{ value: 'weekly', label: 'Weekly' },
											{ value: 'biweekly', label: 'Every 2 Weeks' },
											{ value: 'monthly', label: 'Monthly' },
											{ value: 'quarterly', label: 'Every 3 Months' },
											{ value: 'yearly', label: 'Yearly' },
											{ value: 'custom', label: 'Custom' },
										]}
									/>
								</FormGroup>

								{formState.recurrenceFrequency === 'custom' && (
									<FormGroup>
										<FormLabel>Interval</FormLabel>
										<FormInput
											type='number'
											name='recurrenceInterval'
											value={formState.recurrenceInterval ?? ''}
											onChange={onChange}
											min='1'
											max='365'
											placeholder='e.g. 3'
										/>
									</FormGroup>
								)}

								{formState.recurrenceFrequency === 'custom' && (
									<FormGroup>
										<FormLabel>Time Unit</FormLabel>
										<TaskSelect
											name='recurrenceCustomUnit'
											value={formState.recurrenceCustomUnit || ''}
											onChange={(value) =>
												onChange({
													target: {
														name: 'recurrenceCustomUnit',
														value,
														type: 'select-one',
													},
												} as any)
											}
											placeholder='Select unit...'
											options={[
												{ value: 'days', label: 'Days' },
												{ value: 'weeks', label: 'Weeks' },
												{ value: 'months', label: 'Months' },
												{ value: 'years', label: 'Years' },
											]}
										/>
									</FormGroup>
								)}

								<FormGroupFull>
									<FieldHint>
										{canUseRecurringTaskFeature
											? 'When recurrence is enabled, completing the task creates the next occurrence automatically.'
											: 'You can still create a one-time task and update it manually when needed.'}
									</FieldHint>
								</FormGroupFull>
							</FormGrid>
						</SectionCard>

						<SectionCard>
							<SectionHeader>
								<SectionTitle>Notifications</SectionTitle>
								<SectionDescription>
									Enable reminders only if this task needs due-date or overdue nudges.
								</SectionDescription>
							</SectionHeader>
							<FormGrid>
								<FormGroupFull>
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<input
											type='checkbox'
											id='enableNotifications-create'
											name='enableNotifications'
											checked={formState.enableNotifications || false}
											onChange={(e) => {
												const isChecked = e.target.checked;
												onChange({
													target: {
														name: 'enableNotifications',
														value: isChecked,
														checked: isChecked,
														type: 'checkbox',
													},
												} as any);

												if (
													isChecked &&
													(!formState.notifications || formState.notifications.length === 0)
												) {
													onChange({
														target: {
															name: 'notifications',
															value: getDefaultTaskNotifications(),
															type: 'custom',
														},
													} as any);
												}
											}}
										/>
										<FormLabel htmlFor='enableNotifications-create' style={{ margin: 0 }}>
											Enable task notifications
										</FormLabel>
									</div>
									<FieldHint>
										Default reminders are added automatically and can be customized later.
									</FieldHint>
								</FormGroupFull>
							</FormGrid>
						</SectionCard>

						<SectionCard>
							<SectionHeader>
								<SectionTitle>Financial estimate</SectionTitle>
								<SectionDescription>
									Capture estimated cost now if it helps with approval or planning.
								</SectionDescription>
							</SectionHeader>
							<FormGrid>
								<FormGroup>
									<FormLabel>Contractor Cost</FormLabel>
									<FormInput
										type='number'
										min='0'
										step='0.01'
										value={formState.financials?.estimate?.contractorCost ?? ''}
										onChange={(e) => handleFinancialEstimateChange('contractorCost', e.target.value)}
										placeholder='0.00'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel>Materials Cost</FormLabel>
									<FormInput
										type='number'
										min='0'
										step='0.01'
										value={formState.financials?.estimate?.materialsCost ?? ''}
										onChange={(e) => handleFinancialEstimateChange('materialsCost', e.target.value)}
										placeholder='0.00'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel>Labor Cost</FormLabel>
									<FormInput
										type='number'
										min='0'
										step='0.01'
										value={formState.financials?.estimate?.laborCost ?? ''}
										onChange={(e) => handleFinancialEstimateChange('laborCost', e.target.value)}
										placeholder='0.00'
									/>
								</FormGroup>
								<FormGroup>
									<FormLabel>Other Cost</FormLabel>
									<FormInput
										type='number'
										min='0'
										step='0.01'
										value={formState.financials?.estimate?.otherCost ?? ''}
										onChange={(e) => handleFinancialEstimateChange('otherCost', e.target.value)}
										placeholder='0.00'
									/>
								</FormGroup>
								<FormGroupFull>
									<HelperBox>
										Estimated Total: {formatCurrency(
											calculateCostTotal(formState.financials?.estimate),
											formState.financials?.currency || 'USD',
										)}
									</HelperBox>
								</FormGroupFull>
							</FormGrid>
						</SectionCard>
					</AdvancedStack>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'schedule'}>
					<FormGrid>
						<FormGroup>
							<FormLabel>
								Recurrence Frequency {!canUseRecurringTaskFeature && <TabBadge>Homeowner+</TabBadge>}
							</FormLabel>
							<TaskSelect
								name='recurrenceFrequency'
								value={formState.recurrenceFrequency || ''}
								onChange={(value) =>
									onChange({
										target: {
											name: 'recurrenceFrequency',
											value,
											type: 'select-one',
										},
									} as any)
								}
								placeholder='Select frequency...'
								disabled={!canUseRecurringTaskFeature}
								options={[
									{ value: 'daily', label: 'Daily' },
									{ value: 'weekly', label: 'Weekly' },
									{ value: 'biweekly', label: 'Every 2 Weeks' },
									{ value: 'monthly', label: 'Monthly' },
									{ value: 'quarterly', label: 'Every 3 Months' },
									{ value: 'yearly', label: 'Yearly' },
									{ value: 'custom', label: 'Custom' },
								]}
							/>
						</FormGroup>

						{formState.recurrenceFrequency === 'custom' && (
							<FormGroup>
								<FormLabel>Interval *</FormLabel>
								<FormInput
									type='number'
									name='recurrenceInterval'
									value={formState.recurrenceInterval ?? ''}
									onChange={onChange}
									min='1'
									max='365'
									required={
										formState.recurrenceFrequency === 'custom' &&
										wantsRecurrence
									}
									placeholder='e.g., 3 for every 3 days'
								/>
							</FormGroup>
						)}

						{formState.recurrenceFrequency === 'custom' && (
							<FormGroup>
								<FormLabel>Time Unit *</FormLabel>
								<TaskSelect
									name='recurrenceCustomUnit'
									value={formState.recurrenceCustomUnit || ''}
									onChange={(value) =>
										onChange({
											target: {
												name: 'recurrenceCustomUnit',
												value,
												type: 'select-one',
											},
										} as any)
									}
									placeholder='Select unit...'
									options={[
										{ value: 'days', label: 'Days' },
										{ value: 'weeks', label: 'Weeks' },
										{ value: 'months', label: 'Months' },
										{ value: 'years', label: 'Years' },
									]}
								/>
							</FormGroup>
						)}

						<FormGroupFull>
							{canUseRecurringTaskFeature && (
							<small style={{ color: '#6b7280' }}>
								📋 This task will automatically create a new copy with an
								updated due date each time it is marked as completed.
							</small>
							)}
							{!canUseRecurringTaskFeature && (
								<FieldHint>
									Recurring tasks are a Homeowner+ feature. This task can still
									be saved as a one-time task.
								</FieldHint>
							)}
						</FormGroupFull>
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'notifications'}>
					<FormGrid>
						<FormGroupFull>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<input
									type='checkbox'
									id='enableNotifications'
									name='enableNotifications'
									checked={formState.enableNotifications || false}
									onChange={(e) => {
										const isChecked = e.target.checked;
										onChange({
											target: {
												name: 'enableNotifications',
												value: isChecked,
												checked: isChecked,
												type: 'checkbox',
											},
										} as any);

										// If enabling notifications and no notifications exist, set defaults
										if (
											isChecked &&
											(!formState.notifications ||
												formState.notifications.length === 0)
										) {
											const defaultNotifications =
												getDefaultTaskNotifications();
											onChange({
												target: {
													name: 'notifications',
													value: defaultNotifications,
													type: 'custom',
												},
											} as any);
										}
									}}
								/>
								<FormLabel htmlFor='enableNotifications' style={{ margin: 0 }}>
									Enable task notifications
								</FormLabel>
							</div>
							<small style={{ color: '#6b7280', marginTop: '4px' }}>
								Get reminded about upcoming and overdue tasks
							</small>
						</FormGroupFull>

						{formState.enableNotifications && (
							<>
								<FormGroupFull>
									<FormLabel>Notification Schedule</FormLabel>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '12px',
										}}>
										{(formState.notifications || []).map(
											(notification, index) => (
												<div
													key={notification.id}
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '12px',
														padding: '12px',
														border: '1px solid #e5e7eb',
														borderRadius: '6px',
														backgroundColor: '#f9fafb',
													}}>
													<input
														type='checkbox'
														id={`notification-${index}`}
														checked={notification.enabled}
														onChange={(e) => {
															const updatedNotifications = [
																...(formState.notifications || []),
															];
															updatedNotifications[index] = {
																...updatedNotifications[index],
																enabled: e.target.checked,
															};
															onChange({
																target: {
																	name: 'notifications',
																	value: updatedNotifications,
																	type: 'custom',
																},
															} as any);
														}}
													/>
													<div style={{ flex: 1 }}>
														<div
															style={{ fontWeight: '500', color: '#374151' }}>
															{notification.type === 'reminder'
																? notification.daysBeforeDue === 0
																	? 'Due date'
																	: notification.daysBeforeDue === 1
																	? '1 day before due'
																	: `${notification.daysBeforeDue} days before due`
																: `${
																		Math.abs(notification.daysBeforeDue || 0) /
																		7
																  } ${
																		Math.abs(notification.daysBeforeDue || 0) /
																			7 ===
																		1
																			? 'week'
																			: 'weeks'
																  } after due`}
														</div>
														<div style={{ fontSize: '14px', color: '#6b7280' }}>
															{getDefaultNotificationMessage(
																notification,
																formState.title || 'Task',
															)}
														</div>
													</div>
												</div>
											),
										)}
									</div>
								</FormGroupFull>

								<FormGroupFull>
									<small style={{ color: '#6b7280' }}>
										Default schedule: 30 days before, 7 days before, due date,
										and 1 week after due. You can customize these settings after
										creating the task.
									</small>
								</FormGroupFull>
							</>
						)}
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'financial'}>
					<FormGrid>
						<FormGroup>
							<FormLabel>Contractor Cost</FormLabel>
							<FormInput
								type='number'
								min='0'
								step='0.01'
								value={formState.financials?.estimate?.contractorCost ?? ''}
								onChange={(e) =>
									handleFinancialEstimateChange(
											'contractorCost',
											e.target.value,
										)
								}
								placeholder='0.00'
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Materials Cost</FormLabel>
							<FormInput
								type='number'
								min='0'
								step='0.01'
								value={formState.financials?.estimate?.materialsCost ?? ''}
								onChange={(e) =>
									handleFinancialEstimateChange(
											'materialsCost',
											e.target.value,
										)
								}
								placeholder='0.00'
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Labor Cost</FormLabel>
							<FormInput
								type='number'
								min='0'
								step='0.01'
								value={formState.financials?.estimate?.laborCost ?? ''}
								onChange={(e) =>
									handleFinancialEstimateChange('laborCost', e.target.value)
								}
								placeholder='0.00'
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Other Cost</FormLabel>
							<FormInput
								type='number'
								min='0'
								step='0.01'
								value={formState.financials?.estimate?.otherCost ?? ''}
								onChange={(e) =>
									handleFinancialEstimateChange('otherCost', e.target.value)
								}
								placeholder='0.00'
							/>
						</FormGroup>

						<FormGroupFull>
							<div
								style={{
									padding: '12px',
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
								}}>
								<div style={{ fontWeight: 600, marginBottom: '4px' }}>
									Estimated Total:{' '}
									{formatCurrency(
										calculateCostTotal(formState.financials?.estimate),
										formState.financials?.currency || 'USD',
									)}
								</div>
								<small style={{ color: '#6b7280' }}>
									Optional: add any combination of contractor, materials, labor,
									or other costs.
								</small>
							</div>
						</FormGroupFull>
					</FormGrid>
				</ModalTabContent>
				</TabContentScrollArea>
			</GenericModal>

			{showLinkHistoryModal && (
				<GenericModal
					isOpen={showLinkHistoryModal}
					title='Link Maintenance History'
					onClose={() => setShowLinkHistoryModal(false)}
					onSubmit={handleSaveLinkedHistory}
					showActions={true}
					primaryButtonLabel='Link History'
					secondaryButtonLabel='Cancel'>
					<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
						{internalMaintenanceHistoryOptions.length > 0 ? (
							internalMaintenanceHistoryOptions.map((option) => (
								<label
									key={option.value}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '6px 0',
									}}>
									<input
										type='checkbox'
										checked={pendingLinkedHistoryIds.includes(option.value)}
										onChange={() => handleToggleHistory(option.value)}
									/>
									<span>{option.label}</span>
								</label>
							))
						) : (
							<p style={{ margin: 0, color: '#6b7280' }}>
								No maintenance history available for this task.
							</p>
						)}
					</div>
				</GenericModal>
			)}
		</>
	);
};
