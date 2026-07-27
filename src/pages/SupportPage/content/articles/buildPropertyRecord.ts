import type { HelpfulArticle } from '../types';

export const buildPropertyRecordArticle: HelpfulArticle = {
	slug: 'build-a-useful-property-record',
	title: 'Build a useful property record',
	summary: 'Create the foundation for equipment, tasks, documents, contractors, and maintenance history.',
	path: '/properties',
	actionLabel: 'Go to Properties',
	introduction: 'A property record is the main home for everything Maintley knows about a property. It connects the address, equipment, tasks, documents, contractors, and completed maintenance without requiring you to document everything at once.',
	founderNote: [
		'Maintley becomes more useful as ordinary maintenance activity adds trustworthy context to the property. The objective is not a perfect inventory on day one. It is a dependable record that another person can understand later.',
	],
	sections: [
		{
			heading: 'When to build the property record',
			paragraphs: [
				'Start a property record when you want one reliable place for information about a home, rental, or other property you maintain. The property is Maintley’s primary organizational unit, so equipment, tasks, files, contractors, and Maintenance History should connect back to it.',
				'You do not need to wait for a complete inspection or a folder full of paperwork. A useful starting record can contain the correct address, a recognizable name, a photo, and the two or three systems you are most likely to service. Add verified details when you encounter them.',
			],
			image: {
				src: '/screenshots/desktop_multiproperty.png',
				alt: 'Properties page showing property groups and property cards.',
				caption: 'Use the Properties page as the starting point for records, equipment, tasks, and documents.',
			},
		},
		{
			heading: 'A realistic example',
			paragraphs: [
				'Imagine you have just moved into a house with an older furnace and a recently replaced water heater. Begin with the address and a name your family will recognize. Add the furnace because its service history is uncertain, then add the water heater from the installation receipt. Create a task to schedule the furnace inspection and attach the water-heater receipt to its equipment profile.',
				'After the inspection, complete the furnace task with the service date, contractor, findings, cost, and invoice. The property record now answers practical questions: which furnace is installed, when it was inspected, who serviced it, what the technician found, and where the invoice is stored.',
			],
		},
		{
			heading: 'Build the foundation step by step',
			steps: [
				'Open Properties and add the real address. Use a property name that family or coworkers will recognize.',
				'Add a current property photo if it helps distinguish the property from others in the account.',
				'Add important equipment first: heating and cooling, water heating, electrical, plumbing, safety equipment, or anything approaching service.',
				'Create tasks for work that still needs attention. Link each task to the property and to equipment when the work concerns a specific system.',
				'Upload verified documents near the record they support. General inspections belong with the property; manuals and warranties usually belong with equipment; invoices belong with completed work.',
				'Add contractors when their contact information or past work will be useful again.',
			],
		},
		{
			heading: 'What happens after each action',
			paragraphs: [
				'Adding the property creates the context for related records; it does not automatically create equipment or maintenance history. Adding equipment gives future tasks, documents, and completed work a specific system to reference. Creating a task records planned work, not proof that the work occurred. Completing the task with service details preserves the result in Maintenance History.',
				'Uploaded files remain supporting evidence. Maintley may offer document suggestions on eligible plans, but suggestions require review and do not silently replace the original file or rewrite your records. Maintley Intelligence uses saved property information to explain possible gaps and useful next actions; it does not inspect the physical property.',
			],
		},
		{
			heading: 'Common mistakes to avoid',
			tips: [
				'Keep rooms, equipment, and other details within the property they belong to instead of creating separate property records.',
				'Leave model numbers, installation dates, and service details blank until you can verify them.',
				'Complete each finished task with the actual result so the work becomes part of Maintenance History.',
				'Attach each file to the most specific equipment or maintenance record that explains its context.',
			],
		},
		{
			heading: 'Troubleshooting and requirements',
			paragraphs: [
				'If you cannot add another property or piece of equipment, review your current plan limits. Free and Homeowner+ accounts are designed around one property, while business plans support additional properties. Free accounts currently include up to 15 equipment records. Property Groups are available for supported multi-property plans and only organize the Properties page; they do not change ownership or permissions.',
				'If a record is missing, confirm that you are viewing the correct property and that your account role includes access to it. Team members with assigned-property access may not see the entire account. If a recent change has not appeared, refresh after confirming your connection before entering the information again.',
			],
		},
	],
	relatedGuideSlugs: ['track-appliances-and-home-systems', 'how-tasks-become-maintenance-history', 'keep-property-documents-organized'],
};
