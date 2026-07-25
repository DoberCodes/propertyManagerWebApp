const assert = require('node:assert/strict');
const test = require('node:test');

const {
	selectCustomerSubscription,
} = require('./lib/stripeSubscriptionSelection.js');

const subscription = (id, status, created = 1) => ({ id, status, created });

test('selects a new current subscription over the stored cancelled subscription', () => {
	const result = selectCustomerSubscription(
		[
			subscription('sub_old', 'canceled', 1),
			subscription('sub_portfolio', 'active', 2),
		],
		'sub_old',
	);

	assert.equal(result.kind, 'selected');
	assert.equal(result.subscription.id, 'sub_portfolio');
});

test('selects the only current subscription even when no ID is stored', () => {
	const result = selectCustomerSubscription(
		[subscription('sub_portfolio', 'trialing')],
		'',
	);

	assert.equal(result.kind, 'selected');
	assert.equal(result.subscription.id, 'sub_portfolio');
});

test('returns an explicit conflict for multiple current subscriptions', () => {
	const result = selectCustomerSubscription(
		[
			subscription('sub_homeowner_plus', 'active'),
			subscription('sub_portfolio', 'active'),
		],
		'sub_homeowner_plus',
	);

	assert.equal(result.kind, 'conflict');
	assert.deepEqual(
		result.subscriptions.map((item) => item.id),
		['sub_homeowner_plus', 'sub_portfolio'],
	);
});

test('retains a stored ended subscription when there is no current replacement', () => {
	const result = selectCustomerSubscription(
		[
			subscription('sub_newer_ended', 'canceled', 2),
			subscription('sub_stored', 'canceled', 1),
		],
		'sub_stored',
	);

	assert.equal(result.kind, 'selected');
	assert.equal(result.subscription.id, 'sub_stored');
});
