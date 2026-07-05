import { useSelector } from 'react-redux';
import React, { useEffect, useMemo, useState } from 'react';
import GenericModal from './GenericModal';
import { FormGroup, FormLabel } from './ModalStyles';
import { TaskSelect } from '../Select/TaskSelect';
import { useUpdateTaskMutation } from '../../../Redux/API/taskSlice';
import { useAppFeedback } from '../AppFeedback/AppFeedbackProvider';
import {
	buildTaskAssignmentFields,
	getStoredTaskAssigneeOption,
	mergeTaskAssigneeOptions,
	type TaskAssigneeOption,
} from '../../../tasks/taskAssignment';
import { useTaskAssigneeOptions } from '../../../tasks/useTaskAssigneeOptions';

interface TaskAssignModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: any;
	propertyId: string;
	unitId?: string;
	selectedAssignee: any;
	assigneeOptions?: TaskAssigneeOption[];
}

export const TaskAssignModal = (props: TaskAssignModalProps) => {
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: any) => state.user.currentUser);
	const taskAssigneeOptions = useTaskAssigneeOptions({
		propertyId: props.propertyId || props.task?.propertyId || '',
		currentUser,
		additionalOptions: props.assigneeOptions,
	});
	const storedAssigneeOption = useMemo(
		() => getStoredTaskAssigneeOption(props.selectedAssignee || props.task),
		[props.selectedAssignee, props.task],
	);

	const [selectedAssignee, setSelectedAssignee] = useState<any>(
		storedAssigneeOption
			? {
					id: storedAssigneeOption.value,
					name: storedAssigneeOption.label,
					email: storedAssigneeOption.email || '',
			  }
			: { id: '', name: '', email: '' },
	);

	useEffect(() => {
		setSelectedAssignee(
			storedAssigneeOption
				? {
						id: storedAssigneeOption.value,
						name: storedAssigneeOption.label,
						email: storedAssigneeOption.email || '',
				  }
				: { id: '', name: '', email: '' },
		);
	}, [storedAssigneeOption]);
	const resolvedAssigneeOptions = useMemo(
		() =>
			mergeTaskAssigneeOptions([
				storedAssigneeOption,
				...taskAssigneeOptions,
			]),
		[storedAssigneeOption, taskAssigneeOptions],
	);

	const [assignTask] = useUpdateTaskMutation();

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedAssignee?.id) {
			feedback.notify('Please select an assignee');
			return;
		}
		if (!props.task?.id) {
			feedback.notify('Unable to assign this task. Please try again.');
			return;
		}

		const assignmentFields = buildTaskAssignmentFields(
			selectedAssignee.id,
			resolvedAssigneeOptions,
		);
		if (!assignmentFields) {
			feedback.notify('Please select an assignee');
			return;
		}

		const updatedTask = {
			assignee: assignmentFields.assignee,
			assignedTo: assignmentFields.assignedTo,
		};
		assignTask({ id: props.task.id, updates: updatedTask })
			.unwrap()
			.then(() => {
				props.onClose();
			})
			.catch((error) => {
				console.error('Failed to assign task:', error);
			});
	};

	return (
		<GenericModal
			isOpen={props.isOpen}
			onClose={props.onClose}
			title='Assign Task'
			showActions={true}
			primaryButtonLabel='Assign'
			onSubmit={handleSubmit}
			primaryButtonDisabled={!selectedAssignee?.id}
			secondaryButtonLabel='Cancel'>
			<FormGroup>
				<FormLabel>Assign To</FormLabel>
				<TaskSelect
					value={selectedAssignee?.id || ''}
					onChange={(selectedId) => {
						const option = resolvedAssigneeOptions.find(
							(assignee) => assignee.value === selectedId,
						);
						setSelectedAssignee(
							option
								? {
										id: option.value,
										name: option.label,
										email: option.email || '',
								  }
								: { id: '', name: '', email: '' },
						);
					}}
					placeholder='Select a person or contractor...'
					options={[
						{ value: '', label: 'Select a person or contractor...' },
						...resolvedAssigneeOptions.map((assignee) => ({
							value: assignee.value,
							label: assignee.label,
						})),
					]}
				/>
			</FormGroup>
		</GenericModal>
	);
};
