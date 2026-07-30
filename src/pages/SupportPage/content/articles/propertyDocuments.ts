import type { HelpfulArticle } from '../types';

export const propertyDocumentsArticle: HelpfulArticle = {
	slug: 'keep-property-documents-organized', title: 'Keep property documents organized',
	summary: 'Store manuals, warranties, receipts, invoices, and photos with the records they support.',
	path: '/properties', actionLabel: 'Choose a Property',
	introduction: 'Documents are most useful when they are attached to the property, equipment, task, or completed maintenance record they explain.',
	sections: [
		{ heading: 'Choose the right context', paragraphs: ['Attach general inspections and broad property files to the property. Attach manuals, warranties, label photos, and purchase receipts to equipment. Attach invoices, service reports, receipts, and work photos to the related Maintenance History entry or task completion.'] },
		{ heading: 'Keep files understandable', steps: ['Choose the most specific relevant record.', 'Use a file name that identifies the equipment, contractor, document type, or date.', 'Add a short note when the record needs context beyond the file itself.', 'Keep the original evidence and remove only confirmed duplicates.'], image: { src: '/screenshots/desktop_documents.png', alt: 'Document area showing files attached to a property or maintenance record.', caption: 'Attach a file to the record it supports so another person can find it later.' } },
		{ heading: 'Common problems', tips: ['A file is supporting evidence; it does not replace a clear maintenance description.', 'If an upload fails, review storage limits, connection quality, and your permission for that record.', 'If a document belongs to another property, move or reattach it in the correct context rather than relying on its file name.'] },
	],
	relatedGuideSlugs: ['review-document-suggestions', 'storage-limits-and-file-management', 'what-to-preserve-after-service-work'],
};
