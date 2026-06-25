import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../Redux/store/store';
import { useUpdateUserMutation } from '../../Redux/API/userSlice';
import { setCurrentUser } from '../../Redux/Slices/userSlice';
import { Task } from '../../types/Task.types';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';
import {
	FormGroup,
	FormLabel as Label,
	FormSelect as Select,
	GenericModal,
} from '../../Components/Library';
import {
	useGetTasksQuery,
	useUpdateTaskMutation,
} from '../../Redux/API/taskSlice';
import { useGetTeamMembersQuery } from '../../Redux/API/teamSlice';
import { getFamilyMembers } from '../../services/authService';
import {
	mergeNotificationPreferences,
} from '../../utils/notificationPreferences';
import { getDefaultTaskNotifications } from '../../utils/taskNotificationUtils';
import { mergeEmailPreferences } from '../../utils/emailPreferences';
import {
	canManageTeam,
	canUsePropertyInsights,
	canUseTaskReminderEmails,
} from '../../utils/subscriptionUtils';
import { isNativeApp } from '../../utils/platform';
import { ActionsToolbar, DisableAllButton, EnableAllButton, FilterButton, NestedPreferenceControls, PreferenceOption, PreferencePanel, PreferencesGrid, PreferenceText, PresetActions, PresetButton, RecipientGrid, RecipientOption, Section, SectionBody, SectionTitle } from './SettingPage.styles';
import { IconWrapper } from 'global.styles';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';



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
	const [activeTab, setActiveTab] = useState<'withNotifications' | 'withoutNotifications'>('withNotifications');

	const [emailPreferencesCollapsed, setEmailPreferencesCollapsed] = useState(defaultCollapsed);
	const [notificationTypesCollapsed, setNotificationTypesCollapsed] = useState(defaultCollapsed);
	const [tasksCollapsed, setTasksCollapsed] = useState(defaultCollapsed);

	const [showTaskActionConfirmation, setShowTaskActionConfirmation] = useState(false);
	const [taskActionType, setTaskActionType] = useState<'enable' | 'disable'>('enable');

	const [individualTaskAction, setIndividualTaskAction] = useState<{ task: Task; action: 'enable' | 'disable' } | null>(null);
	const [showConfirmIndividualTaskAction, setShowConfirmIndividualTaskAction] = useState(false);

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
	const nativeApp = isNativeApp();
	const accountId = String(currentUser?.accountId || currentUser?.id || '').trim();
	const isAccountOwner =
		!!currentUser &&
		currentUser?.isTeamMemberAccount !== true &&
		(currentUser?.isAccountOwner === true || accountId === currentUser?.id);
	const canConfigureFamilyReportRecipients = isAccountOwner;
	const canConfigureTeamMemberReports =
		isAccountOwner &&
		!!currentUser?.subscription &&
		canManageTeam(currentUser.subscription);

	// Get tasks with notifications enabled
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: teamMembers = [] } = useGetTeamMembersQuery(undefined, {
		skip: !canConfigureTeamMemberReports,
	});

	const tasksWithNotifications = allTasks.filter(
		(task: Task) =>
			task.enableNotifications &&
			task.notifications &&
			task.notifications.length > 0,
	);
	const tasksWithNotificationsCount = tasksWithNotifications.length;

	const tasksWithoutNotifications = allTasks.filter(
		(task: Task) =>
			!task.enableNotifications ||
			!task.notifications ||
			task.notifications.length === 0,
	);
	const tasksWithoutNotificationsCount = tasksWithoutNotifications.length;

	const [preferences, setPreferences] = useState(() => resolvedPreferences);
	const [emailPreferences, setEmailPreferences] = useState(
		() => resolvedEmailPreferences,
	);
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);

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

	useEffect(() => {
		let isMounted = true;
		if (!accountId || !isAccountOwner) {
			setFamilyMembers([]);
			return () => {
				isMounted = false;
			};
		}

		getFamilyMembers(accountId).then((members) => {
			if (isMounted) {
				setFamilyMembers(
					members.filter((member: any) => String(member?.id || '') !== currentUser?.id),
				);
			}
		});

		return () => {
			isMounted = false;
		};
	}, [accountId, currentUser?.id, isAccountOwner]);

	const emailEnabledTeamMembers = useMemo(
		() =>
			teamMembers.filter((member: any) => String(member?.email || '').trim()),
		[teamMembers],
	);

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
			label: 'Critical Tasks Unassigned',
			description: 'When high/urgent tasks are created without an owner',
		},
		{
			key: 'task_recurring_generation_failed' as const,
			label: 'Recurring Task Issues',
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
		setTaskActionType('disable');
		setShowTaskActionConfirmation(true);
	};

	const handleEnableAllTaskNotifications = async () => {
		setTaskActionType('enable');
		setShowTaskActionConfirmation(true);
	};

	const saveEmailPreferences = async (
		nextEmailPreferences: typeof emailPreferences,
		successMessage?: string,
	) => {
		const previousEmailPreferences = emailPreferences;
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
			if (successMessage) {
				feedback.notify(successMessage);
			}
		} catch (error) {
			console.error('Failed to update email preferences:', error);
			setEmailPreferences(previousEmailPreferences);
			feedback.notify('Failed to update email preferences. Please try again.');
		}
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

		await saveEmailPreferences({
			...emailPreferences,
			[key]: enabled,
		});
	};

	const handleMonthlyDigestFamilyToggle = async (enabled: boolean) => {
		if (!canConfigureFamilyReportRecipients) {
			feedback.notify('Only the account owner can send monthly summaries to family.');
			return;
		}

		await saveEmailPreferences({
			...emailPreferences,
			monthlyDigestFamilyRecipients: enabled,
		});
	};

	const handleTeamMemberReportsToggle = async (enabled: boolean) => {
		if (!canConfigureTeamMemberReports) {
			feedback.notify('Team member reports are available on plans with team access.');
			return;
		}

		const selectedIds = emailPreferences.teamMemberReports?.teamMemberIds || [];
		const defaultIds =
			selectedIds.length > 0
				? selectedIds
				: emailEnabledTeamMembers.map((member: any) => member.id);

		await saveEmailPreferences({
			...emailPreferences,
			teamMemberReports: {
				...(emailPreferences.teamMemberReports || {
					frequency: 'weekly' as const,
					teamMemberIds: [],
				}),
				enabled,
				teamMemberIds: defaultIds,
			},
		});
	};

	const handleTeamMemberReportFrequencyChange = async (
		frequency: 'weekly' | 'biweekly' | 'monthly',
	) => {
		await saveEmailPreferences({
			...emailPreferences,
			teamMemberReports: {
				...(emailPreferences.teamMemberReports || {
					enabled: false,
					teamMemberIds: [],
				}),
				frequency,
			},
		});
	};

	const handleTeamMemberReportRecipientToggle = async (
		memberId: string,
		enabled: boolean,
	) => {
		const selectedIds = emailPreferences.teamMemberReports?.teamMemberIds || [];
		const nextIds = enabled
			? Array.from(new Set([...selectedIds, memberId]))
			: selectedIds.filter((id) => id !== memberId);

		await saveEmailPreferences({
			...emailPreferences,
			teamMemberReports: {
				...(emailPreferences.teamMemberReports || {
					enabled: false,
					frequency: 'weekly' as const,
				}),
				teamMemberIds: nextIds,
			},
		});
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

	const confirmEnableAllTaskNotifications = async () => {
		setShowTaskActionConfirmation(false);
		try {
			const taskUpdates = tasksWithoutNotifications.map((task) => ({
				id: task.id,
				updates: {
					enableNotifications: true,
					...(!task.notifications || task.notifications.length === 0
						? { notifications: getDefaultTaskNotifications() }
						: {}),
				},
			}));
			for (const update of taskUpdates) {
				await updateTaskMutation(
					update as { id: string; updates: Partial<Task> },
				).unwrap();
			}
			feedback.notify(
				'Task notifications enabled. Please refresh the page to see changes.',
			);
		} catch (error) {
			console.error('Failed to enable task notifications:', error);
			feedback.notify('Failed to enable task notifications. Please try again.');
		}
	};

	const confirmDisableAllTaskNotifications = async () => {
		setShowTaskActionConfirmation(false);

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
		<Section>
			<SectionTitle>🔔 Notification Preferences</SectionTitle>

			<SectionBody>
				<p style={{ marginBottom: '24px', color: '#6b7280' }}>
					Control which notifications you receive and manage your task reminders.
				</p>

				<PresetActions>
					<PresetButton type='button' onClick={handleApplyActionDefaults}>
						Use Action-Based Defaults
					</PresetButton>
				</PresetActions>

				{/* Email Preferences Section */}
				<Section >
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<SectionTitle style={{ marginBottom: '0' }}>
							Email Preferences
						</SectionTitle>
						<IconWrapper onClick={() => setEmailPreferencesCollapsed((prev) => !prev)}>
							{emailPreferencesCollapsed ? (
								<FontAwesomeIcon icon={faChevronDown} />
							) : (
								<FontAwesomeIcon icon={faChevronUp} />
							)}
						</IconWrapper>
					</div>
					{!emailPreferencesCollapsed && (
						<>
							<SectionTitle style={{ marginBottom: '12px', marginTop: '24px', fontSize: '14px', color: '#374151' }}>
								General Email Preferences
							</SectionTitle>
							<PreferencesGrid>
								<PreferenceOption>
									<input
										type='checkbox'
										checked={emailPreferences.monthlyDigest}
										onChange={(e) =>
											handleEmailPreferenceToggle('monthlyDigest', e.target.checked)
										}
									/>
									<PreferenceText>
										<strong>Monthly Property Summary</strong>
										<span>Monthly factual summary of what is currently recorded in Maintley.</span>
									</PreferenceText>
								</PreferenceOption>
								<PreferenceOption>
									<input
										type='checkbox'
										checked={emailPreferences.taskReminders}
										disabled={!taskReminderEmailsEnabledByPlan}
										onChange={(e) =>
											handleEmailPreferenceToggle('taskReminders', e.target.checked)
										}
									/>
									<PreferenceText>
										<strong>Maintenance Reminder Emails</strong>
										<span>
											Due soon, due today, overdue, and assigned maintenance emails.
											{!taskReminderEmailsEnabledByPlan
												? nativeApp
													? ' Manage this in the web account center to enable.'
													: ' Upgrade to Homeowner+ or higher to enable.'
												: ''}
										</span>
									</PreferenceText>
								</PreferenceOption>
								<PreferenceOption>
									<input
										type='checkbox'
										checked={!!emailPreferences.monthlyDigestFamilyRecipients}
										disabled={
											!canConfigureFamilyReportRecipients ||
											familyMembers.length === 0
										}
										onChange={(e) =>
											handleMonthlyDigestFamilyToggle(e.target.checked)
										}
									/>
									<PreferenceText>
										<strong>Send Monthly Summary to Family</strong>
										<span>
											Include family members on the monthly property summary.
											{!canConfigureFamilyReportRecipients
												? ' Only the account owner can enable this.'
												: familyMembers.length === 0
													? ' Add a family member before enabling.'
													: ''}
										</span>
									</PreferenceText>
								</PreferenceOption>
								<PreferenceOption>
									<input
										type='checkbox'
										checked={emailPreferences.seasonalGuidance}
										onChange={(e) =>
											handleEmailPreferenceToggle('seasonalGuidance', e.target.checked)
										}
									/>
									<PreferenceText>
										<strong>Seasonal Guidance</strong>
										<span>Seasonal property care notes sent around season changes.</span>
									</PreferenceText>
								</PreferenceOption>
							</PreferencesGrid>
							<SectionTitle style={{ marginBottom: '12px', marginTop: '24px', fontSize: '14px', color: '#374151' }}>
								Maintley Intelligence Email Preferences
							</SectionTitle>
							<PreferencesGrid>
								<PreferenceOption>
									<input
										type='checkbox'
										checked={emailPreferences.propertyInsights}
										disabled={!propertyInsightsEnabledByPlan}
										onChange={(e) =>
											handleEmailPreferenceToggle('propertyInsights', e.target.checked)
										}
									/>
									<PreferenceText>
										<strong>Property Insights</strong>
										<span>
											Optional record observations for documented appliances and maintenance history.
											{!propertyInsightsEnabledByPlan
												? nativeApp
													? ' Manage this in the web account center to enable.'
													: ' Upgrade to Homeowner+ or higher to enable.'
												: ''}
										</span>
									</PreferenceText>
								</PreferenceOption>
								{canConfigureTeamMemberReports && (
									<PreferencePanel>
										<PreferenceOption>
											<input
												type='checkbox'
												checked={!!emailPreferences.teamMemberReports?.enabled}
												disabled={!canConfigureTeamMemberReports}
												onChange={(e) =>
													handleTeamMemberReportsToggle(e.target.checked)
												}
											/>
											<PreferenceText>
												<strong>Team Member Task Reports</strong>
												<span>
													Send team members a plain update on upcoming, completed, and overdue tasks.
												</span>
											</PreferenceText>
										</PreferenceOption>

										{emailPreferences.teamMemberReports?.enabled && (
											<NestedPreferenceControls>
												<FormGroup>
													<Label>Send</Label>
													<Select
														value={
															emailPreferences.teamMemberReports.frequency ||
															'weekly'
														}
														onChange={(e) =>
															handleTeamMemberReportFrequencyChange(
																e.target.value as
																| 'weekly'
																| 'biweekly'
																| 'monthly',
															)
														}>
														<option value='weekly'>Weekly</option>
														<option value='biweekly'>Every 2 weeks</option>
														<option value='monthly'>Monthly</option>
													</Select>
												</FormGroup>

												<div>
													<Label>Team members</Label>
													{emailEnabledTeamMembers.length === 0 ? (
														<p
															style={{
																margin: '8px 0 0 0',
																color: '#6b7280',
																fontSize: '14px',
															}}>
															Add a team member with an email address before sending reports.
														</p>
													) : (
														<RecipientGrid>
															{emailEnabledTeamMembers.map((member: any) => {
																const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
																const selectedIds =
																	emailPreferences.teamMemberReports?.teamMemberIds || [];
																return (
																	<RecipientOption key={member.id}>
																		<input
																			type='checkbox'
																			checked={selectedIds.includes(member.id)}
																			onChange={(e) =>
																				handleTeamMemberReportRecipientToggle(
																					member.id,
																					e.target.checked,
																				)
																			}
																		/>
																		<PreferenceText>
																			<strong>{memberName || member.email}</strong>
																			<span>{member.email}</span>
																		</PreferenceText>
																	</RecipientOption>
																);
															})}
														</RecipientGrid>
													)}
												</div>
											</NestedPreferenceControls>
										)}
									</PreferencePanel>
								)}
							</PreferencesGrid>
						</>
					)}
				</Section>

				{/* In-App and Push Notification Preferences Section */}
				<Section>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<SectionTitle style={{ marginBottom: '0' }}>
							In-App and Push Notification Preferences
						</SectionTitle>
						<IconWrapper onClick={() => setNotificationTypesCollapsed((prev) => !prev)}>
							{notificationTypesCollapsed ? (
								<FontAwesomeIcon icon={faChevronDown} />
							) : (
								<FontAwesomeIcon icon={faChevronUp} />
							)}
						</IconWrapper>
					</div>
					{!notificationTypesCollapsed && (
						<>
							<PreferencesGrid>
								{notificationTypes.map((type) => (
									<PreferenceOption key={type.key}>
										<input
											type='checkbox'
											id={`notification-${type.key}`}
											checked={preferences.types[type.key]}
											onChange={(e) =>
												handleTypeToggle(type.key, e.target.checked)
											}
										/>
										<PreferenceText>
											<strong>{type.label}</strong>

											<span>{type.description}</span>
										</PreferenceText>
									</PreferenceOption>
								))}
							</PreferencesGrid>
						</>
					)}
				</Section>

				{/* Tasks with Notifications Section */}
				<Section>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<SectionTitle style={{ marginBottom: '0' }}>
							Tasks Notification Preferences
						</SectionTitle>
						<IconWrapper onClick={() => setTasksCollapsed((prev) => !prev)}>
							{tasksCollapsed ? (
								<FontAwesomeIcon icon={faChevronDown} />
							) : (
								<FontAwesomeIcon icon={faChevronUp} />
							)}
						</IconWrapper>
					</div>
					{!tasksCollapsed && (
						<>
							<ActionsToolbar style={{ marginBottom: '16px' }}>


							</ActionsToolbar>
							<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>

								<div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
									<FilterButton type='button' onClick={() => setActiveTab('withNotifications')} active={activeTab === 'withNotifications'} leftRounded>
										With Notifications
									</FilterButton>
									<FilterButton type='button' onClick={() => setActiveTab('withoutNotifications')} active={activeTab === 'withoutNotifications'} rightRounded>
										Without Notifications
									</FilterButton>
								</div>
							</div>
							<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
								<PreferenceText style={{ marginBottom: '12px', color: '#6b7280' }}>
									{activeTab === 'withNotifications' ? tasksWithNotificationsCount : tasksWithoutNotificationsCount} task{activeTab === 'withNotifications' ? (tasksWithNotificationsCount !== 1 ? 's' : '') : (tasksWithoutNotificationsCount !== 1 ? 's' : '')} with notifications {activeTab === 'withNotifications' ? 'enabled' : 'disabled'}.
								</PreferenceText>
								{activeTab === 'withNotifications' ? (
									<DisableAllButton onClick={handleDisableAllTaskNotifications}>
										Disable All Task Notifications
									</DisableAllButton>
								) : (
									<EnableAllButton onClick={handleEnableAllTaskNotifications}>
										Enable All Task Notifications
									</EnableAllButton>
								)
								}
							</div>
							{activeTab === 'withNotifications' && (
								<>
									<PreferencesGrid>
										{tasksWithNotifications.map((task: Task) => (
											<PreferenceOption key={task.id}>
												<input
													type='checkbox'
													checked={true}
													onChange={() => {
														setIndividualTaskAction({ task, action: 'disable' });
														setShowConfirmIndividualTaskAction(true);
													}}
												/>
												<PreferenceText>
													<strong>{task.title}</strong>
													<span>
														Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'} | Property: {task.property}
													</span>
												</PreferenceText>
											</PreferenceOption>
										))}
									</PreferencesGrid>
								</>
							)}
							{activeTab === 'withoutNotifications' && (
								<>
									<PreferencesGrid>
										{tasksWithoutNotifications.map((task: Task) => (
											<PreferenceOption key={task.id}>
												<input
													type='checkbox'
													checked={false}
													onChange={() => {
														setIndividualTaskAction({ task, action: 'enable' });
														setShowConfirmIndividualTaskAction(true);
													}}
												/>
												<PreferenceText>
													<strong>{task.title}</strong>
													<span>
														Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'} | Property: {task.property}
													</span>
												</PreferenceText>
											</PreferenceOption>
										))}
									</PreferencesGrid>
								</>
							)}
						</>
					)}
				</Section>


			</SectionBody >
			{showTaskActionConfirmation && (
				<GenericModal
					isOpen={showTaskActionConfirmation}
					onClose={() => setShowTaskActionConfirmation(false)}
					title={
						taskActionType === 'enable'
							? 'Enable All Task Notifications'
							: 'Disable All Task Notifications'
					}
					primaryButtonLabel={
						taskActionType === 'enable' ? 'Enable All' : 'Disable All'
					}
					primaryButtonAction={
						taskActionType === 'enable'
							? confirmEnableAllTaskNotifications
							: confirmDisableAllTaskNotifications
					}
					secondaryButtonLabel='Cancel'
					secondaryButtonAction={() => setShowTaskActionConfirmation(false)}
					showActions
					compact>
					{taskActionType === 'enable'
						? <>
							<p>This will turn on reminders for every task that currently has notifications disabled.</p>
							<p>Tasks without a saved schedule will use the default reminders: </p>
							<ul style={{ marginLeft: '20px', color: '#6b7280' }}>
								<li>30 days before due date</li>
								<li>7 days before due date</li>
								<li>On the due date</li>
								<li>1 week overdue</li>
							</ul>
						</>
						: <p>This will turn off reminders for every task that currently has notifications enabled.</p>}
				</GenericModal>
			)}

			{showConfirmIndividualTaskAction && individualTaskAction && (
				<GenericModal
					isOpen={showConfirmIndividualTaskAction}
					onClose={() => setShowConfirmIndividualTaskAction(false)}
					title={individualTaskAction.task.enableNotifications ? 'Disable Task Notifications' : 'Enable Task Notifications'}
					primaryButtonLabel={individualTaskAction.task.enableNotifications ? 'Disable' : 'Enable'}
					primaryButtonAction={() => {
						updateTaskMutation({
							id: individualTaskAction.task.id,
							updates: {
								enableNotifications: !individualTaskAction.task.enableNotifications,
								...(!individualTaskAction.task.notifications ||
									individualTaskAction.task.notifications.length === 0
									? {
										notifications: getDefaultTaskNotifications(),
									}
									: {}),
							},
						}).unwrap()
							.then(() => {
								feedback.notify(`${individualTaskAction.task.enableNotifications ? 'Disabled' : 'Enabled'} notifications for task: ${individualTaskAction.task.title}`);
							})
							.catch((error) => {
								console.error(`Failed to ${individualTaskAction.task.enableNotifications ? 'disable' : 'enable'} notifications for task:`, error);
								feedback.notify(`Failed to ${individualTaskAction.task.enableNotifications ? 'disable' : 'enable'} notifications for task: ${individualTaskAction.task.title}. Please try again.`);
							})
							.finally(() => {
								setShowConfirmIndividualTaskAction(false);
							});
					}}
					secondaryButtonLabel='Cancel'
					secondaryButtonAction={() => setShowConfirmIndividualTaskAction(false)}
					showActions
					compact>
					{individualTaskAction.task.enableNotifications
						? <p>This will turn off reminders for this task.</p>
						: <>
							<p>This will turn on reminders for every task that currently has notifications disabled.</p>
							<p>Tasks without a saved schedule will use the default reminders: </p>
							<ul style={{ marginLeft: '20px', color: '#6b7280' }}>
								<li>30 days before due date</li>
								<li>7 days before due date</li>
								<li>On the due date</li>
								<li>1 week overdue</li>
							</ul>
						</>}
				</GenericModal>
			)}

		</Section >
	);
};
