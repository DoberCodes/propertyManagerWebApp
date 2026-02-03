/**
 * Stripe Configuration and Constants
 * Environment-specific configuration for Stripe integration
 */

// Stripe Public Key - from environment variables
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

// Stripe Plan IDs (from Stripe Dashboard)
export const STRIPE_PLANS = {
	FREE: 'price_free', // Free trial - no Stripe plan needed
	BASIC: process.env.REACT_APP_STRIPE_BASIC_PLAN_ID || 'price_basic',
	PROFESSIONAL:
		process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID || 'price_professional',
	ENTERPRISE:
		process.env.REACT_APP_STRIPE_ENTERPRISE_PLAN_ID || 'price_enterprise',
};

// Price mapping for display
export const STRIPE_PRICES = {
	FREE: 2,
	BASIC: 9,
	PROFESSIONAL: 16,
	ENTERPRISE: 0, // Custom pricing
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
