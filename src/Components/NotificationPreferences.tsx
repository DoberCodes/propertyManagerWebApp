import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../Redux/store/store';
import { useUpdateUserMutation } from '../Redux/API/userSlice';
import { setCurrentUser } from '../Redux/Slices/userSlice';
import { Task } from '../types/Task.types';
import { useAppFeedback } from './Library/AppFeedback/AppFeedbackProvider';
import { GenericModal } from './Library';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
} from '../Redux/API/taskSlice';
import {
	mergeNotificationPreferences,
} from '../utils/notificationPreferences';
import { mergeEmailPreferences } from '../utils/emailPreferences';
import {
	canUsePropertyInsights,
	canUseTaskReminderEmails,
} from '../utils/subscriptionUtils';

const NotificationSection = styled.div`
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
	background: #f9fafb;
	min-width: 0;
	overflow: hidden;

	@media (max-width: 768px) {
		padding: 16px;
		margin-bottom: 16px;
	}

	@media (max-width: 480px) {
		padding: 14px;
	}
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	color: #1f2937;
	min-width: 0;
	overflow-wrap: anywhere;

	@media (max-width: 640px) {
		font-size: 1.1rem;
	}
`;

const SectionHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	background: transparent;
	border: none;
	padding: 0;
	margin: 0;
	cursor: pointer;
	text-align: left;

	@media (max-width: 480px) {
		align-items: flex-start;
	}
`;

const SectionHeaderMeta = styled.span`
	font-size: 14px;
	font-weight: 600;
	color: #4f46e5;
	flex: 0 0 auto;
`;

const SectionBody = styled.div`
	margin-top: 16px;
`;

const PresetActions = styled.div`
	display: flex;
	justify-content: flex-start;
	margin-bottom: 16px;
`;

const PresetButton = styled.button`
	background: #ffffff;
	color: #0f172a;
	border: 1px solid #cbd5e1;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}
`;

// const SecondaryActionButton = styled.button`
// 	background: #ffffff;
// 	color: #1f2937;
// 	border: 1px solid #d1d5db;
// 	padding: 8px 12px;
// 	border-radius: 6px;
// 	font-size: 13px;
// 	font-weight: 600;
// 	cursor: pointer;

// 	&:hover:not(:disabled) {
// 		background: #f9fafb;
// 	}

// 	&:disabled {
// 		opacity: 0.6;
// 		cursor: not-allowed;
// 	}
// `;

const MasterToggle = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 24px;
	padding: 16px;
	background: white;
	border-radius: 6px;
	border: 1px solid #e5e7eb;

	@media (max-width: 480px) {
		align-items: flex-start;
		padding: 12px;
	}
`;

const EmailPreferencesSection = styled.div`
	margin-top: 18px;
	margin-bottom: 24px;
	padding: 16px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	background: #ffffff;
`;

// const EmailTestActions = styled.div`
// 	display: flex;
// 	flex-wrap: wrap;
// 	gap: 10px;
// 	margin-bottom: 12px;

// 	@media (max-width: 640px) {
// 		flex-direction: column;
// 	}
// `;

const EmailPreferencesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 12px;
`;

const EmailPreferenceOption = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	font-size: 14px;
	color: #374151;
	cursor: pointer;
`;

const EmailPreferenceText = styled.span`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const ToggleLabel = styled.label`
	font-weight: 500;
	color: #374151;
	cursor: pointer;
	min-width: 0;
	overflow-wrap: anywhere;
`;

const NotificationTypeGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
	margin-bottom: 24px;

	@media (max-width: 640px) {
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
		margin-bottom: 16px;
	}
`;

const NotificationTypeCard = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 16px;
	min-width: 0;

	@media (max-width: 480px) {
		padding: 12px;
	}
`;

const NotificationTypeHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;

	input {
		flex: 0 0 auto;
	}

	@media (max-width: 480px) {
		align-items: flex-start;
	}
`;

const NotificationTypeLabel = styled.label`
	font-weight: 500;
	color: #374151;
	cursor: pointer;
	flex: 1;
	min-width: 0;
	overflow-wrap: anywhere;
`;

const NotificationTypeDescription = styled.p`
	font-size: 14px;
	color: #6b7280;
	margin: 0;
	overflow-wrap: anywhere;
`;

const TasksWithNotifications = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 16px;
	min-width: 0;

	> div:first-child {
		min-width: 0;
		gap: 12px;
	}

	@media (max-width: 640px) {
		padding: 12px;

		> div:first-child {
			flex-direction: column;
			align-items: stretch !important;
		}
	}
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

	@media (max-width: 640px) {
		align-items: flex-start;
		flex-direction: column;
		gap: 8px;
		padding: 12px 0;
	}
`;

const TaskInfo = styled.div`
	flex: 1;
	min-width: 0;
