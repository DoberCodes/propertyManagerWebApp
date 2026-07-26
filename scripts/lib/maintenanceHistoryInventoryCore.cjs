// Pure classification helpers for the report-only Maintenance History inventory.
const crypto = require('crypto');

const OUTCOMES = Object.freeze({
	READY: 'ready',
	READY_WITH_INFERENCE: 'ready_with_inference',
	ALREADY_REPRESENTED: 'already_represented',
	POSSIBLE_DUPLICATE: 'possible_duplicate',
	MANUAL_REVIEW: 'manual_review',
	ORPHANED: 'orphaned',
	EXCLUDED_NON_HISTORY: 'excluded_non_history',
});

const NON_HISTORY_PATTERNS = [
	/^recurring maintenance created\b/i,
	/^recurring task created\b/i,
	/^maintenance schedule created\b/i,
	/^setup (complete|completed|placeholder)\b/i,
	/^placeholder\b/i,
];

function normalizeId(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value) {
	return normalizeId(value).toLowerCase().replace(/\s+/g, ' ');
}

function toDateString(value) {
	if (!value) return '';
	if (typeof value?.toDate === 'function') {
		return value.toDate().toISOString();
	}
	if (typeof value === 'object' && Number.isFinite(value._seconds)) {
		return new Date(value._seconds * 1000).toISOString();
	}
	if (value instanceof Date) return value.toISOString();
	return normalizeId(value);
}

function firstValue(data, fields) {
	for (const field of fields) {
		const value = field.split('.').reduce((current, key) => current?.[key], data);
		if (value !== undefined && value !== null && value !== '') return value;
	}
	return undefined;
}

function stringArray(...values) {
	const entries = values.flatMap((value) => (Array.isArray(value) ? value : [value]));
	return Array.from(new Set(entries.map(normalizeId).filter(Boolean))).sort();
}

function sumBreakdown(value) {
	if (!value || typeof value !== 'object') return undefined;
	const numbers = Object.values(value)
		.map((entry) => (entry === '' || entry === null ? NaN : Number(entry)))
		.filter(Number.isFinite);
	return numbers.length ? numbers.reduce((total, entry) => total + entry, 0) : undefined;
}

function getActualCost(data) {
	const direct = firstValue(data, [
		'financials.actualCost',
		'financials.totalCost',
		'totalCost',
		'actualCost',
		'cost',
		'amount',
	]);
	if (direct !== undefined && direct !== null && direct !== '') {
		const parsed = Number(direct);
		if (Number.isFinite(parsed)) return parsed;
	}
	return sumBreakdown(data?.financials?.actual);
}

function describeRecord(data = {}, context = {}) {
	const propertyId = normalizeId(
		context.propertyId || firstValue(data, ['propertyId', 'location.propertyId']),
	);
	const accountId = normalizeId(context.accountId || data.accountId);
	const serviceDate = toDateString(
		firstValue(data, [
			'serviceDate',
			'completionDate',
			'date',
			'timestamp',
			'completedAt',
			'createdAt',
		]),
	);
	const title = normalizeId(
		firstValue(data, ['title', 'servicePerformed', 'maintenanceType', 'description']),
	);
	const description = normalizeId(
		firstValue(data, ['description', 'completionNotes', 'notes', 'servicePerformed']),
	);
	const deviceIds = stringArray(
		data.deviceIds,
		data.deviceId,
		data.assignedDeviceId,
		context.deviceId,
	);
	const taskIds = stringArray(
		data.linkedTaskIds,
		data.originalTaskId,
		data.linkedTaskId,
		data.taskId,
		data.assignedTaskId,
	);
	const actualCost = getActualCost(data);
	const currency = normalizeId(firstValue(data, ['financials.currency', 'currency'])) || 'USD';

	return {
		accountId,
		propertyId,
		propertyTitle: normalizeId(firstValue(data, ['propertyTitle', 'property'])),
		serviceDate,
		title,
		description,
		deviceIds,
		taskIds,
		actualCost,
		currency,
		hasAttachments: Boolean(
			(Array.isArray(data.attachments) && data.attachments.length) ||
			data.completionFile ||
			data.fileUrl ||
			data.url,
		),
		hasAttribution: Boolean(
			data.recordedBy ||
			data.performedBy ||
			data.completedBy ||
			data.completedByName ||
			data.contractorId,
		),
	};
}

function signatureForDescriptor(descriptor) {
	const payload = [
		descriptor.propertyId,
		normalizeText(descriptor.serviceDate).slice(0, 10),
		normalizeText(descriptor.title),
		normalizeText(descriptor.description),
		descriptor.deviceIds.join(','),
		descriptor.taskIds.join(','),
		descriptor.actualCost ?? '',
		descriptor.currency,
	].join('|');
	return crypto.createHash('sha256').update(payload).digest('hex');
}

