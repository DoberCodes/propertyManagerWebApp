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

export const formatRelativeCalendarTime = (
	value?: string | Date | null,
	now = new Date(),
): string => {
	const date = parseDisplayDate(value);
	if (!date) return 'recently';

	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.round(Math.abs(diffMs) / 86400000);
	const direction = diffMs >= 0 ? 'past' : 'future';

	if (diffDays === 0) return direction === 'past' ? 'today' : 'later today';
	if (diffDays === 1) return direction === 'past' ? 'yesterday' : 'tomorrow';
	if (diffDays < 7) {
		return direction === 'past' ? `${diffDays} days ago` : `in ${diffDays} days`;
	}
	if (diffDays < 30) {
		const weeks = Math.max(1, Math.round(diffDays / 7));
		const label = `${weeks} week${weeks === 1 ? '' : 's'}`;
		return direction === 'past' ? `${label} ago` : `in ${label}`;
	}

	const months = Math.max(1, Math.round(diffDays / 30));
	const label = `${months} month${months === 1 ? '' : 's'}`;
	return direction === 'past' ? `${label} ago` : `in ${label}`;
};
