import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../Redux/store/store';
import { useUpdateUserMutation } from '../Redux/API/userSlice';
import { setCurrentUser } from '../Redux/Slices/userSlice';
import { Task } from '../types/Task.types';
import { GenericModal } from './Library';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
} from '../Redux/API/taskSlice';

const NotificationSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	color: #1f2937;
`;

const SectionHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: transparent;
	border: none;
	padding: 0;
	margin: 0;
	cursor: pointer;
	text-align: left;
`;

const SectionHeaderMeta = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: #4f46e5;
`;

const SectionBody = styled.div`
	margin-top: 16px;
`;

const MasterToggle = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 24px;
	padding: 16px;
	background: white;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
`;

const ToggleLabel = styled.label`
	font-weight: 500;
	color: #374151;
	cursor: pointer;
`;

const NotificationTypeGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
`;

const NotificationTypeCard = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 16px;
`;

const NotificationTypeHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
`;

const NotificationTypeLabel = styled.label`
	font-weight: 500;
	color: #374151;
	cursor: pointer;
	flex: 1;
`;

const NotificationTypeDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 0;
`;

const TasksWithNotifications = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 16px;
`;

const TasksList = styled.div`
	max-height: 300px;
	overflow-y: auto;
`;

const TaskItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px;
	border-bottom: 1px solid #f3f4f6;
	&:last-child {
		border-bottom: none;
	}
`;

const TaskInfo = styled.div`
	flex: 1;
`;

const TaskTitle = styled.div`
	font-weight: 500;
	color: #374151;
	margin-bottom: 4px;
`;

const TaskDetails = styled.div`
	font-size: 14px;
	color: #6b7280;
`;

const TaskProperty = styled.span`
	display: inline-block;
	background: #e5e7eb;
	color: #374151;
	padding: 2px 8px;
	border-radius: 12px;
	font-size: 12px;
	margin-left: 8px;
`;

const DisableAllButton = styled.button`
	background: #dc2626;
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		background: #b91c1c;
	}
`;

interface NotificationPreferencesProps {
	currentUser: any;
	defaultCollapsed?: boolean;
}

export const NotificationPreferences: React.FC<
	NotificationPreferencesProps
