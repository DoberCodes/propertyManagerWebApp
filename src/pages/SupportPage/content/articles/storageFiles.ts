import type { HelpfulArticle } from '../types';

export const storageFilesArticle: HelpfulArticle = {
	slug: 'storage-limits-and-file-management',
	title: 'Understand storage limits and file management',
	summary: 'Keep useful files organized, review usage, and respond safely when the account reaches a limit.',
	path: '/settings?category=account',
	actionLabel: 'Review Plan and Storage',
	introduction: 'Files support property, equipment, task, and maintenance records. Plan limits apply to both the number of files and total storage used.',
	sections: [
		{ heading: 'Current storage limits', paragraphs: [
			'Free includes 10 files and 1 GB. Homeowner+ includes 250 files and 5 GB. Property includes 1,500 files and 15 GB. Portfolio includes 5,000 files and 25 GB. Limits may evolve, so use the current plan and storage display when making a decision.',
			'File uploads, downloads, deletion, and storage-usage display are available across standard plans. Existing files should remain accessible after a downgrade even when current usage is above the lower plan’s limit, but new uploads may be blocked until usage or access changes.',
		] },
		{ heading: 'Manage files step by step', steps: [
			'Upload the file from the property, equipment, task, or maintenance record it supports.',
			'Use a recognizable name containing the equipment, document type, contractor, or date.',
			'Keep the clearest final version and remove true duplicates when they add no historical value.',
			'Download a separate copy before deleting any file you may need later.',
			'Review storage usage and plan limits before adding a large group of photos or documents.',
		] },
		{ heading: 'What deletion and replacement mean', paragraphs: [
			'Deleting a file removes supporting evidence and may be difficult to reverse. It does not automatically delete the property, equipment, task, or maintenance record it supported. Uploading a clearer file does not automatically remove the older copy, so confirm the replacement before deleting anything.',
			'Photos and documents may share storage infrastructure but serve different purposes in the interface. Keep identifying photos where they help recognize a property or equipment item, and keep invoices, manuals, warranties, and reports with the records they explain.',
		] },
		{ heading: 'Troubleshooting', tips: [
			'If an upload fails, check file count, total storage, connection quality, file type, and your permission for the destination record.',
			'If a file appears missing, verify the property and the specific record where it was attached.',
			'Preserve unique invoices and service reports even when an automated warning remains visible.',
			'Document suggestion availability is separate from the ability to upload and organize files.',
		] },
	],
	relatedGuideSlugs: ['keep-property-documents-organized', 'review-document-suggestions', 'what-happens-after-a-downgrade'],
};
