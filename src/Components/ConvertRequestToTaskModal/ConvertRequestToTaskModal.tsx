import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MaintenanceRequestItem } from '../../Redux/Slices/maintenanceRequestsSlice';
import { TeamMember } from '../../Redux/Slices/teamSlice';

interface ConvertRequestToTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConvert: (taskData: TaskData) => void;
	request: MaintenanceRequestItem;
	teamMembers: TeamMember[];
}

export interface TaskData {
	title: string;
	dueDate: string;
	status: 'Pending' | 'In Progress' | 'Awaiting Approval' | 'Completed';
	assignee?: string;
	notes: string;
	priority: string;
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onConvert(taskData);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<Overlay onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()}>
				<Header>
					<div>
						<Title>Convert Request to Task</Title>
						<Subtitle>
							Configure task details before creating from maintenance request
						</Subtitle>
					</div>
					<CloseButton onClick={onClose}>&times;</CloseButton>
				</Header>

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

				<Form onSubmit={handleSubmit}>
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

					<ButtonGroup>
						<CancelButton type='button' onClick={onClose}>
							Cancel
						</CancelButton>
						<SubmitButton type='submit'>Create Task</SubmitButton>
					</ButtonGroup>
				</Form>
			</Modal>
		</Overlay>
	);
};

// Styled Components
const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
	padding: 20px;
`;

const Modal = styled.div`
	background: white;
	border-radius: 12px;
	width: 100%;
	max-width: 700px;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const Header = styled.div`
	padding: 24px;
	border-bottom: 2px solid #e0e0e0;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	color: white;
	border-radius: 12px 12px 0 0;
`;

const Title = styled.h2`
	margin: 0 0 4px 0;
	font-size: 22px;
	font-weight: 600;
	color: white;
`;

const Subtitle = styled.div`
	font-size: 13px;
	opacity: 0.95;
	color: white;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 32px;
	color: white;
	cursor: pointer;
	line-height: 1;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.9;
	transition: opacity 0.2s;

	&:hover {
		opacity: 1;
	}
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

const Form = styled.form`
	padding: 24px;
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

const FormGroup = styled.div`
	margin-bottom: 20px;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 8px;
	font-weight: 600;
	color: #333;
	font-size: 14px;
`;

const Required = styled.span`
	color: #ef4444;
`;

const Input = styled.input`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 14px;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 14px;
	background-color: white;
	cursor: pointer;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
`;

const Textarea = styled.textarea`
	width: 100%;
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
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

const ButtonGroup = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	padding-top: 8px;
`;

const CancelButton = styled.button`
	padding: 10px 24px;
	border: 1px solid #ddd;
	background-color: white;
	color: #333;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #f5f5f5;
		border-color: #999;
	}
`;

const SubmitButton = styled.button`
	padding: 10px 24px;
	border: none;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	color: white;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition:
		transform 0.2s,
		box-shadow 0.2s;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
	}

	&:disabled {
		background: #ccc;
		cursor: not-allowed;
		transform: none;
	}
`;
