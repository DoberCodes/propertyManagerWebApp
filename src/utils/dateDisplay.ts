export const parseDisplayDate = (value?: string | Date | null): Date | null => {
	if (!value) return null;
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const text = String(value).trim();
	if (!text) return null;

	const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (dateOnlyMatch) {
		const [, year, month, day] = dateOnlyMatch;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	const parsed = new Date(text);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDisplayDate = (
	value?: string | Date | null,
	options?: Intl.DateTimeFormatOptions,
): string => {
	const parsed = parseDisplayDate(value);
	if (!parsed) return '';
	return parsed.toLocaleDateString(undefined, options);
};

export const getDisplayDateTime = (value?: string | Date | null): number => {
	return parseDisplayDate(value)?.getTime() || 0;
};
