const test = require('node:test');
const assert = require('node:assert/strict');
const {
	buildPromotedLegacyMaintenanceEvent,
} = require('./lib/legacyMaintenancePromotion.js');

const input = (legacy = {}) => ({
	legacyId: 'legacy-1',
	legacy: {
		completionDate: '2026-06-12',
		description: 'Furnace serviced',
		...legacy,
	},
	accountId: 'account-1',
	propertyId: 'property-1',
	propertyTitle: 'Main Home',
	nowIso: '2026-07-26T12:00:00.000Z',
});

test('promotes a legacy record into the canonical event contract with provenance', () => {
	const event = buildPromotedLegacyMaintenanceEvent(input({
		deviceId: 'device-1',
		originalTaskId: 'task-1',
		totalCost: 125,
		currency: 'USD',
	}));

	assert.equal(event.id, 'legacy-1');
	assert.equal(event.accountId, 'account-1');
	assert.equal(event.propertyId, 'property-1');
	assert.equal(event.serviceDate, '2026-06-12');
	assert.equal(event.eventType, 'maintenance_recorded');
	assert.equal(event.eventSource, 'system');
	assert.deepEqual(event.deviceIds, ['device-1']);
	assert.deepEqual(event.linkedTaskIds, ['task-1']);
	assert.equal(event.financials.actualCost, 125);
	assert.deepEqual(event.data.migration, {
		sourceCollection: 'maintenanceHistory',
		sourceId: 'legacy-1',
		sourceHash: event.data.migration.sourceHash,
		version: 1,
		promotedAt: '2026-07-26T12:00:00.000Z',
		promotionReason: 'user_requested_correction',
	});
	assert.match(event.data.migration.sourceHash, /^[a-f0-9]{64}$/);
});

test('does not attribute a legacy account owner as the historical recorder', () => {
	const event = buildPromotedLegacyMaintenanceEvent(input({ userId: 'account-owner' }));
	assert.equal(event.createdBy, undefined);
	assert.equal(event.recordedBy, undefined);
});

test('preserves explicit historical recorder and performer snapshots', () => {
	const event = buildPromotedLegacyMaintenanceEvent(input({
		recordedBy: { userId: 'recorder-1', displayName: 'Jordan' },
		completedByName: 'ABC Home Services',
	}));
	assert.deepEqual(event.recordedBy, { userId: 'recorder-1', displayName: 'Jordan' });
	assert.deepEqual(event.performedBy, {
		type: 'external_provider',
		displayName: 'ABC Home Services',
	});
});

test('creates deterministic attachment ids without copying invalid attachments', () => {
	const event = buildPromotedLegacyMaintenanceEvent(input({
		attachments: [
			{ url: 'https://example.test/invoice.pdf', name: 'Invoice' },
			{ name: 'Missing URL' },
		],
	}));
	assert.equal(event.attachments.length, 1);
	assert.match(event.attachments[0].id, /^legacy_[a-f0-9]{20}$/);
	assert.equal(event.attachments[0].fileName, 'Invoice');
});

test('refuses to invent a missing date or historical description', () => {
	assert.throws(
		() => buildPromotedLegacyMaintenanceEvent(input({ completionDate: '', description: '' })),
		/legacy maintenance history lacks/i,
	);
});
