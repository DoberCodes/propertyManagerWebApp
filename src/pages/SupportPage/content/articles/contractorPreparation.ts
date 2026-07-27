import type { HelpfulArticle } from '../types';

export const contractorPreparationArticle: HelpfulArticle = {
	slug: 'prepare-property-records-for-a-contractor', title: 'Prepare property records for a contractor',
	summary: 'Gather equipment details, service history, photos, documents, and questions before a visit.',
	path: '/properties', actionLabel: 'Choose a Property',
	introduction: 'A prepared property record helps a contractor understand the equipment, observable symptoms, previous work, and available documents.',
	sections: [
		{ heading: 'Before the visit', steps: ['Confirm the property and equipment location.', 'Verify manufacturer, model, serial number, and installation date when known.', 'Attach manuals, warranties, past service reports, photos, and exact error codes.', 'Review Maintenance History for prior repairs and recurring symptoms.', 'Write down the questions you want answered.'], image: { src: '/screenshots/desktop_propertydetails.png', alt: 'Property record prepared with details for a contractor visit.', caption: 'Bring equipment details, files, and history together before the visit.' } },
		{ heading: 'Describe what you observed', paragraphs: ['Record when the symptom began, when it occurs, and any visible or measurable conditions. Keep an unverified diagnosis separate from observed facts.'] },
		{ heading: 'After the visit', tips: ['Record the contractor findings, work completed, cost, parts, and warranty coverage.', 'Attach the final invoice and service report.', 'Create a task for recommended follow-up instead of recording it as completed work.'] },
	],
	relatedGuideSlugs: ['track-appliances-and-home-systems', 'what-to-preserve-after-service-work'],
};
