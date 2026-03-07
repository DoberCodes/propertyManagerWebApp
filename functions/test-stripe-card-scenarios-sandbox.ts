/**
 * Stripe Card Scenarios Sandbox Test
 *
 * Validates card behavior matrix in Stripe test mode using PaymentIntents.
 * Run with: npm --prefix functions run test:cards:sandbox
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

type ScenarioExpectation =
	| { outcome: 'succeeded' }
	| { outcome: 'requires_action' }
	| { outcome: 'card_error'; code?: string };

interface CardScenario {
	name: string;
	paymentMethod: string;
	expectation: ScenarioExpectation;
}

const loadLocalEnv = () => {
	dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });
	dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });
};

loadLocalEnv();

const stripeSecretKey =
	process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY || '';

const assertEnv = () => {
	if (!stripeSecretKey) {
		throw new Error(
			'Missing STRIPE_SECRET_KEY (or STRIPE_TEST_SECRET_KEY). Add your Stripe test secret key.',
		);
	}

	if (!stripeSecretKey.startsWith('sk_test_')) {
		throw new Error(
			'STRIPE_SECRET_KEY must be a Stripe TEST key (sk_test_...) for card scenario testing.',
		);
	}
};

const scenarios: CardScenario[] = [
	{
		name: 'Visa success (pm_card_visa)',
		paymentMethod: 'pm_card_visa',
		expectation: { outcome: 'succeeded' },
	},
	{
		name: 'Mastercard success (pm_card_mastercard)',
		paymentMethod: 'pm_card_mastercard',
		expectation: { outcome: 'succeeded' },
	},
	{
		name: 'Authentication required (pm_card_authenticationRequired)',
		paymentMethod: 'pm_card_authenticationRequired',
		expectation: { outcome: 'requires_action' },
	},
	{
		name: 'Declined generic (pm_card_chargeDeclined)',
		paymentMethod: 'pm_card_chargeDeclined',
		expectation: { outcome: 'card_error', code: 'card_declined' },
	},
	{
		name: 'Declined insufficient funds (pm_card_chargeDeclinedInsufficientFunds)',
		paymentMethod: 'pm_card_chargeDeclinedInsufficientFunds',
		expectation: { outcome: 'card_error', code: 'card_declined' },
	},
];

const runScenario = async (stripe: Stripe, scenario: CardScenario) => {
	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: 1099,
			currency: 'usd',
			confirm: true,
			payment_method: scenario.paymentMethod,
			payment_method_types: ['card'],
			description: `Sandbox card scenario: ${scenario.name}`,
			metadata: {
				source: 'stripe-card-scenarios-sandbox-test',
				scenario: scenario.name,
			},
		});

		if (scenario.expectation.outcome === 'succeeded') {
			if (paymentIntent.status !== 'succeeded') {
				throw new Error(
					`Expected succeeded, got ${paymentIntent.status} for ${scenario.name}`,
				);
			}
			console.log(`✅ ${scenario.name}: succeeded`);
			return;
		}

		if (scenario.expectation.outcome === 'requires_action') {
			if (paymentIntent.status !== 'requires_action') {
				throw new Error(
					`Expected requires_action, got ${paymentIntent.status} for ${scenario.name}`,
				);
			}
			console.log(`✅ ${scenario.name}: requires_action as expected`);
			return;
		}

		throw new Error(
			`Expected card_error for ${scenario.name}, but PaymentIntent was created with status ${paymentIntent.status}`,
		);
	} catch (error) {
		if (scenario.expectation.outcome !== 'card_error') {
			throw error;
		}

		const stripeErr = error as Stripe.errors.StripeError;
		const errorCode = stripeErr?.code || '';
		const expectedCode = scenario.expectation.code;

		if (expectedCode && errorCode !== expectedCode) {
			throw new Error(
				`Expected error code ${expectedCode}, got ${errorCode || 'unknown'} for ${scenario.name}`,
			);
		}

		console.log(
			`✅ ${scenario.name}: card_error as expected (${errorCode || 'no code'})`,
		);
	}
};

const run = async () => {
	assertEnv();

	const stripe = new Stripe(stripeSecretKey, {
		apiVersion: '2023-10-16',
	});

	console.log('🧪 Starting Stripe card scenario sandbox test...');

	for (const scenario of scenarios) {
		await runScenario(stripe, scenario);
	}

	console.log('🎉 Stripe card scenario sandbox test passed.');
};

run().catch((error) => {
	console.error('❌ Stripe card scenario sandbox test failed:');
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
