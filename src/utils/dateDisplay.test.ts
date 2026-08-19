import { formatRelativeCalendarTime } from './dateDisplay';

describe('formatRelativeCalendarTime', () => {
	const now = new Date('2026-08-19T12:00:00.000Z');

	it('uses singular month language', () => {
		expect(formatRelativeCalendarTime('2026-07-20T12:00:00.000Z', now)).toBe(
			'1 month ago',
		);
	});

	it('uses plural month language', () => {
		expect(formatRelativeCalendarTime('2026-06-20T12:00:00.000Z', now)).toBe(
			'2 months ago',
		);
	});

	it('formats future dates without awkward plurals', () => {
		expect(formatRelativeCalendarTime('2026-09-18T12:00:00.000Z', now)).toBe(
			'in 1 month',
		);
	});
});