`;

const TaskTitle = styled.div`
	font-weight: 500;
	color: #374151;
	margin-bottom: 4px;
	overflow-wrap: anywhere;
`;

const TaskDetails = styled.div`
	font-size: 14px;
	color: #6b7280;
	overflow-wrap: anywhere;
`;

const TaskProperty = styled.span`
	display: inline-block;
	background: #e5e7eb;
	color: #374151;
	padding: 2px 8px;
	border-radius: 12px;
	font-size: 12px;
	margin-left: 8px;
	max-width: 100%;
	overflow-wrap: anywhere;

	@media (max-width: 640px) {
		display: block;
		width: fit-content;
		margin: 6px 0 0;
	}
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
	white-space: normal;
	text-align: center;
	&:hover {
		background: #b91c1c;
	}

	@media (max-width: 640px) {
		width: 100%;
		padding: 10px 12px;
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
	const feedback = useAppFeedback();
	const [updateUser] = useUpdateUserMutation();
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [showDisableAllConfirm, setShowDisableAllConfirm] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
	const resolvedPreferences = useMemo(
		() => mergeNotificationPreferences(currentUser?.notificationPreferences),
		[currentUser?.notificationPreferences],
	);
	const resolvedEmailPreferences = useMemo(
		() => mergeEmailPreferences(currentUser?.emailPreferences),
		[currentUser?.emailPreferences],
	);
	const taskReminderEmailsEnabledByPlan = canUseTaskReminderEmails(
		currentUser?.subscription,
	);
	const propertyInsightsEnabledByPlan = canUsePropertyInsights(
		currentUser?.subscription,
	);

	// Get tasks with notifications enabled
	const { data: allTasks = [] } = useGetTasksQuery();
	const tasksWithNotifications = allTasks.filter(
		(task: Task) =>
			task.enableNotifications &&
			task.notifications &&
			task.notifications.length > 0,
	);

	const [preferences, setPreferences] = useState(() => resolvedPreferences);
	const [emailPreferences, setEmailPreferences] = useState(
		() => resolvedEmailPreferences,
	);

	useEffect(() => {
		const nextSerialized = JSON.stringify(resolvedPreferences);
		const currentSerialized = JSON.stringify(preferences);
		if (nextSerialized !== currentSerialized) {
			setPreferences(resolvedPreferences);
		}
	}, [resolvedPreferences, preferences]);

	useEffect(() => {
		const nextSerialized = JSON.stringify(resolvedEmailPreferences);
		const currentSerialized = JSON.stringify(emailPreferences);
		if (nextSerialized !== currentSerialized) {
			setEmailPreferences(resolvedEmailPreferences);
		}
	}, [resolvedEmailPreferences, emailPreferences]);

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
			key: 'task_assigned' as const,
			label: 'Task Assigned',
			description: 'When tasks are assigned to you or team members',
		},
		{
			key: 'task_approval_required' as const,
			label: 'Task Approval Needed',
			description: 'When a completion is submitted and needs approval',
		},
		{
			key: 'task_unassigned_critical' as const,
			label: 'Critical Tasks Without Assignee',
			description: 'When high/urgent tasks are created without an owner',
		},
		{
			key: 'task_recurring_generation_failed' as const,
			label: 'Recurring Task Generation Issues',
			description:
				'When automatic recurring task creation fails and needs attention',
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

	const handleEmailPreferenceToggle = async (
		key: keyof typeof emailPreferences,
		enabled: boolean,
	) => {
		if (key === 'taskReminders' && !taskReminderEmailsEnabledByPlan) {
			feedback.notify('Task reminder emails are available on Homeowner+ and higher plans.');
			return;
		}
		if (key === 'propertyInsights' && !propertyInsightsEnabledByPlan) {
			feedback.notify('Property Insights are available on Homeowner+ and higher plans.');
			return;
		}

		const nextEmailPreferences = {
			...emailPreferences,
			[key]: enabled,
		};
		setEmailPreferences(nextEmailPreferences);

		try {
			await updateUser({
				id: currentUser.id,
				updates: { emailPreferences: nextEmailPreferences },
			}).unwrap();

			dispatch(
				setCurrentUser({
					...currentUser,
					emailPreferences: nextEmailPreferences,
				}),
			);
		} catch (error) {
			console.error('Failed to update email preferences:', error);
			setEmailPreferences(emailPreferences);
		}
	};

	const handleApplyActionDefaults = async () => {
		const actionDefaults = mergeNotificationPreferences(undefined);
		setPreferences(actionDefaults);

		try {
			await updateUser({
				id: currentUser.id,
				updates: { notificationPreferences: actionDefaults },
			}).unwrap();

			dispatch(
				setCurrentUser({
					...currentUser,
					notificationPreferences: actionDefaults,
				}),
			);
			feedback.notify('Action-based notification defaults applied.');
		} catch (error) {
			console.error('Failed to apply action-based defaults:', error);
			setPreferences(resolvedPreferences);
			feedback.notify('Failed to apply action-based defaults. Please try again.');
		}
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
			feedback.notify(
				'Task notifications disabled. Please refresh the page to see changes.',
			);
		} catch (error) {
			console.error('Failed to disable task notifications:', error);
			feedback.notify('Failed to disable task notifications. Please try again.');
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

					<PresetActions>
						<PresetButton type='button' onClick={handleApplyActionDefaults}>
							Use Action-Based Defaults
						</PresetButton>
					</PresetActions>

					<MasterToggle>
						<input
							type='checkbox'
							id='master-notifications'
							checked={preferences.enabled}
							onChange={(e) => handleMasterToggle(e.target.checked)}
						/>
						<ToggleLabel htmlFor='master-notifications'>
							Enable notifications
						</ToggleLabel>
					</MasterToggle>

					<EmailPreferencesSection>
						<h4
							style={{
								margin: '0 0 8px 0',
								fontSize: '16px',
								fontWeight: 600,
								color: '#1f2937',
							}}>
							Email Preferences
						</h4>
						<p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
							Choose which email digests and guidance messages you receive.
						</p>
						{/* <EmailTestActions>
							<SecondaryActionButton
								type='button'
								onClick={handleSendDigestTest}
								disabled={isSendingDigestTest}>
								{isSendingDigestTest
									? 'Sending Test Digest...'
									: 'Send Test Monthly Digest (Temporary)'}
							</SecondaryActionButton>
							<SecondaryActionButton
								type='button'
								onClick={handleSendInsightsTest}
								disabled={isSendingInsightsTest || !propertyInsightsEnabledByPlan}>
								{isSendingInsightsTest
									? 'Sending Insights Test...'
									: 'Send Test Property Insights'}
							</SecondaryActionButton>
							<SecondaryActionButton
								type='button'
								onClick={handleSendSeasonalTest}
								disabled={isSendingSeasonalTest}>
								{isSendingSeasonalTest
									? 'Sending Seasonal Test...'
									: 'Send Test Seasonal Guidance'}
							</SecondaryActionButton>
						</EmailTestActions> */}
						<EmailPreferencesGrid>
							<EmailPreferenceOption>
								<input
									type='checkbox'
									checked={emailPreferences.monthlyDigest}
									onChange={(e) =>
										handleEmailPreferenceToggle('monthlyDigest', e.target.checked)
									}
								/>
								<EmailPreferenceText>
									<strong>Monthly Property Summary</strong>
									<span>Monthly factual summary of what is currently recorded in Maintley.</span>
								</EmailPreferenceText>
							</EmailPreferenceOption>
							<EmailPreferenceOption>
								<input
									type='checkbox'
									checked={emailPreferences.taskReminders}
									disabled={!taskReminderEmailsEnabledByPlan}
									onChange={(e) =>
										handleEmailPreferenceToggle('taskReminders', e.target.checked)
									}
								/>
								<EmailPreferenceText>
									<strong>Task Reminder Emails</strong>
									<span>
										Due soon, due today, overdue, and assigned task emails.
										{!taskReminderEmailsEnabledByPlan
											? ' Upgrade to Homeowner+ or higher to enable.'
											: ''}
									</span>
								</EmailPreferenceText>
							</EmailPreferenceOption>
							<EmailPreferenceOption>
								<input
									type='checkbox'
									checked={emailPreferences.propertyInsights}
									disabled={!propertyInsightsEnabledByPlan}
									onChange={(e) =>
										handleEmailPreferenceToggle('propertyInsights', e.target.checked)
									}
								/>
								<EmailPreferenceText>
									<strong>Property Insights</strong>
									<span>
										Optional record observations for documented appliances and maintenance history.
										{!propertyInsightsEnabledByPlan
											? ' Upgrade to Homeowner+ or higher to enable.'
											: ''}
									</span>
								</EmailPreferenceText>
							</EmailPreferenceOption>
							<EmailPreferenceOption>
								<input
									type='checkbox'
									checked={emailPreferences.seasonalGuidance}
									onChange={(e) =>
										handleEmailPreferenceToggle('seasonalGuidance', e.target.checked)
									}
								/>
								<EmailPreferenceText>
									<strong>Seasonal Guidance</strong>
									<span>Seasonal property care notes sent around season changes.</span>
								</EmailPreferenceText>
							</EmailPreferenceOption>
						</EmailPreferencesGrid>
					</EmailPreferencesSection>

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
									<p
										style={{
											margin: '6px 0 0 0',
											fontSize: '12px',
											color: '#6b7280',
										}}>
										Task reminders (due soon, due today, overdue) are managed per task below.
									</p>
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
