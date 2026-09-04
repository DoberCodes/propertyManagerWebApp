export const ANALYTICS_ACTION_SOURCES = [
	'user',
	'setup_assistant',
	'system',
	'import',
	'ai_suggestion',
] as const;

export type AnalyticsActionSource = (typeof ANALYTICS_ACTION_SOURCES)[number];

export const isAnalyticsActionSource = (
	value: unknown,
): value is AnalyticsActionSource =>
	typeof value === 'string' &&
	(ANALYTICS_ACTION_SOURCES as readonly string[]).includes(value);

export type AnalyticsEventName =
	| 'route_viewed'
	| 'signup_started'
	| 'email_verification_sent'
	| 'email_verification_completed'
	| 'signup_completed'
	| 'property_created'
	| 'equipment_created'
	| 'equipment_updated'
	| 'space_created'
	| 'supply_created'
	| 'task_created'
	| 'task_completed'
	| 'maintenance_history_added'
	| 'document_uploaded'
	| 'property_setup_started'
	| 'property_setup_path_selected'
	| 'property_setup_path_completed'
	| 'property_setup_path_exited'
	| 'property_setup_stage_viewed'
	| 'property_setup_completed'
	| 'property_setup_proposal_viewed'
	| 'property_setup_proposal_dismissed'
	| 'property_setup_plan_confirmed'
	| 'property_setup_plan_activated'
	| 'property_scan_completed'
	| 'report_downloaded'
	| 'workflow_validation_blocked'
	| 'workflow_error_shown';

export const ANALYTICS_EVENT_PARAM_ALLOWLIST: Record<
	AnalyticsEventName,
	readonly string[]
> = {
	route_viewed: [
		'route_name',
		'route_pattern',
		'route_area',
		'auth_state',
		'user_role',
		'is_team_member',
	],
	signup_started: [
		'registration_mode',
		'has_access_code',
		'starting_audience',
	],
	email_verification_sent: ['verification_source'],
	email_verification_completed: ['registration_mode'],
	signup_completed: [
		'registration_mode',
		'selected_plan',
		'used_access_code',
		'requires_checkout',
	],
	property_created: [
		'action_source',
		'property_type',
		'has_group',
		'has_notes',
		'property_sequence',
	],
	equipment_created: [
		'action_source',
		'equipment_type',
		'equipment_category',
		'has_install_date',
		'has_filter_size',
	],
	equipment_updated: [
		'action_source',
		'changed_field_count',
		'changed_identity',
		'changed_installation',
		'changed_location',
		'changed_maintenance_details',
	],
	space_created: [
		'action_source',
		'space_source',
		'space_type',
		'is_generated',
	],
	supply_created: [
		'action_source',
		'entry_point',
		'supply_type',
		'has_identifier',
	],
	task_created: [
		'action_source',
		'task_priority',
		'task_status',
		'has_due_date',
		'has_equipment',
		'is_recurring',
		'has_notifications',
	],
	task_completed: [
		'action_source',
		'completion_path',
		'task_priority',
		'has_completion_file',
		'has_financials',
		'is_recurring',
		'approval_required',
		'has_completion_notes',
	],
	maintenance_history_added: [
		'action_source',
		'event_type',
		'event_source',
		'has_attachment',
		'has_financials',
		'equipment_count',
		'has_notes',
	],
	document_uploaded: [
		'action_source',
		'document_count',
		'document_category',
		'has_equipment_connection',
		'has_space_connection',
		'has_task_connection',
		'has_supply_connection',
		'review_enabled',
	],
	property_setup_started: [
		'entry_point',
		'restored_draft',
		'reviewed_count',
		'total_count',
	],
	property_setup_path_selected: [
		'setup_path',
		'reviewed_count',
		'total_count',
	],
	property_setup_path_completed: [
		'setup_path',
		'reviewed_count',
		'total_count',
		'created_equipment_count',
		'created_task_count',
		'linked_task_count',
	],
	property_setup_path_exited: [
		'setup_path',
		'reviewed_count',
		'total_count',
		'has_unsaved_changes',
		'exit_reason',
	],
	property_setup_stage_viewed: [
		'setup_stage',
		'stage_index',
		'stage_count',
		'setup_path',
	],
	property_setup_completed: [
		'created_equipment_count',
		'created_task_count',
		'linked_task_count',
		'restored_draft',
	],
	property_setup_proposal_viewed: ['proposal_count', 'restored_draft'],
	property_setup_proposal_dismissed: ['remaining_proposal_count'],
	property_setup_plan_confirmed: [
		'created_equipment_count',
		'created_task_count',
		'linked_task_count',
		'trusted_activation_enabled',
	],
	property_setup_plan_activated: [
		'proposal_count',
		'created_task_count',
		'replayed_task_count',
		'recurring_access_applied',
	],
	property_scan_completed: [
		'action_source',
		'scan_type',
		'recommendation_count',
		'overdue_count',
		'systems_reviewed',
		'tasks_reviewed',
	],
	report_downloaded: [
		'action_source',
		'report_type',
		'row_count',
		'column_count',
		'export_format',
		'hide_empty_columns',
	],
	workflow_validation_blocked: [
		'workflow_name',
		'workflow_stage',
		'reason_code',
	],
	workflow_error_shown: [
		'workflow_name',
		'workflow_stage',
		'error_code',
	],
};

export const getAnalyticsErrorCode = (error: unknown): string => {
	const candidate = error as { code?: unknown; message?: unknown } | null;
	const combined = `${String(candidate?.code || '')} ${String(
		candidate?.message || error || '',
	)}`.toLowerCase();

	if (combined.includes('permission') || combined.includes('unauthorized')) {
		return 'permission_denied';
	}
	if (
		combined.includes('network') ||
		combined.includes('offline') ||
		combined.includes('blocked_by_client')
	) {
		return 'network_unavailable';
	}
	if (combined.includes('storage') || combined.includes('upload')) {
		return 'upload_failed';
	}
	if (combined.includes('subscription') || combined.includes('entitlement')) {
		return 'subscription_restricted';
	}
	if (combined.includes('unavailable') || combined.includes('functions/')) {
		return 'service_unavailable';
	}
	return 'unexpected_error';
};
