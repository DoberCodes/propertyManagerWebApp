import React, { useState, useEffect } from 'react';
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

interface TaskFormData {
	title: string;
	dueDate: string;
	status: string;
	priority?: string;
	notes: string;
	assignedTo?: string;
	isRecurring?: boolean;
	recurrenceFrequency?: string;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: string;
}

interface EditTaskModalProps {
	isOpen: boolean;
	isEditing: boolean;
	formData: TaskFormData;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onChange: (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => void;
	statusOptions?: string[];
	priorityOptions?: string[];
	assigneeOptions?: { label: string; value: string }[];
	taskTitlePlaceholder?: string;
}

/**
 * Reusable Edit Task Modal Component
 * Handles both creating new tasks and editing existing ones
 * Features tabbed interface for recurring task scheduling
 *
 * @example
 * <EditTaskModal
 *   isOpen={showTaskDialog}
 *   isEditing={Boolean(editingTaskId)}
 *   formData={taskFormData}
 *   onClose={() => setShowTaskDialog(false)}
 *   onSubmit={handleTaskFormSubmit}
 *   onChange={handleTaskFormChange}
 *   statusOptions={['Pending', 'In Progress', 'Completed']}
 * />
 */
export const EditTaskModal: React.FC<EditTaskModalProps> = ({
	isOpen,
	isEditing,
	formData,
	onClose,
	onSubmit,
	onChange,
	statusOptions = [
		'Pending',
		'In Progress',
		'Awaiting Approval',
		'Completed',
		'Rejected',
	],
	priorityOptions = ['Low', 'Medium', 'High', 'Urgent'],
	assigneeOptions = [],
	taskTitlePlaceholder = 'Enter task name',
}) => {
	const [activeTab, setActiveTab] = useState<'details' | 'schedule'>('details');
	const wantsRecurrence = Boolean(
		formData.recurrenceFrequency ||
		formData.recurrenceInterval ||
		formData.recurrenceCustomUnit,
	);
	const hasSchedule = Boolean(
		formData.recurrenceFrequency &&
		formData.recurrenceInterval &&
		(formData.recurrenceFrequency !== 'custom' ||
			formData.recurrenceCustomUnit),
	);

	useEffect(() => {
		if (hasSchedule && !formData.isRecurring) {
			onChange({
				target: {
					name: 'isRecurring',
					value: 'true',
					checked: true,
					type: 'checkbox',
				},
			} as React.ChangeEvent<HTMLInputElement>);
		}

		if (!hasSchedule && formData.isRecurring) {
			onChange({
				target: {
					name: 'isRecurring',
					value: 'false',
					checked: false,
					type: 'checkbox',
				},
			} as React.ChangeEvent<HTMLInputElement>);
		}
	}, [hasSchedule, formData.isRecurring, onChange]);

	return (
		<GenericModal
			isOpen={isOpen}
			title={isEditing ? 'Edit Task' : 'Create New Task'}
			onClose={onClose}
			onSubmit={onSubmit}
			primaryButtonLabel={isEditing ? 'Update Task' : 'Create Task'}
			secondaryButtonLabel='Cancel'>
			<ModalTabContainer>
				<ModalTab
					type='button'
					active={activeTab === 'details'}
					onClick={() => setActiveTab('details')}>
					Task Details
				</ModalTab>
				<ModalTab
					type='button'
					active={activeTab === 'schedule'}
					onClick={() => setActiveTab('schedule')}>
					📅 Recurrence Schedule
				</ModalTab>
			</ModalTabContainer>

			<ModalTabContent active={activeTab === 'details'}>
				<FormGrid>
					<FormGroup>
						<FormLabel>Task Name *</FormLabel>
						<FormInput
							type='text'
							name='title'
							value={formData.title}
							onChange={onChange}
							placeholder={taskTitlePlaceholder}
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Due Date *</FormLabel>
						<FormInput
							type='date'
							name='dueDate'
							value={formData.dueDate}
							onChange={onChange}
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Status *</FormLabel>
						<FormSelect
							name='status'
							value={formData.status}
							onChange={onChange}>
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
							value={formData.priority}
							onChange={onChange}>
							<option value=''>Select a priority...</option>
							{priorityOptions.map((priority) => (
								<option key={priority} value={priority}>
									{priority}
								</option>
							))}
						</FormSelect>
					</FormGroup>

					{assigneeOptions.length > 0 && (
						<FormGroup>
							<FormLabel>Assigned To</FormLabel>
							<FormSelect
								name='assignedTo'
								value={formData.assignedTo || ''}
								onChange={onChange}>
								<option value=''>Unassigned</option>
								{assigneeOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FormSelect>
						</FormGroup>
					)}

					<FormGroupFull>
						<FormLabel>Notes</FormLabel>
						<FormTextarea
							name='notes'
							value={formData.notes}
							onChange={onChange}
							placeholder='Add any notes about this task...'
						/>
					</FormGroupFull>
				</FormGrid>
			</ModalTabContent>

			<ModalTabContent active={activeTab === 'schedule'}>
				<FormGrid>
					<FormGroup>
						<FormLabel>Recurrence Frequency *</FormLabel>
						<FormSelect
							name='recurrenceFrequency'
							value={formData.recurrenceFrequency || ''}
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

					<FormGroup>
						<FormLabel>
							{formData.recurrenceFrequency === 'custom'
								? 'Interval *'
								: 'Interval (# of periods) *'}
						</FormLabel>
						<FormInput
							type='number'
							name='recurrenceInterval'
							value={formData.recurrenceInterval || 1}
							onChange={onChange}
							min='1'
							max='365'
							required={wantsRecurrence}
							placeholder={
								formData.recurrenceFrequency === 'custom'
									? 'e.g., 3 for every 3 days'
									: 'e.g., 2 for every 2 weeks'
							}
						/>
					</FormGroup>

					{formData.recurrenceFrequency === 'custom' && (
						<FormGroup>
							<FormLabel>Time Unit *</FormLabel>
							<FormSelect
								name='recurrenceCustomUnit'
								value={formData.recurrenceCustomUnit || ''}
								onChange={onChange}
								required={
									formData.recurrenceFrequency === 'custom' && wantsRecurrence
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
							📋 This task will automatically create a new copy with an updated
							due date each time it is marked as completed.
						</small>
					</FormGroupFull>
				</FormGrid>
			</ModalTabContent>
		</GenericModal>
	);
};

export default EditTaskModal;
