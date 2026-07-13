import { sanitizeAnalyticsParams } from './analytics';

describe('analytics helpers', () => {
	it('removes empty values and keeps simple GA-safe values', () => {
		expect(
			sanitizeAnalyticsParams({
				empty: '',
				missing: undefined,
				nothing: null,
				route_name: 'dashboard',
				is_team_member: false,
				count: 3,
				bad_number: Number.NaN,
			}),
		).toEqual({
			route_name: 'dashboard',
			is_team_member: false,
			count: 3,
		});
	});

	it('trims and caps string params', () => {
		const longValue = ' a'.repeat(80);

		expect(sanitizeAnalyticsParams({ value: ` ${longValue} ` }).value).toHaveLength(100);
	});
});
