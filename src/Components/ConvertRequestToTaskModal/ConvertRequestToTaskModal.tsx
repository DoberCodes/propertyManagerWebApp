import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MaintenanceRequestItem } from '../../Redux/Slices/maintenanceRequestsSlice';
import { TeamMember } from '../../types/Team.types';
import { TaskData } from '../../types/Task.types';
import {
	GenericModal,
	FormGroup,
	FormLabel as Label,
	FormInput as Input,
	FormSelect as Select,
	FormTextarea as Textarea,
} from '../Library';

interface ConvertRequestToTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConvert: (taskData: TaskData) => void;
	request: MaintenanceRequestItem;
	teamMembers: TeamMember[];
}

export const ConvertRequestToTaskModal: React.FC<
	ConvertRequestToTaskModalProps
> = ({ isOpen, onClose, onConvert, request, teamMembers }) => {
	// Calculate default due date (7 days from now for urgent, 14 for high, etc.)
	const getDefaultDueDate = (priority: string) => {
		const days =
			priority === 'Urgent'
				? 3
				: priority === 'High'
					? 7
					: priority === 'Medium'
						? 14
						: 30;
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date.toISOString().split('T')[0];
	};

	const [taskData, setTaskData] = useState<TaskData>({
		title: request.title,
		dueDate: getDefaultDueDate(request.priority),
		status: 'Pending',
		assignee: '',
		notes: `Maintenance Request Details:
${request.description}
${request.unit ? `\nUnit: ${request.unit}` : ''}
Category: ${request.category}
Priority: ${request.priority}
Submitted by: ${request.submittedByName} on ${request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}`,
		priority: request.priority,
	});

	// Reset form when modal opens with new request
	useEffect(() => {
		if (isOpen) {
			setTaskData({
				title: request.title,
				dueDate: getDefaultDueDate(request.priority),
				status: 'Pending',
				assignee: '',
				notes: `Maintenance Request Details:
${request.description}
${request.unit ? `\nUnit: ${request.unit}` : ''}
Category: ${request.category}
Priority: ${request.priority}
Submitted by: ${request.submittedByName} on ${request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'N/A'}`,
				priority: request.priority,
			});
		}
	}, [isOpen, request]);

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onConvert(taskData);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<GenericModal
			isOpen={isOpen}
			onClose={onClose}
			title='Convert Request to Task'
			onSubmit={handleFormSubmit}
			primaryButtonLabel='Create Task'
			secondaryButtonLabel='Cancel'>
			<div>
				<Subtitle>
					Configure task details before creating from maintenance request
				</Subtitle>

				<RequestSummary>
					<SummaryTitle>Original Request:</SummaryTitle>
					<SummaryDetail>
						<strong>{request.title}</strong>
					</SummaryDetail>
					<SummaryDetail>
						<PriorityBadge priority={request.priority}>
							{request.priority} Priority
						</PriorityBadge>
						<CategoryBadge>{request.category}</CategoryBadge>
						{request.unit && <LocationBadge>📍 {request.unit}</LocationBadge>}
					</SummaryDetail>
					<SummaryDetail style={{ fontSize: '13px', color: '#666' }}>
						Submitted by {request.submittedByName} •{' '}
						{request.submittedAt
							? new Date(request.submittedAt).toLocaleDateString()
							: 'N/A'}
					</SummaryDetail>
				</RequestSummary>
				<FormRow>
					<FormGroup>
						<Label>
							Task Title <Required>*</Required>
						</Label>
						<Input
							type='text'
							value={taskData.title}
							onChange={(e) =>
								setTaskData({ ...taskData, title: e.target.value })
							}
							placeholder='Enter task title'
							required
						/>
					</FormGroup>
				</FormRow>

				<FormRow>
					<FormGroup>
						<Label>
							Due Date <Required>*</Required>
						</Label>
						<Input
							type='date'
							value={taskData.dueDate}
							onChange={(e) =>
								setTaskData({ ...taskData, dueDate: e.target.value })
							}
							min={new Date().toISOString().split('T')[0]}
							required
						/>
						<Helper>
							Suggested based on {request.priority.toLowerCase()} priority
						</Helper>
					</FormGroup>

					<FormGroup>
						<Label>Initial Status</Label>
						<Select
							value={taskData.status}
							onChange={(e) =>
								setTaskData({
									...taskData,
									status: e.target.value as TaskData['status'],
								})
							}>
							<option value='Pending'>Pending</option>
							<option value='In Progress'>In Progress</option>
						</Select>
					</FormGroup>
				</FormRow>

				<FormGroup>
					<Label>Assign To</Label>
					<Select
						value={taskData.assignee}
						onChange={(e) =>
							setTaskData({ ...taskData, assignee: e.target.value })
						}>
						<option value=''>Unassigned (assign later)</option>
						{teamMembers
							.filter((member) => member.role !== 'tenant')
							.map((member) => (
								<option
									key={member.id}
									value={`${member.firstName} ${member.lastName}`}>
									{member.firstName} {member.lastName} - {member.title}
								</option>
							))}
					</Select>
					<Helper>
						You can assign this task to a team member or leave unassigned
					</Helper>
				</FormGroup>

				<FormGroup>
					<Label>
						Task Notes <Required>*</Required>
					</Label>
					<Textarea
						value={taskData.notes}
						onChange={(e) =>
							setTaskData({ ...taskData, notes: e.target.value })
						}
						placeholder='Add any additional notes or instructions for this task...'
						rows={8}
						required
					/>
					<Helper>
						Original request details are pre-filled. Add any additional
						instructions.
					</Helper>
				</FormGroup>

				{request.files && request.files.length > 0 && (
					<InfoBox>
						<InfoIcon>📎</InfoIcon>
						<InfoText>
							<strong>{request.files.length} file(s)</strong> from the
							maintenance request will be attached to this task.
						</InfoText>
					</InfoBox>
				)}
			</div>
		</GenericModal>
	);
};

