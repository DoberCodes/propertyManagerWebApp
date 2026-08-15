'use strict';

const { createHash } = require('crypto');

const clean = (value) => String(value || '').trim();
const uniqueIds = (values = []) =>
	Array.from(new Set(values.flat().map(clean).filter(Boolean))).sort();
const deterministicId = (prefix, value) =>
	`${prefix}${createHash('sha256').update(value).digest('hex')}`;

const buildLinkId = ({ propertyId, documentId, endpointType, endpointId }) =>
	deterministicId(
		'pkl_',
		[propertyId, 'document', documentId, 'documents', endpointType, endpointId].join('|'),
	);

const endpointMatchesProperty = ({ type, data, accountId, propertyId }) => {
	if (type === 'equipment') {
		return (
			clean(data.accountId || data.userId) === accountId &&
			clean(data.location?.propertyId || data.propertyId) === propertyId
		);
	}
	return (
		clean(data.accountId || data.userId) === accountId &&
		clean(data.propertyId) === propertyId
	);
};

const mergeDocument = (embedded, collection) => ({
	...(embedded || {}),
	...(collection || {}),
	links: {
		...(embedded?.links || {}),
		...(collection?.links || {}),
	},
});

const buildLink = ({
	accountId,
	propertyId,
	documentId,
	endpointType,
	endpointId,
	now,
}) => ({
	accountId,
	propertyId,
	fromType: 'document',
	fromId: documentId,
	relationshipType: 'documents',
	toType: endpointType,
	toId: endpointId,
	source: 'migration',
	createdAt: now,
	createdBy: 'migration:property-document-relationships',
	updatedAt: now,
	updatedBy: 'migration:property-document-relationships',
});

const planPropertyDocumentRelationshipMigration = ({
	properties,
	documents,
	devices,
	tasks,
	spaces,
	supplies,
	links,
	now,
}) => {
	const collectionDocuments = new Map(documents.map((record) => [record.id, record]));
	const existingLinkIds = new Set(links.map((record) => record.id));
	const endpointMaps = {
		equipment: new Map(devices.map((record) => [record.id, record.data || {}])),
		task: new Map(tasks.map((record) => [record.id, record.data || {}])),
		space: new Map(spaces.map((record) => [record.id, record.data || {}])),
		supply: new Map(supplies.map((record) => [record.id, record.data || {}])),
	};
	const documentsToCreate = new Map();
	const linksToCreate = new Map();
	const unresolved = [];
	let evaluatedDocuments = 0;
	let evaluatedReferences = 0;

	for (const propertyRecord of properties) {
		const property = propertyRecord.data || {};
		const propertyId = clean(propertyRecord.id);
		const accountId = clean(property.accountId || property.userId);
		if (!propertyId || !accountId) continue;
		const embeddedDocuments = Array.isArray(property.documents)
			? property.documents
			: [];
		const propertyCollectionDocuments = documents.filter(
			(record) =>
				clean(record.data?.propertyId) === propertyId &&
				clean(record.data?.accountId || accountId) === accountId,
		);
		const documentIds = uniqueIds([
			embeddedDocuments.map((document) => document?.id),
			propertyCollectionDocuments.map((document) => document.id),
		]);

		for (const documentId of documentIds) {
			evaluatedDocuments += 1;
			const embedded = embeddedDocuments.find(
				(document) => clean(document?.id) === documentId,
			);
			const collectionRecord = collectionDocuments.get(documentId);
			if (
				collectionRecord &&
				(clean(collectionRecord.data?.propertyId) !== propertyId ||
					clean(collectionRecord.data?.accountId || accountId) !== accountId)
			) {
				unresolved.push({
					documentId,
					propertyId,
					field: 'document',
					endpointId: documentId,
					reason: 'Document ID is already used by another property or account.',
				});
				continue;
			}
			const merged = mergeDocument(embedded, collectionRecord?.data);
			if (!collectionRecord && embedded) {
				documentsToCreate.set(documentId, {
					id: documentId,
					data: {
						...embedded,
						id: documentId,
						accountId,
						propertyId,
						updatedAt: embedded.updatedAt || now,
					},
				});
			}

			const endpointGroups = [
				{
					type: 'equipment',
					field: 'assetIds',
					ids: uniqueIds([merged.links?.assetIds || [], merged.assignedDeviceId]),
				},
				{
					type: 'space',
					field: 'spaceIds',
					ids: uniqueIds([merged.links?.spaceIds || []]),
				},
				{
					type: 'task',
					field: 'taskIds',
					ids: uniqueIds([merged.links?.taskIds || [], merged.assignedTaskId]),
				},
				{
					type: 'supply',
					field: 'supplyIds',
					ids: uniqueIds([merged.links?.supplyIds || []]),
				},
				{
					type: 'supply',
					field: 'partIds',
					ids: uniqueIds([merged.links?.partIds || []]),
				},
			];

			for (const group of endpointGroups) {
				for (const endpointId of group.ids) {
					evaluatedReferences += 1;
					const endpoint = endpointMaps[group.type].get(endpointId);
					if (
						!endpoint ||
						!endpointMatchesProperty({
							type: group.type,
							data: endpoint,
							accountId,
							propertyId,
						})
					) {
						unresolved.push({
							documentId,
							propertyId,
							field: group.field,
							endpointId,
							reason:
								group.field === 'partIds'
									? 'Legacy part reference does not resolve to a canonical property Supply.'
									: 'Referenced record is missing or belongs to another property.',
						});
						continue;
					}
					const linkId = buildLinkId({
						propertyId,
						documentId,
						endpointType: group.type,
						endpointId,
					});
					if (existingLinkIds.has(linkId) || linksToCreate.has(linkId)) continue;
					linksToCreate.set(linkId, {
						id: linkId,
						data: buildLink({
							accountId,
							propertyId,
							documentId,
							endpointType: group.type,
							endpointId,
							now,
						}),
					});
				}
			}
		}
	}

	return {
		evaluatedDocuments,
		evaluatedReferences,
		documentsToCreate: Array.from(documentsToCreate.values()),
		linksToCreate: Array.from(linksToCreate.values()),
		unresolved,
	};
};

module.exports = { planPropertyDocumentRelationshipMigration };
