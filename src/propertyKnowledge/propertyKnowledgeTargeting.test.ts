import {
	findAssetTargetCandidate,
	findContractorTargetCandidate,
	findMaintenanceEventTargetCandidate,
} from './propertyKnowledgeTargeting';
import type { Device } from '../types/Property.types';
import type {
	ExtractedKnowledgeField,
	PropertyKnowledgeSuggestion,
} from '../types/PropertyKnowledge.types';

const buildField = (
	fieldKey: ExtractedKnowledgeField['fieldKey'],
	value: string,
	targetEntity: ExtractedKnowledgeField['targetEntity'] = 'maintenanceHistory',
	targetField: string = fieldKey,
): ExtractedKnowledgeField => ({
	id: fieldKey,
	fieldKey,
	label: fieldKey,
	value,
	targetEntity,
	targetField,
});

const baseSuggestion: PropertyKnowledgeSuggestion = {
	id: 'suggestion-1',
	sourceDocumentId: 'doc-1',
	sourceDocumentName: 'Carolina Comfort Invoice.png',
	propertyId: 'property-1',
	relatedSystemId: 'hvac-1',
	documentType: 'invoice',
	extractionMethod: 'image_ocr',
	extractedFields: [],
	status: 'pending',
	createdAt: '2026-06-27T12:00:00.000Z',
};

describe('property knowledge targeting', () => {
	test('matches an existing maintenance event by invoice number, date, contractor, and cost', () => {
		const candidate = findMaintenanceEventTargetCandidate({
			suggestion: baseSuggestion,
			fields: [
				buildField('invoiceNumber', 'INV-2025-04158'),
				buildField('invoiceDate', 'June 14, 2025'),
				buildField('contractorName', 'Carolina Comfort HVAC, LLC'),
				buildField('totalCost', '$7,325.18'),
			],
			maintenanceHistoryRecords: [
				{
					id: 'event-1',
					title: 'HVAC installation',
					completionDate: '2025-06-14',
					completedByName: 'Carolina Comfort HVAC, LLC',
					completionNotes: 'Invoice number: INV-2025-04158',
					deviceIds: ['hvac-1'],
					financials: {
						currency: 'USD',
						actual: {
							contractorCost: 7325.18,
						},
					},
				},
			],
		});

		expect(candidate).toMatchObject({
			entity: 'maintenance-event',
			recordId: 'event-1',
			confidenceLevel: 'high',
		});
		expect(candidate?.reason).toContain('same invoice number');
	});

	test('matches an existing maintenance event from a previously attached source document', () => {
		const candidate = findMaintenanceEventTargetCandidate({
			suggestion: baseSuggestion,
			fields: [],
			maintenanceHistoryRecords: [
				{
					id: 'event-1',
					title: 'HVAC installation',
					sourceDocumentIds: ['doc-1'],
				},
			],
		});

		expect(candidate).toMatchObject({
			recordId: 'event-1',
			confidenceLevel: 'high',
		});
		expect(candidate?.reason).toContain('same source document');
	});

	test('matches a contractor by existing contractor name or company', () => {
		const candidate = findContractorTargetCandidate({
			fields: [buildField('contractorName', 'Carolina Comfort HVAC, LLC', 'contractor', 'name')],
			contractors: [
				{
					id: 'contractor-1',
					name: 'Carolina Comfort HVAC, LLC',
					company: 'Carolina Comfort HVAC, LLC',
				},
			],
		});

		expect(candidate).toMatchObject({
			entity: 'contractor',
			recordId: 'contractor-1',
			confidenceLevel: 'high',
		});
	});

	test('matches an asset by related system before broader inference', () => {
		const systems: Device[] = [
			{
				id: 'hvac-1',
				userId: 'user-1',
				type: 'HVAC',
				assetType: 'HVAC',
				location: {
					propertyId: 'property-1',
				},
			},
		];

		const candidate = findAssetTargetCandidate({
			suggestion: baseSuggestion,
			fields: [],
			systems,
		});

		expect(candidate).toMatchObject({
			entity: 'asset',
			recordId: 'hvac-1',
			confidenceLevel: 'high',
		});
	});
});
