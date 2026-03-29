import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { useGetPropertiesQuery } from 'Redux/API/propertySlice';
import {
	useGetAllMaintenanceHistoryForUserQuery,
} from 'Redux/API/userSlice';
import { getTenantPropertySlug } from 'utils/permissions';
import { selectIsTenant } from 'Redux/selectors/permissionSelectors';
import { filterTasksByRole } from 'utils/dataFilters';
import { getCurrentLocation } from 'utils/geolocation';
import { TaskCompletionModal } from 'Components/TaskCompletionModal';
import { TrialWarningBanner } from 'Components/TrialWarningBanner/TrialWarningBanner';
import { ExpiredTrialBanner } from 'Components/ExpiredTrialBanner/ExpiredTrialBanner';
import { ScheduledSubscriptionBanner } from 'Components/ScheduledSubscriptionBanner/ScheduledSubscriptionBanner';
import { getTrialDaysRemaining, isTrialExpired } from 'utils/subscriptionUtils';
import { handleCheckoutSuccess } from 'services/stripeService';
import {
	Wrapper,
	TaskStatusBanners,
	TaskStatusBanner,
	TaskStatusCount,
	TaskStatusText,
	PropertyScoreSection,
	PropertyScoreTitle,
	ScoreGaugeContainer,
	ScoreValue,
} from './DashboardTab.styles';
import { SeasonalMaintenance } from 'Components/SeasonalMaintenance';
import { useTaskHandlers } from 'pages/PropertyDetailPage/useTaskHandlers';
import { TaskModal } from 'Components/Library';
import { TaskAssignModal } from 'Components/Library/Modal/TaskAssignModal';
import { useGetTasksQuery, useUpdateTaskMutation } from 'Redux/API/taskSlice';

