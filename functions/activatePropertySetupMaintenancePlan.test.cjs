const assert = require('node:assert/strict');
const test = require('node:test');
const {
	buildPropertySetupRecurrence,
	getPropertySetupTaskId,
} = require('./lib/activatePropertySetupMaintenancePlan.js');

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
