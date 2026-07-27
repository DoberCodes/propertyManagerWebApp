import type { HelpfulArticle } from '../types';

export const preserveServiceWorkArticle: HelpfulArticle = {
	slug: 'what-to-preserve-after-service-work', title: 'Preserve service work after the visit',
	summary: 'Record details that matter for future repairs, warranty claims, and property history.',
	path: '/properties', actionLabel: 'Choose a Property',
	introduction: 'After service work, preserve enough verified information to understand what happened without relying on memory, email, or the contractor being available later.',
	sections: [
		{ heading: 'Record the result', steps: ['Enter the actual service date.', 'Identify the contractor or person who performed the work.', 'Separate the reported problem from verified findings.', 'Describe work completed and parts replaced.', 'Record cost, warranty coverage, and recommended follow-up.'] },
		{ heading: 'Save it in the right place', paragraphs: ['Complete the related task when one exists. Otherwise add a Maintenance History record. Link the result to the correct property and equipment.'], image: { src: '/screenshots/desktop_taskhistory.png', alt: 'Maintenance History showing completed service work.', caption: 'Maintenance History preserves what happened and the evidence that supports it.' } },
		{ heading: 'Keep supporting evidence', tips: ['Attach the final invoice, service report, receipts, and useful photos.', 'Ask for exact part names or numbers.', 'Create a new task for follow-up that has not occurred.', 'Keep verified findings separate from recommendations.'] },
	],
	relatedGuideSlugs: ['how-tasks-become-maintenance-history', 'prepare-property-records-for-a-contractor', 'keep-property-documents-organized'],
};
