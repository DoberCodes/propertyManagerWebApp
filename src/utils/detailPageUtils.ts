/**
 * Shared utility functions for detail pages (Property, Unit, Suite)
 * Generic utilities that work for any entity type
 */

import { MaintenanceRequestItem } from '../types/MaintenanceRequest.types';
import { Property } from '../types/Property.types';
import { Task } from '../types/Task.types';

const normalizeRequestFiles = (
	files?: Array<
		File | { name: string; url: string; size: number; type: string }
	>,
) => {
	if (!files || files.length === 0) {
		return { files: undefined, images: undefined };
	}

	const normalizedFiles = files.map((file) => {
		if ('url' in file) {
			return file;
		}
		return {
			name: file.name,
			url: URL.createObjectURL(file),
			size: file.size,
			type: file.type,
		};
	});

	const images = normalizedFiles
		.filter((file) => file.type?.startsWith('image/'))
		.map((file) => file.url);

	return {
		files: normalizedFiles,
		images: images.length > 0 ? images : undefined,
	};
};

export const createMaintenanceRequestId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `req-${crypto.randomUUID()}`;
	}

	return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Get device name from device ID
 * Works for any entity (property/unit/suite) with devices
 */
export const getDeviceName = (
	deviceId: number | string | undefined,
	entity: any,
): string => {
	if (!entity || !deviceId) return '-';
	const device = entity.devices?.find(
		(d: any) => String(d.id) === String(deviceId),
	);
	return device ? `${device.type} - ${device.brand}` : '-';
};

/**
 * Get device names from array of device IDs
 * Returns a comma-separated string of device names
 */
export const getDeviceNames = (
	deviceIds: string[] | undefined,
	entity: any,
): string => {
	if (!deviceIds || deviceIds.length === 0) return '-';
	const names = deviceIds
		.map((id) => getDeviceName(id, entity))
		.filter((name) => name !== '-');
	return names.length > 0 ? names.join(', ') : '-';
};

/**
 * Get entity field value, preferring edited version if in edit mode
 * Generic for any entity type
 */
export const getFieldValue = (
	field: string,
	entity: any,
	editedEntity: any,
	isEditMode: boolean,
): string => {
	if (isEditMode && field in editedEntity) {
		return editedEntity[field];
	}
	return entity?.[field] || '';
};

/**
 * Create a new maintenance request object
 */
export const createMaintenanceRequest = (
	request: any,
	property: Property,
	currentUser: any,
	entityType?: 'unit' | 'suite',
	entityName?: string,
): MaintenanceRequestItem => {
	const { files, images } = normalizeRequestFiles(request.files);
	return {
		id: createMaintenanceRequestId(),
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
		submittedAt: new Date().toISOString(),
		images,
		files,
		unit: entityType === 'unit' ? entityName : undefined,
		suite: entityType === 'suite' ? entityName : undefined,
	};
};

/**
 * Format a date to locale string
 */
export const formatDate = (dateString?: string): string => {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString();
};

/**
 * Get priority color based on priority level
 */
export const getPriorityColor = (priority: string): string => {
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
export const getRequestStatus = (
	status: string,
): 'Pending' | 'Completed' | 'In Progress' => {
	if (status === 'Pending') return 'Pending';
	if (status === 'Converted to Task') return 'Completed';
	return 'In Progress';
};

/**
 * Filter tasks for a specific entity
 */
export const filterTasksForEntity = (
	allTasks: Task[],
	property: Property | null,
	entityId?: string,
	entityType?: 'unit' | 'suite',
): Task[] => {
	if (!property) return [];

	return allTasks.filter((task) => {
		const matchesProperty =
			task.property === property.title ||
			(task as any).propertyId === property.id;
		if (!entityId || !entityType) return matchesProperty;

		if (entityType === 'unit') {
			return matchesProperty && (task as any).unitId === entityId;
		}
		if (entityType === 'suite') {
			return matchesProperty && (task as any).suiteId === entityId;
		}
		return matchesProperty;
	});
};

/**
 * Filter maintenance history for a specific entity
 */
export const filterMaintenanceHistory = (
	property: Property | null,
	entityName?: string,
	entityType?: 'unit' | 'suite',
): any[] => {
	if (!property) return [];
	const history = (property as any).taskHistory || [];

	if (!entityName || !entityType) return history;

	return history.filter((record: any) => {
		if (entityType === 'unit') return record.unit === entityName;
		if (entityType === 'suite') return record.suite === entityName;
		return true;
	});
};

/**
 * Filter maintenance requests for a specific entity
 */
export const filterMaintenanceRequests = (
	allRequests: MaintenanceRequestItem[],
	property: Property | null,
	entityName?: string,
	entityType?: 'unit' | 'suite',
): MaintenanceRequestItem[] => {
	if (!property) return [];

	return allRequests.filter((req) => {
		const matchesProperty = req.propertyId === property.id;
		if (!entityName || !entityType) return matchesProperty;

		if (entityType === 'unit') {
			return matchesProperty && req.unit === entityName;
		}
		if (entityType === 'suite') {
			return matchesProperty && req.suite === entityName;
		}
		return matchesProperty;
	});
};

/**
 * Get assignee display name from task
 */
export const getAssigneeName = (task: Task) => {
	// Check new assignedTo object format first
	return task.assignedTo?.name;
};
