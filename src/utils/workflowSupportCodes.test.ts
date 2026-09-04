import {
	WORKFLOW_SUPPORT_CODES,
	withWorkflowSupportCode,
} from './workflowSupportCodes';

describe('workflowSupportCodes', () => {
	it('adds a stable code without exposing raw errors', () => {
		expect(
			withWorkflowSupportCode(
				'Your property was saved, but one step needs attention.',
				WORKFLOW_SUPPORT_CODES.propertySpaceReconciliation,
			),
		).toBe(
			'Your property was saved, but one step needs attention. Support code: MNT-PROP-001.',
		);
	});
});
