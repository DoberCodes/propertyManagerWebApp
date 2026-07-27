import type { HelpfulArticle } from '../types';

export const propertyGroupsArticle: HelpfulArticle = {
	slug: 'organize-properties-with-groups', title: 'Organize multiple properties with groups',
	summary: 'Make a portfolio easier to scan without changing access, ownership, or billing.',
	path: '/properties', actionLabel: 'Manage Property Groups',
	introduction: 'Groups create visual sections on the Properties page for a portfolio, region, ownership type, or another practical category.',
	sections: [
		{ heading: 'When groups help', paragraphs: ['Use a small number of recognizable groups when the property list has become difficult to scan. Groups do not create a parallel ownership structure and do not change property permissions, task access, or billing.'] },
		{ heading: 'Organize the list', steps: ['Create a group with a clear name and optional description.', 'Choose an icon and color for recognition.', 'Move properties into the appropriate group.', 'Reorder or collapse groups to match the way you review the portfolio.', 'Remove an empty or confusing group when it no longer helps.'], image: { src: '/screenshots/desktop_multiproperty.png', alt: 'Properties organized into visual property groups.', caption: 'Groups organize the page without changing the records or their access rules.' } },
		{ heading: 'Plans and mistakes', tips: ['Property Groups are intended for supported multi-property plans.', 'Use groups only to organize the property list; keep units, permissions, and account ownership in their established records.', 'Moving a property changes its visual group, not its Maintenance History or assigned access.'] },
	],
	relatedGuideSlugs: ['build-a-useful-property-record', 'team-member-access-and-permissions'],
};
