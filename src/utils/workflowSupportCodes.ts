export const WORKFLOW_SUPPORT_CODES = {
	propertySpaceReconciliation: 'MNT-PROP-001',
	propertyDashboardPreference: 'MNT-PROP-002',
	propertyEquipmentCopy: 'MNT-PROP-003',
	propertyTaskCopy: 'MNT-PROP-004',
	propertySetupSave: 'MNT-SETUP-001',
} as const;

export type WorkflowSupportCode =
	(typeof WORKFLOW_SUPPORT_CODES)[keyof typeof WORKFLOW_SUPPORT_CODES];

export const withWorkflowSupportCode = (
	message: string,
	code: WorkflowSupportCode,
): string => `${message} Support code: ${code}.`;
