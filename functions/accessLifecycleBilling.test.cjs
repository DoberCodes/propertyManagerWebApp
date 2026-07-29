const test = require('node:test');
const assert = require('node:assert/strict');
const {
	hasConfirmedPaidSubscription,
	isRecoverablePaidConversionSuppression,
} = require('./lib/accessLifecycleBilling');

test('does not classify Free Homeowner access or an internal grant as paid', () => {
	assert.equal(hasConfirmedPaidSubscription({ plan: 'homeowner', status: 'active' }), false);
	assert.equal(hasConfirmedPaidSubscription({
		plan: 'homeowner',
		status: 'active',
		stripeCustomerId: 'cus_only',
		grants: [{ bundleId: 'homeowner_plus' }],
	}), false);
});

test('requires authoritative paid plan and Stripe subscription evidence', () => {
	assert.equal(hasConfirmedPaidSubscription({ plan: 'homeowner_plus', status: 'active' }), false);
	assert.equal(hasConfirmedPaidSubscription({
		plan: 'homeowner_plus', status: 'active', stripeSubscriptionId: 'sub_paid',
	}), true);
	assert.equal(hasConfirmedPaidSubscription({
		plan: 'property', status: 'cancelled', stripeSubscriptionId: 'sub_cancelled',
	}), false);
});

test('honors the paid trial window', () => {
	const nowMs = Date.parse('2026-07-29T12:00:00Z');
	assert.equal(hasConfirmedPaidSubscription({
		plan: 'homeowner_plus', status: 'trial', stripeSubscriptionId: 'sub_trial',
		trialEndsAt: Math.floor((nowMs + 86_400_000) / 1000),
	}, nowMs), true);
	assert.equal(hasConfirmedPaidSubscription({
		plan: 'homeowner_plus', status: 'trial', stripeSubscriptionId: 'sub_trial',
		trialEndsAt: Math.floor((nowMs - 1) / 1000),
	}, nowMs), false);
});

test('only the known false-positive terminal outcome is recoverable', () => {
	assert.equal(isRecoverablePaidConversionSuppression({ status: 'skipped', outcome: 'suppressed_paid_conversion' }), true);
	assert.equal(isRecoverablePaidConversionSuppression({ status: 'sent', outcome: 'sent' }), false);
	assert.equal(isRecoverablePaidConversionSuppression({ status: 'skipped', outcome: 'missed_grace_window' }), false);
});
