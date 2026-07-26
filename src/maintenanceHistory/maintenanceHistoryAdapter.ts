export type MaintenanceHistorySource =
	| 'maintenanceEvents'
	| 'maintenanceHistory'
	| 'property.taskHistory'
	| 'property.maintenanceHistory'
	| 'device.maintenanceHistory';

export interface MaintenanceHistorySourceRecord {
	source: MaintenanceHistorySource;
	record: Record<string, any>;
	sourceId?: string;
	propertyId?: string;
	deviceId?: string;
	index?: number;
}

export type AdaptedMaintenanceHistoryRecord = Record<string, any> & {
	id: string;
	historySource: MaintenanceHistorySource;
	historySourceId: string;
	historySourceKey: string;
	isCanonicalMaintenanceEvent: boolean;
};

const SOURCE_PRIORITY: Record<MaintenanceHistorySource, number> = {
	maintenanceEvents: 0,
	maintenanceHistory: 1,
	'property.taskHistory': 2,
	'property.maintenanceHistory': 3,
	'device.maintenanceHistory': 4,
};

const normalizeString = (value: unknown): string => String(value || '').trim();

const toIsoString = (value: any): string => {
	if (!value) return '';
	if (typeof value?.toDate === 'function') return value.toDate().toISOString();
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'object' && Number.isFinite(value.seconds)) {
		return new Date(value.seconds * 1000).toISOString();
	}
	return normalizeString(value);
};

const dedupeStrings = (...values: unknown[]): string[] =>
	Array.from(
		new Set(
			values
				.flatMap((value) => (Array.isArray(value) ? value : [value]))
				.map(normalizeString)
				.filter(Boolean),
		),
	);

