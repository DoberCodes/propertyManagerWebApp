import type { HelpfulArticle } from '../types';

export const maintleyIntelligenceArticle: HelpfulArticle = {
	slug: 'use-maintley-intelligence-recommendations',
	title: 'Use Maintley Intelligence recommendations',
	summary: 'Understand what recommendations mean, why they appear, and how to act on them.',
	path: '/',
	actionLabel: 'Go to Today',
	introduction: 'Maintley Intelligence reviews saved property knowledge and highlights useful next actions. It explains what it found and why it may matter without claiming to inspect or diagnose the physical property.',
	founderNote: ['Maintley has memory, not omniscience. A recommendation should help you improve a record or decide on a next action while making the reason visible.'],
	sections: [
		{
			heading: 'When to use Maintley Intelligence',
			paragraphs: [
				'Use recommendations when you want help deciding what deserves attention in the information already saved to Maintley. A recommendation may identify an overdue task, incomplete equipment details, missing documentation, a maintenance pattern, or an opportunity to create a clearer reminder.',
				'Maintley Intelligence is most useful after the property contains some real context: equipment, tasks, documents, or Maintenance History. It can still help during setup, but a sparse record naturally limits what Maintley can explain. A missing fact in Maintley is a record gap, not proof of a maintenance problem.',
			],
			image: {
				src: '/screenshots/desktop_dashboard.png',
				alt: 'Today page showing property recommendations and supporting context.',
				caption: 'Recommendations should identify the property context, supporting reason, and practical next action.',
			},
		},
		{
			heading: 'A realistic example',
			paragraphs: [
				'Your furnace profile contains a model number and an inspection from two years ago, while a recurring inspection task is scheduled farther out than the service pattern recorded in Maintenance History. Maintley may show the history it found, the existing task name and next date, and a suggestion to review the schedule.',
				'The recommendation does not mean the furnace is unsafe or that Maintley knows the correct service interval for your exact situation. Open the equipment record, confirm the history, review manufacturer or contractor guidance, and adjust the task only if the evidence supports a different date. Dismissing or leaving the recommendation does not silently change the task.',
			],
		},
		{
			heading: 'Review a recommendation step by step',
			steps: [
				'Read the recommendation title and confirm which property or equipment it concerns.',
				'Review the explanation of what Maintley found and why that information may be useful.',
				'Open the linked record and verify the supporting tasks, dates, history, or documents.',
				'Decide whether the right action is to improve a record, create or adjust a task, review a document, or take no action.',
				'Enter only information you can verify. Use professional or manufacturer guidance when a maintenance decision requires expertise.',
				'Return to the recommendation after updating the record so you can confirm whether the saved context now answers the issue.',
			],
		},
		{
			heading: 'What happens when you act',
			paragraphs: [
				'Opening a recommendation only takes you to relevant context. It does not modify user data. Creating a task adds planned work. Updating an equipment profile improves the saved record. Completing work adds historical context only when you explicitly complete the task or save a Maintenance History entry.',
				'Recommendations are derived views, not independent property records. They may change when the underlying property information changes. Maintley should not preserve a duplicate recommendation as a separate source of truth when the property, equipment, task, or history record already contains the authoritative information.',
			],
		},
		{
			heading: 'Common mistakes',
			tips: [
				'Treat recommendations as record-based guidance, not as a diagnosis, inspection result, or emergency determination.',
				'Leave dates blank until you can verify them, even when a setup recommendation remains visible.',
				'Check for related scheduled work before creating another task.',
				'Read a Free-plan preview as an example of available guidance, not as a failure in the property record.',
				'Use qualified professional guidance whenever safety or technical judgment is required.',
			],
		},
		{
			heading: 'Troubleshooting and plan requirements',
			paragraphs: [
				'Free and Property include a lightweight record check focused on saved facts, setup gaps, and core maintenance context. Homeowner+ and Portfolio add full Maintley Intelligence with deeper sources such as Maintley Knowledge, property history, seasonal context, maintenance patterns, AI guidance, and Knowledge Packs as implemented. Full Home or Property Review and Property Insights require Homeowner+ or Portfolio; Free and Property may show a clearly labeled preview.',
				'If a recommendation looks stale, verify the underlying record and refresh the page. If it references the wrong equipment, inspect the task, history, or document links that supplied the context. If no recommendations appear, the property may not yet contain enough useful information, the current record may have no high-value findings, or your role may not include the relevant property.',
			],
		},
	],
	relatedGuideSlugs: ['build-a-useful-property-record', 'how-tasks-become-maintenance-history', 'review-document-suggestions'],
};
