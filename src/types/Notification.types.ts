import { SharePermission } from '../constants/roles';

export interface Notification {
	id: string;
	userId: string; // Recipient of the notification
	type:
		| 'share_invitation'
		| 'share_invitation_accepted'
		| 'property_added'
		| 'property_updated'
		| 'property_deleted'
		| 'property_group_created'
		| 'property_group_updated'
		| 'property_group_deleted'
		| 'task_created'
		| 'task_assigned'
		| 'task_updated'
		| 'task_deleted'
		| 'task_completed'
		| 'task_reminder'
		| 'task_due_today'
		| 'task_overdue'
		| 'task_unassigned_critical'
		| 'task_approval_required'
		| 'task_recurring_generation_failed'
		| 'team_member_added'
		| 'team_member_updated'
		| 'team_member_removed'
		| 'team_group_created'
		| 'team_group_updated'
		| 'team_group_deleted'
		| 'maintenance_request'
		| 'maintenance_request_created'
		| 'document_scan_started'
		| 'document_scan_completed'
		| 'quick_scan_completed'
		| 'property_audit_completed'
		| 'legal_update'
		| 'other'
		| 'property_shared';
	title: string;
	message: string;
	data?: {
		propertyId?: string;
		propertyTitle?: string;
		fromUserId?: string;
		fromUserEmail?: string;
		permission?: SharePermission;
		taskId?: string;
		maintenanceRequestId?: string;
		[key: string]: any;
	};
	status: 'unread' | 'read' | 'accepted' | 'rejected';
	actionUrl?: string;
	createdAt: string;
	updatedAt: string;
}
