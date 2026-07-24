const assert = require('node:assert/strict');

const {
	canManageEntitlementGrants,
	isMaintleyOwnerGrantRole,
	isProhibitedSelfGrantTarget,
} = require('../functions/lib/adminEntitlementGrantPolicy.js');

assert.equal(isMaintleyOwnerGrantRole('owner'), true);
assert.equal(isMaintleyOwnerGrantRole('maintley_owner'), true);
assert.equal(isMaintleyOwnerGrantRole('platform-owner'), true);
assert.equal(isMaintleyOwnerGrantRole('property_owner'), false);
assert.equal(isMaintleyOwnerGrantRole('homeowner'), false);

assert.equal(canManageEntitlementGrants('owner', []), true);
assert.equal(canManageEntitlementGrants('admin', ['entitlement_grants.manage']), true);
assert.equal(canManageEntitlementGrants('admin', ['entitlement-grant-manager']), true);
assert.equal(canManageEntitlementGrants('admin', []), false);

const baseTarget = {
	actorUserId: 'admin-1',
	actorAccountId: 'maintley-admin-account',
	targetUserId: 'customer-1',
	targetAccountId: 'customer-account',
};

assert.equal(
	isProhibitedSelfGrantTarget({ maintleyRole: 'admin', ...baseTarget }),
	false,
);
assert.equal(
	isProhibitedSelfGrantTarget({
		maintleyRole: 'admin',
		...baseTarget,
		targetUserId: 'admin-1',
	}),
	true,
);
assert.equal(
	isProhibitedSelfGrantTarget({
		maintleyRole: 'admin',
		...baseTarget,
		targetAccountId: 'maintley-admin-account',
	}),
	true,
);
assert.equal(
	isProhibitedSelfGrantTarget({
		maintleyRole: 'owner',
		...baseTarget,
		targetUserId: 'admin-1',
		targetAccountId: 'maintley-admin-account',
	}),
	false,
);

console.log('Admin entitlement grant policy tests passed.');
