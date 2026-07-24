/**
 * Stripe Payment Service
 * Handles Stripe integration, checkout sessions, and subscription management
 */

import { STRIPE_PUBLIC_KEY, STRIPE_CHECKOUT_CONFIG } from '../constants/stripe';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { callFirebaseFunction } from '../config/firebaseFunctions';

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
		code.includes('deadline-exceeded') ||
		rawMessage.includes('timed out') ||
		rawMessage.includes('timeout') ||
		rawMessage.includes('network') ||
		rawMessage.includes('failed to fetch')
	) {
		return 'Secure checkout took too long to respond. Please check your connection and try again.';
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
	billingCycle: 'month' | 'year' = 'month',
): Promise<string> => {
	try {
		const result = await callFirebaseFunction<
			Record<string, unknown>,
			{
				sessionId?: string;
				url?: string;
				subscriptionUpdated?: boolean;
			}
		>('createCheckoutSession', {
			// Current clients identify the product by stable plan and billing-cycle IDs.
			// priceId is sent only for the time-bounded older-client compatibility path.
			...(!planId && priceId ? { priceId } : {}),
			...(planId ? { planId } : {}),
			billingCycle,
			userId,
			email,
			successUrl: STRIPE_CHECKOUT_CONFIG.SUCCESS_URL,
			cancelUrl: STRIPE_CHECKOUT_CONFIG.CANCEL_URL,
			...(trialEnd && { trialEnd }),
			...(promoCode && { promoCode }),
		}, { timeout: 30_000 });
		const data = result.data;
		if (data.subscriptionUpdated) {
			return '';
		}
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
		const result = await callFirebaseFunction<
			{ promoCode: string },
			PromoValidationResult
		>('validatePromotionCode', { promoCode: trimmedPromoCode });
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
		const result = await callFirebaseFunction<{ sessionId: string }, unknown>(
			'verifyCheckoutSession',
			{ sessionId },
		);

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
		const result = await callFirebaseFunction<{ subscriptionId: string }, unknown>(
			'cancelSubscription',
			{ subscriptionId },
		);
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
		const result = await callFirebaseFunction<{ subscriptionId: string }, unknown>(
			'getSubscriptionDetails',
			{ subscriptionId },
		);
		return result.data;
	} catch (error) {
		console.error('Failed to get subscription details:', error);
		throw error;
	}
};

export const syncSubscriptionFromStripe = async () => {
	try {
		const result = await callFirebaseFunction<Record<string, never>, unknown>(
			'syncSubscriptionFromStripe',
			{},
		);
		return result.data;
	} catch (error) {
		console.error('Failed to sync subscription from Stripe:', error);
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
			break;

		case 'customer.subscription.deleted':
			// Handle subscription cancellation
			break;

		case 'invoice.payment_succeeded':
			// Handle successful payment
			break;

		case 'invoice.payment_failed':
			// Handle failed payment
			break;

		default:
			break;
	}
};
