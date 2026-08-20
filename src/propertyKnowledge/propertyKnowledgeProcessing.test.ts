import {
	getPropertyDocumentScanAction,
	isPropertyDocumentKnowledgeScanEligible,
} from './propertyKnowledgeProcessing';

const pdfDocument = {
	type: 'application/pdf',
	fileName: 'service-report.pdf',
	name: 'Service report',
	category: 'other' as const,
	documentType: 'inspection_report' as const,
};

describe('property document knowledge scan eligibility', () => {
	it('keeps manuals and warranties out of document scanning', () => {
		for (const restrictedType of ['manual', 'warranty'] as const) {
			const document = {
				name: `${restrictedType}.pdf`,
				type: 'application/pdf',
				category: restrictedType,
				documentType: restrictedType,
			};
			expect(isPropertyDocumentKnowledgeScanEligible(document)).toBe(false);
			expect(
				getPropertyDocumentScanAction({
					document,
					hasSuggestion: false,
					suggestionCount: 0,
					isRetryable: false,
				}),
			).toBeNull();
		}
	});

	it('allows supported non-restricted documents to use acquisition', () => {
		expect(isPropertyDocumentKnowledgeScanEligible(pdfDocument)).toBe(true);
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: false,
				suggestionCount: 0,
				isRetryable: false,
			}),
		).toBe('check');
	});
});

describe('getPropertyDocumentScanAction', () => {
	it('offers a rescan after a supported document review is completed', () => {
		for (const [suggestionStatus, suggestionCount] of [
			['applied', 4],
			['rejected', 0],
		] as const) {
			expect(
				getPropertyDocumentScanAction({
					document: pdfDocument,
					hasSuggestion: true,
					suggestionCount,
					suggestionStatus,
					isRetryable: false,
				}),
			).toBe('rescan');
		}
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

	it('offers a rescan when a completed review found no suggested details', () => {
		expect(
			getPropertyDocumentScanAction({
				document: pdfDocument,
				hasSuggestion: true,
				suggestionCount: 0,
				suggestionStatus: 'pending',
				isRetryable: false,
			}),
		).toBe('rescan');
	});

	it('does not offer rescanning for formats without backend processing', () => {
		expect(
			getPropertyDocumentScanAction({
				document: {
					type: 'image/jpeg',
					name: 'equipment.jpg',
					category: 'other',
				},
				hasSuggestion: true,
				suggestionCount: 2,
				suggestionStatus: 'rejected',
				isRetryable: false,
			}),
		).toBeNull();
	});
});
