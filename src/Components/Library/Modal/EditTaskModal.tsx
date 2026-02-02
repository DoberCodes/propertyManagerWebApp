import React from 'react';
import { GenericModal } from './GenericModal';
import {
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	FormCheckbox,
	FormCheckboxGroup,
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
	return (
		<GenericModal
			isOpen={isOpen}
			title={isEditing ? 'Edit Task' : 'Create New Task'}
			onClose={onClose}
			onSubmit={onSubmit}
			primaryButtonLabel={isEditing ? 'Update Task' : 'Create Task'}
			secondaryButtonLabel='Cancel'>
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
				<FormSelect name='status' value={formData.status} onChange={onChange}>
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

			<FormGroup>
				<FormLabel>Notes</FormLabel>
				<FormTextarea
					name='notes'
					value={formData.notes}
					onChange={onChange}
					placeholder='Add any notes about this task...'
				/>
			</FormGroup>

			<FormGroup>
				<FormCheckboxGroup>
					<FormCheckbox
						type='checkbox'
						name='isRecurring'
						checked={formData.isRecurring || false}
						onChange={onChange}
						id='isRecurring'
					/>
					<FormLabel htmlFor='isRecurring' style={{ margin: 0 }}>
						Make this a recurring task
					</FormLabel>
				</FormCheckboxGroup>
			</FormGroup>

			{formData.isRecurring && (
				<>
					<FormGroup>
						<FormLabel>Recurrence Frequency *</FormLabel>
						<FormSelect
							name='recurrenceFrequency'
							value={formData.recurrenceFrequency || ''}
							onChange={onChange}
							required={formData.isRecurring}>
							<option value=''>Select frequency...</option>
							<option value='daily'>Daily</option>
							<option value='weekly'>Weekly</option>
							<option value='biweekly'>Every 2 Weeks</option>
							<option value='monthly'>Monthly</option>
							<option value='quarterly'>Every 3 Months</option>
							<option value='yearly'>Yearly</option>
						</FormSelect>
					</FormGroup>

					<FormGroup>
						<FormLabel>Interval (# of periods) *</FormLabel>
						<FormInput
							type='number'
							name='recurrenceInterval'
							value={formData.recurrenceInterval || 1}
							onChange={onChange}
							min='1'
							max='365'
							required={formData.isRecurring}
							placeholder='e.g., 2 for every 2 weeks'
						/>
					</FormGroup>

					<FormGroup>
						<small style={{ color: '#6b7280' }}>
							📋 This task will automatically create a new copy with an updated
							due date each time it is marked as completed.
						</small>
					</FormGroup>
				</>
			)}
		</GenericModal>
	);
};

export default EditTaskModal;
