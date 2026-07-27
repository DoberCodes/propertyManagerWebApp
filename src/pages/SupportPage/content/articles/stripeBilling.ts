import type { HelpfulArticle } from '../types';

export const stripeBillingArticle: HelpfulArticle = {
	slug: 'manage-stripe-billing-and-subscriptions',
	title: 'Manage Stripe billing and subscriptions',
	summary: 'Start, review, update, or cancel paid billing through Maintley and Stripe.',
	path: '/settings?category=account',
	actionLabel: 'Open Billing & Subscription',
	introduction: 'Maintley uses Stripe for paid subscriptions. The account owner starts checkout from Maintley and uses the Stripe-hosted billing portal for payment methods, invoices, and cancellation.',
	sections: [
		{ heading: 'When to use billing settings', paragraphs: [
			'Open Billing & Subscription when you want to compare plans, begin an intentional paid checkout, review the current subscription, or open Stripe to manage billing. Only the account owner controls the subscription. Family members may share the account, but team members and residents do not own or manage its Stripe relationship.',
		] },
		{ heading: 'Start or manage a subscription', steps: [
			'Confirm that you are signed in as the account owner and review the current access summary.',
			'Choose the plan and billing interval that fit the account, then read the price and timing shown before continuing.',
			'Complete payment details in Stripe Checkout. Paid access begins only after Stripe confirms the subscription.',
			'To change payment details, review invoices, or cancel, return to Billing & Subscription and open the Stripe billing portal.',
			'After making a change in Stripe, return to Maintley and allow the subscription status to synchronize.',
		] },
		{ heading: 'What cancellation means', paragraphs: [
			'Canceling normally schedules the subscription to end after the already-paid billing period. It does not automatically delete the Maintley account or its records. The billing screen and Stripe portal should show the effective end date. After paid access ends, the account resolves to any remaining valid access, otherwise to Free.',
			'If checkout is interrupted, no paid access is assumed. You may resume the pending checkout when offered or continue using Maintley on the access currently confirmed for the account.',
		] },
		{ heading: 'Troubleshooting', tips: [
			'If Maintley and Stripe briefly show different states, wait for synchronization and refresh Billing & Subscription.',
			'If Stripe already shows an active subscription, allow it to synchronize before starting another checkout.',
			'Use Support when Stripe confirms payment but Maintley does not show the corresponding access after refresh.',
			'Cancel the active subscription before attempting to delete the account.',
			'Never send full card information in a support request.',
		] },
	],
	relatedGuideSlugs: ['plans-trials-and-complimentary-access', 'what-happens-after-a-downgrade', 'account-security-and-deletion'],
};
