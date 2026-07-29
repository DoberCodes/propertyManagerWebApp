import type {
	Device,
	Property,
	PropertyDocument,
	PropertyDocumentCategory,
	PropertyDocumentLinks,
} from '../types/Property.types';
import type { PropertyKnowledgeSuggestion } from '../types/PropertyKnowledge.types';
import {
	uploadPropertyDocument,
	withPropertyDocumentLinks,
} from '../utils/propertyDocumentUpload';
import {
	createPendingKnowledgeSuggestionFromFile,
	markDocumentWithKnowledgeSuggestion,
} from './propertyKnowledgeAcquisition';
import { savePropertyMemoryRecordsToCollections } from './propertyMemoryRecordService';
import {
	isProcessablePropertyDocument,
	isPropertyDocumentKnowledgeScanEligible,
} from './propertyKnowledgeProcessing';
import type { ProcessPropertyDocumentAcquisitionResponse } from './propertyKnowledgeProcessing';

type PropertyMemoryDocumentUploadInput = {
	files: File[];
	propertyId: string;
	category: PropertyDocumentCategory;
	property?: Property;
	systems?: Device[];
	customNameForSingleFile?: string;
	uploadContext?: PropertyMemoryDocumentUploadContext;
	enableKnowledgeAcquisition?: boolean;
};

type PropertyMemoryDocumentUploadResult = {
	documents: PropertyDocument[];
	knowledgeSuggestions: PropertyKnowledgeSuggestion[];
	processableDocuments: PropertyDocument[];
};

export type PropertyMemoryDocumentUploadContext = PropertyDocumentLinks & {
	assignedTaskStatus?: string;
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

export const markPropertyDocumentAsProcessing = (
	document: PropertyDocument,
	nowIso = new Date().toISOString(),
): PropertyDocument => ({
	...document,
	acquisitionStatus: 'processing',
	acquisitionStartedAt: nowIso,
	acquisitionError: '',
});

const uniqueIds = (ids?: string[]) =>
	(ids || [])
		.map((id) => String(id || '').trim())
		.filter(Boolean)
		.filter((value, index, values) => values.indexOf(value) === index);

export const applyPropertyDocumentUploadContext = (
	document: PropertyDocument,
	context?: PropertyMemoryDocumentUploadContext,
): PropertyDocument => {
	if (!context) return document;

	const links: PropertyDocumentLinks = {
		assetIds: uniqueIds(context.assetIds),
		taskIds: uniqueIds(context.taskIds),
		maintenanceEventIds: uniqueIds(context.maintenanceEventIds),
		contractorIds: uniqueIds(context.contractorIds),
		warrantyIds: uniqueIds(context.warrantyIds),
		partIds: uniqueIds(context.partIds),
	};
	const hasLinks = Object.values(links).some((ids = []) => ids.length > 0);
	const linkedDocument = hasLinks
		? withPropertyDocumentLinks(document, links)
		: document;
	const assignedTaskStatus = String(context.assignedTaskStatus || '').trim();

	return assignedTaskStatus
		? {
				...linkedDocument,
				assignedTaskStatus,
		  }
		: linkedDocument;
};

export const preparePropertyMemoryDocumentUploads = async ({
	files,
	propertyId,
	category,
	property,
	systems = [],
	customNameForSingleFile,
	uploadContext,
	enableKnowledgeAcquisition = true,
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
	const contextualDocuments = uploadedDocuments.map((document) =>
		applyPropertyDocumentUploadContext(document, uploadContext),
	);

	const knowledgeSuggestions = (
		await Promise.all(
			contextualDocuments.map((document, index) =>
				!enableKnowledgeAcquisition ||
				!isPropertyDocumentKnowledgeScanEligible(document) ||
				isProcessablePropertyDocument(document)
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

	const documents = contextualDocuments.map((document) => {
		if (
			isPropertyDocumentKnowledgeScanEligible(document) &&
			isProcessablePropertyDocument(document)
		) {
			return enableKnowledgeAcquisition
				? markPropertyDocumentAsProcessing(document)
				: document;
		}
		const suggestion = knowledgeSuggestions.find(
			(candidate) => candidate.sourceDocumentId === document.id,
		);
		return suggestion
			? markDocumentWithKnowledgeSuggestion(document, suggestion)
			: document;
	});

	await savePropertyMemoryRecordsToCollections({
		property: property || { id: propertyId },
		documents,
		knowledgeSuggestions,
	});

	return {
		documents,
		knowledgeSuggestions,
		processableDocuments: documents.filter(
			(document) =>
				isPropertyDocumentKnowledgeScanEligible(document) &&
				isProcessablePropertyDocument(document),
		),
	};
};

export const startPropertyDocumentKnowledgeProcessing = ({
	documents,
}: StartPdfDocumentKnowledgeProcessingInput) => {
	documents.forEach((document) => {
		if (
			!document.id ||
			!isPropertyDocumentKnowledgeScanEligible(document) ||
			!isProcessablePropertyDocument(document)
		) return;
		// Persistent document-review lifecycle notifications are backend-owned.
	});
};
