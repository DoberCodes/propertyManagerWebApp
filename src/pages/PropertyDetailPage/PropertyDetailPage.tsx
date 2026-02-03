import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faEllipsisV,
	faCamera,
} from '@fortawesome/free-solid-svg-icons';
import { PropertyDetailPageProps } from '../../types/PropertyDetailPage.types';
import { RootState } from '../../Redux/store/store';
import { useTaskHandlers } from './useTaskHandlers';
import { usePropertyEditHandlers } from './usePropertyEditHandlers';
import { useMaintenanceRequestHandlers } from './useMaintenanceRequestHandlers';
import { getPropertyFieldValueUtil } from './PropertyDetailPage.utils';
import {
	useGetTasksQuery,
	useGetTeamMembersQuery,
	useUpdateTaskMutation,
	useCreateTaskMutation,
	useDeleteTaskMutation,
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
	useCreateNotificationMutation,
	useGetPropertySharesQuery,
} from '../../Redux/API/apiSlice';
import {
	canApproveMaintenanceRequest,
	isTenant,
} from '../../utils/permissions';
import { UserRole } from '../../constants/roles';
import { TeamMember } from '../../types/Team.types';
import { useFavorites } from '../../Hooks/useFavorites';
import {
	uploadPropertyImage,
	isValidPropertyImageFile,
} from '../../utils/propertyImageUpload';
import { TaskCompletionModal } from '../../Components/TaskCompletionModal';
import { MaintenanceRequestModal } from '../../Components/MaintenanceRequestModal';
import { ConvertRequestToTaskModal } from '../../Components/ConvertRequestToTaskModal';
import { SharePropertyModal } from '../../Components/SharePropertyModal';
import { AddTenantModal } from '../../Components/AddTenantModal';
import { DeleteConfirmationModal } from '../../Components/Library/Modal/DeleteConfirmationModal';
import { Tabs, GenericModal } from '../../Components/Library';
import {
	EditTaskModal,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
} from '../../Components/Library';
import {
	Wrapper,
	Header,
	HeaderContent,
	PropertyTitle,
	FavoriteButton,
	BackButton,
	EmptyState,
	TitleContainer,
	EditableTitleInput,
	PencilIcon,
	TabControlsContainer,
} from './PropertyDetailPage.styles';
import {
	DetailsTab,
	TasksTab,
	MaintenanceTab,
	TenantsTab,
	UnitsTab,
	SuitesTab,
	RequestsTab,
} from './tabs';

