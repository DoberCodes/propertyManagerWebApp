'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { planPropertySupplyMigration } = require('./propertySupplyMigrationCore.cjs');

const device = (id, serviceItems) => ({
	id,
	data: {
		accountId: 'account-1',
		location: { propertyId: 'property-1' },
		serviceItems,
	},
});

test('promotes embedded service items and links them to equipment', () => {
	const plan = planPropertySupplyMigration({
		devices: [device('equipment-1', [{ name: 'Air filter', category: 'filter', size: '16 x 25 x 1' }])],
		supplies: [],
		links: [],
		now: '2026-08-02T00:00:00.000Z',
	});
	assert.equal(plan.evaluated, 1);
	assert.equal(plan.suppliesToCreate.length, 1);
	assert.equal(plan.linksToCreate.length, 1);
	assert.equal(plan.suppliesToCreate[0].data.type, 'filter');
	assert.equal(plan.linksToCreate[0].data.fromId, 'equipment-1');
});

test('deduplicates the same specification while preserving both equipment links', () => {
	const item = { name: 'Air filter', category: 'filter', partNumber: 'ABC-123' };
	const plan = planPropertySupplyMigration({
		devices: [device('equipment-1', [item]), device('equipment-2', [item])],
		supplies: [],
		links: [],
		now: '2026-08-02T00:00:00.000Z',
	});
	assert.equal(plan.suppliesToCreate.length, 1);
	assert.equal(plan.linksToCreate.length, 2);
	assert.equal(plan.linksToCreate[0].data.toId, plan.linksToCreate[1].data.toId);
});

test('is repeat-safe when the canonical Supply and link already exist', () => {
	const first = planPropertySupplyMigration({
		devices: [device('equipment-1', [{ name: 'Battery', category: 'battery' }])],
		supplies: [],
		links: [],
		now: '2026-08-02T00:00:00.000Z',
	});
	const second = planPropertySupplyMigration({
		devices: [device('equipment-1', [{ name: 'Battery', category: 'battery' }])],
		supplies: first.suppliesToCreate,
		links: first.linksToCreate,
		now: '2026-08-03T00:00:00.000Z',
	});
	assert.equal(second.suppliesToCreate.length, 0);
	assert.equal(second.linksToCreate.length, 0);
});
