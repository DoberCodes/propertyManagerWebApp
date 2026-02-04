import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import { PageHeaderSection } from '../../Components/Library/PageHeaders';
import { ZeroState } from '../../Components/Library/ZeroState';
import {
	useGetTasksQuery,
	useGetPropertiesQuery,
	useGetSharedPropertiesForUserQuery,
	useGetAllPropertySharesForUserQuery,
	useGetAllMaintenanceHistoryForUserQuery,
	useUpdateTaskMutation,
} from '../../Redux/API/apiSlice';
import { UserRole } from '../../constants/roles';
import { isTenant, getTenantPropertySlug } from '../../utils/permissions';
import { filterTasksByRole } from '../../utils/dataFilters';
import { getDefaultTempUnit } from '../../utils/geolocationUtils';
import { getCurrentLocation } from '../../utils/geolocation';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { NotificationPanel } from '../../Components/Library';
import { TrialWarningBanner } from '../../Components/TrialWarningBanner/TrialWarningBanner';
import { getTrialDaysRemaining } from '../../utils/subscriptionUtils';
import { handleCheckoutSuccess } from '../../services/stripeService';
import { logout } from '../../Redux/Slices/userSlice';
import {
	Wrapper,
	TaskGridSection,
	BottomSectionsWrapper,
	Section,
	SectionTitle,
	SectionContent,
	TempToggle,
} from './DashboardTab.styles';
import { SeasonalMaintenance } from '../../Components/SeasonalMaintenance';
import { ReusableTable } from '../../Components/Library/ReusableTable';

