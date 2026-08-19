const assert = require('node:assert/strict');
const test = require('node:test');
const {
	buildPropertySetupRecurrence,
	deviceBelongsToProperty,
	getPropertySetupTaskId,
	propertyBelongsToAccount,
	validatePropertySetupProposals,
} = require('./lib/activatePropertySetupMaintenancePlan.js');
const { hasAnyRole } = require('./lib/accountAuthz.js');

test('setup task IDs are deterministic and scoped to account and property', () => {
	const first = getPropertySetupTaskId('account-1', 'property-1', 'hvac:filter');
	const replay = getPropertySetupTaskId('account-1', 'property-1', 'hvac:filter');
	const otherProperty = getPropertySetupTaskId(
		'account-1',
		'property-2',
		'hvac:filter',
	);

	assert.equal(first, replay);
	assert.match(first, /^setup_[a-f0-9]{40}$/);
	assert.notEqual(first, otherProperty);
});

test('setup activation removes recurrence when effective access does not allow it', () => {
	assert.deepEqual(
		buildPropertySetupRecurrence(
			{
				recurrenceFrequency: 'monthly',
				recurrenceInterval: 1,
				recurrenceCustomUnit: null,
			},
			false,
		),
		{ isRecurring: false },
	);
});

test('setup activation preserves an entitled custom recurrence', () => {
	assert.deepEqual(
		buildPropertySetupRecurrence(
			{
				recurrenceFrequency: 'custom',
				recurrenceInterval: 6,
				recurrenceCustomUnit: 'months',
			},
			true,
		),
		{
			isRecurring: true,
			recurrenceFrequency: 'custom',
			recurrenceInterval: 6,
			recurrenceCustomUnit: 'months',
		},
	);
});

test('validates proposal identity, dates, and recurrence before any write', () => {
	const proposal = {
		proposalId: 'hvac:filter',
		title: 'Replace HVAC filter',
		dueDate: '2026-08-01',
		priority: 'Medium',
		recurrenceFrequency: 'monthly',
		recurrenceInterval: 1,
	};
	assert.equal(validatePropertySetupProposals([proposal]).length, 1);
	assert.throws(
		() => validatePropertySetupProposals([proposal, proposal]),
		(error) => error?.code === 'invalid-argument',
	);
	assert.throws(
		() => validatePropertySetupProposals([{ ...proposal, dueDate: '2026-02-30' }]),
		(error) => error?.code === 'invalid-argument',
	);
	assert.throws(
		() =>
			validatePropertySetupProposals([
				{ ...proposal, recurrenceFrequency: 'custom', recurrenceCustomUnit: '' },
			]),
		(error) => error?.code === 'invalid-argument',
	);
});

test('normalizes legacy and repeatable equipment links on setup tasks', () => {
	const [proposal] = validatePropertySetupProposals([
		{
			proposalId: 'smoke:test',
			title: 'Test smoke detectors',
			dueDate: '2026-08-01',
			deviceId: 'detector-1',
			deviceIds: ['detector-1', 'detector-2'],
		},
	]);

	assert.deepEqual(proposal.deviceIds, ['detector-1', 'detector-2']);
	assert.throws(
		() =>
			validatePropertySetupProposals([
				{
					proposalId: 'too-many-devices',
					title: 'Test devices',
					dueDate: '2026-08-01',
					deviceIds: Array.from({ length: 51 }, (_, index) => `device-${index}`),
				},
			]),
		(error) => error?.code === 'invalid-argument',
	);
});

test('authorization scope helpers reject cross-account properties and devices', () => {
	assert.equal(propertyBelongsToAccount({ accountId: 'account-1' }, 'account-1'), true);
	assert.equal(propertyBelongsToAccount({ accountId: 'account-2' }, 'account-1'), false);
	assert.equal(
		deviceBelongsToProperty({ location: { propertyId: 'property-1' } }, 'property-1'),
		true,
	);
	assert.equal(
		deviceBelongsToProperty({ propertyId: 'property-2' }, 'property-1'),
		false,
	);
});

test('setup activation roles require an active privileged account membership', () => {
	assert.equal(
		hasAnyRole(
			{ accountId: 'account-1', userId: 'owner', roles: ['account_owner'], status: 'active' },
			['account_owner', 'admin', 'manager'],
		),
		true,
	);
	assert.equal(
		hasAnyRole(
			{ accountId: 'account-1', userId: 'manager', roles: ['manager'], status: 'disabled' },
			['account_owner', 'admin', 'manager'],
		),
		false,
	);
	assert.equal(
		hasAnyRole(
			{ accountId: 'account-1', userId: 'viewer', roles: ['member'], status: 'active' },
			['account_owner', 'admin', 'manager'],
		),
		false,
	);
});
