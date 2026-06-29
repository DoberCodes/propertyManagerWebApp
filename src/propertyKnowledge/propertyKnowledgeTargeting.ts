import { getFinancialDisplayTotal } from '../utils/financialUtils';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
} from '../utils/maintenanceEventUtils';
import type { Device } from '../types/Property.types';
import type {
	ExtractedKnowledgeField,
	PropertyKnowledgeConfidenceLevel,
	PropertyKnowledgeSuggestion,
} from '../types/PropertyKnowledge.types';

export type KnowledgeTargetEntity =
	| 'asset'
	| 'contractor'
	| 'maintenance-event';

export interface KnowledgeTargetCandidate {
	entity: KnowledgeTargetEntity;
	recordId: string;
	label: string;
	confidenceLevel: PropertyKnowledgeConfidenceLevel;
	reason: string;
}

const normalizeText = (value?: unknown) =>
	String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const normalizeDate = (value?: unknown) => {
	if (!value) return '';
	const parsed = new Date(String(value));
	if (Number.isNaN(parsed.getTime())) return '';
	return parsed.toISOString().slice(0, 10);
};

const normalizeMoney = (value?: string) => {
	if (!value) return undefined;
	const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
	return Number.isFinite(parsed) ? parsed : undefined;
};

const getFieldValue = (
	fields: ExtractedKnowledgeField[],
	fieldKey: ExtractedKnowledgeField['fieldKey'],
) =>
	fields.find((field) => field.fieldKey === fieldKey)?.userEditableValue ||
	fields.find((field) => field.fieldKey === fieldKey)?.value ||
	'';

const includesNormalized = (haystack: string, needle?: string) => {
	const normalizedNeedle = normalizeText(needle);
	if (!normalizedNeedle) return false;
	return normalizeText(haystack).includes(normalizedNeedle);
};

const buildEventSearchText = (record: any) =>
	[
		getMaintenanceEventTitle(record),
		record.title,
		record.description,
		record.completionNotes,
		record.completedByName,
		record.invoiceNumber,
		record.data?.invoiceNumber,
		...(Array.isArray(record.tags) ? record.tags : []),
		...(Array.isArray(record.attachments)
			? record.attachments.map((attachment: any) => attachment?.fileName)
			: []),
	]
		.filter(Boolean)
		.join(' ');

const hasLinkedSourceDocument = (
	record: any,
	suggestion: PropertyKnowledgeSuggestion,
) => {
	const sourceDocumentIds = Array.isArray(record.sourceDocumentIds)
		? record.sourceDocumentIds
		: [];
	if (sourceDocumentIds.map(String).includes(String(suggestion.sourceDocumentId))) {
		return true;
	}

	const attachments = Array.isArray(record.attachments) ? record.attachments : [];
	return attachments.some((attachment: any) => {
		const attachmentName = normalizeText(attachment?.fileName || attachment?.name);
		const sourceName = normalizeText(suggestion.sourceDocumentName);
		return sourceName && attachmentName === sourceName;
	});
};

export const findMaintenanceEventTargetCandidate = ({
	suggestion,
	fields,
	maintenanceHistoryRecords = [],
}: {
	suggestion: PropertyKnowledgeSuggestion;
	fields: ExtractedKnowledgeField[];
	maintenanceHistoryRecords?: any[];
}): KnowledgeTargetCandidate | undefined => {
	let best:
		| {
				score: number;
				record: any;
				reason: string;
		  }
		| undefined;

	const invoiceNumber = getFieldValue(fields, 'invoiceNumber');
	const eventDate = normalizeDate(
		getFieldValue(fields, 'maintenanceEventDate') ||
			getFieldValue(fields, 'invoiceDate') ||
			getFieldValue(fields, 'installDate'),
	);
	const contractorName =
		getFieldValue(fields, 'contractorName') || getFieldValue(fields, 'installer');
	const totalCost = normalizeMoney(getFieldValue(fields, 'totalCost'));
	const description =
		getFieldValue(fields, 'maintenanceEventDescription') ||
		getFieldValue(fields, 'servicePerformed');

	maintenanceHistoryRecords.forEach((record) => {
		if (!record?.id) return;

		const searchText = buildEventSearchText(record);
		const recordDate = normalizeDate(getMaintenanceEventDate(record));
		const recordTotal = getFinancialDisplayTotal(record.financials);
		const deviceIds = Array.isArray(record.deviceIds) ? record.deviceIds.map(String) : [];
		let score = 0;
		const reasons: string[] = [];

		if (hasLinkedSourceDocument(record, suggestion)) {
			score += 100;
			reasons.push('same source document');
		}
		if (invoiceNumber && includesNormalized(searchText, invoiceNumber)) {
			score += 80;
			reasons.push('same invoice number');
		}
		if (
			totalCost !== undefined &&
			recordTotal !== undefined &&
			Math.abs(recordTotal - totalCost) < 0.01
		) {
			score += 25;
			reasons.push('same recorded cost');
		}
		if (eventDate && recordDate && eventDate === recordDate) {
			score += 25;
			reasons.push('same service date');
		}
		if (contractorName && includesNormalized(searchText, contractorName)) {
			score += 18;
			reasons.push('same contractor');
		}
		if (description && includesNormalized(searchText, description)) {
			score += 15;
			reasons.push('similar work description');
		}
		if (
			suggestion.relatedSystemId &&
			deviceIds.includes(String(suggestion.relatedSystemId))
		) {
			score += 12;
			reasons.push('same related asset');
		}

		if (!best || score > best.score) {
			best = {
				score,
				record,
				reason: reasons.join(', '),
			};
		}
	});

	if (!best || best.score < 35) return undefined;

	return {
		entity: 'maintenance-event',
		recordId: String(best.record.id),
		label: getMaintenanceEventTitle(best.record) || 'Maintenance Event',
		confidenceLevel: best.score >= 70 ? 'high' : 'medium',
		reason:
			best.reason ||
			'Maintley found similar maintenance history for this document.',
	};
};

