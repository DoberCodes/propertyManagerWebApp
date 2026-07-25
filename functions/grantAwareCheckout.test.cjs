const assert = require('node:assert/strict');
const test = require('node:test');

const { getGrantAwareCheckoutPolicy } = require('./lib/grantAwareCheckout.js');

const grant = (overrides = {}) => ({
	grantId: 'grant-homeowner-plus',
	programId: 'homeowner-plus-program',
	accountId: 'account-1',
	kind: 'temporary',
	state: 'active',
	bundleId: 'homeowner_plus',
	bundleVersion: 'v1',
	startsAtMs: 1,
	endsAtMs: 200000,
	source: 'trial',
	transition: { mode: 'checkout_required', status: 'not_configured' },
	...overrides,
});

test('treats Homeowner+ over a Free billing base as an equivalent delayed conversion', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [grant()],
		targetPlanId: 'homeowner_plus',
		nowMs: 1000,
	});

	assert.equal(result.kind, 'delayed');
	assert.equal(result.effectiveGrantPlanId, 'homeowner_plus');
	assert.equal(result.firstChargeAtSeconds, 200);
	assert.deepEqual(result.conversionGrantIds, ['grant-homeowner-plus']);
});

test('starts a higher paid plan immediately and converts only convertible grants', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [
			grant(),
			grant({
				grantId: 'beta-feature',
				bundleId: 'homeowner_plus',
				source: 'beta',
				transition: { mode: 'none' },
			}),
		],
		targetPlanId: 'portfolio',
		nowMs: 1000,
	});

	assert.equal(result.kind, 'immediate_upgrade');
	assert.deepEqual(result.conversionGrantIds, ['grant-homeowner-plus']);
});

test('delays a lower paid plan until the effective temporary grant ends', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [grant({ bundleId: 'portfolio', endsAtMs: 500000 })],
		targetPlanId: 'property',
		nowMs: 1000,
	});

	assert.equal(result.kind, 'delayed');
	assert.equal(result.firstChargeAtSeconds, 500);
	assert.deepEqual(result.conversionGrantIds, []);
});

test('blocks equivalent or lower checkout for permanent effective access', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [grant({ kind: 'permanent', endsAtMs: null, source: 'lifetime' })],
		targetPlanId: 'homeowner_plus',
		nowMs: 1000,
	});

	assert.equal(result.kind, 'blocked_permanent');
});

test('blocks a plan covered by a permanent grant beneath a temporary higher grant', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [
			grant({
				grantId: 'permanent-plus',
				kind: 'permanent',
				endsAtMs: null,
				source: 'lifetime',
				transition: { mode: 'none' },
			}),
			grant({
				grantId: 'temporary-portfolio',
				bundleId: 'portfolio',
			}),
		],
		targetPlanId: 'homeowner_plus',
		nowMs: 1000,
	});

	assert.deepEqual(result, {
		kind: 'blocked_permanent',
		effectiveGrantPlanId: 'homeowner_plus',
		grantIds: ['permanent-plus'],
	});
});

test('keeps non-convertible temporary grants additive without changing checkout', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [grant({ transition: { mode: 'none' } })],
		targetPlanId: 'homeowner_plus',
		nowMs: 1000,
	});

	assert.equal(result.kind, 'standard');
});

test('keeps a higher paid checkout standard when no temporary grant permits conversion', () => {
	const result = getGrantAwareCheckoutPolicy({
		grants: [grant({ transition: { mode: 'none' } })],
		targetPlanId: 'portfolio',
		nowMs: 1000,
	});

	assert.equal(result.kind, 'standard');
});