function migrationSourceKeys(data = {}) {
	const migration = data?.data?.migration || data?.migration || {};
	const sourceCollection = normalizeId(migration.sourceCollection);
	const sourceId = normalizeId(migration.sourceId);
	return sourceCollection && sourceId ? [`${sourceCollection}/${sourceId}`] : [];
}

function buildCanonicalIndex(events) {
	const byId = new Map();
	const bySignature = new Map();
	const byTaskId = new Map();
	const bySourceKey = new Map();

	const add = (map, key, id) => {
		if (!key) return;
		const ids = map.get(key) || [];
		if (!ids.includes(id)) ids.push(id);
		map.set(key, ids);
	};

	for (const event of events) {
		const id = normalizeId(event.id);
		if (!id) continue;
		const descriptor = describeRecord(event.data || event);
		byId.set(id, event);
		add(bySignature, signatureForDescriptor(descriptor), id);
		for (const taskId of descriptor.taskIds) add(byTaskId, taskId, id);
		for (const sourceKey of migrationSourceKeys(event.data || event)) {
			add(bySourceKey, sourceKey, id);
		}
	}

	return { byId, bySignature, byTaskId, bySourceKey };
}

function buildPropertyIndexes(properties) {
	const byId = new Map();
	const byTitle = new Map();
	for (const property of properties) {
		const id = normalizeId(property.id);
		if (!id) continue;
		const data = property.data || property;
		byId.set(id, { id, data });
		const title = normalizeText(data.title);
		if (title) {
			const matches = byTitle.get(title) || [];
			matches.push({ id, data });
			byTitle.set(title, matches);
		}
	}
	return { byId, byTitle };
}

function resolveProperty(data, propertyIndexes, explicitPropertyId) {
	const requestedId = normalizeId(explicitPropertyId || data.propertyId);
	if (requestedId && propertyIndexes.byId.has(requestedId)) {
		return { property: propertyIndexes.byId.get(requestedId), inferred: false };
	}

	const propertyTitle = normalizeText(firstValue(data, ['propertyTitle', 'property']));
	const titleMatches = propertyTitle ? propertyIndexes.byTitle.get(propertyTitle) || [] : [];
	if (titleMatches.length === 1) {
		return { property: titleMatches[0], inferred: true };
	}

	return {
		property: null,
		inferred: false,
		requestedId,
		propertyTitle,
		ambiguousTitle: titleMatches.length > 1,
	};
}

function accountIdForProperty(property) {
	return normalizeId(
		firstValue(property?.data || {}, ['accountId', 'userId', 'ownerId']),
	);
}

function featureSummary(descriptor) {
	return {
		hasAttachments: descriptor.hasAttachments,
		hasFinancials: descriptor.actualCost !== undefined,
		hasAttribution: descriptor.hasAttribution,
		hasTaskLinks: descriptor.taskIds.length > 0,
		hasEquipmentLinks: descriptor.deviceIds.length > 0,
	};
}

function findDuplicateMatches(sourceKey, sourceId, descriptor, canonicalIndex) {
	const matches = new Map();
	const add = (ids, reason) => {
		for (const id of ids || []) {
			const reasons = matches.get(id) || [];
			if (!reasons.includes(reason)) reasons.push(reason);
			matches.set(id, reasons);
		}
	};

	if (sourceId && canonicalIndex.byId.has(sourceId)) add([sourceId], 'same_document_id');
	add(canonicalIndex.bySourceKey.get(sourceKey), 'migration_provenance');
	add(canonicalIndex.bySignature.get(signatureForDescriptor(descriptor)), 'exact_signature');
	for (const taskId of descriptor.taskIds) {
		add(canonicalIndex.byTaskId.get(taskId), `shared_task:${taskId}`);
	}

	return Array.from(matches.entries()).map(([eventId, reasons]) => ({ eventId, reasons }));
}

function baseResult({ sourceType, sourceId, descriptor, data }) {
	return {
		sourceType,
		sourceId,
		outcome: OUTCOMES.MANUAL_REVIEW,
		reasons: [],
		resolvedAccountId: descriptor.accountId,
		resolvedPropertyId: descriptor.propertyId,
		signature: signatureForDescriptor(descriptor),
		features: featureSummary(descriptor),
		fieldNames: Object.keys(data || {}).sort(),
		duplicateMatches: [],
	};
}

