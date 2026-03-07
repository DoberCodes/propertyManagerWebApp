/**
 * Stripe Webhook Sandbox Smoke Test
 *
 * Verifies that a signed Stripe webhook event is accepted by the webhook endpoint.
 * Run with: npm --prefix functions run test:webhook:sandbox
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

const loadLocalEnv = () => {
	dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });
	dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });
};

loadLocalEnv();

const stripeSecretKey =
	process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const webhookUrl = process.env.STRIPE_WEBHOOK_TEST_URL || '';

const assertEnv = () => {
	if (!stripeSecretKey) {
		throw new Error(
			'Missing STRIPE_SECRET_KEY (or STRIPE_TEST_SECRET_KEY). Add your Stripe test secret key.',
		);
	}

	if (!stripeSecretKey.startsWith('sk_test_')) {
		throw new Error(
			'STRIPE_SECRET_KEY must be a Stripe TEST key (sk_test_...) for sandbox webhook testing.',
		);
	}

	if (!webhookSecret) {
		throw new Error(
			'Missing STRIPE_WEBHOOK_SECRET. Add your Stripe webhook signing secret from test mode.',
		);
	}

	if (!webhookUrl) {
		throw new Error(
			'Missing STRIPE_WEBHOOK_TEST_URL. Set it to your webhook endpoint (for example: https://us-central1-<project>.cloudfunctions.net/stripeWebhook).',
		);
	}
};

const run = async () => {
	assertEnv();

	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: '2023-10-16',
	});

	const fakeCustomerId = `cus_test_webhook_${Date.now()}`;
	const fakeSubscriptionId = `sub_test_webhook_${Date.now()}`;
	const eventPayload = {
		id: `evt_test_webhook_${Date.now()}`,
		object: 'event',
		api_version: '2023-10-16',
		created: Math.floor(Date.now() / 1000),
		data: {
			object: {
				id: fakeSubscriptionId,
				object: 'subscription',
				customer: fakeCustomerId,
				status: 'active',
				current_period_start: Math.floor(Date.now() / 1000),
				current_period_end: Math.floor(Date.now() / 1000) + 2592000,
				trial_end: null,
				items: {
					data: [
						{
							price: {
								id: process.env.STRIPE_TEST_PRICE_ID ||
									process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID ||
									'price_homeowner',
							},
						},
					],
				},
			},
		},
		type: 'customer.subscription.updated',
		livemode: false,
		pending_webhooks: 1,
		request: {
			id: null,
			idempotency_key: null,
		},
	};

	const rawBody = JSON.stringify(eventPayload);
	const header = stripe.webhooks.generateTestHeaderString({
		payload: rawBody,
		secret: webhookSecret,
	});

	console.log('🧪 Sending signed Stripe webhook sandbox event...');
	console.log(`➡️  Endpoint: ${webhookUrl}`);

	const response = await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'stripe-signature': header,
		},
		body: rawBody,
	});

	const responseText = await response.text();

	if (!response.ok) {
		throw new Error(
			`Webhook endpoint returned ${response.status}. Body: ${responseText}`,
		);
	}

	if (!responseText.includes('received')) {
		console.warn(
			'⚠️ Webhook endpoint responded without explicit "received" payload. Verify logs for event handling details.',
		);
	}

	console.log('✅ Webhook endpoint accepted signed sandbox event.');
	console.log('🎉 Stripe webhook sandbox smoke test passed.');
};

run().catch((error) => {
	console.error('❌ Stripe webhook sandbox smoke test failed:');
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
