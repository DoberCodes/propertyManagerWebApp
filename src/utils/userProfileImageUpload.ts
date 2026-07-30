import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseStorage';
import { signalStorageUsageUpdated } from './storageUsageEvents';

const MAX_PROFILE_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

const buildFileName = (file: File) => {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
};

export const isValidUserProfileImageFile = (file: File): boolean => {
	if (!file.type.startsWith('image/')) {
		return false;
	}
	if (file.size > MAX_PROFILE_IMAGE_BYTES) {
		return false;
	}
	return true;
};

export const uploadUserProfileImage = async (
	file: File,
	userId: string,
): Promise<string> => {
	if (!isValidUserProfileImageFile(file)) {
		throw new Error('Invalid image. Please use an image under 8MB.');
	}
	const fileName = buildFileName(file);
	const folder = `user-profile-images/${userId}`;
	const storagePath = `${folder}/${fileName}`;
	const storageRef = ref(storage, storagePath);

	await uploadBytes(storageRef, file, { contentType: file.type });
	const downloadUrl = await getDownloadURL(storageRef);
	signalStorageUsageUpdated();
	return downloadUrl;
};