export const findContractorTargetCandidate = ({
	fields,
	contractors = [],
}: {
	fields: ExtractedKnowledgeField[];
	contractors?: any[];
}): KnowledgeTargetCandidate | undefined => {
	const contractorName =
		getFieldValue(fields, 'contractorName') || getFieldValue(fields, 'installer');
	const lookup = normalizeText(contractorName);
	if (!lookup) return undefined;

	const candidate = contractors.find((contractor) => {
		const name = normalizeText(contractor?.name);
		const company = normalizeText(contractor?.company);
		return name === lookup || company === lookup;
	});
	if (!candidate?.id) return undefined;

	return {
		entity: 'contractor',
		recordId: String(candidate.id),
		label: candidate.name || candidate.company || contractorName,
		confidenceLevel: 'high',
		reason: 'same contractor name',
	};
};

export const findAssetTargetCandidate = ({
	suggestion,
	fields,
	systems = [],
}: {
	suggestion: PropertyKnowledgeSuggestion;
	fields: ExtractedKnowledgeField[];
	systems?: Device[];
}): KnowledgeTargetCandidate | undefined => {
	if (suggestion.relatedSystemId) {
		const relatedSystem = systems.find(
			(system) => String(system.id) === String(suggestion.relatedSystemId),
		);
		if (relatedSystem?.id) {
			return {
				entity: 'asset',
				recordId: String(relatedSystem.id),
				label:
					(relatedSystem as any).name ||
					relatedSystem.type ||
					relatedSystem.assetType ||
					'Related asset',
				confidenceLevel: 'high',
				reason: 'document was uploaded from this asset',
			};
		}
	}

	const assetType = normalizeText(getFieldValue(fields, 'assetType'));
	const assetVariant = normalizeText(getFieldValue(fields, 'assetVariant'));
	const brand = normalizeText(getFieldValue(fields, 'brand'));
	const model = normalizeText(getFieldValue(fields, 'model'));
	const serial = normalizeText(getFieldValue(fields, 'serialNumber'));

	let best:
		| {
				score: number;
				system: Device;
				reason: string;
		  }
		| undefined;

	systems.forEach((system) => {
		if (!system.id) return;
		let score = 0;
		const reasons: string[] = [];
		const systemText = normalizeText(
			[
				(system as any).name,
				system.type,
				system.assetType,
				system.assetVariant,
				system.brand,
				system.model,
				system.serialNumber,
			]
				.filter(Boolean)
				.join(' '),
		);

		if (serial && normalizeText(system.serialNumber) === serial) {
			score += 90;
			reasons.push('same serial number');
		}
		if (model && normalizeText(system.model) === model) {
			score += 60;
			reasons.push('same model');
		}
		if (brand && normalizeText(system.brand) === brand) {
			score += 20;
			reasons.push('same brand');
		}
		if (assetVariant && systemText.includes(assetVariant)) {
			score += 15;
			reasons.push('same subtype');
		}
		if (assetType && systemText.includes(assetType)) {
			score += 25;
			reasons.push('same asset type');
		}

		if (!best || score > best.score) {
			best = {
				score,
				system,
				reason: reasons.join(', '),
			};
		}
	});

	if (!best || best.score < 25) return undefined;

	return {
		entity: 'asset',
		recordId: String(best.system.id),
		label:
			(best.system as any).name ||
			best.system.type ||
			best.system.assetType ||
			'Asset',
		confidenceLevel: best.score >= 60 ? 'high' : 'medium',
		reason: best.reason || 'Maintley found a similar asset record.',
	};
};
