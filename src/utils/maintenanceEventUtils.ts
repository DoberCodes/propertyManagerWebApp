export const getMaintenanceEventDate = (record: any): string | undefined =>
	record?.completionDate ||
	record?.approvedAt ||
	record?.date ||
	record?.createdAt ||
	record?.updatedAt;

export const getMaintenanceEventTitle = (record: any): string =>
	String(
		record?.title ||
			record?.taskTitle ||
			record?.description ||
			'Continuity event',
	).trim();

export const isContinuityEvent = (record: any): boolean => {
	if (!record) return false;
	if (record.eventType) return true;

	const status = String(record.status || '').trim().toLowerCase();
	if (status && !['completed', 'approved'].includes(status)) {
		return false;
	}

	const hasMeaningfulDate = Boolean(getMaintenanceEventDate(record));
	const hasMeaningfulContent = Boolean(
		String(
			record?.title ||
				record?.taskTitle ||
				record?.description ||
				record?.completionNotes ||
				'',
		).trim(),
	);

	return hasMeaningfulDate && hasMeaningfulContent;
};