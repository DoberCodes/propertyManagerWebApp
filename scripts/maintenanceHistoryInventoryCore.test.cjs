const test = require('node:test');
const assert = require('node:assert/strict');
const {
	OUTCOMES,
	buildCanonicalIndex,
	buildPropertyIndexes,
	classifyCollectionRecord,
	classifyEmbeddedRecord,
	summarizeResults,
} = require('./lib/maintenanceHistoryInventoryCore.cjs');

const properties = [
	{
		id: 'property-1',
		data: { accountId: 'account-1', title: 'Main Home' },
	},
	{
		id: 'property-2',
		data: { accountId: 'account-2', title: 'Rental Home' },
	},
];

const propertyIndexes = buildPropertyIndexes(properties);

function classify(data, options = {}) {
	return classifyCollectionRecord({
		id: options.id || 'legacy-1',
		data,
		propertyIndexes,
		canonicalIndex: buildCanonicalIndex(options.events || []),
	});
}

test('classifies a linked legacy record as ready without changing its data', () => {
	const result = classify({
		accountId: 'account-1',
		propertyId: 'property-1',
		title: 'Furnace serviced',
		completionDate: '2026-01-12',
		deviceId: 'furnace-1',
		totalCost: 125,
	});

	assert.equal(result.outcome, OUTCOMES.READY);
	assert.equal(result.resolvedAccountId, 'account-1');
	assert.equal(result.resolvedPropertyId, 'property-1');
	assert.deepEqual(result.features, {
		hasAttachments: false,
		hasFinancials: true,
		hasAttribution: false,
		hasTaskLinks: false,
		hasEquipmentLinks: true,
	});
});

test('infers a property only when its title is unique', () => {
	const result = classify({
		accountId: 'account-1',
		propertyTitle: 'Main Home',
		description: 'Water heater flushed',
		date: '2026-02-01',
	});

	assert.equal(result.outcome, OUTCOMES.READY_WITH_INFERENCE);
	assert.equal(result.resolvedPropertyId, 'property-1');
	assert.deepEqual(result.reasons, ['property_inferred_from_unique_title']);
});

test('does not silently migrate an orphaned property relationship', () => {
	const result = classify({
		accountId: 'account-1',
		propertyId: 'missing-property',
		description: 'Roof inspected',
		date: '2026-02-01',
	});

	assert.equal(result.outcome, OUTCOMES.ORPHANED);
	assert.deepEqual(result.reasons, ['property_not_resolved']);
});

test('requires review when source account conflicts with the property account', () => {
	const result = classify({
		accountId: 'account-2',
		propertyId: 'property-1',
		description: 'Roof inspected',
		date: '2026-02-01',
	});

	assert.equal(result.outcome, OUTCOMES.MANUAL_REVIEW);
	assert.deepEqual(result.reasons, ['account_conflicts_with_property']);
});

test('recognizes a same-id canonical event as already represented', () => {
	const result = classify(
		{
			accountId: 'account-1',
			propertyId: 'property-1',
			title: 'Furnace serviced',
			completionDate: '2026-01-12',
		},
		{
			id: 'legacy-1',
			events: [
				{
					id: 'legacy-1',
					data: {
						accountId: 'account-1',
						propertyId: 'property-1',
						title: 'Furnace serviced',
						completionDate: '2026-01-12',
					},
				},
			],
		},
	);

	assert.equal(result.outcome, OUTCOMES.ALREADY_REPRESENTED);
	assert.equal(result.duplicateMatches[0].eventId, 'legacy-1');
	assert.ok(result.duplicateMatches[0].reasons.includes('same_document_id'));
});

test('recognizes explicit migration provenance even when ids differ', () => {
	const result = classify(
		{
			accountId: 'account-1',
			propertyId: 'property-1',
			title: 'Furnace serviced',
			completionDate: '2026-01-12',
		},
		{
			id: 'legacy-source',
			events: [
				{
					id: 'event-1',
					data: {
						accountId: 'account-1',
						propertyId: 'property-1',
						title: 'Normalized title',
						completionDate: '2026-01-12',
						data: {
							migration: {
								sourceCollection: 'maintenanceHistory',
								sourceId: 'legacy-source',
							},
						},
					},
				},
			],
		},
	);

	assert.equal(result.outcome, OUTCOMES.ALREADY_REPRESENTED);
	assert.ok(result.duplicateMatches[0].reasons.includes('migration_provenance'));
});

test('flags exact-signature matches for duplicate review instead of auto-merging', () => {
	const data = {
		accountId: 'account-1',
		propertyId: 'property-1',
		title: 'Filter replaced',
		description: 'Replaced 16x25 filter',
		completionDate: '2026-03-01',
		deviceIds: ['furnace-1'],
	};
	const result = classify(data, {
		events: [{ id: 'event-1', data }],
	});

	assert.equal(result.outcome, OUTCOMES.POSSIBLE_DUPLICATE);
	assert.ok(result.duplicateMatches[0].reasons.includes('exact_signature'));
});

test('excludes recurring-task creation from embedded completed history', () => {
	const result = classifyEmbeddedRecord({
		sourceType: 'device.maintenanceHistory',
		sourceId: 'devices/device-1/maintenanceHistory/0',
		data: {
			date: '2026-04-01',
			description: 'Recurring maintenance created: Furnace',
		},
		property: properties[0],
		deviceId: 'device-1',
		canonicalIndex: buildCanonicalIndex([]),
	});

	assert.equal(result.outcome, OUTCOMES.EXCLUDED_NON_HISTORY);
	assert.deepEqual(result.reasons, ['planned_or_placeholder_activity']);
});

test('requires manual review for embedded activity without a service date', () => {
	const result = classifyEmbeddedRecord({
		sourceType: 'property.taskHistory',
		sourceId: 'properties/property-1/taskHistory/0',
		data: { description: 'Chimney cleaned' },
		property: properties[0],
		canonicalIndex: buildCanonicalIndex([]),
	});

	assert.equal(result.outcome, OUTCOMES.MANUAL_REVIEW);
	assert.deepEqual(result.reasons, ['service_date_missing']);
});

test('summarizes outcomes, sources, features, and field coverage', () => {
	const ready = classify({
		accountId: 'account-1',
		propertyId: 'property-1',
		title: 'Inspection',
		date: '2026-05-01',
		attachments: [{ url: 'https://example.test/report.pdf' }],
	});
	const orphaned = classify({
		accountId: 'account-1',
		propertyId: 'missing',
		title: 'Inspection',
		date: '2026-05-01',
	});
	const summary = summarizeResults([ready, orphaned]);

	assert.equal(summary.totalCandidates, 2);
	assert.equal(summary.outcomes.ready, 1);
	assert.equal(summary.outcomes.orphaned, 1);
	assert.equal(summary.sources.maintenanceHistory, 2);
	assert.equal(summary.features.withAttachments, 1);
	assert.equal(summary.fieldCoverage.maintenanceHistory.accountId, 2);
});
