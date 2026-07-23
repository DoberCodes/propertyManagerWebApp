/**
 * Stripe Configuration and Constants
 * Environment-specific configuration for Stripe integration
 * Uses environment variables from .env and .env.local files
 */

// Stripe Public Key - from environment variables
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

export type BillingCycle = 'month' | 'year';

// Stripe Plan IDs (from Stripe Dashboard)
export const STRIPE_PLANS = {
	HOMEOWNER: '',
	HOMEOWNER_PLUS:
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PRICE_ID ||
		'',
	MULTI_HOMEOWNER:
		process.env.REACT_APP_STRIPE_MULTI_HOMEOWNER_MONTHLY_PRICE_ID || '',
	PROPERTY:
		process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PROPERTY_PRICE_ID ||
		'',
	PORTFOLIO:
		process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PORTFOLIO_PRICE_ID ||
		'',
};

const STRIPE_PLAN_PRICE_IDS = {
	homeowner: {
		month: '',
		year: '',
	},
	homeowner_plus: {
		month:
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PRICE_ID ||
			'',
		year:
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID ||
			'',
	},
	multi_homeowner: {
		month:
			process.env.REACT_APP_STRIPE_MULTI_HOMEOWNER_MONTHLY_PRICE_ID || '',
		year:
			process.env.REACT_APP_STRIPE_MULTI_HOMEOWNER_ANNUAL_PRICE_ID || '',
	},
	property: {
		month:
			process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_PRICE_ID ||
			'',
		year:
			process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PRICE_ID ||
			'',
	},
	portfolio: {
		month:
			process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_PRICE_ID ||
			'',
		year:
			process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PRICE_ID ||
			'',
	},
};

export const getStripePriceIdForPlan = (
	planId: string,
	billingCycle: BillingCycle = 'month',
): string => {
	const normalizedPlan = String(planId || '').trim().toLowerCase();
	const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';

	const planAliases: Record<string, keyof typeof STRIPE_PLAN_PRICE_IDS> = {
		homeowner: 'homeowner',
		homeowner_plus: 'homeowner_plus',
		multi_homeowner: 'multi_homeowner',
		property: 'property',
		portfolio: 'portfolio',
	};

	const resolvedPlan = planAliases[normalizedPlan];
	if (!resolvedPlan) return '';

	return (
		STRIPE_PLAN_PRICE_IDS[resolvedPlan][normalizedCycle] ||
		STRIPE_PLAN_PRICE_IDS[resolvedPlan].month ||
		''
	);
};

// Price mapping for display
export const STRIPE_PRICES = {
	HOMEOWNER: 0,
	HOMEOWNER_PLUS: 3.99,
	MULTI_HOMEOWNER: 5.99,
	PROPERTY: 8.99,
	PORTFOLIO: 23.99,
};

// Billing intervals
export const BILLING_INTERVALS = {
	MONTHLY: 'month',
	YEARLY: 'year',
	CUSTOM: 'custom',
};

// Stripe checkout session config
export const STRIPE_CHECKOUT_CONFIG = {
	MODE: 'subscription',
	SUCCESS_URL: `${window.location.origin}/#/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
	CANCEL_URL: `${window.location.origin}/#/paywall?checkout=cancelled`,
};
