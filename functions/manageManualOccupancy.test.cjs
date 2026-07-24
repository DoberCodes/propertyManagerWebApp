const assert = require('node:assert/strict');
const test = require('node:test');

const { hasHistoricalResidentContinuity } = require('./lib/manageManualOccupancy.js');

test('new Free accounts do not receive rental continuity by default', () => {
	assert.equal(
		hasHistoricalResidentContinuity({
			account: { subscription: { plan: 'homeowner', status: 'active' } },
			propertyTenants: [],
			grantBundles: [],
		}),
		false,
	);
});

test('historical paid or granted rental access enables manual occupancy continuity', () => {
	assert.equal(
		hasHistoricalResidentContinuity({
			account: { resourceContinuity: { residentManagementPreviouslyEntitled: true } },
		}),
		true,
	);
	assert.equal(hasHistoricalResidentContinuity({ grantBundles: ['portfolio'] }), true);
	assert.equal(
		hasHistoricalResidentContinuity({ account: { subscription: { plan: 'property' } } }),
		true,
	);
});

test('existing occupancy records remain administrable after downgrade', () => {
	assert.equal(
		hasHistoricalResidentContinuity({ propertyTenants: [{ id: 'resident-1' }] }),
		true,
	);
});
