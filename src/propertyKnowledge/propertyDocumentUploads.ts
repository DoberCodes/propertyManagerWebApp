import type { Device, Property, PropertyDocument, PropertyDocumentCategory } from '../types/Property.types';
import type { PropertyKnowledgeSuggestion } from '../types/PropertyKnowledge.types';
import { uploadPropertyDocument } from '../utils/propertyDocumentUpload';
import {
	createPendingKnowledgeSuggestionFromFile,
	markDocumentWithKnowledgeSuggestion,
} from './propertyKnowledgeAcquisition';
import { isPdfPropertyDocument } from './propertyKnowledgeProcessing';
import type { ProcessPropertyDocumentAcquisitionResponse } from './propertyKnowledgeProcessing';

type PropertyMemoryDocumentUploadInput = {
	files: File[];
	propertyId: string;
	category: PropertyDocumentCategory;
	property?: Property;
	systems?: Device[];
	customNameForSingleFile?: string;
};

type PropertyMemoryDocumentUploadResult = {
	documents: PropertyDocument[];
	knowledgeSuggestions: PropertyKnowledgeSuggestion[];
	pdfDocuments: PropertyDocument[];
};

type StartPdfDocumentKnowledgeProcessingInput = {
	propertyId: string;
	documents: PropertyDocument[];
	onProcessed?: (
		result: ProcessPropertyDocumentAcquisitionResponse,
		document: PropertyDocument,
	) => void;
	onError?: (error: unknown, document: PropertyDocument) => void;
};

export const markPdfDocumentAsProcessing = (
	document: PropertyDocument,
	nowIso = new Date().toISOString(),
): PropertyDocument => ({
	...document,
	acquisitionStatus: 'processing',
	acquisitionStartedAt: nowIso,
	acquisitionError: '',
});

export const preparePropertyMemoryDocumentUploads = async ({
	files,
	propertyId,
	category,
	property,
	systems = [],
	customNameForSingleFile,
}: PropertyMemoryDocumentUploadInput): Promise<PropertyMemoryDocumentUploadResult> => {
	const uploadedDocuments = await Promise.all(
		files.map((file) =>
			uploadPropertyDocument(
				file,
				propertyId,
				category,
				files.length === 1 ? customNameForSingleFile : undefined,
			),
		),
	);

	const knowledgeSuggestions = (
		await Promise.all(
			uploadedDocuments.map((document, index) =>
				isPdfPropertyDocument(document)
					? Promise.resolve(null)
					: createPendingKnowledgeSuggestionFromFile({
							file: files[index],
							document,
							propertyId,
							property,
							systems,
					  }),
			),
		)
	).filter((suggestion): suggestion is PropertyKnowledgeSuggestion =>
		Boolean(suggestion),
	);

	const documents = uploadedDocuments.map((document) => {
		if (isPdfPropertyDocument(document)) {
			return markPdfDocumentAsProcessing(document);
		}
		const suggestion = knowledgeSuggestions.find(
			(candidate) => candidate.sourceDocumentId === document.id,
		);
		return suggestion
			? markDocumentWithKnowledgeSuggestion(document, suggestion)
			: document;
	});

	return {
		documents,
		knowledgeSuggestions,
		pdfDocuments: documents.filter(isPdfPropertyDocument),
	};
};

export const startPdfDocumentKnowledgeProcessing = ({
	documents,
}: StartPdfDocumentKnowledgeProcessingInput) => {
	documents.forEach((document) => {
		if (!document.id || !isPdfPropertyDocument(document)) return;
		// Persistent document-review lifecycle notifications are backend-owned.
	});
};
