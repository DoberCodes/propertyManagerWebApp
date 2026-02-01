import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreateNotificationMutation } from '../../Redux/API/apiSlice';
import {
	addMaintenanceRequest,
	convertRequestToTask,
	MaintenanceRequestItem,
} from '../../Redux/Slices/maintenanceRequestsSlice';
import { AppDispatch } from '../../Redux/Store/store';
import {
	MaintenanceRequestHandlers,
	MaintenanceRequest,
} from '../../types/MaintenanceRequest.types';
import { TaskData } from '../../types/Task.types';
import { createMaintenanceRequestUtil } from './PropertyDetailPage.utils';

export const useMaintenanceRequestHandlers = (
	property: any,
	currentUser: any,
): MaintenanceRequestHandlers => {
	const dispatch = useDispatch<AppDispatch>();
	const [createNotification] = useCreateNotificationMutation();
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		useState(false);
	const [showConvertModal, setShowConvertModal] = useState(false);
	const [convertingRequest, setConvertingRequest] =
		useState<MaintenanceRequestItem | null>(null);

	const handleMaintenanceRequestSubmit = (request: MaintenanceRequest) => {
		if (!property || !currentUser) return;

		const newRequest = createMaintenanceRequestUtil(
			request,
			property,
			currentUser,
		);
		dispatch(addMaintenanceRequest(newRequest));

		// Create notification for maintenance request submission
		try {
			createNotification({
				userId: currentUser.id,
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

		setShowMaintenanceRequestModal(false);
		alert('Maintenance request submitted successfully!');
	};

	const handleConvertRequestToTask = (requestId: string) => {
		const request = (property as any).maintenanceRequests?.find(
			(r: any) => r.id === requestId,
		);
		if (request) {
			setConvertingRequest(request);
			setShowConvertModal(true);
		}
	};

	const handleConvertToTask = async (taskData: TaskData) => {
		if (!convertingRequest || !property || !currentUser) return;

		const newTask = {
			id: `task-${Date.now()}`,
			title: taskData.title,
			description: convertingRequest.description,
			priority: convertingRequest.priority,
			dueDate: taskData.dueDate,
			status: 'Pending' as const,
			propertyId: property.id,
			property: property.title,
			assignee: taskData.assignee,
			notes: taskData.notes,
			createdBy: currentUser.id,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		try {
			dispatch(convertRequestToTask(convertingRequest.id));

			// Create notification for conversion
			await createNotification({
				userId: currentUser.id,
				type: 'maintenance_request_created',
				title: 'Request Converted to Task',
				message: `Maintenance request "${convertingRequest.title}" has been converted to a task`,
				data: {
					requestId: convertingRequest.id,
					taskId: newTask.id,
					propertyId: property.id,
				},
				status: 'unread',
				actionUrl: `/properties/${property.id}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}).unwrap();

			setShowConvertModal(false);
			setConvertingRequest(null);
			alert('Maintenance request converted to task successfully!');
		} catch (error) {
			console.error('Error converting request:', error);
			alert('Failed to convert maintenance request to task');
		}
	};

	return {
		showMaintenanceRequestModal,
		setShowMaintenanceRequestModal,
		showConvertModal,
		setShowConvertModal,
		convertingRequest,
		setConvertingRequest,
		handleMaintenanceRequestSubmit,
		handleConvertRequestToTask,
		handleConvertToTask,
	};
};
