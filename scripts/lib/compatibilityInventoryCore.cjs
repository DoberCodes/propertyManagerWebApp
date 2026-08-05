const normalizeId = (value) => String(value || '').trim();
const asArray = (value) => (Array.isArray(value) ? value : []);

const propertyAccountId = (property) =>
	normalizeId(property.data?.accountId || property.data?.userId || property.data?.ownerId);

const devicePropertyId = (device) =>
	normalizeId(device.data?.location?.propertyId || device.data?.propertyId);

function summarizeCompatibilityInventory(records, accountFilter = '') {
	const propertiesById = new Map(records.properties.map((record) => [record.id, record]));
	const scopedProperties = accountFilter
		? records.properties.filter((record) => propertyAccountId(record) === accountFilter)
		: records.properties;
	const scopedPropertyIds = new Set(scopedProperties.map((record) => record.id));
	const scopedDevices = records.devices.filter((record) => {
		const propertyId = devicePropertyId(record);
		return accountFilter ? scopedPropertyIds.has(propertyId) : true;
	});
	const scopedByAccount = (record) =>
		!accountFilter || normalizeId(record.data?.accountId) === accountFilter;

	const legacyAccountUsers = records.users.filter((record) => {
		const accountIds = [record.data?.accountId, record.data?.familyAccountId]
			.map(normalizeId)
			.filter(Boolean);
		return accountFilter ? accountIds.includes(accountFilter) : accountIds.length > 0;
	});
	const scopedMemberships = records.accountMemberships.filter(scopedByAccount);
	const membershipKeys = new Set(
		scopedMemberships.map(
			(record) => `${normalizeId(record.data?.accountId)}:${normalizeId(record.data?.userId)}`,
		),
	);
	const userIds = new Set(records.users.map((record) => record.id));
	const usesLinks = records.propertyKnowledgeLinks.filter(
		(record) => scopedByAccount(record) && record.data?.relationship === 'uses',
	);
	const equipmentWithSupplyLinks = new Set(
		usesLinks
			.filter((record) => record.data?.from?.type === 'equipment')
			.map((record) => normalizeId(record.data?.from?.id))
			.filter(Boolean),
	);
	const devicesWithEmbeddedSupplies = scopedDevices.filter(
		(record) => asArray(record.data?.serviceItems).length > 0,
	);

	return {
		documents: {
			propertiesScanned: scopedProperties.length,
			propertiesWithEmbeddedDocuments: scopedProperties.filter(
				(record) => asArray(record.data?.documents).length > 0,
			).length,
			embeddedDocuments: scopedProperties.reduce(
				(total, record) => total + asArray(record.data?.documents).length,
				0,
			),
			collectionDocuments: records.propertyDocuments.filter(scopedByAccount).length,
			collectionDocumentsWithUnknownProperty: records.propertyDocuments.filter(
				(record) =>
					scopedByAccount(record) &&
					!propertiesById.has(normalizeId(record.data?.propertyId)),
			).length,
		},
		maintenanceHistory: {
			legacyCollectionRecords: records.maintenanceHistory.filter(scopedByAccount).length,
			canonicalEvents: records.maintenanceEvents.filter(scopedByAccount).length,
			embeddedPropertyRecords: scopedProperties.reduce(
				(total, record) =>
					total +
					asArray(record.data?.maintenanceHistory).length +
					asArray(record.data?.taskHistory).length,
				0,
			),
			embeddedEquipmentRecords: scopedDevices.reduce(
				(total, record) => total + asArray(record.data?.maintenanceHistory).length,
				0,
			),
		},
		accountLinks: {
			usersWithLegacyAccountLinks: legacyAccountUsers.length,
			memberships: scopedMemberships.length,
			legacyUsersWithoutMatchingMembership: legacyAccountUsers.filter((record) => {
				const accountIds = [record.data?.accountId, record.data?.familyAccountId]
					.map(normalizeId)
					.filter(Boolean);
				return accountIds.some(
					(accountId) => !membershipKeys.has(`${accountId}:${record.id}`),
				);
			}).length,
			membershipsWithoutUserProfile: scopedMemberships.filter(
				(record) => !userIds.has(normalizeId(record.data?.userId)),
			).length,
		},
		embeddedSupplies: {
			equipmentScanned: scopedDevices.length,
			equipmentWithEmbeddedSupplies: devicesWithEmbeddedSupplies.length,
			embeddedSupplyItems: devicesWithEmbeddedSupplies.reduce(
				(total, record) => total + asArray(record.data?.serviceItems).length,
				0,
			),
			canonicalSupplies: records.propertySupplies.filter(scopedByAccount).length,
			equipmentWithCanonicalSupplyLinks: equipmentWithSupplyLinks.size,
			embeddedEquipmentWithoutCanonicalSupplyLinks:
				devicesWithEmbeddedSupplies.filter(
					(record) => !equipmentWithSupplyLinks.has(record.id),
				).length,
		},
	};
}

module.exports = { summarizeCompatibilityInventory };
