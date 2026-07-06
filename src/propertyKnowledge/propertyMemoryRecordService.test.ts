import {
	getEmbeddedPropertyDocuments,
	getEmbeddedPropertyKnowledgeSuggestions,
	mergePropertyDocuments,
	mergePropertyKnowledgeSuggestions,
} from './propertyMemoryRecordService';
import type { Property, PropertyDocument } from '../types/Property.types';
import type { PropertyKnowledgeSuggestion } from '../types/PropertyKnowledge.types';

const property: Partial<Property> = {
	id: 'property-1',
	accountId: 'account-1',
	userId: 'account-1',
	documents: [
		{
			id: 'doc-1',
			name: 'Legacy invoice',
			url: 'https://example.com/legacy-invoice.pdf',
			fileName: 'legacy-invoice.pdf',
			fileUrl: 'https://example.com/legacy-invoice.pdf',
			size: 1200,
			type: 'application/pdf',
			category: 'other',
			uploadedAt: '2026-07-01T12:00:00.000Z',
		},
	],
	knowledgeSuggestions: [
		{
			id: 'suggestion-1',
			propertyId: 'property-1',
			sourceDocumentId: 'doc-1',
			documentType: 'invoice',
			extractionMethod: 'metadata_placeholder',
			extractedFields: [],
			status: 'pending',
			createdAt: '2026-07-01T12:00:00.000Z',
		},
	],
};

describe('property memory record service', () => {
	test('adds property scope metadata to embedded documents and suggestions', () => {
		expect(getEmbeddedPropertyDocuments(property)).toEqual([
			expect.objectContaining({
				id: 'doc-1',
				accountId: 'account-1',
				propertyId: 'property-1',
				recordSource: 'embedded',
			}),
		]);
		expect(getEmbeddedPropertyKnowledgeSuggestions(property)).toEqual([
			expect.objectContaining({
				id: 'suggestion-1',
				accountId: 'account-1',
				propertyId: 'property-1',
				recordSource: 'embedded',
			}),
		]);
	});

	test('prefers collection documents over embedded documents with the same id', () => {
		const collectionDocuments: PropertyDocument[] = [
			{
				id: 'doc-1',
				accountId: 'account-1',
				propertyId: 'property-1',
				name: 'Collection invoice',
				url: 'https://example.com/collection-invoice.pdf',
				fileName: 'collection-invoice.pdf',
				fileUrl: 'https://example.com/collection-invoice.pdf',
				size: 2400,
				type: 'application/pdf',
				category: 'other',
				uploadedAt: '2026-07-02T12:00:00.000Z',
				acquisitionStatus: 'reviewed',
			},
			{
				id: 'doc-2',
				accountId: 'account-1',
				propertyId: 'property-1',
				name: 'Warranty',
				url: 'https://example.com/warranty.pdf',
				fileName: 'warranty.pdf',
				fileUrl: 'https://example.com/warranty.pdf',
				size: 1800,
				type: 'application/pdf',
				category: 'warranty',
				uploadedAt: '2026-07-03T12:00:00.000Z',
			},
		];

		const merged = mergePropertyDocuments(
			property.documents,
			collectionDocuments,
			property,
		);

		expect(merged).toHaveLength(2);
		expect(merged[0]).toMatchObject({
			id: 'doc-2',
			recordSource: 'collection',
		});
		expect(merged.find((document) => document.id === 'doc-1')).toMatchObject({
			name: 'Collection invoice',
			acquisitionStatus: 'reviewed',
			recordSource: 'collection',
		});
	});

	test('prefers pending suggestions first and collection data over embedded data', () => {
		const collectionSuggestions: PropertyKnowledgeSuggestion[] = [
			{
				id: 'suggestion-1',
				accountId: 'account-1',
				propertyId: 'property-1',
				sourceDocumentId: 'doc-1',
				documentType: 'invoice',
				extractionMethod: 'metadata_placeholder',
				extractedFields: [],
				status: 'accepted',
				createdAt: '2026-07-02T12:00:00.000Z',
			},
			{
				id: 'suggestion-2',
				accountId: 'account-1',
				propertyId: 'property-1',
				sourceDocumentId: 'doc-2',
				documentType: 'warranty',
				extractionMethod: 'metadata_placeholder',
				extractedFields: [],
				status: 'pending',
				createdAt: '2026-07-03T12:00:00.000Z',
			},
		];

		const merged = mergePropertyKnowledgeSuggestions(
			property.knowledgeSuggestions,
			collectionSuggestions,
			property,
		);

		expect(merged).toHaveLength(2);
		expect(merged[0]).toMatchObject({
			id: 'suggestion-2',
			status: 'pending',
			recordSource: 'collection',
		});
		expect(merged.find((suggestion) => suggestion.id === 'suggestion-1')).toMatchObject({
			status: 'accepted',
			recordSource: 'collection',
		});
	});
});
