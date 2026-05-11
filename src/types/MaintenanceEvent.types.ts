import { TaskFinancials } from './Task.types';

export type MaintenanceEventType =
	| 'task_completed'
	| 'task_approved'
	| 'repair_logged'
	| 'inspection_completed'
	| 'invoice_uploaded'
	| 'document_uploaded'
	| 'service_note_added'
	| 'maintenance_recorded'
	| 'warranty_added'
	| 'contractor_visit_logged'
	| 'recurring_maintenance_completed';

export type MaintenanceEventSource =
	| 'task_completion'
	| 'task_approval'
	| 'manual_entry'
	| 'device_log'
	| 'system'
	| 'note_entry'
	| 'document_upload'
	| 'contractor_entry';

export interface MaintenanceEvent {
	id: string;
	accountId: string;
	propertyId: string;
	propertyTitle?: string;
	unitId?: string;
	deviceIds?: string[];
	title: string;
	completionDate: string;
	completionNotes?: string;
	completedBy?: string;
	completedByName?: string;
	completionFile?: {
		url: string;
		name: string;
		size: number;
		type: string;
		uploadedAt?: string;
	};
	financials?: TaskFinancials;
	linkedTaskIds?: string[];
	originalTaskId?: string;
	recurringTaskId?: string;
	maintenanceCycleId?: string;
	eventType: MaintenanceEventType;
	eventSource: MaintenanceEventSource;
	createdAt: string;
	updatedAt: string;
}
