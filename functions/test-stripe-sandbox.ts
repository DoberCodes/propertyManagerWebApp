/**
 * Stripe Sandbox Smoke Test
 *
 * Verifies test-mode Stripe connectivity and checkout-session creation.
 * Run with: npm --prefix functions run test:sandbox
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

const stripePriceId =
	process.env.STRIPE_TEST_PRICE_ID ||
	process.env.REACT_APP_STRIPE_HOMEOWNER_PLAN_ID ||
	process.env.REACT_APP_STRIPE_BASIC_PLAN_ID ||
	process.env.REACT_APP_STRIPE_PROFESSIONAL_PLAN_ID ||
	'';

const assertEnv = () => {
	if (!stripeSecretKey) {
		throw new Error(
			'Missing STRIPE_SECRET_KEY (or STRIPE_TEST_SECRET_KEY). Add your Stripe test secret key.',
		);
	}

	if (!stripeSecretKey.startsWith('sk_test_')) {
		throw new Error(
			'STRIPE_SECRET_KEY must be a Stripe TEST key (sk_test_...) for sandbox testing.',
		);
	}

	if (!stripePriceId) {
		throw new Error(
			'Missing test price id. Set STRIPE_TEST_PRICE_ID or REACT_APP_STRIPE_*_PLAN_ID.',
		);
	}
};

const run = async () => {
	assertEnv();

	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: '2023-10-16',
	});

	let customerId: string | null = null;

	try {
		console.log('🧪 Starting Stripe sandbox smoke test...');

		const customer = await stripe.customers.create({
			email: `sandbox-test-${Date.now()}@maintley-test.com`,
			metadata: { source: 'stripe-sandbox-smoke-test' },
		});
		customerId = customer.id;
		console.log(`✅ Created test customer: ${customerId}`);

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customer.id,
			line_items: [
				{
					price: stripePriceId,
					quantity: 1,
				},
			],
			success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
			cancel_url: 'https://example.com/cancel',
		});

		if (!session.url || !/checkout\.stripe\.com|billing\.stripe\.com/i.test(session.url)) {
			throw new Error('Checkout session did not return a valid Stripe checkout URL.');
		}

		console.log(`✅ Created checkout session: ${session.id}`);
		console.log(`✅ Checkout URL: ${session.url}`);

		const fetchedSession = await stripe.checkout.sessions.retrieve(session.id);
		if (fetchedSession.customer !== customer.id) {
			throw new Error('Retrieved checkout session does not match created customer.');
		}

		console.log('✅ Retrieved checkout session and verified customer binding.');
		console.log('🎉 Stripe sandbox smoke test passed.');
	} finally {
		if (customerId) {
			try {
				await stripe.customers.del(customerId);
				console.log(`🧹 Cleaned up test customer: ${customerId}`);
			} catch (cleanupError) {
				console.warn(
					`⚠️ Could not delete test customer ${customerId}. Manual cleanup may be required.`,
				);
				console.warn(cleanupError);
			}
		}
	}
};

run().catch((error) => {
	console.error('❌ Stripe sandbox smoke test failed:');
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
