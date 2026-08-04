export const ACCOUNT_DELETION_BATCH_SIZE = 400;

export const chunkItems = <T>(items: T[], size = ACCOUNT_DELETION_BATCH_SIZE): T[][] => {
	if (!Number.isInteger(size) || size < 1 || size > 500) {
		throw new Error('Firestore write chunks must contain between 1 and 500 operations.');
	}

	const chunks: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}
	return chunks;
};

const normalizeIds = (values: string[]): string[] =>
	Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
		.sort();

export const buildAccountDeletionStoragePrefixes = ({
	userId,
	accountIds,
	propertyIds,
}: {
	userId: string;
	accountIds: string[];
	propertyIds: string[];
}): string[] => {
	const prefixes = [
		`user-profile-images/${userId}/`,
		`feedback-attachments/${userId}/`,
	];

	for (const accountId of normalizeIds(accountIds)) {
		prefixes.push(
			`properties/${accountId}/`,
			`team-member-images/${accountId}/`,
			`team-member-files/${accountId}/`,
		);
	}

	for (const propertyId of normalizeIds(propertyIds)) {
		prefixes.push(
			`device-files/${propertyId}/`,
			`maintenance-files/${propertyId}/`,
		);
	}

	return Array.from(new Set(prefixes)).sort();
};

export const removeIdFromArray = (value: unknown, userId: string): string[] =>
	(Array.isArray(value) ? value : [])
		.map((entry) => String(entry || '').trim())
		.filter((entry) => entry && entry !== userId);

export const mergeAccessRemovalUpdates = (
	existing: { data: Record<string, unknown>; removedUserFields: string[] },
	next: { data: Record<string, unknown>; removedUserFields: string[] },
) => ({
	data: { ...existing.data, ...next.data },
	removedUserFields: Array.from(
		new Set([...existing.removedUserFields, ...next.removedUserFields]),
	),
});
