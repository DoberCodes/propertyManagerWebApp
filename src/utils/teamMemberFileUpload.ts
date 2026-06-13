import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { assertStorageQuotaForFiles } from './storageQuota';

const MAX_TEAM_MEMBER_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_TEAM_MEMBER_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_TEAM_MEMBER_FILE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/jpg',
	'image/gif',
	'image/webp',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const buildFileName = (file: File) => {
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
};

export const isValidTeamMemberImageFile = (file: File): boolean => {
	if (!file.type.startsWith('image/')) {
		return false;
	}
	if (file.size > MAX_TEAM_MEMBER_IMAGE_BYTES) {
		return false;
	}
	return true;
};

export const uploadTeamMemberImage = async (
	file: File,
	userId: string,
	memberId?: string,
): Promise<string> => {
	if (!isValidTeamMemberImageFile(file)) {
		throw new Error('Invalid image. Please use an image under 8MB.');
	}
	await assertStorageQuotaForFiles(file, { accountId: userId });

	const fileName = buildFileName(file);
	const folder = memberId
		? `team-member-images/${userId}/${memberId}`
		: `team-member-images/${userId}/uploads`;
	const storageRef = ref(storage, `${folder}/${fileName}`);

	await uploadBytes(storageRef, file, { contentType: file.type });
	return getDownloadURL(storageRef);
};

export const isValidTeamMemberFile = (file: File): boolean => {
	const isAllowedType = ALLOWED_TEAM_MEMBER_FILE_TYPES.some(
		(type) => file.type === type || file.type.startsWith(type),
	);
	if (!isAllowedType) {
		return false;
	}
	if (file.size > MAX_TEAM_MEMBER_FILE_BYTES) {
		return false;
	}
	return true;
};

export const uploadTeamMemberFile = async (
	file: File,
	userId: string,
	memberId?: string,
): Promise<{ url: string; name: string; size: number; type: string }> => {
	if (!isValidTeamMemberFile(file)) {
		throw new Error('Invalid file. Please use a valid file type under 10MB.');
	}
	await assertStorageQuotaForFiles(file, { accountId: userId });

	const fileName = buildFileName(file);
	const folder = memberId
		? `team-member-files/${userId}/${memberId}`
		: `team-member-files/${userId}/uploads`;
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
