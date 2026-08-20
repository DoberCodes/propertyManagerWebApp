import type { HelpfulArticle } from '../types';

export const documentSuggestionsArticle: HelpfulArticle = {
	slug: 'review-document-suggestions',
	title: 'Review document suggestions',
	summary: 'Understand document review, property matching, and why suggested changes require approval.',
	path: '/properties',
	actionLabel: 'Choose a Property',
	introduction: 'Document review can surface useful details from invoices, receipts, warranties, and service records. You remain responsible for confirming the property, equipment, and facts before anything is applied.',
	founderNote: ['The original document remains the evidence. Maintley should reduce repetitive entry without silently turning an uncertain reading into a trusted property record.'],
	sections: [
		{
			heading: 'When to use document suggestions',
			paragraphs: [
				'Use document review when a file contains maintenance or property information that would otherwise need to be entered manually. A clear contractor invoice might contain the service date, contractor, total, equipment details, work performed, parts, and warranty information. A warranty or receipt may help complete an equipment profile.',
				'Maintley may suggest a property match, a new maintenance record, or updates to existing records. A suggestion is a proposed interpretation of the uploaded file. It is not an inspection, diagnosis, accounting decision, or automatic correction.',
			],
			image: {
				src: '/screenshots/desktop_suggestedDetails.png',
				alt: 'Document review screen showing suggested records, updates, and warnings.',
				caption: 'Review the summary, warnings, and property context before applying suggested details.',
			},
		},
		{
			heading: 'A realistic example',
			paragraphs: [
				'You upload an HVAC invoice after a spring service visit. Maintley identifies the contractor, service date, invoice total, furnace model, and a note recommending a return visit. The document was uploaded from the correct property, but the invoice lists the billing address rather than the service address.',
				'Before applying anything, confirm that the invoice belongs to the selected property and furnace. Accept the verified contractor, service date, work completed, and cost. Treat the recommended return visit as future work by creating a task; do not include it as completed maintenance. Keep the invoice attached so someone reviewing the record can trace the saved details back to the source.',
			],
		},
		{
			heading: 'Review suggestions step by step',
			steps: [
				'Upload the file from the most specific relevant record when possible: property, equipment, task, or maintenance record.',
				'Watch the document card for the Checking status. You can leave the page while Maintley works; the card and your notifications will tell you when suggested details are ready.',
				'Confirm the selected property before reviewing individual fields.',
				'Compare suggested dates, totals, contractor details, model identifiers, parts, and work descriptions with the original file.',
				'Review warnings, possible duplicates, and any information that could not be matched confidently.',
				'Apply only accurate suggestions. Skip uncertain details and enter a correction manually when needed.',
				'Create a task for recommended or follow-up work that has not yet occurred.',
				'Reopen the resulting record and confirm that the information landed in the intended place.',
			],
		},
		{
			heading: 'What happens after review',
			paragraphs: [
				'Applying an accepted suggestion creates or updates the indicated Maintley record. Skipping a suggestion leaves that record unchanged. The uploaded file remains available as supporting evidence even when you choose not to apply every proposed detail.',
				'Document context should not become a second source of truth. Maintenance History remains the record of completed work, equipment profiles remain the record of equipment details, and the property remains the primary owner of general property documents. If a suggestion conflicts with a verified record, preserve the evidence and correct the Maintley record deliberately.',
			],
		},
		{
			heading: 'Common mistakes',
			tips: [
				'Review each field independently, even when most of the document was read correctly.',
				'Confirm the service property instead of relying only on the billing address.',
				'Keep estimates, recommendations, and scheduled work separate from completed maintenance.',
				'Preserve the original file as evidence after applying suggestions.',
				'Complete the related task when it already represents the work, rather than adding a duplicate maintenance record.',
			],
		},
		{
			heading: 'Troubleshooting, plans, and permissions',
			paragraphs: [
				'Text-based PDFs, clear images, and structured DOCX service reports generally provide better results than blurry photographs, handwriting, unusual layouts, or packets containing several documents. Word report processing reads paragraphs and tables; it does not interpret handwritten or image-only content embedded in a DOCX file. If important text is missed, upload a clearer source when available or enter the verified information manually.',
				'Inspection reports may group several systems under one heading, such as Heating, Cooling, and Plumbing. Maintley checks those compound sections for controlled equipment and explicit recommendations, but you should still compare every proposed record with the original report.',
				'A structured service report may propose one dated maintenance visit, future tasks, and equipment matches. Review each equipment mention before adding it: rooms and general inspection areas remain visit observations, and an all-clear result is recorded as the provider’s dated observation rather than a Maintley diagnosis.',
				'File upload and organization are available across standard plans. Advanced suggested-details review is available on Homeowner+, Property, and Portfolio, while Free may show a limited preview. You must also have access to the relevant property and permission to update the destination record. If an Apply action is unavailable, check the plan, property selection, role, and whether the proposed destination still exists.',
			],
		},
	],
	relatedGuideSlugs: ['keep-property-documents-organized', 'track-appliances-and-home-systems', 'repair-record-or-maintenance-task'],
};
