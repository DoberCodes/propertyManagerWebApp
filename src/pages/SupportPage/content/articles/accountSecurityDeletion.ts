import type { HelpfulArticle } from '../types';

export const accountSecurityDeletionArticle: HelpfulArticle = {
	slug: 'account-security-and-deletion',
	title: 'Protect or delete your account',
	summary: 'Use individual sign-ins, protect account access, export records, and understand permanent deletion.',
	path: '/profile',
	actionLabel: 'Open Profile',
	introduction: 'Account security protects property records, files, personal information, and shared access. Account deletion is a separate permanent action and should only happen after billing and data-retention needs are resolved.',
	sections: [
		{ heading: 'Protect account access', paragraphs: [
			'Use an individual account for each family or team member instead of sharing credentials. Keep the sign-in email current, use a unique password, and review shared access when someone’s responsibilities change. Maintley Support should never need your password or full payment-card details.',
		] },
		{ heading: 'Prepare before deletion', steps: [
			'Open Billing & Subscription and cancel any active paid subscription through Stripe.',
			'Wait until the account no longer has an active subscription if deletion remains blocked during the paid period.',
			'Create any reports or CSV exports you want to retain outside Maintley.',
			'Download important documents, invoices, warranties, photos, and service records.',
			'Review family or team access so other people understand that the shared account data will no longer remain available.',
			'Open Profile, begin account deletion, and complete the displayed confirmation exactly as requested.',
		] },
		{ heading: 'What deletion means', paragraphs: [
			'Canceling a subscription does not delete the account. Deleting the account initiates removal of the account data handled by Maintley and cannot be treated as a reversible way to pause billing. Exported or downloaded copies remain wherever you stored or shared them and must be managed separately.',
			'Only delete your own account. If you are part of another person’s account and only want to stop participating, ask the account owner to remove your family or team access instead of attempting to delete shared property history.',
		] },
		{ heading: 'Troubleshooting', tips: [
			'If deletion reports an active subscription, cancel billing first and return after the subscription state synchronizes.',
			'If you cannot sign in, recover access before attempting deletion so ownership can be verified.',
			'If you need only a copy of your information, use Reports and file downloads instead of deleting the account.',
			'Contact Support before deletion if account ownership or shared-data consequences are unclear.',
		] },
	],
	relatedGuideSlugs: ['manage-stripe-billing-and-subscriptions', 'reports-and-property-exports', 'work-with-family-and-team-members'],
};
