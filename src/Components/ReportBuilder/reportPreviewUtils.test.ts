import { formatPreviewValue } from './reportPreviewUtils';

describe('reportPreviewUtils', () => {
	it('uses homeowner-friendly labels for missing preview values', () => {
		expect(formatPreviewValue('', 'dueDate')).toBe('Not scheduled');
		expect(formatPreviewValue('', 'assignee')).toBe('Unassigned');
		expect(formatPreviewValue('', 'propertyTitle')).toBe('Not linked');
		expect(formatPreviewValue('', 'notes')).toBe('Not provided');
	});
});
