import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	addMaintenanceRequest,
	convertRequestToTask,
	MaintenanceRequestItem,
} from '../../Redux/Slices/maintenanceRequestsSlice';
import { AppDispatch } from '../../Redux/store/store';
import {
	MaintenanceRequestHandlers,
	MaintenanceRequest,
} from '../../types/MaintenanceRequest.types';
import { TaskData } from '../../types/Task.types';
import { createMaintenanceRequestUtil } from './PropertyDetailPage.utils';
import { uploadMaintenanceRequestFiles } from '../../utils/maintenanceRequestUpload';
import { useAppFeedback } from '../../Components/Library/AppFeedback/AppFeedbackProvider';

export const useMaintenanceRequestHandlers = (
	property: any,
	currentUser: any,
): MaintenanceRequestHandlers => {
	const dispatch = useDispatch<AppDispatch>();
	const feedback = useAppFeedback();
	const [showMaintenanceRequestModal, setShowMaintenanceRequestModal] =
		useState(false);
	const [showConvertModal, setShowConvertModal] = useState(false);
	const [convertingRequest, setConvertingRequest] =
		useState<MaintenanceRequestItem | null>(null);

	const handleMaintenanceRequestSubmit = async (
		request: MaintenanceRequest,
	) => {
		if (!property || !currentUser) return;
		let newRequest: MaintenanceRequestItem | null = null;

		try {
			const rawFiles = (request.files || []).filter(
				(file): file is File => file instanceof File,
			);
			const uploadedFiles = await uploadMaintenanceRequestFiles(
				rawFiles,
				property.id,
			);
			newRequest = createMaintenanceRequestUtil(
				{
					...request,
					files: uploadedFiles,
				},
				property,
				currentUser,
			);
			dispatch(addMaintenanceRequest(newRequest));
		} catch (error) {
			console.error('Failed to upload maintenance request files:', error);
			feedback.notify('Failed to upload files. Please try again.');
			return;
		}

		if (!newRequest) {
			return;
		}

		// Create notification for maintenance request submission
		try {
			dispatch({
				type: 'maintenance_request_created',
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
			});
		} catch (error) {
			console.error('Error creating notification:', error);
		}

		feedback.notify('Maintenance request submitted successfully!');
		setShowMaintenanceRequestModal(false);
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

	const handleConvertToTask = async (_taskData: TaskData) => {
		if (!convertingRequest || !property || !currentUser) return;

		try {
			dispatch(convertRequestToTask(convertingRequest.id));

			setShowConvertModal(false);
			setConvertingRequest(null);
			feedback.notify('Maintenance request converted to task successfully!');
		} catch (error) {
			console.error('Error converting request:', error);
			feedback.notify('Failed to convert maintenance request to task');
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
