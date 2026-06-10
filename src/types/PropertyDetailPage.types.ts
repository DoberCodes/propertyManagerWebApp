/**
 * PropertyDetailPage component-specific types
 * Centralized type definitions for PropertyDetailPage ecosystem
 */

import { Property } from './Property.types';
import { TaskFinancials } from './Task.types';
import { RoleCapabilities } from '../utils/permissions';

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
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => void;
	handleDeviceFormSubmit: (e: React.FormEvent) => void;
	handleTitleEdit: (
		setShowPropertyDialog: React.Dispatch<React.SetStateAction<boolean>>,
	) => void;
	handleTitleSave: () => void;
}

// Tab component props
export interface DetailsTabProps {
	property: Property;
	teamMembers: any[];
	propertyTasks?: any[];
	maintenanceHistoryRecords?: any[];
	onCreateTask?: () => void;
	onCreateDevice?: () => void;
	onCreateRequest?: () => void;
	permissions?: RoleCapabilities;
}

export interface TasksTabProps {
	propertyTasks: any[];
	property: any;
	currentUser?: any;
	assigneeOptions?: { label: string; value: string; email?: string }[];
	unitOptions?: { label: string; value: string }[];
	selectedUnitId?: string;
	onSelectUnit?: (unitId: string) => void;
	openCreateTaskToken?: number;
	permissions?: RoleCapabilities;
}

export interface MaintenanceTabProps {
	property: any;
	maintenanceHistoryRecords?: any[];
	units?: any[];
	teamMembers?: any[];
	contractors?: any[];
	familyMembers?: any[];
	sharedUsers?: any[];
	tasks?: any[];
	onAddMaintenanceHistory?: (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		completionFile?: File;
		recurringTaskId?: string;
		linkedTaskIds?: string[];
		financials?: TaskFinancials;
	}) => void;
	onUpdateMaintenanceHistory?: (id: string, updates: Partial<any>) => void;
	onDeleteMaintenanceHistory?: (historyId: string) => void;
	permissions?: RoleCapabilities;
}

export interface TenantsTabProps {
	property: any;
	currentUser: any;
	unitOptions?: { label: string; value: string }[];
	selectedUnitId?: string;
	onSelectUnit?: (unitId: string) => void;
	setShowAddTenantModal: (show: boolean) => void;
	onEditTenant: (tenant: any) => void;
	onDeleteTenant: (tenant: any) => void;
	onViewTenantPromo: (tenant: any) => void;
	permissions?: RoleCapabilities;
}

export interface UnitsTabProps {
	property: any;
	units: any[];
	handleCreateUnit: () => void;
	handleDeleteUnit: (unitId: string) => void;
}

export interface SuitesTabProps {
	property: any;
}

export interface RequestsTabProps {
	propertyMaintenanceRequests: any[];
	currentUser: any;
	unitOptions?: { label: string; value: string }[];
	selectedUnitId?: string;
	onSelectUnit?: (unitId: string) => void;
	canApproveMaintenanceRequest: (role: any) => boolean;
	handleConvertRequestToTask: (requestId: string) => void;
	onCreateTask?: () => void;
	permissions?: RoleCapabilities;
}

// Property Detail Section Props
export interface PropertyDetailSectionProps {
	property: Property;
	teamMembers: any[];
}

// Modal-related types (re-exported for convenience)
export type { MaintenanceRequest } from './MaintenanceRequest.types';
export type { TaskData } from './Task.types';
