import { PropertyDocument } from '../types/Property.types';
import {
	MaintleyFinding,
	MaintleyIntelligenceContext,
	MaintleyRelationshipEvidence,
} from './types';

const MAX_RELATIONSHIP_EVIDENCE = 8;

const getRecordName = (
	record: Record<string, unknown> | undefined,
	fallback: string,
): string =>
	String(
		record?.name ||
			record?.title ||
			record?.fileName ||
			record?.model ||
			fallback,
	).trim();

const getTaskIds = (finding: MaintleyFinding): Set<string> => {
	const ids = new Set<string>();
	const taskId = String(finding.metadata.taskId || '').trim();
	if (taskId) ids.add(taskId);

	for (const key of ['affectedTaskIds', 'relatedTaskIds']) {
		const values = finding.metadata[key];
		if (Array.isArray(values)) {
			values.map(String).map((value) => value.trim()).filter(Boolean).forEach((value) => ids.add(value));
		}
	}

	return ids;
};

const createNameMap = <T extends { id: string }>(
	records: T[],
	fallback: string,
): Map<string, string> =>
	new Map(
		records.map((record) => [
			record.id,
			getRecordName(record as unknown as Record<string, unknown>, fallback),
		]),
	);

const createDocumentNameMap = (
	documents: PropertyDocument[],
): Map<string, string> =>
	new Map(
		documents.map((document) => [
			document.id,
			getRecordName(
				document as unknown as Record<string, unknown>,
				'Connected document',
			),
		]),
	);

export const getMaintleyRelationshipEvidence = (
	finding: MaintleyFinding,
	context: MaintleyIntelligenceContext,
): MaintleyRelationshipEvidence[] => {
	const equipmentIds = new Set(finding.affectedSystemIds);
	const taskIds = getTaskIds(finding);
	if (equipmentIds.size === 0 && taskIds.size === 0) return [];

	const spaceNames = createNameMap(
		(context.spaces || []).filter((space) => !space.isArchived),
		'Connected space',
	);
	const supplyNames = createNameMap(
		(context.supplies || []).filter((supply) => !supply.isArchived),
		'Connected supply',
	);
	const documentNames = createDocumentNameMap(context.documents);
	const evidence: MaintleyRelationshipEvidence[] = [];

	for (const link of context.propertyKnowledgeLinks || []) {
		if (link.propertyId !== context.property.id) continue;

		let label = '';
		if (
			link.fromType === 'equipment' &&
			equipmentIds.has(link.fromId) &&
			link.relationshipType === 'located_in' &&
			link.toType === 'space'
		) {
			const name = spaceNames.get(link.toId);
			if (name) label = `Located in ${name}`;
		} else if (
			link.fromType === 'task' &&
			taskIds.has(link.fromId) &&
			link.relationshipType === 'occurs_in' &&
			link.toType === 'space'
		) {
			const name = spaceNames.get(link.toId);
			if (name) label = `Applies to ${name}`;
		} else if (
			(link.fromType === 'equipment' || link.fromType === 'task') &&
			((link.fromType === 'equipment' && equipmentIds.has(link.fromId)) ||
				(link.fromType === 'task' && taskIds.has(link.fromId))) &&
			link.relationshipType === 'uses' &&
			link.toType === 'supply'
		) {
			const name = supplyNames.get(link.toId);
			if (name) label = `Uses ${name}`;
		} else if (
			link.fromType === 'document' &&
			link.relationshipType === 'documents' &&
			((link.toType === 'equipment' && equipmentIds.has(link.toId)) ||
				(link.toType === 'task' && taskIds.has(link.toId)))
		) {
			const name = documentNames.get(link.fromId);
			if (name) label = `Supported by ${name}`;
		}

		if (label) {
			evidence.push({
				linkId: link.id,
				relationshipType: link.relationshipType,
				source: link.source,
				label,
			});
		}
	}

	return evidence
		.filter(
			(item, index, items) =>
				items.findIndex((candidate) => candidate.label === item.label) === index,
		)
		.sort((first, second) =>
			first.label.localeCompare(second.label) || first.linkId.localeCompare(second.linkId),
		)
		.slice(0, MAX_RELATIONSHIP_EVIDENCE);
};

export const addMaintleyRelationshipEvidence = (
	finding: MaintleyFinding,
	context: MaintleyIntelligenceContext,
): MaintleyFinding => {
	const relationshipEvidence = getMaintleyRelationshipEvidence(finding, context);
	if (relationshipEvidence.length === 0) return finding;

	return {
		...finding,
		metadata: {
			...finding.metadata,
			relationshipEvidence,
		},
	};
};
