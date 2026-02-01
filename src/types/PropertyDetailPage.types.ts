/**
 * PropertyDetailPage component-specific types
 * Centralized type definitions for PropertyDetailPage ecosystem
 */

import { Property } from './Property.types';

// Main component props
export interface PropertyDetailPageProps {
	homeownerMode?: boolean;
	property?: any;
}

// Property Edit Handlers
export interface PropertyEditHandlers {
	isEditMode: boolean;
	setIsEditMode: (mode: boolean) => void;
	editedProperty: any;
	setEditedProperty: (property: any) => void;
	isEditingTitle: boolean;
	setIsEditingTitle: (editing: boolean) => void;
	editedTitle: string;
	setEditedTitle: (title: string) => void;
	isUploadingImage: boolean;
	setIsUploadingImage: (uploading: boolean) => void;
	imageError: string | null;
	setImageError: (error: string | null) => void;
	deviceFormData: any;
	setDeviceFormData: (data: any) => void;
	showDeviceDialog: boolean;
	setShowDeviceDialog: (show: boolean) => void;
	handlePropertyFieldChange: (field: string, value: string) => void;
	handleDeviceFormChange: (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => void;
	handleDeviceFormSubmit: (e: React.FormEvent) => void;
	handleTitleEdit: () => void;
	handleTitleSave: () => void;
}

// Tab component props
export interface DetailsTabProps {
	isEditMode: boolean;
	setIsEditMode: (value: boolean) => void;
	property: Property;
	getPropertyFieldValue: (field: string) => any;
	handlePropertyFieldChange: (field: string, value: any) => void;
}

export interface TasksTabProps {
	propertyTasks: any[];
	selectedTasks: string[];
	setSelectedTasks: (tasks: string[]) => void;
	handleTaskCheckbox: (taskId: string) => void;
	handleCreateTask: () => void;
	handleEditTask: () => void;
	handleAssignTask: () => void;
	handleCompleteTask: () => void;
	handleDeleteTask: () => void;
}

export interface MaintenanceTabProps {
	property: any;
}

export interface TenantsTabProps {
	property: any;
	currentUser: any;
	setShowAddTenantModal: (show: boolean) => void;
}

export interface UnitsTabProps {
	property: any;
}

export interface SuitesTabProps {
	property: any;
}

export interface RequestsTabProps {
	propertyMaintenanceRequests: any[];
	currentUser: any;
	canApproveMaintenanceRequest: (role: any) => boolean;
	handleConvertRequestToTask: (requestId: string) => void;
}

// Property Detail Section Props
export interface PropertyDetailSectionProps {
	isEditMode: boolean;
	property: Property;
	getPropertyFieldValue: (field: string) => any;
	handlePropertyFieldChange: (field: string, value: any) => void;
}

// Modal-related types (re-exported for convenience)
export type { MaintenanceRequest } from './MaintenanceRequest.types';
export type { TaskData } from './Task.types';