export const PropertyDetailPage = (props: PropertyDetailPageProps) => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();

	// Get current user
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	const { isFavorite, toggleFavorite } = useFavorites(currentUser!.id);

	// Fetch properties from Firebase
	const { data: firebaseProperties = [] } = useGetPropertiesQuery();

	// Get property groups from Redux (populated by DataLoader)
	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);

	// Fetch team members from Firebase
	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery();

	// For backwards compatibility, also get from Redux - memoize to prevent rerenders
	const reduxTeamMembers = useSelector(
		(state: RootState) => {
			const members = state.team.groups.flatMap((group) => group.members);
			return members;
		},
		(a, b) => JSON.stringify(a) === JSON.stringify(b),
	);

	// Use Firebase team members if available, otherwise fallback to Redux
	const teamMembers =
		firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers;

	// Fetch tasks from Firebase
	const { data: allTasks = [] } = useGetTasksQuery();

	// Firebase mutations for updating tasks and properties
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [createTaskMutation] = useCreateTaskMutation();
	const [deleteTaskMutation] = useDeleteTaskMutation();
	const [updatePropertyMutation] = useUpdatePropertyMutation();
	const [createNotification] = useCreateNotificationMutation();

	const [activeTab, setActiveTab] = useState<
		| 'details'
		| 'tasks'
		| 'maintenance'
		| 'tenants'
		| 'requests'
		| 'units'
		| 'suites'
	>('details');
	const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showAddTenantModal, setShowAddTenantModal] = useState(false);
	const [deleteTaskModalOpen, setDeleteTaskModalOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<{
		id: string;
		title: string;
	} | null>(null);
	const propertyOverride = props.property;

	// Find the property based on slug from Firebase data - move up to use in hooks
	const property = useMemo(() => {
		return propertyOverride
			? propertyOverride
			: firebaseProperties.find((p: any) => p.slug === slug);
	}, [slug, firebaseProperties, propertyOverride]);

	// Handle task deletion with confirmation
	const handleTaskDeleteClick = (taskIds: string[]) => {
		if (taskIds.length === 0) return;
		const task = allTasks.find((t) => t.id === taskIds[0]);
		if (task) {
			setTaskToDelete({ id: taskIds[0], title: task.title });
			setDeleteTaskModalOpen(true);
		}
	};

	// Import handlers from custom hooks
	const taskHandlers = useTaskHandlers({
		onDeleteClick: handleTaskDeleteClick,
		deleteTaskMutation,
	});
	const propertyHandlers = usePropertyEditHandlers();
	const maintenanceHandlers = useMaintenanceRequestHandlers(
		property,
		currentUser,
	);

	// Destructure task handlers
	const {
		selectedTasks,
		setSelectedTasks,
		showTaskDialog,
		setShowTaskDialog,
		editingTaskId,
		showTaskAssignDialog,
		setShowTaskAssignDialog,
		assigningTaskId,
		selectedAssignee,
		setSelectedAssignee,
		showTaskCompletionModal,
		setShowTaskCompletionModal,
		completingTaskId,
		taskFormData,
		setTaskFormData,
		handleTaskCheckbox,
		handleCreateTask,
		handleEditTask,
		handleDeleteTask,
		handleAssignTask,
		handleCompleteTask,
		handleTaskFormChange,
		handleTaskCompletionSuccess,
		confirmDeleteTask,
	} = taskHandlers;

	useEffect(() => {
		if (!editingTaskId) return;
		const taskToEdit = allTasks.find((t) => t.id === editingTaskId);
		if (!taskToEdit) return;

		setTaskFormData({
			title: taskToEdit.title || '',
			dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
			status: taskToEdit.status || 'Pending',
			notes: taskToEdit.notes || '',
			priority: taskToEdit.priority,
			assignedTo: taskToEdit.assignedTo?.id || taskToEdit.assignee || '',
			isRecurring: taskToEdit.isRecurring || false,
			recurrenceFrequency: taskToEdit.recurrenceFrequency,
			recurrenceInterval: taskToEdit.recurrenceInterval,
			recurrenceCustomUnit: taskToEdit.recurrenceCustomUnit,
		});
	}, [editingTaskId, allTasks, setTaskFormData]);

	// Destructure property edit handlers
	const {
		isEditMode,
		setIsEditMode,
		editedProperty,
		isEditingTitle,
		setIsEditingTitle,
		editedTitle,
		setEditedTitle,
		isUploadingImage,
		setIsUploadingImage,
		imageError,
		setImageError,
		deviceFormData,
		showDeviceDialog,
		setShowDeviceDialog,
		handlePropertyFieldChange,
		handleDeviceFormChange,
		handleDeviceFormSubmit,
		handleTitleEdit,
		handleTitleSave,
	} = propertyHandlers;

	// Destructure maintenance request handlers
	const {
		showMaintenanceRequestModal,
		setShowMaintenanceRequestModal,
		showConvertModal,
		setShowConvertModal,
		convertingRequest,
		setConvertingRequest,
		handleMaintenanceRequestSubmit,
		handleConvertRequestToTask,
		handleConvertToTask,
	} = maintenanceHandlers;

	// Only fetch property shares for the property of the task being assigned
	const assigningTask = allTasks.find((t) => t.id === assigningTaskId);
	const { data: propertyShares = [] } = useGetPropertySharesQuery(
		assigningTask?.propertyId ?? '',
		{ skip: !assigningTask },
	);
	const sharedUsers = propertyShares.map((share) => ({
		id: share.sharedWithUserId || share.sharedWithEmail,
		firstName: share.sharedWithEmail?.split('@')[0] || 'Shared User',
		lastName: '',
		email: share.sharedWithEmail,
		isSharedUser: true,
	}));

	const hasCommercialSuites =
		property?.propertyType === 'Commercial' &&
		(((property as any)?.hasSuites ?? false) ||
			(Array.isArray((property as any)?.suites) &&
				(property as any).suites.length > 0));

	// Get maintenance requests for this property - memoize selector
	const allMaintenanceRequests = useSelector(
		(state: RootState) => state.maintenanceRequests.requests,
		(a, b) => a.length === b.length && a.every((item, idx) => item === b[idx]),
	);
	const propertyMaintenanceRequests = useMemo(() => {
		if (!property) return [];
		return allMaintenanceRequests.filter(
			(req) => req.propertyId === property.id,
		);
	}, [property, allMaintenanceRequests]);

	useEffect(() => {
		if (hasCommercialSuites && activeTab === 'tenants') {
			setActiveTab('suites');
		}
	}, [hasCommercialSuites, activeTab]);

	// Filter tasks for this property
	const propertyTasks = useMemo(() => {
		if (!property) return [];
		// Match by property ID if it exists, otherwise try matching by title
		const allPropertyTasks = allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
		// Filter out completed tasks - they should show in Maintenance History instead
		return allPropertyTasks.filter((task) => task.status !== 'Completed');
	}, [property, allTasks]);

	// Get completed tasks for Maintenance History tab
	const completedTasks = useMemo(() => {
		if (!property) return [];
		return allTasks.filter(
			(task) =>
				(task.propertyId === property.id || task.property === property.title) &&
				task.status === 'Completed',
		);
	}, [property, allTasks]);

	// Helper function for property field value - use util if not in edit mode
	const getPropertyFieldValue = (field: string) => {
		return getPropertyFieldValueUtil(
			field,
			property,
			editedProperty,
			isEditMode,
		);
	};

	// Photo upload handler
	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && property) {
			if (!isValidPropertyImageFile(file)) {
				setImageError('Invalid file. Please upload an image under 8MB.');
				return;
			}

			setImageError(null);
			setIsUploadingImage(true);

			try {
				const imageUrl = await uploadPropertyImage(file, property.id);
				await updatePropertyMutation({
					id: property.id,
					updates: {
						image: imageUrl,
					},
				}).unwrap();

				// Create notification for property image update
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'property_updated',
						title: 'Property Updated',
						message: `Property image for "${property.title}" has been updated`,
						data: {
							propertyId: property.id,
							propertyTitle: property.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}

				setIsUploadingImage(false);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to upload image';
				setImageError(errorMessage);
				setIsUploadingImage(false);
			}
			// Clear the file input
			e.target.value = '';
		}
	};

	// Task form submit handler
	const handleTaskFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!property || !taskFormData.title.trim()) return;

		try {
			if (editingTaskId !== null) {
				// Update existing task
				const taskToUpdate = allTasks.find((t) => t.id === editingTaskId);
				if (taskToUpdate) {
					const reduxStatus =
						taskFormData.status === 'Hold'
							? 'Pending'
							: taskFormData.status === 'Overdue'
								? 'Pending'
								: taskFormData.status;

					const safeTeamMembers = teamMembers.filter(
						(member): member is TeamMember => Boolean(member),
					);
					const assignedTo = taskFormData.assignedTo
						? safeTeamMembers.find(
								(member) => member.id === taskFormData.assignedTo,
							)
						: undefined;

					// Build updates object and filter out undefined values (Firebase doesn't support undefined)
					const updates: any = {
						title: taskFormData.title,
						dueDate: taskFormData.dueDate,
						status: reduxStatus,
						notes: taskFormData.notes,
						priority: taskFormData.priority,
						isRecurring: Boolean(taskFormData.isRecurring),
					};

					if (assignedTo) {
						updates.assignedTo = {
							id: assignedTo.id,
							name: `${assignedTo.firstName || ''} ${assignedTo.lastName || ''}`.trim(),
							email: assignedTo.email,
						};
					}

					if (taskFormData.recurrenceFrequency) {
						updates.recurrenceFrequency = taskFormData.recurrenceFrequency;
					}
					if (taskFormData.recurrenceInterval) {
						updates.recurrenceInterval = taskFormData.recurrenceInterval;
					}
					if (taskFormData.recurrenceCustomUnit) {
						updates.recurrenceCustomUnit = taskFormData.recurrenceCustomUnit;
					}

					await updateTaskMutation({
						id: editingTaskId,
						updates,
					}).unwrap();

					// Create notification for task update
					try {
						await createNotification({
							userId: currentUser!.id,
							type: 'task_updated',
							title: 'Task Updated',
							message: `Task "${taskFormData.title}" has been updated`,
							data: {
								taskId: editingTaskId,
								taskTitle: taskFormData.title,
								propertyId: property.id,
								propertyTitle: property.title,
							},
							status: 'unread',
							actionUrl: `/properties/${property.id}`,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						}).unwrap();
					} catch (notifError) {
						console.error('Notification failed:', notifError);
					}
				}
			} else {
				// Add new task
				const reduxStatus =
					taskFormData.status === 'Hold'
						? 'Pending'
						: taskFormData.status === 'Overdue'
							? 'Pending'
							: taskFormData.status;

				const safeTeamMembers = teamMembers.filter(
					(member): member is TeamMember => Boolean(member),
				);
				const assignedTo = taskFormData.assignedTo
					? safeTeamMembers.find(
							(member) => member.id === taskFormData.assignedTo,
						)
					: undefined;

				// Build new task object and filter out undefined values (Firebase doesn't support undefined)
				const newTask: any = {
					userId: currentUser!.id,
					title: taskFormData.title,
					dueDate: taskFormData.dueDate,
					status: reduxStatus,
					property: property.title,
					propertyId: property.id,
					notes: taskFormData.notes,
					priority: taskFormData.priority,
					isRecurring: Boolean(taskFormData.isRecurring),
				};

				if (assignedTo) {
					newTask.assignedTo = {
						id: assignedTo.id,
						name: `${assignedTo.firstName || ''} ${assignedTo.lastName || ''}`.trim(),
						email: assignedTo.email,
					};
				}

				if (taskFormData.recurrenceFrequency) {
					newTask.recurrenceFrequency = taskFormData.recurrenceFrequency;
				}
				if (taskFormData.recurrenceInterval) {
					newTask.recurrenceInterval = taskFormData.recurrenceInterval;
				}
				if (taskFormData.recurrenceCustomUnit) {
					newTask.recurrenceCustomUnit = taskFormData.recurrenceCustomUnit;
				}

				await createTaskMutation(newTask).unwrap();

				// Create notification for task creation
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'task_created',
						title: 'Task Created',
						message: `New task "${taskFormData.title}" has been created`,
						data: {
							taskTitle: taskFormData.title,
							propertyId: property.id,
							propertyTitle: property.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}
			}
			setShowTaskDialog(false);
			setSelectedTasks([]);
			setTaskFormData({
				title: '',
				dueDate: '',
				status: 'Pending',
				notes: '',
			});
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Failed to save task. Please try again.');
		}
	};

	// Confirm assignment handler
	const handleConfirmAssignment = async () => {
		if (assigningTaskId && selectedAssignee) {
			try {
				const taskToAssign = allTasks.find((t) => t.id === assigningTaskId);
				// assignedTo should be an object: { id, name, email }
				await updateTaskMutation({
					id: assigningTaskId,
					updates: { assignedTo: selectedAssignee },
				}).unwrap();

				// Create notification for task assignment
				try {
					await createNotification({
						userId: selectedAssignee.id,
						type: 'task_assigned',
						title: 'Task Assigned',
						message: `You have been assigned to task "${taskToAssign?.title}"`,
						data: {
							taskId: assigningTaskId,
							taskTitle: taskToAssign?.title,
							assignedTo: selectedAssignee,
							propertyId: property?.id,
							propertyTitle: property?.title,
						},
						status: 'unread',
						actionUrl: `/properties/${property?.id}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				} catch (notifError) {
					console.error('Notification failed:', notifError);
				}

				setShowTaskAssignDialog(false);
				setSelectedAssignee(null);
				setSelectedTasks([]);
			} catch (error) {
				console.error('Error assigning task:', error);
			}
		}
	};

	if (!property) {
		return (
			<Wrapper>
				<EmptyState>
					<h2>Property not found</h2>
					<p>The property you're looking for doesn't exist.</p>
					<BackButton onClick={() => navigate('/manage')}>
						← Back to Properties
					</BackButton>
				</EmptyState>
			</Wrapper>
		);
	}

	const isFav = isFavorite(property.id);

	return (
		<Wrapper>
			<Header style={{ backgroundImage: `url(${property.image})` }}>
				<BackButton onClick={() => navigate('/manage')} title='Go back'>
					<FontAwesomeIcon icon={faArrowLeft} />
				</BackButton>
				{/* 3-dot menu for mobile */}
				{currentUser && (
					<div
						style={{
							position: 'absolute',
							top: '20px',
							right: '20px',
							display: 'none',
							zIndex: 100,
						}}
						className='mobile-action-menu'>
						<button
							onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
							style={{
								background: 'none',
								border: 'none',
								padding: '8px 12px',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '20px',
								color: 'white',
								zIndex: 3,
							}}
							title='More options'>
							<FontAwesomeIcon icon={faEllipsisV} />
						</button>
						{isActionMenuOpen && (
							<div
								style={{
									position: 'absolute',
									top: '40px',
									right: '0',
									background: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '6px',
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
									minWidth: '220px',
									zIndex: 1002,
									overflow: 'hidden',
								}}>
								{!isTenant(currentUser.role as UserRole) && (
									<button
										onClick={() => {
											toggleFavorite({
												id: property.id,
												title: property.title,
												slug: property.slug,
											});
											setIsActionMenuOpen(false);
										}}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										{isFav ? '★ Favorited' : '☆ Add to Favorites'}
									</button>
								)}
								{isTenant(currentUser.role as UserRole) && (
									<button
										onClick={() => {
											setShowMaintenanceRequestModal(true);
											setIsActionMenuOpen(false);
										}}
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											borderBottom: '1px solid #f0f0f0',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}>
										🔧 Request Maintenance
									</button>
								)}
								{property &&
									propertyGroups.some(
										(group) =>
											group.id === property.groupId &&
											group.userId === currentUser.id,
									) && (
										<button
											onClick={() => {
												setShowShareModal(true);
												setIsActionMenuOpen(false);
											}}
											style={{
												width: '100%',
												padding: '12px 16px',
												border: 'none',
												background: 'none',
												textAlign: 'left',
												cursor: 'pointer',
												fontSize: '14px',
												color: '#1a1a1a',
												transition: 'background-color 0.2s ease',
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.backgroundColor = '#f3f4f6')
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.backgroundColor = 'transparent')
											}>
											👥 Share Property
										</button>
									)}
								{!isUploadingImage && (
									<label
										htmlFor='header-photo-upload'
										style={{
											width: '100%',
											padding: '12px 16px',
											border: 'none',
											background: 'none',
											textAlign: 'left',
											cursor: 'pointer',
											fontSize: '14px',
											color: '#1a1a1a',
											transition: 'background-color 0.2s ease',
											display: 'block',
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = '#f3f4f6')
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor = 'transparent')
										}
										title='Click to upload property image'>
										<FontAwesomeIcon
											icon={faCamera}
											style={{ marginRight: '8px' }}
										/>
										Change Photo
									</label>
								)}
							</div>
						)}
					</div>
				)}
				{imageError && (
					<div
						style={{
							position: 'relative',
							zIndex: 10,
							color: '#dc2626',
							fontSize: '14px',
							padding: '8px 12px',
							backgroundColor: '#fee2e2',
							borderRadius: '4px',
							margin: '0 20px',
						}}>
						{imageError}
					</div>
				)}
				{isUploadingImage ? (
					<div
						style={{
							position: 'relative',
							zIndex: 10,
							textAlign: 'center',
							color: 'white',
							fontSize: '14px',
						}}>
						Uploading image...
					</div>
				) : null}
				<input
					id='header-photo-upload'
					type='file'
					accept='image/*'
					onChange={handlePhotoUpload}
					style={{ display: 'none' }}
				/>
				<HeaderContent>
					<TitleContainer>
						{isEditingTitle ? (
							<EditableTitleInput
								value={editedTitle}
								onChange={(e) => setEditedTitle(e.target.value)}
								onBlur={handleTitleSave}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleTitleSave();
									if (e.key === 'Escape') setIsEditingTitle(false);
								}}
								autoFocus
							/>
						) : (
							<PropertyTitle>{property.title}</PropertyTitle>
						)}
						<PencilIcon onClick={handleTitleEdit} title='Edit property name'>
							✎
						</PencilIcon>
					</TitleContainer>

					<div style={{ display: 'contents' }} className='desktop-actions'>
						<FavoriteButton
							onClick={() =>
								toggleFavorite({
									id: property.id,
									title: property.title,
									slug: property.slug,
								})
							}
							style={{
								display:
									currentUser && !isTenant(currentUser.role as UserRole)
										? 'block'
										: 'none',
							}}>
							{isFav ? '★ Favorited' : '☆ Add to Favorites'}
						</FavoriteButton>
						{currentUser && isTenant(currentUser.role as UserRole) && (
							<FavoriteButton
								onClick={() => setShowMaintenanceRequestModal(true)}>
								🔧 Request Maintenance
							</FavoriteButton>
						)}
						{currentUser &&
							property &&
							propertyGroups.some(
								(group) =>
									group.id === property.groupId &&
									group.userId === currentUser.id,
							) && (
								<FavoriteButton onClick={() => setShowShareModal(true)}>
									👥 Share Property
								</FavoriteButton>
							)}
					</div>
				</HeaderContent>
			</Header>

			{/* Tab Navigation */}
			<TabControlsContainer>
				<Tabs
					property={property}
					hasCommercialSuites={hasCommercialSuites}
					currentUser={currentUser}
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					activeTab={activeTab}
					setActiveTab={setActiveTab as (tab: string) => void}
				/>
			</TabControlsContainer>

			{/* Details Tab */}
			{activeTab === 'details' && (
				<DetailsTab
					isEditMode={isEditMode}
					setIsEditMode={setIsEditMode}
					property={property}
					getPropertyFieldValue={getPropertyFieldValue}
					handlePropertyFieldChange={handlePropertyFieldChange}
				/>
			)}

			{/* Suites Tab */}
			{activeTab === 'suites' &&
				property?.propertyType === 'Commercial' &&
				property?.hasSuites && <SuitesTab property={property} />}

			{/* Tasks Tab */}
			{activeTab === 'tasks' && (
				<TasksTab
					propertyTasks={propertyTasks}
					selectedTasks={selectedTasks}
					setSelectedTasks={setSelectedTasks}
					handleTaskCheckbox={handleTaskCheckbox}
					handleCreateTask={handleCreateTask}
					handleEditTask={handleEditTask}
					handleAssignTask={handleAssignTask}
					handleCompleteTask={handleCompleteTask}
					handleDeleteTask={handleDeleteTask}
				/>
			)}

			{/* Maintenance History Tab */}
			{activeTab === 'maintenance' && (
				<MaintenanceTab property={property} completedTasks={completedTasks} />
			)}

			{/* Tenants Tab */}
			{activeTab === 'tenants' && !hasCommercialSuites && (
				<TenantsTab
					property={property}
					currentUser={currentUser}
					setShowAddTenantModal={setShowAddTenantModal}
				/>
			)}

			{/* Units Tab */}
			{activeTab === 'units' && property?.propertyType === 'Multi-Family' && (
				<UnitsTab property={property} />
			)}

			{/* Maintenance Requests Tab */}
			{activeTab === 'requests' && (
				<RequestsTab
					propertyMaintenanceRequests={propertyMaintenanceRequests}
					currentUser={currentUser}
					canApproveMaintenanceRequest={canApproveMaintenanceRequest}
					handleConvertRequestToTask={handleConvertRequestToTask}
				/>
			)}

			{/* Add Device Dialog */}
			{showDeviceDialog && (
				<GenericModal
					isOpen={showDeviceDialog}
					onClose={() => setShowDeviceDialog(false)}
					title='Add New Household Device'
					onSubmit={handleDeviceFormSubmit}
					primaryButtonLabel='Add Device'
					secondaryButtonLabel='Cancel'>
					<FormGroup>
						<FormLabel>Device Type *</FormLabel>
						<FormInput
							type='text'
							name='type'
							value={deviceFormData.type}
							onChange={handleDeviceFormChange}
							placeholder='e.g., HVAC System, Water Heater'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Brand *</FormLabel>
						<FormInput
							type='text'
							name='brand'
							value={deviceFormData.brand}
							onChange={handleDeviceFormChange}
							placeholder='e.g., Carrier, Rheem'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Model *</FormLabel>
						<FormInput
							type='text'
							name='model'
							value={deviceFormData.model}
							onChange={handleDeviceFormChange}
							placeholder='e.g., AquaEdge, Prestige'
							required
						/>
					</FormGroup>

					<FormGroup>
						<FormLabel>Installation Date *</FormLabel>
						<FormInput
							type='date'
							name='installationDate'
							value={deviceFormData.installationDate}
							onChange={handleDeviceFormChange}
							required
						/>
					</FormGroup>
				</GenericModal>
			)}

			{/* Task Create/Edit Dialog */}
			<EditTaskModal
				isOpen={showTaskDialog}
				isEditing={Boolean(editingTaskId)}
				formData={taskFormData}
				onClose={() => setShowTaskDialog(false)}
				onSubmit={handleTaskFormSubmit}
				onChange={handleTaskFormChange}
				statusOptions={[
					'Pending',
					'In Progress',
					'Awaiting Approval',
					'Completed',
					'Rejected',
				]}
				priorityOptions={['Low', 'Medium', 'High', 'Urgent']}
				assigneeOptions={teamMembers
					.filter((member): member is TeamMember => member !== undefined)
					.map((member) => ({
						label:
							`${member.firstName || ''} ${member.lastName || ''} (${member.title || ''})`.trim(),
						value: member.id,
					}))}
			/>

			{/* Task Assignment Dialog */}
			{showTaskAssignDialog && (
				<GenericModal
					isOpen={showTaskAssignDialog}
					onClose={() => setShowTaskAssignDialog(false)}
					title='Assign Task to Team Member'
					onSubmit={(e) => {
						e.preventDefault();
						handleConfirmAssignment();
					}}
					primaryButtonLabel='Assign'
					primaryButtonDisabled={!selectedAssignee}
					secondaryButtonLabel='Cancel'>
					<FormGroup>
						<FormLabel>Assign To</FormLabel>
						<FormSelect
							value={selectedAssignee ? selectedAssignee.id : ''}
							onChange={(e) => {
								const selectedId = e.target.value;
								const filteredTeamMembers = teamMembers.filter(
									(m): m is TeamMember => m !== undefined,
								);
								let found =
									filteredTeamMembers.find((m) => m.id === selectedId) ||
									sharedUsers.find((u) => u.id === selectedId) ||
									(currentUser && currentUser.id === selectedId
										? currentUser
										: null);
								if (found) {
									// Safely construct the name property
									let name = '';
									if (
										'firstName' in found &&
										'lastName' in found &&
										found.firstName &&
										found.lastName
									) {
										name = `${found.firstName} ${found.lastName}`;
									} else if ('firstName' in found && found.firstName) {
										name = found.firstName;
									} else if (
										'name' in found &&
										typeof found.name === 'string' &&
										found.name
									) {
										name = found.name;
									} else if ('email' in found && found.email) {
										name = found.email;
									} else {
										name = found.id;
									}
									const assignedTo = {
										id: found.id,
										name,
										email: found.email || '',
									};
									setSelectedAssignee(assignedTo);
								} else {
									setSelectedAssignee(null);
								}
							}}>
							<option value=''>Select a user...</option>
							{/* Team members */}
							{teamMembers
								.filter((m): m is TeamMember => m !== undefined)
								.map((member) => (
									<option key={member.id} value={member.id}>
										{member.firstName} {member.lastName} ({member.title})
									</option>
								))}
							{/* Shared users */}
							{sharedUsers.map((user) => (
								<option key={user.id} value={user.id}>
									{user.firstName} {user.lastName} (Shared User)
								</option>
							))}
							{/* Current user (self) */}
							{currentUser && (
								<option key={currentUser.id} value={currentUser.id}>
									{currentUser.firstName} {currentUser.lastName} (You)
								</option>
							)}
						</FormSelect>
					</FormGroup>
				</GenericModal>
			)}

			{/* Convert Request to Task Modal */}
			{convertingRequest && (
				<ConvertRequestToTaskModal
					isOpen={showConvertModal}
					onClose={() => {
						setShowConvertModal(false);
						setConvertingRequest(null);
					}}
					onConvert={handleConvertToTask}
					request={convertingRequest}
					teamMembers={teamMembers.filter(
						(m): m is TeamMember => m !== undefined,
					)}
				/>
			)}

			{/* Share Property Modal */}
			{property && (
				<SharePropertyModal
					open={showShareModal}
					onClose={() => setShowShareModal(false)}
					propertyId={property.id}
					propertyTitle={property.title}
					ownerId={currentUser!.id}
					ownerEmail={currentUser!.email}
				/>
			)}

			{/* Add Tenant Modal */}
			{property && (
				<AddTenantModal
					open={showAddTenantModal}
					onClose={() => setShowAddTenantModal(false)}
					propertyId={property.id}
				/>
			)}

			{/* Delete Task Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={deleteTaskModalOpen}
				itemName={taskToDelete?.title || ''}
				itemType='task'
				onConfirm={() => {
					confirmDeleteTask();
					setDeleteTaskModalOpen(false);
					setTaskToDelete(null);
				}}
				onCancel={() => {
					setDeleteTaskModalOpen(false);
					setTaskToDelete(null);
				}}
			/>

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

			<style>{`
				.desktop-actions {
					display: flex;
					gap: 12px;
				}

				.mobile-action-menu {
					display: none !important;
				}

				@media (max-width: 480px) {
					.desktop-actions {
						display: none !important;
					}

					.mobile-action-menu {
						display: block !important;
					}
				}
			`}</style>
		</Wrapper>
	);
};
