import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { GenericModal } from './GenericModal';
import {
	FormGroup,
	FormGrid,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	FormGroupFull,
	ModalTabContainer,
	ModalTab,
	ModalTabContent,
} from './ModalStyles';
import { MultiSelect } from '../index';
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

interface TaskFormData {
	title: string;
	dueDate: string;
	status: string;
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
	initialTask?: Partial<TaskFormData> | null;
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
	// modal-owned form state (defaults)
	const defaultForm: TaskFormData = useMemo(
		() => ({
			title: '',
			dueDate: '',
			status: 'Pending',
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
				status: editingTask.status || 'Pending',
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
				status: foundTask.status || 'Pending',
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

		if (!formState.title || !formState.dueDate) {
			alert('Please fill in all required fields');
			return;
		}

		try {
			const estimatedCosts = sanitizeCostBreakdown(formState.financials?.estimate);
			const actualCosts = sanitizeCostBreakdown(formState.financials?.actual);
			const financialNotes = formState.financials?.notes?.trim();
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
								<FormSelect
									name='propertyId'
									value={formState.propertyId || ''}
									onChange={handleChange}
									required>
									<option value=''>Select a property...</option>
									{propertyOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</FormSelect>
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
							<FormLabel>Due Date *</FormLabel>
							<FormInput
								type='date'
								name='dueDate'
								value={formState.dueDate}
								onChange={onChange}
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel>Status *</FormLabel>
							<FormSelect
								name='status'
								value={formState.status}
								onChange={handleChange}>
								<option value=''>Select a status...</option>
								{statusOptions.map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</FormSelect>
						</FormGroup>

						<FormGroup>
							<FormLabel>Priority *</FormLabel>
							<FormSelect
								name='priority'
								value={formState.priority}
								onChange={onChange}>
								<option value=''>Select a priority...</option>
								{priorityOptions.map((priority) => (
									<option key={priority} value={priority}>
										{priority}
									</option>
								))}
							</FormSelect>
						</FormGroup>

						{!isSingleFamily && filteredUnitOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Unit</FormLabel>
								<FormSelect
									name='unitId'
									value={formState.unitId || ''}
									onChange={handleChange}>
									<option value=''>(none)</option>
									{filteredUnitOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</FormSelect>
							</FormGroup>
						)}

						{assigneeOptions.length > 0 && (
							<FormGroup>
								<FormLabel>Assigned To</FormLabel>
								<FormSelect
									name='assignedTo'
									value={formState.assignedTo || ''}
									onChange={onChange}>
									<option value=''>Unassigned</option>
									{currentUser && formState.assignedTo === currentUser.id && (
										<option value=''>Unassign me</option>
									)}
									{assigneeOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</FormSelect>
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
							<FormSelect
								name='recurrenceFrequency'
								value={formState.recurrenceFrequency || ''}
								onChange={onChange}
								required={wantsRecurrence}>
								<option value=''>Select frequency...</option>
								<option value='daily'>Daily</option>
								<option value='weekly'>Weekly</option>
								<option value='biweekly'>Every 2 Weeks</option>
								<option value='monthly'>Monthly</option>
								<option value='quarterly'>Every 3 Months</option>
								<option value='yearly'>Yearly</option>
								<option value='custom'>Custom</option>
							</FormSelect>
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
								<FormSelect
									name='recurrenceCustomUnit'
									value={formState.recurrenceCustomUnit || ''}
									onChange={onChange}
									required={
										formState.recurrenceFrequency === 'custom' &&
										wantsRecurrence
									}>
									<option value=''>Select unit...</option>
									<option value='days'>Days</option>
									<option value='weeks'>Weeks</option>
									<option value='months'>Months</option>
									<option value='years'>Years</option>
								</FormSelect>
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