export const DashboardTab = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const teamMembers = useSelector((state: RootState) =>
		state.team.groups
			.flatMap((group) => group.members || [])
			.filter((member): member is typeof member => member !== undefined),
	);

	// Fetch tasks and properties from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: ownedProperties = [] } = useGetPropertiesQuery();
	const { data: sharedProperties = [] } = useGetSharedPropertiesForUserQuery(
		currentUser?.id || '',
		{ skip: !currentUser?.id },
	);
	const { data: allMaintenanceHistory = [] } =
		useGetAllMaintenanceHistoryForUserQuery();

	// Combine owned and shared properties for task assignment
	const allProperties = useMemo(() => {
		return [...ownedProperties, ...sharedProperties];
	}, [ownedProperties, sharedProperties]);

	// Firebase mutations
	const [updateTaskMutation] = useUpdateTaskMutation();

	// Pie chart data for efficiency
	const efficiencyData = useMemo(() => {
		const now = new Date();
		let completed = allMaintenanceHistory.length, // Count completed tasks from maintenance history
			inProgress = 0,
			overdue = 0;

		// Count in-progress and overdue from active tasks (excluding completed)
		allTasks.forEach((task) => {
			if (task.status !== 'Completed') {
				// Skip completed tasks since they're in maintenance history
				if (
					task.dueDate &&
					new Date(task.dueDate) < now &&
					(task.status === 'Pending' ||
						task.status === 'In Progress' ||
						task.status === 'Awaiting Approval' ||
						task.status === 'Rejected')
				) {
					overdue++;
				} else {
					inProgress++;
				}
			}
		});

		return [
			{ name: 'Completed', value: completed },
			{ name: 'In Progress', value: inProgress },
			{ name: 'Overdue', value: overdue },
		];
	}, [allTasks, allMaintenanceHistory]);

	const COLORS = ['#34d399', '#60a5fa', '#f87171'];

	// Redirect tenants to their assigned property
	useEffect(() => {
		if (currentUser && isTenant(currentUser.role as UserRole)) {
			const propertySlug = getTenantPropertySlug(
				currentUser.assignedPropertyId,
			);
			if (propertySlug) {
				navigate(`/property/${propertySlug}`, { replace: true });
			}
		}
	}, [currentUser, navigate]);

	// Get user geolocation once on mount (with permission request on mobile)
	useEffect(() => {
		const getLocation = async () => {
			const location = await getCurrentLocation();
			if (location) {
				setUserLocation(location);
				// Set default temp unit based on location
				const defaultUnit = getDefaultTempUnit(
					location.latitude,
					location.longitude,
				);
				setTempUnit(defaultUnit);
			}
		};
		getLocation();
	}, []);

	// Handle Stripe checkout success
	useEffect(() => {
		const urlParams = new URLSearchParams(location.search);
		const sessionId = urlParams.get('session_id');

		if (sessionId && currentUser) {
			// Remove session_id from URL
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('session_id');
			window.history.replaceState({}, '', newUrl.toString());

			// Verify checkout session
			handleCheckoutSuccess(sessionId)
				.then((result) => {
					console.log('Checkout success verified:', result);
					// Force a logout/login to refresh user data with new subscription
					dispatch(logout());
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				})
				.catch((error) => {
					console.error('Checkout verification failed:', error);
					// Could show an error toast here
				});
		}
	}, [location.search, currentUser, dispatch]);

	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	console.info(tempUnit);

	// Fetch all property shares for dropdown options
	const { data: propertyShares = [] } = useGetAllPropertySharesForUserQuery();

	const handleTempUnit = (unit: 'C' | 'F') => {
		setTempUnit(unit);
	};

	const filteredTasks = useMemo(() => {
		const filtered = filterTasksByRole(
			allTasks,
			currentUser,
			teamMembers,
			allProperties,
		);
		const activeTasks = filtered.filter((task) => task.status !== 'Completed');
		// Enrich tasks with propertyTitle for display in table
		return activeTasks.map((task) => {
			const property = allProperties.find((p) => p.id === task.propertyId);
			return {
				...task,
				propertyTitle: property?.title || task.property || 'Unknown Property',
				assignedToNames: task.assignedTo?.name || '',
			};
		});
	}, [allTasks, currentUser, teamMembers, allProperties]);

	// Task statuses based on Task.types.ts
	const TASK_STATUSES = useMemo(
		() => [
			'Pending',
			'In Progress',
			'Awaiting Approval',
			'Completed',
			'Rejected',
		],
		[],
	);

	// Task priorities based on Task.types.ts
	const TASK_PRIORITIES = useMemo(
		() => ['Low', 'Medium', 'High', 'Urgent'],
		[],
	);

	// Generate Assigned To options based on current user role and property
	const getAssigneeOptions = useCallback(
		(task: any): string[] => {
			const assignees: string[] = [];
			const currentUserType = currentUser?.subscription?.plan || 'landlord';
			const taskProperty = allProperties.find(
				(p) => p.title === task.propertyTitle,
			);

			if (!taskProperty) return assignees;

			// Get owner name from property or current user
			const ownerName =
				taskProperty.owner ||
				`${currentUser?.firstName} ${currentUser?.lastName}`;

			// For homeowners: owner + people shared with property
			if (currentUserType === 'homeowner') {
				// Add owner
				if (ownerName) {
					assignees.push(ownerName);
				}

				// Add shared users for this property
				const sharedUsers = (propertyShares as any[]).filter(
					(share) => share.propertyId === taskProperty.id,
				);
				sharedUsers.forEach((share) => {
					const fullName =
						share.sharedWithFirstName && share.sharedWithLastName
							? `${share.sharedWithFirstName} ${share.sharedWithLastName}`
							: share.sharedWithEmail?.split('@')[0] || 'Shared User';
					assignees.push(fullName);
				});
			} else {
				// For landlords: owner + people shared with property + team assigned to property
				// Add owner
				if (ownerName) {
					assignees.push(ownerName);
				}

				// Add shared users for this property
				const sharedUsers = (propertyShares as any[]).filter(
					(share) => share.propertyId === taskProperty.id,
				);
				sharedUsers.forEach((share) => {
					const fullName =
						share.sharedWithFirstName && share.sharedWithLastName
							? `${share.sharedWithFirstName} ${share.sharedWithLastName}`
							: share.sharedWithEmail?.split('@')[0] || 'Shared User';
					assignees.push(fullName);
				});

				// Add team members assigned to this property
				teamMembers.forEach((member) => {
					if (
						member.linkedProperties?.includes(taskProperty.id) &&
						member.firstName &&
						member.lastName
					) {
						assignees.push(`${member.firstName} ${member.lastName}`);
					}
				});
			}

			// Remove duplicates
			return [...new Set(assignees)];
		},
		[currentUser, allProperties, propertyShares, teamMembers],
	);

	// Table columns definition
	const columns = useMemo(
		() => [
			{
				header: 'Title',
				accessor: 'title',
			},
			{
				header: 'Property',
				accessor: 'propertyTitle',
			},
			{
				header: 'Assigned To',
				accessor: 'assignedToNames',
				type: 'dropdown' as const,
				options: getAssigneeOptions,
			},
			{
				header: 'Due Date',
				accessor: 'dueDate',
				type: 'date' as const,
			},
			{
				header: 'Priority',
				accessor: 'priority',
				type: 'dropdown' as const,
				options: TASK_PRIORITIES,
			},
			{
				header: 'Status',
				accessor: 'status',
				type: 'dropdown' as const,
				options: TASK_STATUSES,
			},
		],
		[TASK_STATUSES, TASK_PRIORITIES, getAssigneeOptions],
	);

	const handleTaskCompletion = (taskId: string) => {
		setCompletingTaskId(taskId);
		setShowTaskCompletionModal(true);
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedRows(new Set());
	};

	return (
		<Wrapper>
			{/* Trial Warning Banner */}
			{currentUser?.subscription?.status === 'trial' && (
				<TrialWarningBanner
					daysRemaining={getTrialDaysRemaining(currentUser.subscription as any)}
					onUpgradeClick={() => navigate('/paywall')}
				/>
			)}

			{/* Task Grid Section */}
			<TaskGridSection>
				{filteredTasks.length === 0 ? (
					<ZeroState
						title='No tasks yet'
						description='No data available'
						icon='📊'></ZeroState>
				) : (
					<ReusableTable
						rowData={filteredTasks}
						columns={columns}
						onRowDoubleClick={(taskId) => navigate(`/task/${taskId}`)}
						onRowSelect={(selectedRows) => {
							setSelectedRows(new Set(selectedRows));
							console.log('Selected rows:', Array.from(selectedRows)); // Log selected rows
						}}
						selectedRows={selectedRows}
						onSelectAll={(_, selectedRowIds) => {
							setSelectedRows(new Set(selectedRowIds));
						}}
						showCheckbox={false}
						onRowUpdate={(updatedRow) => {
							console.log('Updated row:', updatedRow); // Log updated row
							// Prepare updates for Firebase
							const updates: any = {};

							// Update status if changed
							if (updatedRow.status) {
								updates.status = updatedRow.status;
							}

							// Update priority if changed
							if (updatedRow.priority) {
								updates.priority = updatedRow.priority;
							}

							// Update assignedTo if changed
							if (
								updatedRow.assignedToNames &&
								updatedRow.assignedToNames !== updatedRow.assignedTo?.name
							) {
								updates.assignedTo = {
									name: updatedRow.assignedToNames,
									id: updatedRow.id, // Keep the task ID for reference
								};
							}

							// Handle logic for updated row, e.g., marking a task as completed
							if (updatedRow.status === 'Completed') {
								handleTaskCompletion(updatedRow.id);
								return;
							}

							// Submit to Firebase if there are updates
							if (Object.keys(updates).length > 0) {
								updateTaskMutation({
									id: updatedRow.id,
									updates,
								}).catch((error) => {
									console.error('Failed to update task:', error);
								});
							}
						}}
					/>
				)}
			</TaskGridSection>

			{/* Bottom Two Sections */}
			<BottomSectionsWrapper>
				<NotificationPanel />
				<Section>
					<SectionTitle>Efficiency Chart</SectionTitle>
					<SectionContent>
						{efficiencyData.every((item) => item.value === 0) ? (
							<ZeroState
								title='No tasks yet'
								description='No data available'
								icon='📊'></ZeroState>
						) : (
							<ResponsiveContainer width='100%' height={220}>
								<PieChart>
									<Pie
										data={efficiencyData}
										dataKey='value'
										nameKey='name'
										cx='50%'
										cy='50%'
										outerRadius={70}
										label>
										{efficiencyData.map((_, index) => (
											<Cell
												key={`cell-${index}`}
												fill={COLORS[index % COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						)}
					</SectionContent>
				</Section>
				<Section>
					<SectionTitle>
						<h3>Seasonal Maintenance Tips</h3>
						<TempToggle>
							<button
								className={tempUnit === 'C' ? 'active' : ''}
								onClick={() => handleTempUnit('C')}>
								°C
							</button>
							<button
								className={tempUnit === 'F' ? 'active' : ''}
								onClick={() => handleTempUnit('F')}>
								°F
							</button>
						</TempToggle>
					</SectionTitle>

					<SectionContent>
						<SeasonalMaintenance tempUnit={tempUnit} location={userLocation} />
					</SectionContent>
				</Section>
			</BottomSectionsWrapper>

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
		</Wrapper>
	);
};
