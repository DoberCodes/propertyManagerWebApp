import { getPropertyDocumentScanAction } from './propertyKnowledgeProcessing';

const pdfDocument = {
	type: 'application/pdf',
	fileName: 'service-report.pdf',
	name: 'Service report',
};

describe('getPropertyDocumentScanAction', () => {
	it('offers an initial check before a document has suggestions', () => {
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: false,
				suggestionCount: 0,
				isRetryable: false,
			}),
		).toBe('check');
	});

	it('offers a rescan after a supported document review is completed', () => {
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: true,
				suggestionCount: 4,
				suggestionStatus: 'applied',
				isRetryable: false,
			}),
		).toBe('rescan');
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: true,
				suggestionCount: 0,
				suggestionStatus: 'rejected',
				isRetryable: false,
			}),
		).toBe('rescan');
	});

	it('does not compete with a pending review or retry action', () => {
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: true,
				suggestionCount: 4,
				suggestionStatus: 'pending',
				isRetryable: false,
			}),
		).toBeNull();
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: true,
				suggestionCount: 4,
				suggestionStatus: 'applied',
				isRetryable: true,
			}),
		).toBeNull();
	});

	it('does not offer rescanning for formats without backend processing', () => {
		expect(
			getPropertyDocumentScanAction({
				document: { type: 'image/jpeg', name: 'equipment.jpg' },
				hasSuggestion: true,
				suggestionCount: 2,
				suggestionStatus: 'rejected',
				isRetryable: false,
			}),
		).toBeNull();
	});
});
