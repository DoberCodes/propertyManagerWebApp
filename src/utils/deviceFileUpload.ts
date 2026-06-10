import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_DEVICE_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const buildFileName = (file: File) => {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
};

export const isValidDeviceFile = (file: File): boolean => {
	// Allow common file types for device manuals and documentation
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
	if (file.size > MAX_DEVICE_FILE_BYTES) {
		return false;
	}
	return true;
};

export const uploadDeviceFile = async (
	file: File,
	propertyId: string,
	deviceId?: string,
): Promise<{
	url: string;
	name: string;
	size: number;
	type: string;
	usage?: 'appliance_photo' | 'document';
}> => {
	if (!isValidDeviceFile(file)) {
		throw new Error('Invalid file. Please use a valid file type under 10MB.');
	}

	const fileName = buildFileName(file);
	const folder = deviceId
		? `device-files/${propertyId}/${deviceId}`
		: `device-files/${propertyId}/temp-${Date.now()}`;
	const storageRef = ref(storage, `${folder}/${fileName}`);

	await uploadBytes(storageRef, file, { contentType: file.type });
	const url = await getDownloadURL(storageRef);

	return {
		url,
		name: file.name,
		size: file.size,
		type: file.type,
	};
};
