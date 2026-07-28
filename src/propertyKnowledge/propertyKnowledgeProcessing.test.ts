import { isPropertyDocumentKnowledgeScanEligible } from './propertyKnowledgeProcessing';

describe('property document knowledge scan eligibility', () => {
	it('keeps manuals and warranties out of document scanning', () => {
		expect(
			isPropertyDocumentKnowledgeScanEligible({
				name: 'Pressure washer.pdf',
				type: 'application/pdf',
				category: 'manual',
				documentType: 'manual',
			}),
		).toBe(false);
		expect(
			isPropertyDocumentKnowledgeScanEligible({
				name: 'Coverage.pdf',
				type: 'application/pdf',
				category: 'warranty',
				documentType: 'warranty',
			}),
		).toBe(false);
	});

	it('allows other document categories to use supported acquisition paths', () => {
		expect(
			isPropertyDocumentKnowledgeScanEligible({
				name: 'Summer service report.pdf',
				type: 'application/pdf',
				category: 'other',
				documentType: 'inspection_report',
			}),
		).toBe(true);
	});
});
