import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../../../Redux/store';
import GenericModal from './GenericModal';
import { FormGroup, FormLabel } from './ModalStyles';
import React, { useCallback, useEffect, useState } from 'react';
import { TaskSelect } from '../Select/TaskSelect';
import {
	useGetUserByIdQuery,
} from '../../../Redux/API/userSlice';
import { useGetPropertyQuery } from '../../../Redux/API/propertySlice';
import { useGetContractorsByPropertyQuery } from '../../../Redux/API/contractorSlice';
import { useGetTeamMembersQuery } from '../../../Redux/API/teamSlice';
import { getFamilyMembers } from '../../../services/authService';
import { useUpdateTaskMutation } from '../../../Redux/API/taskSlice';
import { useAppFeedback } from '../AppFeedback/AppFeedbackProvider';

type AssigneeOption = {
	id: string;
	name: string;
	email?: string;
};

interface TaskAssignModalProps {
	isOpen: boolean;
	onClose: () => void;
	task: any;
	propertyId: string;
	unitId?: string;
	selectedAssignee: any;
	assigneeOptions?: { label: string; value: string; email?: string }[];
}

export const TaskAssignModal = (props: TaskAssignModalProps) => {
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: any) => state.user.currentUser);

	const { data: contractors = [] } = useGetContractorsByPropertyQuery(
		props.propertyId,
	);
	const { data: property } = useGetPropertyQuery(props.propertyId);
	const { data: propertyOwner } = useGetUserByIdQuery(property?.userId || '', {
		skip: !property?.userId,
	});
	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery();

	const [selectedAssignee, setSelectedAssignee] = useState<any>(
		props.selectedAssignee ?? { id: '', name: '', email: '' },
	);

	useEffect(() => {
		setSelectedAssignee(
			props.selectedAssignee ?? { id: '', name: '', email: '' },
		);
	}, [props.selectedAssignee]);
	// Select team groups and memoize derived members to avoid returning new references
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const reduxTeamMembers = useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);
	const teamMembers = useMemo(
		() =>
			(firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers)
				.filter(Boolean),
		[firebaseTeamMembers, reduxTeamMembers],
	);

	const [familyMembers, setFamilyMembers] = useState<any[]>([]);

	useEffect(() => {
		const fetchFamilyMembers = async () => {
			if (currentUser?.isTeamMemberAccount) {
				setFamilyMembers([]);
				return;
			}

			if (currentUser?.accountId) {
				try {
					const members = await getFamilyMembers(currentUser.accountId);
					setFamilyMembers(members || []);
				} catch (error) {
					console.error('Error fetching family members:', error);
					setFamilyMembers([]);
				}
			}
		};

		fetchFamilyMembers();
	}, [currentUser?.accountId, currentUser?.isTeamMemberAccount]);

	const fetchAssignees = useCallback((): AssigneeOption[] => {
		const assignees: AssigneeOption[] = [];
		const addAssignee = (assignee?: Partial<AssigneeOption> | null) => {
			const id = String(assignee?.id || '').trim();
			const name = String(assignee?.name || assignee?.email || '').trim();
			if (!id || !name) return;
			if (assignees.some((item) => item.id === id)) return;
			assignees.push({
				id,
				name,
				email: assignee?.email,
			});
		};

		(props.assigneeOptions || []).forEach((option) =>
			addAssignee({
				id: option.value,
				name: option.label,
				email: option.email,
			}),
		);

		if (propertyOwner && propertyOwner.id !== currentUser?.id) {
			addAssignee({
				id: propertyOwner.id,
				name:
					propertyOwner.firstName && propertyOwner.lastName
						? `${propertyOwner.firstName} ${propertyOwner.lastName}`
						: propertyOwner.email?.split('@')[0] || 'Property Owner',
				email: propertyOwner.email || '',
			});
		}

		teamMembers.forEach((member) =>
			addAssignee({
				id: member?.id,
				name: member?.firstName
					? `${member?.firstName} ${member?.lastName || ''}`.trim()
					: member?.email,
				email: member?.email,
			}),
		);

		contractors.forEach((contractor) =>
			addAssignee({
				id: contractor?.id,
				name: contractor?.name
					? `${contractor?.name} (${contractor?.category})`
					: contractor?.email,
				email: contractor?.email,
			}),
		);

		familyMembers.forEach((member) =>
			addAssignee({
				id: member?.id,
				name: member?.firstName
					? `${member?.firstName} ${member?.lastName || ''}`.trim()
					: member?.email,
				email: member?.email,
			}),
		);

		addAssignee(props.selectedAssignee);

		return assignees;
	}, [
		familyMembers,
		teamMembers,
		contractors,
		props.selectedAssignee,
		props.assigneeOptions,
		propertyOwner,
		currentUser?.id,
	]);

	const [assignTask] = useUpdateTaskMutation();

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedAssignee?.id) {
			feedback.notify('Please select an assignee');
			return;
		}

		const updatedTask = {
			assignedTo: {
				id: selectedAssignee.id,
				name: selectedAssignee.name,
				email: selectedAssignee.email,
			},
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
			title='Assign Task to Team Member'
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
						setSelectedAssignee(
							fetchAssignees().find(
								(assignee) => assignee.id === selectedId,
							) || { id: '', name: '', email: '' },
						);
					}}
					placeholder='Select a user...'
					options={[
						{ value: '', label: 'Select a user...' },
						...fetchAssignees().map((assignee) => ({
							value: assignee.id,
							label: assignee.name,
						})),
					]}
				/>
			</FormGroup>
		</GenericModal>
	);
};
