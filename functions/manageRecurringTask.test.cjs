const test = require('node:test');
const assert = require('node:assert/strict');
const {
	calculateTrustedNextDueDate,
	hasValidRecurringTaskConfiguration,
	recurringTaskIdForRequest,
} = require('./lib/manageRecurringTask.js');

test('validates supported recurring task configurations', () => {
	assert.equal(
		hasValidRecurringTaskConfiguration({
			isRecurring: true,
			recurrenceFrequency: 'monthly',
			recurrenceInterval: 1,
		}),
		true,
	);
	assert.equal(
		hasValidRecurringTaskConfiguration({
			isRecurring: true,
			recurrenceFrequency: 'custom',
			recurrenceInterval: 2,
		}),
		false,
	);
});

test('calculates standard and custom next due dates', () => {
	assert.equal(calculateTrustedNextDueDate('2026-07-24', 'weekly', 2), '2026-08-07');
	assert.equal(
		calculateTrustedNextDueDate('2026-07-24T14:00:00.000Z', 'custom', 3, 'months'),
		'2026-10-24',
	);
});

test('derives stable request IDs without exposing request contents', () => {
	const first = recurringTaskIdForRequest('account-1', 'request-1');
	assert.equal(first, recurringTaskIdForRequest('account-1', 'request-1'));
	assert.notEqual(first, recurringTaskIdForRequest('account-1', 'request-2'));
	assert.match(first, /^recurring_[a-f0-9]{40}$/);
});
