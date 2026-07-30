const assert = require('node:assert/strict');
const test = require('node:test');

const {
	buildStripeBillingDisclosure,
} = require('./lib/stripeBillingDisclosure.js');

const makeSubscription = (overrides = {}) => ({
	id: 'sub_portfolio',
	status: 'active',
	customer: 'cus_owner',
	current_period_end: 1798761600,
	cancel_at_period_end: false,
	items: {
		data: [
			{
				quantity: 1,
				price: {
					id: 'price_portfolio',
					product: 'prod_portfolio',
					currency: 'usd',
					unit_amount: 2399,
					recurring: { interval: 'month', interval_count: 1 },
				},
			},
		],
	},
	discounts: [
		{
			id: 'di_forever',
			start: 1721779200,
			end: null,
			coupon: {
				id: 'coupon_demo',
				name: 'Demo access',
				percent_off: 100,
				amount_off: null,
				currency: null,
				duration: 'forever',
				duration_in_months: null,
			},
		},
	],
	...overrides,
});

test('projects authoritative Stripe pricing, discount, and next invoice facts', async () => {
	const calls = [];
	const stripe = {
		invoices: {
			retrieveUpcoming: async (request) => {
				calls.push(request);
				return {
					amount_due: 0,
					currency: 'usd',
					next_payment_attempt: 1798761600,
					period_end: 1798761600,
				};
			},
		},
	};

	const result = await buildStripeBillingDisclosure(
		stripe,
		makeSubscription(),
	);

	assert.deepEqual(calls, [
		{ customer: 'cus_owner', subscription: 'sub_portfolio' },
	]);
	assert.equal(result.source, 'stripe');
	assert.equal(result.listAmountMinor, 2399);
	assert.equal(result.discount.percentOff, 100);
	assert.equal(result.discount.duration, 'forever');
	assert.equal(result.nextInvoice.amountDueMinor, 0);
	assert.equal(result.cancelAtPeriodEnd, false);
});

test('retains subscription facts when Stripe has no upcoming invoice', async () => {
	const stripe = {
		invoices: {
			retrieveUpcoming: async () => {
				throw new Error('No upcoming invoices');
			},
		},
	};

	const result = await buildStripeBillingDisclosure(
		stripe,
		makeSubscription({ cancel_at_period_end: true }),
	);

	assert.equal(result.status, 'active');
	assert.equal(result.cancelAtPeriodEnd, true);
	assert.equal(result.nextInvoice, null);
});
