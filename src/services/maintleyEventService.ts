import { callFirebaseFunction } from '../config/firebaseFunctions';

export type MaintleyEventType =
	| 'knowledge_imported'
	| 'quick_scan_completed'
	| 'property_audit_completed';

export type MaintleyEventStatus = 'completed';

export interface PublishMaintleyEventRequest {
	accountId: string;
	userId?: string;
	recipientIds?: string[];
	propertyId?: string;
	relatedDocumentId?: string;
	relatedScanId?: string;
	type: MaintleyEventType;
	workflowKey: string;
	entityKey: string;
	title: string;
	message: string;
	status: MaintleyEventStatus;
	priority?: 'low' | 'normal' | 'high';
	actionLabel?: string;
	actionUrl?: string;
	metadata?: Record<string, unknown>;
	push?: boolean;
	inApp?: boolean;
}

export interface PublishMaintleyEventResponse {
	eventId: string;
	notificationIds: string[];
}

export const publishMaintleyEvent = (
	event: PublishMaintleyEventRequest,
) =>
	callFirebaseFunction<
		PublishMaintleyEventRequest,
		PublishMaintleyEventResponse
	>('publishMaintleyEvent', event);
