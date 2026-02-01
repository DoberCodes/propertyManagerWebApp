import { MaintenanceRequestItem } from '../../Redux/Slices/maintenanceRequestsSlice';

/**
 * Get device name from device ID
 * Supports both old static structure and new Firebase structure
 */
export const getDeviceNameUtil = (
	deviceId: number | string | undefined,
	property: any,
): string => {
	if (!property || !deviceId) return '-';
	const device = (property as any).devices?.find((d: any) => d.id === deviceId);
	return device ? `${device.type} - ${device.brand}` : '-';
};

/**
 * Get property field value, preferring edited version if in edit mode
 */
export const getPropertyFieldValueUtil = (
	field: string,
	property: any,
	editedProperty: any,
	isEditMode: boolean,
): string => {
	if (isEditMode && field in editedProperty) {
		return editedProperty[field];
	}
	return (property as any)?.[field] || '';
};

/**
 * Create a new maintenance request object
 */
export const createMaintenanceRequestUtil = (
	request: any,
	property: any,
	currentUser: any,
): MaintenanceRequestItem => {
	return {
		id: `req-${Date.now()}`,
		title: request.title,
		description: request.description,
		priority: request.priority,
		category: request.category,
		status: 'Pending' as const,
		propertyId: property.id,
		propertyTitle: property.title,
		requestedBy: currentUser.id,
		requestedByEmail: currentUser.email,
		requestedDate: new Date().toISOString(),
		submittedBy: currentUser.id,
		submittedByName: `${currentUser.firstName} ${currentUser.lastName}`,
		images: request.files?.map((file: File) => URL.createObjectURL(file)),
	};
};

/**
 * Format a date to locale string
 */
export const formatDateUtil = (dateString?: string): string => {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString();
};

/**
 * Get priority color based on priority level
 */
export const getPriorityColorUtil = (priority: string): string => {
	switch (priority) {
		case 'Urgent':
			return '#e74c3c';
		case 'High':
			return '#f39c12';
		case 'Medium':
			return '#3498db';
		default:
			return '#95a5a6';
	}
};

/**
 * Get status for display based on request status
 */
export const getRequestStatusUtil = (
	status: string,
): 'Pending' | 'Completed' | 'In Progress' => {
	if (status === 'Pending') return 'Pending';
	if (status === 'Converted to Task') return 'Completed';
	return 'In Progress';
};