// Styled Components
const Subtitle = styled.div`
	font-size: 13px;
	opacity: 0.95;
	color: #666;
	margin-bottom: 16px;
`;

const RequestSummary = styled.div`
	padding: 20px 24px;
	background: #f8f9fa;
	border-bottom: 1px solid #e0e0e0;
`;

const SummaryTitle = styled.div`
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	color: #666;
	margin-bottom: 8px;
	letter-spacing: 0.5px;
`;

const SummaryDetail = styled.div`
	margin-bottom: 6px;
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`;

const PriorityBadge = styled.span<{ priority: string }>`
	display: inline-block;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
	background-color: ${(props) =>
		props.priority === 'Urgent'
			? '#fee'
			: props.priority === 'High'
				? '#fff3e0'
				: props.priority === 'Medium'
					? '#e3f2fd'
					: '#f5f5f5'};
	color: ${(props) =>
		props.priority === 'Urgent'
			? '#c62828'
			: props.priority === 'High'
				? '#e65100'
				: props.priority === 'Medium'
					? '#1565c0'
					: '#666'};
`;

const CategoryBadge = styled.span`
	display: inline-block;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	background-color: #e8eaf6;
	color: #3f51b5;
`;

const LocationBadge = styled.span`
	display: inline-block;
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
	background-color: #dcfce7;
	color: #16a34a;
	border: 1px solid #22c55e;
`;

const FormRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	margin-bottom: 20px;

	@media (max-width: 600px) {
		grid-template-columns: 1fr;
	}
`;

const Required = styled.span`
	color: #ef4444;
`;

const Helper = styled.div`
	margin-top: 6px;
	font-size: 12px;
	color: #666;
	font-style: italic;
`;

const InfoBox = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 12px 16px;
	background-color: #e8f5e9;
	border-left: 4px solid #4caf50;
	border-radius: 6px;
	margin-bottom: 20px;
`;

const InfoIcon = styled.span`
	font-size: 20px;
	line-height: 1;
`;

const InfoText = styled.p`
	margin: 0;
	font-size: 13px;
	color: #2e7d32;
	line-height: 1.5;
`;