const numberOrUndefined = (value: unknown): number | undefined => {
	if (value === null || value === undefined || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeFinancials = (record: Record<string, any>) => {
	if (record.financials && typeof record.financials === 'object') {
		return record.financials;
	}
	const actualCost = numberOrUndefined(
		record.totalCost ?? record.actualCost ?? record.cost ?? record.amount,
	);
	const actual = {
		contractorCost: numberOrUndefined(record.contractorCost),
		materialsCost: numberOrUndefined(record.materialsCost ?? record.partsCost),
		laborCost: numberOrUndefined(record.laborCost),
		otherCost: numberOrUndefined(record.otherCost ?? record.taxAmount),
	};
	const cleanedActual = Object.fromEntries(
		Object.entries(actual).filter(([, value]) => value !== undefined),
	);
	if (actualCost === undefined && Object.keys(cleanedActual).length === 0) {
		return undefined;
	}
	return {
		...(actualCost !== undefined ? { actualCost } : {}),
		...(Object.keys(cleanedActual).length ? { actual: cleanedActual } : {}),
		currency: normalizeString(record.currency) || 'USD',
	};
};

const normalizeAttachments = (record: Record<string, any>) => {
	const attachments = Array.isArray(record.attachments) ? [...record.attachments] : [];
	const completionFile = record.completionFile || record.completionFileData;
	if (completionFile?.url) {
		attachments.push({
			url: completionFile.url,
			fileName: completionFile.fileName || completionFile.name || 'attachment',
			fileSize: Number(completionFile.fileSize || completionFile.size || 0),
			mimeType:
				completionFile.mimeType || completionFile.type || 'application/octet-stream',
			uploadedAt: completionFile.uploadedAt,
			description: completionFile.description || 'Completion file',
		});
	}
	const seenUrls = new Set<string>();
	const normalized = attachments
		.map((attachment: Record<string, any>) => {
			const url = normalizeString(attachment?.url || attachment?.fileUrl);
			if (!url || seenUrls.has(url)) return null;
			seenUrls.add(url);
			return {
				...attachment,
				url,
				fileName:
					normalizeString(attachment?.fileName || attachment?.name) || 'attachment',
				fileSize: Number(attachment?.fileSize || attachment?.size || 0),
				mimeType:
					normalizeString(attachment?.mimeType || attachment?.type) ||
					'application/octet-stream',
			};
		})
		.filter(Boolean);
	return normalized.length ? normalized : undefined;
};

const normalizePerformedBy = (record: Record<string, any>) => {
	if (record.performedBy && typeof record.performedBy === 'object') {
		return record.performedBy;
	}
	const id = normalizeString(record.completedBy || record.contractorId);
	const displayName = normalizeString(record.completedByName || record.contractorName);
	if (!id && !displayName) return undefined;
	return {
		type: record.contractorId || displayName ? 'external_provider' : 'user',
		...(id ? { id } : {}),
		...(displayName ? { displayName } : {}),
	};
};

const sourceIdentity = (input: MaintenanceHistorySourceRecord): string => {
	const explicitId = normalizeString(input.sourceId || input.record?.id);
	if (explicitId) return explicitId;
	const contextId = normalizeString(input.deviceId || input.propertyId) || 'unknown';
	return `${contextId}:${input.index ?? 0}`;
};

const normalizedText = (record: Record<string, any>): string =>
	normalizeString(
		record.title ||
			record.taskTitle ||
			record.servicePerformed ||
			record.description ||
			record.completionNotes ||
			record.notes,
	)
		.toLowerCase()
		.replace(/\s+/g, ' ');

const aliasSignature = (record: AdaptedMaintenanceHistoryRecord): string =>
	[
		normalizeString(record.propertyId),
		normalizeString(record.serviceDate || record.completionDate || record.date).slice(0, 10),
		normalizedText(record),
		(record.deviceIds || []).join(','),
	].join('|');

export const adaptMaintenanceHistoryRecord = (
	input: MaintenanceHistorySourceRecord,
): AdaptedMaintenanceHistoryRecord => {
	const record = input.record || {};
	const historySourceId = sourceIdentity(input);
	const completionDate = toIsoString(
		record.serviceDate ||
			record.completionDate ||
			record.date ||
			record.timestamp ||
			record.completedAt ||
			record.createdAt,
	);
	const title = normalizeString(
		record.title ||
			record.taskTitle ||
			record.servicePerformed ||
			record.maintenanceType ||
			record.description,
	);
	const description = normalizeString(
		record.description || record.completionNotes || record.notes || record.servicePerformed,
	);
	const propertyId = normalizeString(
		record.propertyId || record.location?.propertyId || input.propertyId,
	);
	const deviceIds = dedupeStrings(
		record.deviceIds,
		record.deviceId,
		record.assignedDeviceId,
		input.deviceId,
	);
	const linkedTaskIds = dedupeStrings(
		record.linkedTaskIds,
		record.originalTaskId,
		record.linkedTaskId,
		record.taskId,
		record.assignedTaskId,
	);
	const financials = normalizeFinancials(record);
	const attachments = normalizeAttachments(record);
	const performedBy = normalizePerformedBy(record);

	return {
		...record,
		id: normalizeString(record.id) || `${input.source}:${historySourceId}`,
		...(propertyId ? { propertyId } : {}),
		...(completionDate
			? { serviceDate: completionDate, completionDate }
			: {}),
		...(title ? { title } : {}),
		...(description ? { description } : {}),
		...(deviceIds.length ? { deviceIds } : {}),
		...(linkedTaskIds.length ? { linkedTaskIds } : {}),
		...(financials ? { financials } : {}),
		...(attachments ? { attachments } : {}),
		...(performedBy ? { performedBy } : {}),
		historySource: input.source,
		historySourceId,
		historySourceKey: `${input.source}:${historySourceId}`,
		isCanonicalMaintenanceEvent: input.source === 'maintenanceEvents',
	};
};

const migrationSourceKey = (
	record: AdaptedMaintenanceHistoryRecord,
): string | null => {
	const migration = record?.data?.migration || record?.migration;
	const sourceCollection = normalizeString(migration?.sourceCollection);
	const sourceId = normalizeString(migration?.sourceId);
	return sourceCollection && sourceId ? `${sourceCollection}:${sourceId}` : null;
};

const recordTime = (record: AdaptedMaintenanceHistoryRecord): number => {
	const value = record.serviceDate || record.completionDate || record.date || record.createdAt;
	const parsed = new Date(value || 0).getTime();
	return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Creates the single UI-facing Maintenance History shape. Automatic dedupe is
 * intentionally limited to definitive identity, explicit migration
 * provenance, and the two property embedded alias fields. Similar content from
 * independent records is retained for migration review rather than guessed to
 * be duplicate work.
 */
export const mergeMaintenanceHistorySources = (
	inputs: MaintenanceHistorySourceRecord[],
): AdaptedMaintenanceHistoryRecord[] => {
	const adapted = inputs
		.map(adaptMaintenanceHistoryRecord)
		.filter((record) => record.status !== 'deleted' && !record.deletedAt)
		.sort(
			(a, b) =>
				SOURCE_PRIORITY[a.historySource] - SOURCE_PRIORITY[b.historySource],
		);
	const retained: AdaptedMaintenanceHistoryRecord[] = [];
	const sourceKeys = new Set<string>();
	const canonicalIds = new Set<string>();
	const representedLegacyKeys = new Set<string>();
	const propertyAliasSignatures = new Set<string>();

	for (const record of adapted) {
		if (sourceKeys.has(record.historySourceKey)) continue;

		if (record.historySource === 'maintenanceEvents') {
			canonicalIds.add(record.id);
			const representedSource = migrationSourceKey(record);
			if (representedSource) representedLegacyKeys.add(representedSource);
		} else if (
			record.historySource === 'maintenanceHistory' &&
			(canonicalIds.has(record.id) ||
				representedLegacyKeys.has(`maintenanceHistory:${record.historySourceId}`))
		) {
			sourceKeys.add(record.historySourceKey);
			continue;
		}

		if (
			record.historySource === 'property.taskHistory' ||
			record.historySource === 'property.maintenanceHistory'
		) {
			const signature = aliasSignature(record);
			if (propertyAliasSignatures.has(signature)) {
				sourceKeys.add(record.historySourceKey);
				continue;
			}
			propertyAliasSignatures.add(signature);
		}

		sourceKeys.add(record.historySourceKey);
		retained.push(record);
	}

	return retained.sort((a, b) => recordTime(b) - recordTime(a));
};

export const propertyEmbeddedHistorySources = (
	property: Record<string, any> | null | undefined,
): MaintenanceHistorySourceRecord[] => {
	if (!property) return [];
	const propertyId = normalizeString(property.id);
	const sources: MaintenanceHistorySourceRecord[] = [];
	for (const [source, records] of [
		['property.taskHistory', property.taskHistory],
		['property.maintenanceHistory', property.maintenanceHistory],
	] as const) {
		if (!Array.isArray(records)) continue;
		records.forEach((record, index) =>
			sources.push({ source, record, propertyId, index }),
		);
	}
	return sources;
};

export const deviceEmbeddedHistorySources = (
	device: Record<string, any> | null | undefined,
): MaintenanceHistorySourceRecord[] => {
	if (!device || !Array.isArray(device.maintenanceHistory)) return [];
	const deviceId = normalizeString(device.id);
	const propertyId = normalizeString(device.propertyId || device.location?.propertyId);
	return device.maintenanceHistory.map((record: Record<string, any>, index: number) => ({
		source: 'device.maintenanceHistory',
		record,
		propertyId,
		deviceId,
		index,
	}));
};

const isMaintenanceHistorySource = (
	value: unknown,
): value is MaintenanceHistorySource =>
	typeof value === 'string' && value in SOURCE_PRIORITY;

/**
 * Rehydrates already-adapted records into source inputs so another supported
 * compatibility source can be added without losing the original identity or
 * provenance metadata.
 */
export const adaptedMaintenanceHistorySources = (
	records: readonly Record<string, any>[],
): MaintenanceHistorySourceRecord[] =>
	records.map((record) => ({
		source: isMaintenanceHistorySource(record.historySource)
			? record.historySource
			: 'maintenanceEvents',
		sourceId: normalizeString(record.historySourceId || record.id),
		propertyId: normalizeString(record.propertyId),
		record,
	}));

/**
 * Adds the final embedded equipment compatibility source through the same
 * adapter used by collection and property history. Consumers should use this
 * boundary instead of reading or merging device.maintenanceHistory directly.
 */
export const mergeMaintenanceHistoryWithDeviceSources = (
	records: readonly Record<string, any>[],
	devices: readonly Record<string, any>[],
): AdaptedMaintenanceHistoryRecord[] =>
	mergeMaintenanceHistorySources([
		...adaptedMaintenanceHistorySources(records),
		...devices.flatMap(deviceEmbeddedHistorySources),
	]);
