import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowLeft,
	faEllipsisV,
	faCamera,
} from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../Redux/Store/store';
import {
	useGetTasksQuery,
	useGetTeamMembersQuery,
	useUpdateTaskMutation,
	useCreateTaskMutation,
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
	useCreateNotificationMutation,
	useGetPropertySharesQuery,
} from '../../Redux/API/apiSlice';
import {
	addTask,
	updateTask,
	deleteTask,
} from '../../Redux/Slices/propertyDataSlice';
import {
	addMaintenanceRequest,
	convertRequestToTask,
	MaintenanceRequestItem,
} from '../../Redux/Slices/maintenanceRequestsSlice';
import {
	canApproveMaintenanceRequest,
	isTenant,
} from '../../utils/permissions';
import { UserRole } from '../../constants/roles';
import { TeamMember } from '../../Redux/Slices/teamSlice';
import { useFavorites } from '../../Hooks/useFavorites';
import { uploadToBase64, isValidImageFile } from '../../utils/base64Upload';
import { TaskCompletionModal } from '../../Components/Library/TaskCompletionModal';
import {
	MaintenanceRequestModal,
	MaintenanceRequest,
} from '../../Components/Library/MaintenanceRequestModal';
import {
	ConvertRequestToTaskModal,
	TaskData,
} from '../../Components/Library/ConvertRequestToTaskModal';
import { SharePropertyModal } from '../../Components/Library/SharePropertyModal';
import { AddTenantModal } from '../../Components/Library/AddTenantModal';
import Tabs from '../../Components/Library/Tabs/Tabs';
import {
	Wrapper,
	Header,
	HeaderContent,
	PropertyTitle,
	FavoriteButton,
	BackButton,
	TabContent,
	Toolbar,
	ToolbarButton,
	GridContainer,
	GridTable,
	InfoCard,
	InfoLabel,
	InfoValue,
	SectionHeader,
	SectionContainer,
	AddButton,
	DevicesGrid,
	DeviceCard,
	DeviceField,
	TaskStatus,
	EmptyState,
	TitleContainer,
	EditableTitleInput,
	PencilIcon,
	TabControlsContainer,
	TaskCheckbox,
	DialogOverlay,
	DialogContent,
	DialogHeader,
	DialogForm,
	FormGroup,
	FormLabel,
	FormInput,
	FormSelect,
	FormTextarea,
	DialogButtonGroup,
	DialogCancelButton,
	DialogSubmitButton,
	MinimalEditButton,
	EditableFieldInput,
	DetailsEditHeader,
	DevicesSectionHeader,
	AddDeviceButton,
} from './PropertyDetailPage.styles';
import { PropertyDetailSection } from './PropertyDetailSection';

interface PropertyDetailPageProps {
	homeownerMode?: boolean;
	property?: any;
}

