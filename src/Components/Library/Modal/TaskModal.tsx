import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
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
	useGetAllUnitsQuery,
	useGetPropertiesQuery,
} from '../../../Redux/API/propertySlice';
import { useGetAllMaintenanceHistoryForUserQuery } from '../../../Redux/API/userSlice';
import { addTask, updateTask } from '../../../Redux/Slices/propertyDataSlice';
import {
	calculateCostTotal,
	hasCostData,
	toNumberOrUndefined,
	formatCurrency,
} from '../../../utils/financialUtils';
import { COLORS } from '../../../constants/colors';
import { Device } from '../../../types/Property.types';

const LINKED_DEVICE_NOTES_START = '--- Linked Device Details ---';
const LINKED_DEVICE_NOTES_END = '--- End Linked Device Details ---';

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
		'Use these linked device details while performing this task:',
		'',
	];

	devices.forEach((device, index) => {
		const displayName =
			(device.brand && device.model
				? `${device.brand} ${device.model}`
				: device.model || device.brand || device.type || `Device ${index + 1}`) +
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
			// Backward compatibility for older devices that still use scalar fields.
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
			lines.push('   No additional device specs saved yet.');
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
	currentUser?: { id: string; firstName?: string; lastName?: string } | null;
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
	statusOptions = [
		'Initiated',
		'Pending',
		'In Progress',
		'Awaiting Approval',
		'Completed',
		'Rejected',
	],
	priorityOptions = ['Low', 'Medium', 'High', 'Urgent'],
	assigneeOptions = [],
	currentUser = null,
	propertyOptions = [],
	unitOptions = [],
	unitId = null,
	taskTitlePlaceholder = 'Task title',
}) => {
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
			enableNotifications: false,
			notifications: [],
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
	const { data: allUnits = [] } = useGetAllUnitsQuery();
	const { data: allProperties = [] } = useGetPropertiesQuery();
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery();
	const [createTask] = useCreateTaskMutation();
	const [updateTaskApi] = useUpdateTaskMutation();

	const [formState, setFormState] = useState<TaskFormData>(defaultForm);
	const [activeSuggestion, setActiveSuggestion] = useState<
		'category' | 'location' | null
	>(null);
	const categoryWrapRef = useRef<HTMLDivElement | null>(null);
	const locationWrapRef = useRef<HTMLDivElement | null>(null);

	const selectedPropertyId = formState.propertyId || propertyId || '';

	// Determine if selected property is single family
	const selectedProperty = useMemo(() => {
		if (!selectedPropertyId) return null;
		return allProperties.find((p: any) => p.id === selectedPropertyId);
	}, [selectedPropertyId, allProperties]);

	const isSingleFamily = selectedProperty?.propertyType === 'Single Family';

	const filteredUnitOptions = useMemo(() => {
		if (unitOptions.length > 0) return unitOptions;
		if (!selectedPropertyId) return [];

		return allUnits
			.filter((unit: any) => unit.propertyId === selectedPropertyId)
			.map((unit: any) => ({
				label: unit.unitName || unit.name || unit.title || 'Unit',
				value: unit.id,
			}));
	}, [unitOptions, allUnits, selectedPropertyId]);

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
					: device.type || 'Unknown Device';
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

	// Memoize the found task to prevent unnecessary re-renders
	const foundTask = React.useMemo(() => {
		if (editingTaskId && !editingTask) {
			return allTasks.find((t: any) => t.id === editingTaskId);
		}
		return null;
	}, [editingTaskId, editingTask, allTasks]);

	// initialize form when modal opens or when editingTaskId/initialTask changes
	useEffect(() => {
		if (!isOpen) return;

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
					initialTask.enableNotifications || defaultForm.enableNotifications,
				notifications: initialTask.notifications || defaultForm.notifications,
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
	}, [isOpen, editingTaskId, editingTask, initialTask, foundTask, defaultForm]);

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

	const [activeTab, setActiveTab] = useState<
		'details' | 'schedule' | 'notifications' | 'financial'
	>('details');
	const [showLinkHistoryModal, setShowLinkHistoryModal] = useState(false);
	const [pendingLinkedHistoryIds, setPendingLinkedHistoryIds] = useState<
		string[]
	>(fd.linkedMaintenanceHistoryIds || []);
	const wantsRecurrence = Boolean(
		formState.recurrenceFrequency ||
			formState.recurrenceInterval ||
			formState.recurrenceCustomUnit,
	);
	const hasSchedule = Boolean(
		formState.recurrenceFrequency &&
			(formState.recurrenceFrequency === 'custom'
				? formState.recurrenceInterval && formState.recurrenceCustomUnit
				: true), // For non-custom frequencies, just need the frequency
	);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formState.title) {
			alert('Please fill in all required fields');
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
				alert('A task with this title already exists for the selected property.');
				return;
			}
		}

		try {
			const estimatedCosts = sanitizeCostBreakdown(formState.financials?.estimate);
			const actualCosts = sanitizeCostBreakdown(formState.financials?.actual);
			const financialNotes = formState.financials?.notes?.trim();
			const mergedNotes = mergeNotesWithLinkedDeviceDetails(
				formState.notes || '',
				linkedDeviceDetailsSection,
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
					alert('Unable to update task: missing task ID');
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

				const updates = Object.fromEntries(
					Object.entries(updatesRaw).filter(([, value]) => value !== undefined),
				);

				const updated = await updateTaskApi({
					id: taskId,
					updates,
				}).unwrap();
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
					userId: currentUser?.id || '',
					property: '',
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

				// Filter out undefined values to prevent Firestore errors
				const newTask = Object.fromEntries(
					Object.entries(newTaskRaw).filter(([, value]) => value !== undefined),
				) as any;

				const created = await createTask(newTask).unwrap();
				dispatch(addTask(created));
				onSaved?.(created);
				onClose();
			}
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Failed to save task. Please try again.');
		}
	};

	return (
		<>
			<GenericModal
				isOpen={isOpen}
				title={isEditing ? 'Edit Task' : 'Create New Task'}
				onClose={onClose}
				onSubmit={handleSubmit}
				showActions={true}
				primaryButtonLabel={isEditing ? 'Update Task' : 'Create Task'}
				secondaryButtonLabel='Cancel'>
				<ModalTabContainer>
					<ModalTab
						type='button'
						$active={activeTab === 'details'}
						onClick={() => setActiveTab('details')}>
						Task Details
					</ModalTab>
					<ModalTab
						type='button'
						$active={activeTab === 'schedule'}
						onClick={() => setActiveTab('schedule')}>
						📅 Recurrence Schedule
					</ModalTab>
					<ModalTab
						type='button'
						$active={activeTab === 'notifications'}
						onClick={() => setActiveTab('notifications')}>
						🔔 Notifications
					</ModalTab>
					<ModalTab
						type='button'
						$active={activeTab === 'financial'}
						onClick={() => setActiveTab('financial')}>
						💵 Financials
					</ModalTab>
				</ModalTabContainer>

				<div
					style={{
						flex: 1,
						minHeight: 0,
						overflowY: 'auto',
						paddingBottom: '0.5rem',
					}}>
					<ModalTabContent $active={activeTab === 'details'}>
					<FormGrid>
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
							</FormGroup>
						)}

						<FormGroup>
							<FormLabel>Task Name *</FormLabel>
							<FormInput
								type='text'
								name='title'
								value={formState.title}
								onChange={handleChange}
								placeholder={taskTitlePlaceholder}
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Due Date</FormLabel>
							<FormInput
								type='date'
								name='dueDate'
								value={formState.dueDate}
								onChange={onChange}
								disabled={!formState.dueDate}
							/>
							<CheckboxRow>
								<input
									type='checkbox'
									checked={!formState.dueDate}
									onChange={(e) =>
										setFormState((prev) => ({
											...prev,
											dueDate: e.target.checked
												? ''
												: prev.dueDate || new Date().toISOString().split('T')[0],
										}))
									}
								/>
								Set as ASAP (no due date)
							</CheckboxRow>
						</FormGroup>

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
						</FormGroup>

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

						{!isSingleFamily && filteredUnitOptions.length > 0 && (
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
								<FormLabel>Connected Devices</FormLabel>
								<MultiSelect
									options={internalDeviceOptions}
									value={formState.devices || []}
									onChange={handleDeviceChange}
									placeholder='Select devices for this task...'
								/>
								<small style={{ color: '#6b7280' }}>
									Linked device service items are automatically appended to task
									notes when you save.
								</small>
							</FormGroup>
						)}

						{internalMaintenanceHistoryOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Maintenance History</FormLabel>
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
										🔗 Link Maintenance History (
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
							<FormLabel>Notes</FormLabel>
							<FormTextarea
								name='notes'
								value={formState.notes}
								onChange={onChange}
								placeholder='Add any notes about this task...'
							/>
						</FormGroupFull>
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'schedule'}>
					<FormGrid>
						<FormGroup>
							<FormLabel>Recurrence Frequency *</FormLabel>
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
							<small style={{ color: '#6b7280' }}>
								📋 This task will automatically create a new copy with an
								updated due date each time it is marked as completed.
							</small>
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
																? notification.daysBeforeDue === 1
																	? '1 day before due'
																	: `${notification.daysBeforeDue} days before due`
																: `Week ${
																		Math.abs(notification.daysBeforeDue || 0) /
																		7
																  } overdue`}
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
										💡 Default schedule: 30 days, 7 days, and 1 day before due
										date, plus weekly reminders for 4 weeks when overdue. You
										can customize these settings after creating the task.
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
				</div>
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
