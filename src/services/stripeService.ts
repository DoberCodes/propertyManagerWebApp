/**
 * Stripe Payment Service
 * Handles Stripe integration, checkout sessions, and subscription management
 */

import { STRIPE_PUBLIC_KEY, STRIPE_CHECKOUT_CONFIG } from '../constants/stripe';
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripeInstance: Stripe | null = null;

/**
 * Initialize Stripe with public key
 */
export const initializeStripe = async (): Promise<Stripe | null> => {
	if (stripeInstance) {
		return stripeInstance;
	}

	if (!STRIPE_PUBLIC_KEY) {
		console.warn('Stripe public key not configured');
		return null;
	}

	try {
		stripeInstance = await loadStripe(STRIPE_PUBLIC_KEY);
		return stripeInstance;
	} catch (error) {
		console.error('Failed to initialize Stripe:', error);
		return null;
	}
};

/**
 * Create Stripe Checkout Session
 * Initiates a checkout session for subscription upgrade
 */
export const createCheckoutSession = async (
	priceId: string,
	userId: string,
	email: string,
): Promise<string> => {
	try {
		// Call backend function to create checkout session
		const response = await fetch('/api/create-checkout-session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				priceId,
				userId,
				email,
				successUrl: STRIPE_CHECKOUT_CONFIG.SUCCESS_URL,
				cancelUrl: STRIPE_CHECKOUT_CONFIG.CANCEL_URL,
			}),
		});

		const { url } = await response.json();
		if (!url) {
			throw new Error('Checkout session URL not returned');
		}
		return url;
	} catch (error) {
		console.error('Failed to create checkout session:', error);
		throw error;
	}
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = (checkoutUrl: string) => {
	window.location.assign(checkoutUrl);
};

/**
 * Handle successful checkout
 * Verifies the session and updates user subscription
 */
export const handleCheckoutSuccess = async (sessionId: string) => {
	try {
		// Call backend to verify session and update subscription
		const response = await fetch('/api/verify-checkout-session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ sessionId }),
		});

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Failed to verify checkout session:', error);
		throw error;
	}
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId: string) => {
	try {
		const response = await fetch('/api/cancel-subscription', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ subscriptionId }),
		});

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Failed to cancel subscription:', error);
		throw error;
	}
};

/**
 * Get subscription details from Stripe
 */
export const getSubscriptionDetails = async (subscriptionId: string) => {
	try {
		const response = await fetch(`/api/subscription-details/${subscriptionId}`);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Failed to get subscription details:', error);
		throw error;
	}
};

/**
 * Handle Stripe webhook events (server-side)
 * This would typically be in your backend but included here for reference
 */
export const handleStripeWebhook = async (event: any) => {
	switch (event.type) {
		case 'customer.subscription.updated':
			// Handle subscription update
			console.log('Subscription updated:', event.data.object);
			break;

		case 'customer.subscription.deleted':
			// Handle subscription cancellation
			console.log('Subscription deleted:', event.data.object);
			break;

		case 'invoice.payment_succeeded':
			// Handle successful payment
			console.log('Payment succeeded:', event.data.object);
			break;

		case 'invoice.payment_failed':
			// Handle failed payment
			console.log('Payment failed:', event.data.object);
			break;

		default:
			console.log('Unhandled Stripe event type:', event.type);
	}
};
