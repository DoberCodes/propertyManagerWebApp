import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../../../Redux/store';
import GenericModal from './GenericModal';
import { FormGroup, FormLabel, FormSelect } from './ModalStyles';
import React, { useCallback, useEffect, useState } from 'react';
import {
	useGetUserByIdQuery,
} from '../../../Redux/API/userSlice';
import { useGetPropertyQuery } from '../../../Redux/API/propertySlice';
import { useGetContractorsByPropertyQuery } from '../../../Redux/API/contractorSlice';
import { getFamilyMembers } from '../../../services/authService';
import { useUpdateTaskMutation } from '../../../Redux/API/taskSlice';

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
	const currentUser = useSelector((state: any) => state.user.currentUser);

	const { data: contractors = [] } = useGetContractorsByPropertyQuery(
		props.propertyId,
	);
	const { data: property } = useGetPropertyQuery(props.propertyId);
	const { data: propertyOwner } = useGetUserByIdQuery(property?.userId || '', {
		skip: !property?.userId,
	});

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
	const teamMembers = useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);

	const [familyMembers, setFamilyMembers] = useState<any[]>([]);

	useEffect(() => {
		const fetchFamilyMembers = async () => {
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
	}, [currentUser?.accountId]);

	const fetchAssignees = useCallback(() => {
		// If assigneeOptions are provided, use them as base and add property-specific assignees
		if (props.assigneeOptions && props.assigneeOptions.length > 0) {
			const formattedAssignees = props.assigneeOptions.map((option) => ({
				id: option.value,
				name: option.label,
				email: option.email,
			}));

			// Add property owner if different from current user
			if (propertyOwner && propertyOwner.id !== currentUser?.id) {
				formattedAssignees.push({
					id: propertyOwner.id,
					name:
						propertyOwner.firstName && propertyOwner.lastName
							? `${propertyOwner.firstName} ${propertyOwner.lastName}`
							: propertyOwner.email?.split('@')[0] || 'Property Owner',
					email: propertyOwner.email || '',
				});
			}

			// Add contractors for the specific property
			const contractorAssignees = contractors.map((contractor) => ({
				id: contractor?.id,
				name: contractor?.name
					? `${contractor?.name} (${contractor?.category})`
					: contractor?.email,
				email: contractor?.email,
			}));

			const allAssignees = [
				...formattedAssignees,
				...contractorAssignees,
			];

			// Remove duplicates based on ID
			const uniqueAssignees = allAssignees.filter(
				(assignee, index, self) =>
					index === self.findIndex((a) => a.id === assignee.id),
			);

			// If there's a currently selected assignee that's not in the list, add them
			if (
				props.selectedAssignee?.id &&
				!uniqueAssignees.find((a) => a.id === props.selectedAssignee.id)
			) {
				uniqueAssignees.push(props.selectedAssignee);
			}

			return uniqueAssignees;
		}

		// Fallback: build assignee options from various sources
		const family = familyMembers;
		const totalAssignees = [
			// Add property owner if different from current user
			...(propertyOwner && propertyOwner.id !== currentUser?.id
				? [
						{
							id: propertyOwner.id,
							name:
								propertyOwner.firstName && propertyOwner.lastName
									? `${propertyOwner.firstName} ${propertyOwner.lastName}`
									: propertyOwner.email?.split('@')[0] || 'Property Owner',
							email: propertyOwner.email || '',
						},
				  ]
				: []),
			...teamMembers.map((member) => ({
				id: member?.id,
				name: member?.firstName
					? `${member?.firstName} ${member?.lastName || ''}`.trim()
					: member?.email,
				email: member?.email,
			})),
			...contractors.map((contractor) => ({
				id: contractor?.id,
				name: contractor?.name
					? `${contractor?.name} (${contractor?.category})`
					: contractor?.email,
				email: contractor?.email,
			})),
			...family.map((member) => ({
				id: member?.id,
				name: member?.firstName
					? `${member?.firstName} ${member?.lastName || ''}`.trim()
					: member?.email,
				email: member?.email,
			})),
		];

		const formattedAssignees = totalAssignees.filter(
			(assignee, index, self) =>
				index === self.findIndex((a) => a.id === assignee.id),
		); // Remove duplicates based on ID

		// If there's a currently selected assignee that's not in the list, add them
		if (
			props.selectedAssignee?.id &&
			!formattedAssignees.find((a) => a.id === props.selectedAssignee.id)
		) {
			formattedAssignees.push(props.selectedAssignee);
		}

		return formattedAssignees;
	}, [
		familyMembers,
		teamMembers,
		contractors,
		props.selectedAssignee,
		props.assigneeOptions,
		property,
		currentUser,
	]);

	const [assignTask] = useUpdateTaskMutation();

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!selectedAssignee?.id) {
			alert('Please select an assignee');
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
				<FormSelect
					value={selectedAssignee?.id || ''}
					onChange={(e) => {
						const selectedId = e.target.value;
						setSelectedAssignee(
							fetchAssignees().find(
								(assignee) => assignee.id === selectedId,
							) || { id: '', name: '', email: '' },
						);
					}}>
					<option value=''>Select a user...</option>
					{fetchAssignees().map((assignee) => (
						<option key={assignee.id} value={assignee.id}>
							{assignee.name}
						</option>
					))}
				</FormSelect>
			</FormGroup>
		</GenericModal>
	);
};
