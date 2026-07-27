import type { HelpfulArticle } from '../types';

export const equipmentRecordsArticle: HelpfulArticle = {
	slug: 'track-appliances-and-home-systems',
	title: 'Track equipment and home systems',
	summary: 'Keep equipment details, parts, documents, tasks, and service history connected.',
	path: '/devices',
	actionLabel: 'Go to Equipment',
	introduction: 'Equipment profiles keep identifying details, service records, parts, documents, and linked tasks together so future maintenance does not start from scratch.',
	founderNote: ['Equipment details are easiest to capture when you are standing beside the system or reviewing a service record. A few verified facts can save a surprising amount of time during the next repair.'],
	sections: [
		{
			heading: 'When an equipment profile is useful',
			paragraphs: [
				'Create an equipment profile for something you maintain, repair, replace, inspect, or reference during service. Examples include heating and cooling equipment, water heaters, kitchen appliances, roofs, generators, pumps, electrical panels, and safety equipment.',
				'An equipment profile should represent the actual item at the property. It is not a generic maintenance category. A furnace and an air conditioner can have separate profiles even when they work together, because their models, service histories, parts, and replacement dates may differ.',
			],
			image: {
				src: '/screenshots/desktop_appliance.png',
				alt: 'Equipment profile showing details and linked records.',
				caption: 'Equipment profiles keep identifying details, files, tasks, and service history connected.',
			},
		},
		{
			heading: 'A realistic example',
			paragraphs: [
				'You are ordering a replacement filter for a furnace. Instead of relying on an old shopping receipt, open the furnace profile and record its location, manufacturer, model, serial number, and filter size from the label. Add a clear label photo and attach the manual.',
				'Later, a technician replaces an igniter. Complete the related task with the actual service date, contractor, part number, cost, and invoice. The next technician can see which furnace was serviced and which part was used without searching through messages or guessing from a similar unit elsewhere in the property.',
			],
		},
		{
			heading: 'Build the profile step by step',
			steps: [
				'Open Equipment and add a profile under the correct property.',
				'Use a name that distinguishes the item, such as “Basement furnace” instead of only “Furnace.”',
				'Add the location, manufacturer, model, serial number, installation date, and warranty information when verified.',
				'Photograph the product label when it contains useful identifiers that may be difficult to reach later.',
				'Record consumables and parts such as filter sizes, battery types, belt numbers, or other routinely replaced items.',
				'Attach manuals, warranties, receipts, installation records, and service files to the equipment profile.',
				'Link future tasks to the equipment and preserve completed work through task completion or Maintenance History.',
			],
		},
		{
			heading: 'What happens as the record grows',
			paragraphs: [
				'The profile becomes the shared context for tasks, files, and maintenance records involving that equipment. Updating an identifying field changes the saved profile; it does not rewrite older invoices or maintenance notes. Attaching a document preserves supporting evidence but does not automatically verify every value inside it.',
				'Maintley may use saved equipment details and history to explain setup gaps or maintenance opportunities. Recommendations are based on the information in Maintley and should remain explainable. They are not a physical diagnosis, and missing information should be treated as a record gap rather than evidence that the equipment itself is unsafe or poorly maintained.',
			],
		},
		{
			heading: 'Common mistakes',
			tips: [
				'Give separate appliances their own profiles, even when they share a room or system.',
				'Check the equipment label so model and serial identifiers are saved in the correct fields.',
				'Leave the installation date blank until a receipt, label, or other source verifies it.',
				'Preserve the old service history when equipment is replaced, then document the replacement.',
				'Keep contractor recommendations as future work until they have actually been completed.',
			],
		},
		{
			heading: 'Troubleshooting and plan requirements',
			paragraphs: [
				'Equipment records are unlimited across standard plans. If a profile will not save, confirm the selected property, your permission to update it, and the connection before entering the information again. Existing equipment remains visible after any plan change.',
				'If equipment does not appear, confirm the selected property and your access assignment. If a document upload fails, check file and storage limits as well as connection quality. If details extracted from a document are incomplete, keep the original file, correct the profile manually, and apply only suggestions you can verify.',
			],
		},
	],
	relatedGuideSlugs: ['build-a-useful-property-record', 'review-document-suggestions', 'what-to-preserve-after-service-work'],
};
