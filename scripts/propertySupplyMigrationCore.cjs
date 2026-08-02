'use strict';

const { createHash } = require('crypto');

const clean = (value) => String(value || '').trim();
const normalize = (value) => clean(value).toLowerCase().replace(/\s+/g, ' ');

const TYPE_MAP = Object.freeze({
	filter: 'filter',
	paint: 'paint_and_finish',
	finish: 'paint_and_finish',
	fertilizer: 'lawn_and_garden',
	lawn: 'lawn_and_garden',
	pool: 'pool_and_spa',
	bulb: 'electrical',
	battery: 'electrical',
	electrical: 'electrical',
	hose: 'plumbing',
	plumbing: 'plumbing',
	belt: 'hardware',
	hardware: 'hardware',
	cleaning: 'cleaning',
	cleaner: 'cleaning',
});

const supplyType = (category) => TYPE_MAP[normalize(category)] || 'other';

const supplyKey = (propertyId, item) =>
	[
		propertyId,
		item.name,
		item.manufacturer,
		item.partNumber,
		item.size,
		item.material,
		item.voltage,
		item.mervRating,
		item.compatibility,
	].map(normalize).join('|');

const existingSupplyKey = (supply) =>
	supplyKey(supply.propertyId, supply);

const deterministicId = (prefix, value) =>
	`${prefix}${createHash('sha256').update(value).digest('hex')}`;

const buildLinkId = ({ propertyId, fromId, toId }) =>
	deterministicId(
		'pkl_',
		[propertyId, 'equipment', fromId, 'uses', 'supply', toId].join('|'),
	);

const optional = (value) => (clean(value) ? clean(value) : undefined);

const buildSupply = ({ accountId, propertyId, item, now }) =>
	Object.fromEntries(
		Object.entries({
			accountId,
			propertyId,
			name: clean(item.name),
			type: supplyType(item.category),
			manufacturer: optional(item.manufacturer),
			partNumber: optional(item.partNumber),
			size: optional(item.size),
			details: optional(item.details),
			material: optional(item.material),
			voltage: optional(item.voltage),
			mervRating: optional(item.mervRating),
			compatibility: optional(item.compatibility),
			replacementInterval: optional(item.replacementInterval),
			notes: optional(item.notes),
			isArchived: false,
			source: 'migration',
			createdBy: 'migration:equipment-service-items',
			updatedBy: 'migration:equipment-service-items',
			createdAt: now,
			updatedAt: now,
		}).filter(([, value]) => value !== undefined),
	);

const planPropertySupplyMigration = ({ devices, supplies, links, now }) => {
	const suppliesByKey = new Map(
		supplies.map((record) => [existingSupplyKey(record.data), record.id]),
	);
	const existingSupplyIds = new Set(supplies.map((record) => record.id));
	const existingLinkIds = new Set(links.map((record) => record.id));
	const suppliesToCreate = new Map();
	const linksToCreate = new Map();
	let evaluated = 0;
	let skipped = 0;

	for (const deviceRecord of devices) {
		const device = deviceRecord.data || {};
		const propertyId = clean(device.location?.propertyId || device.propertyId);
		const accountId = clean(device.accountId || device.userId);
		const items = Array.isArray(device.serviceItems) ? device.serviceItems : [];
		for (const item of items) {
			evaluated += 1;
			if (!propertyId || !accountId || !clean(item?.name)) {
				skipped += 1;
				continue;
			}
			const key = supplyKey(propertyId, item);
			let supplyId = suppliesByKey.get(key);
			if (!supplyId) {
				supplyId = deterministicId('psm_', key);
				suppliesByKey.set(key, supplyId);
				if (!existingSupplyIds.has(supplyId)) {
					suppliesToCreate.set(supplyId, {
						id: supplyId,
						data: buildSupply({ accountId, propertyId, item, now }),
					});
				}
			}
			const linkId = buildLinkId({
				propertyId,
				fromId: deviceRecord.id,
				toId: supplyId,
			});
			if (!existingLinkIds.has(linkId)) {
				linksToCreate.set(linkId, {
					id: linkId,
					data: {
						accountId,
						propertyId,
						fromType: 'equipment',
						fromId: deviceRecord.id,
						relationshipType: 'uses',
						toType: 'supply',
						toId: supplyId,
						source: 'migration',
						createdAt: now,
						createdBy: 'migration:equipment-service-items',
						updatedAt: now,
						updatedBy: 'migration:equipment-service-items',
					},
				});
			}
		}
	}

	return {
		evaluated,
		skipped,
		suppliesToCreate: Array.from(suppliesToCreate.values()),
		linksToCreate: Array.from(linksToCreate.values()),
	};
};

module.exports = { planPropertySupplyMigration };
