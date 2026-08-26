const test = require('node:test');
const assert = require('node:assert/strict');
const {
	buildPropertyKnowledgeLinkId,
	canConnectDocumentEndpoint,
	canConnectSupplyEndpoint,
	documentEndpointMatchesProperty,
	normalizeKnowledgeEndpointIds,
	normalizeSpaceIds,
	RELATIONSHIP_MANAGER_ROLES,
	supplyEndpointMatchesProperty,
	validateEquipmentRelationshipSelection,
} = require('./lib/propertyKnowledgeLinks.js');
const { hasAnyRole } = require('./lib/accountAuthz.js');

test('normalizes selected Space IDs deterministically', () => {
	assert.deepEqual(
		normalizeSpaceIds([' space-b ', 'space-a', 'space-b', '', null]),
		['space-a', 'space-b'],
	);
});

test('normalizes Supply endpoint IDs with the same deterministic contract', () => {
	assert.deepEqual(
		normalizeKnowledgeEndpointIds([' task-b ', 'task-a', 'task-b', undefined]),
		['task-a', 'task-b'],
	);
});

test('builds a stable relationship ID from both endpoints', () => {
	const input = {
		propertyId: 'property-1',
		fromType: 'equipment',
		fromId: 'equipment-1',
		relationshipType: 'located_in',
		toType: 'space',
		toId: 'space-1',
	};
	const first = buildPropertyKnowledgeLinkId(input);
	const second = buildPropertyKnowledgeLinkId(input);
	assert.equal(first, second);
	assert.match(first, /^pkl_[a-f0-9]{64}$/);
	assert.notEqual(
		first,
		buildPropertyKnowledgeLinkId({ ...input, toId: 'space-2' }),
	);
	assert.notEqual(
		first,
		buildPropertyKnowledgeLinkId({
			...input,
			fromType: 'task',
			fromId: 'task-1',
			relationshipType: 'occurs_in',
		}),
	);
	assert.notEqual(
		first,
		buildPropertyKnowledgeLinkId({
			...input,
			fromType: 'equipment',
			fromId: 'equipment-1',
			relationshipType: 'uses',
			toType: 'supply',
			toId: 'supply-1',
		}),
	);
	assert.notEqual(
		first,
		buildPropertyKnowledgeLinkId({
			...input,
			fromType: 'document',
			fromId: 'document-1',
			relationshipType: 'documents',
			toType: 'equipment',
			toId: 'equipment-1',
		}),
	);
});

test('requires relationship endpoints to belong to the same account and property', () => {
	const equipment = {
		accountId: 'account-1',
		location: { propertyId: 'property-1' },
	};
	const space = {
		accountId: 'account-1',
		propertyId: 'property-1',
	};

	assert.equal(
		supplyEndpointMatchesProperty({
			endpointType: 'equipment',
			endpoint: equipment,
			accountId: 'account-1',
			propertyId: 'property-1',
		}),
		true,
	);
	assert.equal(
		supplyEndpointMatchesProperty({
			endpointType: 'equipment',
			endpoint: equipment,
			accountId: 'account-1',
			propertyId: 'property-2',
		}),
		false,
	);
	assert.equal(
		documentEndpointMatchesProperty({
			endpointType: 'space',
			endpoint: space,
			accountId: 'account-2',
			propertyId: 'property-1',
		}),
		false,
	);
});

test('does not create document links to missing or newly archived records', () => {
	const endpoint = {
		accountId: 'account-1',
		propertyId: 'property-1',
		isArchived: true,
	};
	const input = {
		endpointType: 'supply',
		endpoint,
		accountId: 'account-1',
		propertyId: 'property-1',
	};

	assert.equal(
		canConnectDocumentEndpoint({
			...input,
			endpointExists: false,
			alreadyLinked: false,
		}),
		false,
	);
	assert.equal(
		canConnectDocumentEndpoint({
			...input,
			endpointExists: true,
			alreadyLinked: false,
		}),
		false,
	);
	assert.equal(
		canConnectDocumentEndpoint({
			...input,
			endpointExists: true,
			alreadyLinked: true,
		}),
		true,
	);
});

test('preserves an existing archived Space connection but blocks a new one', () => {
	const input = {
		endpointType: 'space',
		endpointExists: true,
		endpoint: {
			accountId: 'account-1',
			propertyId: 'property-1',
			isArchived: true,
		},
		accountId: 'account-1',
		propertyId: 'property-1',
	};

	assert.equal(
		canConnectSupplyEndpoint({ ...input, alreadyLinked: false }),
		false,
	);
	assert.equal(
		canConnectSupplyEndpoint({ ...input, alreadyLinked: true }),
		true,
	);
});

test('limits relationship editing to property management roles', () => {
	for (const role of [
		'account_owner',
		'admin',
		'manager',
		'property_manager',
		'assistant_manager',
	]) {
		assert.equal(
			hasAnyRole(
				{ accountId: 'account-1', userId: 'user-1', roles: [role] },
				RELATIONSHIP_MANAGER_ROLES,
			),
			true,
		);
	}

	for (const role of ['maintenance_lead', 'maintenance', 'viewer']) {
		assert.equal(
			hasAnyRole(
				{ accountId: 'account-1', userId: 'user-1', roles: [role] },
				RELATIONSHIP_MANAGER_ROLES,
			),
			false,
		);
	}
	assert.equal(
		hasAnyRole(
			{
				accountId: 'account-1',
				userId: 'user-1',
				roles: ['account_owner'],
				status: 'disabled',
			},
			RELATIONSHIP_MANAGER_ROLES,
		),
		false,
	);
});

test('enforces one-level Equipment relationships', () => {
	const base = {
		fromType: 'equipment',
		toType: 'equipment',
		relationshipType: 'part_of',
	};
	assert.equal(
		validateEquipmentRelationshipSelection({
			primaryEquipmentId: 'primary',
			attachedEquipmentIds: ['physical'],
			existingLinks: [],
		}),
		null,
	);
	assert.equal(
		validateEquipmentRelationshipSelection({
			primaryEquipmentId: 'primary',
			attachedEquipmentIds: ['primary'],
			existingLinks: [],
		}),
		'Equipment cannot be connected to itself.',
	);
	assert.equal(
		validateEquipmentRelationshipSelection({
			primaryEquipmentId: 'primary',
			attachedEquipmentIds: ['physical'],
			existingLinks: [{ ...base, fromId: 'primary', toId: 'other' }],
		}),
		'Attached Equipment cannot also contain other Equipment.',
	);
	assert.equal(
		validateEquipmentRelationshipSelection({
			primaryEquipmentId: 'primary',
			attachedEquipmentIds: ['physical'],
			existingLinks: [{ ...base, fromId: 'physical', toId: 'other' }],
		}),
		'One or more Equipment records are already connected elsewhere.',
	);
	assert.equal(
		validateEquipmentRelationshipSelection({
			primaryEquipmentId: 'primary',
			attachedEquipmentIds: ['combined'],
			existingLinks: [{ ...base, fromId: 'nested', toId: 'combined' }],
		}),
		'Equipment that already contains other Equipment cannot be attached.',
	);
});
