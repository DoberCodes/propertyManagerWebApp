'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
	planPropertyDocumentRelationshipMigration,
} = require('./propertyDocumentRelationshipMigrationCore.cjs');

const now = '2026-08-02T00:00:00.000Z';
const property = {
	id: 'property-1',
	data: {
		accountId: 'account-1',
		documents: [
			{
				id: 'document-1',
				name: 'HVAC report',
				links: {
					assetIds: ['equipment-1'],
					taskIds: ['task-1'],
					spaceIds: ['space-1'],
					partIds: ['supply-1', 'legacy-part-missing'],
				},
			},
		],
	},
};
const scoped = (propertyId = 'property-1') => ({
	accountId: 'account-1',
	propertyId,
});

const input = (overrides = {}) => ({
	properties: [property],
	documents: [],
	devices: [
		{
			id: 'equipment-1',
			data: { accountId: 'account-1', location: { propertyId: 'property-1' } },
		},
	],
	tasks: [{ id: 'task-1', data: scoped() }],
	spaces: [{ id: 'space-1', data: scoped() }],
	supplies: [{ id: 'supply-1', data: scoped() }],
	links: [],
	now,
	...overrides,
});

test('promotes embedded documents and creates validated canonical relationships', () => {
	const plan = planPropertyDocumentRelationshipMigration(input());
	assert.equal(plan.documentsToCreate.length, 1);
	assert.equal(plan.linksToCreate.length, 4);
	assert.deepEqual(
		plan.linksToCreate.map((link) => `${link.data.toType}:${link.data.toId}`).sort(),
		['equipment:equipment-1', 'space:space-1', 'supply:supply-1', 'task:task-1'],
	);
	assert.equal(plan.unresolved.length, 1);
	assert.equal(plan.unresolved[0].endpointId, 'legacy-part-missing');
});

test('is repeat-safe when first-class documents and deterministic links exist', () => {
	const first = planPropertyDocumentRelationshipMigration(input());
	const plan = planPropertyDocumentRelationshipMigration(
		input({
			documents: [
				{
					id: 'document-1',
					data: { ...property.data.documents[0], ...scoped() },
				},
			],
			links: first.linksToCreate,
		}),
	);
	assert.equal(plan.documentsToCreate.length, 0);
	assert.equal(plan.linksToCreate.length, 0);
	assert.equal(plan.unresolved.length, 1);
});

test('reports cross-property endpoints without creating relationships', () => {
	const plan = planPropertyDocumentRelationshipMigration(
		input({ tasks: [{ id: 'task-1', data: scoped('property-2') }] }),
	);
	assert.equal(
		plan.linksToCreate.some((link) => link.data.toId === 'task-1'),
		false,
	);
	assert.equal(
		plan.unresolved.some((item) => item.endpointId === 'task-1'),
		true,
	);
});