> = ({ currentUser, defaultCollapsed = false }) => {
	const dispatch = useDispatch<AppDispatch>();
	const [updateUser] = useUpdateUserMutation();
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [showDisableAllConfirm, setShowDisableAllConfirm] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

	// Get tasks with notifications enabled
	const { data: allTasks = [] } = useGetTasksQuery();
	const tasksWithNotifications = allTasks.filter(
		(task: Task) =>
			task.enableNotifications &&
			task.notifications &&
			task.notifications.length > 0,
	);

	const [preferences, setPreferences] = useState(() => ({
		enabled: currentUser?.notificationPreferences?.enabled ?? true,
		types: {
			property_added:
				currentUser?.notificationPreferences?.types?.property_added ?? true,
			property_updated:
				currentUser?.notificationPreferences?.types?.property_updated ?? true,
			property_deleted:
				currentUser?.notificationPreferences?.types?.property_deleted ?? true,
			property_group_created:
				currentUser?.notificationPreferences?.types?.property_group_created ??
				true,
			property_group_updated:
				currentUser?.notificationPreferences?.types?.property_group_updated ??
				true,
			property_group_deleted:
				currentUser?.notificationPreferences?.types?.property_group_deleted ??
				true,
			task_created:
				currentUser?.notificationPreferences?.types?.task_created ?? true,
			task_assigned:
				currentUser?.notificationPreferences?.types?.task_assigned ?? true,
			task_updated:
				currentUser?.notificationPreferences?.types?.task_updated ?? true,
			task_deleted:
				currentUser?.notificationPreferences?.types?.task_deleted ?? true,
			task_reminder:
				currentUser?.notificationPreferences?.types?.task_reminder ?? true,
			task_overdue:
				currentUser?.notificationPreferences?.types?.task_overdue ?? true,
			team_member_added:
				currentUser?.notificationPreferences?.types?.team_member_added ?? true,
			team_member_updated:
				currentUser?.notificationPreferences?.types?.team_member_updated ??
				true,
			team_member_removed:
				currentUser?.notificationPreferences?.types?.team_member_removed ??
				true,
			team_group_created:
				currentUser?.notificationPreferences?.types?.team_group_created ?? true,
			team_group_updated:
				currentUser?.notificationPreferences?.types?.team_group_updated ?? true,
			team_group_deleted:
				currentUser?.notificationPreferences?.types?.team_group_deleted ?? true,
			maintenance_request:
				currentUser?.notificationPreferences?.types?.maintenance_request ??
				true,
			maintenance_request_created:
				currentUser?.notificationPreferences?.types
					?.maintenance_request_created ?? true,
			legal_update:
				currentUser?.notificationPreferences?.types?.legal_update ?? true,
			property_shared:
				currentUser?.notificationPreferences?.types?.property_shared ?? true,
			share_invitation:
				currentUser?.notificationPreferences?.types?.share_invitation ?? true,
			share_invitation_accepted:
				currentUser?.notificationPreferences?.types
					?.share_invitation_accepted ?? true,
		},
	}));

	const notificationTypes = [
		{
			key: 'property_added' as const,
			label: 'Property Added',
			description: 'When a new property is added to your account',
		},
		{
			key: 'property_updated' as const,
			label: 'Property Updated',
			description: 'When property details are modified',
		},
		{
			key: 'property_deleted' as const,
			label: 'Property Deleted',
			description: 'When a property is removed from your account',
		},
		{
			key: 'task_created' as const,
			label: 'Task Created',
			description: 'When new tasks are created',
		},
		{
			key: 'task_assigned' as const,
			label: 'Task Assigned',
			description: 'When tasks are assigned to you or team members',
		},
		{
			key: 'task_updated' as const,
			label: 'Task Status Changed',
			description: 'When task status or details are updated',
		},
		{
			key: 'task_reminder' as const,
			label: 'Task Reminders',
			description: 'Upcoming task due date reminders',
		},
		{
			key: 'task_overdue' as const,
			label: 'Overdue Tasks',
			description: 'When tasks become overdue',
		},
		{
			key: 'team_member_added' as const,
			label: 'Team Member Added',
			description: 'When new team members are added',
		},
		{
			key: 'maintenance_request' as const,
			label: 'Maintenance Requests',
			description: 'Maintenance request notifications',
		},
		{
			key: 'property_shared' as const,
			label: 'Property Sharing',
			description: 'When properties are shared with others',
		},
	];

	const handleMasterToggle = async (enabled: boolean) => {
		const newPreferences = { ...preferences, enabled };
		setPreferences(newPreferences);

		try {
			await updateUser({
				id: currentUser.id,
				updates: { notificationPreferences: newPreferences },
			}).unwrap();

			dispatch(
				setCurrentUser({
					...currentUser,
					notificationPreferences: newPreferences,
				}),
			);
		} catch (error) {
			console.error('Failed to update notification preferences:', error);
			// Revert on error
			setPreferences(preferences);
		}
	};

	const handleTypeToggle = async (
		typeKey: keyof typeof preferences.types,
		enabled: boolean,
	) => {
		const newPreferences = {
			...preferences,
			types: { ...preferences.types, [typeKey]: enabled },
		};
		setPreferences(newPreferences);

		try {
			await updateUser({
				id: currentUser.id,
				updates: { notificationPreferences: newPreferences },
			}).unwrap();

			dispatch(
				setCurrentUser({
					...currentUser,
					notificationPreferences: newPreferences,
				}),
			);
		} catch (error) {
			console.error('Failed to update notification preferences:', error);
			// Revert on error
			setPreferences(preferences);
		}
	};

	const handleDisableAllTaskNotifications = async () => {
		setShowDisableAllConfirm(true);
	};

	const confirmDisableAllTaskNotifications = async () => {
		setShowDisableAllConfirm(false);

		try {
			// Update all tasks to disable notifications
			const taskUpdates = tasksWithNotifications.map((task) => ({
				id: task.id,
				updates: { enableNotifications: false },
			}));

			// Update tasks one by one (could be optimized with batch update)
			for (const update of taskUpdates) {
				await updateTaskMutation(
					update as { id: string; updates: Partial<Task> },
				).unwrap();
			}
			alert(
				'Task notifications disabled. Please refresh the page to see changes.',
			);
		} catch (error) {
			console.error('Failed to disable task notifications:', error);
			alert('Failed to disable task notifications. Please try again.');
		}
	};

	return (
		<NotificationSection>
			<SectionHeaderButton
				type='button'
				onClick={() => setIsCollapsed((prev) => !prev)}
				aria-expanded={!isCollapsed}
				aria-label={
					isCollapsed
						? 'Expand notification preferences section'
						: 'Collapse notification preferences section'
				}>
				<SectionTitle>🔔 Notification Preferences</SectionTitle>
				<SectionHeaderMeta>{isCollapsed ? 'Show' : 'Hide'}</SectionHeaderMeta>
			</SectionHeaderButton>

			{!isCollapsed && (
				<SectionBody>
					<p style={{ marginBottom: '24px', color: '#6b7280' }}>
						Control which notifications you receive and manage your task reminders.
					</p>

					<MasterToggle>
						<input
							type='checkbox'
							id='master-notifications'
							checked={preferences.enabled}
							onChange={(e) => handleMasterToggle(e.target.checked)}
						/>
						<ToggleLabel htmlFor='master-notifications'>
							Enable all notifications
						</ToggleLabel>
					</MasterToggle>

					{preferences.enabled && (
						<>
							<NotificationTypeGrid>
								{notificationTypes.map((type) => (
									<NotificationTypeCard key={type.key}>
										<NotificationTypeHeader>
											<input
												type='checkbox'
												id={`notification-${type.key}`}
												checked={preferences.types[type.key]}
												onChange={(e) =>
													handleTypeToggle(type.key, e.target.checked)
												}
											/>
											<NotificationTypeLabel htmlFor={`notification-${type.key}`}>
												{type.label}
											</NotificationTypeLabel>
										</NotificationTypeHeader>
										<NotificationTypeDescription>
											{type.description}
										</NotificationTypeDescription>
									</NotificationTypeCard>
								))}
							</NotificationTypeGrid>

							<TasksWithNotifications>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: '16px',
									}}>
									<h4
										style={{
											margin: 0,
											fontSize: '16px',
											fontWeight: '600',
											color: '#374151',
										}}>
										Tasks with Notifications ({tasksWithNotifications.length})
									</h4>
									{tasksWithNotifications.length > 0 && (
										<DisableAllButton onClick={handleDisableAllTaskNotifications}>
											Disable All Task Notifications
										</DisableAllButton>
									)}
								</div>

								{tasksWithNotifications.length === 0 ? (
									<p
										style={{
											color: '#6b7280',
											fontStyle: 'italic',
											textAlign: 'center',
											padding: '24px',
										}}>
										No tasks have notifications enabled. Enable notifications on
										individual tasks to see them here.
									</p>
								) : (
									<TasksList>
										{tasksWithNotifications.map((task: Task) => (
											<TaskItem key={task.id}>
												<TaskInfo>
													<TaskTitle>{task.title}</TaskTitle>
													<TaskDetails>
															Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}
														<TaskProperty>{task.property}</TaskProperty>
													</TaskDetails>
												</TaskInfo>
											</TaskItem>
										))}
									</TasksList>
								)}
							</TasksWithNotifications>
						</>
					)}
				</SectionBody>
			)}

			{showDisableAllConfirm && (
				<GenericModal
					isOpen={showDisableAllConfirm}
					onClose={() => setShowDisableAllConfirm(false)}
					title='Disable All Task Notifications'
					primaryButtonLabel='Disable All'
					primaryButtonAction={confirmDisableAllTaskNotifications}
					secondaryButtonLabel='Cancel'
					secondaryButtonAction={() => setShowDisableAllConfirm(false)}>
					<p>
						Are you sure you want to disable notifications for all tasks? This
						will turn off all task-specific reminders.
					</p>
				</GenericModal>
			)}
		</NotificationSection>
	);
};
