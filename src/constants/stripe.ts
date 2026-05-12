/**
 * Stripe Configuration and Constants
 * Environment-specific configuration for Stripe integration
 * Uses environment variables from .env and .env.local files
 */

// Stripe Public Key - from environment variables
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

// Stripe Plan IDs (from Stripe Dashboard)
export const STRIPE_PLANS = {
	FREE: process.env.REACT_APP_STRIPE_FREE_PLAN_ID || 'price_free',
	HOME: process.env.REACT_APP_STRIPE_HOME_PLAN_ID || 'price_home',
	PROPERTY: process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID || 'price_property',
	PORTFOLIO:
		process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID || 'price_portfolio',
	// Backward compatibility - legacy names
	HOMEOWNER: process.env.REACT_APP_STRIPE_HOME_PLAN_ID || 'price_home',
	BASIC: process.env.REACT_APP_STRIPE_PROPERTY_PLAN_ID || 'price_property',
	PROFESSIONAL:
		process.env.REACT_APP_STRIPE_PORTFOLIO_PLAN_ID || 'price_portfolio',
};

// Price mapping for display
export const STRIPE_PRICES = {
	FREE: 0,
	HOME: 9,
	PROPERTY: 9,
	PORTFOLIO: 24,
	// Backward compatibility
	HOMEOWNER: 9,
	BASIC: 9,
	PROFESSIONAL: 24,
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
