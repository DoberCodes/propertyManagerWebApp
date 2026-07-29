import { callFirebaseFunction } from '../config/firebaseFunctions';
import type { PropertyDocument } from '../types/Property.types';

type ProcessPropertyDocumentAcquisitionRequest = {
	propertyId: string;
	documentId: string;
};

export type ProcessPropertyDocumentAcquisitionResponse = {
	success: boolean;
	suggestionCount?: number;
	suggestionId?: string;
	message?: string;
};

export const isPdfPropertyDocument = (
	document?: Pick<PropertyDocument, 'type' | 'fileName' | 'name'> | null,
) => {
	if (!document) return false;
	const mimeType = String(document.type || '').toLowerCase();
	const fileName = String(document.fileName || document.name || '').toLowerCase();
	return mimeType.includes('pdf') || fileName.endsWith('.pdf');
};

export const isDocxPropertyDocument = (
	document?: Pick<PropertyDocument, 'type' | 'fileName' | 'name'> | null,
) => {
	if (!document) return false;
	const mimeType = String(document.type || '').toLowerCase();
	const fileName = String(document.fileName || document.name || '').toLowerCase();
	return mimeType.includes('wordprocessingml') || fileName.endsWith('.docx');
};

export const isProcessablePropertyDocument = (
	document?: Pick<PropertyDocument, 'type' | 'fileName' | 'name'> | null,
) => isPdfPropertyDocument(document) || isDocxPropertyDocument(document);

export type PropertyDocumentScanAction = 'check' | 'rescan' | null;

export const getPropertyDocumentScanAction = ({
	document,
	hasSuggestion,
	suggestionCount,
	suggestionStatus,
	isRetryable,
}: {
	document?: Pick<PropertyDocument, 'type' | 'fileName' | 'name'> | null;
	hasSuggestion: boolean;
	suggestionCount: number;
	suggestionStatus?: string;
	isRetryable: boolean;
}): PropertyDocumentScanAction => {
	if (isRetryable || suggestionStatus === 'pending') return null;
	if (hasSuggestion && isProcessablePropertyDocument(document)) return 'rescan';
	return !hasSuggestion || suggestionCount === 0 ? 'check' : null;
};

export const processPropertyDocumentAcquisition = async ({
	propertyId,
	documentId,
}: ProcessPropertyDocumentAcquisitionRequest) => {
	const result = await callFirebaseFunction<
		ProcessPropertyDocumentAcquisitionRequest,
		ProcessPropertyDocumentAcquisitionResponse
	>('processPropertyDocumentAcquisition', { propertyId, documentId });
	return result.data;
};
