import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import type { PropertyDocument } from '../types/Property.types';

type ProcessPropertyDocumentAcquisitionRequest = {
	propertyId: string;
	documentId: string;
};

type ProcessPropertyDocumentAcquisitionResponse = {
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

export const processPropertyDocumentAcquisition = async ({
	propertyId,
	documentId,
}: ProcessPropertyDocumentAcquisitionRequest) => {
	const callable = httpsCallable<
		ProcessPropertyDocumentAcquisitionRequest,
		ProcessPropertyDocumentAcquisitionResponse
	>(functions, 'processPropertyDocumentAcquisition');
	const result = await callable({ propertyId, documentId });
	return result.data;
};
