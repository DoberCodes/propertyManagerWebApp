import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';
import {
	PropertyDocument,
	PropertyDocumentCategory,
} from '../types/Property.types';
import { assertStorageQuotaForFiles, resolveStorageAccountId } from './storageQuota';
import { signalStorageUsageUpdated } from './storageUsageEvents';

const MAX_PROPERTY_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB

const buildFileName = (file: File, propertyId: string) => {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	const safePropertyId = propertyId.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `document-${safePropertyId}-${Date.now()}-${Math.random()
		.toString(36)
		.slice(2, 10)}-${safeName}`;
};

export const isValidPropertyDocument = (file: File): boolean => {
	const allowedTypes = [
		'image/',
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'text/plain',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	];

	const isAllowedType = allowedTypes.some((type) => file.type.startsWith(type));
	return isAllowedType && file.size <= MAX_PROPERTY_DOCUMENT_BYTES;
};

export const uploadPropertyDocument = async (
	file: File,
	propertyId: string,
	category: PropertyDocumentCategory,
	customName?: string,
): Promise<PropertyDocument> => {
	if (!isValidPropertyDocument(file)) {
		throw new Error('Invalid file. Please use a valid file type under 10MB.');
	}

	await assertStorageQuotaForFiles(file, { propertyId });
	const accountId = await resolveStorageAccountId(propertyId);

	const fileName = buildFileName(file, propertyId);
	const storagePath = `properties/${accountId}/${fileName}`;
	const storageRef = ref(storage, storagePath);

	await uploadBytes(storageRef, file, { contentType: file.type });
	const url = await getDownloadURL(storageRef);
	signalStorageUsageUpdated();

	const trimmedCustomName = String(customName || '').trim();
	const resolvedDocumentName = trimmedCustomName || file.name;

	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		name: resolvedDocumentName,
		url,
		size: file.size,
		type: file.type,
		category,
		uploadedAt: new Date().toISOString(),
		storagePath,
	};
};

export const deletePropertyDocumentFile = async (storagePath?: string) => {
	if (!storagePath) return;
	await deleteObject(ref(storage, storagePath));
	signalStorageUsageUpdated();
};