export const DashboardTab = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	// Select team groups and derive members with memoization to avoid new references
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const teamMembers = useMemo(
		() =>
			teamGroups
				.flatMap((group) => group.members || [])
				.filter((member): member is typeof member => member !== undefined),
		[teamGroups],
	);

	// Fetch tasks and properties from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: ownedProperties = [] } = useGetPropertiesQuery();
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery();
	const allProperties = useMemo(() => {
		const combined = [...ownedProperties];
		// Filter out properties hidden from dashboard
		const hiddenIds = currentUser?.hiddenPropertyIds || [];
		return combined.filter((property) => !hiddenIds.includes(property.id));
	}, [ownedProperties, currentUser?.hiddenPropertyIds]);

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();

	// Local task handlers for dashboard (used by MobileTaskCarousel)
	const taskHandlers = useTaskHandlers({ updateTaskMutation });

	// Destructure task handlers state
	const {
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
	} = taskHandlers;

	// Redirect tenants to their assigned property
	const isUserTenant = useSelector(selectIsTenant);

	useEffect(() => {
		if (currentUser && isUserTenant) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, isUserTenant, navigate]);

	// Get user geolocation once on mount (with permission request on mobile)
	useEffect(() => {
		const getLocation = async () => {
			const location = await getCurrentLocation();
			if (location) {
				setUserLocation(location);
				// Set default temp unit based on location
			}
		};
		getLocation();
	}, []);

	// Handle Stripe checkout success
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const sessionId = urlParams.get('session_id');

		if (sessionId && currentUser) {
			const currentHash = window.location.hash;
			const cleanHash = currentHash.replace(/[?&]session_id=[^&]*/, '');
			window.history.replaceState(
				{},
				'',
				window.location.pathname + window.location.search + cleanHash,
			);

			handleCheckoutSuccess(sessionId)
				.then((result) => {
					console.info('Checkout verification result:', result);
					window.location.reload();
				})
				.catch((error) => {
					console.error('Checkout verification failed:', error);
				});
		}
	}, [location.search, currentUser]);

	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	// Generate assignee options for task editing
	const assigneeOptions = useMemo(() => {
		const assignees: Array<{ label: string; value: string; email?: string }> =
			[];

		// Add team members
		teamMembers
			.filter((member): member is typeof member => member !== undefined)
			.forEach((member) => {
				assignees.push({
					label: `${member.firstName || ''} ${member.lastName || ''} (${
						member.title || ''
					})`.trim(),
					value: member.id,
					email: member.email,
				});
			});

		return assignees;
	}, [teamMembers]);

	// Task status counts for banner display
	const taskStatusCounts = useMemo(() => {
		const filteredTasks = filterTasksByRole(
			allTasks,
			currentUser,
			teamMembers,
			allProperties,
		);

		const now = new Date();
		let overdue = 0;
		let upcoming = 0;
		let completed = allMaintenanceHistory.length; // Completed tasks from maintenance history

		filteredTasks.forEach((task) => {
			if (task.status === 'Completed') {
				// Already counted in maintenance history
				return;
			}

			if (task.dueDate) {
				const dueDate = new Date(task.dueDate);
				if (dueDate < now) {
					// Overdue if past due and not completed
					if (
						task.status === 'Pending' ||
						task.status === 'In Progress' ||
						task.status === 'Awaiting Approval' ||
						task.status === 'Rejected'
					) {
						overdue++;
					}
				} else {
					// Upcoming if due in the future
					upcoming++;
				}
			}
		});

		return {
			overdue,
			upcoming,
			completed,
		};
	}, [
		allTasks,
		currentUser,
		teamMembers,
		allProperties,
		allMaintenanceHistory,
	]);

	// Property score calculation (100 - penalty for overdue tasks)
	const propertyScore = useMemo(() => {
		const baseScore = 100;
		const penaltyPerOverdueTask = 5; // 5 points deducted per overdue task
		const score = Math.max(
			0,
			baseScore - taskStatusCounts.overdue * penaltyPerOverdueTask,
		);
		return score;
	}, [taskStatusCounts.overdue]);

	const gaugeNeedle = useMemo(() => {
		const centerX = 100;
		const centerY = 100;
		const radius = 70;
		const theta = Math.PI * (1 - propertyScore / 100);
		const end = {
			x: centerX + radius * Math.cos(theta),
			y: centerY - radius * Math.sin(theta),
		};
		return {
			centerX,
			centerY,
			x: end.x,
			y: end.y,
		};
	}, [propertyScore]);

	const gaugeSegments = useMemo(
		() => [
			{ name: 'Low', value: 33, fill: '#ef4444' },
			{ name: 'Medium', value: 33, fill: '#f59e0b' },
			{ name: 'High', value: 34, fill: '#10b981' },
		],
		[],
	);

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
	};

	return (
		<Wrapper>
			{/* Scheduled Subscription Banner */}
			{currentUser?.subscription?.hasScheduledSubscription &&
				currentUser?.subscription?.scheduledPlan &&
				currentUser?.subscription?.trialEndsAt && (
					<ScheduledSubscriptionBanner
						scheduledPlan={currentUser.subscription.scheduledPlan}
						trialEndsAt={currentUser.subscription.trialEndsAt}
						onManageClick={() => navigate('/settings')}
					/>
				)}

			{/* Trial/Expired Warning Banner */}
			{currentUser?.subscription?.status === 'trial' &&
				!currentUser?.subscription?.hasScheduledSubscription && (
					<TrialWarningBanner
						daysRemaining={getTrialDaysRemaining(
							currentUser.subscription as any,
						)}
						onUpgradeClick={() => navigate('/paywall')}
					/>
				)}
			{currentUser?.subscription &&
				isTrialExpired(currentUser.subscription) && (
					<ExpiredTrialBanner onUpgradeClick={() => navigate('/paywall')} />
				)}

			{/* Task Status Banners */}
			<TaskStatusBanners>
				<TaskStatusBanner $type='overdue' onClick={() => navigate('/tasks')}>
					<TaskStatusCount $type='overdue'>
						{taskStatusCounts.overdue}
					</TaskStatusCount>
					<TaskStatusText>
						{taskStatusCounts.overdue === 1 ? 'Overdue Task' : 'Overdue Tasks'}
					</TaskStatusText>
				</TaskStatusBanner>

				<TaskStatusBanner $type='upcoming' onClick={() => navigate('/tasks')}>
					<TaskStatusCount $type='upcoming'>
						{taskStatusCounts.upcoming}
					</TaskStatusCount>
					<TaskStatusText>
						{taskStatusCounts.upcoming === 1
							? 'Upcoming Task'
							: 'Upcoming Tasks'}
					</TaskStatusText>
				</TaskStatusBanner>
			</TaskStatusBanners>

			{/* Property Score Section */}
			<PropertyScoreSection>
				<PropertyScoreTitle>Property Score</PropertyScoreTitle>
				<ScoreGaugeContainer>
					<PieChart width={200} height={110}>
						<Pie
							data={gaugeSegments}
							dataKey='value'
							cx={100}
							cy={100}
							startAngle={180}
							endAngle={0}
							innerRadius={60}
							outerRadius={80}
							stroke='none'
							isAnimationActive={false}>
							{gaugeSegments.map((segment, index) => (
								<Cell
									key={`gauge-${segment.name}-${index}`}
									fill={segment.fill}
								/>
							))}
						</Pie>
						<g>
							<line
								x1={gaugeNeedle.centerX}
								y1={gaugeNeedle.centerY}
								x2={gaugeNeedle.x}
								y2={gaugeNeedle.y}
								stroke='#1f2937'
								strokeWidth='2'
							/>
							<circle
								cx={gaugeNeedle.centerX}
								cy={gaugeNeedle.centerY}
								r='4'
								fill='#1f2937'
							/>
						</g>
					</PieChart>
					<ScoreValue>{propertyScore}</ScoreValue>
				</ScoreGaugeContainer>
			</PropertyScoreSection>
			<SeasonalMaintenance location={userLocation} />

			{/* Task Completion Modal */}
			{showTaskCompletionModal && completingTaskId && (
				<TaskCompletionModal
					taskId={completingTaskId}
					taskTitle={
						allTasks.find((t) => t.id === completingTaskId)?.title || ''
					}
					task={allTasks.find((t) => t.id === completingTaskId)}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}

			<TaskModal
				isOpen={showTaskDialog}
				onClose={() => setShowTaskDialog(false)}
				editingTaskId={editingTaskId}
				editingTask={
					editingTaskId ? allTasks.find((t) => t.id === editingTaskId) : null
				}
				isEditing={!!editingTaskId}
				assigneeOptions={assigneeOptions}
				currentUser={currentUser}
				propertyOptions={allProperties.map((p) => ({
					label: p.title,
					value: p.id,
				}))}
			/>

			<TaskAssignModal
				isOpen={showTaskAssignDialog}
				onClose={() => setShowTaskAssignDialog(false)}
				task={
					assigningTaskId
						? allTasks.find((t) => t.id === assigningTaskId)
						: null
				}
				propertyId={
					assigningTaskId
						? allTasks.find((t) => t.id === assigningTaskId)?.propertyId || ''
						: ''
				}
				selectedAssignee={
					assigningTaskId
						? allTasks.find((t) => t.id === assigningTaskId)?.assignedTo
						: null
				}
				assigneeOptions={assigneeOptions}
			/>
		</Wrapper>
	);
};
