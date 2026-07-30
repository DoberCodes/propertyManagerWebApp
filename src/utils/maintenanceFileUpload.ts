import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseStorage';
import { prepareStorageUpload } from './storageQuota';
import { signalStorageUsageUpdated } from './storageUsageEvents';

const MAX_MAINTENANCE_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const buildFileName = (file: File) => {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
};

export const isValidMaintenanceFile = (file: File): boolean => {
	// Allow common file types for maintenance records
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
	if (!isAllowedType) {
		return false;
	}
	if (file.size > MAX_MAINTENANCE_FILE_BYTES) {
		return false;
	}
	return true;
};

export const uploadMaintenanceFile = async (
	file: File,
	propertyId: string,
): Promise<{ url: string; name: string; size: number; type: string }> => {
	if (!isValidMaintenanceFile(file)) {
		throw new Error('Invalid file. Please use a valid file type under 10MB.');
	}
	const fileName = buildFileName(file);
	const folder = `maintenance-files/${propertyId}`;
	const storagePath = `${folder}/${fileName}`;
	const storageRef = ref(storage, storagePath);
	const uploadMetadata = await prepareStorageUpload(file, storagePath, { propertyId });

	await uploadBytes(storageRef, file, uploadMetadata);
	const url = await getDownloadURL(storageRef);
	signalStorageUsageUpdated();

	return {
		url,
		name: file.name,
		size: file.size,
		type: file.type,
	};
};
