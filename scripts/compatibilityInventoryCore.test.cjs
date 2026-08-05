const assert = require('node:assert/strict');
const test = require('node:test');
const {
	summarizeCompatibilityInventory,
} = require('./lib/compatibilityInventoryCore.cjs');

test('summarizes legacy compatibility records without exposing record contents', () => {
	const summary = summarizeCompatibilityInventory({
		properties: [
			{
				id: 'property-1',
				data: {
					accountId: 'account-1',
					documents: [{ id: 'legacy-document' }],
					maintenanceHistory: [{}],
				},
			},
		],
		devices: [
			{
				id: 'equipment-1',
				data: {
					location: { propertyId: 'property-1' },
					serviceItems: [{ name: 'Filter' }],
				},
			},
		],
		users: [
			{ id: 'user-1', data: { accountId: 'account-1' } },
		],
		accountMemberships: [],
		propertyDocuments: [
			{ id: 'document-1', data: { accountId: 'account-1', propertyId: 'property-1' } },
		],
		maintenanceHistory: [{ id: 'history-1', data: { accountId: 'account-1' } }],
		maintenanceEvents: [{ id: 'event-1', data: { accountId: 'account-1' } }],
		propertySupplies: [{ id: 'supply-1', data: { accountId: 'account-1' } }],
		propertyKnowledgeLinks: [],
	}, 'account-1');

	assert.equal(summary.documents.embeddedDocuments, 1);
	assert.equal(summary.maintenanceHistory.legacyCollectionRecords, 1);
	assert.equal(summary.accountLinks.legacyUsersWithoutMatchingMembership, 1);
	assert.equal(summary.embeddedSupplies.embeddedSupplyItems, 1);
	assert.equal(summary.embeddedSupplies.embeddedEquipmentWithoutCanonicalSupplyLinks, 1);
	assert.equal(JSON.stringify(summary).includes('Filter'), false);
});
