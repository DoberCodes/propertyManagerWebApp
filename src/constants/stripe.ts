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
	FREE:
		process.env.REACT_APP_STRIPE_FREE_PLAN_ID ||
		process.env.REACT_APP_STRIPE_FREE_PRICE_ID ||
		'price_free',
	HOME:
		process.env.REACT_APP_STRIPE_HOME_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOME_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_HOME_PRICE_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PRICE_ID ||
		'price_home',
	HOMEOWNER_PLUS:
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PRICE_ID ||
		'price_homeowner_plus',
	PROPERTY:
		process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PROPERTY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_BASIC_PLAN_ID ||
		process.env.REACT_APP_STRIPE_BASIC_PRICE_ID ||
		'price_property',
	PORTFOLIO:
		process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PORTFOLIO_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PROFESSIONAL_PRICE_ID ||
		'price_portfolio',
	// Backward compatibility - legacy names
	HOMEOWNER:
		process.env.REACT_APP_STRIPE_HOME_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOME_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_HOME_PRICE_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID ||
		process.env.REACT_APP_STRIPE_HOMEOWNER_PRICE_ID ||
		'price_home',
	BASIC:
		process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PROPERTY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_BASIC_PLAN_ID ||
		process.env.REACT_APP_STRIPE_BASIC_PRICE_ID ||
		'price_property',
	PROFESSIONAL:
		process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PORTFOLIO_PRICE_ID ||
		process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID ||
		process.env.REACT_APP_STRIPE_PROFESSIONAL_PRICE_ID ||
		'price_portfolio',
};

const STRIPE_PLAN_PRICE_IDS = {
	free: {
		month:
			process.env.REACT_APP_STRIPE_FREE_PLAN_ID ||
			process.env.REACT_APP_STRIPE_FREE_PRICE_ID ||
			'price_free',
		year:
			process.env.REACT_APP_STRIPE_FREE_PLAN_ID ||
			process.env.REACT_APP_STRIPE_FREE_PRICE_ID ||
			'price_free',
	},
	home: {
		month:
			process.env.REACT_APP_STRIPE_HOME_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOME_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_HOME_PRICE_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PRICE_ID ||
			'price_home',
		year:
			process.env.REACT_APP_STRIPE_HOME_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOME_ANNUAL_PRICE_ID ||
			'',
	},
	homeowner_plus: {
		month:
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_PRICE_ID ||
			'price_homeowner_plus',
		year:
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID ||
			'price_homeowner_plus_annual',
	},
	property: {
		month:
			process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_BASIC_PLAN_ID ||
			process.env.REACT_APP_STRIPE_BASIC_PRICE_ID ||
			'price_property',
		year:
			process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PROPERTY_ANNUAL_PRICE_ID ||
			'price_property_annual',
	},
	portfolio: {
		month:
			process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_MONTHLY_PRICE_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_PRICE_ID ||
			process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PROFESSIONAL_PRICE_ID ||
			'price_portfolio',
		year:
			process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID ||
			process.env.REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PRICE_ID ||
			'price_portfolio_annual',
	},
};

export const getStripePriceIdForPlan = (
	planId: string,
	billingCycle: BillingCycle = 'month',
): string => {
	const normalizedPlan = String(planId || '').trim().toLowerCase();
	const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';

	const planAliases: Record<string, keyof typeof STRIPE_PLAN_PRICE_IDS> = {
		free: 'free',
		guest: 'free',
		tenant: 'free',
		home: 'home',
		homeowner: 'home',
		homeowner_plus: 'homeowner_plus',
		homeownerplus: 'homeowner_plus',
		'homeowner+': 'homeowner_plus',
		property: 'property',
		basic: 'property',
		portfolio: 'portfolio',
		professional: 'portfolio',
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
	FREE: 0,
	HOME: 0,
	HOMEOWNER_PLUS: 3.99,
	PROPERTY: 8.99,
	PORTFOLIO: 23.99,
	// Backward compatibility
	HOMEOWNER: 0,
	BASIC: 8.99,
	PROFESSIONAL: 23.99,
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
	SUCCESS_URL: `${window.location.origin}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
	CANCEL_URL: `${window.location.origin}/#/paywall`,
};
