export const hasReportValue = (value: unknown): boolean => {
	if (value === null || value === undefined) {
		return false;
	}

	if (typeof value === 'string') {
		return value.trim().length > 0;
	}

	if (Array.isArray(value)) {
		return value.some(hasReportValue);
	}

	if (typeof value === 'object') {
		return Object.values(value as Record<string, unknown>).some(hasReportValue);
	}

	return true;
};

export const getNonEmptyReportColumns = (
	data: any[],
	columns: string[],
): string[] => {
	return columns.filter((column) =>
		data.some((row) => hasReportValue(row?.[column])),
	);
};

export const formatPreviewValue = (value: unknown): string => {
	if (!hasReportValue(value)) {
		return '-';
	}

	if (Array.isArray(value)) {
		return value
			.filter(hasReportValue)
			.map((item) =>
				typeof item === 'object' && item !== null
					? JSON.stringify(item)
					: String(item),
			)
			.join(', ');
	}

	if (typeof value === 'object') {
		return JSON.stringify(value);
	}

	return String(value);
};
