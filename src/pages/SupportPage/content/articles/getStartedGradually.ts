import type { HelpfulArticle } from '../types';

export const getStartedGraduallyArticle: HelpfulArticle = {
	slug: 'get-started-without-documenting-everything', title: 'Get started without documenting everything',
	summary: 'Build a useful record gradually instead of turning setup into a large inventory project.',
	path: '/properties', actionLabel: 'Choose a Property',
	introduction: 'Maintley can become useful before every room, appliance, document, and past repair has been entered.',
	sections: [
		{ heading: 'Start with what matters now', steps: ['Add the property and a recognizable name.', 'Add equipment that needs attention soon or has important warranty information.', 'Create tasks for current work.', 'Attach documents you are already handling.', 'Record new service work as it happens.'] },
		{ heading: 'Let normal activity build the record', paragraphs: ['A practical property record grows through real maintenance. When you replace a filter, review the label. When a contractor visits, record the result and invoice. When you find a warranty, attach it to the equipment. Unknown fields can stay blank until verified.'] },
		{ heading: 'Avoid setup fatigue', tips: ['Leave uncertain details blank until you can verify them.', 'Prioritize current tasks before entering low-value historical information.', 'Use Maintley Intelligence recommendations as guidance about saved records, not as a demand to fill every field.'] },
	],
	relatedGuideSlugs: ['build-a-useful-property-record', 'use-maintley-intelligence-recommendations'],
};
