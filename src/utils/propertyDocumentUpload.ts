import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth } from '../config/firebase';
import { storage } from '../config/firebase';
import {
	PropertyDocument,
	PropertyDocumentCategory,
	PropertyDocumentLinks,
	PropertyDocumentType,
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

export const toPropertyDocumentType = (
	category: PropertyDocumentCategory,
	fileName?: string,
): PropertyDocumentType => {
	if (category === 'manual') return 'manual';
	if (category === 'warranty') return 'warranty';

	const normalizedName = String(fileName || '').toLowerCase();
	if (normalizedName.includes('invoice')) return 'invoice';
	if (normalizedName.includes('receipt')) return 'receipt';
	if (normalizedName.includes('inspection') || normalizedName.includes('report')) {
		return 'inspection_report';
	}
	if (
		normalizedName.includes('contractor') ||
		normalizedName.includes('installer') ||
		normalizedName.includes('service')
	) {
		return 'contractor_document';
	}
	return 'unknown';
};

export const withPropertyDocumentLinks = (
	document: PropertyDocument,
	links: PropertyDocumentLinks,
): PropertyDocument => ({
	...document,
	links: {
		...(document.links || {}),
		...links,
		assetIds: [
			...(document.links?.assetIds || []),
			...(links.assetIds || []),
		].filter((value, index, values) => values.indexOf(value) === index),
		taskIds: [
			...(document.links?.taskIds || []),
			...(links.taskIds || []),
		].filter((value, index, values) => values.indexOf(value) === index),
		maintenanceEventIds: [
			...(document.links?.maintenanceEventIds || []),
			...(links.maintenanceEventIds || []),
		].filter((value, index, values) => values.indexOf(value) === index),
		contractorIds: [
			...(document.links?.contractorIds || []),
			...(links.contractorIds || []),
		].filter((value, index, values) => values.indexOf(value) === index),
		warrantyIds: [
			...(document.links?.warrantyIds || []),
			...(links.warrantyIds || []),
		].filter((value, index, values) => values.indexOf(value) === index),
		partIds: [
			...(document.links?.partIds || []),
			...(links.partIds || []),
		].filter((value, index, values) => values.indexOf(value) === index),
	},
});

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
	const uploadedBy = auth.currentUser?.uid;

	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		propertyId,
		name: resolvedDocumentName,
		url,
		fileName: resolvedDocumentName,
		fileUrl: url,
		size: file.size,
		type: file.type,
		category,
		documentType: toPropertyDocumentType(category, resolvedDocumentName),
		...(uploadedBy ? { uploadedBy } : {}),
		links: {},
		acquisitionStatus: 'not_reviewed',
		extractedKnowledgeSuggestionIds: [],
		uploadedAt: new Date().toISOString(),
		storagePath,
	};
};

export const deletePropertyDocumentFile = async (storagePath?: string) => {
	if (!storagePath) return;
	await deleteObject(ref(storage, storagePath));
	signalStorageUsageUpdated();
};