export const PropertyDetailPage = (props: PropertyDetailPageProps) => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();

	// Get current user
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const { isFavorite, toggleFavorite } = useFavorites(currentUser!.id);

	// Fetch properties from Firebase
	const { data: firebaseProperties = [], isLoading: propertiesLoading } =
		useGetPropertiesQuery();

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
	const { data: allTasks = [], isLoading: tasksLoading } = useGetTasksQuery();

	// Firebase mutations for updating tasks and properties
	const [updateTaskMutation] = useUpdateTaskMutation();
	const [createTaskMutation] = useCreateTaskMutation();
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
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editedTitle, setEditedTitle] = useState('');
	const [isEditMode, setIsEditMode] = useState(false);
	const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
	const [editedProperty, setEditedProperty] = useState<any>({});
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [showTaskDialog, setShowTaskDialog] = useState(false);
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
	const [showTaskAssignDialog, setShowTaskAssignDialog] = useState(false);
	const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
	const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
	const propertyOverride = props.property;

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
	const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
	const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
	const [showShareModal, setShowShareModal] = useState(false);
	const [showAddTenantModal, setShowAddTenantModal] = useState(false);
	const [taskFormData, setTaskFormData] = useState({
		title: '',
		dueDate: '',
		status: 'Pending' as const,
		notes: '',
	});
	const [showDeviceDialog, setShowDeviceDialog] = useState(false);
	const [deviceFormData, setDeviceFormData] = useState({
		type: '',
		brand: '',
		model: '',
		installationDate: '',
	});
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		useState(false);
	const [showConvertModal, setShowConvertModal] = useState(false);
	const [convertingRequest, setConvertingRequest] =
		useState<MaintenanceRequestItem | null>(null);

	// Find the property based on slug from Firebase data
	const property = useMemo(() => {
		return propertyOverride
			? propertyOverride
			: firebaseProperties.find((p: any) => p.slug === slug);
	}, [slug, firebaseProperties]);

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
		return allTasks.filter(
			(task) =>
				task.propertyId === property.id || task.property === property.title,
		);
	}, [property, allTasks]);

	// Helper functions
	const handleTitleEdit = () => {
		setIsEditingTitle(true);
		setEditedTitle(property?.title || '');
	};

	const handleTitleSave = () => {
		// In a real app, this would update via API
		// For now, we'll just close the edit mode
		setIsEditingTitle(false);
		// You could update the property here via an API call
	};

	const handleImageUrlChange = async (url: string) => {
		if (!property) return;
		setImageError(null);
		setIsUploadingImage(true);

		try {
			// Update property with new image URL
			await updatePropertyMutation({
				id: property.id,
				updates: {
					image: url || undefined,
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
				error instanceof Error ? error.message : 'Failed to update image';
			setImageError(errorMessage);
			setIsUploadingImage(false);
		}
	};

	const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && property) {
			if (!isValidImageFile(file)) {
				setImageError('Invalid file. Please upload an image under 700KB.');
				return;
			}

			setImageError(null);
			setIsUploadingImage(true);

			try {
				const imageUrl = await uploadToBase64(file);
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

	const handleTaskCheckbox = (taskId: string) => {
		setSelectedTasks((prev) =>
			prev.includes(taskId)
				? prev.filter((id) => id !== taskId)
				: [...prev, taskId],
		);
	};

	const handleCreateTask = () => {
		setEditingTaskId(null);
		setTaskFormData({
			title: '',
			dueDate: '',
			status: 'Pending',
			notes: '',
		});
		setShowTaskDialog(true);
	};

	const handleEditTask = () => {
		if (selectedTasks.length === 1) {
			const taskToEdit = propertyTasks.find((t) => t.id === selectedTasks[0]);
			if (taskToEdit) {
				setEditingTaskId(taskToEdit.id);
				setTaskFormData({
					title: taskToEdit.title,
					dueDate: taskToEdit.dueDate,
					status: taskToEdit.status as any,
					notes: '',
				});
				setShowTaskDialog(true);
			}
		}
	};

	const handleDeleteTask = () => {
		if (selectedTasks.length > 0) {
			selectedTasks.forEach(async (taskId) => {
				try {
					const taskToDelete = allTasks.find((t) => t.id === taskId);
					dispatch(deleteTask(taskId));

					// Create notification for task deletion
					if (taskToDelete) {
						try {
							await createNotification({
								userId: currentUser!.id,
								type: 'task_deleted',
								title: 'Task Deleted',
								message: `Task "${taskToDelete.title}" has been deleted`,
								data: {
									taskId: taskId,
									taskTitle: taskToDelete.title,
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
					}
				} catch (error) {
					console.error('Error deleting task:', error);
				}
			});
			setSelectedTasks([]);
		}
	};

	const handleAssignTask = () => {
		if (selectedTasks.length === 1) {
			setAssigningTaskId(selectedTasks[0]);
			setSelectedAssignee(null);
			setShowTaskAssignDialog(true);
		}
	};

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
				setAssigningTaskId(null);
				setSelectedAssignee(null);
				setSelectedTasks([]);
			} catch (error) {
				console.error('Error assigning task:', error);
			}
		}
	};

	const handleCompleteTask = () => {
		if (selectedTasks.length === 1) {
			setCompletingTaskId(selectedTasks[0]);
			setShowTaskCompletionModal(true);
		}
	};

	const handleTaskCompletionSuccess = () => {
		setShowTaskCompletionModal(false);
		setCompletingTaskId(null);
		setSelectedTasks([]);
	};

	const handlePropertyFieldChange = (field: string, value: string) => {
		setEditedProperty((prev: any) => ({
			...prev,
			[field]: value,
		}));
	};

	const getPropertyFieldValue = (field: string) => {
		if (isEditMode && field in editedProperty) {
			return editedProperty[field];
		}
		return (property as any)?.[field] || '';
	};

	const handleDeviceFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setDeviceFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleDeviceFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// In a real app, this would add to the property's devices via API
		setShowDeviceDialog(false);
	};

	const handleMaintenanceRequestSubmit = (request: MaintenanceRequest) => {
		if (!property) return;

		// Find tenant's unit if they are a tenant
		// Handle both old static structure (property.tenants) and new Firebase structure (units.occupants)
		const tenantInfo = (property as any).tenants?.find(
			(t: any) => t.email === currentUser!.email,
		);

		const newRequest = {
			id: `req-${Date.now()}`,
			title: request.title,
			description: request.description,
			priority: request.priority,
			category: request.category,
			status: 'Pending' as const,
			propertyId: property.id,
			propertyTitle: property.title,
			requestedBy: currentUser!.id,
			requestedByEmail: currentUser!.email,
			requestedDate: new Date().toISOString(),
			submittedBy: currentUser!.id,
			submittedByName: `${currentUser!.firstName} ${currentUser!.lastName}`,
			submittedAt: new Date().toISOString(),
			unit: tenantInfo?.unit, // Include unit for apartment buildings
			files: request.files?.map((file) => ({
				name: file.name,
				url: URL.createObjectURL(file), // In real app, upload to server
				size: file.size,
				type: file.type,
			})),
		};

		dispatch(addMaintenanceRequest(newRequest));

		// Create notification for maintenance request submission
		try {
			createNotification({
				userId: currentUser!.id,
				type: 'maintenance_request_created',
				title: 'Maintenance Request Submitted',
				message: `Maintenance request "${request.title}" has been submitted for "${property.title}"`,
				data: {
					requestId: newRequest.id,
					requestTitle: request.title,
					propertyId: property.id,
					propertyTitle: property.title,
					priority: request.priority,
				},
				status: 'unread',
				actionUrl: `/properties/${property.id}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})
				.unwrap()
				.catch((notifError: any) => {
					console.error('Notification failed:', notifError);
				});
		} catch (error) {
			console.error('Error creating notification:', error);
		}

		alert('Maintenance request submitted successfully!');
	};

	const handleConvertRequestToTask = (requestId: string) => {
		const request = allMaintenanceRequests.find((r) => r.id === requestId);
		if (!request) return;

		// Open modal with request data
		setConvertingRequest(request);
		setShowConvertModal(true);
	};

	const handleConvertToTask = async (taskData: TaskData) => {
		if (!convertingRequest || !property) return;

		try {
			// Create a new task from the request with custom data
			const newTask = {
				userId: currentUser!.id,
				title: taskData.title,
				dueDate: taskData.dueDate,
				status: taskData.status,
				property: property.title,
				propertyId: property.id,
				unitId: convertingRequest.unit,
				suiteId: (convertingRequest as any).suite,
				notes: taskData.notes,
				assignedTo:
					taskData.assignee && typeof taskData.assignee === 'object'
						? taskData.assignee
						: undefined,
			};

			const result = await createTaskMutation(newTask).unwrap();
			dispatch(convertRequestToTask(convertingRequest.id));
			setShowConvertModal(false);
			setConvertingRequest(null);
		} catch (error) {
			console.error('Error converting request to task:', error);
			alert('Failed to convert request to task. Please try again.');
		}
	};

	const handleTaskFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!property || !taskFormData.title.trim()) return;

		try {
			if (editingTaskId !== null) {
				// Update existing task
				const taskToUpdate = allTasks.find((t) => t.id === editingTaskId);
				if (taskToUpdate) {
					await updateTaskMutation({
						id: editingTaskId,
						updates: {
							title: taskFormData.title,
							dueDate: taskFormData.dueDate,
							status: taskFormData.status,
						},
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
				const newTask = {
					userId: currentUser!.id,
					title: taskFormData.title,
					dueDate: taskFormData.dueDate,
					status: taskFormData.status,
					property: property.title,
					propertyId: property.id,
				};
				const result = await createTaskMutation(newTask).unwrap();

				// Create notification for task creation
				try {
					await createNotification({
						userId: currentUser!.id,
						type: 'task_created',
						title: 'Task Created',
						message: `New task "${taskFormData.title}" has been created`,
						data: {
							taskId: result.id,
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
			setEditingTaskId(null);
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

	const handleTaskFormChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;
		setTaskFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const getDeviceName = (deviceId?: number) => {
		if (!property || !deviceId) return '-';
		// Handle both old static structure (property.devices) and new Firebase structure (separate devices collection)
		const device = (property as any).devices?.find(
			(d: any) => d.id === deviceId,
		);
		return device ? `${device.type} - ${device.brand}` : '-';
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
				<TabContent>
					{/* Edit Mode Header */}
					<DetailsEditHeader>
						<SectionHeader>Property Information</SectionHeader>
						<MinimalEditButton
							onClick={() => setIsEditMode(!isEditMode)}
							title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}>
							✎
						</MinimalEditButton>
					</DetailsEditHeader>

					<PropertyDetailSection
						isEditMode={isEditMode}
						property={property}
						getPropertyFieldValue={getPropertyFieldValue}
						handlePropertyFieldChange={handlePropertyFieldChange}
					/>
					{/* Notes */}
					{property.notes && (
						<SectionContainer>
							<SectionHeader>Notes</SectionHeader>
							<InfoCard style={{ padding: '16px' }}>
								{isEditMode ? (
									<EditableFieldInput
										type='text'
										value={getPropertyFieldValue('notes')}
										onChange={(e) =>
											handlePropertyFieldChange('notes', e.target.value)
										}
										placeholder='Edit property notes'
										style={{ minHeight: '80px', padding: '12px' }}
										as='textarea'
									/>
								) : (
									<p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
										{getPropertyFieldValue('notes')}
									</p>
								)}
							</InfoCard>
						</SectionContainer>
					)}
				</TabContent>
			)}

			{/* Suites Tab */}
			{activeTab === 'suites' &&
				property?.propertyType === 'Commercial' &&
				property?.hasSuites && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Commercial Suites</SectionHeader>
							{property.suites && property.suites.length > 0 ? (
								<DevicesGrid>
									{property.suites.map((suite: any) => (
										<DeviceCard
											key={suite.name}
											onClick={() =>
												navigate(
													`/property/${property.slug}/suite/${encodeURIComponent(suite.name)}`,
												)
											}
											style={{
												padding: '16px',
												border: '1px solid #e5e7eb',
												borderRadius: '8px',
												backgroundColor: '#f9fafb',
												cursor: 'pointer',
												transition: 'all 0.3s ease',
											}}>
											<InfoLabel>{suite.name}</InfoLabel>
											<DeviceField>
												<InfoLabel>Tenants</InfoLabel>
												<InfoValue>
													{(suite.tenants?.length || 0) > 0
														? suite
																.tenants!.map(
																	(t: any) => `${t.firstName} ${t.lastName}`,
																)
																.join(', ')
														: 'None'}
												</InfoValue>
											</DeviceField>
											<DeviceField>
												<InfoLabel>Devices</InfoLabel>
												<InfoValue>
													{suite.devices?.length || 0} device(s)
												</InfoValue>
											</DeviceField>
										</DeviceCard>
									))}
								</DevicesGrid>
							) : (
								<EmptyState style={{ marginTop: '12px' }}>
									<p>No suites available</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

			{/* Tasks Tab */}
			{activeTab === 'tasks' && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>Associated Tasks</SectionHeader>
						<Toolbar>
							<ToolbarButton onClick={handleCreateTask}>
								+ Create Task
							</ToolbarButton>
							<ToolbarButton
								disabled={selectedTasks.length !== 1}
								onClick={handleEditTask}>
								Edit Task
							</ToolbarButton>
							<ToolbarButton
								disabled={selectedTasks.length !== 1}
								onClick={handleAssignTask}>
								Assign To
							</ToolbarButton>
							<ToolbarButton
								disabled={selectedTasks.length === 0}
								onClick={handleCompleteTask}
								style={{ backgroundColor: '#22c55e' }}>
								Mark as Complete
							</ToolbarButton>
							<ToolbarButton
								className='delete'
								disabled={selectedTasks.length === 0}
								onClick={handleDeleteTask}>
								Delete Task
							</ToolbarButton>
						</Toolbar>

						{propertyTasks.length > 0 ? (
							<GridContainer>
								<GridTable>
									<thead>
										<tr>
											<th style={{ width: '40px' }}>
												<TaskCheckbox
													onChange={() => {
														if (selectedTasks.length === propertyTasks.length) {
															setSelectedTasks([]);
														} else {
															setSelectedTasks(propertyTasks.map((t) => t.id));
														}
													}}
													checked={
														selectedTasks.length === propertyTasks.length
													}
												/>
											</th>
											<th>Task Name</th>
											<th>Assigned To</th>
											<th>Due Date</th>
											<th>Status</th>
											<th>Notes</th>
										</tr>
									</thead>
									<tbody>
										{propertyTasks.map((task) => (
											<tr
												key={task.id}
												style={{
													backgroundColor: selectedTasks.includes(task.id)
														? '#f0fdf4'
														: 'transparent',
												}}>
												<td>
													<TaskCheckbox
														checked={selectedTasks.includes(task.id)}
														onChange={() => handleTaskCheckbox(task.id)}
													/>
												</td>
												<td>
													<strong>{task.title}</strong>
												</td>
												<td>
													{task.assignedTo
														? task.assignedTo.name ||
															task.assignedTo.email ||
															task.assignedTo.id
														: 'Unassigned'}
												</td>
												<td>{task.dueDate}</td>
												<td>
													<TaskStatus status={task.status}>
														{task.status}
													</TaskStatus>
												</td>
												<td>{task.notes || '-'}</td>
											</tr>
										))}
									</tbody>
								</GridTable>
							</GridContainer>
						) : (
							<EmptyState>
								<p>No tasks associated with this property</p>
							</EmptyState>
						)}
					</SectionContainer>
				</TabContent>
			)}

			{/* Maintenance History Tab */}
			{activeTab === 'maintenance' && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>Maintenance History</SectionHeader>

						{property.maintenanceHistory &&
						property.maintenanceHistory.length > 0 ? (
							<GridContainer>
								<GridTable>
									<thead>
										<tr>
											<th>Date</th>
											<th>Task</th>
											<th>Device</th>
											<th>Assignee</th>
											<th>Files</th>
										</tr>
									</thead>
									<tbody>
										{property.maintenanceHistory.map((record, index) => (
											<tr key={index}>
												<td>{record.date}</td>
												<td>{record.description}</td>
												<td>{getDeviceName((record as any).deviceId)}</td>
												<td>-</td>
												<td>-</td>
											</tr>
										))}
									</tbody>
								</GridTable>
							</GridContainer>
						) : (
							<EmptyState>
								<p>No maintenance history for this property</p>
							</EmptyState>
						)}
					</SectionContainer>
				</TabContent>
			)}

			{/* Tenants Tab */}
			{activeTab === 'tenants' && !hasCommercialSuites && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>
							Property Tenants
							{currentUser && !isTenant(currentUser.role as UserRole) && (
								<AddButton onClick={() => setShowAddTenantModal(true)}>
									+ Add Tenant
								</AddButton>
							)}
						</SectionHeader>

						{(property as any).tenants &&
						(property as any).tenants.length > 0 ? (
							<GridContainer>
								<GridTable>
									<thead>
										<tr>
											<th>Name</th>
											<th>Unit</th>
											<th>Email</th>
											<th>Phone</th>
											<th>Lease Start</th>
											<th>Lease End</th>
										</tr>
									</thead>
									<tbody>
										{(property as any).tenants.map((tenant: any) => (
											<tr key={tenant.id}>
												<td>
													{tenant.firstName} {tenant.lastName}
												</td>
												<td>{tenant.unit || 'N/A'}</td>
												<td>{tenant.email}</td>
												<td>{tenant.phone}</td>
												<td>{tenant.leaseStart || 'N/A'}</td>
												<td>{tenant.leaseEnd || 'N/A'}</td>
											</tr>
										))}
									</tbody>
								</GridTable>
							</GridContainer>
						) : (
							<EmptyState>
								<p>No tenants assigned to this property</p>
							</EmptyState>
						)}
					</SectionContainer>
				</TabContent>
			)}

			{/* Units Tab */}
			{activeTab === 'units' && property?.propertyType === 'Multi-Family' && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>Units</SectionHeader>
						{property?.units && property.units.length > 0 ? (
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
									gap: '16px',
								}}>
								{property.units.map((unit: any) => (
									<div
										key={unit.name}
										onClick={() =>
											navigate(
												`/property/${property.slug}/unit/${encodeURIComponent(unit.name)}`,
											)
										}
										style={{
											padding: '16px',
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
											backgroundColor: '#f9fafb',
											cursor: 'pointer',
											transition: 'all 0.3s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.borderColor = '#22c55e';
											e.currentTarget.style.backgroundColor = '#f0fdf4';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.borderColor = '#e5e7eb';
											e.currentTarget.style.backgroundColor = '#f9fafb';
										}}>
										<h3
											style={{
												margin: '0 0 8px 0',
												color: '#1f2937',
												fontSize: '16px',
												fontWeight: '600',
											}}>
											{unit.name}
										</h3>
										<p
											style={{
												margin: '0',
												color: '#6b7280',
												fontSize: '14px',
											}}>
											Click to view unit details and tenants
										</p>
									</div>
								))}
							</div>
						) : (
							<EmptyState>
								<p>No units added to this property</p>
							</EmptyState>
						)}
					</SectionContainer>
				</TabContent>
			)}

			{/* Suites Tab */}
			{activeTab === 'suites' &&
				property?.propertyType === 'Commercial' &&
				property?.hasSuites && (
					<TabContent>
						<SectionContainer>
							<SectionHeader>Suites</SectionHeader>
							{property?.suites && property.suites.length > 0 ? (
								<div
									style={{
										display: 'grid',
										gridTemplateColumns:
											'repeat(auto-fill, minmax(250px, 1fr))',
										gap: '16px',
									}}>
									{property.suites.map((suite: any) => (
										<div
											key={suite.name}
											style={{
												padding: '16px',
												border: '1px solid #e5e7eb',
												borderRadius: '8px',
												backgroundColor: '#f9fafb',
												cursor: 'default',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.borderColor = '#22c55e';
												e.currentTarget.style.backgroundColor = '#f0fdf4';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.borderColor = '#e5e7eb';
												e.currentTarget.style.backgroundColor = '#f9fafb';
											}}>
											<h3
												style={{
													margin: '0 0 8px 0',
													color: '#1f2937',
													fontSize: '16px',
													fontWeight: '600',
												}}>
												{suite.name}
											</h3>
											<p
												style={{
													margin: '0',
													color: '#6b7280',
													fontSize: '14px',
												}}>
												Tenants: {(suite.tenants || []).length}
											</p>
										</div>
									))}
								</div>
							) : (
								<EmptyState>
									<p>No suites added to this property</p>
								</EmptyState>
							)}
						</SectionContainer>
					</TabContent>
				)}

			{/* Maintenance Requests Tab */}
			{activeTab === 'requests' && (
				<TabContent>
					<SectionContainer>
						<SectionHeader>Maintenance Requests</SectionHeader>

						{propertyMaintenanceRequests.length > 0 ? (
							<GridContainer>
								<GridTable>
									<thead>
										<tr>
											<th>Status</th>
											<th>Title</th>
											<th>Category</th>
											<th>Priority</th>
											<th>Submitted By</th>
											<th>Unit</th>
											<th>Date</th>
											<th>Action</th>
										</tr>
									</thead>
									<tbody>
										{propertyMaintenanceRequests.map((request) => (
											<tr key={request.id}>
												<td>
													<TaskStatus
														status={
															request.status === 'Pending'
																? 'Pending'
																: request.status === 'Converted to Task'
																	? 'Completed'
																	: 'In Progress'
														}>
														{request.status}
													</TaskStatus>
												</td>
												<td>
													<strong>{request.title}</strong>
													<br />
													<small
														style={{
															color: '#666',
															fontSize: '12px',
														}}>
														{request.description.substring(0, 80)}
														{request.description.length > 80 && '...'}
													</small>
												</td>
												<td>{request.category}</td>
												<td>
													<span
														style={{
															color:
																request.priority === 'Urgent'
																	? '#e74c3c'
																	: request.priority === 'High'
																		? '#f39c12'
																		: request.priority === 'Medium'
																			? '#3498db'
																			: '#95a5a6',
															fontWeight: 'bold',
														}}>
														{request.priority}
													</span>
												</td>
												<td>{request.submittedByName}</td>
												<td>
													{request.unit ? (
														<span
															style={{
																backgroundColor: '#e8f5e9',
																padding: '4px 8px',
																borderRadius: '4px',
																fontSize: '12px',
																fontWeight: '500',
																color: '#2e7d32',
															}}>
															{request.unit}
														</span>
													) : (
														<span style={{ color: '#999', fontSize: '12px' }}>
															N/A
														</span>
													)}
												</td>
												<td>
													{request.submittedAt
														? new Date(request.submittedAt).toLocaleDateString()
														: 'N/A'}
												</td>
												<td>
													{request.status === 'Pending' &&
														currentUser &&
														canApproveMaintenanceRequest(
															currentUser.role as UserRole,
														) && (
															<ToolbarButton
																onClick={() =>
																	handleConvertRequestToTask(request.id)
																}
																style={{
																	padding: '6px 12px',
																	fontSize: '13px',
																	backgroundColor: '#27ae60',
																}}>
																Convert to Task
															</ToolbarButton>
														)}
													{request.status === 'Converted to Task' && (
														<span
															style={{ color: '#27ae60', fontSize: '12px' }}>
															✓ Task #{request.convertedToTaskId}
														</span>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</GridTable>
							</GridContainer>
						) : (
							<EmptyState>
								<p>No maintenance requests for this property</p>
							</EmptyState>
						)}
					</SectionContainer>
				</TabContent>
			)}

			{/* Add Device Dialog */}
			{showDeviceDialog && (
				<DialogOverlay
					onClick={(e: React.MouseEvent<HTMLDivElement>) => {
						if (e.target === e.currentTarget) {
							setShowDeviceDialog(false);
						}
					}}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>Add New Household Device</DialogHeader>
						<DialogForm onSubmit={handleDeviceFormSubmit}>
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

							<DialogButtonGroup>
								<DialogCancelButton
									type='button'
									onClick={() => setShowDeviceDialog(false)}>
									Cancel
								</DialogCancelButton>
								<DialogSubmitButton type='submit'>
									Add Device
								</DialogSubmitButton>
							</DialogButtonGroup>
						</DialogForm>
					</DialogContent>
				</DialogOverlay>
			)}

			{/* Task Create/Edit Dialog */}
			{showTaskDialog && (
				<DialogOverlay
					onClick={(e: React.MouseEvent<HTMLDivElement>) => {
						if (e.target === e.currentTarget) {
							setShowTaskDialog(false);
						}
					}}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>
							{editingTaskId ? 'Edit Task' : 'Create New Task'}
						</DialogHeader>
						<DialogForm onSubmit={handleTaskFormSubmit}>
							<FormGroup>
								<FormLabel>Task Name *</FormLabel>
								<FormInput
									type='text'
									name='title'
									value={taskFormData.title}
									onChange={handleTaskFormChange}
									placeholder='Enter task name'
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Due Date *</FormLabel>
								<FormInput
									type='date'
									name='dueDate'
									value={taskFormData.dueDate}
									onChange={handleTaskFormChange}
									required
								/>
							</FormGroup>

							<FormGroup>
								<FormLabel>Status *</FormLabel>
								<FormSelect
									name='status'
									value={taskFormData.status}
									onChange={handleTaskFormChange}>
									<option value='Pending'>Pending</option>
									<option value='In Progress'>In Progress</option>
									<option value='Completed'>Completed</option>
								</FormSelect>
							</FormGroup>

							<FormGroup>
								<FormLabel>Notes</FormLabel>
								<FormTextarea
									name='notes'
									value={taskFormData.notes}
									onChange={handleTaskFormChange}
									placeholder='Add any notes about this task...'
								/>
							</FormGroup>

							<DialogButtonGroup>
								<DialogCancelButton
									type='button'
									onClick={() => setShowTaskDialog(false)}>
									Cancel
								</DialogCancelButton>
								<DialogSubmitButton type='submit'>
									{editingTaskId ? 'Update Task' : 'Create Task'}
								</DialogSubmitButton>
							</DialogButtonGroup>
						</DialogForm>
					</DialogContent>
				</DialogOverlay>
			)}

			{/* Task Assignment Dialog */}
			{showTaskAssignDialog && (
				<DialogOverlay onClick={() => setShowTaskAssignDialog(false)}>
					<DialogContent onClick={(e) => e.stopPropagation()}>
						<DialogHeader>
							<h3>Assign Task to Team Member</h3>
							<button
								onClick={() => setShowTaskAssignDialog(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '24px',
									cursor: 'pointer',
								}}>
								×
							</button>
						</DialogHeader>
						<DialogForm
							onSubmit={(e) => {
								e.preventDefault();
								handleConfirmAssignment();
							}}>
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

							<DialogButtonGroup>
								<DialogCancelButton
									type='button'
									onClick={() => setShowTaskAssignDialog(false)}>
									Cancel
								</DialogCancelButton>
								<DialogSubmitButton type='submit' disabled={!selectedAssignee}>
									Assign
								</DialogSubmitButton>
							</DialogButtonGroup>
						</DialogForm>
					</DialogContent>
				</DialogOverlay>
			)}

			{/* Task Completion Modal */}
			{showTaskCompletionModal && completingTaskId && (
				<TaskCompletionModal
					taskId={completingTaskId}
					taskTitle={
						propertyTasks.find((t) => t.id === completingTaskId)?.title || ''
					}
					onClose={() => setShowTaskCompletionModal(false)}
					onSuccess={handleTaskCompletionSuccess}
				/>
			)}

			{/* Maintenance Request Modal */}
			<MaintenanceRequestModal
				isOpen={showMaintenanceRequestModal}
				onClose={() => setShowMaintenanceRequestModal(false)}
				onSubmit={handleMaintenanceRequestSubmit}
				propertyTitle={property.title}
			/>

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
