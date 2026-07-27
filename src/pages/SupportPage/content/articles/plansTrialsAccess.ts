import type { HelpfulArticle } from '../types';

export const plansTrialsAccessArticle: HelpfulArticle = {
	slug: 'plans-trials-and-complimentary-access',
	title: 'Understand plans, trials, and complimentary access',
	summary: 'See how your base plan, temporary access, and paid continuation work together.',
	path: '/settings?category=account',
	actionLabel: 'Open Billing & Subscription',
	introduction: 'Your base plan determines standard access. An eligible trial or complimentary grant may temporarily add capabilities without changing who owns the account or automatically creating a paid subscription.',
	sections: [
		{ heading: 'Know the three kinds of access', paragraphs: [
			'A Free or paid plan is the account’s base subscription level. A product trial is time-limited access issued by Maintley under a specific eligibility program. Complimentary access can come from an approved access code or another Maintley grant. The Billing & Subscription area shows the access level, end date, and transition information available for your account.',
			'The eligible first-property Homeowner+ trial lasts 30 days and does not require a payment method. It does not create a Stripe customer, subscription, schedule, or automatic charge. Other promotional access may have different transition terms, so review the displayed explanation before activating it.',
		] },
		{ heading: 'Activate and review access', steps: [
			'Open Billing & Subscription and review your current base plan and resolved access.',
			'If you have an access code, enter it and review the preview before activation.',
			'Confirm the access level, duration, eligible account, and what happens at the end.',
			'Activate only after the transition explanation matches what you expect.',
			'Return to Billing & Subscription at any time to review the active period and paid options.',
		] },
		{ heading: 'What happens next', paragraphs: [
			'When complimentary access activates, included features become available until the stated end time. Your underlying base plan remains identifiable, and saved property records stay associated with the account. Access without a Stripe billing relationship does not charge automatically; continuing afterward requires intentional checkout.',
			'If an offer explicitly includes a Stripe billing transition, Maintley should show the scheduled first charge and provide a billing-management path before the complimentary period ends. Choosing a higher paid plan may start billing immediately, while an equivalent covered plan may begin billing after the complimentary period. The server and Stripe determine the authoritative timing shown during checkout.',
		] },
		{ heading: 'Common questions and troubleshooting', tips: [
			'A pending checkout does not provide paid access until Stripe confirms the subscription.',
			'An expired or already-used code cannot be activated again unless its stated rules allow it.',
			'If access looks wrong after activation, refresh Billing & Subscription before attempting the code again.',
			'Team members cannot activate or manage billing for the account owner.',
			'Contact Support if the shown end date or access level differs from the activation preview.',
		] },
	],
	relatedGuideSlugs: ['manage-stripe-billing-and-subscriptions', 'what-happens-after-a-downgrade'],
};
