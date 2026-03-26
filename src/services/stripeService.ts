/**
 * Stripe Payment Service
 * Handles Stripe integration, checkout sessions, and subscription management
 */

import { STRIPE_PUBLIC_KEY, STRIPE_CHECKOUT_CONFIG } from '../constants/stripe';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

let stripeInstance: Stripe | null = null;

const mapCheckoutErrorMessage = (error: unknown): string => {
	const e = error as {
		message?: string;
		code?: string;
		details?: unknown;
	};

	const rawMessage = (e?.message || '').toLowerCase();
	const code = e?.code || '';

	if (rawMessage.includes('err_blocked_by_client')) {
		return 'A browser extension blocked the payment request. Please disable ad/privacy blockers for this site and try again.';
	}

	if (rawMessage.includes('no such price')) {
		return 'This plan is temporarily unavailable due to a billing configuration issue. Please contact support.';
	}

	if (
		rawMessage.includes('invalid api key') ||
		rawMessage.includes('stripe secret key is invalid') ||
		rawMessage.includes('stripe secret key is not configured')
	) {
		return 'Billing is temporarily unavailable due to a payment configuration issue. Please try again shortly.';
	}

	if (code.includes('unauthenticated')) {
		return 'Your session has expired. Please sign in again and retry payment.';
	}

	if (code.includes('failed-precondition')) {
		return 'Billing setup is incomplete for this plan. Please contact support.';
	}

	if (
		code.includes('unavailable') ||
		rawMessage.includes('network') ||
		rawMessage.includes('failed to fetch')
	) {
		return 'Unable to reach the payment service right now. Please check your connection and try again.';
	}

	return 'Unable to start checkout right now. Please try again in a moment.';
};

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

	// Log if using test keys
	if (STRIPE_PUBLIC_KEY.includes('pk_test_')) {
		console.log('📌 Using Stripe TEST mode (localhost development)');
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
	trialEnd?: number,
	promoCode?: string,
	planId?: string,
): Promise<string> => {
	try {
		// Call Firebase Cloud Function
		const createCheckout = httpsCallable(functions, 'createCheckoutSession');
		const result = await createCheckout({
			priceId,
			...(planId ? { planId } : {}),
			userId,
			email,
			successUrl: STRIPE_CHECKOUT_CONFIG.SUCCESS_URL,
			cancelUrl: STRIPE_CHECKOUT_CONFIG.CANCEL_URL,
			...(trialEnd && { trialEnd }),
			...(promoCode && { promoCode }),
		});

		const data = result.data as { sessionId: string; url: string };
		if (!data.url) {
			throw new Error('Checkout session URL not returned');
		}
		return data.url;
	} catch (error) {
		console.error('Failed to create checkout session:', error);
		throw new Error(mapCheckoutErrorMessage(error));
	}
};

export interface PromoValidationResult {
	valid: boolean;
	code: string;
	message?: string;
	promotionCodeId?: string | null;
	couponId?: string | null;
}

export const validatePromotionCode = async (
	promoCode: string,
): Promise<PromoValidationResult> => {
	const trimmedPromoCode = promoCode.trim().toLowerCase();
	if (!trimmedPromoCode) {
		return {
			valid: false,
			code: '',
			message: 'Please enter a promo code',
		};
	}

	try {
		const validatePromo = httpsCallable(functions, 'validatePromotionCode');
		const result = await validatePromo({ promoCode: trimmedPromoCode });
		return result.data as PromoValidationResult;
	} catch (error) {
		console.error('Failed to validate promo code:', error);
		throw new Error(mapCheckoutErrorMessage(error));
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
		// Call Firebase Cloud Function
		const verifyCheckout = httpsCallable(functions, 'verifyCheckoutSession');
		const result = await verifyCheckout({ sessionId });

		return result.data;
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
		const cancel = httpsCallable(functions, 'cancelSubscription');
		const result = await cancel({ subscriptionId });
		return result.data;
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
		const getDetails = httpsCallable(functions, 'getSubscriptionDetails');
		const result = await getDetails({ subscriptionId });
		return result.data;
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
