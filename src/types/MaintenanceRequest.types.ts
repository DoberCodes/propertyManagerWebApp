import { TaskData } from './Task.types';

/**
 * Maintenance Request-related types for the application
 * Centralized domain-specific type definitions
 */

export interface MaintenanceRequestItem {
	id: string;
	propertyId: string;
	propertyTitle: string;
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Emergency' | 'Urgent';
	status:
		| 'Pending'
		| 'In Progress'
		| 'Completed'
		| 'Cancelled'
		| 'Converted to Task';
	requestedBy: string;
	requestedByEmail: string;
	requestedDate: string;
	assignedTo?: string;
	completedDate?: string;
	notes?: string;
	images?: string[];
	submittedBy?: string;
	submittedByName?: string;
	submittedAt?: string;
	category?: string;
	unit?: string;
	suite?: string;
	files?: Array<{ name: string; url: string; size: number; type: string }>;
	convertedToTaskId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface MaintenanceRequest {
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Urgent';
	category: string;
	files?: File[];
}

export type MaintenanceRequestPriority =
	| 'Low'
	| 'Medium'
	| 'High'
	| 'Emergency'
	| 'Urgent';

export type MaintenanceRequestStatus =
	| 'Pending'
	| 'In Progress'
	| 'Completed'
	| 'Cancelled'
	| 'Converted to Task';

export interface MaintenanceRequestHandlers {
	showMaintenanceRequestModal: boolean;
	setShowMaintenanceRequestModal: (show: boolean) => void;
	showConvertModal: boolean;
	setShowConvertModal: (show: boolean) => void;
	convertingRequest: MaintenanceRequestItem | null;
	setConvertingRequest: (request: MaintenanceRequestItem | null) => void;
	handleMaintenanceRequestSubmit: (request: MaintenanceRequest) => void;
	handleConvertRequestToTask: (requestId: string) => void;
	handleConvertToTask: (taskData: TaskData) => Promise<void>;
}
