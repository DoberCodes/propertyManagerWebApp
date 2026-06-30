import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseStorage';
import { assertStorageQuotaForFiles, resolveStorageAccountId } from './storageQuota';
import { signalStorageUsageUpdated } from './storageUsageEvents';

const MAX_PROPERTY_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

const buildFileName = (file: File) => {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
};

export const isValidPropertyImageFile = (file: File): boolean => {
	if (!file.type.startsWith('image/')) {
		return false;
	}
	if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
		return false;
	}
	return true;
};

export const uploadPropertyImage = async (
	file: File,
	propertyId?: string,
): Promise<string> => {
	if (!isValidPropertyImageFile(file)) {
		throw new Error('Invalid image. Please use an image under 8MB.');
	}
	await assertStorageQuotaForFiles(file, { propertyId });
	const accountId = await resolveStorageAccountId(propertyId);

	const fileName = buildFileName(file);
	const folder = `properties/${accountId}`;
	const storageRef = ref(storage, `${folder}/${fileName}`);

	await uploadBytes(storageRef, file, { contentType: file.type });
	const downloadUrl = await getDownloadURL(storageRef);
	signalStorageUsageUpdated();
	return downloadUrl;
};