function classifyCollectionRecord({ id, data, propertyIndexes, canonicalIndex }) {
	const propertyResolution = resolveProperty(data, propertyIndexes);
	const propertyAccountId = accountIdForProperty(propertyResolution.property);
	const descriptor = describeRecord(data, {
		propertyId: propertyResolution.property?.id,
		accountId: normalizeId(data.accountId) || propertyAccountId,
	});
	const result = baseResult({
		sourceType: 'maintenanceHistory',
		sourceId: id,
		descriptor,
		data,
	});

	if (!propertyResolution.property) {
		result.outcome = propertyResolution.ambiguousTitle
			? OUTCOMES.MANUAL_REVIEW
			: OUTCOMES.ORPHANED;
		result.reasons.push(
			propertyResolution.ambiguousTitle
				? 'property_title_matches_multiple_properties'
				: 'property_not_resolved',
		);
		return result;
	}

	if (normalizeId(data.accountId) && propertyAccountId && normalizeId(data.accountId) !== propertyAccountId) {
		result.outcome = OUTCOMES.MANUAL_REVIEW;
		result.reasons.push('account_conflicts_with_property');
		return result;
	}
	if (!descriptor.accountId) result.reasons.push('account_not_resolved');
	if (!descriptor.serviceDate) result.reasons.push('service_date_missing');
	if (!descriptor.title && !descriptor.description) result.reasons.push('historical_description_missing');
	if (result.reasons.length) {
		result.outcome = OUTCOMES.MANUAL_REVIEW;
		return result;
	}

	const sourceKey = `maintenanceHistory/${id}`;
	result.duplicateMatches = findDuplicateMatches(
		sourceKey,
		id,
		descriptor,
		canonicalIndex,
	);
	const definitive = result.duplicateMatches.some((match) =>
		match.reasons.some((reason) => reason === 'same_document_id' || reason === 'migration_provenance'),
	);
	if (definitive) {
		result.outcome = OUTCOMES.ALREADY_REPRESENTED;
		result.reasons.push('canonical_event_already_represents_source');
	} else if (result.duplicateMatches.length) {
		result.outcome = OUTCOMES.POSSIBLE_DUPLICATE;
		result.reasons.push('canonical_duplicate_requires_review');
	} else {
		result.outcome = propertyResolution.inferred
			? OUTCOMES.READY_WITH_INFERENCE
			: OUTCOMES.READY;
		if (propertyResolution.inferred) result.reasons.push('property_inferred_from_unique_title');
	}
	return result;
}

function classifyEmbeddedRecord({
	sourceType,
	sourceId,
	data,
	property,
	deviceId,
	canonicalIndex,
}) {
	const descriptor = describeRecord(data, {
		propertyId: property?.id,
		accountId: accountIdForProperty(property),
		deviceId,
	});
	const result = baseResult({ sourceType, sourceId, descriptor, data });
	const text = normalizeId(descriptor.description || descriptor.title);

	if (!text || NON_HISTORY_PATTERNS.some((pattern) => pattern.test(text))) {
		result.outcome = OUTCOMES.EXCLUDED_NON_HISTORY;
		result.reasons.push(text ? 'planned_or_placeholder_activity' : 'empty_embedded_record');
		return result;
	}
	if (!property?.id || !descriptor.accountId) result.reasons.push('property_or_account_not_resolved');
	if (!descriptor.serviceDate) result.reasons.push('service_date_missing');
	if (result.reasons.length) {
		result.outcome = OUTCOMES.MANUAL_REVIEW;
		return result;
	}

	result.duplicateMatches = findDuplicateMatches(
		sourceId,
		'',
		descriptor,
		canonicalIndex,
	);
	if (result.duplicateMatches.length) {
		result.outcome = OUTCOMES.POSSIBLE_DUPLICATE;
		result.reasons.push('canonical_duplicate_requires_review');
	} else {
		result.outcome = OUTCOMES.READY;
	}
	return result;
}

function summarizeResults(results) {
	const outcomes = {};
	const sources = {};
	const features = {
		withAttachments: 0,
		withFinancials: 0,
		withAttribution: 0,
		withTaskLinks: 0,
		withEquipmentLinks: 0,
	};
	const fieldCoverage = {};

	for (const result of results) {
		outcomes[result.outcome] = (outcomes[result.outcome] || 0) + 1;
		sources[result.sourceType] = (sources[result.sourceType] || 0) + 1;
		if (result.features.hasAttachments) features.withAttachments += 1;
		if (result.features.hasFinancials) features.withFinancials += 1;
		if (result.features.hasAttribution) features.withAttribution += 1;
		if (result.features.hasTaskLinks) features.withTaskLinks += 1;
		if (result.features.hasEquipmentLinks) features.withEquipmentLinks += 1;
		fieldCoverage[result.sourceType] ||= {};
		for (const fieldName of result.fieldNames) {
			fieldCoverage[result.sourceType][fieldName] =
				(fieldCoverage[result.sourceType][fieldName] || 0) + 1;
		}
	}

	return {
		totalCandidates: results.length,
		outcomes,
		sources,
		features,
		fieldCoverage,
	};
}

module.exports = {
	OUTCOMES,
	buildCanonicalIndex,
	buildPropertyIndexes,
	classifyCollectionRecord,
	classifyEmbeddedRecord,
	describeRecord,
	signatureForDescriptor,
	summarizeResults,
};
