import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { resolveTargetUserId } from '../Redux/API/accountContext';
import {
	getEffectiveSubscriptionPlanId,
	getMaxFilesForPlan,
	getMaxStorageGbForPlan,
} from './subscriptionUtils';

const BYTES_PER_GB = 1024 * 1024 * 1024;
const BYTES_PER_MB = 1024 * 1024;

type FileLike = {
	size?: number;
	fileSize?: number;
	sizeBytes?: number;
	url?: string;
	name?: string;
	fileName?: string;
};

export type StorageUsage = {
	accountId: string;
	planId: string;
	usedBytes: number;
	maxBytes: number;
	fileCount: number;
	maxFiles: number;
	usagePercent: number;
	filePercent: number;
};

const toNumber = (value: unknown) => {
	const numberValue = Number(value);
	return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
};

const getFileSize = (file: FileLike) =>
	toNumber(file?.size) || toNumber(file?.fileSize) || toNumber(file?.sizeBytes);

const getFileKey = (file: FileLike, fallbackKey: string) => {
	const url = String(file?.url || '').trim();
	if (url) return url;
	const name = String(file?.name || file?.fileName || '').trim();
	const size = getFileSize(file);
	return `${name || fallbackKey}:${size}`;
};

const addFile = (
	file: FileLike | undefined,
	seen: Set<string>,
	totals: { bytes: number; count: number },
	fallbackKey: string,
) => {
	if (!file) return;
	const size = getFileSize(file);
	if (size <= 0) return;

	const key = getFileKey(file, fallbackKey);
	if (seen.has(key)) return;

	seen.add(key);
	totals.bytes += size;
	totals.count += 1;
};

const addFiles = (
	files: unknown,
	seen: Set<string>,
	totals: { bytes: number; count: number },
	fallbackPrefix: string,
) => {
	if (!Array.isArray(files)) return;

	files.forEach((file, index) =>
		addFile(file as FileLike, seen, totals, `${fallbackPrefix}-${index}`),
	);
};

const getPlanIdForAccount = async (accountId: string) => {
	const userSnapshot = await getDoc(doc(db, 'users', accountId));
	const userData = userSnapshot.data() || {};
	return getEffectiveSubscriptionPlanId(userData.subscription, 'homeowner');
};

export const resolveStorageAccountId = async (propertyId?: string) => {
	if (propertyId) {
		try {
			const propertySnapshot = await getDoc(doc(db, 'properties', propertyId));
			const propertyData = propertySnapshot.data() || {};
			const accountId = String(propertyData.accountId || '').trim();
			if (accountId) return accountId;
		} catch {
			// Fall back to the signed-in account context below.
		}
	}

	return resolveTargetUserId();
};

export const getStorageUsageForAccount = async (
	accountId?: string,
	planIdOverride?: string,
): Promise<StorageUsage> => {
	const resolvedAccountId = accountId || (await resolveTargetUserId());
	const planId = planIdOverride || (await getPlanIdForAccount(resolvedAccountId));
	const maxFiles = getMaxFilesForPlan(planId);
	const maxStorageGb = getMaxStorageGbForPlan(planId);
	const maxBytes = maxStorageGb > 0 ? maxStorageGb * BYTES_PER_GB : 0;
	const seen = new Set<string>();
	const totals = { bytes: 0, count: 0 };

	const devicesSnapshot = await getDocs(
		query(collection(db, 'devices'), where('accountId', '==', resolvedAccountId)),
	);
	devicesSnapshot.docs.forEach((deviceDoc) => {
		const data = deviceDoc.data() || {};
		addFiles(data.files, seen, totals, `device-${deviceDoc.id}`);
	});

	const propertiesSnapshot = await getDocs(
		query(
			collection(db, 'properties'),
			where('accountId', '==', resolvedAccountId),
		),
	);
	propertiesSnapshot.docs.forEach((propertyDoc) => {
		const data = propertyDoc.data() || {};
		addFiles(data.documents, seen, totals, `property-${propertyDoc.id}`);
	});

	for (const collectionName of ['maintenanceEvents', 'maintenanceHistory']) {
		const snapshot = await getDocs(
			query(
				collection(db, collectionName),
				where('accountId', '==', resolvedAccountId),
			),
		);
		snapshot.docs.forEach((recordDoc) => {
			const data = recordDoc.data() || {};
			addFiles(data.attachments, seen, totals, `${collectionName}-${recordDoc.id}`);
			addFile(
				data.completionFile as FileLike | undefined,
				seen,
				totals,
				`${collectionName}-${recordDoc.id}-completion`,
			);
			addFile(
				data.completionFileData as FileLike | undefined,
				seen,
				totals,
				`${collectionName}-${recordDoc.id}-completion-data`,
			);
		});
	}

	const teamMembersSnapshot = await getDocs(
		query(
			collection(db, 'teamMembers'),
			where('accountId', '==', resolvedAccountId),
		),
	);
	teamMembersSnapshot.docs.forEach((memberDoc) => {
		const data = memberDoc.data() || {};
		addFiles(data.files, seen, totals, `team-member-${memberDoc.id}`);
	});

	const usagePercent = maxBytes > 0 ? (totals.bytes / maxBytes) * 100 : 0;
	const filePercent = maxFiles > 0 ? (totals.count / maxFiles) * 100 : 0;

	return {
		accountId: resolvedAccountId,
		planId,
		usedBytes: totals.bytes,
		maxBytes,
		fileCount: totals.count,
		maxFiles,
		usagePercent,
		filePercent,
	};
};

export const formatStorageBytes = (bytes: number) => {
	if (bytes >= BYTES_PER_GB) {
		return `${(bytes / BYTES_PER_GB).toFixed(bytes >= 10 * BYTES_PER_GB ? 0 : 1)} GB`;
	}
	if (bytes >= BYTES_PER_MB) {
		return `${(bytes / BYTES_PER_MB).toFixed(bytes >= 10 * BYTES_PER_MB ? 0 : 1)} MB`;
	}
	if (bytes > 0) {
		return `${Math.ceil(bytes / 1024)} KB`;
	}
	return '0 MB';
};

export const assertStorageQuotaForFiles = async (
	files: File | File[],
	options: { propertyId?: string; accountId?: string; planId?: string } = {},
) => {
	const fileList = Array.isArray(files) ? files : [files];
	const incomingBytes = fileList.reduce((sum, file) => sum + file.size, 0);
	const incomingCount = fileList.length;
	const accountId =
		options.accountId || (await resolveStorageAccountId(options.propertyId));
	const usage = await getStorageUsageForAccount(accountId, options.planId);

	if (usage.maxFiles <= 0 || usage.maxBytes <= 0) {
		throw new Error('File storage is not included with this account plan.');
	}

	if (usage.fileCount + incomingCount > usage.maxFiles) {
		throw new Error(
			`Storage file limit reached. This plan allows ${usage.maxFiles} files.`,
		);
	}

	if (usage.usedBytes + incomingBytes > usage.maxBytes) {
		throw new Error(
			`Storage limit reached. This plan allows ${formatStorageBytes(
				usage.maxBytes,
			)} of files and photos.`,
		);
	}

	return usage;
};
