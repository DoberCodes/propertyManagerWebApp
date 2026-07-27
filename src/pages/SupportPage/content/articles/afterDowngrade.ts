import type { HelpfulArticle } from '../types';

export const afterDowngradeArticle: HelpfulArticle = {
	slug: 'what-happens-after-a-downgrade',
	title: 'What happens after a downgrade',
	summary: 'Understand which records remain available and which paid capabilities stop.',
	path: '/settings?category=account',
	actionLabel: 'Review Current Access',
	introduction: 'A downgrade changes future feature access and resource limits. It should not erase the property records, Maintenance History, or files you already saved.',
	sections: [
		{ heading: 'When the change takes effect', paragraphs: [
			'A canceled paid subscription generally remains active through the end of the current paid billing period. A trial or complimentary period ends at its stated time. Billing & Subscription should show the relevant date and the access Maintley currently resolves for the account.',
		] },
		{ heading: 'What remains and what changes', paragraphs: [
			'Existing property information, equipment records, Maintenance History, and saved documents remain available. The lower plan’s limits apply to new records and uploads. If existing usage is above a lower limit, keep and review existing information rather than deleting it simply to complete the downgrade.',
			'Paid automation and deeper guidance stop when they are no longer included. For example, recurring-care generation, reminder emails, push notifications, full Home or Property Review, Property Insights, or document suggestion review may become unavailable. Existing tasks and history remain records; future automated behavior depends on the effective plan.',
		] },
		{ heading: 'Prepare for the change', steps: [
			'Review the effective end date in Billing & Subscription.',
			'Confirm important recurring work has understandable task titles and dates.',
			'Download any files you want available outside Maintley, while keeping the Maintley copies if useful.',
			'Export property data if you want a separate point-in-time copy.',
			'After the downgrade, review the plan summary before trying to add properties, equipment, or files beyond the new limits.',
		] },
		{ heading: 'Troubleshooting', tips: [
			'If paid features remain available before the displayed end date, that is expected for cancellation at period end.',
			'If access ends earlier than the confirmed date, refresh and contact Support with the date shown in billing.',
			'Preserve existing history and files when current usage exceeds a lower plan’s creation limits.',
			'Account deletion is separate from cancellation and requires its own confirmation.',
		] },
	],
	relatedGuideSlugs: ['manage-stripe-billing-and-subscriptions', 'storage-limits-and-file-management', 'reports-and-property-exports'],
};
